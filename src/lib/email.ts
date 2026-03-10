/**
 * Email sending via Brevo (Sendinblue) API v3
 *
 * Required env vars:
 *   BREVO_API_KEY          — Brevo API v3 key
 *   GMAIL_SENDER_EMAIL     — From address
 */

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = params.from ?? process.env.GMAIL_SENDER_EMAIL;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  if (!senderEmail) {
    throw new Error("GMAIL_SENDER_EMAIL is not configured");
  }

  const payload = {
    sender: {
      name: "Mórocz Medical",
      email: senderEmail,
    },
    to: [
      {
        email: params.to,
      },
    ],
    subject: params.subject,
    htmlContent: params.html,
  };

  console.log("[email] Sending via Brevo:", {
    from: senderEmail,
    to: params.to,
    subject: params.subject,
  });

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("[email] Brevo API error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(`Brevo API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log("[email] Email sent successfully! Message ID:", result.messageId);
}

/** Check whether email is configured. */
export function isEmailConfigured(): boolean {
  return !!(process.env.BREVO_API_KEY && process.env.GMAIL_SENDER_EMAIL);
}
