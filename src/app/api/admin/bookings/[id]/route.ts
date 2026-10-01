import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { bookingStatusSchema, bookingRescheduleSchema } from "@/lib/validation";
import { deleteCalendarEvent } from "@/lib/integrations/google-calendar";
import { notifyBookingCancelled } from "@/lib/notifications";
import { rescheduleBookingById, BookingError } from "@/lib/bookings";

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
      include: { client: true },
    });
    if (!booking) return jsonError("NOT_FOUND", "Reserva no encontrada", 404);

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { client: true },
    });

    if (parsed.data.status === "CANCELLED" && booking.status !== "CANCELLED") {
      if (booking.googleEventId) await deleteCalendarEvent(booking.googleEventId);
      await notifyBookingCancelled(updated);
    }

    return NextResponse.json({ ok: true, status: updated.status });
  },
);

export const POST = withAdmin(
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
    const parsed = bookingRescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Fecha u hora no válidas", details: parsed.error.flatten() } },
        { status: 422 },
      );
    }

    try {
      const updated = await rescheduleBookingById(id, parsed.data.date, parsed.data.time);
      return NextResponse.json({
        ok: true,
        startsAt: updated.startsAt.toISOString(),
        endsAt: updated.endsAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof BookingError) {
        const status =
          err.code === "SLOT_TAKEN" ? 409 : err.code === "NOT_FOUND" ? 404 : 422;
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
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return jsonError("NOT_FOUND", "Reserva no encontrada", 404);
    if (booking.googleEventId) await deleteCalendarEvent(booking.googleEventId);
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
