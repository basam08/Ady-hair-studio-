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
 * Calcula los huecos libres para un servicio en una fecha local concreta,
 * para un peluquero concreto.
 *
 * Reglas aplicadas:
 *  - Respeta los bloques de horario del día (incluidas pausas).
 *  - Excluye festivos y días cerrados (salon.closedDates).
 *  - Excluye periodos bloqueados (tabla Blackout), que afectan a todo el salón.
 *  - Un peluquero solo puede atender a un cliente a la vez: el hueco no
 *    puede solapar con otra reserva suya (más el margen de turnaroundMin).
 *  - Las reservas antiguas sin peluquero asignado cuentan como ocupación
 *    genérica del salón (reparto entre el nº de peluqueros activos), para
 *    no dejarlas huérfanas tras activar los peluqueros nombrados.
 *  - Respeta la antelación mínima (minLeadHours) y máxima (maxLeadDays).
 */
export async function getAvailableSlots(
  dateKey: string,
  durationMin: number,
  stylistId: string | null,
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

  const [bookings, blackouts, activeStylists] = await Promise.all([
    prisma.booking.findMany({
      where: {
        deletedAt: null,
        status: "CONFIRMED",
        ...(stylistId ? { stylistId } : {}),
        startsAt: { lt: windowEnd },
        endsAt: { gt: windowStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.blackout.findMany({
      where: { startsAt: { lt: windowEnd }, endsAt: { gt: windowStart } },
      select: { startsAt: true, endsAt: true },
    }),
    stylistId ? Promise.resolve(0) : prisma.stylist.count({ where: { active: true } }),
  ]);

  // Capacidad: 1 si reservamos para un peluquero concreto; si no se indica
  // peluquero (reservas heredadas), se reparte entre los peluqueros activos.
  const capacity = stylistId ? 1 : Math.max(1, activeStylists);

  const bookingIntervals: Interval[] = bookings.map((b) => ({
    start: b.startsAt.getTime(),
    end: b.endsAt.getTime(),
  }));
  const blackoutIntervals: Interval[] = blackouts.map((b) => ({
    start: b.startsAt.getTime(),
    end: b.endsAt.getTime(),
  }));

  const turnaround = salon.turnaroundMin * 60_000;
  // Cada servicio usa su propia duración como intervalo entre huecos (un
  // corte de 30 min ofrece hora en punto y media; uno de 60, hora en punto).
  const step = durationMin;
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

      const padded: Interval = {
        start: start - turnaround,
        end: end + turnaround,
      };
      const busy = bookingIntervals.filter((iv) => overlaps(padded, iv)).length;
      if (busy >= capacity) continue;

      slots.push({
        time: formatHhMm(m),
        startsAt: startUtc.toISOString(),
        endsAt: new Date(end).toISOString(),
      });
    }
  }

  return slots;
}

type TxClient = {
  booking: {
    findMany: (args: unknown) => Promise<{ startsAt: Date; endsAt: Date }[]>;
  };
  blackout: {
    findMany: (args: unknown) => Promise<{ startsAt: Date; endsAt: Date }[]>;
  };
};

/**
 * Comprueba (de nuevo, en el servidor) que un hueco concreto sigue libre
 * para un peluquero dado. Se usa dentro de la transacción de creación /
 * reprogramación de reserva para evitar dobles reservas por condición de
 * carrera.
 */
export async function isStylistSlotFree(
  tx: TxClient,
  stylistId: string,
  startsAt: Date,
  endsAt: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const turnaround = salon.turnaroundMin * 60_000;
  const paddedStart = new Date(startsAt.getTime() - turnaround);
  const paddedEnd = new Date(endsAt.getTime() + turnaround);

  const blackouts = await tx.blackout.findMany({
    where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { startsAt: true, endsAt: true },
  } as never);
  if (blackouts.length > 0) return false;

  const conflicts = await tx.booking.findMany({
    where: {
      deletedAt: null,
      status: "CONFIRMED",
      stylistId,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startsAt: { lt: paddedEnd },
      endsAt: { gt: paddedStart },
    },
    select: { startsAt: true, endsAt: true },
  } as never);

  return conflicts.length === 0;
}

type TxClientWithCount = TxClient & {
  stylist: { count: (args: unknown) => Promise<number> };
  booking: TxClient["booking"];
};

/**
 * Comprueba disponibilidad para reservas heredadas sin peluquero asignado:
 * se tratan como ocupación genérica repartida entre los peluqueros activos.
 */
export async function isPooledSlotFree(
  tx: TxClientWithCount,
  startsAt: Date,
  endsAt: Date,
  excludeBookingId: string,
): Promise<boolean> {
  const turnaround = salon.turnaroundMin * 60_000;
  const paddedStart = new Date(startsAt.getTime() - turnaround);
  const paddedEnd = new Date(endsAt.getTime() + turnaround);

  const blackouts = await tx.blackout.findMany({
    where: { startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { startsAt: true, endsAt: true },
  } as never);
  if (blackouts.length > 0) return false;

  const [conflicts, activeStylists] = await Promise.all([
    tx.booking.findMany({
      where: {
        deletedAt: null,
        status: "CONFIRMED",
        id: { not: excludeBookingId },
        startsAt: { lt: paddedEnd },
        endsAt: { gt: paddedStart },
      },
      select: { startsAt: true, endsAt: true },
    } as never),
    tx.stylist.count({ where: { active: true } } as never),
  ]);

  return conflicts.length < Math.max(1, activeStylists);
}
