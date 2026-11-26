// Catálogo de la tienda. Los productos se reservan en la web y se pagan en
// el salón. Este es el único archivo a editar para cambiar productos,
// precios, textos o fotos.
//
// · Precios en céntimos (3480 = 34,80 €).
// · priceCents: null → el producto se muestra, pero no se puede reservar:
//   aparece "Precio en el salón" con un enlace para preguntar por WhatsApp.
// · Las descripciones resumen las fichas de cada producto en k89.es, sin
//   promesas de resultados ni afirmaciones de salud añadidas.

export const SHOP_SECTIONS = [
  {
    id: "packs-sweet-care",
    menu: "Packs",
    title: "Packs Sweet Care",
    intro: "Combinaciones de cuidado del cabello a precio de pack.",
  },
  {
    id: "packs-scalp-care",
    menu: "Packs cuero cabelludo",
    title: "Packs Scalp Care",
    intro: "Champú, mascarilla y loción para el cuero cabelludo.",
  },
  {
    id: "hidratacion",
    menu: "Hidratación",
    title: "Hidratación",
    intro:
      "Línea Moisturizing, con aceite de pepita de uva y ácido hialurónico.",
  },
  {
    id: "reparacion",
    menu: "Reparación",
    title: "Reparación",
    intro:
      "Línea Repair, con el complejo de proteínas Keravis, para cabello dañado.",
  },
  {
    id: "restauracion",
    menu: "Restauración",
    title: "Restauración",
    intro: "Línea Restore, con queratina hidrolizada y proteínas de seda.",
  },
  {
    id: "volumen",
    menu: "Volumen",
    title: "Volumen",
    intro: "Línea Volume, con SymControl Scalp, para cabello fino.",
  },
  {
    id: "rubios",
    menu: "Rubios y canas",
    title: "Rubios y canas",
    intro: "Línea Silver, con pigmentos violetas.",
  },
  {
    id: "color-y-brillo",
    menu: "Color y brillo",
    title: "Color y brillo",
    intro: "Líneas Colour y Glow.",
  },
  {
    id: "cuero-cabelludo",
    menu: "Cuero cabelludo",
    title: "Cuero cabelludo",
    intro: "Línea Scalp Care: caspa, sensibilidad y equilibrio.",
  },
  {
    id: "rizos",
    menu: "Rizos",
    title: "Rizos",
    intro: "Método Curly.",
  },
] as const;

export type ShopSectionId = (typeof SHOP_SECTIONS)[number]["id"];

