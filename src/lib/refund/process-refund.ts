import { BOOKING_FEE_HUF } from "@/lib/stripe";

export interface RefundCharge {
  paymentIntentId: string;
  refundId: string;
  billingName: string | null;
  billingAddress: { zip: string | null; city: string | null; address: string | null };
}

export interface RefundBooking {
  _id: string;
  patientName: string;
  patientEmail: string;
  stripeRefundId: string | null;
}

export interface ProcessRefundDeps {
  findBooking: (paymentIntentId: string) => Promise<RefundBooking | null>;
  getBuyerAddress: (
    email: string,
  ) => Promise<{ zip: string | null; city: string | null; address: string | null } | null>;
  issueCreditInvoice: (input: {
    amountHuf: number;
    buyer: { name: string; zip: string; city: string; address: string; email: string };
  }) => Promise<{ invoiceNumber: string }>;
  patchBooking: (bookingId: string, fields: Record<string, unknown>) => Promise<void>;
  sendInvoiceFailedEmail: (input: { patientName: string }) => Promise<void>;
}

export async function processRefund(charge: RefundCharge, deps: ProcessRefundDeps): Promise<void> {
  const booking = await deps.findBooking(charge.paymentIntentId);
  if (!booking) {
    console.warn(`[process-refund] No booking for payment intent ${charge.paymentIntentId}`);
    return;
  }
  if (booking.stripeRefundId === charge.refundId) {
    console.log(`[process-refund] Refund ${charge.refundId} already processed for ${booking._id}`);
    return;
  }

  // A buyer-address lookup failure must not abort invoicing — fall back to the Stripe
  // billing address. (Throwing here would skip the invoice + the reception fallback.)
  let userAddr: { zip: string | null; city: string | null; address: string | null } | null = null;
  try {
    userAddr = await deps.getBuyerAddress(booking.patientEmail);
  } catch (err) {
    console.error(`[process-refund] Buyer address lookup failed for ${booking._id}:`, err);
  }
  const zip = userAddr?.zip ?? charge.billingAddress.zip ?? "";
  const city = userAddr?.city ?? charge.billingAddress.city ?? "";
  const address = userAddr?.address ?? charge.billingAddress.address ?? "";

  try {
    const { invoiceNumber } = await deps.issueCreditInvoice({
      amountHuf: BOOKING_FEE_HUF,
      buyer: {
        name: charge.billingName ?? booking.patientName,
        zip,
        city,
        address,
        email: booking.patientEmail,
      },
    });

    await deps.patchBooking(booking._id, {
      refundStatus: "refunded",
      stripeRefundId: charge.refundId,
      creditInvoiceNumber: invoiceNumber,
      creditInvoiceIssuedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[process-refund] Credit invoice failed for ${booking._id}:`, err);
    // Run both independently: a patchBooking failure must not prevent the reception
    // email — that email is the operator's only signal to issue the invoice manually.
    await Promise.allSettled([
      deps.patchBooking(booking._id, {
        refundStatus: "invoice_failed",
        stripeRefundId: charge.refundId,
      }),
      deps.sendInvoiceFailedEmail({ patientName: booking.patientName }),
    ]);
  }
}
