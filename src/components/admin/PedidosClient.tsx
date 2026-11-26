"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCents } from "@/config/shop";

type Status = "PENDING" | "PICKED_UP" | "CANCELLED";

interface OrderRow {
  id: string;
  status: Status;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  items: { slug: string; name: string; quantity: number }[];
  totalCents: number;
  createdAt: string;
}

const TABS: { status: Status; label: string }[] = [
  { status: "PENDING", label: "Pendientes" },
  { status: "PICKED_UP", label: "Recogidos" },
  { status: "CANCELLED", label: "Cancelados" },
];

export function PedidosClient() {
  const [tab, setTab] = useState<Status>("PENDING");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/product-orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
      setError(null);
    } catch {
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: Status) {
    const res = await fetch(`/api/admin/product-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok) {
      setError("No se pudo cambiar el estado. Inténtalo de nuevo.");
      return;
    }
    await load();
  }

  const visible = orders.filter((o) => o.status === tab);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            onClick={() => setTab(t.status)}
            aria-pressed={tab === t.status}
            className={`u-mono border border-ink px-3 py-2 text-xs uppercase tracking-widest ${
              tab === t.status ? "bg-ink text-oat" : ""
            }`}
          >
            {t.label} ({orders.filter((o) => o.status === t.status).length})
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-ink p-3 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-sm text-cocoa">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="py-6 text-sm text-cocoa">No hay pedidos aquí.</p>
      ) : (
        <ul className="mt-6">
          {visible.map((o) => (
            <li
              key={o.id}
              className="grid gap-4 border-t border-line py-5 md:grid-cols-[1fr_1.4fr_auto]"
            >
              <div>
                <p className="font-display text-xl">{o.name}</p>
                <p className="u-mono text-xs text-cocoa">
                  <a href={`tel:${o.phone}`} className="underline">
                    {o.phone}
                  </a>
                  {o.email && (
                    <>
                      <br />
                      {o.email}
                    </>
                  )}
                  <br />
                  {new Date(o.createdAt).toLocaleString("es-ES", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="text-sm">
                <ul>
                  {o.items.map((i) => (
                    <li key={i.slug}>
                      {i.quantity} × {i.name}
                    </li>
                  ))}
                </ul>
                {o.note && <p className="mt-1 text-cocoa">Nota: {o.note}</p>}
                <p className="u-mono mt-2 font-semibold">
                  {formatCents(o.totalCents)}
                </p>
              </div>
              <div className="flex items-start gap-2">
                {o.status === "PENDING" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setStatus(o.id, "PICKED_UP")}
                      className="btn btn-primary"
                    >
                      Recogido
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Cancelar el pedido de ${o.name}?`)) {
                          setStatus(o.id, "CANCELLED");
                        }
                      }}
                      className="btn btn-ghost"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatus(o.id, "PENDING")}
                    className="btn btn-ghost"
                  >
                    Volver a pendiente
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
