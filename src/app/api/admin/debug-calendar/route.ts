import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/api";
import { getGoogleAccessToken, hasGoogleServiceAccount } from "@/lib/integrations/google-auth";
import { calendarIdForStylist } from "@/lib/integrations/google-calendar";

export const dynamic = "force-dynamic";

// Endpoint temporal de diagnóstico: comprueba acceso real a un calendario
// de Google (sin crear nada) y devuelve el motivo exacto si falla.
export const GET = withAdmin(async (req: NextRequest) => {
  const stylistSlug = req.nextUrl.searchParams.get("stylist");
  const calendarId = calendarIdForStylist(stylistSlug);

  const rawEnvValue =
    process.env[`GOOGLE_CALENDAR_ID_${(stylistSlug ?? "").toUpperCase()}`] ?? null;

  const report: Record<string, unknown> = {
    stylistSlug,
    calendarId,
    calendarIdLength: calendarId?.length ?? null,
    rawEnvValueJson: JSON.stringify(rawEnvValue),
    rawEnvValueLength: rawEnvValue?.length ?? null,
    hasServiceAccountEnvVars: hasGoogleServiceAccount(),
    googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null,
  };

  if (!calendarId) {
    report.result = "SIN_CALENDARIO: no hay GOOGLE_CALENDAR_ID_<SLUG> ni GOOGLE_CALENDAR_ID configurados";
    return NextResponse.json(report, { status: 200 });
  }

  const token = await getGoogleAccessToken(
    "https://www.googleapis.com/auth/calendar.events",
  );
  if (!token) {
    report.result = "SIN_TOKEN: no se pudo autenticar con la cuenta de servicio (revisa la clave privada)";
    return NextResponse.json(report, { status: 200 });
  }

  try {
    // Misma llamada que usa la reserva real (listar eventos), no la de
    // ajustes del calendario — esa pide un scope distinto y daba un 403
    // que no reflejaba el problema real.
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 86_400_000).toISOString(),
      maxResults: "1",
    });
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = await res.json().catch(() => null);
    report.httpStatus = res.status;
    report.googleResponse = body;
    report.result = res.ok
      ? "OK: la cuenta de servicio puede leer/escribir en ese calendario"
      : res.status === 404
        ? "404: el ID de calendario no existe o la cuenta de servicio no lo tiene compartido"
        : res.status === 403
          ? "403: el calendario existe pero la cuenta de servicio no tiene permiso (revisa el \"Compartir con personas concretas\")"
          : `Error ${res.status}`;
  } catch (err) {
    report.result = `EXCEPCION: ${(err as Error).message}`;
  }

  return NextResponse.json(report, { status: 200 });
});
