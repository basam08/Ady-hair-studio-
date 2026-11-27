"use client";

import { findProduct, formatCents } from "@/config/shop";
import type { MonthStats } from "@/lib/product-order-stats";

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

function Card({ label, value, previous }: { label: string; value: string; previous: string }) {
  return (
    <div className="border border-line bg-cream p-4">
      <p className="u-mono text-xs uppercase tracking-widest text-cocoa">{label}</p>
      <p className="font-display mt-2 text-3xl">{value}</p>
      <p className="u-mono mt-1 text-xs text-cocoa">Mes anterior: {previous}</p>
    </div>
  );
}

function ProductList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { slug: string; name: string; detail: string }[];
}) {
  return (
    <section>
      <h3 className="u-eyebrow">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-cocoa">{empty}</p>
      ) : (
        <ul className="mt-3">
          {rows.map((r) => {
            const image = findProduct(r.slug)?.image;
            return (
              <li key={r.slug} className="flex items-center gap-3 border-t border-line py-2 last:border-b">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" loading="lazy" className="h-12 w-12 shrink-0 border border-line bg-oat object-contain" />
                ) : (
                  <span className="h-12 w-12 shrink-0 border border-line bg-cream" />
                )}
                <span className="flex-1 text-sm">{r.name}</span>
                <span className="u-mono text-right text-xs text-cocoa">{r.detail}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function PedidosStats({
  current,
  previous,
  onMonth,
}: {
  current: MonthStats;
  previous: MonthStats;
  onMonth: (month: string) => void;
}) {
  const percent = (v: number | null) => (v === null ? "—" : `${v}%`);
  const hours = (v: number | null) => (v === null ? "—" : `${v} h`);

  const best = current.products.filter((p) => p.pickedUnits > 0).slice(0, 5);
  const least = [...current.products]
    .sort((a, b) => a.pickedUnits - b.pickedUnits || b.lostUnits - a.lostUnits)
    .slice(0, 5);
  const lost = current.products
    .filter((p) => p.lostUnits > 0)
    .sort((a, b) => b.lostUnits - a.lostUnits)
    .slice(0, 5);

  return (
    <div className="mt-6">
      <label className="flex flex-wrap items-center gap-3">
        <span className="field-label">Mes</span>
        <input
          type="month"
          className="field w-auto"
          value={current.month}
          onChange={(e) => e.target.value && onMonth(e.target.value)}
        />
        <span className="text-sm text-cocoa">
          {monthLabel(current.month)}, comparado con {monthLabel(previous.month)}
        </span>
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Ventas recogidas" value={formatCents(current.pickedCents)} previous={formatCents(previous.pickedCents)} />
        <Card label="Pedidos recogidos" value={String(current.pickedCount)} previous={String(previous.pickedCount)} />
        <Card label="Gasto medio" value={formatCents(current.averageCents)} previous={formatCents(previous.averageCents)} />
        <Card label="Porcentaje de recogida" value={percent(current.pickupRate)} previous={percent(previous.pickupRate)} />
        <Card label="Caducados" value={String(current.expiredCount)} previous={String(previous.expiredCount)} />
        <Card label="Cancelados" value={String(current.cancelledCount)} previous={String(previous.cancelledCount)} />
        <Card label="Importe no vendido" value={formatCents(current.unsoldCents)} previous={formatCents(previous.unsoldCents)} />
        <Card label="Tiempo medio de recogida" value={hours(current.averagePickupHours)} previous={hours(previous.averagePickupHours)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <ProductList
          title="Más recogidos"
          empty="Sin recogidas este mes."
          rows={best.map((p) => ({ slug: p.slug, name: p.name, detail: `${p.pickedUnits} ud · ${formatCents(p.pickedCents)}` }))}
        />
        <ProductList
          title="Menos recogidos (entre los pedidos)"
          empty="Sin datos este mes."
          rows={least.map((p) => ({ slug: p.slug, name: p.name, detail: `${p.pickedUnits} ud` }))}
        />
        <ProductList
          title="Más veces sin recoger"
          empty="Ningún producto sin recoger este mes."
          rows={lost.map((p) => ({ slug: p.slug, name: p.name, detail: `${p.lostUnits} ud` }))}
        />
      </div>

      <p className="mt-6 text-xs text-cocoa">
        Cada pedido cuenta en el mes en que se cierra. Los cerrados antes de
        este cambio no tienen fecha y no aparecen aquí. «Importe no vendido»
        es la suma de caducados y cancelados, no el dinero perdido.
      </p>
    </div>
  );
}
