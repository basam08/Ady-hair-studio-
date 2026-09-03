"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { salon } from "@/config/salon";

const NAV = [
  { href: "/servicios", label: "Servicios" },
  { href: "/galeria", label: "Galería" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-oat/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-tight"
        >
          {salon.name}
          <span aria-hidden>.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`u-eyebrow pb-1 ${
                  active
                    ? "border-b border-ink text-ink"
                    : "border-b border-transparent text-cocoa hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/reservar" className="btn btn-primary">
            Reservar
          </Link>
        </nav>

        <button
          type="button"
          className="u-mono text-xs uppercase tracking-widest md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-line px-5 py-3 md:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="u-mono py-2 text-sm uppercase tracking-widest"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/reservar"
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-2"
          >
            Reservar
          </Link>
        </nav>
      )}
    </header>
  );
}
