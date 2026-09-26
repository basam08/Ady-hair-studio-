import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { deleteCalendarEvent } from "@/lib/integrations/google-calendar";

export const dynamic = "force-dynamic";

// Endpoint temporal: manda TODAS las reservas y clientes a la papelera
// (soft-delete) para presentar la web limpia. Se purgan solos a los 30
// días (ver /api/cron/purge-trash). Requiere confirmación explícita.
export const POST = withAdmin(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "BORRAR TODO") {
    return NextResponse.json(
      {
        error: {
          code: "CONFIRM_REQUIRED",
          message: 'Manda { "confirm": "BORRAR TODO" } para confirmar',
        },
      },
      { status: 400 },
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null, googleEventId: { not: null } },
    select: { googleEventId: true },
  });
  await Promise.all(
    bookings.map((b) => deleteCalendarEvent(b.googleEventId as string)),
  );

  const now = new Date();
  const trashedBookings = await prisma.booking.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: now },
  });
  const trashedClients = await prisma.client.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: now },
  });

  return NextResponse.json({
    ok: true,
    trashedBookings: trashedBookings.count,
    trashedClients: trashedClients.count,
    note: "Se purgarán solos de la base de datos en 30 días.",
  });
});
