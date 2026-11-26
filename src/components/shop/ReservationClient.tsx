"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCents, orderName } from "@/config/shop";
import { useShop } from "@/components/shop/CartProvider";
import { Stepper } from "@/components/shop/CartControls";

export function ReservationClient() {
  const {
    ready,
    selected,
    quantityOf,
    setQuantity,
    totalCents,
    clear,
  } = useShop();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneTotal, setDoneTotal] = useState<number | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/product-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map((p) => ({
            slug: p.slug,
            quantity: quantityOf(p.slug),
          })),
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          note: form.get("note"),
          consent: form.get("consent") === "on",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "No se pudo enviar la reserva.");
        return;
      }
      setDoneTotal(data.totalCents);
      clear();
      window.scrollTo({ top: 0 });
    } catch {
      setError("No hay conexión. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (doneTotal !== null) {
    return (
      <div role="status" className="mt-10 border border-ink bg-cream p-8">
        <p className="font-display text-3xl">Reserva recibida</p>
        <p className="mt-3 max-w-md text-sm text-cocoa">
          Pagarás {formatCents(doneTotal)} en el salón al recoger tus productos.
          La reserva depende de la disponibilidad; si falta algo, te avisamos.
        </p>
        <Link href="/tienda" className="btn btn-ghost mt-6">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (!ready) {
    return <p className="mt-10 text-sm text-cocoa">Cargando tu reserva…</p>;
  }

  if (selected.length === 0) {
    return (
      <div className="mt-10">
        <p className="text-sm text-cocoa">
          Todavía no has añadido ningún producto.
        </p>
        <Link href="/tienda" className="btn btn-primary mt-5">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-2">
      <div>
        <ul>
          {selected.map((p) => (
            <li
              key={p.slug}
              className="flex items-start justify-between gap-4 border-t border-line py-4"
            >
              <div>
                <p className="font-display text-lg">{orderName(p)}</p>
                <Stepper
                  name={orderName(p)}
                  quantity={quantityOf(p.slug)}
                  onChange={(q) => setQuantity(p.slug, q)}
                />
              </div>
              <p className="u-mono">
                {formatCents(p.priceCents * quantityOf(p.slug))}
              </p>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-y border-ink py-4 font-semibold">
          <span>Total a pagar en el salón</span>
          <span className="u-mono">{formatCents(totalCents)}</span>
        </p>
        <Link href="/tienda" className="mt-4 inline-block text-sm underline">
          Seguir mirando
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="field-label">Nombre</span>
          <input
            name="name"
            className="field"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label className="block">
          <span className="field-label">Teléfono</span>
          <input
            name="phone"
            type="tel"
            className="field"
            autoComplete="tel"
            required
            maxLength={20}
          />
        </label>
        <label className="block">
          <span className="field-label">Email (opcional)</span>
          <input
            name="email"
            type="email"
            className="field"
            autoComplete="email"
            maxLength={120}
          />
        </label>
        <label className="block">
          <span className="field-label">Nota (opcional)</span>
          <textarea name="note" className="field" rows={3} maxLength={500} />
        </label>
        <label className="flex items-start gap-3 text-sm text-cocoa">
          <input name="consent" type="checkbox" required className="mt-1" />
          <span>
            Acepto la{" "}
            <Link href="/privacidad" className="underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        {error && (
          <p role="alert" className="border border-ink p-3 text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="btn btn-primary w-full disabled:opacity-50"
        >
          {sending ? "Enviando…" : "Reservar y pagar en el salón"}
        </button>
      </form>
    </div>
  );
}
