/**
 * Reglas de los pedidos de la tienda: pasos, plazo de recogida y caducidad.
 * Sin dependencias de servidor: lo usan la API, el panel y la cuenta atrás.
 *
 * El plazo empieza cuando el pedido se marca "listo para recoger" y solo
 * corre en los días que el salón abre. La caducidad no se guarda: se calcula.
 */

import { salon, type WeekDay } from "@/config/salon";
import { toLocalParts, zonedWallTimeToUtc } from "@/lib/time";

export const PICKUP_HOURS = 48;
const PICKUP_MS = PICKUP_HOURS * 3_600_000;

export const PICKUP_NOTICE = `Cuando te avisemos de que tu pedido está listo, tienes ${PICKUP_HOURS} horas para recogerlo, sin contar los días en que el salón está cerrado. Después, la reserva caduca.`;

type DateInput = Date | string | null | undefined;

export interface OrderTimes {
  status: "PENDING" | "PICKED_UP" | "CANCELLED";
  confirmedAt?: DateInput;
  orderedAt?: DateInput;
  readyAt?: DateInput;
  extendedAt?: DateInput;
  pickedUpAt?: DateInput;
  cancelledAt?: DateInput;
}

export type OrderStage =
  | "new"
  | "confirmed"
  | "ordered"
  | "ready"
  | "expired"
  | "picked_up"
  | "cancelled";

export type OrderAction =
  | "confirm"
  | "order"
  | "ready"
  | "unready"
  | "extend"
  | "pickup"
  | "cancel"
  | "reopen";

const toDate = (v: DateInput): Date | null => (v ? new Date(v) : null);

const dayKey = (d: Date) => toLocalParts(salon.timeZone, d).dateKey;

/** Medianoche (hora del salón) en la que termina el día de `d`. */
function nextMidnight(d: Date): Date {
  const p = toLocalParts(salon.timeZone, d);
  return zonedWallTimeToUtc(salon.timeZone, p.year, p.month, p.day + 1, 0, 0);
}

/** Días completos cerrados desde el panel (bloqueos de "todo el día"). */
export function blackoutDateKeys(
  blackouts: { startsAt: Date | string; endsAt: Date | string; allDay: boolean }[],
): string[] {
  const keys = new Set<string>();
  for (const b of blackouts) {
    if (!b.allDay) continue;
    const end = new Date(b.endsAt);
    let cursor = new Date(b.startsAt);
    for (let i = 0; i < 400 && cursor < end; i++) {
      keys.add(dayKey(cursor));
      cursor = nextMidnight(cursor);
    }
  }
  return [...keys];
}

/** True si ese día el salón no abre: sin horario, festivo o bloqueado entero. */
export function isClosedDay(d: Date, extraClosed: ReadonlySet<string>): boolean {
  const p = toLocalParts(salon.timeZone, d);
  return (
    (salon.hours[p.weekday as WeekDay]?.length ?? 0) === 0 ||
    salon.closedDates.includes(p.dateKey) ||
    extraClosed.has(p.dateKey)
  );
}

/** Instante en el que caduca un plazo que empieza en `start`. */
export function pickupDeadline(start: Date, extraClosed: ReadonlySet<string> = new Set()): Date {
  let remaining = PICKUP_MS;
  let cursor = start;
  for (let i = 0; i < 400; i++) {
    const midnight = nextMidnight(cursor);
    if (!isClosedDay(cursor, extraClosed)) {
      const available = midnight.getTime() - cursor.getTime();
      if (remaining <= available) return new Date(cursor.getTime() + remaining);
      remaining -= available;
    }
    cursor = midnight;
  }
  return new Date(cursor.getTime() + remaining);
}

/** Tiempo de plazo que queda entre `now` y `deadline`, sin contar días cerrados. */
export function remainingOpenMs(
  now: Date,
  deadline: Date,
  extraClosed: ReadonlySet<string> = new Set(),
): number {
  let total = 0;
  let cursor = now;
  for (let i = 0; i < 400 && cursor < deadline; i++) {
    const midnight = nextMidnight(cursor);
    const end = midnight < deadline ? midnight : deadline;
    if (!isClosedDay(cursor, extraClosed)) total += end.getTime() - cursor.getTime();
    cursor = midnight;
  }
  return total;
}

export function orderDeadline(o: OrderTimes, extraClosed: ReadonlySet<string> = new Set()): Date | null {
  const start = toDate(o.extendedAt) ?? toDate(o.readyAt);
  return start ? pickupDeadline(start, extraClosed) : null;
}

export function orderStage(
  o: OrderTimes,
  now: Date,
  extraClosed: ReadonlySet<string> = new Set(),
): OrderStage {
  if (o.status === "PICKED_UP") return "picked_up";
  const deadline = orderDeadline(o, extraClosed);
  if (o.status === "CANCELLED") {
    // Cerrar un pedido ya caducado cuenta como caducado, no como cancelado.
    const cancelled = toDate(o.cancelledAt);
    return cancelled && deadline && cancelled >= deadline ? "expired" : "cancelled";
  }
  if (deadline) return now >= deadline ? "expired" : "ready";
  if (o.orderedAt) return "ordered";
  return o.confirmedAt ? "confirmed" : "new";
}

const ALLOWED: Record<OrderStage, OrderAction[]> = {
  new: ["confirm", "ready", "pickup", "cancel"],
  confirmed: ["order", "ready", "pickup", "cancel"],
  ordered: ["ready", "pickup", "cancel"],
  ready: ["pickup", "extend", "unready", "cancel"],
  expired: ["pickup", "extend", "cancel", "reopen"],
  picked_up: ["reopen"],
  cancelled: ["reopen"],
};

export function allowedActions(o: OrderTimes, stage: OrderStage): OrderAction[] {
  // Un caducado ya cerrado solo se puede reabrir.
  if (stage === "expired" && o.status === "CANCELLED") return ["reopen"];
  const actions = ALLOWED[stage];
  return stage === "expired" ? actions.filter((a) => a !== "reopen") : actions;
}

/** Campos que cambia cada acción. */
export function actionChanges(action: OrderAction, o: OrderTimes, now: Date) {
  switch (action) {
    case "confirm":
      return { confirmedAt: now };
    case "order":
      return { orderedAt: now };
    case "ready":
      return {
        readyAt: now,
        extendedAt: null,
        confirmedAt: toDate(o.confirmedAt) ?? now,
      };
    case "unready":
      return { readyAt: null, extendedAt: null };
    case "extend":
      return { extendedAt: now };
    case "pickup":
      return { status: "PICKED_UP" as const, pickedUpAt: now, cancelledAt: null };
    case "cancel":
      return { status: "CANCELLED" as const, cancelledAt: now };
    case "reopen":
      // Vuelve a pendiente sin reloj, para que no reaparezca ya caducado.
      return {
        status: "PENDING" as const,
        pickedUpAt: null,
        cancelledAt: null,
        readyAt: null,
        extendedAt: null,
      };
  }
}
