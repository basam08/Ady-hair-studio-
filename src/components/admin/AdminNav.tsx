"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/clientes", label: "Clientes" },
];

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-ink bg-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-6">
          <span className="font-display text-xl">
            Ady<span className="text-persimmon">.</span> panel
          </span>
          <nav className="flex gap-4">
            {LINKS.map((l) => {
              const active =
                l.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`u-mono text-xs uppercase tracking-widest link-underline ${
                    active ? "text-persimmon" : "text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="u-mono text-xs text-cocoa">{name}</span>
          <button
            type="button"
            onClick={logout}
            className="u-mono text-xs uppercase tracking-widest link-underline"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
