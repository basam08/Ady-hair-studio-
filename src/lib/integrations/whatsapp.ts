import "server-only";

/**
 * Envío de WhatsApp / SMS vía Twilio usando la API REST (sin SDK, para
 * mantener el bundle ligero). Si no hay credenciales, registra en consola.
 *
 * Requiere que el número de destino esté en formato E.164 (+34...).
 */

export async function sendWhatsApp(
  toPhoneE164: string,
  body: string,
): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } =
    process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.info(`[whatsapp:mock] Para: ${toPhoneE164}\n${body}`);
    return;
  }

  const to = toPhoneE164.startsWith("whatsapp:")
    ? toPhoneE164
    : `whatsapp:${toPhoneE164}`;

  const params = new URLSearchParams({
    To: to,
    From: TWILIO_WHATSAPP_FROM,
    Body: body,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      },
    );
    if (!res.ok) {
      console.error("[whatsapp] Twilio respondió", res.status);
    }
  } catch (err) {
    console.error("[whatsapp] envío fallido:", (err as Error).message);
  }
}
