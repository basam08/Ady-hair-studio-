/**
 * Ady Hair Cut — configuración del negocio.
 *
 * Este es el único archivo que necesitas editar para adaptar el sitio a un
 * negocio real: nombre, contacto, horarios, servicios y galería. Los datos
 * actuales son de ejemplo, coherentes pero ficticios.
 *
 * Los servicios definidos aquí se cargan en la base de datos al ejecutar
 * `npm run db:seed`.
 */

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo

export interface OpeningBlock {
  /** Hora de apertura en formato "HH:MM" (24h) */
  open: string;
  /** Hora de cierre en formato "HH:MM" (24h) */
  close: string;
}

export interface ServiceDef {
  slug: string;
  name: string;
  description: string;
  /** Precio en euros (se convierte a céntimos al guardar) */
  price: number;
  /** Duración en minutos — define cuánto ocupa la agenda */
  durationMin: number;
  category:
    | "Mujer · Color"
    | "Mujer · Corte y peinado"
    | "Mujer · Cuidado capilar"
    | "Hombre"
    | "Niños";
  /**
   * Si es false, el servicio no se puede reservar desde la web (p. ej.
   * mechas, que requieren valorar el pelo antes). El cliente debe escribir
   * por WhatsApp y se reserva a mano desde el panel.
   */
  bookableOnline?: boolean;
}

export interface StylistDef {
  slug: string;
  name: string;
  role: string;
}

export interface GalleryItem {
  title: string;
  category: string;
  image: string;
}

