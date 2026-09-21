import Image from "next/image";

interface Slide {
  src: string;
  alt: string;
}

/**
 * Carrusel de fondo puramente en CSS (sin JS): las fotos se van
 * encadenando en bucle con un fundido, cada una el mismo tiempo.
 */
export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const duration = slides.length * 5; // segundos por foto

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          sizes="100vw"
          className="img-photo hero-carousel-slide object-cover"
          style={{
            animationDuration: `${duration}s`,
            animationDelay: `${i * 5}s`,
          }}
        />
      ))}
    </div>
  );
}
