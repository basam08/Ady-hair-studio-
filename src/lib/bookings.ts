import "server-only";
import { randomBytes } from "node:crypto";
import type { Booking } from "@prisma/client";
import { salon, canStylistPerform, stylistColorId } from "@/config/salon";
import { prisma } from "@/lib/db";
import {
  isStylistSlotFree,
  isPooledSlotFree,
  isCalendarSlotFree,
} from "@/lib/availability";
import {
  zonedWallTimeToUtc,
  formatDateInZone,
  formatTimeInZone,
} from "@/lib/time";
import { normalizePhone } from "@/lib/validation";
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
  notifyBookingUpdated,
} from "@/lib/notifications";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  calendarIdForStylist,
} from "@/lib/integrations/google-calendar";
import { appendBookingRow } from "@/lib/integrations/google-sheets";

export class BookingError extends Error {
  constructor(
    public code:
      | "SERVICE_NOT_FOUND"
      | "SERVICE_NOT_BOOKABLE"
      | "STYLIST_NOT_FOUND"
      | "STYLIST_CANNOT_PERFORM"
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
  extraSlugs?: string[];
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

  // "extraSlugs" cubre tanto extras de verdad (isExtra, p. ej. Planchar)
  // como otros servicios completos añadidos a la misma reserva (un
  // cliente puede reservar más de un servicio de una vez). Se exige
  // bookableOnline para que nadie cuele un servicio de solo-WhatsApp
  // (mechas, etc.) por esta vía.
  const extraSlugs = [...new Set(input.extraSlugs ?? [])].filter(
    (slug) => slug !== input.serviceSlug,
  );
  const extras =
    extraSlugs.length > 0
      ? await prisma.service.findMany({
          where: { slug: { in: extraSlugs }, active: true, bookableOnline: true },
        })
      : [];
  if (extras.length !== extraSlugs.length) {
    throw new BookingError("SERVICE_NOT_FOUND", "Extra no disponible");
  }

  if (opts.source === "web") {
    const allChosen = [service, ...extras];
    const cannotDo = allChosen.find((s) => !canStylistPerform(stylist.slug, s));
    if (cannotDo) {
      throw new BookingError(
        "STYLIST_CANNOT_PERFORM",
        `${stylist.name} no hace "${cannotDo.name}"`,
      );
    }
  }

  const totalPriceCents =
    service.priceCents + extras.reduce((sum, e) => sum + e.priceCents, 0);
  const totalDurationMin =
    service.durationMin + extras.reduce((sum, e) => sum + e.durationMin, 0);
  const combinedName = [service.name, ...extras.map((e) => e.name)].join(" + ");

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
  const endsAt = new Date(startsAt.getTime() + totalDurationMin * 60_000);

  if (opts.source === "web") {
    const minLead = Date.now() + salon.minLeadHours * 3_600_000;
    if (startsAt.getTime() < minLead) {
      throw new BookingError(
        "TOO_SOON",
        `Reserva con al menos ${salon.minLeadHours} h de antelación`,
      );
    }
  }

  if (!(await isCalendarSlotFree(stylist.slug, startsAt, endsAt))) {
    throw new BookingError(
      "SLOT_TAKEN",
      "Ese hueco ya no está disponible (ocupado en el calendario)",
    );
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
        serviceName: combinedName,
        priceCents: totalPriceCents,
        durationMin: totalDurationMin,
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
  const fullWithStylist = { ...full, stylist: { name: stylist.name } };

  const eventId = await createCalendarEvent(calendarIdForStylist(stylist.slug), {
    summary: `${full.serviceName} · ${full.client.name} · ${stylist.role}: ${stylist.name}`,
    description: `${stylist.role}: ${stylist.name}\nTel: ${full.client.phone}\n${full.clientNote ?? ""}`,
    startIso: full.startsAt.toISOString(),
    endIso: full.endsAt.toISOString(),
    timeZone: salon.timeZone,
    colorId: stylistColorId(stylist.slug),
  });
  if (eventId) {
    await prisma.booking.update({
      where: { id: full.id },
      data: { googleEventId: eventId },
    });
  }

  await notifyBookingConfirmed(fullWithStylist);
  await appendBookingRow([
    new Date().toLocaleString("es-ES", { timeZone: salon.timeZone }),
    full.client.name,
    full.client.phone,
    full.serviceName,
    stylist.name,
    input.date,
    input.time,
    (full.priceCents / 100).toFixed(2) + " €",
    "Confirmada",
    full.clientNote ?? "",
  ]);
  return booking;
}

export async function cancelBookingByToken(token: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { client: true, stylist: { select: { name: true, slug: true } } },
  });
  if (!booking) throw new BookingError("NOT_FOUND", "Reserva no encontrada");
  if (booking.status === "CANCELLED") {
    throw new BookingError("ALREADY_CANCELLED", "La reserva ya estaba cancelada");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });
  if (booking.googleEventId) {
    await deleteCalendarEvent(
      calendarIdForStylist(booking.stylist?.slug ?? null),
      booking.googleEventId,
    );
  }
  await notifyBookingCancelled(booking);
}

interface BookingDraft {
  serviceId: string;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  stylistId: string | null;
  stylistSlug: string | null;
  clientNote: string | null;
  contact: { name: string; phone: string; email: string | null } | null;
}

type BookingForSave = Booking & {
  client: { name: string; email: string | null; phone: string };
  stylist: { name: string; role: string; slug: string } | null;
};

