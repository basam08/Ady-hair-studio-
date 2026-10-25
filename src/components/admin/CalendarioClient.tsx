"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { salon, type WeekDay } from "@/config/salon";
import { formatHhMm, formatTimeInZone, parseHhMm } from "@/lib/time";
import {
  BookingForm,
  valuesFromBooking,
  type Booking,
  type BookingFormValues,
} from "@/components/admin/ReservasClient";

interface FormState {
  mode: "create" | "edit";
  id?: string;
  values: BookingFormValues;
}

type ViewMode = "day" | "week";

const ROW_PX = 20; // alto de cada franja de 15 min
const SLOT_MIN = 15;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // semana empieza en lunes
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function CalendarioClient({
  services,
  stylists,
}: {
  services: { slug: string; name: string }[];
  stylists: { slug: string; name: string }[];
}) {
  const [mode, setMode] = useState<ViewMode>("day");
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [calMonth, setCalMonth] = useState(() => anchor);

  // El mini calendario sigue al día/semana activa cuando se navega desde
  // los controles principales (Hoy / ← / →), pero se puede hojear mes a
  // mes por separado sin mover la vista principal.
  useEffect(() => {
    setCalMonth(anchor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey(anchor)]);

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const rangeFrom = mode === "day" ? anchor : weekStart;
  const rangeTo = useMemo(
    () => addDays(rangeFrom, mode === "day" ? 1 : 7),
    [rangeFrom, mode],
  );

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/bookings?from=${dateKey(rangeFrom)}&to=${dateKey(rangeTo)}&status=ALL`)
      .then((r) => r.json())
      .then((d) =>
        setBookings((d.bookings ?? []).filter((b: Booking) => b.status !== "CANCELLED")),
      )
      .finally(() => setLoading(false));
  }, [rangeFrom, rangeTo]);

  useEffect(load, [load]);

  function openAddForm(stylistSlug: string, date: Date, time: string) {
    setFormState({
      mode: "create",
      values: {
        serviceSlug: "",
        extraSlugs: [],
        stylistSlug,
        date: dateKey(date),
        time,
        endTime: "",
        name: "",
        phone: "",
        email: "",
        note: "",
      },
    });
  }

  function openEditForm(b: Booking) {
    setFormState({ mode: "edit", id: b.id, values: valuesFromBooking(b, stylists) });
  }

  async function cancelBooking(id: string) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      setFormState(null);
      load();
    }
  }

  function step(dir: 1 | -1) {
    setAnchor((d) => addDays(d, (mode === "day" ? 1 : 7) * dir));
  }

  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setAnchor(d);
  }

  const label =
    mode === "day"
      ? new Intl.DateTimeFormat("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(anchor)
      : `${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
          weekStart,
        )} – ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
          addDays(weekStart, 6),
        )}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Calendario</h1>
        <div className="flex gap-2">
          {(["day", "week"] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`u-mono border border-line px-3 py-1.5 text-xs uppercase tracking-widest ${
                mode === m ? "bg-ink text-oat" : "bg-cream"
              }`}
            >
              {m === "day" ? "Día" : "7 días"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => step(-1)}
            className="u-mono border border-line px-2 py-1 text-sm"
          >
            ←
          </button>
          <button
            type="button"
            onClick={today}
            className="u-mono border border-line px-3 py-1 text-xs uppercase tracking-widest"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            className="u-mono border border-line px-2 py-1 text-sm"
          >
            →
          </button>
          <p className="font-display text-lg capitalize">{label}</p>
        </div>
        {loading && <p className="u-mono text-xs text-cocoa">Cargando…</p>}
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <MiniMonthCalendar
          monthAnchor={calMonth}
          selected={anchor}
          onSelectDate={(d) => {
            setAnchor(d);
            setMode("day");
          }}
          onMonthChange={setCalMonth}
        />
        <div className="min-w-0 flex-1 overflow-x-auto">
          {mode === "day" ? (
            <DayGrid
              date={anchor}
              stylists={stylists}
              bookings={bookings}
              onSlotClick={openAddForm}
              onBookingClick={openEditForm}
            />
          ) : (
            <WeekAgenda
              weekStart={weekStart}
              stylists={stylists}
              bookings={bookings}
              onAdd={openAddForm}
              onBookingClick={openEditForm}
            />
          )}
        </div>
      </div>

      {formState && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 py-10"
          onClick={() => setFormState(null)}
        >
          <div
            className="w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <BookingForm
              services={services}
              stylists={stylists}
              initial={formState.values}
              endpoint={
                formState.mode === "create"
                  ? "/api/admin/bookings"
                  : `/api/admin/bookings/${formState.id}`
              }
              method={formState.mode === "create" ? "POST" : "PUT"}
              submitLabel={formState.mode === "create" ? "Crear cita" : "Guardar cambios"}
              onCancel={() => setFormState(null)}
              onDone={() => {
                setFormState(null);
                load();
              }}
            />
            {formState.mode === "edit" && formState.id && (
              <button
                type="button"
                onClick={() => cancelBooking(formState.id!)}
                className="u-mono mt-3 w-full border border-persimmon bg-cream py-2 text-xs uppercase tracking-widest text-persimmon hover:bg-persimmon/10"
              >
                Cancelar esta cita
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniMonthCalendar({
  monthAnchor,
  selected,
  onSelectDate,
  onMonthChange,
}: {
  monthAnchor: Date;
  selected: Date;
  onSelectDate: (d: Date) => void;
  onMonthChange: (d: Date) => void;
}) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full shrink-0 border border-line bg-cream p-3 lg:w-56">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="u-mono px-1 text-sm"
        >
          ←
        </button>
        <p className="font-display text-sm capitalize">
          {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
            monthAnchor,
          )}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="u-mono px-1 text-sm"
        >
          →
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <span key={i} className="u-mono text-[10px] text-cocoa">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const isToday = d.getTime() === today.getTime();
          const isSelected = dateKey(d) === dateKey(selected);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                isSelected
                  ? "bg-ink text-oat"
                  : isToday
                    ? "border border-ink"
                    : "hover:bg-oat"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayGrid({
  date,
  stylists,
  bookings,
  onSlotClick,
  onBookingClick,
}: {
  date: Date;
  stylists: { slug: string; name: string }[];
  bookings: Booking[];
  onSlotClick: (stylistSlug: string, date: Date, time: string) => void;
  onBookingClick: (b: Booking) => void;
}) {
  const weekday = date.getDay() as WeekDay;
  const blocks = salon.hours[weekday] ?? [];
  const dayBookings = bookings.filter((b) => dateKey(new Date(b.startsAt)) === dateKey(date));

  if (blocks.length === 0) {
    return (
      <p className="border border-line bg-cream px-4 py-10 text-center text-cocoa">
        Cerrado este día.
      </p>
    );
  }

  const openMin = Math.min(...blocks.map((b) => parseHhMm(b.open)));
  const closeMin = Math.max(...blocks.map((b) => parseHhMm(b.close)));
  const pxPerMin = ROW_PX / SLOT_MIN;
  const gridHeight = (closeMin - openMin) * pxPerMin;

  const hourMarks: number[] = [];
  for (let m = Math.ceil(openMin / 60) * 60; m <= closeMin; m += 60) {
    hourMarks.push(m);
  }

  return (
    <div className="flex border border-line">
      <div className="w-12 shrink-0 border-r border-line">
        <div className="border-b border-ink bg-cream" style={{ height: 33 }} />
        <div className="relative" style={{ height: gridHeight }}>
          {hourMarks.map((m) => (
            <div
              key={m}
              className="u-mono absolute right-1 -translate-y-1/2 text-[10px] text-cocoa"
              style={{ top: (m - openMin) * pxPerMin }}
            >
              {formatHhMm(m)}
            </div>
          ))}
        </div>
      </div>
      {stylists.map((st, i) => (
        <StylistColumn
          key={st.slug}
          stylist={st}
          colorIndex={i}
          date={date}
          openMin={openMin}
          closeMin={closeMin}
          pxPerMin={pxPerMin}
          gridHeight={gridHeight}
          hourMarks={hourMarks}
          bookings={dayBookings.filter((b) => b.stylist?.slug === st.slug)}
          onSlotClick={onSlotClick}
          onBookingClick={onBookingClick}
        />
      ))}
    </div>
  );
}

// Un color de marca por peluquero (ciclo si hubiera más de dos), para
// diferenciar sus citas a golpe de vista sin salirse de la paleta.
const STYLIST_COLORS = [
  { block: "bg-ink hover:bg-walnut", dot: "bg-ink" },
  { block: "bg-walnut hover:bg-ink", dot: "bg-walnut" },
];

interface LaidOutBooking {
  booking: Booking;
  col: number;
  colCount: number;
}

// Si el admin solapa citas a propósito (p. ej. tinte en reposo mientras
// atiende a otro cliente), las coloca una al lado de otra en vez de una
// encima de otra, como hace Google Calendar. Cálculo directo por pares
// (la lista de citas de un día para un peluquero siempre es pequeña).
function layoutOverlaps(bookings: Booking[]): LaidOutBooking[] {
  const items = bookings.map((b) => {
    const start = new Date(b.startsAt).getTime();
    return { booking: b, start, end: start + b.durationMin * 60_000 };
  });

  function overlaps(a: (typeof items)[number], b: (typeof items)[number]): boolean {
    return a.start < b.end && b.start < a.end;
  }

  const sorted = [...items].sort((a, b) => a.start - b.start);
  const colOf = new Map<(typeof items)[number], number>();
  for (const item of sorted) {
    const used = new Set(
      sorted
        .filter((other) => other !== item && colOf.has(other) && overlaps(item, other))
        .map((other) => colOf.get(other)!),
    );
    let col = 0;
    while (used.has(col)) col++;
    colOf.set(item, col);
  }

  return items.map((item) => {
    let colCount = 1;
    for (const other of items) {
      if (overlaps(item, other)) colCount = Math.max(colCount, colOf.get(other)! + 1);
    }
    return { booking: item.booking, col: colOf.get(item)!, colCount };
  });
}

function StylistColumn({
  stylist,
  colorIndex,
  date,
  openMin,
  closeMin,
  pxPerMin,
  gridHeight,
  hourMarks,
  bookings,
  onSlotClick,
  onBookingClick,
}: {
  stylist: { slug: string; name: string };
  colorIndex: number;
  date: Date;
  openMin: number;
  closeMin: number;
  pxPerMin: number;
  gridHeight: number;
  hourMarks: number[];
  bookings: Booking[];
  onSlotClick: (stylistSlug: string, date: Date, time: string) => void;
  onBookingClick: (b: Booking) => void;
}) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let minutes = openMin + offsetY / pxPerMin;
    minutes = Math.round(minutes / SLOT_MIN) * SLOT_MIN;
    minutes = Math.min(Math.max(minutes, openMin), closeMin - SLOT_MIN);
    onSlotClick(stylist.slug, date, formatHhMm(minutes));
  }

  const color = STYLIST_COLORS[colorIndex % STYLIST_COLORS.length];

  return (
    <div className="flex-1 border-r border-line last:border-r-0">
      <div className="flex items-center justify-center gap-2 border-b border-ink bg-cream py-1.5 font-display text-sm">
        <span className={`h-2 w-2 rounded-full ${color.dot}`} />
        {stylist.name}
      </div>
      <div
        className="relative cursor-pointer bg-oat/30 hover:bg-oat/60"
        style={{ height: gridHeight }}
        onClick={handleClick}
        title="Clic para añadir una cita a esta hora"
      >
        {hourMarks.map((m) => (
          <div
            key={m}
            className="pointer-events-none absolute left-0 right-0 border-t border-line/70"
            style={{ top: (m - openMin) * pxPerMin }}
          />
        ))}
        {layoutOverlaps(bookings).map(({ booking: b, col, colCount }) => {
          const start = new Date(b.startsAt);
          const startMin = start.getHours() * 60 + start.getMinutes();
          const top = Math.max(0, (startMin - openMin) * pxPerMin);
          const height = Math.max(ROW_PX - 2, b.durationMin * pxPerMin - 2);
          const widthPct = 100 / colCount;
          return (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                onBookingClick(b);
              }}
              className={`absolute cursor-pointer overflow-hidden rounded-sm border border-ink px-1.5 py-1 text-oat transition-colors ${color.block}`}
              style={{
                top,
                height,
                left: `calc(${col * widthPct}% + 2px)`,
                width: `calc(${widthPct}% - 4px)`,
              }}
              title={`Editar: ${formatTimeInZone(salon.timeZone, start)} · ${b.serviceName} · ${b.client.name}`}
            >
              <p className="truncate text-[11px] font-semibold leading-tight">
                {formatTimeInZone(salon.timeZone, start)} · {b.serviceName}
              </p>
              <p className="truncate text-[10px] leading-tight text-oat/70">{b.client.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekAgenda({
  weekStart,
  stylists,
  bookings,
  onAdd,
  onBookingClick,
}: {
  weekStart: Date;
  stylists: { slug: string; name: string }[];
  bookings: Booking[];
  onAdd: (stylistSlug: string, date: Date, time: string) => void;
  onBookingClick: (b: Booking) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-7">
      {days.map((day) => {
        const key = dateKey(day);
        const dayBookings = bookings
          .filter((b) => dateKey(new Date(b.startsAt)) === key)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        const weekday = day.getDay() as WeekDay;
        const closed = (salon.hours[weekday] ?? []).length === 0;

        return (
          <div key={key} className="min-h-[14rem] bg-oat p-2">
            <p className="u-mono text-center text-xs uppercase tracking-widest text-cocoa">
              {new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(day)}
            </p>
            <p className="font-display text-center text-lg">{day.getDate()}</p>
            {closed ? (
              <p className="mt-3 text-center text-xs text-cocoa">Cerrado</p>
            ) : (
              <>
                <div className="mt-2 flex flex-col gap-1">
                  {dayBookings.map((b) => {
                    const colorIndex = Math.max(
                      0,
                      stylists.findIndex((s) => s.slug === b.stylist?.slug),
                    );
                    const color = STYLIST_COLORS[colorIndex % STYLIST_COLORS.length];
                    return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onBookingClick(b)}
                      className="border border-ink bg-cream px-1.5 py-1 text-left text-[11px] leading-tight hover:bg-oat"
                      title={`Editar: ${b.serviceName} · ${b.client.name}`}
                    >
                      <p className="u-mono flex items-center gap-1.5 font-semibold">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color.dot}`} />
                        {formatTimeInZone(salon.timeZone, new Date(b.startsAt))} ·{" "}
                        {b.stylist?.name ?? "?"}
                      </p>
                      <p className="truncate">{b.serviceName}</p>
                      <p className="truncate text-cocoa">{b.client.name}</p>
                    </button>
                    );
                  })}
                  {dayBookings.length === 0 && (
                    <p className="mt-1 text-center text-[11px] text-cocoa">Sin citas</p>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {stylists.map((st) => (
                    <button
                      key={st.slug}
                      type="button"
                      onClick={() => onAdd(st.slug, day, "10:00")}
                      className="u-mono text-[10px] uppercase link-underline"
                    >
                      + {st.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
