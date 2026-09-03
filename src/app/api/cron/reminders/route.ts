import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { salon } from "@/config/salon";
import { notifyBookingReminder } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Envía recordatorios de las citas que empiezan dentro de la ventana
 * `salon.minLeadHours` y que aún no tienen recordatorio enviado.
 *
 * Protegido con CRON_SECRET (cabecera Authorization: Bearer <secret>).
 * Configura un cron en vercel.json que llame a esta ruta cada 15 min.
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
  const windowEnd = new Date(now.getTime() + 2 * 3_600_000);

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
