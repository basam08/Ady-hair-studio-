// Catálogo de la tienda. Los productos se reservan en la web y se pagan en
// el salón. Este es el único archivo a editar para cambiar productos,
// precios, textos o fotos.
//
// · Precios en céntimos (3480 = 34,80 €).
// · priceCents: null → el producto se muestra, pero no se puede reservar:
//   aparece "Precio en el salón" con un enlace para preguntar por WhatsApp.
// · Las descripciones resumen las fichas de cada producto en k89.es, sin
//   promesas de resultados ni afirmaciones de salud añadidas.

/** Línea o familia de cada producto. */
export const SECTION_TITLES = {
  "packs-sweet-care": "Packs Sweet Care",
  "packs-scalp-care": "Packs Scalp Care",
  hidratacion: "Hidratación",
  reparacion: "Reparación",
  restauracion: "Restauración",
  volumen: "Volumen",
  rubios: "Rubios y canas",
  "color-y-brillo": "Color y brillo",
  "cuero-cabelludo": "Cuero cabelludo",
  rizos: "Rizos",
} as const;

export type ShopSectionId = keyof typeof SECTION_TITLES;

export interface ShopProduct {
  slug: string;
  section: ShopSectionId;
  /** Título en español. */
  name: string;
  /** Nombre que pone en la etiqueta y tamaño. */
  label?: string;
  description: string;
  /** Lo que incluye un pack. */
  contents?: string[];
  priceCents: number | null;
  /** Ruta dentro de public/. */
  image: string;
}

/** Máximo de unidades de un mismo producto por reserva. */
export const MAX_UNITS_PER_PRODUCT = 5;

const FLASH = "3 Flash Repair Lotion";

function pack(
  section: "packs-sweet-care" | "packs-scalp-care",
  id: string,
  name: string,
  priceCents: number,
  description: string,
  contents: string[],
): ShopProduct {
  return {
    slug: `pack-${id}`,
    section,
    name: `Pack ${name}`,
    description,
    contents,
    priceCents,
    image: `/productos/pack-${id}.jpg`,
  };
}