export const salon = {
  name: "Ady Hair Cut",
  tagline: "Corte, color y barbería de precisión",
  intro:
    "Estudio de peluquería en Valencia. Trabajo técnico, asesoramiento honesto y un resultado pensado para cada persona. Reserva online, atención sin prisas.",
  founded: 2016,

  contact: {
    phone: "+34 917 50 75 60",
    // Número en formato internacional sin signos, para el enlace de WhatsApp.
    whatsapp: "34640747627",
    whatsappDisplay: "+34 640 74 76 27",
    email: "hola@adyhaircut.com",
    address: {
      street: "Carrer de la Tisora, 14, bajo",
      city: "Valencia",
      postalCode: "46011",
      region: "Comunitat Valenciana",
      country: "España",
    },
    // Coordenadas para el mapa (Google Maps embed no necesita API key).
    maps: {
      lat: 39.4699,
      lng: -0.3763,
      placeQuery: "Peluquería Ady Hair Cut, Valencia",
    },
    social: {
      instagram: "https://instagram.com/adyhaircut",
      tiktok: "https://tiktok.com/@adyhaircut",
    },
  },

  /**
   * Peluqueros entre los que puede elegir el cliente al reservar. Cada uno
   * tiene su propia agenda: si uno está ocupado a una hora, no bloquea a
   * los demás.
   */
  stylists: [
    { slug: "ady", name: "Ady", role: "Propietario del salón" },
    { slug: "carlos", name: "Carlos", role: "Peluquero" },
    { slug: "mila", name: "Mila", role: "Peluquero" },
  ] satisfies StylistDef[],

  /**
   * Cuánto se tarda como mínimo en pasar de un cliente al siguiente con el
   * mismo peluquero (limpieza, preparación). Se suma a la duración del
   * servicio.
   */
  turnaroundMin: 0,

  /** Granularidad de los huecos ofrecidos al cliente, en minutos. */
  slotStepMin: 15,

  /** Con cuánta antelación mínima se puede reservar (horas). */
  minLeadHours: 0,

  /** Con cuánta antelación máxima se puede reservar (días). */
  maxLeadDays: 60,

  /** Zona horaria del negocio (IANA). */
  timeZone: "Europe/Madrid",

  /**
   * Horario semanal. Cada día puede tener varios bloques (p. ej. con pausa
   * para comer). Un array vacío = cerrado ese día.
   */
  hours: {
    1: [], // lunes cerrado
    2: [{ open: "10:00", close: "20:00" }],
    3: [{ open: "10:00", close: "20:00" }],
    4: [{ open: "10:00", close: "20:00" }],
    5: [{ open: "10:00", close: "20:00" }],
    6: [{ open: "10:00", close: "14:00" }], // sábado
    0: [], // domingo cerrado
  } as Record<WeekDay, OpeningBlock[]>,

  /** Festivos y días cerrados puntuales (formato "YYYY-MM-DD"). */
  closedDates: [
    "2026-01-01",
    "2026-01-06",
    "2026-04-03",
    "2026-05-01",
    "2026-08-10", // vacaciones
    "2026-08-11",
    "2026-08-12",
    "2026-08-13",
    "2026-08-14",
    "2026-10-09", // 9 d'Octubre
    "2026-12-25",
  ] as readonly string[],

  services: [
    // ── Mujer · Color ──────────────────────────────────────────────
    {
      slug: "tinte-raiz",
      name: "Tinte de raíz",
      description: "Retoque de color en raíz. Incluye lavado y secado.",
      price: 32,
      durationMin: 60,
      category: "Mujer · Color",
    },
    {
      slug: "color-completo",
      name: "Color completo",
      description: "Coloración de todo el cabello, de raíz a puntas. Incluye lavado y secado.",
      price: 39,
      durationMin: 60,
      category: "Mujer · Color",
    },
    {
      slug: "color-sin-amoniaco",
      name: "Color sin amoníaco",
      description: "Coloración con tinte sin amoníaco, más suave con el cuero cabelludo.",
      price: 35,
      durationMin: 60,
      category: "Mujer · Color",
    },
    {
      slug: "retoque-tinte",
      name: "Retoque de tinte",
      description: "Retoque de color para mantener el tono entre coloraciones completas.",
      price: 22,
      durationMin: 60,
      category: "Mujer · Color",
    },
    {
      slug: "mechas-mujer",
      name: "Mechas",
      description:
        "Mechas clásicas con papel o gorro. Requiere valorar el pelo antes: escríbenos por WhatsApp para reservarlo.",
      price: 60,
      durationMin: 120,
      category: "Mujer · Color",
      bookableOnline: false,
    },
    {
      slug: "mechas-zonales",
      name: "Mechas zonales",
      description:
        "Mechas solo en la zona delantera o superior. Requiere valorar el pelo antes: escríbenos por WhatsApp para reservarlo.",
      price: 40,
      durationMin: 90,
      category: "Mujer · Color",
      bookableOnline: false,
    },
    {
      slug: "reflejos",
      name: "Reflejos",
      description: "Iluminación suave para dar luz y movimiento al color natural.",
      price: 49,
      durationMin: 75,
      category: "Mujer · Color",
    },
    {
      slug: "contorno-iluminacion",
      name: "Contorno / Iluminación",
      description:
        "Aclarado alrededor de la cara para iluminar el rostro. El precio depende del largo y densidad: escríbenos por WhatsApp para valorarlo.",
      price: 49,
      durationMin: 90,
      category: "Mujer · Color",
      bookableOnline: false,
    },
    {
      slug: "balayage",
      name: "Balayage",
      description:
        "Técnica de aclarado a mano alzada para un degradado natural. El precio depende del largo y densidad: escríbenos por WhatsApp para valorarlo.",
      price: 75,
      durationMin: 150,
      category: "Mujer · Color",
      bookableOnline: false,
    },
    {
      slug: "decoloracion",
      name: "Decoloración",
      description:
        "Aclarado del cabello para preparar un cambio de color. El precio depende del largo y densidad: escríbenos por WhatsApp para valorarlo.",
      price: 75,
      durationMin: 120,
      category: "Mujer · Color",
      bookableOnline: false,
    },
    {
      slug: "babylight",
      name: "Babylight",
      description:
        "Mechas finas y muy naturales, técnica de precisión. El precio depende del largo y densidad: escríbenos por WhatsApp para valorarlo.",
      price: 85,
      durationMin: 150,
      category: "Mujer · Color",
      bookableOnline: false,
    },
    {
      slug: "moldeador",
      name: "Moldeador",
      description: "Permanente u ondulado para dar cuerpo y forma al cabello.",
      price: 49,
      durationMin: 60,
      category: "Mujer · Color",
    },

    // ── Mujer · Corte y peinado ──────────────────────────────────────
    {
      slug: "corte-mujer",
      name: "Corte mujer",
      description:
        "Lavado, corte personalizado y peinado. Asesoramiento de forma según tu tipo de cara y textura.",
      price: 22,
      durationMin: 30,
      category: "Mujer · Corte y peinado",
    },
    {
      slug: "planchar",
      name: "Planchar",
      description: "Alisado con plancha para un acabado liso, sin corte.",
      price: 10,
      durationMin: 30,
      category: "Mujer · Corte y peinado",
    },
    {
      slug: "corte-mujer-puntas",
      name: "Corte mujer solo puntas",
      description: "Igualado de puntas para mantener la forma sin quitar largo.",
      price: 19,
      durationMin: 30,
      category: "Mujer · Corte y peinado",
    },
    {
      slug: "cambio-corte",
      name: "Cambio de corte",
      description: "Cambio de forma o largo respecto a tu corte actual, con asesoramiento previo.",
      price: 22,
      durationMin: 45,
      category: "Mujer · Corte y peinado",
    },
    {
      slug: "flequillo",
      name: "Flequillo",
      description: "Corte o repaso de flequillo.",
      price: 8,
      durationMin: 15,
      category: "Mujer · Corte y peinado",
    },
    {
      slug: "semi-recogido",
      name: "Semi recogido",
      description:
        "Peinado semirecogido para un look especial. El precio depende del peinado: escríbenos por WhatsApp para valorarlo.",
      price: 35,
      durationMin: 60,
      category: "Mujer · Corte y peinado",
      bookableOnline: false,
    },
    {
      slug: "recogidos",
      name: "Recogidos",
      description:
        "Recogido completo para boda, comunión o fiesta. El precio depende del peinado: escríbenos por WhatsApp para valorarlo.",
      price: 45,
      durationMin: 75,
      category: "Mujer · Corte y peinado",
      bookableOnline: false,
    },

    // ── Mujer · Cuidado capilar ──────────────────────────────────────
    {
      slug: "hidratacion-express-largo",
      name: "Hidratación express (largo/medio)",
      description: "Mascarilla exprés con masaje de cuero cabelludo para pelo largo o medio.",
      price: 15,
      durationMin: 30,
      category: "Mujer · Cuidado capilar",
    },
    {
      slug: "hidratacion-express-corto",
      name: "Hidratación express (pelo corto)",
      description: "Mascarilla exprés con masaje de cuero cabelludo para pelo corto.",
      price: 12,
      durationMin: 20,
      category: "Mujer · Cuidado capilar",
    },
    {
      slug: "hidratacion-profunda-corto",
      name: "Hidratación profunda (pelo corto)",
      description: "Tratamiento intensivo de hidratación para pelo corto. Brillo y suavidad real.",
      price: 25,
      durationMin: 45,
      category: "Mujer · Cuidado capilar",
    },
    {
      slug: "hidratacion-profunda-largo",
      name: "Hidratación profunda (largo/medio)",
      description: "Tratamiento intensivo de hidratación para pelo largo o medio. Brillo y suavidad real.",
      price: 28,
      durationMin: 45,
      category: "Mujer · Cuidado capilar",
    },
    {
      slug: "anticrespado",
      name: "Anticrespado",
      description:
        "Tratamiento para controlar el encrespamiento. El precio depende del largo y densidad: escríbenos por WhatsApp para valorarlo.",
      price: 75,
      durationMin: 120,
      category: "Mujer · Cuidado capilar",
      bookableOnline: false,
    },
    {
      slug: "alisado-keratina",
      name: "Alisado de keratina",
      description:
        "Alisado progresivo con keratina. El precio depende del largo y densidad: escríbenos por WhatsApp para valorarlo.",
      price: 100,
      durationMin: 150,
      category: "Mujer · Cuidado capilar",
      bookableOnline: false,
    },

    // ── Hombre ─────────────────────────────────────────────────────
    {
      slug: "corte-hombre",
      name: "Corte hombre",
      description: "Corte a tijera, perfilado y acabado. Lavado incluido.",
      price: 17,
      durationMin: 30,
      category: "Hombre",
    },
    {
      slug: "corte-maquina",
      name: "Corte todo máquina",
      description: "Corte completo a máquina, perfilado incluido.",
      price: 15,
      durationMin: 30,
      category: "Hombre",
    },
    {
      slug: "arreglo-barba",
      name: "Arreglo de barba",
      description: "Perfilado con navaja, toalla caliente y aceite. Se puede combinar con corte.",
      price: 10,
      durationMin: 20,
      category: "Hombre",
    },
    {
      slug: "color-hombre",
      name: "Color",
      description: "Coloración para cabello corto masculino. Incluye lavado y secado.",
      price: 20,
      durationMin: 60,
      category: "Hombre",
    },
    {
      slug: "mechas-hombre",
      name: "Mechas",
      description:
        "Mechas para cabello masculino. Requiere valorar el pelo antes: escríbenos por WhatsApp para reservarlo.",
      price: 35,
      durationMin: 90,
      category: "Hombre",
      bookableOnline: false,
    },

    // ── Niños / Niñas ──────────────────────────────────────────────
    {
      slug: "corte-nina",
      name: "Corte niña",
      description: "Para peques de hasta 12 años. Con paciencia y sin prisas.",
      price: 15,
      durationMin: 30,
      category: "Niños",
    },
    {
      slug: "corte-nino",
      name: "Corte niño",
      description: "Para peques de hasta 12 años. Con paciencia y sin prisas.",
      price: 12,
      durationMin: 30,
      category: "Niños",
    },
    {
      slug: "lavar-peinar-ninas",
      name: "Lavar o peinar niñas",
      description: "Lavado y peinado para niñas, sin corte.",
      price: 15,
      durationMin: 20,
      category: "Niños",
    },
  ] satisfies ServiceDef[],

  // Fotos del trabajo (a color). Sustituye las URLs por fotos propias
  // cuando las tengas; se recomienda un recorte vertical (4:5).
  
  gallery: [
    {
      title: "Corte bob",
      category: "Corte",
      image:
        "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1000&q=75",
    },
    {
      title: "Degradado clásico",
      category: "Barbería",
      image:
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1000&q=75",
    },
    {
      title: "Balayage",
      category: "Color",
      image:
        "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1000&q=75",
    },
    {
      title: "Corte largo en capas",
      category: "Corte",
      image:
        "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=75",
    },
    {
      title: "Arreglo de barba",
      category: "Barbería",
      image:
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=75",
    },
    {
      title: "Recogido de evento",
      category: "Peinado",
      image:
        "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1000&q=75",
    },
  ] satisfies GalleryItem[],

  testimonials: [
    {
      quote:
        "Escuchan lo que pides y te dicen con sinceridad qué te favorece. Salgo siempre con el corte que quería.",
      author: "Marta R.",
    },
    {
      quote:
        "Reservé de madrugada desde el móvil y a los dos días estaba en la silla. El proceso no puede ser más cómodo.",
      author: "Dani P.",
    },
    {
      quote:
        "Puntualidad, higiene y un acabado impecable. Se nota el oficio en cada detalle.",
      author: "Lucía G.",
    },
  ],
} as const;

export type SalonConfig = typeof salon;

export function formatPrice(euros: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: euros % 1 === 0 ? 0 : 2,
  }).format(euros);
}

export function formatPriceCents(cents: number): string {
  return formatPrice(cents / 100);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export function weekdayLabel(day: WeekDay): string {
  return WEEKDAY_LABELS[day];
}

/** Resumen de horario agrupado para mostrar en la web. */
export function hoursSummary(): { label: string; value: string }[] {
  const order: WeekDay[] = [1, 2, 3, 4, 5, 6, 0];
  return order.map((day) => {
    const blocks = salon.hours[day];
    const value =
      blocks.length === 0
        ? "Cerrado"
        : blocks.map((b) => `${b.open}–${b.close}`).join(" · ");
    return { label: weekdayLabel(day), value };
  });
}
