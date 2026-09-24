import { NextResponse, type NextRequest } from "next/server";
import { bookingCreateSchema } from "@/lib/validation";
import { createBooking, BookingError } from "@/lib/bookings";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`booking:${clientIp(req.headers)}`, 8, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Has hecho demasiadas reservas seguidas. Prueba en un rato.",
        },
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Cuerpo no válido" } },
      { status: 400 },
    );
  }

  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisa los campos del formulario",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  try {
    const booking = await createBooking({
      serviceSlug: parsed.data.serviceSlug,
      extraSlugs: parsed.data.extraSlugs,
      stylistSlug: parsed.data.stylistSlug,
      date: parsed.data.date,
      time: parsed.data.time,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      note: parsed.data.note || undefined,
    });

    return NextResponse.json(
      {
        ok: true,
        manageToken: booking.manageToken,
        startsAt: booking.startsAt.toISOString(),
        serviceName: booking.serviceName,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof BookingError) {
      const status =
        err.code === "SLOT_TAKEN"
          ? 409
          : err.code === "SERVICE_NOT_FOUND" || err.code === "STYLIST_NOT_FOUND"
            ? 404
            : 422;
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status },
      );
    }
    console.error("[bookings] error inesperado:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "No se pudo crear la reserva" } },
      { status: 500 },
    );
  }
}
