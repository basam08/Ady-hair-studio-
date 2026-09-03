import "server-only";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  authSecretKey,
  verifySessionToken,
  type AdminSession,
} from "@/lib/auth-edge";

export type { AdminSession };
export { AUTH_COOKIE_NAME, verifySessionToken };

export async function createSession(admin: AdminSession): Promise<void> {
  const token = await new SignJWT({ email: admin.email, name: admin.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(authSecretKey());

  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Lanza si no hay sesión — para usar al inicio de rutas y páginas admin. */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
