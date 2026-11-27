"use client";

import {
  findProduct,
  formatCents,
  isAvailable,
  orderName,
} from "@/config/shop";
import { salon } from "@/config/salon";
import { useShop } from "@/components/shop/CartProvider";
import { Stepper } from "@/components/shop/CartControls";
import { PICKUP_NOTICE } from "@/lib/product-orders";

/** Precio y botón de reserva de la ficha. */
export function ProductActions({ slug }: { slug: string }) {
  const { quantityOf, setQuantity } = useShop();
  const product = findProduct(slug);
  if (!product) return null;
  const quantity = quantityOf(slug);

  if (!isAvailable(product)) {
    return (
      <div className="mt-8 border-y border-line py-5">
        <p className="u-mono text-lg">Precio en el salón</p>
        <a
          href={`https://wa.me/${salon.contact.whatsapp}?text=${encodeURIComponent(
            `Hola ${salon.name}, ¿qué precio tiene ${orderName(product)}?`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-3 w-full sm:w-auto"
        >
          Preguntar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 border-y border-line py-5">
      <p className="u-mono text-3xl">{formatCents(product.priceCents)}</p>
      <p className="mt-1 text-sm text-cocoa">
        Se paga en el salón al recogerlo.
      </p>
      <p className="mt-2 text-sm text-cocoa">{PICKUP_NOTICE}</p>
      {quantity === 0 ? (
        <button
          type="button"
          onClick={() => setQuantity(slug, 1)}
          className="btn btn-primary mt-4 w-full sm:w-auto"
        >
          Añadir a mi reserva
        </button>
      ) : (
        <div className="mt-2">
          <Stepper
            name={orderName(product)}
            quantity={quantity}
            onChange={(q) => setQuantity(slug, q)}
          />
        </div>
      )}
    </div>
  );
}
