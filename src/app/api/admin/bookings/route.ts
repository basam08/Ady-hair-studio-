import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { adminBookingCreateSchema } from "@/lib/validation";
import { createBooking, BookingError } from "@/lib/bookings";
import { isValidDateKey } from "@/lib/time";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  if (from && !isValidDateKey(from)) return jsonError("BAD_RANGE", "from no válido", 422);
  if (to && !isValidDateKey(to)) return jsonError("BAD_RANGE", "to no válido", 422);

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.startsAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lt: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }
  if (status && status !== "ALL") where.status = status;

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { client: true },
    take: 500,
  });

  return NextResponse.json({ bookings });
});

export const POST = withAdmin(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_JSON", "Cuerpo no válido", 400);
  }
  const parsed = adminBookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Datos no válidos", details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  try {
    const booking = await createBooking(
      {
        serviceSlug: parsed.data.serviceSlug,
        date: parsed.data.date,
        time: parsed.data.time,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        note: parsed.data.note || undefined,
      },
      { source: "admin" },
    );
    return NextResponse.json({ ok: true, id: booking.id }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return jsonError(err.code, err.message, err.code === "SLOT_TAKEN" ? 409 : 422);
    }
    throw err;
  }
});
