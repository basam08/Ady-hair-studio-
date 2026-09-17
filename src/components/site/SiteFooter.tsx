import Link from "next/link";
import { salon, hoursSummary } from "@/config/salon";

export function SiteFooter() {
  const { address, phone, email, whatsapp, whatsappDisplay, social } = salon.contact;
  return (
    <footer className="border-t border-ink bg-ink text-oat">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-3xl">
            {salon.name}
            <span aria-hidden>.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-oat/70">{salon.tagline}</p>
        </div>

        <div>
          <p className="u-eyebrow text-oat/60">Dónde</p>
          <address className="mt-3 not-italic text-sm leading-relaxed text-oat/85">
            {address.street}
            <br />
            {address.postalCode} {address.city}
            <br />
            {address.region}
          </address>
        </div>

        <div>
          <p className="u-eyebrow text-oat/60">Contacto</p>
          <ul className="mt-3 space-y-1 text-sm text-oat/85">
            <li>
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-underline">
                {phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="link-underline">
                {email}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
              >
                WhatsApp: {whatsappDisplay}
              </a>
            </li>
            <li className="flex gap-4 pt-2 u-mono text-xs uppercase tracking-widest">
              <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={social.tiktok} target="_blank" rel="noopener noreferrer">
                TikTok
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="u-eyebrow text-oat/60">Horario</p>
          <ul className="mt-3 space-y-1 u-mono text-xs text-oat/85">
            {hoursSummary().map((row) => (
              <li key={row.label} className="flex justify-between gap-3">
                <span>{row.label}</span>
                <span className="text-oat/60">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-oat/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-oat/50 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {salon.name}. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="link-underline">
              Privacidad
            </Link>
            <Link href="/admin" className="link-underline">
              Acceso equipo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
