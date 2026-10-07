import { readFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, jsonError } from "@/lib/api";
import { isValidDateKey, formatDateInZone, formatTimeInZone } from "@/lib/time";
import { salon } from "@/config/salon";
import { buildIncomeReportPdf } from "@/lib/pdf/income-report";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (req: NextRequest) => {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (from && !isValidDateKey(from)) return jsonError("BAD_RANGE", "from no válido", 422);
  if (to && !isValidDateKey(to)) return jsonError("BAD_RANGE", "to no válido", 422);

  const bookings = await prisma.booking.findMany({
    where: {
      deletedAt: null,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
              ...(to ? { lt: new Date(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    include: { stylist: { select: { name: true } } },
    take: 5000,
  });

  const rows = bookings.map((b) => ({
    dateLabel: formatDateInZone(salon.timeZone, b.startsAt),
    time: formatTimeInZone(salon.timeZone, b.startsAt),
    serviceName: b.serviceName,
    stylistName: b.stylist?.name ?? "Sin asignar",
    priceCents: b.priceCents,
  }));
  const totalCents = rows.reduce((s, r) => s + r.priceCents, 0);

  const logoPngBytes = await readFile(
    path.join(process.cwd(), "public", "logo-pdf.png"),
  );

  const periodLabel =
    from && to ? `${from} a ${to}` : from ? `desde ${from}` : to ? `hasta ${to}` : "todo el historial";

  const pdfBytes = await buildIncomeReportPdf({
    salonName: salon.name,
    periodLabel,
    generatedLabel: new Date().toLocaleString("es-ES", { timeZone: salon.timeZone }),
    rows,
    totalCents,
    logoPngBytes,
  });

  const filename = `ingresos_${from ?? "inicio"}_${to ?? "hoy"}.pdf`;

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
