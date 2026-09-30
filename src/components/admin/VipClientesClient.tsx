"use client";

import { useEffect, useState } from "react";

interface VipClient {
  id: string;
  name: string;
  hairColor: string;
  colorHex: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
}

const EMPTY_FORM = { name: "", hairColor: "", colorHex: "#c9a87c", phone: "", notes: "" };

export function VipClientesClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<VipClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  function load(query: string) {
    setLoading(true);
    fetch(`/api/admin/vip-clients?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setRows(d.clients ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.hairColor.trim()) {
      setError("Indica al menos el nombre y el color de pelo.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/vip-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo guardar.");
        return;
      }
      setForm(EMPTY_FORM);
      setFormOpen(false);
      load(q);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/vip-clients/${id}`, { method: "DELETE" });
    if (res.ok) load(q);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="field max-w-sm"
          placeholder="Buscar por nombre o color…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="btn btn-primary"
        >
          {formOpen ? "Cancelar" : "+ Añadir cliente VIP"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 border border-ink bg-cream p-5 sm:grid-cols-2"
        >
          {error && (
            <p className="border border-persimmon bg-persimmon/10 px-3 py-2 text-sm text-persimmon-dark sm:col-span-2">
              {error}
            </p>
          )}
          <label className="block">
            <span className="field-label">Nombre</span>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="field-label">Teléfono (opcional)</span>
            <input
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Color de pelo / mezcla</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.colorHex}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                className="h-10 w-12 shrink-0 cursor-pointer border border-ink bg-transparent p-0.5"
              />
              <input
                className="field"
                placeholder="Rubio ceniza con balayage caramelo…"
                value={form.hairColor}
                onChange={(e) => setForm({ ...form, hairColor: e.target.value })}
              />
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Notas (opcional)</span>
            <textarea
              className="field"
              rows={2}
              placeholder="Marca que usa, alergias, preferencias…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-cocoa">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-cocoa">Todavía no hay clientes VIP.</p>
        ) : (
          rows.map((c) => (
            <div
              key={c.id}
              className="group relative border border-ink bg-cream p-5"
            >
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="u-mono absolute right-3 top-3 text-xs uppercase text-cocoa opacity-0 transition-opacity link-underline group-hover:opacity-100"
              >
                Quitar
              </button>
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-ink"
                  style={{ backgroundColor: c.colorHex ?? "#d9cdb8" }}
                />
                <div>
                  <p className="font-display text-lg leading-tight">{c.name}</p>
                  <p className="u-mono text-xs text-cocoa">{c.hairColor}</p>
                </div>
              </div>
              {c.notes && (
                <p className="mt-3 text-sm text-cocoa">{c.notes}</p>
              )}
              {c.phone && (
                <p className="u-mono mt-3 text-xs text-cocoa">{c.phone}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
