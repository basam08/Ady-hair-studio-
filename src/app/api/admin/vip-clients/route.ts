import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { vipClientCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const clients = await prisma.vipClient.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { hairColor: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 300,
  });

  return NextResponse.json({ clients });
});

export const POST = withAdmin(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_JSON", "Cuerpo no válido", 400);
  }
  const parsed = vipClientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Revisa los campos",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  const created = await prisma.vipClient.create({
    data: {
      name: parsed.data.name,
      hairColor: parsed.data.hairColor,
      colorHex: parsed.data.colorHex || null,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
    },
  });
  return NextResponse.json({ ok: true, client: created }, { status: 201 });
});
