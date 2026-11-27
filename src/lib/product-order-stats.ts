/**
 * Estadísticas de pedidos de la tienda por mes (hora del salón).
 * Cada pedido cuenta en el mes en que se cierra: recogido, cancelado o
 * caducado. Los cerrados antes de guardar fechas no entran.
 */

import { salon } from "@/config/salon";
import { toLocalParts } from "@/lib/time";
import { orderDeadline, orderStage, type OrderTimes } from "@/lib/product-orders";

export interface StatsOrder extends OrderTimes {
  items: { slug: string; name: string; quantity: number; priceCents: number }[];
  totalCents: number;
}

export interface ProductStat {
  slug: string;
  name: string;
  pickedUnits: number;
  pickedCents: number;
  lostUnits: number;
}

export interface MonthStats {
  month: string; // "YYYY-MM"
  pickedCount: number;
  pickedCents: number;
  averageCents: number;
  cancelledCount: number;
  expiredCount: number;
  pickupRate: number | null; // 0-100
  unsoldCents: number;
  averagePickupHours: number | null;
  products: ProductStat[];
}

export const monthKey = (d: Date) => toLocalParts(salon.timeZone, d).dateKey.slice(0, 7);

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function monthStats(
  orders: StatsOrder[],
  month: string,
  now: Date,
  extraClosed: ReadonlySet<string> = new Set(),
): MonthStats {
  let pickedCount = 0;
  let pickedCents = 0;
  let cancelledCount = 0;
  let expiredCount = 0;
  let unsoldCents = 0;
  const pickupHours: number[] = [];
  const products = new Map<string, ProductStat>();

  for (const o of orders) {
    const stage = orderStage(o, now, extraClosed);
    const closedAt =
      stage === "picked_up"
        ? o.pickedUpAt
        : stage === "cancelled"
          ? o.cancelledAt
          : stage === "expired"
            ? orderDeadline(o, extraClosed)
            : null;
    if (!closedAt || monthKey(new Date(closedAt)) !== month) continue;

    const picked = stage === "picked_up";
    if (picked) {
      pickedCount++;
      pickedCents += o.totalCents;
      if (o.readyAt) {
        const ms = new Date(closedAt).getTime() - new Date(o.readyAt).getTime();
        if (ms >= 0) pickupHours.push(ms / 3_600_000);
      }
    } else {
      if (stage === "expired") expiredCount++;
      else cancelledCount++;
      unsoldCents += o.totalCents;
    }

    for (const i of o.items) {
      const stat = products.get(i.slug) ?? {
        slug: i.slug,
        name: i.name,
        pickedUnits: 0,
        pickedCents: 0,
        lostUnits: 0,
      };
      if (picked) {
        stat.pickedUnits += i.quantity;
        stat.pickedCents += i.priceCents * i.quantity;
      } else {
        stat.lostUnits += i.quantity;
      }
      products.set(i.slug, stat);
    }
  }

  const closed = pickedCount + cancelledCount + expiredCount;
  return {
    month,
    pickedCount,
    pickedCents,
    averageCents: pickedCount ? Math.round(pickedCents / pickedCount) : 0,
    cancelledCount,
    expiredCount,
    pickupRate: closed ? Math.round((pickedCount / closed) * 100) : null,
    unsoldCents,
    averagePickupHours: pickupHours.length
      ? Math.round(pickupHours.reduce((a, b) => a + b, 0) / pickupHours.length)
      : null,
    products: [...products.values()].sort(
      (a, b) => b.pickedUnits - a.pickedUnits || b.pickedCents - a.pickedCents,
    ),
  };
}
