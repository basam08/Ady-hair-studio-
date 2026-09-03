import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { bookingManageSchema } from "@/lib/validation";
import {
  cancelBookingByToken,
  rescheduleBookingByToken,
  BookingError,
} from "@/lib/bookings";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    select: {
      status: true,
      serviceName: true,
      priceCents: true,
      durationMin: true,
      startsAt: true,
      endsAt: true,
      clientNote: true,
      service: { select: { slug: true } },
      client: { select: { name: true } },
    },
  });
  if (!booking) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Reserva no encontrada" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ booking });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = rateLimit(`manage:${clientIp(req.headers)}`, 20, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Demasiadas peticiones" } },
      { status: 429 },
    );
  }

  const { token } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Cuerpo no válido" } },
      { status: 400 },
    );
  }

  const parsed = bookingManageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Datos no válidos" } },
      { status: 422 },
    );
  }

  try {
    if (parsed.data.action === "cancel") {
      await cancelBookingByToken(token);
      return NextResponse.json({ ok: true, status: "CANCELLED" });
    }

    if (!parsed.data.date || !parsed.data.time) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Falta fecha u hora" } },
        { status: 422 },
      );
    }
    const updated = await rescheduleBookingByToken(
      token,
      parsed.data.date,
      parsed.data.time,
    );
    return NextResponse.json({
      ok: true,
      status: "CONFIRMED",
      startsAt: updated.startsAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof BookingError) {
      const status = err.code === "SLOT_TAKEN" ? 409 : err.code === "NOT_FOUND" ? 404 : 422;
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status },
      );
    }
    console.error("[bookings/manage] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "No se pudo actualizar" } },
      { status: 500 },
    );
  }
}
