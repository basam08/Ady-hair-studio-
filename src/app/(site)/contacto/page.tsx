import type { Metadata } from "next";
import Link from "next/link";
import { salon, hoursSummary } from "@/config/salon";

export const metadata: Metadata = {
  title: "Contacto y ubicación",
  description: `Cómo llegar a ${salon.name}, horario y teléfono.`,
};

export default function ContactoPage() {
  const { address, phone, email, whatsapp, maps } = salon.contact;
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <p className="u-eyebrow">Contacto</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">Dónde y cuándo</h1>
      <div className="rule-sweep mt-6 h-px w-full bg-ink" />

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="u-eyebrow">Dirección</h2>
          <address className="mt-3 not-italic text-lg">
            {address.street}
            <br />
            {address.postalCode} {address.city}, {address.region}
          </address>

          <h2 className="u-eyebrow mt-10">Teléfono</h2>
          <p className="mt-3 text-lg">
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-underline">
              {phone}
            </a>
          </p>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost mt-4"
          >
            Abrir WhatsApp
          </a>

          <h2 className="u-eyebrow mt-10">Email</h2>
          <p className="mt-3 text-lg">
            <a href={`mailto:${email}`} className="link-underline">
              {email}
            </a>
          </p>

          <h2 className="u-eyebrow mt-10">Horario</h2>
          <ul className="mt-3 u-mono text-sm">
            {hoursSummary().map((row) => (
              <li
                key={row.label}
                className="flex justify-between border-t border-line py-2"
              >
                <span>{row.label}</span>
                <span className="text-cocoa">{row.value}</span>
              </li>
            ))}
          </ul>

          <Link href="/reservar" className="btn btn-primary mt-8">
            Reservar cita
          </Link>
        </div>

        <div>
          <div className="aspect-square w-full border border-line">
            <iframe
              title="Mapa de ubicación"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                maps.placeQuery,
              )}&output=embed`}
            />
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              maps.placeQuery,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="u-mono mt-3 inline-block text-xs uppercase tracking-widest link-underline"
          >
            Cómo llegar en Google Maps →
          </a>
        </div>
      </div>
    </div>
  );
}
