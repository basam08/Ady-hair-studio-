import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const TRASH_DAYS = 30;

/**
 * Vacía la papelera: borra en firme reservas y clientes marcados con
 * deletedAt hace más de 30 días. Los clientes solo se purgan si ya no
 * les queda ninguna reserva (evita el error de clave foránea).
 *
 * Vercel añade automáticamente Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "No autorizado" } },
      { status: 401 },
    );
  }

  const cutoff = new Date(Date.now() - TRASH_DAYS * 86_400_000);

  const deletedBookings = await prisma.booking.deleteMany({
    where: { deletedAt: { lt: cutoff } },
  });

  const candidates = await prisma.client.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true, _count: { select: { bookings: true } } },
  });
  const purgeableIds = candidates
    .filter((c) => c._count.bookings === 0)
    .map((c) => c.id);
  const deletedClients = purgeableIds.length
    ? await prisma.client.deleteMany({ where: { id: { in: purgeableIds } } })
    : { count: 0 };

  return NextResponse.json({
    ok: true,
    deletedBookings: deletedBookings.count,
    deletedClients: deletedClients.count,
  });
}
