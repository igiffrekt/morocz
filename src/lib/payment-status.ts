/**
 * Booking `paymentStatus` values. Client-safe (no env / server imports) so the
 * patient and admin UIs can branch on a fee-waived booking too.
 *
 * "waived" marks a booking created without the 10 000 Ft booking fee for an
 * allowlisted account (see src/lib/fee-exemption.ts): there is no Stripe
 * payment behind it, so it must never be refunded or credit-invoiced.
 */
export const PAYMENT_STATUS_WAIVED = "waived";

export function isFeeWaived(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === PAYMENT_STATUS_WAIVED;
}
