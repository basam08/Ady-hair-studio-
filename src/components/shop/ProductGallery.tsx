"use client";

import { useState } from "react";
import type { ShopPhoto } from "@/config/shop";

export function ProductGallery({ photos }: { photos: ShopPhoto[] }) {
  const [index, setIndex] = useState(0);
  const photo = photos[index] ?? photos[0];

  return (
    <div>
      <figure>
        <div className="border border-line bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            width={800}
            height={600}
            className={`aspect-[4/3] w-full object-contain ${
              photo.scene ? "" : "p-2"
            }`}
          />
        </div>
        <figcaption className="mt-2 text-xs text-cocoa" aria-live="polite">
          {photo.caption}
        </figcaption>
      </figure>

      {photos.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <li key={p.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1} de ${photos.length}: ${p.alt}`}
                aria-current={i === index}
                // "ring" y no borde: globals.css fija el color de todos los bordes.
                className={`block w-full border bg-white ${
                  i === index ? "ring-2 ring-ink" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt=""
                  loading="lazy"
                  className={`aspect-square w-full ${
                    p.scene ? "object-cover" : "object-contain p-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
