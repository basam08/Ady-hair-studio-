"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findProduct, formatCents } from "@/config/shop";
import { salon } from "@/config/salon";
import { PedidosStats } from "@/components/admin/PedidosStats";
import type { MonthStats } from "@/lib/product-order-stats";
import {
  allowedActions,
  isClosedDay,
  orderDeadline,
  orderStage,
  remainingOpenMs,
  type OrderAction,
  type OrderStage,
  type OrderTimes,
} from "@/lib/product-orders";

interface OrderRow extends OrderTimes {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  items: { slug: string; name: string; quantity: number; priceCents: number }[];
  totalCents: number;
  createdAt: string;
}

interface Data {
  orders: OrderRow[];
  closedDates: string[];
  serverNow: string;
  stats: { current: MonthStats; previous: MonthStats };
}

type TabKey = "active" | "expired" | "picked_up" | "cancelled" | "stats";

const TABS: { key: TabKey; label: string; stages: OrderStage[] }[] = [
  { key: "active", label: "Pendientes", stages: ["new", "confirmed", "ordered", "ready"] },
  { key: "expired", label: "Caducados", stages: ["expired"] },
  { key: "picked_up", label: "Recogidos", stages: ["picked_up"] },
  { key: "cancelled", label: "Cancelados", stages: ["cancelled"] },
  { key: "stats", label: "Estadísticas", stages: [] },
];

const STAGE_LABEL: Record<OrderStage, string> = {
  new: "Nuevo",
  confirmed: "Confirmado",
  ordered: "Encargado",
  ready: "Listo para recoger",
  expired: "Caducado",
  picked_up: "Recogido",
  cancelled: "Cancelado",
};

const ACTION_LABEL: Record<OrderAction, string> = {
  confirm: "Confirmado por el cliente",
  order: "Encargado al proveedor",
  ready: "Listo para recoger",
  unready: "Quitar de listos",
  extend: "Dar más plazo",
  pickup: "Recogido",
  cancel: "Cancelar",
  reopen: "Volver a pendiente",
};

const ACTION_ORDER: OrderAction[] = ["confirm", "order", "ready", "pickup", "extend", "unready", "cancel", "reopen"];
const SOON_MS = 12 * 3_600_000;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h} h ${String(m).padStart(2, "0")} min ${String(s).padStart(2, "0")} s`;
}

const formatDateTime = (d: Date) =>
  d.toLocaleString("es-ES", {
    timeZone: salon.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Enlace de WhatsApp con el mensaje escrito; lo envía la persona del salón. */
function whatsappLink(order: OrderRow, stage: OrderStage, deadline: Date | null): string {
  let digits = order.phone.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length === 9) digits = `34${digits}`;
  const lines = order.items.map((i) => `· ${i.quantity} × ${i.name}`).join("\n");
  const total = formatCents(order.totalCents);
  const text =
    stage === "ready" && deadline
      ? `Hola ${order.name}, tu pedido de ${salon.name} ya está listo para recoger:\n${lines}\nTotal a pagar en el salón: ${total}.\nTienes hasta el ${formatDateTime(deadline)}. Después, la reserva caduca.`
      : stage === "new"
        ? `Hola ${order.name}, hemos recibido tu reserva en ${salon.name}:\n${lines}\nTotal a pagar en el salón: ${total}.\n¿Nos confirmas que la quieres?`
        : `Hola ${order.name}, te escribimos de ${salon.name} por tu pedido:\n${lines}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function Photo({ slug, name }: { slug: string; name: string }) {
  const image = findProduct(slug)?.image;
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt={name} loading="lazy" className="h-20 w-20 shrink-0 border border-line bg-oat object-contain" />
  ) : (
    <span className="u-mono flex h-20 w-20 shrink-0 items-center justify-center border border-line bg-cream text-center text-xs text-cocoa">
      Sin foto
    </span>
  );
}

