import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { productOrderStatusSchema } from "@/lib/validation";

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
    const parsed = productOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Estado no válido", 422);
    }

    const updated = await prisma.productOrder.updateMany({
      where: { id },
      data: { status: parsed.data.status },
    });
    if (updated.count === 0) {
      return jsonError("NOT_FOUND", "Pedido no encontrado", 404);
    }
    return NextResponse.json({ ok: true });
  },
);
