import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Límite estricto en el endpoint de autenticación.
  const rl = rateLimit(`login:${clientIp(req.headers)}`, 10, 15 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Demasiados intentos. Espera unos minutos.",
        },
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Cuerpo no válido" } },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Datos no válidos" } },
      { status: 422 },
    );
  }

  // Límite adicional por cuenta: evita fuerza bruta distribuida entre varias
  // IPs contra un mismo email, que el límite por IP de arriba no cubre.
  const rlAccount = rateLimit(`login-account:${parsed.data.email}`, 10, 15 * 60_000);
  if (!rlAccount.ok) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Demasiados intentos. Espera unos minutos.",
        },
      },
      { status: 429, headers: { "Retry-After": String(rlAccount.retryAfterSec) } },
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { email: parsed.data.email },
  });

  // Mensaje genérico + comparación siempre, para no filtrar si el email existe.
  const fallbackHash =
    "$2a$12$abcdefghijklmnopqrstuv0123456789012345678901234567890a";
  const valid = await bcrypt.compare(
    parsed.data.password,
    admin?.passwordHash ?? fallbackHash,
  );

  if (!admin || !valid) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" } },
      { status: 401 },
    );
  }

  await createSession({ sub: admin.id, email: admin.email, name: admin.name });
  return NextResponse.json({ ok: true });
}