export function PedidosClient() {
  const [tab, setTab] = useState<TabKey>("active");
  const [data, setData] = useState<Data | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  // Diferencia con el reloj del servidor: la cuenta no depende del del equipo.
  const skew = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/product-orders${month ? `?month=${month}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const next: Data = await res.json();
      skew.current = new Date(next.serverNow).getTime() - Date.now();
      setData(next);
      setNow(new Date(Date.now() + skew.current));
      setError(null);
    } catch {
      setError("No se pudieron cargar los pedidos.");
    }
  }, [month]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 60_000);
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date(Date.now() + skew.current)), 1000);
    return () => clearInterval(tick);
  }, []);

  async function run(order: OrderRow, action: OrderAction) {
    if (action === "cancel" && !confirm(`¿Cancelar el pedido de ${order.name}?`)) return;
    setBusy(order.id);
    const res = await fetch(`/api/admin/product-orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);
    const body = res && !res.ok ? await res.json().catch(() => null) : null;
    await load();
    if (!res?.ok) setError(body?.error?.message ?? "No se pudo cambiar el pedido. Inténtalo de nuevo.");
    setBusy(null);
  }

  if (!data) {
    return <p className="mt-6 py-6 text-sm text-cocoa">{error ?? "Cargando…"}</p>;
  }

  const extraClosed = new Set(data.closedDates);
  const rows = data.orders.map((order) => {
    const stage = orderStage(order, now, extraClosed);
    const deadline = orderDeadline(order, extraClosed);
    const remaining = stage === "ready" && deadline ? remainingOpenMs(now, deadline, extraClosed) : null;
    return { order, stage, deadline, remaining };
  });
  const current = TABS.find((t) => t.key === tab)!;
  const visible = rows.filter((r) => current.stages.includes(r.stage));
  // En pendientes, primero lo que antes caduca.
  if (tab === "active") {
    visible.sort((a, b) => (a.remaining ?? Infinity) - (b.remaining ?? Infinity));
  }

  const toSupply = new Map<string, { name: string; quantity: number }>();
  for (const r of rows) {
    if (r.stage !== "confirmed") continue;
    for (const i of r.order.items) {
      const entry = toSupply.get(i.slug) ?? { name: i.name, quantity: 0 };
      entry.quantity += i.quantity;
      toSupply.set(i.slug, entry);
    }
  }
  const unpaid = rows.filter((r) => ["new", "confirmed", "ordered", "ready"].includes(r.stage));
  const soon = rows.filter((r) => r.remaining !== null && r.remaining <= SOON_MS);
  const closedToday = isClosedDay(now, extraClosed);

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Pendiente de recoger", formatCents(unpaid.reduce((s, r) => s + r.order.totalCents, 0)), `${unpaid.length} pedidos`],
          ["Listos para recoger", String(rows.filter((r) => r.stage === "ready").length), "con el plazo en marcha"],
          ["Caducan pronto", String(soon.length), "quedan 12 h o menos"],
        ].map(([label, value, hint]) => (
          <div key={label} className="border border-line bg-cream p-4">
            <p className="u-mono text-xs uppercase tracking-widest text-cocoa">{label}</p>
            <p className="font-display mt-2 text-3xl">{value}</p>
            <p className="u-mono mt-1 text-xs text-cocoa">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`u-mono border border-ink px-3 py-2 text-xs uppercase tracking-widest ${
              tab === t.key ? "bg-ink text-oat" : ""
            }`}
          >
            {t.label}
            {t.stages.length > 0 && ` (${rows.filter((r) => t.stages.includes(r.stage)).length})`}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ink p-3 text-sm">
          {error}
        </p>
      )}

      {tab === "stats" ? (
        <PedidosStats current={data.stats.current} previous={data.stats.previous} onMonth={setMonth} />
      ) : (
        <>
          {tab === "active" && toSupply.size > 0 && (
            <section className="mt-6 border border-ink p-4">
              <h2 className="u-eyebrow">Por encargar</h2>
              <p className="mt-1 text-xs text-cocoa">
                Pedidos confirmados que aún no están encargados ni listos. Si ya
                tienes el producto, pulsa «Listo para recoger» en el pedido.
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {[...toSupply.entries()].map(([slug, p]) => (
                  <li key={slug} className="flex items-center gap-3">
                    <Photo slug={slug} name={p.name} />
                    <span className="text-sm">
                      <strong className="u-mono">{p.quantity} ×</strong> {p.name}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visible.length === 0 ? (
            <p className="py-6 text-sm text-cocoa">No hay pedidos aquí.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {visible.map(({ order, stage, deadline, remaining }) => {
                const actions = allowedActions(order, stage);
                return (
                  <li key={order.id} className="border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl">{order.name}</p>
                        <p className="u-mono text-xs text-cocoa">
                          <a href={`tel:${order.phone}`} className="underline">
                            {order.phone}
                          </a>
                          {order.email && ` · ${order.email}`}
                          <br />
                          Pedido el{" "}
                          {new Date(order.createdAt).toLocaleString("es-ES", {
                            timeZone: salon.timeZone,
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`u-mono inline-block border border-ink px-2 py-1 text-xs uppercase tracking-widest ${stage === "ready" ? "bg-ink text-oat" : ""}`}>
                          {STAGE_LABEL[stage]}
                        </p>
                        {remaining !== null && deadline && (
                          <>
                            <p className={`u-mono mt-2 text-lg ${remaining <= SOON_MS ? "font-bold text-red-700" : ""}`}>
                              Quedan {formatRemaining(remaining)}
                            </p>
                            {closedToday && <p className="u-mono text-xs">En pausa: hoy el salón no abre</p>}
                            <p className="text-xs text-cocoa">Caduca el {formatDateTime(deadline)}</p>
                          </>
                        )}
                        {stage === "expired" && deadline && (
                          <p className="mt-2 text-xs text-red-700">Caducó el {formatDateTime(deadline)}</p>
                        )}
                      </div>
                    </div>

                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {order.items.map((i) => (
                        <li key={i.slug} className="flex items-center gap-3">
                          <Photo slug={i.slug} name={i.name} />
                          <span className="text-sm">
                            <strong className="u-mono">{i.quantity} ×</strong> {i.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {order.note && <p className="mt-3 text-sm text-cocoa">Nota: {order.note}</p>}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                      <p className="u-mono font-semibold">{formatCents(order.totalCents)}</p>
                      <div className="flex flex-wrap gap-2">
                        {tab === "active" || tab === "expired" ? (
                          <a href={whatsappLink(order, stage, deadline)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                            {stage === "ready" ? "Avisar por WhatsApp" : "WhatsApp"}
                          </a>
                        ) : null}
                        {ACTION_ORDER.filter((a) => actions.includes(a)).map((action, index) => (
                          <button
                            key={action}
                            type="button"
                            disabled={busy === order.id}
                            onClick={() => run(order, action)}
                            className={`btn disabled:opacity-50 ${index === 0 && action !== "reopen" ? "btn-primary" : "btn-ghost"}`}
                          >
                            {action === "cancel" && stage === "expired" ? "Cerrar pedido" : ACTION_LABEL[action]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
