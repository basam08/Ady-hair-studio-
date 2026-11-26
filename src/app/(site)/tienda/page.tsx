import type { Metadata } from "next";
import { salon } from "@/config/salon";
import { ChristmasBanner } from "@/components/shop/ChristmasBanner";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Tienda",
  description: `Reserva productos K89 en ${salon.name} y págalos en el salón.`,
  alternates: { canonical: "/tienda" },
};

export default function TiendaPage() {
  return (
    <>
      <ChristmasBanner />
      <ShopClient />
    </>
  );
}
