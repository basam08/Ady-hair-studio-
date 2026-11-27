"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  salon,
  formatPriceCents,
  formatDuration,
  canStylistPerform,
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

type GenderKey = "mujer" | "hombre" | "nino";

interface GenderDef {
  key: GenderKey;
  label: string;
  matches: (category: string) => boolean;
  icon: React.ReactNode;
}

function VenusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="13" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8.5" y1="17" x2="15.5" y2="17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MarsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="15" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12.5" y1="11.5" x2="19" y2="5" stroke="currentColor" strokeWidth="1.5" />
      <polyline
        points="13,5 19,5 19,11"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function ChildIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 20c0-4.5 2.5-7.5 5.5-7.5s5.5 3 5.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

const GENDERS: GenderDef[] = [
  {
    key: "mujer",
    label: "Mujer",
    matches: (c) => c.startsWith("Mujer"),
    icon: <VenusIcon />,
  },
  {
    key: "hombre",
    label: "Hombre",
    matches: (c) => c === "Hombre",
    icon: <MarsIcon />,
  },
  {
    key: "nino",
    label: "Niño/a",
    matches: (c) => c === "Niños",
    icon: <ChildIcon />,
  },
];

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

const STEP_LABELS = ["Género", "Peluquero", "Servicios", "Extras", "Fecha", "Hora", "Datos"];

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

  const initialService = useMemo(
    () =>
      initialServiceSlug
        ? primaryServices.find((s) => s.slug === initialServiceSlug) ?? null
        : null,
    [primaryServices, initialServiceSlug],
  );
  const initialGender = initialService
    ? GENDERS.find((g) => g.matches(initialService.category))?.key ?? null
    : null;

  const [step, setStep] = useState(initialGender ? 2 : 1);
  const [gender, setGender] = useState<GenderKey | null>(initialGender);
  const [stylistSlug, setStylistSlug] = useState<string | null>(null);
  const [selectedServiceSlugs, setSelectedServiceSlugs] = useState<string[]>(
    initialService ? [initialService.slug] : [],
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
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

  const genderDef = useMemo(
    () => GENDERS.find((g) => g.key === gender) ?? null,
    [gender],
  );
  const genderServices = useMemo(
    () => (genderDef ? primaryServices.filter((s) => genderDef.matches(s.category)) : []),
    [primaryServices, genderDef],
  );
  const eligibleStylists = useMemo(
    () =>
      genderDef
        ? stylists.filter((st) =>
            genderServices.some((s) => canStylistPerform(st.slug, s)),
          )
        : [],
    [stylists, genderDef, genderServices],
  );

  const stylist = useMemo(
    () => stylists.find((s) => s.slug === stylistSlug) ?? null,
    [stylists, stylistSlug],
  );
  const selectedServices = useMemo(
    () => primaryServices.filter((s) => selectedServiceSlugs.includes(s.slug)),
    [primaryServices, selectedServiceSlugs],
  );
  const extras = useMemo(
    () => extraServices.filter((e) => selectedExtras.includes(e.slug)),
    [extraServices, selectedExtras],
  );
  const eligibleExtras = useMemo(
    () =>
      stylistSlug && genderDef
        ? extraServices.filter(
            (e) => genderDef.matches(e.category) && canStylistPerform(stylistSlug, e),
          )
        : [],
    [extraServices, stylistSlug, genderDef],
  );
  const allItems = useMemo(
    () => [...selectedServices, ...extras],
    [selectedServices, extras],
  );

  const totalPriceCents = useMemo(
    () => allItems.reduce((sum, i) => sum + i.priceCents, 0),
    [allItems],
  );
  // Si algo de lo elegido es "Desde", la suma también lo es.
  const totalPriceFrom = allItems.some((i) => i.priceFrom);
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
    for (const s of genderServices) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return [...map.entries()];
  }, [genderServices]);

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

  function chooseGender(g: GenderKey) {
    if (g !== gender) {
      setStylistSlug(null);
      setSelectedServiceSlugs([]);
      setSelectedExtras([]);
    }
    setGender(g);
    setSlot(null);
    setStep(2);
  }

  function chooseStylist(s: StylistItem) {
    if (s.slug !== stylistSlug) {
      setSelectedServiceSlugs([]);
      setSelectedExtras([]);
    }
    setStylistSlug(s.slug);
    setSlot(null);
    setStep(3);
  }

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
    setSlot(null);
  }

  function goAfterServices() {
    setStep(eligibleExtras.length > 0 ? 4 : 5);
  }

  function toggleExtra(slug: string) {
    setSelectedExtras((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    setSlot(null);
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
          setStep(6);
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
      <ol className="mb-10 grid grid-cols-4 gap-px border border-line bg-line sm:grid-cols-7">
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

      {/* Paso 1: género */}
      {step === 1 && (
        <div>
          <p className="mb-6 max-w-lg text-sm text-cocoa">
            Para empezar, dinos para quién es la cita. Así solo te
            mostraremos los servicios y peluqueros que correspondan.
          </p>
          <div className="mx-auto grid max-w-md gap-px border border-line bg-line sm:grid-cols-3">
            {GENDERS.map((g) => {
              const active = gender === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => chooseGender(g.key)}
                  className={`flex items-center gap-3 p-5 text-left transition-colors ${
                    active ? "bg-ink text-oat" : "bg-oat hover:bg-cream"
                  }`}
                >
                  {g.icon}
                  <span className="font-display text-xl">{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Paso 2: peluquero */}
      {step === 2 && genderDef && (
        <div>
          <SelectedGender label={genderDef.label} icon={genderDef.icon} onChange={() => setStep(1)} />
          <p className="mt-6 mb-6 max-w-lg text-sm text-cocoa">
            Elige ahora con quién quieres tu cita. Cada peluquero tiene
            servicios distintos, y te lo indicaremos si eliges algo que no
            hace él o ella.
          </p>
          <div
            className={`mx-auto grid gap-px border border-line bg-line ${
              eligibleStylists.length <= 2 ? "max-w-md sm:grid-cols-2" : "sm:grid-cols-3"
            }`}
          >
            {eligibleStylists.map((s) => {
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
        </div>
      )}

      {/* Paso 3: servicios (se puede elegir más de uno) */}
      {step === 3 && genderDef && stylist && (
        <div>
          <SelectedGender label={genderDef.label} icon={genderDef.icon} onChange={() => setStep(1)} />
          <SelectedStylist stylist={stylist} onChange={() => setStep(2)} />
          <p className="mt-6 mb-6 max-w-lg text-sm text-cocoa">
            Puedes elegir más de un servicio para la misma cita — se
            reservan juntos, uno detrás de otro.
          </p>
          {grouped.map(([category, items]) => (
            <fieldset key={category} className="mb-8">
              <legend className="u-eyebrow mb-3">{category}</legend>
              <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
                {items.map((s) => {
                  const active = selectedServiceSlugs.includes(s.slug);
                  const eligible = canStylistPerform(stylist.slug, s);
                  const otherNames = eligible
                    ? []
                    : stylists
                        .filter(
                          (st) =>
                            st.slug !== stylist.slug &&
                            canStylistPerform(st.slug, s),
                        )
                        .map((st) => st.name);
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      disabled={!eligible}
                      onClick={() => toggleService(s)}
                      aria-pressed={active}
                      className={`p-5 text-left transition-colors ${
                        !eligible
                          ? "cursor-not-allowed bg-oat/50 opacity-60"
                          : active
                            ? "bg-ink text-oat"
                            : "bg-oat hover:bg-cream"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-display text-xl">{s.name}</span>
                        {s.bookableOnline && eligible && (
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
                        {!eligible
                          ? `Este servicio sí está disponible, pero lo hace ${otherNames.join(" o ")}`
                          : s.bookableOnline
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
                {servicesLabel} · {priceLabel({
                  priceCents: selectedServices.reduce((s, i) => s + i.priceCents, 0),
                  priceFrom: selectedServices.some((i) => i.priceFrom),
                })}{" "}
                ·{" "}
                {formatDuration(
                  selectedServices.reduce((s, i) => s + i.durationMin, 0),
                )}
              </span>
              <button type="button" className="btn btn-primary" onClick={goAfterServices}>
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paso 4: extras opcionales */}
      {step === 4 && genderDef && stylist && selectedServices.length > 0 && (
        <div>
          <SelectedGender label={genderDef.label} icon={genderDef.icon} onChange={() => setStep(1)} />
          <SelectedStylist stylist={stylist} onChange={() => setStep(2)} />
          <SelectedService
            name={servicesLabel}
            priceCents={selectedServices.reduce((s, i) => s + i.priceCents, 0)}
            priceFrom={selectedServices.some((i) => i.priceFrom)}
            durationMin={selectedServices.reduce((s, i) => s + i.durationMin, 0)}
            onChange={() => setStep(3)}
          />
          <fieldset className="mt-6">
            <legend className="u-eyebrow mb-3">
              ¿Quieres añadir algún extra? (opcional)
            </legend>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {eligibleExtras.map((e) => {
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
                Total: {priceLabel({ priceCents: totalPriceCents, priceFrom: totalPriceFrom })} ·{" "}
                {formatDuration(totalDurationMin)}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(5)}
              >
                Continuar →
              </button>
            </div>
          </fieldset>
          <button
            type="button"
            className="btn btn-ghost mt-8"
            onClick={() => setStep(3)}
          >
            ← Cambiar servicios
          </button>
        </div>
      )}

      {/* Paso 5: fecha */}
      {step === 5 && genderDef && stylist && selectedServices.length > 0 && (
        <div>
          <SelectedGender label={genderDef.label} icon={genderDef.icon} onChange={() => setStep(1)} />
          <SelectedStylist stylist={stylist} onChange={() => setStep(2)} />
          <SelectedService
            name={combinedName}
            priceCents={totalPriceCents}
            priceFrom={totalPriceFrom}
            durationMin={totalDurationMin}
            onChange={() => setStep(3)}
          />
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
                      setStep(6);
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
            onClick={() => setStep(eligibleExtras.length > 0 ? 4 : 3)}
          >
            ← Volver
          </button>
        </div>
      )}

      {/* Paso 6: hora */}
      {step === 6 && genderDef && stylist && selectedServices.length > 0 && selectedDate && (
        <div>
          <SelectedGender label={genderDef.label} icon={genderDef.icon} onChange={() => setStep(1)} />
          <SelectedStylist stylist={stylist} onChange={() => setStep(2)} />
          <SelectedService
            name={combinedName}
            priceCents={totalPriceCents}
            priceFrom={totalPriceFrom}
            durationMin={totalDurationMin}
            onChange={() => setStep(3)}
          />
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
                    setStep(7);
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
            onClick={() => setStep(5)}
          >
            ← Cambiar fecha
          </button>
        </div>
      )}

      {/* Paso 7: datos */}
      {step === 7 && stylist && selectedServices.length > 0 && selectedDate && slot && (
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
              · {priceLabel({ priceCents: totalPriceCents, priceFrom: totalPriceFrom })} ·{" "}
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
              <span className="field-label">Teléfono (opcional)</span>
              <input
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
              <p className="mt-1.5 text-xs text-cocoa">
                Si nos dejas tu email (puede ser de Gmail o el que uses), te
                mandamos la confirmación de la cita y un enlace para
                gestionarla luego. No es obligatorio para reservar.
              </p>
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
              onClick={() => setStep(6)}
            >
              ← Cambiar hora
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SelectedGender({
  label,
  icon,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between border border-line bg-cream px-4 py-3">
      <span className="flex items-center gap-2 u-mono text-sm">
        {icon}
        Para: {label}
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

function SelectedService({
  name,
  priceCents,
  priceFrom,
  durationMin,
  onChange,
}: {
  name: string;
  priceCents: number;
  priceFrom: boolean;
  durationMin: number;
  onChange: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-between border border-line bg-cream px-4 py-3">
      <span className="u-mono text-sm">
        {name} · {priceLabel({ priceCents, priceFrom })} ·{" "}
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
    <div className="flex items-center justify-between border border-line bg-cream px-4 py-3">
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
