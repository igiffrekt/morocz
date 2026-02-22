/**
 * Builds a branded HTML confirmation email for a successful booking.
 * Uses inline CSS only and table-based layout for broad email client compatibility.
 * All user-facing text is in proper Hungarian with accented characters.
 */
export function buildConfirmationEmail(params: {
  patientName: string;
  serviceName: string;
  date: string; // Pre-formatted Hungarian date string
  time: string; // "09:20"
  cancelUrl: string;
  rescheduleUrl: string;
  clinicPhone: string;
  clinicAddress: string;
}): string {
  const {
    patientName,
    serviceName,
    date,
    time,
    cancelUrl,
    rescheduleUrl,
    clinicPhone,
    clinicAddress,
  } = params;

  // Design system colours
  const navy = "#23264F";
  const pink = "#F4DCD6";
  const green = "#99CEB7";
  const lightGrey = "#F8F8F8";
  const textDark = "#1A1A2E";
  const textMuted = "#6B7280";

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Időpontfoglalás visszaigazolása</title>
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
                Időpontfoglalás visszaigazolása
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0; font-size: 16px; color: ${textDark}; line-height: 1.6;">
                Kedves <strong>${patientName}</strong>!
              </p>
              <p style="margin: 12px 0 0; font-size: 15px; color: ${textMuted}; line-height: 1.7;">
                Foglalása sikeresen rögzítésre került. Az alábbiakban találja az időpont részleteit.
              </p>
            </td>
          </tr>

          <!-- Booking details card -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${lightGrey}; border-radius: 8px; border-left: 4px solid ${green}; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Szolgáltatás
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: ${textDark};">
                      ${serviceName}
                    </p>

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Időpont
                    </p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${navy};">
                      ${date}, ${time}
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${pink}; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: ${navy}; text-transform: uppercase; letter-spacing: 0.06em;">
                      Kérjük, vegye figyelembe
                    </p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${textDark}; line-height: 1.6;">
                      &#x2022;&nbsp; Kérjük, érkezzen <strong>5 perccel korábban</strong>.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: ${textDark}; line-height: 1.6;">
                      &#x2022;&nbsp; Hozza magával a <strong>TAJ kártyáját</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action buttons -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin: 0 0 14px; font-size: 14px; color: ${textMuted}; line-height: 1.6;">
                Ha módosítani vagy lemondani szeretné időpontját, kattintson az alábbi gombokra:
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${rescheduleUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${navy}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Időpont módosítása
                    </a>
                  </td>
                  <td>
                    <a href="${cancelUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: #ffffff; color: ${navy}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; border: 1.5px solid ${navy};">
                      Lemondás
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact info -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="border-top: 1px solid #E5E7EB; padding-top: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${navy};">
                      Kapcsolat
                    </p>
                    <p style="margin: 0 0 4px; font-size: 13px; color: ${textMuted};">
                      Telefon: <a href="tel:${clinicPhone}" style="color: ${navy}; text-decoration: none;">${clinicPhone}</a>
                    </p>
                    <p style="margin: 0; font-size: 13px; color: ${textMuted};">
                      Cím: ${clinicAddress}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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
