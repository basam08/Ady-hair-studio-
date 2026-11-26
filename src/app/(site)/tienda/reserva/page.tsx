import type { Metadata } from "next";
import { ReservationClient } from "@/components/shop/ReservationClient";

export const metadata: Metadata = {
  title: "Tu reserva",
  robots: { index: false, follow: true },
};

export default function ReservaProductosPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <h1 className="font-display text-4xl md:text-5xl">Tu reserva</h1>
      <p className="mt-3 text-sm text-cocoa">
        <strong className="text-ink">En la web no se paga nada:</strong> pagas en
        el salón al recoger tus productos.
      </p>
      <ReservationClient />
    </div>
  );
}
