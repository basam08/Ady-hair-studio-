import Image from "next/image";
import type { GalleryItem } from "@/config/salon";
import { Reveal } from "@/components/site/Reveal";

/** Rejilla editorial de trabajos. */
export function GalleryGrid({
  items,
  columns = 3,
}: {
  items: readonly GalleryItem[];
  columns?: 2 | 3;
}) {
  return (
    <div
      className={`grid gap-x-6 gap-y-10 sm:grid-cols-2 ${
        columns === 3 ? "lg:grid-cols-3" : ""
      }`}
    >
      {items.map((item, i) => (
        <Reveal key={`${item.title}-${i}`} as="article" delayMs={(i % 3) * 60}>
          <figure className="group">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-cream">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="img-photo object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
              <span className="font-display text-lg">{item.title}</span>
              <span className="u-eyebrow">{item.category}</span>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
