import "server-only";

/**
 * Email transaccional vía Resend (API HTTP, sin SDK).
 * Si no hay RESEND_API_KEY configurada, registra el mensaje en consola en
 * vez de fallar — así el flujo de reservas funciona en desarrollo.
 */

function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(input: MailInput): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "ADY Hair Studio <no-reply@localhost>";

  if (!isConfigured()) {
    console.info(
      `[email:mock] Para: ${input.to} · Asunto: ${input.subject}\n${input.text}`,
    );
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] envío fallido:", res.status, await res.text());
    }
  } catch (err) {
    // No romper la reserva por un fallo de email; se registra para revisión.
    console.error("[email] envío fallido:", (err as Error).message);
  }
}
