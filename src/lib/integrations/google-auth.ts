import "server-only";
import { SignJWT, importPKCS8 } from "jose";

/**
 * Autenticación compartida por cuenta de servicio de Google, usada por
 * google-calendar.ts y google-sheets.ts. Firma un JWT y pide un access
 * token OAuth2 para el "scope" que pida cada integración.
 *
 * Configuración necesaria (ver .env.example):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  (con \n reales o escapados)
 */

export function hasGoogleServiceAccount(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}

export async function getGoogleAccessToken(scope: string): Promise<string | null> {
  if (!hasGoogleServiceAccount()) return null;
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
    const rawKey = process.env
      .GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n");
    const key = await importPKCS8(rawKey, "RS256");

    const now = Math.floor(Date.now() / 1000);
    const assertion = await new SignJWT({ scope })
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
      console.error("[google-auth] token error", res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("[google-auth] token fallo:", (err as Error).message);
    return null;
  }
}
