"use client";

import { useEffect, useRef } from "react";
import { cheapestChristmasPack, formatCents } from "@/config/shop";
import { useShop } from "@/components/shop/CartProvider";

export function ChristmasBanner() {
  const video = useRef<HTMLVideoElement>(null);
  const { setCategory, setQuery } = useShop();

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.pause();
      return;
    }
    // React no siempre escribe "muted" en el HTML y sin él no arranca solo.
    el.muted = true;
    el.play().catch(() => {});
  }, []);

  function showPacks() {
    setQuery("");
    setCategory("packs-navidad");
    document.getElementById("catalogo")?.scrollIntoView();
  }

  return (
    <section
      aria-label="Navidad en ADY Hair Studio"
      className="relative mx-auto max-w-[1440px] bg-ink"
    >
      <video
        ref={video}
        className="block aspect-[4/3] w-full object-cover sm:aspect-video lg:aspect-[21/10] lg:object-[center_70%]"
        src="/banner/navidad-banner.mp4"
        poster="/banner/navidad-banner.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        tabIndex={-1}
      />
      <div className="px-5 py-8 text-oat lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-[52%] lg:flex-col lg:justify-center lg:bg-gradient-to-r lg:from-black/70 lg:via-black/35 lg:to-transparent lg:pl-12 lg:pr-0">
        <div className="lg:max-w-[23rem]">
          <p className="u-eyebrow !text-oat/90">
            ✦ Navidad en ADY Hair Studio ✦
          </p>
          <h1 className="font-display font-display--hero mt-3 text-4xl md:text-5xl">
            Esta Navidad, regala cuidado
          </h1>
          <p className="mt-4 text-base text-oat/90">
            Packs K89 desde {formatCents(cheapestChristmasPack())}. Resérvalos en
            la web y págalos en el salón.
          </p>
          <button type="button" onClick={showPacks} className="btn btn-light mt-6">
            Ver packs de Navidad
          </button>
        </div>
      </div>
    </section>
  );
}
