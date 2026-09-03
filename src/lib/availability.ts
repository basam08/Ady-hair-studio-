import { salon, type WeekDay } from "@/config/salon";
import { prisma } from "@/lib/db";
import {
  formatHhMm,
  parseHhMm,
  toLocalParts,
  zonedWallTimeToUtc,
} from "@/lib/time";

export interface Slot {
  /** Hora local "HH:MM" */
  time: string;
  /** Instante de inicio en ISO/UTC */
  startsAt: string;
  /** Instante de fin en ISO/UTC */
  endsAt: string;
}

interface Interval {
  start: number; // epoch ms
  end: number;
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Calcula los huecos libres para un servicio en una fecha local concreta.
 *
 * Reglas aplicadas:
 *  - Respeta los bloques de horario del día (incluidas pausas).
 *  - Excluye festivos y días cerrados (salon.closedDates).
 *  - Excluye periodos bloqueados (tabla Blackout).
 *  - Un hueco es válido si al menos una silla queda libre, dejando el margen
 *    de limpieza (turnaroundMin) antes y después.
 *  - Respeta la antelación mínima (minLeadHours) y máxima (maxLeadDays).
 */
export async function getAvailableSlots(
  dateKey: string,
  durationMin: number,
  now: Date = new Date(),
): Promise<Slot[]> {
  const [year, month, day] = dateKey.split("-").map(Number);

  // Fuera de la ventana de reserva permitida.
  const maxDate = new Date(now.getTime() + salon.maxLeadDays * 86_400_000);
  const dayStartUtc = zonedWallTimeToUtc(salon.timeZone, year, month, day, 0, 0);
  if (dayStartUtc.getTime() > maxDate.getTime() + 86_400_000) return [];

  // Día cerrado por festivo / vacaciones.
  if (salon.closedDates.includes(dateKey)) return [];

  const weekday = toLocalParts(salon.timeZone, dayStartUtc).weekday as WeekDay;
  const blocks = salon.hours[weekday] ?? [];
  if (blocks.length === 0) return [];

  const earliest = now.getTime() + salon.minLeadHours * 3_600_000;

  // Reservas activas del día y periodos bloqueados que solapan el día.
  const windowStart = zonedWallTimeToUtc(salon.timeZone, year, month, day, 0, 0);
  const windowEnd = new Date(windowStart.getTime() + 86_400_000);

  const [bookings, blackouts] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startsAt: { lt: windowEnd },
        endsAt: { gt: windowStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.blackout.findMany({
      where: { startsAt: { lt: windowEnd }, endsAt: { gt: windowStart } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const bookingIntervals: Interval[] = bookings.map((b) => ({
    start: b.startsAt.getTime(),
    end: b.endsAt.getTime(),
  }));
  const blackoutIntervals: Interval[] = blackouts.map((b) => ({
    start: b.startsAt.getTime(),
    end: b.endsAt.getTime(),
  }));

  const turnaround = salon.turnaroundMin * 60_000;
  const step = salon.slotStepMin;
  const slots: Slot[] = [];

  for (const block of blocks) {
    const openMin = parseHhMm(block.open);
    const closeMin = parseHhMm(block.close);

    for (let m = openMin; m + durationMin <= closeMin; m += step) {
      const startUtc = zonedWallTimeToUtc(
        salon.timeZone,
        year,
        month,
        day,
        Math.floor(m / 60),
        m % 60,
      );
      const start = startUtc.getTime();
      const end = start + durationMin * 60_000;

      if (start < earliest) continue;

      // Bloqueos manuales: el hueco no puede solapar en absoluto.
      if (blackoutIntervals.some((iv) => overlaps({ start, end }, iv))) continue;

      // Sillas ocupadas: cuenta reservas que solapan el hueco + margen.
      const padded: Interval = {
        start: start - turnaround,
        end: end + turnaround,
      };
      const busyChairs = bookingIntervals.filter((iv) =>
        overlaps(padded, iv),
      ).length;
      if (busyChairs >= salon.chairs) continue;

      slots.push({
        time: formatHhMm(m),
        startsAt: startUtc.toISOString(),
        endsAt: new Date(end).toISOString(),
      });
    }
  }

  return slots;
}

/**
 * Comprueba (de nuevo, en el servidor) que un hueco concreto sigue libre y
 * devuelve el número de silla asignable. Se usa dentro de la transacción de
 * creación de reserva para evitar dobles reservas por condición de carrera.
 */
export async function findFreeChair(
  tx: {
    booking: {
      findMany: (args: unknown) => Promise<{ startsAt: Date; endsAt: Date; chair: number }[]>;
    };
    blackout: {
      findMany: (args: unknown) => Promise<{ startsAt: Date; endsAt: Date }[]>;
    };
  },
  startsAt: Date,
  endsAt: Date,
): Promise<number | null> {
  const turnaround = salon.turnaroundMin * 60_000;
  const paddedStart = new Date(startsAt.getTime() - turnaround);
  const paddedEnd = new Date(endsAt.getTime() + turnaround);

  const blackouts = await tx.blackout.findMany({
    where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { startsAt: true, endsAt: true },
  } as never);
  if (blackouts.length > 0) return null;

  const conflicts = await tx.booking.findMany({
    where: {
      status: "CONFIRMED",
      startsAt: { lt: paddedEnd },
      endsAt: { gt: paddedStart },
    },
    select: { startsAt: true, endsAt: true, chair: true },
  } as never);

  const takenChairs = new Set(conflicts.map((c) => c.chair));
  for (let chair = 1; chair <= salon.chairs; chair++) {
    if (!takenChairs.has(chair)) return chair;
  }
  return null;
}
