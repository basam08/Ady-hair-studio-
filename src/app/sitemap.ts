import type { MetadataRoute } from "next";
import { shopProducts } from "@/config/shop";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    "",
    "/servicios",
    "/tienda",
    "/galeria",
    "/contacto",
    "/reservar",
    ...shopProducts.map((p) => `/tienda/${p.slug}`),
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
