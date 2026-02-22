/**
 * Email builder functions for Mórocz Medical booking system.
 * Uses inline CSS only and table-based layout for broad email client compatibility.
 * All user-facing text is in proper Hungarian with accented characters.
 */

// Design system colours (shared across all email builders)
const navy = "#23264F";
const pink = "#F4DCD6";
const green = "#99CEB7";
const lightGrey = "#F8F8F8";
const textDark = "#1A1A2E";
const textMuted = "#6B7280";
const mapsUrl =
  "https://www.google.com/maps/place/47%C2%B048'02.9%22N+18%C2%B044'44.4%22E/@47.8007963,18.7430918,17z/data=!3m1!4b1!4m4!3m3!8m2!3d47.8007927!4d18.7456667?entry=ttu&g_ep=EgoyMDI1MDkyOC4wIKXMDSoASAFQAw%3D%3D";

/**
 * Builds a branded HTML confirmation email for a successful booking.
 */
export function buildConfirmationEmail(params: {
  patientName: string;
  serviceName: string;
  reservationNumber: string;
  date: string; // Pre-formatted Hungarian date string
  time: string; // "09:20"
  manageUrl: string; // /foglalas/:token — handles both cancel and reschedule
  clinicPhone: string;
  clinicAddress: string;
}): string {
  const { patientName, serviceName, reservationNumber, date, time, manageUrl, clinicPhone, clinicAddress } = params;

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
                      Foglalási szám
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: ${navy}; font-family: monospace, monospace;">
                      ${reservationNumber}
                    </p>

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
                Ha módosítani vagy lemondani szeretné időpontját, kattintson az alábbi gombra:
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${manageUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${navy}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Időpont kezelése
                    </a>
                  </td>
                  <td>
                    <a href="${mapsUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${green}; color: ${navy}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Útvonal
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

/**
 * Builds a branded HTML cancellation confirmation email.
 */
export function buildCancellationEmail(params: {
  patientName: string;
  serviceName: string;
  reservationNumber: string;
  date: string; // Pre-formatted Hungarian date string
  time: string; // "09:20"
  clinicPhone: string;
  clinicAddress: string;
  newBookingUrl: string; // /idopontfoglalas
}): string {
  const { patientName, serviceName, reservationNumber, date, time, clinicPhone, clinicAddress, newBookingUrl } =
    params;

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Időpont lemondva</title>
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
                Időpont lemondva
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
                Az alábbi időpontja lemondásra került. Ha ez tévedés volt, kérjük, foglaljon új időpontot.
              </p>
            </td>
          </tr>

          <!-- Cancelled booking details -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${lightGrey}; border-radius: 8px; border-left: 4px solid #E5E7EB; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Foglalási szám
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: ${textMuted}; font-family: monospace, monospace;">
                      ${reservationNumber}
                    </p>

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Lemondott szolgáltatás
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: ${textDark}; text-decoration: line-through; opacity: 0.7;">
                      ${serviceName}
                    </p>

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Lemondott időpont
                    </p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${textMuted}; text-decoration: line-through;">
                      ${date}, ${time}
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin: 0 0 14px; font-size: 14px; color: ${textMuted}; line-height: 1.6;">
                Szeretne új időpontot foglalni?
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="${newBookingUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${green}; color: ${navy}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Új időpont foglalása
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

/**
 * Builds a branded HTML reschedule confirmation email showing old → new appointment.
 */
export function buildRescheduleEmail(params: {
  patientName: string;
  serviceName: string;
  reservationNumber: string;
  oldDate: string; // Pre-formatted Hungarian date string
  oldTime: string; // "09:20"
  newDate: string; // Pre-formatted Hungarian date string
  newTime: string; // "10:40"
  manageUrl: string; // /foglalas/:token
  clinicPhone: string;
  clinicAddress: string;
}): string {
  const {
    patientName,
    serviceName,
    reservationNumber,
    oldDate,
    oldTime,
    newDate,
    newTime,
    manageUrl,
    clinicPhone,
    clinicAddress,
  } = params;

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Időpont áthelyezve</title>
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
                Időpont áthelyezve
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
                Az időpontja áthelyezésre került. Az alábbiakban láthatja a régi és az új időpontot.
              </p>
            </td>
          </tr>

          <!-- Old appointment (struck through) -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${lightGrey}; border-radius: 8px; border-left: 4px solid #E5E7EB; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Korábbi időpont
                    </p>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: ${textMuted}; text-decoration: line-through;">
                      ${oldDate}, ${oldTime}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- New appointment (highlighted) -->
          <tr>
            <td style="padding: 12px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${lightGrey}; border-radius: 8px; border-left: 4px solid ${green}; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Foglalási szám
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: ${navy}; font-family: monospace, monospace;">
                      ${reservationNumber}
                    </p>

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Szolgáltatás
                    </p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: ${textDark};">
                      ${serviceName}
                    </p>

                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; color: ${textMuted}; text-transform: uppercase; letter-spacing: 0.07em;">
                      Új időpont
                    </p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${navy};">
                      ${newDate}, ${newTime}
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next steps reminder -->
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

          <!-- Action button -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <p style="margin: 0 0 14px; font-size: 14px; color: ${textMuted}; line-height: 1.6;">
                Ha szeretné módosítani vagy lemondani az új időpontját:
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${manageUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${navy}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Időpont kezelése
                    </a>
                  </td>
                  <td>
                    <a href="${mapsUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${green}; color: ${navy}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Útvonal
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

/**
 * Builds a branded HTML reminder email sent 24 hours before the appointment.
 * No cancel/reschedule links — 24h window has passed by reminder time.
 */
export function buildReminderEmail(params: {
  patientName: string;
  serviceName: string;
  date: string; // Pre-formatted Hungarian date string
  time: string; // "09:20"
  clinicPhone: string;
  clinicAddress: string;
}): string {
  const { patientName, serviceName, date, time, clinicPhone, clinicAddress } = params;

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Emlékeztető: holnapi időpontja</title>
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
                Emlékeztető: holnapi időpontja
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
                Emlékeztetjük, hogy holnap időpontja van nálunk. Örömmel várjuk!
              </p>
            </td>
          </tr>

          <!-- Appointment details -->
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

          <!-- Reminders -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="background-color: ${pink}; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: ${navy}; text-transform: uppercase; letter-spacing: 0.06em;">
                      Hasznos tudnivalók
                    </p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${textDark}; line-height: 1.6;">
                      &#x2022;&nbsp; Kérjük, érkezzen <strong>5 perccel korábban</strong>.
                    </p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${textDark}; line-height: 1.6;">
                      &#x2022;&nbsp; Hozza magával a <strong>TAJ kártyáját</strong>.
                    </p>
                    <p style="margin: 0; font-size: 14px; color: ${textDark}; line-height: 1.6;">
                      &#x2022;&nbsp; Ha nem tud megjelenni, kérjük, értesítsen minket telefonon.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Útvonal button -->
          <tr>
            <td style="padding: 28px 40px 0;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <a href="${mapsUrl}"
                      style="display: inline-block; padding: 11px 22px; background-color: ${green}; color: ${navy}; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Útvonal
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
