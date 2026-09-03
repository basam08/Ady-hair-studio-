"use client";

import { useEffect, useState } from "react";

interface Blackout {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  allDay: boolean;
}

export function DisponibilidadClient() {
  const [items, setItems] = useState<Blackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: "",
    from: "10:00",
    to: "20:00",
    allDay: true,
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/blackouts")
      .then((r) => r.json())
      .then((d) => setItems(d.blackouts ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.date || !form.reason) {
      setError("Indica fecha y motivo.");
      return;
    }
    setBusy(true);
    try {
      const startsAt = new Date(
        `${form.date}T${form.allDay ? "00:00" : form.from}:00`,
      ).toISOString();
      const endsAt = new Date(
        `${form.date}T${form.allDay ? "23:59" : form.to}:00`,
      ).toISOString();
      const res = await fetch("/api/admin/blackouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt,
          endsAt,
          reason: form.reason,
          allDay: form.allDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo crear el bloqueo.");
        return;
      }
      setForm({ ...form, reason: "" });
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/blackouts?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
  }

  return (
    <div className="mt-4">
      <form
        onSubmit={submit}
        className="grid gap-3 border border-ink bg-cream p-5 sm:grid-cols-4"
      >
        {error && (
          <p className="sm:col-span-4 border border-persimmon bg-persimmon/10 px-3 py-2 text-sm text-persimmon-dark">
            {error}
          </p>
        )}
        <label className="block">
          <span className="field-label">Día</span>
          <input
            type="date"
            className="field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="field-label">Motivo</span>
          <input
            className="field"
            placeholder="Vacaciones, formación…"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={form.allDay}
            onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
          />
          <span className="u-mono text-xs uppercase">Todo el día</span>
        </label>
        <div />
        {!form.allDay && (
          <>
            <label className="block">
              <span className="field-label">Desde</span>
              <input
                type="time"
                className="field"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="field-label">Hasta</span>
              <input
                type="time"
                className="field"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />
            </label>
          </>
        )}
        <div className="sm:col-span-4">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Guardando…" : "Añadir bloqueo"}
          </button>
        </div>
      </form>

      <ul className="mt-6">
        {loading ? (
          <li className="py-3 text-sm text-cocoa">Cargando…</li>
        ) : items.length === 0 ? (
          <li className="py-3 text-sm text-cocoa">No hay bloqueos futuros.</li>
        ) : (
          items.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between border-t border-line py-3 last:border-b"
            >
              <span className="text-sm">
                <span className="u-mono">
                  {new Date(b.startsAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                  })}
                </span>{" "}
                — {b.reason}
                {!b.allDay && (
                  <span className="u-mono text-xs text-cocoa">
                    {" "}
                    (
                    {new Date(b.startsAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    –
                    {new Date(b.endsAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    )
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => remove(b.id)}
                className="u-mono text-xs uppercase tracking-widest link-underline text-persimmon"
              >
                Quitar
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
