"use client";

import { useCallback, useEffect, useState } from "react";
import { salon, formatPriceCents } from "@/config/salon";
import { formatTimeInZone } from "@/lib/time";

interface Booking {
  id: string;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  startsAt: string;
  status: string;
  clientNote: string | null;
  client: { name: string; phone: string; email: string | null };
  stylist: { name: string } | null;
}

type RangePreset = "today" | "week" | "month";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function rangeFor(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  if (preset === "today") {
    // hoy
  } else if (preset === "week") {
    to.setDate(to.getDate() + 7);
  } else {
    to.setMonth(to.getMonth() + 1);
  }
  return { from: dateKey(from), to: dateKey(to) };
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No vino",
};

export function ReservasClient({
  services,
  stylists,
}: {
  services: { slug: string; name: string }[];
  stylists: { slug: string; name: string }[];
}) {
  const [preset, setPreset] = useState<RangePreset>("week");
  const [status, setStatus] = useState("ALL");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const { from, to } = rangeFor(preset);
    fetch(
      `/api/admin/bookings?from=${from}&to=${to}&status=${status}`,
    )
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []))
      .finally(() => setLoading(false));
  }, [preset, status]);

  useEffect(load, [load]);

  async function setBookingStatus(id: string, next: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) load();
  }

  const { from, to } = rangeFor(preset);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-4xl">Reservas</h1>
        <div className="flex gap-3">
          <a
            href={`/api/admin/export?from=${from}&to=${to}`}
            className="u-mono text-xs uppercase tracking-widest link-underline"
          >
            Exportar CSV
          </a>
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="u-mono text-xs uppercase tracking-widest link-underline text-persimmon"
          >
            {showNew ? "Cerrar" : "+ Nueva cita"}
          </button>
        </div>
      </div>

      {showNew && (
        <NewBookingForm
          services={services}
          stylists={stylists}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {(["today", "week", "month"] as RangePreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`u-mono border border-line px-3 py-1.5 text-xs uppercase tracking-widest ${
              preset === p ? "bg-ink text-oat" : "bg-cream"
            }`}
          >
            {p === "today" ? "Hoy" : p === "week" ? "7 días" : "30 días"}
          </button>
        ))}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="u-mono border border-line bg-cream px-3 py-1.5 text-xs uppercase tracking-widest"
        >
          <option value="ALL">Todos los estados</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="COMPLETED">Completadas</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="NO_SHOW">No vino</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="u-mono text-xs uppercase tracking-widest text-cocoa">
              <th className="border-b border-ink py-2 text-left">Cuándo</th>
              <th className="border-b border-ink py-2 text-left">Servicio</th>
              <th className="border-b border-ink py-2 text-left">Cliente</th>
              <th className="border-b border-ink py-2 text-left">Estado</th>
              <th className="border-b border-ink py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-cocoa">
                  Cargando…
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-cocoa">
                  Sin reservas en este rango.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const d = new Date(b.startsAt);
                return (
                  <tr key={b.id} className="align-top">
                    <td className="border-b border-line py-3 pr-3">
                      <span className="u-mono">
                        {d.toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                        })}{" "}
                        {formatTimeInZone(salon.timeZone, d)}
                      </span>
                      <br />
                      <span className="u-mono text-xs text-cocoa">
                        {b.stylist?.name ?? "Sin asignar"} · {b.durationMin} min
                      </span>
                    </td>
                    <td className="border-b border-line py-3 pr-3">
                      {b.serviceName}
                      <br />
                      <span className="u-mono text-xs text-cocoa">
                        {formatPriceCents(b.priceCents)}
                      </span>
                      {b.clientNote && (
                        <p className="mt-1 max-w-[16rem] text-xs italic text-cocoa">
                          “{b.clientNote}”
                        </p>
                      )}
                    </td>
                    <td className="border-b border-line py-3 pr-3">
                      {b.client.name}
                      <br />
                      <span className="u-mono text-xs text-cocoa">
                        {b.client.phone}
                      </span>
                    </td>
                    <td className="border-b border-line py-3 pr-3">
                      <span
                        className={`u-mono text-xs uppercase ${
                          b.status === "CANCELLED" || b.status === "NO_SHOW"
                            ? "text-persimmon"
                            : b.status === "COMPLETED"
                              ? "text-sage"
                              : "text-ink"
                        }`}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="border-b border-line py-3 text-right">
                      {b.status === "CONFIRMED" && (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => setBookingStatus(b.id, "COMPLETED")}
                            className="u-mono text-xs uppercase link-underline"
                          >
                            Completado
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingStatus(b.id, "NO_SHOW")}
                            className="u-mono text-xs uppercase link-underline"
                          >
                            No vino
                          </button>
                          <button
                            type="button"
                            onClick={() => setBookingStatus(b.id, "CANCELLED")}
                            className="u-mono text-xs uppercase link-underline text-persimmon"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                      {b.status !== "CONFIRMED" && (
                        <button
                          type="button"
                          onClick={() => setBookingStatus(b.id, "CONFIRMED")}
                          className="u-mono text-xs uppercase link-underline"
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewBookingForm({
  services,
  stylists,
  onCreated,
}: {
  services: { slug: string; name: string }[];
  stylists: { slug: string; name: string }[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    serviceSlug: services[0]?.slug ?? "",
    stylistSlug: stylists[0]?.slug ?? "",
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email || undefined,
          note: form.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo crear.");
        return;
      }
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-3 border border-ink bg-cream p-5 sm:grid-cols-3"
    >
      {error && (
        <p className="sm:col-span-3 border border-persimmon bg-persimmon/10 px-3 py-2 text-sm text-persimmon-dark">
          {error}
        </p>
      )}
      <label className="block">
        <span className="field-label">Servicio</span>
        <select
          className="field"
          value={form.serviceSlug}
          onChange={(e) => setForm({ ...form, serviceSlug: e.target.value })}
        >
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Peluquero/a</span>
        <select
          className="field"
          value={form.stylistSlug}
          onChange={(e) => setForm({ ...form, stylistSlug: e.target.value })}
        >
          {stylists.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Fecha</span>
        <input
          type="date"
          required
          className="field"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="field-label">Hora</span>
        <input
          type="time"
          required
          className="field"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="field-label">Nombre</span>
        <input
          required
          className="field"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="field-label">Teléfono</span>
        <input
          required
          className="field"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="field-label">Email (opcional)</span>
        <input
          type="email"
          className="field"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="block sm:col-span-3">
        <span className="field-label">Nota (opcional)</span>
        <input
          className="field"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </label>
      <div className="sm:col-span-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Creando…" : "Crear cita"}
        </button>
        <span className="u-mono ml-3 text-xs text-cocoa">
          El admin puede saltarse la antelación mínima.
        </span>
      </div>
    </form>
  );
}
