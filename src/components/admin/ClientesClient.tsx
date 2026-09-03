"use client";

import { useEffect, useState } from "react";

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  visits: number;
  createdAt: string;
  lastVisit: { startsAt: string; serviceName: string } | null;
}

export function ClientesClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/clients?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setRows(d.clients ?? []))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mt-6">
      <input
        className="field max-w-sm"
        placeholder="Buscar por nombre, teléfono o email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="u-mono text-xs uppercase tracking-widest text-cocoa">
              <th className="border-b border-ink py-2 text-left">Cliente</th>
              <th className="border-b border-ink py-2 text-left">Contacto</th>
              <th className="border-b border-ink py-2 text-left">Visitas</th>
              <th className="border-b border-ink py-2 text-left">Última cita</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-cocoa">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-cocoa">
                  Sin clientes.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td className="border-b border-line py-3 pr-3">
                    {c.name}
                    {c.visits >= 4 && (
                      <span className="u-mono ml-2 bg-sage/25 px-1.5 py-0.5 text-[0.6rem] uppercase">
                        habitual
                      </span>
                    )}
                  </td>
                  <td className="border-b border-line py-3 pr-3 u-mono text-xs text-cocoa">
                    {c.phone}
                    {c.email && (
                      <>
                        <br />
                        {c.email}
                      </>
                    )}
                  </td>
                  <td className="border-b border-line py-3 pr-3 u-mono">
                    {c.visits}
                  </td>
                  <td className="border-b border-line py-3 u-mono text-xs text-cocoa">
                    {c.lastVisit
                      ? `${new Date(c.lastVisit.startsAt).toLocaleDateString(
                          "es-ES",
                          { day: "2-digit", month: "2-digit", year: "2-digit" },
                        )} · ${c.lastVisit.serviceName}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
