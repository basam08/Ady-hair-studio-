import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 595.28; // A4 en puntos
const PAGE_H = 841.89;
const MARGIN = 48;

export interface IncomeRow {
  dateLabel: string;
  time: string;
  serviceName: string;
  stylistName: string;
  priceCents: number;
}

export interface IncomeReportInput {
  salonName: string;
  periodLabel: string;
  generatedLabel: string;
  rows: IncomeRow[];
  totalCents: number;
  logoPngBytes: Uint8Array;
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

const COLS = [
  { label: "Fecha", x: 0, w: 70 },
  { label: "Hora", x: 70, w: 40 },
  { label: "Servicio", x: 110, w: 190 },
  { label: "Peluquero/a", x: 300, w: 100 },
  { label: "Precio", x: 400, w: 95 },
];

export async function buildIncomeReportPdf(
  input: IncomeReportInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(input.logoPngBytes);
  const logoScale = 36 / logo.height;
  const logoDims = { width: logo.width * logoScale, height: 36 };

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function drawHeader(full: boolean) {
    page.drawImage(logo, {
      x: MARGIN,
      y: y - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
    page.drawText(input.salonName, {
      x: MARGIN + logoDims.width + 14,
      y: y - 16,
      size: 15,
      font: bold,
    });
    if (full) {
      page.drawText(`Informe de ingresos · ${input.periodLabel}`, {
        x: MARGIN + logoDims.width + 14,
        y: y - 32,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    y -= logoDims.height + 24;
  }

  function drawTableHeader() {
    page.drawRectangle({
      x: MARGIN,
      y: y - 4,
      width: PAGE_W - MARGIN * 2,
      height: 18,
      color: rgb(0.07, 0.07, 0.07),
    });
    for (const c of COLS) {
      page.drawText(c.label, {
        x: MARGIN + c.x + 4,
        y,
        size: 9,
        font: bold,
        color: rgb(1, 1, 1),
      });
    }
    y -= 22;
  }

  function newPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    drawHeader(false);
    drawTableHeader();
  }

  drawHeader(true);
  page.drawText(`Generado el ${input.generatedLabel}`, {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 22;
  drawTableHeader();

  let currentDay: string | null = null;
  let dayTotal = 0;

  function closeDaySubtotal() {
    if (currentDay === null) return;
    page.drawText(`Subtotal ${currentDay}: ${formatEuros(dayTotal)}`, {
      x: MARGIN,
      y,
      size: 9,
      font: bold,
    });
    y -= 18;
    dayTotal = 0;
  }

  for (const row of input.rows) {
    if (y < MARGIN + 70) newPage();
    if (currentDay !== row.dateLabel) {
      closeDaySubtotal();
      currentDay = row.dateLabel;
    }
    page.drawText(row.dateLabel, { x: MARGIN + COLS[0].x + 4, y, size: 9, font });
    page.drawText(row.time, { x: MARGIN + COLS[1].x + 4, y, size: 9, font });
    page.drawText(truncate(row.serviceName, 32), {
      x: MARGIN + COLS[2].x + 4,
      y,
      size: 9,
      font,
    });
    page.drawText(row.stylistName, { x: MARGIN + COLS[3].x + 4, y, size: 9, font });
    page.drawText(formatEuros(row.priceCents), {
      x: MARGIN + COLS[4].x + 4,
      y,
      size: 9,
      font,
    });
    dayTotal += row.priceCents;
    y -= 16;
  }
  closeDaySubtotal();

  if (y < MARGIN + 30) newPage();
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y: y + 10 },
    end: { x: PAGE_W - MARGIN, y: y + 10 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  page.drawText(`TOTAL: ${formatEuros(input.totalCents)}`, {
    x: MARGIN,
    y,
    size: 13,
    font: bold,
  });

  return pdf.save();
}
