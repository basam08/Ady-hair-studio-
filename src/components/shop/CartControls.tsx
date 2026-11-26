"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAX_UNITS_PER_PRODUCT, formatCents } from "@/config/shop";
import { useShop } from "@/components/shop/CartProvider";

export function Stepper({
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

/** Aviso flotante para ir a confirmar la reserva. */
export function CartBar() {
  const pathname = usePathname();
  const { units, totalCents } = useShop();
  if (units === 0 || pathname === "/tienda/reserva") return null;
  return (
    // En móvil queda por encima del botón flotante de WhatsApp.
    <Link
      href="/tienda/reserva"
      className="btn btn-primary fixed inset-x-4 bottom-20 z-40 shadow-lg md:inset-x-auto md:bottom-5 md:left-5"
    >
      Ver mi reserva ({units}) · {formatCents(totalCents)}
    </Link>
  );
}
