"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { salon } from "@/config/salon";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo iniciar sesión.");
        return;
      }
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <p className="font-display text-3xl">
        {salon.name}
        <span className="text-persimmon">.</span>
      </p>
      <h1 className="u-eyebrow mt-6">Acceso equipo</h1>

      <form onSubmit={submit} className="mt-6">
        {error && (
          <p
            role="alert"
            className="mb-4 border border-persimmon bg-persimmon/10 px-4 py-3 text-sm text-persimmon-dark"
          >
            {error}
          </p>
        )}
        <label className="field-label">Email</label>
        <input
          type="email"
          required
          autoComplete="username"
          className="field mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="field-label">Contraseña</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          className="field mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
