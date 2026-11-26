// Ficha ampliada de cada producto suelto. Resume las fichas de k89.es
// (principios activos, para quién es y modo de uso). Se han quitado las
// afirmaciones de salud y no se ha inventado ningún paso.

export interface ProductDetail {
  about: string;
  actives: { name: string; what: string }[];
  benefits: string[];
  indicatedFor: string[];
  steps: string[];
  tip?: string;
}

// ── Pasos que comparten varios productos ────────────────────────

const SHAMPOO = [
  "Moja bien el pelo.",
  "Aplica el champú y masajea hasta conseguir una espuma densa.",
  "Aclara con abundante agua.",
];
const MASK_AFTER_WASH = [
  "Lava el pelo y déjalo húmedo.",
  "Aplica la mascarilla y déjala actuar 10 minutos.",
  "Aclara con abundante agua.",
];
const midToEnds = (what: string, time: string) => [
  `Con el pelo mojado, aplica ${what} de medios a puntas.`,
  `Deja actuar ${time}.`,
  "Aclara con abundante agua.",
];
const SERUM = [
  "Con el pelo húmedo o seco, pon una pequeña cantidad en las yemas de los dedos.",
  "Repártela de manera uniforme de medios a puntas.",
];
const twoWashes = (minutes: number) => [
  "Aplica el champú de forma uniforme y masajea a fondo hasta conseguir una espuma densa.",
  "Aclara y haz una segunda pasada igual.",
  `En la segunda pasada, deja actuar ${minutes} minutos.`,
  "Aclara con abundante agua.",
];
const SCALP_SHAMPOO = [
  "Moja el cuero cabelludo.",
  "Aplica el champú y masajea hasta conseguir una espuma densa.",
  "Aclara con abundante agua.",
  "Repite si hace falta.",
];
const SCALP_MASK = [
  "Aplica en el cuero cabelludo, mojado o seco, y en el cabello mojado.",
  "Deja actuar 15 minutos.",
  "Aclara con abundante agua.",
  "Lava después si hace falta.",
];
const SCALP_LOTION = [
  "Aplica la loción sobre el cuero cabelludo limpio.",
  "No la aclares.",
];

// ── Datos que comparte cada línea ───────────────────────────────

type Line = Pick<ProductDetail, "actives" | "indicatedFor">;

const MOISTURIZING: Line = {
  actives: [
    {
      name: "Aceite de pepita de uva",
      what: "Ayuda a recuperar la hidratación y aporta brillo.",
    },
    {
      name: "Ácido hialurónico",
      what: "Aumenta la hidratación y mejora el aspecto del cabello.",
    },
  ],
  indicatedFor: [
    "Cabello seco o deshidratado",
    "Cabello encrespado",
    "Cabello sin brillo o estresado",
    "También cabello normal, rizado u ondulado",
  ],
};
const REPAIR: Line = {
  actives: [
    {
      name: "Keravis",
      what: "Complejo de proteínas que penetra en el cabello y además lo recubre con una película, para fortalecerlo y reducir los daños.",
    },
  ],
  indicatedFor: [
    "Cabello estropeado o castigado",
    "Cabello decolorado o con mechas",
    "Cabello dañado por químicos o por el calor",
  ],
};
const RESTORE: Line = {
  actives: [
    { name: "Queratina hidrolizada", what: "Restaura y acondiciona el cabello." },
    {
      name: "Proteínas de seda",
      what: "Aportan brillo y suavidad y forman una película protectora.",
    },
  ],
  indicatedFor: [
    "Cabello estropeado",
    "Cabello seco",
    "Cabello teñido o con mechas",
  ],
};
const VOLUME: Line = {
  actives: [
    {
      name: "SymControl Scalp",
      what: "Ayuda a retirar el exceso de grasa, una de las causas de que el pelo fino pierda volumen.",
    },
  ],
  indicatedFor: [
    "Cabello fino",
    "Cabello debilitado",
    "Cabello con tendencia grasa",
  ],
};
const SILVER: Line = {
  actives: [
    {
      name: "Micropigmentos violetas",
      what: "Matizan y neutralizan los tonos dorados.",
    },
    {
      name: "Aceite de semilla de uva",
      what: "Nutre y acondiciona la fibra capilar.",
    },
  ],
  indicatedFor: [
    "Cabello rubio o con canas",
    "Cabello con mechas",
    "Tonos dorados o anaranjados que se quieren enfriar",
  ],
};
const GLOW: Line = {
  actives: [
    {
      name: "Extracto de algodón",
      what: "Ayuda a mantener el cabello suave y flexible y a reducir el encrespado.",
    },
    {
      name: "Extracto de rosa mosqueta",
      what: "Aporta luminosidad y ayuda a mejorar la elasticidad.",
    },
    {
      name: "Extracto de argán",
      what: "Con ácidos grasos y vitamina E, para la suavidad y el brillo.",
    },
  ],
  indicatedFor: [
    "Cabello apagado",
    "Cabello seco o encrespado",
    "Cabello tratado químicamente",
  ],
};

