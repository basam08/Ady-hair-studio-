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
  category: "Corte" | "Color" | "Barba" | "Tratamiento" | "Peinado";
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
    phone: "+34 655 40 21 88",
    // Número en formato internacional sin signos, para el enlace de WhatsApp.
    whatsapp: "34655402188",
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

  /** Capacidad simultánea: nº de sillas / profesionales atendiendo a la vez. */
  chairs: 2,

  /**
   * Cuánto se tarda como mínimo en pasar de un cliente al siguiente en la
   * misma silla (limpieza, preparación). Se suma a la duración del servicio.
   */
  turnaroundMin: 10,

  /** Granularidad de los huecos ofrecidos al cliente, en minutos. */
  slotStepMin: 15,

  /** Con cuánta antelación mínima se puede reservar (horas). */
  minLeadHours: 2,

  /** Con cuánta antelación máxima se puede reservar (días). */
  maxLeadDays: 60,

  /** Zona horaria del negocio (IANA). */
  timeZone: "Europe/Madrid",

  /**
   * Horario semanal. Cada día puede tener varios bloques (p. ej. con pausa
   * para comer). Un array vacío = cerrado ese día.
   */
  hours: {
    1: [{ open: "10:00", close: "14:00" }, { open: "16:00", close: "20:00" }], // lunes
    2: [{ open: "10:00", close: "14:00" }, { open: "16:00", close: "20:00" }],
    3: [{ open: "10:00", close: "14:00" }, { open: "16:00", close: "20:00" }],
    4: [{ open: "10:00", close: "20:00" }], // jueves jornada continua
    5: [{ open: "10:00", close: "20:00" }],
    6: [{ open: "09:30", close: "14:30" }], // sábado
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
    {
      slug: "corte-mujer",
      name: "Corte mujer",
      description:
        "Lavado, corte personalizado y peinado. Asesoramiento de forma según tu tipo de cara y textura.",
      price: 24,
      durationMin: 60,
      category: "Corte",
    },
    {
      slug: "corte-hombre",
      name: "Corte hombre",
      description: "Corte a tijera o máquina, perfilado y acabado. Lavado incluido.",
      price: 16,
      durationMin: 30,
      category: "Corte",
    },
    {
      slug: "corte-nino",
      name: "Corte infantil",
      description: "Para peques de hasta 12 años. Con paciencia y sin prisas.",
      price: 13,
      durationMin: 30,
      category: "Corte",
    },
    {
      slug: "arreglo-barba",
      name: "Arreglo de barba",
      description: "Perfilado con navaja, toalla caliente y aceite. Se puede combinar con corte.",
      price: 12,
      durationMin: 30,
      category: "Barba",
    },
    {
      slug: "color-raiz",
      name: "Color raíz",
      description: "Retoque de color en raíz con tinte sin amoníaco. Incluye lavado y secado.",
      price: 32,
      durationMin: 75,
      category: "Color",
    },
    {
      slug: "mechas-balayage",
      name: "Mechas / Balayage",
      description:
        "Técnica de aclarado a mano alzada para un degradado natural. Incluye matiz y tratamiento.",
      price: 68,
      durationMin: 150,
      category: "Color",
    },
    {
      slug: "tratamiento-hidratacion",
      name: "Tratamiento de hidratación",
      description: "Mascarilla profesional con masaje de cuero cabelludo. Cabello con brillo real.",
      price: 18,
      durationMin: 30,
      category: "Tratamiento",
    },
    {
      slug: "peinado-evento",
      name: "Peinado de evento",
      description: "Recogido o peinado para boda, comunión o fiesta. Prueba previa opcional.",
      price: 35,
      durationMin: 60,
      category: "Peinado",
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
