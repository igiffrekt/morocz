/**
 * Resolve the id of the refund that triggered a `charge.refunded` event.
 *
 * Stripe API version 2026-03-25.dahlia does NOT embed the `refunds` list in the charge
 * object by default — it must be expanded. So `charge.refunds.data[0]` is usually absent
 * on a live webhook payload, and we fall back to listing the charge's refunds via the API.
 * (Older payloads that still embed the list are honoured without an extra round-trip.)
 */
export interface ChargeWithMaybeRefunds {
  id: string;
  refunds?: { data?: Array<{ id: string }> } | null;
}

export async function resolveLatestRefundId(
  charge: ChargeWithMaybeRefunds,
  listRefunds: (chargeId: string) => Promise<Array<{ id: string }>>,
): Promise<string | null> {
  const embedded = charge.refunds?.data?.[0]?.id;
  if (embedded) return embedded;

  const fetched = await listRefunds(charge.id);
  return fetched[0]?.id ?? null;
}