const CRINIPAN = {
  name: "Crinipan PMC Green",
  what: "Activo anticaspa de origen natural.",
};
const GRAPE = {
  name: "Extracto de grano entero de uva",
  what: "Rico en antioxidantes.",
};
const PANTHENOL = { name: "Pantenol", what: "Hidratante." };
const CHAMOMILE = {
  name: "Extracto de manzanilla",
  what: "Con propiedades calmantes.",
};
const UP_CITRUS = {
  name: "Up-Citrus",
  what: "Pensado para equilibrar la microbiota del cuero cabelludo.",
};
const NIACINAMIDE = {
  name: "Niacinamida",
  what: "Ayuda a controlar la grasa.",
};
const VITAMINS = { name: "Vitaminas C y E", what: "Antioxidantes." };

const DANDRUFF = ["Cuero cabelludo con caspa"];
const SENSITIVE = ["Cuero cabelludo sensible"];
const BALANCE = [
  "Quien quiere cuidar el equilibrio del cuero cabelludo y el sudor",
];

export const productDetails: Record<string, ProductDetail> = {
  "moisturizing-shampoo-330": {
    ...MOISTURIZING,
    about:
      "Champú de hidratación profunda de la línea Moisturizing. Limpia mientras aporta hidratación y, según K89, no añade peso al cabello.",
    benefits: [
      "Hidrata sin apelmazar",
      "Aporta brillo",
      "En pelo rizado y ondulado, ayuda a la elasticidad",
    ],
    steps: SHAMPOO,
  },
  "moisturizing-conditioner-330": {
    ...MOISTURIZING,
    about:
      "Acondicionador de hidratación profunda de la línea Moisturizing. Ayuda a desenredar y deja el pelo más fácil de peinar.",
    benefits: ["Suavidad y facilidad de peinado", "Hidrata sin añadir peso", "Aporta brillo"],
    steps: midToEnds("el acondicionador", "2 minutos"),
  },
  "moisturizing-mask-300": {
    ...MOISTURIZING,
    about:
      "Mascarilla de hidratación profunda de la línea Moisturizing, para dar al cabello un tratamiento más intenso que el acondicionador de la misma línea.",
    benefits: ["Hidrata sin añadir peso", "Aporta suavidad y brillo", "Facilita el peinado"],
    steps: midToEnds("la mascarilla", "10 minutos"),
  },
  "moisturizing-serum-100": {
    ...MOISTURIZING,
    about:
      "Sérum de hidratación de la línea Moisturizing. Ayuda a que el cabello retenga el agua que necesita.",
    benefits: ["Hidrata sin añadir peso", "Aporta brillo", "En pelo rizado y ondulado, ayuda a la elasticidad"],
    steps: SERUM,
  },

  "repair-shampoo-330": {
    ...REPAIR,
    about:
      "Champú de la línea Repair para cabello dañado por procesos químicos o por usar mucho calor.",
    benefits: ["Ayuda a fortalecer el cabello dañado", "Ayuda a mejorar la elasticidad"],
    indicatedFor: [...REPAIR.indicatedFor, "Cabello quebradizo"],
    steps: SHAMPOO,
  },
  "repair-mask-300": {
    ...REPAIR,
    about:
      "Mascarilla de la línea Repair que nutre el cabello dañado por procesos químicos o por el calor.",
    benefits: ["Ayuda a fortalecer", "Ayuda a mejorar la elasticidad", "Hidrata y suaviza"],
    steps: MASK_AFTER_WASH,
  },
  "repair-serum-100": {
    ...REPAIR,
    about:
      "Sérum de la línea Repair para el cuidado del cabello dañado, sobre todo de medios a puntas.",
    benefits: ["Ayuda a mejorar la elasticidad", "Hidrata y suaviza"],
    steps: SERUM,
  },
  "repair-treatment-10-benefits-250": {
    ...REPAIR,
    about:
      "Tratamiento de la línea Repair en spray y sin aclarado. Se pulveriza sobre el pelo húmedo y, según K89, no aporta peso.",
    benefits: ["Cómodo: no se aclara", "No aporta peso", "Hidrata y suaviza"],
    indicatedFor: [...REPAIR.indicatedFor, "Cabello quebradizo"],
    steps: ["Agita el envase antes de usar.", "Pulveriza sobre el pelo húmedo.", "Peina."],
  },

  "restore-shampoo-330": {
    ...RESTORE,
    about:
      "Champú de la línea Restore, con queratina hidrolizada, para cuidar el cabello estropeado.",
    benefits: ["Acondiciona", "Hidrata", "Ayuda a fortalecer el cabello"],
    steps: SHAMPOO,
  },
  "restore-mask-300": {
    ...RESTORE,
    about:
      "Mascarilla de la línea Restore, con queratina hidrolizada y proteínas de seda, para un cuidado intenso.",
    benefits: ["Acondiciona en profundidad", "Hidrata", "Ayuda a fortalecer el cabello"],
    steps: MASK_AFTER_WASH,
  },
  "restore-serum-100": {
    ...RESTORE,
    about:
      "Sérum de la línea Restore para aportar brillo y cuidado sin añadir peso.",
    benefits: ["Aporta brillo", "No aporta peso", "Hidrata y acondiciona"],
    steps: SERUM,
  },

  "volume-shampoo-330": {
    ...VOLUME,
    about:
      "Champú de la línea Volume. Limpia a fondo y ayuda a que el cabello fino tenga más cuerpo.",
    benefits: ["Aporta volumen y cuerpo", "Ayuda a retirar el exceso de grasa", "Limpia en profundidad"],
    steps: SHAMPOO,
  },
  "volume-salt-shampoo-300": {
    ...VOLUME,
    about:
      "Champú de volumen con sal marina. Viene en tarro, como una mascarilla, pero es un champú.",
    actives: [{ name: "Sal marina", what: "Es la base de este champú." }, ...VOLUME.actives],
    benefits: ["Aporta volumen y brillo", "Ayuda a retirar el exceso de grasa", "Limpia en profundidad"],
    steps: SHAMPOO,
  },
  "volume-mask-300": {
    ...VOLUME,
    about:
      "Mascarilla de la línea Volume para acondicionar el cabello fino mientras se le da cuerpo.",
    benefits: ["Aporta volumen y cuerpo", "Acondiciona y suaviza", "Ayuda a retirar el exceso de grasa"],
    steps: MASK_AFTER_WASH,
  },

  "blonde-silver-shampoo-330": {
    ...SILVER,
    about:
      "Champú violeta para mantener rubios, canas y mechas. Matiza y cuida en el mismo paso.",
    benefits: ["Matiza rubios y blancos", "Neutraliza tonos dorados", "Acondiciona"],
    steps: twoWashes(5),
  },
  "blonde-silver-mask-300": {
    ...SILVER,
    about:
      "Mascarilla violeta para mantener rubios, canas y mechas. Matiza y acondiciona en el mismo paso.",
    benefits: ["Matiza rubios y blancos", "Neutraliza tonos dorados", "Acondiciona el cabello seco o tratado"],
    steps: MASK_AFTER_WASH,
  },

  "colour-shampoo-330": {
    about:
      "Champú para cabello teñido. Su función es ayudar a que el color dure más, a la vez que acondiciona.",
    actives: [
      { name: "Chromapol", what: "Ayuda a proteger el cabello frente a la pérdida de color y acondiciona." },
    ],
    benefits: ["Ayuda a mantener el color", "Aporta suavidad y brillo", "Limpia e hidrata sin apelmazar"],
    indicatedFor: ["Cabello teñido", "Cabello con mechas", "Cabello poroso"],
    steps: twoWashes(2),
  },
  "glow-shampoo-330": {
    ...GLOW,
    about: "Champú antiencrespado de la línea Glow, pensado para aportar brillo.",
    benefits: ["Aporta brillo", "Ayuda a controlar el encrespado"],
    steps: SHAMPOO,
  },
  "glow-mask-300": {
    ...GLOW,
    about: "Mascarilla antiencrespado de la línea Glow, pensada para aportar brillo.",
    benefits: ["Aporta brillo", "Hidrata y acondiciona", "Ayuda a controlar el encrespado"],
    steps: midToEnds("la mascarilla", "entre 5 y 10 minutos"),
  },

  "anti-dandruff-shampoo-330": {
    about: "Champú anticaspa de la línea Scalp Care.",
    actives: [CRINIPAN, GRAPE],
    benefits: ["Ayuda a regular la caspa", "Limpia el cuero cabelludo y el cabello"],
    indicatedFor: DANDRUFF,
    steps: SCALP_SHAMPOO,
  },
  "anti-dandruff-mask-300": {
    about:
      "Mascarilla anticaspa de la línea Scalp Care. También se puede aplicar en medios y puntas.",
    actives: [CRINIPAN, GRAPE],
    benefits: ["Ayuda a regular la caspa", "Calma e hidrata el cuero cabelludo"],
    indicatedFor: DANDRUFF,
    steps: SCALP_MASK,
  },
  "anti-dandruff-lotion-100": {
    about: "Loción anticaspa sin aclarado de la línea Scalp Care.",
    actives: [CRINIPAN, GRAPE],
    benefits: [
      "Ayuda a regular la caspa",
      "Calma e hidrata",
      "Ayuda a aliviar el picor por descamación",
    ],
    indicatedFor: DANDRUFF,
    steps: SCALP_LOTION,
  },
  "sensitive-shampoo-330": {
    about:
      "Champú para todo tipo de cabello, pensado sobre todo para cuero cabelludo sensible.",
    actives: [NIACINAMIDE, VITAMINS, { name: "Silicio orgánico", what: "Parte de la fórmula de cuidado." }, GRAPE],
    benefits: ["Limpia con suavidad", "Calma, hidrata y nutre el cuero cabelludo"],
    indicatedFor: SENSITIVE,
    steps: SCALP_SHAMPOO,
  },
  "sensitive-mask-300": {
    about:
      "Mascarilla para cuero cabelludo sensible. También se puede aplicar en medios y puntas.",
    actives: [PANTHENOL, GRAPE],
    benefits: ["Hidrata y nutre", "Ayuda a mejorar la sensación de irritación"],
    indicatedFor: SENSITIVE,
    steps: SCALP_MASK,
  },
  "sensitive-lotion-100": {
    about: "Loción sin aclarado para cuero cabelludo sensible.",
    actives: [PANTHENOL, CHAMOMILE, GRAPE],
    benefits: ["Hidrata y nutre", "Ayuda a mejorar la sensación de irritación"],
    indicatedFor: SENSITIVE,
    steps: SCALP_LOTION,
  },
  "microbiome-shampoo-330": {
    about:
      "Champú de la línea Scalp Care pensado para equilibrar el sudor y el microbioma del cuero cabelludo.",
    actives: [UP_CITRUS, GRAPE],
    benefits: ["Ayuda a equilibrar el cuero cabelludo y el sudor", "Limpia"],
    indicatedFor: BALANCE,
    steps: SCALP_SHAMPOO,
  },
  "remineralizing-mask-300": {
    about:
      "Mascarilla remineralizante de la línea Scalp Care, con vitaminas y oligoelementos. También sirve para medios y puntas.",
    actives: [NIACINAMIDE, VITAMINS, { name: "Silicio orgánico", what: "Parte de la fórmula de cuidado." }, GRAPE],
    benefits: ["Ayuda a regular el exceso de grasa", "Nutre e hidrata"],
    indicatedFor: BALANCE,
    steps: SCALP_MASK,
  },
  "microbiome-lotion-100": {
    about:
      "Loción de la línea Scalp Care para el equilibrio del sudor y del microbioma. Se puede usar de dos maneras.",
    actives: [UP_CITRUS, CHAMOMILE, GRAPE],
    benefits: ["Ayuda a equilibrar el cuero cabelludo y el sudor", "Ayuda a mejorar la sensación de irritación"],
    indicatedFor: BALANCE,
    steps: [
      "Elige una forma de uso.",
      "Con el cuero cabelludo limpio: aplica y no aclares.",
      "Antes de lavarte el pelo: aplica y deja actuar al menos 20 minutos.",
    ],
  },

  "curly-protein-concentrate-30": {
    about:
      "Concentrado de proteína para el método curly. Sirve para equilibrar hidratación y proteína, y se puede añadir a otros productos.",
    actives: [
      { name: "Colágeno hidrolizado", what: "Aporta proteína." },
      { name: "Proteína de soja hidrolizada", what: "Aporta proteína." },
    ],
    benefits: ["Para cuando falta proteína en el cabello", "Se adapta a tu rutina de rizos"],
    indicatedFor: [
      "Cabello fino, débil o quebradizo",
      "Cabello dañado por decoloración, alisados, permanentes o calor",
      "Rizo que no se mantiene",
      "Cabello blando o gomoso cuando está mojado",
    ],
    steps: [
      "Úsalo directamente o mezclado con otro producto, que es más fácil.",
      "Con crema de rizos o producto sin aclarado: 1 gota por cada pulsación.",
      "Con gel de rizos: 2 gotas por cada cantidad del tamaño de una avellana.",
      "Con mascarilla o acondicionador con aclarado: 1 pipeta.",
    ],
    tip: "No te pases: según K89, con exceso de proteína el pelo puede quedar enredado, seco y sin brillo.",
  },
};

/** Ampollas que llevan algunos packs (no se venden sueltas aquí). */
export const flashDetail: ProductDetail = {
  about:
    "Ampollas de tratamiento para cabello seco, dañado o tratado químicamente. Según K89, se pueden combinar con los tratamientos de la línea Sweet Care.",
  actives: [
    {
      name: "Oligoelementos",
      what: "Silicio, magnesio, cobre, hierro y zinc.",
    },
  ],
  benefits: [
    "Nutren sin añadir peso",
    "Ayudan a proteger el color",
    "Ayudan contra el encrespado",
    "Dejan un tacto sedoso",
  ],
  indicatedFor: ["Cabello seco, dañado o tratado químicamente"],
  steps: [
    "Aplica sobre el cabello húmedo.",
    "Repártelo de forma uniforme con un peine.",
    "Deja actuar 5 minutos.",
    "Aclara con abundante agua.",
  ],
  tip: "Estos son los pasos de la ampolla sola. Si no sabes cómo combinarla con el resto del pack, pregunta en el salón.",
};
