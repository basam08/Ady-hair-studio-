import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { bookingStatusSchema } from "@/lib/validation";
import { deleteCalendarEvent } from "@/lib/integrations/google-calendar";
import { notifyBookingCancelled } from "@/lib/notifications";

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
