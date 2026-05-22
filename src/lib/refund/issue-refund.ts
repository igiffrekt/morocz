import { stripe } from "@/lib/stripe";

export interface IssueRefundInput {
  paymentIntentId: string;
  bookingId: string;
}

export async function issueRefund({
  paymentIntentId,
  bookingId,
}: IssueRefundInput): Promise<{ refundId: string }> {
  // No `amount` → Stripe refunds the full payment intent. The booking fee is always a
  // fixed 10.000 Ft, so a full refund is correct; revisit if partial payments are added.
  const refund = await stripe.refunds.create(
    { payment_intent: paymentIntentId },
    { idempotencyKey: `refund-${bookingId}` },
  );
  return { refundId: refund.id };
}
