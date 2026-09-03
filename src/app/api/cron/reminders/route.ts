import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { salon } from "@/config/salon";
import { notifyBookingReminder } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Envía recordatorios de las citas aún pendientes de aviso.
 *
 * En plan Hobby de Vercel el cron solo puede ser diario (vercel.json: 07:00),
 * así que la ventana cubre desde ahora hasta el final del día. En plan Pro se
 * puede pasar a un cron cada 15 min y reducir la ventana a las próximas 2 h.
 *
 * Vercel añade automáticamente la cabecera Authorization: Bearer <CRON_SECRET>
 * cuando existe la variable de entorno CRON_SECRET.
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

  const now = new Date();
  const windowEnd = new Date();
  windowEnd.setHours(23, 59, 59, 999);
  if (windowEnd.getTime() < now.getTime() + 2 * 3_600_000) {
    windowEnd.setTime(now.getTime() + 2 * 3_600_000);
  }

  const due = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startsAt: { gte: now, lte: windowEnd },
    },
    include: { client: true },
    take: 100,
  });

  let sent = 0;
  for (const booking of due) {
    await notifyBookingReminder(booking);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSentAt: new Date() },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, timeZone: salon.timeZone });
}
