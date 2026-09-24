"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  salon,
  formatPriceCents,
  formatDuration,
  type WeekDay,
} from "@/config/salon";

interface ServiceItem {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  durationMin: number;
  category: string;
  bookableOnline: boolean;
  isExtra: boolean;
  priceFrom: boolean;
}

interface StylistItem {
  slug: string;
  name: string;
  role: string;
}

interface Slot {
  time: string;
  startsAt: string;
  endsAt: string;
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function isSelectableDay(d: Date, today: Date, maxDate: Date): boolean {
  if (d < today || d > maxDate) return false;
  const key = dateKey(d);
  if (salon.closedDates.includes(key)) return false;
  const weekday = d.getDay() as WeekDay;
  return (salon.hours[weekday]?.length ?? 0) > 0;
}

function priceLabel(item: { priceCents: number; priceFrom: boolean }): string {
  return `${item.priceFrom ? "Desde " : ""}${formatPriceCents(item.priceCents)}`;
}

const STEP_LABELS = ["Servicios", "Extras", "Peluquero", "Fecha", "Hora", "Datos"];

export function BookingWizard({
  services,
  stylists,
  initialServiceSlug,
}: {
  services: ServiceItem[];
  stylists: StylistItem[];
  initialServiceSlug?: string;
}) {
  const primaryServices = useMemo(
    () => services.filter((s) => !s.isExtra),
    [services],
  );
  const extraServices = useMemo(
    () => services.filter((s) => s.isExtra),
    [services],
  );

  const [step, setStep] = useState(1);
  const [selectedServiceSlugs, setSelectedServiceSlugs] = useState<string[]>(
    initialServiceSlug && primaryServices.some((s) => s.slug === initialServiceSlug)
      ? [initialServiceSlug]
      : [],
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [stylistSlug, setStylistSlug] = useState<string | null>(null);
  const [whatsAppService, setWhatsAppService] = useState<ServiceItem | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    token: string;
    startsAt: string;
    serviceName: string;
    stylistName: string;
  } | null>(null);

  const selectedServices = useMemo(
    () => primaryServices.filter((s) => selectedServiceSlugs.includes(s.slug)),
    [primaryServices, selectedServiceSlugs],
  );
  const stylist = useMemo(
    () => stylists.find((s) => s.slug === stylistSlug) ?? null,
    [stylists, stylistSlug],
  );
  const extras = useMemo(
    () => extraServices.filter((e) => selectedExtras.includes(e.slug)),
    [extraServices, selectedExtras],
  );
  const allItems = useMemo(
    () => [...selectedServices, ...extras],
    [selectedServices, extras],
  );

  const totalPriceCents = useMemo(
    () => allItems.reduce((sum, i) => sum + i.priceCents, 0),
    [allItems],
  );
  const totalDurationMin = useMemo(
    () => allItems.reduce((sum, i) => sum + i.durationMin, 0),
    [allItems],
  );
  const combinedName = useMemo(
    () => allItems.map((i) => i.name).join(" + "),
    [allItems],
  );
  const servicesLabel = useMemo(
    () => selectedServices.map((s) => s.name).join(" + "),
    [selectedServices],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    for (const s of primaryServices) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return [...map.entries()];
  }, [primaryServices]);

