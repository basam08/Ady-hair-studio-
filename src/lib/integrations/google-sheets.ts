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