const packs: ShopProduct[] = [
  pack(
    "packs-sweet-care",
    "moisturizing-flash",
    "Moisturizing + Flash",
    3480,
    "Para hidratar cabello seco, encrespado o sin brillo.",
    ["Moisturizing Shampoo 330ml", "Moisturizing Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "moisturizing-serum",
    "Moisturizing + Serum",
    4770,
    "Rutina de hidratación con champú, mascarilla y sérum.",
    [
      "Moisturizing Shampoo 330ml",
      "Moisturizing Mask 300ml",
      "Moisturizing Serum 100ml",
    ],
  ),
  pack(
    "packs-sweet-care",
    "repair-flash",
    "Repair + Flash",
    3480,
    "Para cabello dañado por tratamientos químicos o calor.",
    ["Repair Shampoo 330ml", "Repair Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "repair-serum",
    "Repair + Serum",
    4770,
    "Para cabello dañado, con champú, mascarilla y sérum.",
    ["Repair Shampoo 330ml", "Repair Mask 300ml", "Repair Serum 100ml"],
  ),
  pack(
    "packs-sweet-care",
    "restore-flash",
    "Restore + Flash",
    4325,
    "Para cabello estropeado, seco, con mechas o teñido.",
    ["Restore Shampoo 330ml", "Restore Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "restore-serum",
    "Restore + Serum",
    5580,
    "Línea Restore con champú, mascarilla y sérum.",
    ["Restore Shampoo 330ml", "Restore Mask 300ml", "Restore Serum 100ml"],
  ),
  pack(
    "packs-sweet-care",
    "silver",
    "Silver",
    4265,
    "Para matizar tonos dorados en cabello rubio, con mechas o canas.",
    ["Silver Shampoo 330ml", "Silver Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "volume-flash",
    "Volume + Flash",
    3480,
    "Para dar cuerpo al cabello fino.",
    ["Volume Shampoo 330ml", "Volume Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "volume-salt-flash",
    "Volume Salt + Flash",
    3250,
    "Para cabello fino, con el champú de volumen y el de sal marina.",
    ["Volume Shampoo 330ml", "Volume Salt Shampoo 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "glow-flash",
    "Glow + Flash",
    4280,
    "Para cabello apagado o encrespado.",
    ["Glow Shampoo 330ml", "Glow Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "colour-moisturizing-flash",
    "Colour + Moisturizing + Flash",
    3480,
    "Para cuidar el cabello teñido y aportar hidratación.",
    ["Colour Shampoo 330ml", "Moisturizing Mask 300ml", FLASH],
  ),
  pack(
    "packs-sweet-care",
    "colour-moisturizing-serum",
    "Colour + Moisturizing + Serum",
    4770,
    "Cuidado del cabello teñido e hidratación, con sérum.",
    [
      "Colour Shampoo 330ml",
      "Moisturizing Mask 300ml",
      "Moisturizing Serum 100ml",
    ],
  ),
  pack(
    "packs-scalp-care",
    "anti-dandruff",
    "Anti Dandruff",
    5760,
    "Rutina anticaspa para el cuero cabelludo.",
    [
      "Anti Dandruff Shampoo 330ml",
      "Anti Dandruff Mask 300ml",
      "Anti Dandruff Lotion 100ml",
    ],
  ),
  pack(
    "packs-scalp-care",
    "sensitive",
    "Sensitive",
    5760,
    "Rutina para el cuero cabelludo sensible.",
    [
      "Sensitive Shampoo 330ml",
      "Sensitive Mask 300ml",
      "Sensitive Lotion 100ml",
    ],
  ),
  pack(
    "packs-scalp-care",
    "microbiome",
    "Microbiome",
    5760,
    "Rutina de equilibrio del sudor y del microbioma del cuero cabelludo.",
    [
      "Microbiome Balance Shampoo 330ml",
      "Remineralizing Mask 300ml",
      "Microbiome Balance Lotion 100ml",
    ],
  ),
];

/** Producto suelto. `file` es el nombre de la foto en public/productos/. */
function single(
  section: ShopSectionId,
  file: string,
  name: string,
  label: string,
  description: string,
): ShopProduct {
  return {
    slug: file,
    section,
    name,
    label,
    description,
    // Pendiente de que el salón confirme el precio de cada producto.
    priceCents: null,
    image: `/productos/${file}.jpg`,
  };
}

const singles: ShopProduct[] = [
  single(
    "hidratacion",
    "moisturizing-shampoo-330",
    "Champú hidratante",
    "Moisturizing Shampoo · 330 ml",
    "Para cabello seco, encrespado o sin brillo. También para pelo rizado u ondulado.",
  ),
  single(
    "hidratacion",
    "moisturizing-conditioner-330",
    "Acondicionador hidratante",
    "Moisturizing Conditioner · 330 ml",
    "Hidrata y facilita el peinado. Para cabello seco, encrespado o sin brillo.",
  ),
  single(
    "hidratacion",
    "moisturizing-mask-300",
    "Mascarilla hidratante",
    "Moisturizing Mask · 300 ml",
    "Hidratación para cabello seco o encrespado. También para pelo rizado u ondulado.",
  ),
  single(
    "hidratacion",
    "moisturizing-serum-100",
    "Sérum hidratante",
    "Moisturizing Serum · 100 ml",
    "Para cabello seco, deshidratado, encrespado o sin brillo.",
  ),

  single(
    "reparacion",
    "repair-shampoo-330",
    "Champú reparador",
    "Repair Shampoo · 330 ml",
    "Para cabello castigado, quebradizo, decolorado o con mechas.",
  ),
  single(
    "reparacion",
    "repair-mask-300",
    "Mascarilla reparadora",
    "Repair Mask · 300 ml",
    "Nutre el cabello dañado por tratamientos químicos o por el calor.",
  ),
  single(
    "reparacion",
    "repair-serum-100",
    "Sérum reparador",
    "Repair Serum · 100 ml",
    "Para cabello estropeado, decolorado o con mechas.",
  ),
  single(
    "reparacion",
    "repair-treatment-10-benefits-250",
    "Tratamiento reparador en spray",
    "Treatment 10 Benefits · 250 ml",
    "Sin aclarado y sin aportar peso, para cabello dañado.",
  ),

  single(
    "restauracion",
    "restore-shampoo-330",
    "Champú restaurador",
    "Restore Shampoo · 330 ml",
    "Para cabello estropeado, seco, teñido o con mechas.",
  ),
  single(
    "restauracion",
    "restore-mask-300",
    "Mascarilla restauradora",
    "Restore Mask · 300 ml",
    "Acondiciona en profundidad el cabello estropeado, seco o teñido.",
  ),
  single(
    "restauracion",
    "restore-serum-100",
    "Sérum restaurador",
    "Restore Serum · 100 ml",
    "Aporta brillo sin peso al cabello seco, teñido o con mechas.",
  ),

  single(
    "volumen",
    "volume-shampoo-330",
    "Champú de volumen",
    "Volume Shampoo · 330 ml",
    "Da cuerpo al cabello fino o debilitado y ayuda a retirar el exceso de grasa.",
  ),
  single(
    "volumen",
    "volume-salt-shampoo-300",
    "Champú de volumen con sal marina",
    "Volume Salt Shampoo · 300 ml",
    "Para cabello fino o con tendencia grasa. Viene en tarro.",
  ),
  single(
    "volumen",
    "volume-mask-300",
    "Mascarilla de volumen",
    "Volume Mask · 300 ml",
    "Acondiciona y da cuerpo al cabello fino o con tendencia grasa.",
  ),

  single(
    "rubios",
    "blonde-silver-shampoo-330",
    "Champú violeta",
    "Silver Shampoo · 330 ml",
    "Matiza los tonos dorados y anaranjados en cabello rubio, con mechas o canas.",
  ),
  single(
    "rubios",
    "blonde-silver-mask-300",
    "Mascarilla violeta",
    "Silver Mask · 300 ml",
    "Matiza y acondiciona el cabello rubio, con mechas o canas.",
  ),

  single(
    "color-y-brillo",
    "colour-shampoo-330",
    "Champú para cabello teñido",
    "Colour Shampoo · 330 ml",
    "Con Chromapol, para ayudar a proteger el color. Para pelo teñido, poroso o con mechas.",
  ),
  single(
    "color-y-brillo",
    "glow-shampoo-330",
    "Champú de brillo",
    "Glow Shampoo · 330 ml",
    "Antiencrespado, con extractos de algodón, rosa mosqueta y argán.",
  ),
  single(
    "color-y-brillo",
    "glow-mask-300",
    "Mascarilla de brillo",
    "Glow Mask · 300 ml",
    "Hidrata y ayuda a controlar el encrespado en cabello apagado o seco.",
  ),

  single(
    "cuero-cabelludo",
    "anti-dandruff-shampoo-330",
    "Champú anticaspa",
    "Anti Dandruff Shampoo · 330 ml",
    "Con Crinipan PMC Green y extracto de uva. Limpia el cuero cabelludo y el cabello.",
  ),
  single(
    "cuero-cabelludo",
    "anti-dandruff-mask-300",
    "Mascarilla anticaspa",
    "Anti Dandruff Mask · 300 ml",
    "Para el cuero cabelludo con caspa. También se puede usar en medios y puntas.",
  ),
  single(
    "cuero-cabelludo",
    "anti-dandruff-lotion-100",
    "Loción anticaspa",
    "Anti Dandruff Lotion · 100 ml",
    "Calma e hidrata el cuero cabelludo con caspa.",
  ),
  single(
    "cuero-cabelludo",
    "sensitive-shampoo-330",
    "Champú para cuero cabelludo sensible",
    "Sensitive Shampoo · 330 ml",
    "Limpia con suavidad. Para todo tipo de cabello.",
  ),
  single(
    "cuero-cabelludo",
    "sensitive-mask-300",
    "Mascarilla para cuero cabelludo sensible",
    "Sensitive Mask · 300 ml",
    "Con pantenol y extracto de uva. También se puede usar en medios y puntas.",
  ),
  single(
    "cuero-cabelludo",
    "sensitive-lotion-100",
    "Loción para cuero cabelludo sensible",
    "Sensitive Lotion · 100 ml",
    "Hidratante, con pantenol, manzanilla y extracto de uva.",
  ),
  single(
    "cuero-cabelludo",
    "microbiome-shampoo-330",
    "Champú equilibrante",
    "Sweat and Microbiome Balance Shampoo · 330 ml",
    "Pensado para equilibrar el sudor y el microbioma del cuero cabelludo.",
  ),
  single(
    "cuero-cabelludo",
    "remineralizing-mask-300",
    "Mascarilla remineralizante",
    "Remineralizing Mask · 300 ml",
    "Con niacinamida y vitaminas C y E. Ayuda a regular el exceso de grasa.",
  ),
  single(
    "cuero-cabelludo",
    "microbiome-lotion-100",
    "Loción equilibrante",
    "Sweat and Microbiome Balance Lotion · 100 ml",
    "Con Up-Citrus, manzanilla y extracto de uva.",
  ),

  single(
    "rizos",
    "curly-protein-concentrate-30",
    "Concentrado de proteína",
    "Protein Concentrate · 30 ml",
    "Con colágeno y proteína de soja. Para cabello fino, quebradizo o dañado, o rizo que no se mantiene.",
  ),
];

export const shopProducts: ShopProduct[] = [...packs, ...singles];

export type AvailableProduct = ShopProduct & { priceCents: number };

export function isAvailable(p: ShopProduct): p is AvailableProduct {
  return p.priceCents !== null;
}

/** Solo lo que tiene precio se puede reservar. */
export function availableProducts(): AvailableProduct[] {
  return shopProducts.filter(isAvailable);
}

/** Nombre sin ambigüedad para la reserva, el panel y los correos. */
export function orderName(p: ShopProduct): string {
  return p.label ? `${p.name} (${p.label})` : p.name;
}

/** "34,80 €" — siempre con céntimos. */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

// ── Fotos ───────────────────────────────────────────────────────

/** Productos sueltos que forman cada pack (las ampollas van aparte). */
export const PACK_COMPONENTS: Record<string, string[]> = {
  "pack-moisturizing-flash": ["moisturizing-shampoo-330", "moisturizing-mask-300"],
  "pack-moisturizing-serum": ["moisturizing-shampoo-330", "moisturizing-mask-300", "moisturizing-serum-100"],
  "pack-repair-flash": ["repair-shampoo-330", "repair-mask-300"],
  "pack-repair-serum": ["repair-shampoo-330", "repair-mask-300", "repair-serum-100"],
  "pack-restore-flash": ["restore-shampoo-330", "restore-mask-300"],
  "pack-restore-serum": ["restore-shampoo-330", "restore-mask-300", "restore-serum-100"],
  "pack-silver": ["blonde-silver-shampoo-330", "blonde-silver-mask-300"],
  "pack-volume-flash": ["volume-shampoo-330", "volume-mask-300"],
  "pack-volume-salt-flash": ["volume-shampoo-330", "volume-salt-shampoo-300"],
  "pack-glow-flash": ["glow-shampoo-330", "glow-mask-300"],
  "pack-colour-moisturizing-flash": ["colour-shampoo-330", "moisturizing-mask-300"],
  "pack-colour-moisturizing-serum": ["colour-shampoo-330", "moisturizing-mask-300", "moisturizing-serum-100"],
  "pack-anti-dandruff": ["anti-dandruff-shampoo-330", "anti-dandruff-mask-300", "anti-dandruff-lotion-100"],
  "pack-sensitive": ["sensitive-shampoo-330", "sensitive-mask-300", "sensitive-lotion-100"],
  "pack-microbiome": ["microbiome-shampoo-330", "remineralizing-mask-300", "microbiome-lotion-100"],
};

export function hasFlash(p: ShopProduct): boolean {
  return p.contents?.includes(FLASH) ?? false;
}

/** Packs con foto navideña de K89 (el de Glow no tiene). */
export function hasChristmasPhoto(p: ShopProduct): boolean {
  return Boolean(p.contents) && p.slug !== "pack-glow-flash";
}

export interface ShopPhoto {
  src: string;
  alt: string;
  caption: string;
  /** true: foto de ambiente que llena el marco; false: producto sobre fondo. */
  scene: boolean;
}

function christmasPhoto(pack: ShopProduct, caption: string): ShopPhoto {
  return {
    src: `/productos/navidad/${pack.slug}.jpg`,
    alt: `${pack.name} con su caja de Navidad`,
    caption,
    scene: true,
  };
}

function studioPhoto(p: ShopProduct, caption: string): ShopPhoto {
  return { src: p.image, alt: orderName(p), caption, scene: false };
}

/** Todas las fotos de un producto. La primera es la de la tarjeta. */
export function productPhotos(p: ShopProduct): ShopPhoto[] {
  if (p.contents) {
    const photos: ShopPhoto[] = [];
    if (hasChristmasPhoto(p)) {
      photos.push(
        christmasPhoto(
          p,
          "Foto navideña de K89. El color de la caja puede variar.",
        ),
      );
    }
    photos.push(
      studioPhoto(
        p,
        hasFlash(p)
          ? "Productos del pack. Las ampollas no salen en esta imagen."
          : "Productos del pack.",
      ),
    );
    for (const slug of PACK_COMPONENTS[p.slug] ?? []) {
      const part = findProduct(slug);
      if (part) photos.push(studioPhoto(part, orderName(part)));
    }
    if (hasFlash(p)) {
      photos.push({
        src: "/productos/flash-repair-ampollas.jpg",
        alt: "Ampollas Flash Repair Lotion",
        caption:
          "Flash Repair Lotion. La foto muestra la caja de 8 ampollas; este pack lleva 3.",
        scene: false,
      });
    }
    return photos;
  }

  const photos = [studioPhoto(p, orderName(p))];
  const inPacks = shopProducts.filter(
    (pack) =>
      hasChristmasPhoto(pack) && PACK_COMPONENTS[pack.slug]?.includes(p.slug),
  );
  for (const pack of inPacks.slice(0, 2)) {
    photos.push(
      christmasPhoto(pack, `En el ${pack.name} (foto navideña de K89).`),
    );
  }
  if (p.slug === "glow-shampoo-330" || p.slug === "glow-mask-300") {
    photos.push({
      src: "/banner/navidad-banner.jpg",
      alt: "Línea Glow de K89",
      caption:
        "Línea Glow de K89. Salen formatos que no están en esta tienda.",
      scene: true,
    });
  }
  return photos;
}

export function findProduct(slug: string): ShopProduct | undefined {
  return shopProducts.find((p) => p.slug === slug);
}

// ── Categorías de la tienda ─────────────────────────────────────

export const SHOP_CATEGORIES: {
  id: string;
  name: string;
  match: (p: ShopProduct) => boolean;
}[] = [
  { id: "todos", name: "Todos", match: () => true },
  { id: "packs-navidad", name: "Packs Navidad", match: hasChristmasPhoto },
  { id: "packs", name: "Todos los packs", match: (p) => Boolean(p.contents) },
  {
    id: "champu",
    name: "Champú",
    match: (p) => !p.contents && p.slug.includes("-shampoo-"),
  },
  {
    id: "mascarilla",
    name: "Mascarilla",
    match: (p) => !p.contents && p.slug.includes("-mask-"),
  },
  {
    id: "acondicionador-serum",
    name: "Acondicionador / Sérum",
    match: (p) => !p.contents && /-(serum|conditioner)-/.test(p.slug),
  },
  {
    id: "tratamientos",
    name: "Tratamientos / Lociones",
    match: (p) => !p.contents && /lotion|treatment|concentrate/.test(p.slug),
  },
  {
    id: "scalp-care",
    name: "Scalp Care – Cuero cabelludo",
    match: (p) =>
      p.section === "cuero-cabelludo" || p.section === "packs-scalp-care",
  },
  { id: "curly", name: "Método Curly", match: (p) => p.section === "rizos" },
];

/** El precio más bajo entre los packs navideños, para el banner. */
export function cheapestChristmasPack(): number {
  return Math.min(
    ...availableProducts()
      .filter(hasChristmasPhoto)
      .map((p) => p.priceCents),
  );
}
