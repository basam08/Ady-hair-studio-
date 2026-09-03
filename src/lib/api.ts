import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Envuelve un handler admin: exige sesión y captura errores comunes. */
export function withAdmin<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Inicia sesión" } },
        { status: 401 },
      );
    }
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api:admin] error:", err);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Error interno" } },
        { status: 500 },
      );
    }
  };
}

export function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
