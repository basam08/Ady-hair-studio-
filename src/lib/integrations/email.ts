import "server-only";
import nodemailer from "nodemailer";

/**
 * Email transaccional. Si no hay SMTP configurado, registra el mensaje en
 * consola en vez de fallar — así el flujo de reservas funciona en desarrollo.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: MailInput): Promise<void> {
  const tx = getTransporter();
  const from = process.env.EMAIL_FROM ?? "Ady Hair Cut <no-reply@localhost>";

  if (!tx) {
    console.info(
      `[email:mock] Para: ${input.to} · Asunto: ${input.subject}\n${input.text}`,
    );
    return;
  }

  try {
    await tx.sendMail({ from, ...input });
  } catch (err) {
    // No romper la reserva por un fallo de email; se registra para revisión.
    console.error("[email] envío fallido:", (err as Error).message);
  }
}
