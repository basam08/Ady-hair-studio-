import "server-only";
import { getGoogleAccessToken, hasGoogleServiceAccount } from "./google-auth";

/**
 * Sincronización con Google Calendar mediante una cuenta de servicio.
 *
 * Configuración necesaria (ver .env.example):
 *   GOOGLE_CALENDAR_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  (con \n reales o escapados)
 *
 * Si falta configuración, las funciones devuelven null sin lanzar.
 */

const SCOPE = "https://www.googleapis.com/auth/calendar.events";

function isConfigured(): boolean {
  return Boolean(hasGoogleServiceAccount() && process.env.GOOGLE_CALENDAR_ID);
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  timeZone: string;
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<string | null> {
  if (!isConfigured()) {
    console.info(`[gcal:mock] evento «${input.summary}» ${input.startIso}`);
    return null;
  }
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return null;
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: input.summary,
          description: input.description,
          start: { dateTime: input.startIso, timeZone: input.timeZone },
          end: { dateTime: input.endIso, timeZone: input.timeZone },
        }),
      },
    );
    if (!res.ok) {
      console.error("[gcal] crear evento", res.status);
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch (err) {
    console.error("[gcal] crear evento fallo:", (err as Error).message);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return;
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!);
  try {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (err) {
    console.error("[gcal] borrar evento fallo:", (err as Error).message);
  }
}
