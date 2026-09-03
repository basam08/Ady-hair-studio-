import "server-only";
import { randomBytes } from "node:crypto";
import type { Booking } from "@prisma/client";
import { salon } from "@/config/salon";
import { prisma } from "@/lib/db";
import { findFreeChair } from "@/lib/availability";
import { zonedWallTimeToUtc } from "@/lib/time";
import { normalizePhone } from "@/lib/validation";
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
} from "@/lib/notifications";
import {
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/integrations/google-calendar";

export class BookingError extends Error {
  constructor(
    public code:
      | "SERVICE_NOT_FOUND"
      | "SLOT_TAKEN"
      | "OUT_OF_HOURS"
      | "TOO_SOON"
      | "NOT_FOUND"
      | "ALREADY_CANCELLED",
    message: string,
  ) {
    super(message);
  }
}

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

interface CreateInput {
  serviceSlug: string;
  date: string; // YYYY-MM-DD (hora local del negocio)
  time: string; // HH:MM
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

export async function createBooking(
  input: CreateInput,
  opts: { source: "web" | "admin" } = { source: "web" },
): Promise<Booking> {
  const service = await prisma.service.findUnique({
    where: { slug: input.serviceSlug },
  });
  if (!service || !service.active) {
    throw new BookingError("SERVICE_NOT_FOUND", "Servicio no disponible");
  }

  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time.split(":").map(Number);
  const startsAt = zonedWallTimeToUtc(
    salon.timeZone,
    year,
    month,
    day,
    hour,
    minute,
  );
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);

  if (opts.source === "web") {
    const minLead = Date.now() + salon.minLeadHours * 3_600_000;
    if (startsAt.getTime() < minLead) {
      throw new BookingError(
        "TOO_SOON",
        `Reserva con al menos ${salon.minLeadHours} h de antelación`,
      );
    }
  }

  const phone = normalizePhone(input.phone);
  const email = input.email?.trim() || null;

  const booking = await prisma.$transaction(async (tx) => {
    const chair = await findFreeChair(tx as never, startsAt, endsAt);
    if (chair === null) {
      throw new BookingError("SLOT_TAKEN", "Ese hueco ya no está disponible");
    }

    const client = await tx.client.upsert({
      where: { phone },
      create: { name: input.name.trim(), phone, email },
      update: {
        name: input.name.trim(),
        ...(email ? { email } : {}),
      },
    });

    return tx.booking.create({
      data: {
        manageToken: newToken(),
        status: "CONFIRMED",
        clientId: client.id,
        serviceId: service.id,
        serviceName: service.name,
        priceCents: service.priceCents,
        durationMin: service.durationMin,
        startsAt,
        endsAt,
        chair,
        clientNote: input.note?.trim() || null,
      },
      include: { client: true },
    });
  });

  // Efectos secundarios fuera de la transacción (no deben bloquear la reserva).
  const full = booking as Booking & {
    client: { name: string; email: string | null; phone: string };
  };

  const eventId = await createCalendarEvent({
    summary: `${full.serviceName} · ${full.client.name}`,
    description: `Tel: ${full.client.phone}\n${full.clientNote ?? ""}`,
    startIso: full.startsAt.toISOString(),
    endIso: full.endsAt.toISOString(),
    timeZone: salon.timeZone,
  });
  if (eventId) {
    await prisma.booking.update({
      where: { id: full.id },
      data: { googleEventId: eventId },
    });
  }

  await notifyBookingConfirmed(full);
  return booking;
}

export async function cancelBookingByToken(token: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { client: true },
  });
  if (!booking) throw new BookingError("NOT_FOUND", "Reserva no encontrada");
  if (booking.status === "CANCELLED") {
    throw new BookingError("ALREADY_CANCELLED", "La reserva ya estaba cancelada");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
  if (booking.googleEventId) await deleteCalendarEvent(booking.googleEventId);
  await notifyBookingCancelled(booking);
}

export async function rescheduleBookingByToken(
  token: string,
  date: string,
  time: string,
): Promise<Booking> {
  const existing = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { client: true, service: true },
  });
  if (!existing) throw new BookingError("NOT_FOUND", "Reserva no encontrada");
  if (existing.status === "CANCELLED") {
    throw new BookingError("ALREADY_CANCELLED", "La reserva está cancelada");
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const startsAt = zonedWallTimeToUtc(
    salon.timeZone,
    year,
    month,
    day,
    hour,
    minute,
  );
  const endsAt = new Date(startsAt.getTime() + existing.durationMin * 60_000);

  const minLead = Date.now() + salon.minLeadHours * 3_600_000;
  if (startsAt.getTime() < minLead) {
    throw new BookingError("TOO_SOON", "Elige un hueco con más antelación");
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Libera temporalmente marcando la reserva como movida: se comprueba el
    // hueco excluyéndola a sí misma.
    const chair = await findFreeChairExcluding(
      tx as never,
      startsAt,
      endsAt,
      existing.id,
    );
    if (chair === null) {
      throw new BookingError("SLOT_TAKEN", "Ese hueco ya no está disponible");
    }
    return tx.booking.update({
      where: { id: existing.id },
      data: { startsAt, endsAt, chair },
      include: { client: true },
    });
  });

  if (existing.googleEventId) await deleteCalendarEvent(existing.googleEventId);
  const eventId = await createCalendarEvent({
    summary: `${existing.serviceName} · ${existing.client.name}`,
    description: `Tel: ${existing.client.phone}`,
    startIso: startsAt.toISOString(),
    endIso: endsAt.toISOString(),
    timeZone: salon.timeZone,
  });
  await prisma.booking.update({
    where: { id: existing.id },
    data: { googleEventId: eventId },
  });

  await notifyBookingConfirmed(updated as never);
  return updated;
}

async function findFreeChairExcluding(
  tx: {
    booking: {
      findMany: (args: unknown) => Promise<
        { startsAt: Date; endsAt: Date; chair: number; id: string }[]
      >;
    };
    blackout: {
      findMany: (args: unknown) => Promise<{ startsAt: Date; endsAt: Date }[]>;
    };
  },
  startsAt: Date,
  endsAt: Date,
  excludeId: string,
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
      id: { not: excludeId },
      startsAt: { lt: paddedEnd },
      endsAt: { gt: paddedStart },
    },
    select: { startsAt: true, endsAt: true, chair: true, id: true },
  } as never);

  const taken = new Set(conflicts.map((c) => c.chair));
  for (let chair = 1; chair <= salon.chairs; chair++) {
    if (!taken.has(chair)) return chair;
  }
  return null;
}
