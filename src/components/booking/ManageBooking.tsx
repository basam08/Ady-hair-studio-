"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { salon, type WeekDay } from "@/config/salon";

interface Props {
  token: string;
  serviceSlug: string;
  stylistSlug: string | null;
  serviceName: string;
  startsAt: string;
  status: string;
  clientName: string;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function ManageBooking({
  token,
  serviceSlug,
  stylistSlug,
  serviceName,
  startsAt,
  status: initialStatus,
  clientName,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [mode, setMode] = useState<"idle" | "reschedule">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<{ time: string }[]>([]);
  const [time, setTime] = useState<string>("");

  // Fechas seleccionables para el <select> (próximos 30 días abiertos).
  const dateOptions = (() => {
    const out: string[] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 45 && out.length < 30; i++) {
      const day = new Date(d.getTime() + i * 86_400_000);
      const key = dateKey(day);
      const weekday = day.getDay() as WeekDay;
      if (salon.closedDates.includes(key)) continue;
      if ((salon.hours[weekday]?.length ?? 0) === 0) continue;
      out.push(key);
    }
    return out;
  })();

  useEffect(() => {
    if (!date) return;
    setSlots([]);
    setTime("");
    const stylistParam = stylistSlug
      ? `&stylist=${encodeURIComponent(stylistSlug)}`
      : "";
    fetch(
      `/api/availability?service=${encodeURIComponent(serviceSlug)}${stylistParam}&date=${date}`,
    )
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]));
  }, [date, serviceSlug, stylistSlug]);

  async function cancel() {
    if (!confirm("¿Seguro que quieres cancelar la cita?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo cancelar.");
        return;
      }
      setStatus("CANCELLED");
      setNotice("Cita cancelada. Te hemos enviado la confirmación.");
    } finally {
      setBusy(false);
    }
  }

  async function reschedule() {
    if (!date || !time) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", date, time }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo cambiar la cita.");
        return;
      }
      setNotice("Cita actualizada. Revisa la nueva confirmación.");
      setMode("idle");
      setTimeout(() => location.reload(), 1200);
    } finally {
      setBusy(false);
    }
  }

  const when = new Date(startsAt).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <div className="border border-ink bg-cream p-6">
        <p className="u-eyebrow">Tu cita</p>
        <p className="font-display mt-3 text-3xl">{serviceName}</p>
        <p className="u-mono mt-2 text-sm text-cocoa">{when}</p>
        <p className="mt-1 text-sm text-cocoa">A nombre de {clientName}</p>
        <p className="u-mono mt-3 text-xs uppercase tracking-widest">
          Estado:{" "}
          <span
            className={
              status === "CANCELLED" ? "text-persimmon" : "text-ink"
            }
          >
            {status === "CANCELLED"
              ? "Cancelada"
              : status === "COMPLETED"
                ? "Completada"
                : "Confirmada"}
          </span>
        </p>
      </div>

      {notice && (
        <p className="mt-4 border border-sage bg-sage/15 px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 border border-persimmon bg-persimmon/10 px-4 py-3 text-sm text-persimmon-dark"
        >
          {error}
        </p>
      )}

      {status === "CONFIRMED" && (
        <div className="mt-6">
          {mode === "idle" ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode("reschedule")}
              >
                Cambiar día u hora
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={cancel}
              >
                Cancelar cita
              </button>
            </div>
          ) : (
            <div className="border border-line bg-cream p-5">
              <p className="u-eyebrow">Nuevo hueco</p>
              <label className="field-label mt-4">Día</label>
              <select
                className="field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              >
                <option value="">Elige un día…</option>
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d + "T12:00:00").toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              {date && (
                <>
                  <label className="field-label mt-4">Hora</label>
                  {slots.length === 0 ? (
                    <p className="text-sm text-cocoa">Sin huecos ese día.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => setTime(s.time)}
                          className={`u-mono border border-line py-2 text-sm ${
                            time === s.time
                              ? "bg-persimmon text-cream"
                              : "bg-oat"
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!date || !time || busy}
                  onClick={reschedule}
                >
                  Guardar cambio
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setMode("idle")}
                >
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "CANCELLED" && (
        <Link href="/reservar" className="btn btn-primary mt-6">
          Reservar de nuevo
        </Link>
      )}
    </div>
  );
}
