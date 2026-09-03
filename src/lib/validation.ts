import { z } from "zod";
import { isValidDateKey } from "@/lib/time";

// Teléfono: permisivo pero acotado. Acepta formato internacional o nacional.
const phoneSchema = z
  .string()
  .trim()
  .min(6, "Teléfono demasiado corto")
  .max(20, "Teléfono demasiado largo")
  .regex(/^\+?[0-9\s().-]{6,20}$/, "Formato de teléfono no válido");

export const bookingCreateSchema = z.object({
  serviceSlug: z.string().trim().min(1).max(64),
  date: z
    .string()
    .refine(isValidDateKey, "Fecha no válida (usa AAAA-MM-DD)"),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora no válida"),
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .max(120)
    .email("Email no válido")
    .optional()
    .or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const bookingManageSchema = z.object({
  action: z.enum(["cancel", "reschedule"]),
  date: z.string().refine(isValidDateKey).optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
});

export const availabilityQuerySchema = z.object({
  service: z.string().trim().min(1).max(64),
  date: z.string().refine(isValidDateKey, "Fecha no válida"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email no válido").max(120),
  password: z.string().min(1, "Introduce la contraseña").max(200),
});

export const blackoutCreateSchema = z
  .object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    reason: z.string().trim().min(2).max(120),
    allDay: z.boolean().default(false),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "El fin debe ser posterior al inicio",
    path: ["endsAt"],
  });

export const bookingStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
});

export const adminBookingCreateSchema = z.object({
  serviceSlug: z.string().trim().min(1).max(64),
  date: z.string().refine(isValidDateKey),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Normaliza el teléfono a solo dígitos (con prefijo) para usarlo como clave. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}
