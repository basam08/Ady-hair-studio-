import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const clients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        orderBy: { startsAt: "desc" },
        take: 1,
        select: { startsAt: true, serviceName: true },
      },
    },
  });

  const shaped = clients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    createdAt: c.createdAt,
    visits: c._count.bookings,
    lastVisit: c.bookings[0] ?? null,
  }));

  return NextResponse.json({ clients: shaped });
});