export interface ShopProduct {
  slug: string;
  section: ShopSectionId;
  /** Título en español. */
  name: string;
  /** Nombre que pone en la etiqueta y tamaño. */
  label?: string;
  description: string;
  howTo?: string;
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

// Cómo se usa: textos que se repiten en varios productos.
const LATHER =
  "Aplica sobre el pelo mojado, masajea hasta hacer espuma y aclara bien.";
const MASK_10 =
  "Con el pelo lavado y húmedo, deja actuar 10 minutos y aclara bien.";
const SERUM =
  "Con el pelo húmedo o seco, reparte una pequeña cantidad de medios a puntas.";
const SCALP_SHAMPOO =
  "Aplica sobre el cuero cabelludo mojado, masajea y aclara bien. Repite si hace falta.";
const SCALP_MASK =
  "Aplica en el cuero cabelludo y el cabello mojado (el cuero cabelludo puede estar seco). Deja actuar 15 minutos y aclara. Lava si hace falta.";
const SCALP_LOTION = "Aplica sobre el cuero cabelludo limpio. No se aclara.";

/** Producto suelto. `file` es el nombre de la foto en public/productos/. */
function single(
  section: ShopSectionId,
  file: string,
  name: string,
  label: string,
  description: string,
  howTo: string,
): ShopProduct {
  return {
    slug: file,
    section,
    name,
    label,
    description,
    howTo,
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
    LATHER,
  ),
  single(
    "hidratacion",
    "moisturizing-conditioner-330",
    "Acondicionador hidratante",
    "Moisturizing Conditioner · 330 ml",
    "Hidrata y facilita el peinado. Para cabello seco, encrespado o sin brillo.",
    "De medios a puntas con el pelo mojado. Deja actuar 2 minutos y aclara bien.",
  ),
  single(
    "hidratacion",
    "moisturizing-mask-300",
    "Mascarilla hidratante",
    "Moisturizing Mask · 300 ml",
    "Hidratación para cabello seco o encrespado. También para pelo rizado u ondulado.",
    "De medios a puntas con el pelo mojado. Deja actuar 10 minutos y aclara bien.",
  ),
  single(
    "hidratacion",
    "moisturizing-serum-100",
    "Sérum hidratante",
    "Moisturizing Serum · 100 ml",
    "Para cabello seco, deshidratado, encrespado o sin brillo.",
    SERUM,
  ),

  single(
    "reparacion",
    "repair-shampoo-330",
    "Champú reparador",
    "Repair Shampoo · 330 ml",
    "Para cabello castigado, quebradizo, decolorado o con mechas.",
    LATHER,
  ),
  single(
    "reparacion",
    "repair-mask-300",
    "Mascarilla reparadora",
    "Repair Mask · 300 ml",
    "Nutre el cabello dañado por tratamientos químicos o por el calor.",
    MASK_10,
  ),
  single(
    "reparacion",
    "repair-serum-100",
    "Sérum reparador",
    "Repair Serum · 100 ml",
    "Para cabello estropeado, decolorado o con mechas.",
    SERUM,
  ),
  single(
    "reparacion",
    "repair-treatment-10-benefits-250",
    "Tratamiento reparador en spray",
    "Treatment 10 Benefits · 250 ml",
    "Sin aclarado y sin aportar peso, para cabello dañado.",
    "Agita, pulveriza sobre el pelo húmedo y peina.",
  ),

  single(
    "restauracion",
    "restore-shampoo-330",
    "Champú restaurador",
    "Restore Shampoo · 330 ml",
    "Para cabello estropeado, seco, teñido o con mechas.",
    LATHER,
  ),
  single(
    "restauracion",
    "restore-mask-300",
    "Mascarilla restauradora",
    "Restore Mask · 300 ml",
    "Acondiciona en profundidad el cabello estropeado, seco o teñido.",
    MASK_10,
  ),
  single(
    "restauracion",
    "restore-serum-100",
    "Sérum restaurador",
    "Restore Serum · 100 ml",
    "Aporta brillo sin peso al cabello seco, teñido o con mechas.",
    SERUM,
  ),

  single(
    "volumen",
    "volume-shampoo-330",
    "Champú de volumen",
    "Volume Shampoo · 330 ml",
    "Da cuerpo al cabello fino o debilitado y ayuda a retirar el exceso de grasa.",
    LATHER,
  ),
  single(
    "volumen",
    "volume-salt-shampoo-300",
    "Champú de volumen con sal marina",
    "Volume Salt Shampoo · 300 ml",
    "Para cabello fino o con tendencia grasa. Viene en tarro.",
    LATHER,
  ),
  single(
    "volumen",
    "volume-mask-300",
    "Mascarilla de volumen",
    "Volume Mask · 300 ml",
    "Acondiciona y da cuerpo al cabello fino o con tendencia grasa.",
    MASK_10,
  ),

  single(
    "rubios",
    "blonde-silver-shampoo-330",
    "Champú violeta",
    "Silver Shampoo · 330 ml",
    "Matiza los tonos dorados y anaranjados en cabello rubio, con mechas o canas.",
    "Lava dos veces. En la segunda, deja actuar 5 minutos y aclara bien.",
  ),
  single(
    "rubios",
    "blonde-silver-mask-300",
    "Mascarilla violeta",
    "Silver Mask · 300 ml",
    "Matiza y acondiciona el cabello rubio, con mechas o canas.",
    MASK_10,
  ),

  single(
    "color-y-brillo",
    "colour-shampoo-330",
    "Champú para cabello teñido",
    "Colour Shampoo · 330 ml",
    "Con Chromapol, para ayudar a proteger el color. Para pelo teñido, poroso o con mechas.",
    "Lava dos veces. En la segunda, deja actuar 2 minutos y aclara bien.",
  ),
  single(
    "color-y-brillo",
    "glow-shampoo-330",
    "Champú de brillo",
    "Glow Shampoo · 330 ml",
    "Antiencrespado, con extractos de algodón, rosa mosqueta y argán.",
    LATHER,
  ),
  single(
    "color-y-brillo",
    "glow-mask-300",
    "Mascarilla de brillo",
    "Glow Mask · 300 ml",
    "Hidrata y ayuda a controlar el encrespado en cabello apagado o seco.",
    "De medios a puntas con el pelo mojado. Deja actuar de 5 a 10 minutos y aclara bien.",
  ),

  single(
    "cuero-cabelludo",
    "anti-dandruff-shampoo-330",
    "Champú anticaspa",
    "Anti Dandruff Shampoo · 330 ml",
    "Con Crinipan PMC Green y extracto de uva. Limpia el cuero cabelludo y el cabello.",
    SCALP_SHAMPOO,
  ),
  single(
    "cuero-cabelludo",
    "anti-dandruff-mask-300",
    "Mascarilla anticaspa",
    "Anti Dandruff Mask · 300 ml",
    "Para el cuero cabelludo con caspa. También se puede usar en medios y puntas.",
    SCALP_MASK,
  ),
  single(
    "cuero-cabelludo",
    "anti-dandruff-lotion-100",
    "Loción anticaspa",
    "Anti Dandruff Lotion · 100 ml",
    "Calma e hidrata el cuero cabelludo con caspa.",
    SCALP_LOTION,
  ),
  single(
    "cuero-cabelludo",
    "sensitive-shampoo-330",
    "Champú para cuero cabelludo sensible",
    "Sensitive Shampoo · 330 ml",
    "Limpia con suavidad. Para todo tipo de cabello.",
    SCALP_SHAMPOO,
  ),
  single(
    "cuero-cabelludo",
    "sensitive-mask-300",
    "Mascarilla para cuero cabelludo sensible",
    "Sensitive Mask · 300 ml",
    "Con pantenol y extracto de uva. También se puede usar en medios y puntas.",
    SCALP_MASK,
  ),
  single(
    "cuero-cabelludo",
    "sensitive-lotion-100",
    "Loción para cuero cabelludo sensible",
    "Sensitive Lotion · 100 ml",
    "Hidratante, con pantenol, manzanilla y extracto de uva.",
    SCALP_LOTION,
  ),
  single(
    "cuero-cabelludo",
    "microbiome-shampoo-330",
    "Champú equilibrante",
    "Sweat and Microbiome Balance Shampoo · 330 ml",
    "Pensado para equilibrar el sudor y el microbioma del cuero cabelludo.",
    SCALP_SHAMPOO,
  ),
  single(
    "cuero-cabelludo",
    "remineralizing-mask-300",
    "Mascarilla remineralizante",
    "Remineralizing Mask · 300 ml",
    "Con niacinamida y vitaminas C y E. Ayuda a regular el exceso de grasa.",
    SCALP_MASK,
  ),
  single(
    "cuero-cabelludo",
    "microbiome-lotion-100",
    "Loción equilibrante",
    "Sweat and Microbiome Balance Lotion · 100 ml",
    "Con Up-Citrus, manzanilla y extracto de uva.",
    "En el cuero cabelludo limpio, sin aclarar. O antes del lavado, dejándola al menos 20 minutos.",
  ),

  single(
    "rizos",
    "curly-protein-concentrate-30",
    "Concentrado de proteína",
    "Protein Concentrate · 30 ml",
    "Con colágeno y proteína de soja. Para cabello fino, quebradizo o dañado, o rizo que no se mantiene.",
    "Solo o mezclado con otros productos. En mascarilla o acondicionador, una pipeta.",
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
