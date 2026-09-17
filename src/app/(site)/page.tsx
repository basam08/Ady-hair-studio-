import Link from "next/link";
import Image from "next/image";
import { salon, formatPrice, formatDuration } from "@/config/salon";
import { Reveal } from "@/components/site/Reveal";
import { GalleryGrid } from "@/components/site/GalleryGrid";

const STEPS = [
  {
    n: "01",
    title: "Elige el servicio",
    body: "Corte, color, barbería o peinado. Cada uno con su precio y su duración exactos.",
  },
  {
    n: "02",
    title: "Escoge el hueco",
    body: "El calendario muestra únicamente la disponibilidad real, con la silla reservada para ti.",
  },
  {
    n: "03",
    title: "Deja tus datos",
    body: "Nombre y teléfono. Sin registro ni contraseñas.",
  },
  {
    n: "04",
    title: "Recibe la confirmación",
    body: "Al instante por WhatsApp y correo, con recordatorio el día de la cita.",
  },
];

export default function HomePage() {
  const featured = salon.services.slice(0, 5);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
        <p className="u-eyebrow">
          Peluquería y barbería · {salon.contact.address.city} · desde{" "}
          {salon.founded}
        </p>
        <h1 className="font-display font-display--hero mt-6 text-[2.9rem] leading-[1.02] sm:text-[4rem] md:text-[5rem]">
          El corte que
          <br />
          te <span className="italic">reconoce</span>
        </h1>
        <div className="rule-sweep mt-7 h-px w-full bg-ink" />

        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <p className="max-w-md text-lg text-cocoa">{salon.intro}</p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/reservar" className="btn btn-primary">
              Reservar cita
            </Link>
            <Link href="/servicios" className="btn btn-ghost">
              Ver servicios
            </Link>
          </div>
        </div>

        <Reveal className="relative mt-14 aspect-[16/10] w-full overflow-hidden border border-line">
          <Image
            src="/salon/interior-1.jpg"
            alt={`Interior del estudio ${salon.name}`}
            fill
            priority
            sizes="100vw"
            className="img-photo object-cover"
          />
          <span className="absolute bottom-4 left-4 u-eyebrow bg-oat px-3 py-1.5 text-ink">
            {salon.contact.address.street}
          </span>
        </Reveal>
      </section>

      {/* ── Servicios ────────────────────────────────────────── */}
      <section className="border-y border-ink bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-4xl md:text-5xl">Servicios</h2>
            <Link
              href="/servicios"
              className="u-eyebrow link-underline"
            >
              Ver todos y precios
            </Link>
          </div>

          <ul className="mt-10">
            {featured.map((s, i) => (
              <Reveal
                as="li"
                key={s.slug}
                delayMs={i * 40}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-line py-5 last:border-b"
              >
                <span className="u-eyebrow">
                  {String(i + 1).padStart(2, "0")}
                </span>
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
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Trabajos ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="u-eyebrow">Trabajos</p>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">
              Selección reciente
            </h2>
          </div>
          <Link href="/galeria" className="u-eyebrow link-underline">
            Galería completa
          </Link>
        </div>

        <div className="mt-10">
          <GalleryGrid items={salon.gallery.slice(0, 3)} />
        </div>
      </section>

      {/* ── Proceso ──────────────────────────────────────────── */}
      <section className="border-y border-ink bg-ink text-oat">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-4xl md:text-5xl">
            Reservar lleva un minuto
          </h2>
          <ol className="mt-12 grid gap-px border border-oat/20 bg-oat/20 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="bg-ink p-6">
                <span className="u-eyebrow text-oat/50">{step.n}</span>
                <p className="font-display mt-3 text-2xl">{step.title}</p>
                <p className="mt-2 text-sm text-oat/70">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <Link href="/reservar" className="btn btn-light">
              Empezar reserva
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <p className="u-eyebrow">Reseñas</p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {salon.testimonials.map((t) => (
            <Reveal as="article" key={t.author}>
              <p className="font-display text-2xl leading-snug">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 u-eyebrow">{t.author}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA / ubicación ──────────────────────────────────── */}
      <section className="border-t border-ink bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">
              Te esperamos en {salon.contact.address.city}
            </h2>
            <p className="mt-4 max-w-sm text-cocoa">
              {salon.contact.address.street}, {salon.contact.address.postalCode}{" "}
              {salon.contact.address.city}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/reservar" className="btn btn-primary">
                Reservar
              </Link>
              <Link href="/contacto" className="btn btn-ghost">
                Cómo llegar
              </Link>
            </div>
          </div>
          <div className="aspect-[4/3] w-full border border-ink">
            <iframe
              title="Ubicación de la peluquería"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                salon.contact.maps.placeQuery,
              )}&output=embed`}
            />
          </div>
        </div>
      </section>
    </>
  );
}
