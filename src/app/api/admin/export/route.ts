import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { isValidDateKey, formatDateInZone, formatTimeInZone } from "@/lib/time";
import { salon } from "@/config/salon";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET = withAdmin(async (req: NextRequest) => {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (from && !isValidDateKey(from)) return jsonError("BAD_RANGE", "from no válido", 422);
  if (to && !isValidDateKey(to)) return jsonError("BAD_RANGE", "to no válido", 422);

  const bookings = await prisma.booking.findMany({
    where:
      from || to
        ? {
            startsAt: {
              ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
              ...(to ? { lt: new Date(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : undefined,
    orderBy: { startsAt: "asc" },
    include: { client: true, stylist: { select: { name: true } } },
    take: 5000,
  });

  const header = [
    "Fecha",
    "Hora",
    "Servicio",
    "Cliente",
    "Teléfono",
    "Email",
    "Precio (€)",
    "Duración (min)",
    "Peluquero/a",
    "Estado",
    "Nota",
  ];

  const rows = bookings.map((b) =>
    [
      formatDateInZone(salon.timeZone, b.startsAt),
      formatTimeInZone(salon.timeZone, b.startsAt),
      b.serviceName,
      b.client.name,
      b.client.phone,
      b.client.email ?? "",
      (b.priceCents / 100).toFixed(2),
      b.durationMin,
      b.stylist?.name ?? "Sin asignar",
      b.status,
      b.clientNote ?? "",
    ]
      .map(csvCell)
      .join(";"),
  );

  const csv = "﻿" + [header.join(";"), ...rows].join("\r\n");
  const filename = `reservas_${from ?? "inicio"}_${to ?? "hoy"}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
