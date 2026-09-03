import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlots } from "@/lib/availability";
import { availabilityQuerySchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rl = rateLimit(`avail:${clientIp(req.headers)}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Demasiadas peticiones" } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const parsed = availabilityQuerySchema.safeParse({
    service: req.nextUrl.searchParams.get("service") ?? "",
    date: req.nextUrl.searchParams.get("date") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Parámetros no válidos",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  const service = await prisma.service.findUnique({
    where: { slug: parsed.data.service },
    select: { durationMin: true, active: true, name: true },
  });
  if (!service || !service.active) {
    return NextResponse.json(
      { error: { code: "SERVICE_NOT_FOUND", message: "Servicio no disponible" } },
      { status: 404 },
    );
  }

  const slots = await getAvailableSlots(parsed.data.date, service.durationMin);
  return NextResponse.json({
    date: parsed.data.date,
    service: parsed.data.service,
    durationMin: service.durationMin,
    slots,
  });
}
