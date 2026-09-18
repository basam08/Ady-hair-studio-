import "server-only";
import { salon, formatPriceCents } from "@/config/salon";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Envoltorio HTML común: cabecera con logo, tarjeta de contenido, pie. */
function layout(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${salon.name}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f3f0;font-family:Arial,Helvetica,sans-serif;color:#111111;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f3f0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #111111;">
            <tr>
              <td align="center" style="background-color:#111111;padding:28px 24px;">
                <img
                  src="${siteUrl()}/logo.jpg"
                  width="140"
                  alt="${salon.name}"
                  style="display:block;border:0;max-width:140px;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #e5e4e0;font-size:12px;line-height:1.6;color:#6f6f6a;">
                <strong style="color:#111111;">${salon.name}</strong><br />
                ${salon.contact.address.street}, ${salon.contact.address.postalCode} ${salon.contact.address.city}<br />
                Tel: ${salon.contact.phone} · WhatsApp: ${salon.contact.whatsappDisplay}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;">${label}</a>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6f6f6a;width:110px;">${label}</td>
    <td style="padding:6px 0;font-size:15px;color:#111111;">${value}</td>
  </tr>`;
}

export interface BookingEmailData {
  clientName: string;
  serviceName: string;
  stylistName?: string;
  priceCents: number;
  fecha: string;
  hora: string;
  manageUrl: string;
}

export function bookingConfirmedHtml(b: BookingEmailData): string {
  const body = `
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6f6f6a;">Cita confirmada</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;">¡Hola ${b.clientName}!</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Tu cita en ${salon.name} está confirmada. Aquí tienes el resumen:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
      ${detailRow("Servicio", b.serviceName)}
      ${b.stylistName ? detailRow("Con", b.stylistName) : ""}
      ${detailRow("Cuándo", `${b.fecha} · ${b.hora}`)}
      ${detailRow("Precio", formatPriceCents(b.priceCents))}
    </table>
    ${button(b.manageUrl, "Gestionar mi cita")}
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6f6f6a;">¿No puedes venir? Cancela o cambia la hora desde el enlace de arriba. Te esperamos.</p>
  `;
  return layout(`Cita confirmada: ${b.serviceName} el ${b.fecha} a las ${b.hora}`, body);
}

export function bookingCancelledHtml(b: BookingEmailData): string {
  const body = `
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6f6f6a;">Cita cancelada</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;">Hola ${b.clientName}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
      Tu cita del <strong>${b.fecha} a las ${b.hora}</strong> (${b.serviceName}) en ${salon.name} ha sido cancelada.
    </p>
    ${button(`${siteUrl()}/reservar`, "Reservar de nuevo")}
  `;
  return layout(`Cita cancelada: ${b.serviceName} el ${b.fecha}`, body);
}

export function bookingReminderHtml(b: BookingEmailData): string {
  const body = `
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6f6f6a;">Recordatorio</p>
    <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;">¡Hoy tienes cita!</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
      ${detailRow("Servicio", b.serviceName)}
      ${b.stylistName ? detailRow("Con", b.stylistName) : ""}
      ${detailRow("Hora", b.hora)}
    </table>
    ${button(b.manageUrl, "Ver / cambiar mi cita")}
    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6f6f6a;">Si no puedes venir, avísanos con tiempo desde el enlace de arriba.</p>
  `;
  return layout(`Recordatorio: hoy a las ${b.hora}`, body);
}
