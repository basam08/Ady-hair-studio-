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
    extras: req.nextUrl.searchParams.get("extras") ?? undefined,
    stylist: req.nextUrl.searchParams.get("stylist") ?? undefined,
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
    select: { durationMin: true, active: true, bookableOnline: true, name: true },
  });
  if (!service || !service.active) {
    return NextResponse.json(
      { error: { code: "SERVICE_NOT_FOUND", message: "Servicio no disponible" } },
      { status: 404 },
    );
  }
  if (!service.bookableOnline) {
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_NOT_BOOKABLE",
          message: "Este servicio no se puede reservar online",
        },
      },
      { status: 409 },
    );
  }

  let stylistId: string | null = null;
  if (parsed.data.stylist) {
    const stylist = await prisma.stylist.findUnique({
      where: { slug: parsed.data.stylist },
      select: { id: true, active: true },
    });
    if (!stylist || !stylist.active) {
      return NextResponse.json(
        { error: { code: "STYLIST_NOT_FOUND", message: "Peluquero no disponible" } },
        { status: 404 },
      );
    }
    stylistId = stylist.id;
  }

  let durationMin = service.durationMin;
  const extraSlugs = parsed.data.extras
    ? parsed.data.extras.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  if (extraSlugs.length > 0) {
    const extras = await prisma.service.findMany({
      where: { slug: { in: extraSlugs }, active: true, bookableOnline: true },
      select: { durationMin: true },
    });
    durationMin += extras.reduce((sum, e) => sum + e.durationMin, 0);
  }

  const slots = await getAvailableSlots(parsed.data.date, durationMin, stylistId);
  return NextResponse.json({
    date: parsed.data.date,
    service: parsed.data.service,
    durationMin,
    slots,
  });
}
