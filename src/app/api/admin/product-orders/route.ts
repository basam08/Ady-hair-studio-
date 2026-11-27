import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/api";
import { blackoutDateKeys } from "@/lib/product-orders";
import { monthKey, monthStats, previousMonth, type StatsOrder } from "@/lib/product-order-stats";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (req: NextRequest) => {
  const now = new Date();
  // Los pendientes salen todos (ninguno puede perderse de vista); de los
  // cerrados, los 200 más recientes. Las estadísticas usan todos.
  const [pending, closed, all, blackouts] = await Promise.all([
    prisma.productOrder.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productOrder.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.productOrder.findMany({
      select: {
        status: true,
        items: true,
        totalCents: true,
        confirmedAt: true,
        orderedAt: true,
        readyAt: true,
        extendedAt: true,
        pickedUpAt: true,
        cancelledAt: true,
      },
    }),
    prisma.blackout.findMany({ where: { allDay: true } }),
  ]);

  const closedDates = blackoutDateKeys(blackouts);
  const extraClosed = new Set(closedDates);
  const requested = req.nextUrl.searchParams.get("month") ?? "";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : monthKey(now);
  const statsOrders = all as unknown as StatsOrder[];

  return NextResponse.json({
    orders: [...pending, ...closed],
    closedDates,
    serverNow: now.toISOString(),
    stats: {
      current: monthStats(statsOrders, month, now, extraClosed),
      previous: monthStats(statsOrders, previousMonth(month), now, extraClosed),
    },
  });
});
