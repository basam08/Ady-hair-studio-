import { salon } from "@/config/salon";

const PRESET = encodeURIComponent(
  `Hola ${salon.name}, me gustaría información sobre una cita.`,
);

/** Botón flotante de WhatsApp con el número del negocio y mensaje inicial. */
export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${salon.contact.whatsapp}?text=${PRESET}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 border border-ink bg-ink px-4 py-3 text-cream transition-transform hover:-translate-y-0.5"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.6.2-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2-1 2.3 0 .3.9 3 3.3 4.9 2.4 2 3.3 2 3.9 2.1.5.1 1.5-.1 1.7-.7.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.3z" />
        <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8L7 20.5A10 10 0 1 0 12 2zm0 18.3c-1.5 0-3-.4-4.3-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" />
      </svg>
      <span className="u-mono text-xs tracking-widest">WHATSAPP</span>
    </a>
  );
}
