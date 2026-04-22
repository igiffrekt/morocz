/**
 * Branded HTML email builders for authentication flows.
 * Same design system as booking-email.ts: inline CSS, table layout, Hungarian magázó tone.
 */

const navy = "#23264F";
const green = "#99CEB7";
const lightGrey = "#F8F8F8";
const textDark = "#1A1A2E";
const textMuted = "#6B7280";

/** Shared footer + outer-wrapper closing. */
function footer(): string {
  return `
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px;">
              <p style="margin: 0; font-size: 12px; color: ${textMuted}; line-height: 1.6;">
                Ez egy automatikus üzenet, kérjük ne válaszoljon rá.<br />
                &copy; Mórocz Medical. Minden jog fenntartva.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}

/** Shared document head + wrapper opening + header. */
function shell(title: string, heading: string): string {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F0F2F5; font-family: ui-sans-serif, system-ui, -apple-system, Arial, sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F0F2F5; padding: 32px 16px;">
    <tr>
      <td align="center">

        <!-- Email card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${navy}; padding: 32px 40px;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${green}; letter-spacing: 0.08em; text-transform: uppercase;">
                Mórocz Medical
              </p>
              <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                ${heading}
              </h1>
            </td>
          </tr>
`;
}

/**
 * Builds a branded password-reset email with a CTA button pointing at /jelszo-visszaallitas.
 */
export function buildPasswordResetEmail(params: { resetUrl: string }): string {
  const { resetUrl } = params;

  return `${shell("Jelszó visszaállítása", "Jelszó visszaállítása")}
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0; font-size: 15px; color: ${textMuted}; line-height: 1.7;">
                Jelszó visszaállítási kérelmet kaptunk az Ön fiókjához. Az alábbi gombra kattintva adhat meg új jelszót.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="${resetUrl}"
                      style="display: inline-block; padding: 12px 24px; background-color: ${navy}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Új jelszó beállítása
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Validity note -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${lightGrey}; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 13px; color: ${textDark}; line-height: 1.6;">
                      A link <strong>1 óráig érvényes</strong>. Ha nem Ön kezdeményezte a kérelmet, hagyja figyelmen kívül ezt az e-mailt — fiókja biztonságban marad.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${footer()}`;
}

/**
 * Builds a branded ghost-account activation email. The recipient has a legacy
 * booking history in our system but no password or OAuth link yet; this message
 * invites them to set a password and billing address to activate the account.
 */
export function buildClaimActivationEmail(params: { claimUrl: string }): string {
  const { claimUrl } = params;

  return `${shell("Fiók aktiválása", "Fejezze be a fiók aktiválását")}
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0; font-size: 16px; color: ${textDark}; line-height: 1.6;">
                Kedves Páciensünk!
              </p>
              <p style="margin: 12px 0 0; font-size: 15px; color: ${textMuted}; line-height: 1.7;">
                Az Ön e-mail címével már létezik egy foglalási fiók a Mórocz Medical rendszerében. A fiók aktiválásához állítson be egy jelszót és adja meg számlázási címét.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="${claimUrl}"
                      style="display: inline-block; padding: 12px 24px; background-color: ${navy}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Fiók aktiválása
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Validity note -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${lightGrey}; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 13px; color: ${textDark}; line-height: 1.6;">
                      A link <strong>60 percig érvényes</strong>. Ha nem Ön kezdeményezte, hagyja figyelmen kívül ezt az e-mailt.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${footer()}`;
}
