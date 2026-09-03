import "server-only";
import { prisma } from "@/lib/db";
import { salon, type WeekDay } from "@/config/salon";
import { parseHhMm, toLocalParts } from "@/lib/time";

function openMinutesForDate(dateKey: string): number {
  if (salon.closedDates.includes(dateKey)) return 0;
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay() as WeekDay;
  const blocks = salon.hours[weekday] ?? [];
  return blocks.reduce(
    (sum, b) => sum + (parseHhMm(b.close) - parseHhMm(b.open)),
    0,
  );
}

export interface DashboardStats {
  occupancyNext7: number;
  todayCount: number;
  weekRevenueCents: number;
  newClientsThisMonth: number;
  todayAgenda: {
    id: string;
    time: string;
    serviceName: string;
    client: string;
    phone: string;
    chair: number;
    status: string;
  }[];
  topServices: { name: string; count: number; revenueCents: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 86_400_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const in7 = new Date(now.getTime() + 7 * 86_400_000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayBookings, weekBookings, next7Bookings, newClients, byService] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startsAt: { gte: startOfToday, lt: endOfToday },
        },
        include: { client: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startsAt: { gte: weekAgo, lt: now },
        },
        select: { priceCents: true },
      }),
      prisma.booking.findMany({
        where: { status: "CONFIRMED", startsAt: { gte: now, lt: in7 } },
        select: { durationMin: true },
      }),
      prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.booking.groupBy({
        by: ["serviceName"],
        where: { startsAt: { gte: startOfMonth } },
        _count: { _all: true },
        _sum: { priceCents: true },
      }),
    ]);

  const dayKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    dayKeys.add(
      toLocalParts(salon.timeZone, new Date(now.getTime() + i * 86_400_000))
        .dateKey,
    );
  }
  let openMin = 0;
  for (const key of dayKeys) openMin += openMinutesForDate(key) * salon.chairs;
  const bookedMin = next7Bookings.reduce((s, b) => s + b.durationMin, 0);

  return {
    occupancyNext7: openMin > 0 ? Math.round((bookedMin / openMin) * 100) : 0,
    todayCount: todayBookings.length,
    weekRevenueCents: weekBookings.reduce((s, b) => s + b.priceCents, 0),
    newClientsThisMonth: newClients,
    todayAgenda: todayBookings.map((b) => ({
      id: b.id,
      time: b.startsAt.toISOString(),
      serviceName: b.serviceName,
      client: b.client.name,
      phone: b.client.phone,
      chair: b.chair,
      status: b.status,
    })),
    topServices: byService
      .map((s) => ({
        name: s.serviceName,
        count: s._count._all,
        revenueCents: s._sum.priceCents ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  };
}
