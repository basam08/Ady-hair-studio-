import type { Metadata } from "next";
import { salon } from "@/config/salon";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Tienda",
  description: `Reserva productos K89 en ${salon.name} y págalos en el salón.`,
  alternates: { canonical: "/tienda" },
};

export default function TiendaPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <p className="u-eyebrow">Productos K89</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">Tienda</h1>
      <div className="rule-sweep mt-6 h-px w-full bg-ink" />
      <p className="mt-6 max-w-lg text-cocoa">
        Reserva tus productos aquí y recógelos en el salón.{" "}
        <strong className="text-ink">
          En la web no se paga nada: pagas en el local.
        </strong>
      </p>
      <ShopClient />
    </div>
  );
}
