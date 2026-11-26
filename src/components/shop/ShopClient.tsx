"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MAX_UNITS_PER_PRODUCT,
  SHOP_SECTIONS,
  availableProducts,
  formatCents,
  isAvailable,
  orderName,
  shopProducts,
  type ShopProduct,
} from "@/config/shop";
import { salon } from "@/config/salon";

const PRODUCTS = availableProducts();

export function ShopClient() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneTotal, setDoneTotal] = useState<number | null>(null);

  const selected = PRODUCTS.filter((p) => cart[p.slug] > 0);
  const units = selected.reduce((n, p) => n + cart[p.slug], 0);
  const totalCents = selected.reduce(
    (sum, p) => sum + p.priceCents * cart[p.slug],
    0,
  );

  function setQuantity(slug: string, quantity: number) {
    setError(null);
    setCart((prev) => ({
      ...prev,
      [slug]: Math.max(0, Math.min(MAX_UNITS_PER_PRODUCT, quantity)),
    }));
  }

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
            quantity: cart[p.slug],
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
      setCart({});
      window.scrollTo({ top: 0 });
    } catch {
      setError("No hay conexión. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (doneTotal !== null) {
    return (
      <div role="status" className="mt-12 border border-ink bg-cream p-8">
        <p className="font-display text-3xl">Reserva recibida</p>
        <p className="mt-3 max-w-md text-sm text-cocoa">
          Pagarás {formatCents(doneTotal)} en el salón al recoger tus productos.
          La reserva depende de la disponibilidad; si falta algo, te avisamos.
        </p>
        <button
          type="button"
          onClick={() => setDoneTotal(null)}
          className="btn btn-ghost mt-6"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Secciones de la tienda" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {SHOP_SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="u-mono inline-block border border-line px-3 py-2 text-xs uppercase tracking-widest hover:border-ink"
              >
                {s.menu}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {SHOP_SECTIONS.map((section) => {
        const items = shopProducts.filter((p) => p.section === section.id);
        if (items.length === 0) return null;
        return (
          <section key={section.id} id={section.id} className="mt-16 scroll-mt-24">
            <div className="border-b border-ink pb-3">
              <h2 className="font-display text-3xl">{section.title}</h2>
              <p className="mt-1 text-sm text-cocoa">{section.intro}</p>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  quantity={cart[p.slug] ?? 0}
                  onChange={(q) => setQuantity(p.slug, q)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <p className="mt-12 text-xs text-cocoa">
        Fotos de K89. Las descripciones resumen la información del fabricante;
        el resultado puede variar según cada cabello. Si tienes dudas, pregunta
        en el salón antes de elegir.
      </p>

      <section id="mi-reserva" className="mt-20 scroll-mt-24">
        <h2 className="font-display text-3xl">Tu reserva</h2>
        {selected.length === 0 ? (
          <p className="mt-4 text-sm text-cocoa">
            Todavía no has añadido ningún producto.
          </p>
        ) : (
          <div className="mt-6 grid gap-10 md:grid-cols-2">
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
                        name={p.name}
                        quantity={cart[p.slug]}
                        onChange={(q) => setQuantity(p.slug, q)}
                      />
                    </div>
                    <p className="u-mono">
                      {formatCents(p.priceCents * cart[p.slug])}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="flex justify-between border-y border-ink py-4 font-semibold">
                <span>Total a pagar en el salón</span>
                <span className="u-mono">{formatCents(totalCents)}</span>
              </p>
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
                <textarea
                  name="note"
                  className="field"
                  rows={3}
                  maxLength={500}
                />
              </label>
              <label className="flex items-start gap-3 text-sm text-cocoa">
                <input
                  name="consent"
                  type="checkbox"
                  required
                  className="mt-1"
                />
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
        )}
      </section>

      {units > 0 && (
        <a
          href="#mi-reserva"
          // En móvil queda por encima del botón flotante de WhatsApp.
          className="btn btn-primary sticky bottom-20 z-30 mt-8 w-full shadow-lg md:bottom-4 md:w-auto"
        >
          Ver mi reserva ({units}) · {formatCents(totalCents)}
        </a>
      )}
    </>
  );
}

function ProductCard({
  product,
  quantity,
  onChange,
}: {
  product: ShopProduct;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const askPrice = `https://wa.me/${salon.contact.whatsapp}?text=${encodeURIComponent(
    `Hola ${salon.name}, ¿qué precio tiene ${orderName(product)}?`,
  )}`;
  return (
    <li className="flex flex-col">
      <div className="aspect-square border border-line bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={orderName(product)}
          width={600}
          height={600}
          loading="lazy"
          className="h-full w-full object-contain p-2"
        />
      </div>
      <h3 className="font-display mt-4 text-lg md:text-xl">{product.name}</h3>
      {product.label && <p className="u-eyebrow mt-1">{product.label}</p>}
      <p className="mt-2 text-sm text-cocoa">{product.description}</p>
      {product.contents && (
        <>
          <p className="u-eyebrow mt-3">Incluye</p>
          <ul className="mt-1 text-sm">
            {product.contents.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {product.contents.some((line) => line.includes("Flash Repair")) && (
            <p className="mt-1 text-xs text-cocoa">
              La Flash Repair Lotion no aparece en la foto.
            </p>
          )}
        </>
      )}
      {product.howTo && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer underline">Cómo se usa</summary>
          <p className="mt-1 text-cocoa">{product.howTo}</p>
        </details>
      )}
      <div className="mt-auto pt-3">
        {!isAvailable(product) ? (
          <>
            <p className="u-mono text-sm">Precio en el salón</p>
            <a
              href={askPrice}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost mt-2 w-full text-center"
              aria-label={`Preguntar el precio de ${orderName(product)} por WhatsApp`}
            >
              Preguntar precio
            </a>
          </>
        ) : (
          <>
            <p className="u-mono text-lg">{formatCents(product.priceCents)}</p>
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => onChange(1)}
                className="btn btn-ghost mt-2 w-full"
                aria-label={`Añadir ${orderName(product)}`}
              >
                Añadir
              </button>
            ) : (
              <Stepper
                name={orderName(product)}
                quantity={quantity}
                onChange={onChange}
              />
            )}
          </>
        )}
      </div>
    </li>
  );
}

function Stepper({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const button =
    "h-11 w-11 border border-ink text-lg disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        type="button"
        className={button}
        onClick={() => onChange(quantity - 1)}
        aria-label={`Quitar una unidad de ${name}`}
      >
        −
      </button>
      <span className="u-mono w-6 text-center" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={button}
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_UNITS_PER_PRODUCT}
        aria-label={`Añadir una unidad de ${name}`}
      >
        +
      </button>
    </div>
  );
}
