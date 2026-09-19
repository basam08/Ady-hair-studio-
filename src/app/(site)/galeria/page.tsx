import type { Metadata } from "next";
import { salon } from "@/config/salon";
import { GalleryGrid } from "@/components/site/GalleryGrid";

export const metadata: Metadata = {
  title: "Galería de trabajos",
  description: `Selección de cortes, color y barbería realizados en ${salon.name}, ${salon.contact.address.city}.`,
  alternates: { canonical: "/galeria" },
};

export default function GaleriaPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <p className="u-eyebrow">Trabajos</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">Galería</h1>
      <div className="rule-sweep mt-6 h-px w-full bg-ink" />
      <p className="mt-6 max-w-lg text-cocoa">
        Una muestra del trabajo del estudio: corte, color y barbería. Fotografía
        sin retoque.
      </p>

      <div className="mt-12">
        <GalleryGrid items={salon.gallery} />
      </div>
    </div>
  );
}
