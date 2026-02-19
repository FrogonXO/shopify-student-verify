import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "verify@edubook.at";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendVerificationEmail(
  studentEmail: string,
  token: string
) {
  const confirmUrl = `${process.env.APP_URL}/api/verify/confirm?token=${token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: studentEmail,
    subject: "Verify your student email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Student Verification</h2>
        <p>Someone requested to verify this email as a student email. If this was you, click the button below to confirm.</p>
        <a href="${confirmUrl}"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify My Student Email
        </a>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendReminderEmail(purchaseEmail: string) {
  const verifyUrl = `${process.env.APP_URL}/verify?email=${encodeURIComponent(purchaseEmail)}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: purchaseEmail,
    subject: "Reminder: Verify your student status to activate your order",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Your order is still on hold</h2>
        <p>We noticed you haven't verified your student status yet. Your order will be automatically cancelled if not verified within 48 hours of purchase.</p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Now
        </a>
        <p style="color: #666; font-size: 14px;">If you've already verified, please disregard this email.</p>
      </div>
    `,
  });
}