async function saveBookingChanges(
  existing: BookingForSave,
  draft: BookingDraft,
  date: string,
  time: string,
  opts: { enforceLead: boolean },
): Promise<Booking> {
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
  const endsAt = new Date(startsAt.getTime() + draft.durationMin * 60_000);

  if (opts.enforceLead) {
    const minLead = Date.now() + salon.minLeadHours * 3_600_000;
    if (startsAt.getTime() < minLead) {
      throw new BookingError("TOO_SOON", "Elige un hueco con más antelación");
    }
  }

  if (draft.stylistSlug) {
    const calendarFree = await isCalendarSlotFree(
      draft.stylistSlug,
      startsAt,
      endsAt,
      existing.googleEventId,
    );
    if (!calendarFree) {
      throw new BookingError(
        "SLOT_TAKEN",
        "Ese hueco ya no está disponible (ocupado en el calendario)",
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Se comprueba el hueco excluyendo la reserva actual a sí misma.
    const free = draft.stylistId
      ? await isStylistSlotFree(
          tx as never,
          draft.stylistId,
          startsAt,
          endsAt,
          existing.id,
        )
      : await isPooledSlotFree(tx as never, startsAt, endsAt, existing.id);
    if (!free) {
      throw new BookingError("SLOT_TAKEN", "Ese hueco ya no está disponible");
    }

    let clientId = existing.clientId;
    if (draft.contact) {
      const client = await tx.client.upsert({
        where: { phone: draft.contact.phone },
        create: {
          name: draft.contact.name,
          phone: draft.contact.phone,
          email: draft.contact.email,
        },
        update: {
          name: draft.contact.name,
          ...(draft.contact.email ? { email: draft.contact.email } : {}),
        },
      });
      clientId = client.id;
    }

    return tx.booking.update({
      where: { id: existing.id },
      data: {
        clientId,
        serviceId: draft.serviceId,
        serviceName: draft.serviceName,
        priceCents: draft.priceCents,
        durationMin: draft.durationMin,
        stylistId: draft.stylistId,
        clientNote: draft.clientNote,
        startsAt,
        endsAt,
      },
      include: { client: true, stylist: { select: { name: true, role: true } } },
    });
  });

  if (existing.googleEventId) {
    await deleteCalendarEvent(
      calendarIdForStylist(existing.stylist?.slug ?? null),
      existing.googleEventId,
    );
  }
  const stylistLabel = updated.stylist
    ? `${updated.stylist.role}: ${updated.stylist.name}`
    : "Sin asignar";
  const eventId = await createCalendarEvent(calendarIdForStylist(draft.stylistSlug), {
    summary: `${updated.serviceName} · ${updated.client.name} · ${stylistLabel}`,
    description: `${stylistLabel}\nTel: ${updated.client.phone}`,
    startIso: startsAt.toISOString(),
    endIso: endsAt.toISOString(),
    timeZone: salon.timeZone,
    colorId: draft.stylistSlug ? stylistColorId(draft.stylistSlug) : undefined,
  });
  const final = await prisma.booking.update({
    where: { id: existing.id },
    data: { googleEventId: eventId },
    include: { client: true, stylist: { select: { name: true, role: true } } },
  });

  const dateChanged = existing.startsAt.getTime() !== startsAt.getTime();
  const serviceOrStylistChanged =
    existing.serviceId !== draft.serviceId || existing.stylistId !== draft.stylistId;
  if (dateChanged || serviceOrStylistChanged) {
    await notifyBookingUpdated(
      final,
      dateChanged
        ? {
            fechaAnterior: formatDateInZone(salon.timeZone, existing.startsAt),
            horaAnterior: formatTimeInZone(salon.timeZone, existing.startsAt),
          }
        : undefined,
    );
  }
  return final;
}

export async function rescheduleBookingByToken(
  token: string,
  date: string,
  time: string,
): Promise<Booking> {
  const existing = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { client: true, stylist: { select: { name: true, role: true, slug: true } } },
  });
  if (!existing) throw new BookingError("NOT_FOUND", "Reserva no encontrada");

  return saveBookingChanges(
    existing,
    {
      serviceId: existing.serviceId,
      serviceName: existing.serviceName,
      priceCents: existing.priceCents,
      durationMin: existing.durationMin,
      stylistId: existing.stylistId,
      stylistSlug: existing.stylist?.slug ?? null,
      clientNote: existing.clientNote,
      contact: null,
    },
    date,
    time,
    { enforceLead: true },
  );
}

export interface AdminBookingEdit {
  serviceSlug: string;
  stylistSlug: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

export async function updateBookingByAdmin(
  id: string,
  input: AdminBookingEdit,
): Promise<Booking> {
  const existing = await prisma.booking.findUnique({
    where: { id },
    include: { client: true, stylist: { select: { name: true, role: true, slug: true } } },
  });
  if (!existing) throw new BookingError("NOT_FOUND", "Reserva no encontrada");

  const service = await prisma.service.findUnique({
    where: { slug: input.serviceSlug },
  });
  if (!service || !service.active) {
    throw new BookingError("SERVICE_NOT_FOUND", "Servicio no disponible");
  }
  const stylist = await prisma.stylist.findUnique({
    where: { slug: input.stylistSlug },
  });
  if (!stylist || !stylist.active) {
    throw new BookingError("STYLIST_NOT_FOUND", "Peluquero no disponible");
  }

  return saveBookingChanges(
    existing,
    {
      serviceId: service.id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMin: service.durationMin,
      stylistId: stylist.id,
      stylistSlug: stylist.slug,
      clientNote: input.note?.trim() || null,
      contact: {
        name: input.name.trim(),
        phone: normalizePhone(input.phone),
        email: input.email?.trim() || null,
      },
    },
    input.date,
    input.time,
    { enforceLead: false },
  );
}
