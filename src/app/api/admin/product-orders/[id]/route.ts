import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { productOrderActionSchema } from "@/lib/validation";
import {
  actionChanges,
  allowedActions,
  blackoutDateKeys,
  orderStage,
} from "@/lib/product-orders";

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
    const parsed = productOrderActionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", "Acción no válida", 422);
    }

    const [order, blackouts] = await Promise.all([
      prisma.productOrder.findUnique({ where: { id } }),
      prisma.blackout.findMany({ where: { allDay: true } }),
    ]);
    if (!order) {
      return jsonError("NOT_FOUND", "Pedido no encontrado", 404);
    }

    const now = new Date();
    const stage = orderStage(order, now, new Set(blackoutDateKeys(blackouts)));
    if (!allowedActions(order, stage).includes(parsed.data.action)) {
      return jsonError(
        "INVALID_STEP",
        "El pedido ha cambiado. Recarga la página.",
        409,
      );
    }

    // La condición sobre updatedAt evita pisar un cambio hecho a la vez.
    const updated = await prisma.productOrder.updateMany({
      where: { id, updatedAt: order.updatedAt },
      data: actionChanges(parsed.data.action, order, now),
    });
    if (updated.count === 0) {
      return jsonError(
        "CONFLICT",
        "El pedido ha cambiado. Recarga la página.",
        409,
      );
    }
    return NextResponse.json({ ok: true });
  },
);
