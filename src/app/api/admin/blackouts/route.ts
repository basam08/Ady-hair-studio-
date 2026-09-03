import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { blackoutCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => {
  const blackouts = await prisma.blackout.findMany({
    where: { endsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ blackouts });
});

export const POST = withAdmin(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_JSON", "Cuerpo no válido", 400);
  }
  const parsed = blackoutCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Datos no válidos", details: parsed.error.flatten() } },
      { status: 422 },
    );
  }
  const created = await prisma.blackout.create({
    data: {
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      reason: parsed.data.reason,
      allDay: parsed.data.allDay,
    },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
});

export const DELETE = withAdmin(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return jsonError("BAD_REQUEST", "Falta id", 400);
  await prisma.blackout.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
});
