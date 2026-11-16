/**
 * Server-side booking-fee allowlist.
 *
 * FEE_EXEMPT_EMAILS is a comma-separated list of account e-mail addresses that
 * may book without paying the booking fee (matched case-insensitively, entries
 * trimmed, empty entries ignored). The decision is always made on the server
 * from the authenticated session — never from a client flag.
 */

export function parseFeeExemptEmails(raw: string | null | undefined): Set<string> {
  const set = new Set<string>();
  if (!raw) return set;
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (email) set.add(email);
  }
  return set;
}

export function isFeeExemptEmail(
  email: string | null | undefined,
  raw: string | null | undefined = process.env.FEE_EXEMPT_EMAILS,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return parseFeeExemptEmails(raw).has(normalized);
}

/**
 * True when the session user may book without the fee. The account's e-mail
 * must be verified: e-mail/password sign-up does not require verification, so
 * an unverified account proves nothing about owning the allowlisted address.
 */
export function isFeeExemptUser(
  user: { email?: string | null; emailVerified?: boolean | null } | null | undefined,
  raw: string | null | undefined = process.env.FEE_EXEMPT_EMAILS,
): boolean {
  if (!user || user.emailVerified !== true) return false;
  return isFeeExemptEmail(user.email, raw);
}
