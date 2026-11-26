"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  MAX_UNITS_PER_PRODUCT,
  availableProducts,
  type AvailableProduct,
} from "@/config/shop";

const PRODUCTS = availableProducts();
const STORAGE_KEY = "ady-tienda-reserva";

interface ShopState {
  /** false hasta que se recupera la reserva guardada en el navegador. */
  ready: boolean;
  quantityOf: (slug: string) => number;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
  selected: AvailableProduct[];
  units: number;
  totalCents: number;
  // Filtros del listado: se conservan al entrar y salir de una ficha.
  category: string;
  setCategory: (id: string) => void;
  query: string;
  setQuery: (q: string) => void;
}

const ShopContext = createContext<ShopState | null>(null);

export function useShop(): ShopState {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop necesita CartProvider");
  return ctx;
}

const clamp = (n: number) =>
  Math.max(0, Math.min(MAX_UNITS_PER_PRODUCT, Math.trunc(n) || 0));

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
      const valid: Record<string, number> = {};
      for (const p of PRODUCTS) {
        const quantity = clamp(saved?.[p.slug]);
        if (quantity > 0) valid[p.slug] = quantity;
      }
      setCart(valid);
    } catch {
      // Sin almacenamiento o dato corrupto: se empieza con la reserva vacía.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // La reserva sigue funcionando en memoria.
    }
  }, [cart, ready]);

  const selected = PRODUCTS.filter((p) => cart[p.slug] > 0);

  const value: ShopState = {
    ready,
    quantityOf: (slug) => cart[slug] ?? 0,
    setQuantity: (slug, quantity) =>
      setCart((prev) => ({ ...prev, [slug]: clamp(quantity) })),
    clear: () => setCart({}),
    selected,
    units: selected.reduce((n, p) => n + cart[p.slug], 0),
    totalCents: selected.reduce(
      (sum, p) => sum + p.priceCents * cart[p.slug],
      0,
    ),
    category,
    setCategory,
    query,
    setQuery,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
