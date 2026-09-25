import Link from "next/link";
import { salon, formatPrice, formatDuration } from "@/config/salon";
import { Reveal } from "@/components/site/Reveal";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { HeroCarousel } from "@/components/site/HeroCarousel";

const HERO_SLIDES = [
  { src: "/salon/hero-1.jpg", alt: "Fachada del estudio" },
  { src: "/salon/interior-2.jpg", alt: "Interior del estudio" },
  { src: "/gallery/estudio-interior.jpg", alt: "Dentro del estudio" },
];

const FAQS = [
  {
    q: "¿Necesito reservar cita o puedo venir sin avisar?",
    a: "Lo mejor es reservar online: así aseguras la hora y el peluquero que prefieras. El sistema solo muestra huecos realmente libres.",
  },
  {
    q: "¿Puedo elegir peluquero al reservar?",
    a: "Sí. Al reservar eliges entre Ady, Carlos o Mila, y solo se te muestran los huecos libres de esa persona.",
  },
  {
    q: "¿Puedo cancelar o cambiar mi cita?",
    a: "Sí, sin llamar. En el email de confirmación recibes un enlace para cancelarla o cambiar el día y la hora tú mismo.",
  },
  {
    q: "¿Puedo reservar mechas o balayage desde la web?",
    a: "Ese tipo de servicios necesita valorar el pelo antes de dar precio y hora, así que se reservan escribiendo por WhatsApp en vez de online.",
  },
  {
    q: "¿Hacéis cortes para niños y niñas?",
    a: "Sí, tenemos servicio específico de corte para niña y para niño.",
  },
  {
    q: "¿Cuál es el horario del salón?",
    a: "Martes a viernes de 10:00 a 20:00, sábados de 10:00 a 14:00. Lunes y festivos, cerrado.",
  },
] as const;

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
          <HeroCarousel slides={HERO_SLIDES} />
          <span className="absolute bottom-4 left-4 z-10 u-eyebrow bg-oat px-3 py-1.5 text-ink">
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
          <GalleryGrid items={salon.gallery.slice(0, 4)} />
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
      <section className="border-y border-ink bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="u-eyebrow">Reseñas</p>
          <h2 className="font-display mt-3 text-4xl md:text-5xl">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="marquee mt-12">
          <div className="marquee-track">
            {[...salon.testimonials, ...salon.testimonials].map((t, i) => (
              <article
                key={`${t.author}-${i}`}
                className="w-[320px] shrink-0 border border-line bg-oat p-6 sm:w-[380px]"
              >
                <p className="text-base leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-4 u-eyebrow">{t.author}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preguntas frecuentes ─────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="u-eyebrow">Dudas</p>
        <h2 className="font-display mt-3 text-4xl md:text-5xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg marker:content-none">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-2xl text-cocoa transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cocoa">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            }),
          }}
        />
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
