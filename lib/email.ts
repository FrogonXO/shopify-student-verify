import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "verify@edubook.at";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendVerificationEmail(
  studentEmail: string,
  token: string
) {
  const confirmUrl = `${process.env.APP_URL}/verify/confirm?token=${token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: studentEmail,
    subject: "Bestätige deinen Bildungsstatus",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Bildungs-E-Mail verifizieren</title>
    <style>
      body { margin: 0; padding: 0; background: #ffffff; }
      a { text-decoration: none; }
      a:hover { text-decoration: none; }
      .container { width: 560px; max-width: 560px; margin: 0 auto; text-align: left; }
      .body-table { width: 100%; border-spacing: 0; border-collapse: collapse; }
      .font {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
          "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      }
      .muted { color: #777; }
      .light { color: #999; }
      .btn {
        display: inline-block;
        font-size: 16px;
        color: #ffffff !important;
        background: #38B28D;
        border-radius: 4px;
        padding: 16px 22px;
      }
      .divider { border-top: 1px solid #e5e5e5; }
      .preheader {
        display: none !important;
        visibility: hidden;
        opacity: 0;
        color: transparent;
        height: 0;
        width: 0;
        overflow: hidden;
        mso-hide: all;
      }
      @media (max-width: 600px) {
        .container { width: 94% !important; max-width: 94% !important; }
        .stack { display: block !important; width: 100% !important; }
        .right { text-align: left !important; padding-top: 14px !important; }
        .btn { display: block !important; text-align: center !important; width: 100% !important; box-sizing: border-box; }
      }
    </style>
  </head>

  <body style="margin:0; padding:0;" class="font">
    <div class="preheader">
      Bitte bestätige deine Bildungs-E-Mail-Adresse, um die Verifizierung abzuschließen.
    </div>

    <table class="body-table" role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td class="font" style="padding: 40px 0 0;">
          <table class="container" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="font stack" style="vertical-align: middle;">
                <img
                  src="https://cdn.shopify.com/s/files/1/1001/9713/8772/files/edubookvivalahardware_Logo_d72a350a-fb22-4891-be22-7342d987cf61.png?v=211"
                  alt="edubook"
                  width="180"
                  style="display:block; border:0; outline:none; text-decoration:none;"
                />
              </td>
              <td class="font stack right" align="right" style="vertical-align: middle; text-transform: uppercase; font-size: 14px; color: #999;">
                <span style="font-size: 16px;">Verification</span>
              </td>
            </tr>
          </table>

          <table class="body-table" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="font" style="padding: 26px 0 40px;">
                <table class="container" role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="font">
                      <h2 style="font-weight: normal; font-size: 24px; margin: 0 0 10px;">
                        Bildungs-E-Mail verifizieren
                      </h2>

                      <p class="muted" style="line-height: 150%; font-size: 16px; margin: 0;">
                        Jemand hat angefordert, diese E-Mail-Adresse als Bildungs-E-Mail zu verifizieren.
                        Wenn du das warst, klicke bitte auf den Button unten, um zu bestätigen.
                      </p>

                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 22px;">
                        <tr>
                          <td class="font" align="left">
                            <a class="btn" href="${confirmUrl}" target="_blank" rel="noopener">
                              Bildungs-E-Mail verifizieren
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p class="muted" style="line-height: 150%; font-size: 16px; margin: 18px 0 0;">
                        Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.
                      </p>

                      <p class="light" style="line-height: 150%; font-size: 14px; margin: 18px 0 0;">
                        Funktioniert der Button nicht? Kopiere diesen Link in deinen Browser:<br />
                        <a href="${confirmUrl}" style="color:#38B28D; font-size:14px;" target="_blank" rel="noopener">${confirmUrl}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <table class="body-table divider" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="font" style="padding: 28px 0 40px;">
                <table class="container" role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="font">
                      <p class="light" style="line-height: 150%; font-size: 14px; margin: 0;">
                        Falls du Fragen hast, antworte auf diese E-Mail oder kontaktiere uns unter
                        <a href="mailto:service@edubook.at" style="color:#38B28D; font-size:14px;">service@edubook.at</a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <img
            src="https://cdn.shopify.com/shopifycloud/shopify/assets/themes_support/notifications/spacer-1a26dfd5c56b21ac888f9f1610ef81191b571603cb207c6c0f564148473cab3c.png"
            alt=""
            height="1"
            width="1"
            style="display:block; border:0; outline:none; text-decoration:none;"
          />
        </td>
      </tr>
    </table>
  </body>
</html>`,
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
