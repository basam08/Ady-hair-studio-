import { jwtVerify } from "jose";

/**
 * Verificación de sesión apta para el runtime edge (middleware).
 * No importa `next/headers` ni `server-only`.
 */

export const AUTH_COOKIE_NAME = "ady_admin";
export const SESSION_MAX_AGE_SEC = 8 * 60 * 60;

export interface AdminSession {
  sub: string;
  email: string;
  name: string;
}

export function authSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET no configurado o demasiado corto (mín. 32 caracteres).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, authSecretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
