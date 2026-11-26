import { NextResponse, type NextRequest } from "next/server";
import { availableProducts, orderName } from "@/config/shop";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { productOrderCreateSchema, normalizePhone } from "@/lib/validation";
import { notifyProductOrder } from "@/lib/notifications";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rl = rateLimit(
    `product-order:${clientIp(req.headers)}`,
    5,
    10 * 60_000,
  );
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
    return jsonError("BAD_JSON", "Cuerpo no válido", 400);
  }

  const parsed = productOrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Revisa los campos del formulario",
      422,
    );
  }

  // Nombres y precios salen siempre del catálogo, nunca del navegador.
  const catalog = new Map(availableProducts().map((p) => [p.slug, p]));
  const items: {
    slug: string;
    name: string;
    priceCents: number;
    quantity: number;
  }[] = [];
  for (const { slug, quantity } of parsed.data.items) {
    const product = catalog.get(slug);
    if (!product) {
      return jsonError(
        "PRODUCT_NOT_FOUND",
        "Uno de los productos ya no está disponible. Recarga la página.",
        404,
      );
    }
    items.push({
      slug,
      name: orderName(product),
      priceCents: product.priceCents,
      quantity,
    });
  }
  const totalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0,
  );

  const data = {
    name: parsed.data.name,
    phone: normalizePhone(parsed.data.phone) ?? parsed.data.phone,
    email: parsed.data.email || null,
    note: parsed.data.note || null,
    totalCents,
  };

  try {
    await prisma.productOrder.create({ data: { ...data, items } });
  } catch (err) {
    console.error("[product-orders] error inesperado:", err);
    return jsonError("INTERNAL", "No se pudo guardar la reserva", 500);
  }

  await notifyProductOrder({ ...data, items });

  return NextResponse.json({ ok: true, totalCents }, { status: 201 });
}
