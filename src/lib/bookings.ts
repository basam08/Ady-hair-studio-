import "server-only";
import { randomBytes } from "node:crypto";
import type { Booking } from "@prisma/client";
import { salon } from "@/config/salon";
import { prisma } from "@/lib/db";
import { isStylistSlotFree, isPooledSlotFree } from "@/lib/availability";
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
      | "SERVICE_NOT_BOOKABLE"
      | "STYLIST_NOT_FOUND"
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
  stylistSlug: string;
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
  if (opts.source === "web" && !service.bookableOnline) {
    throw new BookingError(
      "SERVICE_NOT_BOOKABLE",
      "Este servicio no se puede reservar online, escríbenos por WhatsApp",
    );
  }

  const stylist = await prisma.stylist.findUnique({
    where: { slug: input.stylistSlug },
  });
  if (!stylist || !stylist.active) {
    throw new BookingError("STYLIST_NOT_FOUND", "Peluquero no disponible");
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
    const free = await isStylistSlotFree(tx as never, stylist.id, startsAt, endsAt);
    if (!free) {
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
        stylistId: stylist.id,
        startsAt,
        endsAt,
        chair: 1,
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
    // Se mantiene el mismo peluquero; se comprueba el hueco excluyendo la
    // reserva actual a sí misma.
    const free = existing.stylistId
      ? await isStylistSlotFree(
          tx as never,
          existing.stylistId,
          startsAt,
          endsAt,
          existing.id,
        )
      : await isPooledSlotFree(tx as never, startsAt, endsAt, existing.id);
    if (!free) {
      throw new BookingError("SLOT_TAKEN", "Ese hueco ya no está disponible");
    }
    return tx.booking.update({
      where: { id: existing.id },
      data: { startsAt, endsAt },
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

