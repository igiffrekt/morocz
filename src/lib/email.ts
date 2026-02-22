import { google } from "googleapis";

/**
 * Shared email sending via Gmail API (OAuth2).
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID      — OAuth2 client ID (same as auth)
 *   GOOGLE_CLIENT_SECRET   — OAuth2 client secret (same as auth)
 *   GMAIL_REFRESH_TOKEN    — Refresh token with gmail.send scope
 *   GMAIL_SENDER_EMAIL     — "From" address (optional, defaults to authenticated user)
 */

function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

function createRawMessage(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): string {
  // Encode subject with RFC 2047 for UTF-8 support (Hungarian characters)
  const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject).toString("base64")}?=`;

  const messageParts = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(params.html).toString("base64"),
  ];

  return Buffer.from(messageParts.join("\r\n")).toString("base64url");
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  const senderEmail = params.from ?? process.env.GMAIL_SENDER_EMAIL;

  const raw = createRawMessage({
    from: senderEmail ?? "me",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  const gmail = getGmailClient();
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

/** Check whether Gmail API credentials are configured. */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  );
}
