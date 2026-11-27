import Link from "next/link";
import { prisma } from "@/lib/db";
import { findProduct } from "@/config/shop";
import {
  blackoutDateKeys,
  orderDeadline,
  orderStage,
  remainingOpenMs,
} from "@/lib/product-orders";

const SOON_MS = 12 * 3_600_000;

/** Bloque de la pantalla principal del panel con el estado de la tienda. */
export async function PedidosResumen() {
  const [orders, blackouts] = await Promise.all([
    prisma.productOrder.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.blackout.findMany({ where: { allDay: true } }),
  ]);

  const now = new Date();
  const extraClosed = new Set(blackoutDateKeys(blackouts));
  const rows = orders.map((order) => {
    const stage = orderStage(order, now, extraClosed);
    const deadline = orderDeadline(order, extraClosed);
    const remaining =
      stage === "ready" && deadline ? remainingOpenMs(now, deadline, extraClosed) : null;
    return { order, stage, remaining };
  });
  const count = (stage: string) => rows.filter((r) => r.stage === stage).length;
  const soon = rows
    .filter((r) => r.remaining !== null && r.remaining <= SOON_MS)
    .sort((a, b) => a.remaining! - b.remaining!);

  return (
    <section className="mt-10 border border-ink p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="u-eyebrow">Pedidos de la tienda</h2>
        <Link href="/admin/pedidos" className="u-mono text-xs uppercase tracking-widest link-underline">
          Ver pedidos →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          ["Nuevos", count("new")],
          ["Por encargar", count("confirmed")],
          ["Encargados", count("ordered")],
          ["Listos", count("ready")],
          ["Caducados", count("expired")],
        ].map(([label, value]) => (
          <div key={label} className="bg-cream p-4">
            <p className="u-mono text-xs uppercase tracking-widest text-cocoa">{label}</p>
            <p className="font-display mt-1 text-3xl">{value}</p>
          </div>
        ))}
      </div>

      {soon.length > 0 && (
        <>
          <h3 className="u-eyebrow mt-5">Caducan pronto</h3>
          <ul className="mt-2">
            {soon.map(({ order, remaining }) => {
              const items = order.items as { slug: string; name: string; quantity: number }[];
              const hours = Math.floor(remaining! / 3_600_000);
              const minutes = Math.floor((remaining! % 3_600_000) / 60_000);
              return (
                <li key={order.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3">
                  {items.map((i) => {
                    const image = findProduct(i.slug)?.image;
                    return image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i.slug} src={image} alt={i.name} className="h-14 w-14 border border-line object-contain" />
                    ) : null;
                  })}
                  <span className="flex-1 text-sm">{order.name}</span>
                  <span className="u-mono text-sm text-red-700">
                    Quedan {hours} h {minutes} min
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
