import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { bookingStatusSchema, adminBookingCreateSchema } from "@/lib/validation";
import { deleteCalendarEvent, calendarIdForStylist } from "@/lib/integrations/google-calendar";
import { notifyBookingCancelled } from "@/lib/notifications";
import { updateBookingByAdmin, BookingError } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export const PATCH = withAdmin(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("BAD_JSON", "Cuerpo no válido", 400);
    }
    const parsed = bookingStatusSchema.safeParse(body);
    if (!parsed.success) return jsonError("VALIDATION_ERROR", "Estado no válido", 422);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { client: true, stylist: { select: { slug: true } } },
    });
    if (!booking) return jsonError("NOT_FOUND", "Reserva no encontrada", 404);

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { client: true },
    });

    if (parsed.data.status === "CANCELLED" && booking.status !== "CANCELLED") {
      if (booking.googleEventId) {
        await deleteCalendarEvent(
          calendarIdForStylist(booking.stylist?.slug ?? null),
          booking.googleEventId,
        );
      }
      await notifyBookingCancelled(updated);
    }

    return NextResponse.json({ ok: true, status: updated.status });
  },
);

export const PUT = withAdmin(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("BAD_JSON", "Cuerpo no válido", 400);
    }
    const parsed = adminBookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Revisa los campos", details: parsed.error.flatten() } },
        { status: 422 },
      );
    }

    try {
      const updated = await updateBookingByAdmin(id, {
        ...parsed.data,
        email: parsed.data.email || undefined,
        note: parsed.data.note || undefined,
      });
      return NextResponse.json({ ok: true, startsAt: updated.startsAt.toISOString() });
    } catch (err) {
      if (err instanceof BookingError) {
        const status =
          err.code === "SLOT_TAKEN"
            ? 409
            : err.code === "NOT_FOUND" ||
                err.code === "SERVICE_NOT_FOUND" ||
                err.code === "STYLIST_NOT_FOUND"
              ? 404
              : 422;
        return jsonError(err.code, err.message, status);
      }
      throw err;
    }
  },
);

export const DELETE = withAdmin(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { stylist: { select: { slug: true } } },
    });
    if (!booking) return jsonError("NOT_FOUND", "Reserva no encontrada", 404);
    if (booking.googleEventId) {
      await deleteCalendarEvent(
        calendarIdForStylist(booking.stylist?.slug ?? null),
        booking.googleEventId,
      );
    }
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
