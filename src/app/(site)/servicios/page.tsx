import type { Metadata } from "next";
import Link from "next/link";
import { salon, formatPrice, formatDuration } from "@/config/salon";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Servicios y precios",
  description:
    "Cortes, color, barba, tratamientos y peinados en Ady Hair Cut. Precios y duración de cada servicio.",
};

const CATEGORIES = [
  "Mujer · Color",
  "Mujer · Corte y peinado",
  "Mujer · Cuidado capilar",
  "Hombre",
  "Niños",
] as const;

export default function ServiciosPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <p className="u-eyebrow">Carta</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">Servicios y precios</h1>
      <div className="rule-sweep mt-6 h-px w-full bg-ink" />
      <p className="mt-6 max-w-lg text-cocoa">
        Precios cerrados: lo que ves es lo que pagas. La duración marca cuánto
        ocupa la agenda, así que el hueco que reservas es tuyo entero.
      </p>

      {CATEGORIES.map((cat) => {
        const items = salon.services.filter((s) => s.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mt-14">
            <h2 className="font-display text-3xl">{cat}</h2>
            <ul className="mt-6">
              {items.map((s, i) => (
                <Reveal
                  as="li"
                  key={s.slug}
                  delayMs={i * 40}
                  className="grid grid-cols-[1fr_auto] items-start gap-4 border-t border-line py-5 last:border-b"
                >
                  <div>
                    <p className="font-display text-2xl">{s.name}</p>
                    <p className="mt-1 max-w-lg text-sm text-cocoa">
                      {s.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="u-mono text-lg">{formatPrice(s.price)}</p>
                    <p className="u-mono text-xs text-cocoa">
                      {formatDuration(s.durationMin)}
                    </p>
                    {s.bookableOnline === false ? (
                      <a
                        href={`https://wa.me/${salon.contact.whatsapp}?text=${encodeURIComponent(
                          `Hola ${salon.name}, quiero pedir cita para ${s.name}.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="u-mono mt-2 inline-block text-xs uppercase tracking-widest text-persimmon link-underline"
                      >
                        Consultar por WhatsApp →
                      </a>
                    ) : (
                      <Link
                        href={`/reservar?servicio=${s.slug}`}
                        className="u-mono mt-2 inline-block text-xs uppercase tracking-widest text-persimmon link-underline"
                      >
                        Reservar →
                      </Link>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="mt-16 border border-ink bg-cream p-8">
        <p className="font-display text-2xl">¿No sabes qué te va mejor?</p>
        <p className="mt-2 max-w-md text-sm text-cocoa">
          Escríbenos por WhatsApp con una foto y te decimos qué servicio pedir y
          cuánto dura.
        </p>
        <a
          href={`https://wa.me/${salon.contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost mt-5"
        >
          Preguntar por WhatsApp
        </a>
      </div>
    </div>
  );
}
