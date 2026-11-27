"use client";

import Link from "next/link";
import {
  SHOP_CATEGORIES,
  formatCents,
  isAvailable,
  orderName,
  productPhotos,
  shopProducts,
  type ShopProduct,
} from "@/config/shop";
import { salon } from "@/config/salon";
import { useShop } from "@/components/shop/CartProvider";
import { PICKUP_NOTICE } from "@/lib/product-orders";

/** Minúsculas y sin acentos, para que "serum" encuentre "Sérum". */
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const SEARCH_INDEX = new Map(
  shopProducts.map((p) => [
    p.slug,
    normalize(
      [p.name, p.label, p.description, ...(p.contents ?? [])].join(" "),
    ),
  ]),
);

export function ShopClient() {
  const { category, setCategory, query, setQuery } = useShop();
  const current =
    SHOP_CATEGORIES.find((c) => c.id === category) ?? SHOP_CATEGORIES[0];
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const items = shopProducts.filter(
    (p) =>
      current.match(p) &&
      words.every((w) => SEARCH_INDEX.get(p.slug)!.includes(w)),
  );

  return (
    <div id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-12">
      <div className="flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl uppercase md:text-4xl">
            Tienda online
          </h2>
          <p className="mt-2 text-sm text-cocoa">
            Reserva aquí y recoge en el salón.{" "}
            <strong className="text-ink">
              En la web no se paga: pagas en el local.
            </strong>
          </p>
          <p className="mt-1 max-w-xl text-sm text-cocoa">{PICKUP_NOTICE}</p>
        </div>
        <label className="block md:w-72">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            className="field"
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 gap-10 lg:grid lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Categorías" className="min-w-0 lg:border-r lg:border-line lg:pr-6">
          <p className="hidden font-display text-lg lg:block">Categorías</p>
          <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:sticky lg:top-24 lg:mx-0 lg:mt-3 lg:block lg:overflow-visible lg:px-0">
            {SHOP_CATEGORIES.map((c) => {
              const active = c.id === current.id;
              return (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    className={`whitespace-nowrap border px-3 py-2 text-sm lg:w-full lg:whitespace-normal lg:border-0 lg:px-0 lg:text-left ${
                      active
                        ? "border-ink bg-ink text-oat lg:bg-transparent lg:font-semibold lg:text-ink lg:underline"
                        : "border-line text-cocoa hover:text-ink"
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 min-w-0 lg:mt-0">
          <p className="text-xs text-cocoa" aria-live="polite">
            {items.length === 1 ? "1 producto" : `${items.length} productos`}
          </p>
          {items.length === 0 ? (
            <p className="py-10 text-sm text-cocoa">
              No hay productos con esa búsqueda.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setQuery("");
                  setCategory("todos");
                }}
              >
                Ver todos
              </button>
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </ul>
          )}
          <p className="mt-12 text-xs text-cocoa">
            Fotos de K89. Las descripciones resumen la información del
            fabricante; el resultado puede variar según cada cabello. Reserva
            sujeta a disponibilidad.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ShopProduct }) {
  const { quantityOf, setQuantity } = useShop();
  const photos = productPhotos(product);
  const cover = photos[0];
  const href = `/tienda/${product.slug}`;
  const quantity = quantityOf(product.slug);
  const circle =
    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-oat";

  return (
    <li className="flex flex-col">
      <Link href={href} className="group block overflow-hidden border border-line bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover.src}
          alt={cover.alt}
          width={800}
          height={600}
          loading="lazy"
          className={`aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-105 ${
            cover.scene ? "object-cover" : "object-contain p-1"
          }`}
        />
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base md:text-lg">
            <Link href={href} className="link-underline">
              {product.name}
            </Link>
          </h3>
          {product.label && (
            <p className="mt-1 text-xs text-cocoa">{product.label}</p>
          )}
          <p className="u-mono mt-2">
            {isAvailable(product) ? (
              formatCents(product.priceCents)
            ) : (
              <span className="text-sm text-cocoa">Precio en el salón</span>
            )}
          </p>
          {photos.length > 1 && (
            <p className="mt-1 text-xs text-cocoa">{photos.length} fotos</p>
          )}
        </div>
        {isAvailable(product) ? (
          <button
            type="button"
            className={circle}
            onClick={() => setQuantity(product.slug, quantity + 1)}
            aria-label={`Añadir ${orderName(product)} a la reserva`}
          >
            <CartIcon />
            {quantity > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-xs text-oat">
                {quantity}
              </span>
            )}
          </button>
        ) : (
          <a
            href={`https://wa.me/${salon.contact.whatsapp}?text=${encodeURIComponent(
              `Hola ${salon.name}, ¿qué precio tiene ${orderName(product)}?`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={circle}
            aria-label={`Preguntar el precio de ${orderName(product)} por WhatsApp`}
            title="Preguntar precio por WhatsApp"
          >
            <span aria-hidden className="text-lg font-semibold">
              ?
            </span>
          </a>
        )}
      </div>
    </li>
  );
}

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <path d="M3 4h2l2.4 11h10.2L20 7H6.2" />
      <circle cx="9" cy="19.5" r="1.4" />
      <circle cx="16.5" cy="19.5" r="1.4" />
    </svg>
  );
}
