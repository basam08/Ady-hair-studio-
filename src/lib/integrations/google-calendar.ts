import "server-only";
import { SignJWT, importPKCS8 } from "jose";

/**
 * Sincronización con Google Calendar mediante una cuenta de servicio.
 * Sin SDK: se firma un JWT y se pide un access token OAuth2.
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
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}

async function getAccessToken(): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
    const rawKey = process.env
      .GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n");
    const key = await importPKCS8(rawKey, "RS256");

    const now = Math.floor(Date.now() / 1000);
    const assertion = await new SignJWT({ scope: SCOPE })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(email)
      .setSubject(email)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(key);

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!res.ok) {
      console.error("[gcal] token error", res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[gcal] token fallo:", (err as Error).message);
    return null;
  }
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
  const token = await getAccessToken();
  if (!token) {
    console.info(`[gcal:mock] evento «${input.summary}» ${input.startIso}`);
    return null;
  }
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
  const token = await getAccessToken();
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
