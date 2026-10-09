"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { salon, formatPriceCents } from "@/config/salon";
import { formatTimeInZone } from "@/lib/time";
import { CircularTimePicker } from "@/components/admin/CircularTimePicker";

interface Booking {
  id: string;
  serviceName: string;
  priceCents: number;
  durationMin: number;
  startsAt: string;
  status: string;
  clientNote: string | null;
  client: { name: string; phone: string; email: string | null };
  service: { slug: string };
  stylist: { name: string; slug: string } | null;
}

interface BookingFormValues {
  serviceSlug: string;
  stylistSlug: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  note: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (!res.ok) return;
    // Al completar una cita, desaparece al momento de la lista de trabajo
    // (salvo que se esté filtrando justo por "Completadas"); se puede
    // seguir consultando luego con ese filtro.
    if (next === "COMPLETED" && status !== "COMPLETED") {
      setBookings((rows) => rows.filter((b) => b.id !== id));
    } else {
      load();
    }
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
          <a
            href={`/api/admin/export-pdf?from=${from}&to=${to}`}
            className="u-mono text-xs uppercase tracking-widest link-underline"
          >
            Exportar PDF
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
        <div className="mt-6">
          <BookingForm
            services={services}
            stylists={stylists}
            initial={{
              serviceSlug: services[0]?.slug ?? "",
              stylistSlug: stylists[0]?.slug ?? "",
              date: "",
              time: "",
              name: "",
              phone: "",
              email: "",
              note: "",
            }}
            endpoint="/api/admin/bookings"
            method="POST"
            submitLabel="Crear cita"
            hint="El admin puede saltarse la antelación mínima."
            onDone={() => {
              setShowNew(false);
              load();
            }}
          />
        </div>
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
                  <Fragment key={b.id}>
                    <tr className="align-top">
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
                              onClick={() =>
                                setEditingId(editingId === b.id ? null : b.id)
                              }
                              className="u-mono text-xs uppercase link-underline"
                            >
                              {editingId === b.id ? "Cerrar edición" : "Editar"}
                            </button>
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
                    {editingId === b.id && (
                      <tr>
                        <td colSpan={5} className="border-b border-line py-4">
                          <BookingForm
                            services={services}
                            stylists={stylists}
                            initial={valuesFromBooking(b, stylists)}
                            endpoint={`/api/admin/bookings/${b.id}`}
                            method="PUT"
                            submitLabel="Guardar y avisar al cliente"
                            onCancel={() => setEditingId(null)}
                            onDone={() => {
                              setEditingId(null);
                              load();
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function valuesFromBooking(
  b: Booking,
  stylists: { slug: string }[],
): BookingFormValues {
  const d = new Date(b.startsAt);
  return {
    serviceSlug: b.service.slug,
    stylistSlug: b.stylist?.slug ?? stylists[0]?.slug ?? "",
    date: dateKey(d),
    time: formatTimeInZone(salon.timeZone, d),
    name: b.client.name,
    phone: b.client.phone,
    email: b.client.email ?? "",
    note: b.clientNote ?? "",
  };
}

function BookingForm({
  services,
  stylists,
  initial,
  endpoint,
  method,
  submitLabel,
  hint,
  onDone,
  onCancel,
}: {
  services: { slug: string; name: string }[];
  stylists: { slug: string; name: string }[];
  initial: BookingFormValues;
  endpoint: string;
  method: "POST" | "PUT";
  submitLabel: string;
  hint?: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<BookingFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<"hour" | "minute">("hour");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email || undefined,
          note: form.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo guardar.");
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 border border-ink bg-cream p-5 sm:grid-cols-3"
    >
      {error && (
        <p className="sm:col-span-3 border border-persimmon bg-persimmon/10 px-3 py-2 text-sm text-persimmon-dark">
          {error}
        </p>
      )}
      <label className="block">
        <span className="field-label">Servicio</span>
        <ServiceCombobox
          services={services}
          value={form.serviceSlug}
          onChange={(slug) => setForm({ ...form, serviceSlug: slug })}
        />
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
      <label className="relative block">
        <span className="field-label">Hora</span>
        <button
          type="button"
          onClick={() => {
            setTimePickerMode("hour");
            setTimePickerOpen((v) => !v);
          }}
          className="field text-left"
        >
          {form.time || "Elegir hora"}
        </button>
        {timePickerOpen && (
          <div className="absolute z-10 mt-1 border border-ink bg-oat p-4 shadow-lg">
            <CircularTimePicker
              value={form.time || "10:00"}
              onChange={(time) => setForm({ ...form, time })}
              mode={timePickerMode}
              onModeChange={setTimePickerMode}
            />
            <button
              type="button"
              onClick={() => setTimePickerOpen(false)}
              className="btn btn-primary mt-3 w-full"
            >
              Listo
            </button>
          </div>
        )}
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
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Guardando…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="u-mono text-xs uppercase link-underline"
          >
            Cancelar
          </button>
        )}
        {hint && <span className="u-mono text-xs text-cocoa">{hint}</span>}
      </div>
    </form>
  );
}

function ServiceCombobox({
  services,
  value,
  onChange,
}: {
  services: { slug: string; name: string }[];
  value: string;
  onChange: (slug: string) => void;
}) {
  const [query, setQuery] = useState(
    () => services.find((s) => s.slug === value)?.name ?? "",
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(services.find((s) => s.slug === value)?.name ?? "");
  }, [value, services]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? services.filter((s) => s.name.toLowerCase().includes(q))
    : services;

  return (
    <div className="relative">
      <input
        className="field"
        placeholder="Escribe para buscar…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-ink bg-oat shadow-lg">
          {filtered.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s.slug);
                  setQuery(s.name);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-cream"
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
