import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "verify@edubook.at";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendVerificationEmail(
  studentEmail: string,
  token: string
) {
  // Link to the confirm PAGE (not the API) — user must click a button on the page
  const confirmUrl = `${process.env.APP_URL}/verify/confirm?token=${token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: studentEmail,
    subject: "edubook - Bildungsstatus bestätigen",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Bildungsstatus bestätigen</h2>
        <p>Bitte bestätige deine Bildungs-Email, indem du auf den Button klickst.</p>
        <a href="${confirmUrl}"
           style="display: inline-block; background: #25ba86; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Bildungsstatus bestätigen
        </a>
        <p style="color: #666; font-size: 14px;">Falls du diese Email nicht angefordert hast, kannst du sie ignorieren.</p>
      </div>
    `,
  });
}

export async function sendReminderEmail(purchaseEmail: string) {
  const verifyUrl = `${process.env.APP_URL}/verify?email=${encodeURIComponent(purchaseEmail)}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: purchaseEmail,
    subject: "edubook - Erinnerung: Bildungsstatus verifizieren",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Deine Bestellung ist noch in Warteschleife</h2>
        <p>Wir haben festgestellt, dass du deinen Bildungsstatus noch nicht verifiziert hast. Deine Bestellung wird automatisch storniert, wenn sie nicht innerhalb von 48 Stunden nach dem Kauf verifiziert wird.</p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #25ba86; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Jetzt verifizieren
        </a>
        <p style="color: #666; font-size: 14px;">Falls du bereits verifiziert bist, ignoriere bitte diese Email.</p>
      </div>
    `,
  });
}
