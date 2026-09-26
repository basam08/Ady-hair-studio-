import "server-only";
import { getGoogleAccessToken, hasGoogleServiceAccount } from "./google-auth";

/**
 * Copia de reservas a Google Sheets (solo lectura amigable para el
 * negocio, no es la fuente de la verdad — eso es Neon/Postgres).
 * Usa la misma cuenta de servicio que google-calendar.ts.
 *
 * Configuración necesaria (ver .env.example):
 *   GOOGLE_SHEETS_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *
 * Si falta configuración, no hace nada (no bloquea la reserva).
 */

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function isConfigured(): boolean {
  return Boolean(hasGoogleServiceAccount() && process.env.GOOGLE_SHEETS_ID);
}

export async function appendBookingRow(
  row: Array<string | number>,
): Promise<void> {
  if (!isConfigured()) {
    console.info("[sheets:mock] fila", row);
    return;
  }
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return;
  const sheetId = process.env.GOOGLE_SHEETS_ID!;
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [row] }),
      },
    );
    if (!res.ok) {
      console.error("[sheets] append fila", res.status, await res.text());
    }
  } catch (err) {
    console.error("[sheets] append fallo:", (err as Error).message);
  }
}

const HEADERS = [
  "Fecha creación",
  "Cliente",
  "Teléfono",
  "Servicio",
  "Peluquero",
  "Fecha",
  "Hora",
  "Precio",
  "Estado",
  "Nota",
];

const ESTADO_COLORS: Record<string, { red: number; green: number; blue: number }> = {
  Confirmada: { red: 0.83, green: 0.94, blue: 0.83 },
  Cancelada: { red: 0.96, green: 0.8, blue: 0.8 },
  Completada: { red: 0.8, green: 0.87, blue: 0.96 },
  "No presentado": { red: 0.9, green: 0.9, blue: 0.9 },
};

/**
 * Da formato de plantilla a la hoja: cabeceras, fila congelada, anchos
 * de columna, filtro, desplegable y colores por estado. Pensado para
 * ejecutarse una sola vez (o cuando se quiera reaplicar el estilo).
 */
export async function formatBookingSheet(): Promise<{ ok: boolean; error?: string }> {
  if (!isConfigured()) return { ok: false, error: "Google Sheets no configurado" };
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return { ok: false, error: "No se pudo obtener token de Google" };
  const sheetId = process.env.GOOGLE_SHEETS_ID!;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
    { headers: authHeaders },
  );
  if (!metaRes.ok) return { ok: false, error: `metadata ${metaRes.status}` };
  const meta = (await metaRes.json()) as {
    sheets: { properties: { sheetId: number } }[];
  };
  const gid = meta.sheets[0].properties.sheetId;

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:J1?valueInputOption=USER_ENTERED`,
    { method: "PUT", headers: authHeaders, body: JSON.stringify({ values: [HEADERS] }) },
  );

  const widths = [140, 160, 120, 220, 110, 100, 100, 90, 120, 220];
  const columnRequests = widths.map((pixelSize, i) => ({
    updateDimensionProperties: {
      range: { sheetId: gid, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
      properties: { pixelSize },
      fields: "pixelSize",
    },
  }));

  const estadoColIndex = HEADERS.indexOf("Estado");
  const estadoConditionalRules = Object.entries(ESTADO_COLORS).map(
    ([value, color], index) => ({
      addConditionalFormatRule: {
        rule: {
          ranges: [
            {
              sheetId: gid,
              startRowIndex: 1,
              endRowIndex: 1000,
              startColumnIndex: estadoColIndex,
              endColumnIndex: estadoColIndex + 1,
            },
          ],
          booleanRule: {
            condition: { type: "TEXT_EQ", values: [{ userEnteredValue: value }] },
            format: { backgroundColor: color },
          },
        },
        index,
      },
    }),
  );

  const requests = [
    {
      repeatCell: {
        range: { sheetId: gid, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.09, green: 0.09, blue: 0.09 },
            textFormat: {
              foregroundColor: { red: 0.96, green: 0.94, blue: 0.89 },
              bold: true,
              fontSize: 10,
            },
            verticalAlignment: "MIDDLE",
            horizontalAlignment: "CENTER",
            wrapStrategy: "WRAP",
          },
        },
        fields:
          "userEnteredFormat(backgroundColor,textFormat,verticalAlignment,horizontalAlignment,wrapStrategy)",
      },
    },
    {
      updateSheetProperties: {
        properties: { sheetId: gid, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: gid, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 32 },
        fields: "pixelSize",
      },
    },
    ...columnRequests,
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId: gid,
            startRowIndex: 0,
            endRowIndex: 1000,
            startColumnIndex: 0,
            endColumnIndex: HEADERS.length,
          },
        },
      },
    },
    {
      setDataValidation: {
        range: {
          sheetId: gid,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: estadoColIndex,
          endColumnIndex: estadoColIndex + 1,
        },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: Object.keys(ESTADO_COLORS).map((v) => ({ userEnteredValue: v })),
          },
          showCustomUi: true,
          strict: true,
        },
      },
    },
    ...estadoConditionalRules,
  ];

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
    { method: "POST", headers: authHeaders, body: JSON.stringify({ requests }) },
  );
  if (!batchRes.ok) {
    return { ok: false, error: `batchUpdate ${batchRes.status}: ${await batchRes.text()}` };
  }
  return { ok: true };
}
