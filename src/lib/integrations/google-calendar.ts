import "server-only";
import { getGoogleAccessToken, hasGoogleServiceAccount } from "./google-auth";

/**
 * Sincronización con Google Calendar mediante una cuenta de servicio.
 *
 * Configuración necesaria (ver .env.example):
 *   GOOGLE_CALENDAR_ID_<SLUG>  (uno por peluquero, p.ej. _ADY, _MILA)
 *   GOOGLE_CALENDAR_ID         (respaldo / calendario único, modo antiguo)
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  (con \n reales o escapados)
 *
 * Si falta configuración, las funciones devuelven null sin lanzar.
 */

const SCOPE = "https://www.googleapis.com/auth/calendar.events";

/**
 * Cada peluquero tiene su propio calendario de Google (en vez de uno
 * compartido con colores): así una reserva apuntada a mano directamente
 * en el calendario de un peluquero concreto bloquea su hueco sin
 * ambigüedad, y no depende de que el dueño recuerde ponerle color.
 *
 * Variable de entorno por peluquero: GOOGLE_CALENDAR_ID_<SLUG EN
 * MAYÚSCULAS> (p.ej. GOOGLE_CALENDAR_ID_ADY). Si no existe, se usa
 * GOOGLE_CALENDAR_ID como calendario único de respaldo (modo antiguo).
 */
export function calendarIdForStylist(stylistSlug: string | null): string | null {
  if (stylistSlug) {
    const perStylist = process.env[`GOOGLE_CALENDAR_ID_${stylistSlug.toUpperCase()}`];
    if (perStylist) return perStylist;
  }
  return process.env.GOOGLE_CALENDAR_ID || null;
}

function isConfigured(calendarId: string | null): boolean {
  return Boolean(hasGoogleServiceAccount() && calendarId);
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  timeZone: string;
  /** Id de color de Google Calendar (ver salon.ts: stylistColorId). */
  colorId?: string;
}

export async function createCalendarEvent(
  calendarId: string | null,
  input: CalendarEventInput,
): Promise<string | null> {
  if (!isConfigured(calendarId)) {
    console.info(`[gcal:mock] evento «${input.summary}» ${input.startIso}`);
    return null;
  }
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return null;
  const encodedId = encodeURIComponent(calendarId!);
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events`,
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
          ...(input.colorId ? { colorId: input.colorId } : {}),
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

export interface CalendarBusyEvent {
  id: string;
  startIso: string;
  endIso: string;
  colorId: string | null;
}

/**
 * Lista los eventos del calendario que caen en una ventana de tiempo —
 * incluye tanto los creados por la web como los que el dueño apunta a
 * mano, para que una reserva hecha directamente en Google Calendar
 * también bloquee el hueco en la web.
 */
export async function listBusyEvents(
  calendarId: string | null,
  timeMinIso: string,
  timeMaxIso: string,
): Promise<CalendarBusyEvent[]> {
  if (!isConfigured(calendarId)) return [];
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return [];
  const encodedId = encodeURIComponent(calendarId!);
  try {
    const params = new URLSearchParams({
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      singleEvents: "true",
      showDeleted: "false",
      maxResults: "250",
      fields: "items(id,status,colorId,start,end)",
    });
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      console.error("[gcal] listar eventos", res.status);
      return [];
    }
    const data = (await res.json()) as {
      items?: {
        id: string;
        status?: string;
        colorId?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }[];
    };
    return (data.items ?? [])
      .filter((ev) => ev.status !== "cancelled" && ev.start && ev.end)
      .map((ev) => ({
        id: ev.id,
        startIso: ev.start!.dateTime ?? `${ev.start!.date}T00:00:00`,
        endIso: ev.end!.dateTime ?? `${ev.end!.date}T00:00:00`,
        colorId: ev.colorId ?? null,
      }));
  } catch (err) {
    console.error("[gcal] listar eventos fallo:", (err as Error).message);
    return [];
  }
}

export async function deleteCalendarEvent(
  calendarId: string | null,
  eventId: string,
): Promise<void> {
  if (!isConfigured(calendarId)) return;
  const token = await getGoogleAccessToken(SCOPE);
  if (!token) return;
  const encodedId = encodeURIComponent(calendarId!);
  try {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events/${eventId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (err) {
    console.error("[gcal] borrar evento fallo:", (err as Error).message);
  }
}