  // Calendario
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(
    () => new Date(today.getTime() + salon.maxLeadDays * 86_400_000),
    [today],
  );
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  const calendarDays = useMemo(() => {
    const first = new Date(viewMonth);
    const startWeekday = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(
      viewMonth.getFullYear(),
      viewMonth.getMonth() + 1,
      0,
    ).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
    }
    return cells;
  }, [viewMonth]);

  // Todo lo elegido salvo el primer servicio (que es el "principal" para la
  // API): el resto de servicios + los extras.
  const primarySlug = selectedServiceSlugs[0] ?? null;
  const restSlugs = [...selectedServiceSlugs.slice(1), ...selectedExtras];
  const restKey = [...restSlugs].sort().join(",");

  // Cargar huecos cuando hay servicio + peluquero + fecha
  useEffect(() => {
    if (!primarySlug || !stylistSlug || !selectedDate) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    setSlot(null);
    const extrasParam = restKey ? `&extras=${encodeURIComponent(restKey)}` : "";
    fetch(
      `/api/availability?service=${encodeURIComponent(
        primarySlug,
      )}${extrasParam}&stylist=${encodeURIComponent(stylistSlug)}&date=${selectedDate}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primarySlug, stylistSlug, selectedDate, restKey]);

  function toggleService(s: ServiceItem) {
    if (!s.bookableOnline) {
      setWhatsAppService(s);
      return;
    }
    setWhatsAppService(null);
    setSelectedServiceSlugs((prev) =>
      prev.includes(s.slug)
        ? prev.filter((slug) => slug !== s.slug)
        : [...prev, s.slug],
    );
    setStylistSlug(null);
    setSlot(null);
  }

  function goToStep2() {
    setStep(extraServices.length > 0 ? 2 : 3);
  }

  function toggleExtra(slug: string) {
    setSelectedExtras((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    setSlot(null);
  }

  function chooseStylist(s: StylistItem) {
    setStylistSlug(s.slug);
    setSlot(null);
    setStep(4);
  }

  async function submit() {
    if (!primarySlug || !stylist || !selectedDate || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: primarySlug,
          extraSlugs: restSlugs,
          stylistSlug: stylist.slug,
          date: selectedDate,
          time: slot.time,
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          note: form.note || undefined,
          consent: form.consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo completar la reserva.");
        if (data?.error?.code === "SLOT_TAKEN") {
          setStep(5);
          setSelectedDate((d) => d); // fuerza recarga de huecos
        }
        return;
      }
      setConfirmation({
        token: data.manageToken,
        startsAt: data.startsAt,
        serviceName: data.serviceName,
        stylistName: stylist.name,
      });
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    const when = new Date(confirmation.startsAt).toLocaleString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <div className="border border-ink bg-cream p-8 md:p-12">
        <p className="u-eyebrow text-persimmon">Cita confirmada</p>
        <h2 className="font-display mt-4 text-4xl">Nos vemos pronto</h2>
        <p className="mt-4 text-cocoa">
          {confirmation.serviceName} con {confirmation.stylistName} ·{" "}
          <span className="u-mono">{when}</span>
        </p>
        <p className="mt-2 text-sm text-cocoa">
          {form.email
            ? "Te hemos enviado la confirmación por email. El día de la cita recibirás un recordatorio."
            : "Guarda este enlace para gestionar tu cita: no nos diste un email para enviarte la confirmación."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/reserva/${confirmation.token}`}
            className="btn btn-primary"
          >
            Gestionar mi cita
          </Link>
          <Link href="/" className="btn btn-ghost">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pasos */}
      <ol className="mb-10 grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-6">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <li
              key={label}
              className={`bg-oat px-3 py-3 ${active ? "bg-cream" : ""}`}
            >
              <span
                className={`u-mono text-xs ${
                  active ? "text-persimmon" : done ? "text-ink" : "text-cocoa"
                }`}
              >
                {String(n).padStart(2, "0")}
              </span>
              <p
                className={`mt-1 text-sm ${
                  active ? "text-ink" : "text-cocoa"
                }`}
              >
                {label}
              </p>
            </li>
          );
        })}
      </ol>

      {error && (
        <div
          role="alert"
          className="mb-6 border border-persimmon bg-persimmon/10 px-4 py-3 text-sm text-persimmon-dark"
        >
          {error}
        </div>
      )}

      {/* Paso 1: servicios (se puede elegir más de uno) */}
      {step === 1 && (
        <div>
          <p className="mb-6 max-w-lg text-sm text-cocoa">
            Puedes elegir más de un servicio para la misma cita — se
            reservan juntos, uno detrás de otro.
          </p>
          {grouped.map(([category, items]) => (
            <fieldset key={category} className="mb-8">
              <legend className="u-eyebrow mb-3">{category}</legend>
              <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
                {items.map((s) => {
                  const active = selectedServiceSlugs.includes(s.slug);
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => toggleService(s)}
                      aria-pressed={active}
                      className={`p-5 text-left transition-colors ${
                        active ? "bg-ink text-oat" : "bg-oat hover:bg-cream"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-display text-xl">{s.name}</span>
                        {s.bookableOnline && (
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center border u-mono text-xs ${
                              active ? "border-oat bg-oat text-ink" : "border-line"
                            }`}
                          >
                            {active ? "✓" : "+"}
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-1 text-sm ${active ? "text-oat/70" : "text-cocoa"}`}
                      >
                        {s.description}
                      </p>
                      <p
                        className={`u-mono mt-2 text-xs ${active ? "text-oat/70" : "text-cocoa"}`}
                      >
                        {s.bookableOnline
                          ? `${priceLabel(s)} · ${formatDuration(s.durationMin)}`
                          : "Consulta previa por WhatsApp"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {whatsAppService && (
            <div className="mt-2 border border-ink bg-cream p-5">
              <p className="font-display text-xl">
                {whatsAppService.name} no se reserva online
              </p>
              <p className="mt-2 text-sm text-cocoa">
                Este servicio necesita valorar tu pelo antes de dar hora.
                Escríbenos por WhatsApp y te lo organizamos.
              </p>
              <a
                href={`https://wa.me/${salon.contact.whatsapp}?text=${encodeURIComponent(
                  `Hola ${salon.name}, quiero pedir cita para ${whatsAppService.name}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-4"
              >
                Escribir por WhatsApp
              </a>
            </div>
          )}

          {selectedServices.length > 0 && (
            <div className="sticky bottom-4 mt-2 flex flex-wrap items-center justify-between gap-3 border border-ink bg-cream px-5 py-4 shadow-md">
              <span className="u-mono text-sm">
                {servicesLabel} · {formatPriceCents(
                  selectedServices.reduce((s, i) => s + i.priceCents, 0),
                )}{" "}
                ·{" "}
                {formatDuration(
                  selectedServices.reduce((s, i) => s + i.durationMin, 0),
                )}
              </span>
              <button type="button" className="btn btn-primary" onClick={goToStep2}>
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: extras opcionales */}
      {step === 2 && selectedServices.length > 0 && (
        <div>
          <SelectedService
            name={servicesLabel}
            priceCents={selectedServices.reduce((s, i) => s + i.priceCents, 0)}
            durationMin={selectedServices.reduce((s, i) => s + i.durationMin, 0)}
            onChange={() => setStep(1)}
          />
          <fieldset className="mt-6">
            <legend className="u-eyebrow mb-3">
              ¿Quieres añadir algún extra? (opcional)
            </legend>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {extraServices.map((e) => {
                const active = selectedExtras.includes(e.slug);
                return (
                  <button
                    key={e.slug}
                    type="button"
                    onClick={() => toggleExtra(e.slug)}
                    aria-pressed={active}
                    className={`p-5 text-left transition-colors ${
                      active ? "bg-ink text-oat" : "bg-oat hover:bg-cream"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-xl">{e.name}</span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center border u-mono text-xs ${
                          active ? "border-oat bg-oat text-ink" : "border-line"
                        }`}
                      >
                        {active ? "✓" : "+"}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-sm ${active ? "text-oat/70" : "text-cocoa"}`}
                    >
                      {e.description}
                    </p>
                    <p
                      className={`u-mono mt-2 text-xs ${active ? "text-oat/70" : "text-cocoa"}`}
                    >
                      + {priceLabel(e)} · {formatDuration(e.durationMin)}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-ink bg-cream px-5 py-4">
              <span className="u-mono text-sm">
                Total: {formatPriceCents(totalPriceCents)} ·{" "}
                {formatDuration(totalDurationMin)}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(3)}
              >
                Continuar →
              </button>
            </div>
          </fieldset>
          <button
            type="button"
            className="btn btn-ghost mt-8"
            onClick={() => setStep(1)}
          >
            ← Cambiar servicios
          </button>
        </div>
      )}

      {/* Paso 3: peluquero */}
      {step === 3 && selectedServices.length > 0 && (
        <div>
          <SelectedService
            name={combinedName}
            priceCents={totalPriceCents}
            durationMin={totalDurationMin}
            onChange={() => setStep(1)}
          />
          <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
            {stylists.map((s) => {
              const active = stylistSlug === s.slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => chooseStylist(s)}
                  className={`p-5 text-left transition-colors ${
                    active ? "bg-ink text-oat" : "bg-oat hover:bg-cream"
                  }`}
                >
                  <span className="font-display text-xl">{s.name}</span>
                  <p className={`mt-1 text-sm ${active ? "text-oat/70" : "text-cocoa"}`}>
                    {s.role}
                  </p>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-8"
            onClick={() => setStep(extraServices.length > 0 ? 2 : 1)}
          >
            ← Volver
          </button>
        </div>
      )}

      {/* Paso 4: fecha */}
      {step === 4 && selectedServices.length > 0 && stylist && (
        <div>
          <SelectedService
            name={combinedName}
            priceCents={totalPriceCents}
            durationMin={totalDurationMin}
            onChange={() => setStep(1)}
          />
          <SelectedStylist stylist={stylist} onChange={() => setStep(3)} />
          <div className="mt-6 max-w-sm">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="u-mono text-xs uppercase tracking-widest disabled:opacity-30"
                disabled={
                  viewMonth.getFullYear() === today.getFullYear() &&
                  viewMonth.getMonth() === today.getMonth()
                }
                onClick={() =>
                  setViewMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                  )
                }
              >
                ← Mes
              </button>
              <span className="u-mono text-sm">
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </span>
              <button
                type="button"
                className="u-mono text-xs uppercase tracking-widest disabled:opacity-30"
                disabled={
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) >
                  maxDate
                }
                onClick={() =>
                  setViewMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                  )
                }
              >
                Mes →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1">
              {WEEK_LABELS.map((w) => (
                <span
                  key={w}
                  className="u-mono py-1 text-center text-xs text-cocoa"
                >
                  {w}
                </span>
              ))}
              {calendarDays.map((d, i) => {
                if (!d) return <span key={`empty-${i}`} />;
                const key = dateKey(d);
                const selectable = isSelectableDay(d, today, maxDate);
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!selectable}
                    onClick={() => {
                      setSelectedDate(key);
                      setStep(5);
                    }}
                    className={`aspect-square u-mono text-sm transition-colors ${
                      isSelected
                        ? "bg-persimmon text-cream"
                        : selectable
                          ? "bg-cream hover:bg-ink hover:text-oat"
                          : "text-cocoa/30"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-8"
            onClick={() => setStep(3)}
          >
            ← Cambiar peluquero
          </button>
        </div>
      )}

      {/* Paso 5: hora */}
      {step === 5 && selectedServices.length > 0 && stylist && selectedDate && (
        <div>
          <SelectedService
            name={combinedName}
            priceCents={totalPriceCents}
            durationMin={totalDurationMin}
            onChange={() => setStep(1)}
          />
          <SelectedStylist stylist={stylist} onChange={() => setStep(3)} />
          <p className="u-mono mt-4 text-sm">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>

          {loadingSlots ? (
            <p className="mt-6 text-sm text-cocoa">Buscando huecos…</p>
          ) : slots.length === 0 ? (
            <p className="mt-6 text-sm text-cocoa">
              No quedan huecos ese día con {stylist.name}. Prueba con otra
              fecha o cambia de peluquero.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  onClick={() => {
                    setSlot(s);
                    setStep(6);
                  }}
                  className={`u-mono border border-line py-2 text-sm transition-colors hover:bg-ink hover:text-oat ${
                    slot?.startsAt === s.startsAt
                      ? "bg-persimmon text-cream"
                      : "bg-cream"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn btn-ghost mt-8"
            onClick={() => setStep(4)}
          >
            ← Cambiar fecha
          </button>
        </div>
      )}

      {/* Paso 6: datos */}
      {step === 6 && selectedServices.length > 0 && stylist && selectedDate && slot && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="border border-line bg-cream p-5">
            <p className="font-display text-xl">{combinedName}</p>
            <p className="u-mono mt-1 text-sm text-cocoa">
              Con {stylist.name} ·{" "}
              {new Date(slot.startsAt).toLocaleString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {formatPriceCents(totalPriceCents)} ·{" "}
              {formatDuration(totalDurationMin)}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Nombre *</span>
              <input
                required
                minLength={2}
                maxLength={80}
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="field-label">Teléfono *</span>
              <input
                required
                type="tel"
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Email (opcional)</span>
              <input
                type="email"
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Nota para el peluquero (opcional)</span>
              <textarea
                rows={3}
                maxLength={500}
                className="field"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 text-sm text-cocoa">
            <input
              type="checkbox"
              required
              className="mt-1"
              checked={form.consent}
              onChange={(e) =>
                setForm({ ...form, consent: e.target.checked })
              }
            />
            <span>
              He leído y acepto la{" "}
              <Link href="/privacidad" className="link-underline text-ink">
                política de privacidad
              </Link>
              . Mis datos se usan solo para gestionar esta cita.
            </span>
          </label>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Confirmando…" : "Confirmar cita"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep(5)}
            >
              ← Cambiar hora
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SelectedService({
  name,
  priceCents,
  durationMin,
  onChange,
}: {
  name: string;
  priceCents: number;
  durationMin: number;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between border border-line bg-cream px-4 py-3">
      <span className="u-mono text-sm">
        {name} · {formatPriceCents(priceCents)} ·{" "}
        {formatDuration(durationMin)}
      </span>
      <button
        type="button"
        onClick={onChange}
        className="u-mono text-xs uppercase tracking-widest link-underline"
      >
        Cambiar
      </button>
    </div>
  );
}

function SelectedStylist({
  stylist,
  onChange,
}: {
  stylist: StylistItem;
  onChange: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between border border-line bg-cream px-4 py-3">
      <span className="u-mono text-sm">Con {stylist.name}</span>
      <button
        type="button"
        onClick={onChange}
        className="u-mono text-xs uppercase tracking-widest link-underline"
      >
        Cambiar
      </button>
    </div>
  );
}
