import "server-only";
import { salon, formatPriceCents } from "@/config/salon";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const FONT_DISPLAY = "'Poppins', Arial, Helvetica, sans-serif";
const FONT_SANS = "'Inter', Arial, Helvetica, sans-serif";
const MUTED = "#a8a8a2";

/** Envoltorio HTML común: fondo negro, tipografía de la web, logo arriba. */
function layout(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${salon.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin:0;padding:0;background-color:#000000;font-family:${FONT_SANS};color:#ffffff;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#111111;border:1px solid #2a2a2a;">
            <tr>
              <td align="center" style="padding:32px 24px 24px;border-bottom:1px solid #2a2a2a;">
                <img
                  src="${siteUrl()}/logo.jpg"
                  width="160"
                  alt="${salon.name}"
                  style="display:block;border:0;max-width:160px;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;color:#ffffff;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #2a2a2a;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};">
                <strong style="color:#ffffff;font-family:${FONT_DISPLAY};">${salon.name}</strong><br />
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
  return `<a href="${href}" style="display:inline-block;background-color:#ffffff;color:#111111;text-decoration:none;padding:14px 28px;font-family:${FONT_SANS};font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">${label}</a>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-family:${FONT_SANS};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};width:110px;">${label}</td>
    <td style="padding:6px 0;font-family:${FONT_SANS};font-size:15px;color:#ffffff;">${value}</td>
  </tr>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 4px;font-family:${FONT_SANS};font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">${text}</p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-family:${FONT_DISPLAY};font-weight:600;color:#ffffff;font-size:26px;line-height:1.2;">${text}</h1>`;
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
    ${eyebrow("Cita confirmada")}
    ${heading(`¡Hola ${b.clientName}!`)}
    <p style="margin:0 0 24px;font-family:${FONT_SANS};font-size:15px;line-height:1.6;color:#ffffff;">Tu cita en ${salon.name} está confirmada. Aquí tienes el resumen:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
      ${detailRow("Servicio", b.serviceName)}
      ${b.stylistName ? detailRow("Con", b.stylistName) : ""}
      ${detailRow("Cuándo", `${b.fecha} · ${b.hora}`)}
      ${detailRow("Precio", formatPriceCents(b.priceCents))}
    </table>
    ${button(b.manageUrl, "Gestionar mi cita")}
    <p style="margin:28px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:${MUTED};">¿No puedes venir? Cancela o cambia la hora desde el enlace de arriba. Te esperamos.</p>
  `;
  return layout(`Cita confirmada: ${b.serviceName} el ${b.fecha} a las ${b.hora}`, body);
}

export function bookingCancelledHtml(b: BookingEmailData): string {
  const body = `
    ${eyebrow("Cita cancelada")}
    ${heading(`Hola ${b.clientName}`)}
    <p style="margin:0 0 24px;font-family:${FONT_SANS};font-size:15px;line-height:1.6;color:#ffffff;">
      Tu cita del <strong>${b.fecha} a las ${b.hora}</strong> (${b.serviceName}) en ${salon.name} ha sido cancelada.
    </p>
    ${button(`${siteUrl()}/reservar`, "Reservar de nuevo")}
  `;
  return layout(`Cita cancelada: ${b.serviceName} el ${b.fecha}`, body);
}

export function bookingReminderHtml(b: BookingEmailData): string {
  const body = `
    ${eyebrow("Recordatorio")}
    ${heading("¡Hoy tienes cita!")}
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
      ${detailRow("Servicio", b.serviceName)}
      ${b.stylistName ? detailRow("Con", b.stylistName) : ""}
      ${detailRow("Hora", b.hora)}
    </table>
    ${button(b.manageUrl, "Ver / cambiar mi cita")}
    <p style="margin:28px 0 0;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:${MUTED};">Si no puedes venir, avísanos con tiempo desde el enlace de arriba.</p>
  `;
  return layout(`Recordatorio: hoy a las ${b.hora}`, body);
}
