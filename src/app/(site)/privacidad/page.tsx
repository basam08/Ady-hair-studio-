import type { Metadata } from "next";
import { salon } from "@/config/salon";

export const metadata: Metadata = {
  title: "Política de privacidad",
  robots: { index: false, follow: true },
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
      <h1 className="font-display text-4xl md:text-5xl">Política de privacidad</h1>
      <div className="rule-sweep mt-6 h-px w-full bg-ink" />

      <div className="mt-10 space-y-6 text-sm leading-relaxed text-cocoa [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink [&_h2]:mt-8">
        <p>
          En {salon.name} tratamos tus datos con el único fin de gestionar tu
          cita. Esta página resume qué recogemos y qué puedes pedirnos. Adáptala
          con tu asesoría antes de publicar en producción.
        </p>

        <h2>Qué datos recogemos</h2>
        <p>
          Al reservar: nombre, teléfono y, si lo facilitas, email. Opcionalmente
          una nota que tú escribes. No pedimos ningún dato más.
        </p>

        <h2>Para qué los usamos</h2>
        <p>
          Confirmar la cita, enviarte el recordatorio y poder avisarte de un
          cambio. El teléfono se usa además para identificar tu ficha si vuelves.
        </p>

        <h2>Con quién los compartimos</h2>
        <p>
          Con los proveedores necesarios para el servicio: envío de email y de
          WhatsApp/SMS, y el calendario del salón. No vendemos ni cedemos tus
          datos con fines publicitarios.
        </p>

        <h2>Cuánto tiempo los guardamos</h2>
        <p>
          Mantenemos el historial de citas mientras seas cliente. Puedes pedir
          que borremos tu ficha en cualquier momento.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes solicitar acceso, rectificación o supresión de tus datos, así
          como una copia de lo que tenemos, escribiendo a{" "}
          <a href={`mailto:${salon.contact.email}`} className="link-underline">
            {salon.contact.email}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
