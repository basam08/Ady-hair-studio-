import "server-only";
import { salon } from "@/config/salon";
import { formatPriceCents } from "@/config/salon";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
import { sendEmail } from "@/lib/integrations/email";
import { sendWhatsApp } from "@/lib/integrations/whatsapp";

interface BookingLike {
  serviceName: string;
  priceCents: number;
  startsAt: Date;
  endsAt: Date;
  manageToken: string;
  client: { name: string; email: string | null; phone: string };
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function manageLink(token: string): string {
  return `${siteUrl()}/reserva/${token}`;
}

export async function notifyBookingConfirmed(b: BookingLike): Promise<void> {
  const fecha = formatDateInZone(salon.timeZone, b.startsAt);
  const hora = formatTimeInZone(salon.timeZone, b.startsAt);
  const link = manageLink(b.manageToken);

  const text = [
    `¡Hola ${b.client.name}!`,
    ``,
    `Tu cita en ${salon.name} está confirmada:`,
    `· Servicio: ${b.serviceName}`,
    `· Cuándo: ${fecha} a las ${hora}`,
    `· Precio: ${formatPriceCents(b.priceCents)}`,
    `· Dónde: ${salon.contact.address.street}, ${salon.contact.address.city}`,
    ``,
    `¿Necesitas cambiar o cancelar? ${link}`,
    ``,
    `Te esperamos.`,
  ].join("\n");

  await Promise.allSettled([
    b.client.email
      ? sendEmail({
          to: b.client.email,
          subject: `Cita confirmada · ${salon.name}`,
          text,
        })
      : Promise.resolve(),
    sendWhatsApp(
      b.client.phone,
      `✂️ ${salon.name}: cita confirmada para ${b.serviceName} el ${fecha} a las ${hora}. Gestiona tu cita: ${link}`,
    ),
  ]);
}

export async function notifyBookingCancelled(b: BookingLike): Promise<void> {
  const fecha = formatDateInZone(salon.timeZone, b.startsAt);
  const hora = formatTimeInZone(salon.timeZone, b.startsAt);
  const text = `Hola ${b.client.name}, tu cita del ${fecha} a las ${hora} en ${salon.name} ha sido cancelada. Puedes reservar de nuevo cuando quieras en ${siteUrl()}/reservar`;

  await Promise.allSettled([
    b.client.email
      ? sendEmail({
          to: b.client.email,
          subject: `Cita cancelada · ${salon.name}`,
          text,
        })
      : Promise.resolve(),
    sendWhatsApp(b.client.phone, text),
  ]);
}

export async function notifyBookingReminder(b: BookingLike): Promise<void> {
  const hora = formatTimeInZone(salon.timeZone, b.startsAt);
  const link = manageLink(b.manageToken);
  const text = `⏰ Recordatorio: hoy tienes cita en ${salon.name} a las ${hora} (${b.serviceName}). Si no puedes venir, avísanos: ${link}`;

  await Promise.allSettled([
    b.client.email
      ? sendEmail({
          to: b.client.email,
          subject: `Recordatorio de tu cita de hoy · ${salon.name}`,
          text,
        })
      : Promise.resolve(),
    sendWhatsApp(b.client.phone, text),
  ]);
}
