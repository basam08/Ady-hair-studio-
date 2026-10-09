import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { vipClientCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

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

    const updated = await prisma.vipClient.updateMany({
      where: { id },
      data: {
        name: parsed.data.name,
        hairColor: parsed.data.hairColor,
        colorHex: parsed.data.colorHex || null,
        phone: parsed.data.phone || null,
        notes: parsed.data.notes || null,
      },
    });
    if (updated.count === 0) return jsonError("NOT_FOUND", "Cliente no encontrado", 404);
    return NextResponse.json({ ok: true });
  },
);

export const DELETE = withAdmin(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    await prisma.vipClient.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
