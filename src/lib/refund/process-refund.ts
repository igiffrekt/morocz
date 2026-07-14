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
  reservationNumber: string | null;
  refundStatus: string | null;
  creditInvoiceNumber: string | null;
}

/** Identifying fields reception needs to actually find the payment in Stripe/Számlázz. */
export interface InvoiceFailedNotice {
  patientName: string;
  reservationNumber: string | null;
  /** Stripe cardholder — often NOT the patient (a relative may pay), which is what makes a
   *  Stripe/Számlázz search by patient name come up empty. */
  buyerName: string | null;
  paymentIntentId: string;
}

export interface InvoiceResolvedNotice {
  patientName: string;
  reservationNumber: string | null;
  invoiceNumber: string;
}

export interface ProcessRefundDeps {
  findBooking: (paymentIntentId: string) => Promise<RefundBooking | null>;
  getBuyerAddress: (
    email: string,
  ) => Promise<{ zip: string | null; city: string | null; address: string | null } | null>;
  /** Resolves an invoice already issued for this booking. Throws if it cannot tell. */
  findExistingCreditInvoice: (bookingId: string) => Promise<{ invoiceNumber: string } | null>;
  issueCreditInvoice: (input: {
    amountHuf: number;
    buyer: { name: string; zip: string; city: string; address: string; email: string };
    bookingId: string;
    reservationNumber?: string | null;
  }) => Promise<{ invoiceNumber: string }>;
  patchBooking: (bookingId: string, fields: Record<string, unknown>) => Promise<void>;
  sendInvoiceFailedEmail: (input: InvoiceFailedNotice) => Promise<void>;
  /** Retracts a previously sent invoice-failed email once a retry issues the invoice. */
  sendInvoiceResolvedEmail: (input: InvoiceResolvedNotice) => Promise<void>;
}

export async function processRefund(charge: RefundCharge, deps: ProcessRefundDeps): Promise<void> {
  const booking = await deps.findBooking(charge.paymentIntentId);
  if (!booking) {
    console.warn(`[process-refund] No booking for payment intent ${charge.paymentIntentId}`);
    return;
  }
  // Idempotency: skip only when the credit invoice was actually issued. Keying on the refund
  // id was a bug — a prior FAILED attempt records stripeRefundId (see the catch below), which
  // then permanently blocked retries even though no invoice exists.
  if (booking.creditInvoiceNumber) {
    console.log(
      `[process-refund] Credit invoice ${booking.creditInvoiceNumber} already issued for ${booking._id}`,
    );
    return;
  }

  // A prior attempt failed and already told reception to invoice by hand. If this attempt
  // succeeds we owe them a retraction — otherwise they issue a second credit invoice.
  const receptionWasAskedToInvoiceManually = booking.refundStatus === "invoice_failed";

  const recordInvoice = async (invoiceNumber: string): Promise<void> => {
    await deps.patchBooking(booking._id, {
      refundStatus: "refunded",
      stripeRefundId: charge.refundId,
      creditInvoiceNumber: invoiceNumber,
      creditInvoiceIssuedAt: new Date().toISOString(),
    });

    if (receptionWasAskedToInvoiceManually) {
      // The invoice is issued and recorded, so a mail failure must never throw: throwing
      // would make Stripe retry a webhook that has no work left to do.
      try {
        await deps.sendInvoiceResolvedEmail({
          patientName: booking.patientName,
          reservationNumber: booking.reservationNumber,
          invoiceNumber,
        });
      } catch (err) {
        console.error(`[process-refund] Resolved-notice email failed for ${booking._id}:`, err);
      }
    }
  };

  // ── Ask Számlázz before issuing ────────────────────────────────────────────────────────
  // `creditInvoiceNumber` alone cannot make a retry safe: Számlázz can create the invoice and
  // still leave us with nothing to record (a slow response trips the client's 15s timeout, so
  // the call throws even though the invoice exists). The retry then saw a null invoice number
  // and issued a SECOND one — that is how booking rMg6ouqZ… got both E-MRCZ-2026-9 and -10 on
  // 2026-07-14, double-crediting the books by 10.000 Ft against a single Stripe refund.
  //
  // Fail closed: if we cannot determine whether an invoice exists, throw and let Stripe retry.
  // A late credit invoice is recoverable; a duplicate one is a manual accounting correction.
  let existing: { invoiceNumber: string } | null;
  try {
    existing = await deps.findExistingCreditInvoice(booking._id);
  } catch (err) {
    console.error(
      `[process-refund] Cannot verify whether a credit invoice exists for ${booking._id}; refusing to issue (would risk a duplicate):`,
      err,
    );
    throw err;
  }

  if (existing) {
    console.warn(
      `[process-refund] Credit invoice ${existing.invoiceNumber} already exists at Számlázz for ${booking._id} but was never recorded — adopting it instead of issuing a duplicate.`,
    );
    await recordInvoice(existing.invoiceNumber);
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

  let invoiceNumber: string;
  try {
    ({ invoiceNumber } = await deps.issueCreditInvoice({
      amountHuf: BOOKING_FEE_HUF,
      buyer: {
        name: charge.billingName ?? booking.patientName,
        zip,
        city,
        address,
        email: booking.patientEmail,
      },
      bookingId: booking._id,
      reservationNumber: booking.reservationNumber,
    }));
  } catch (err) {
    console.error(`[process-refund] Credit invoice failed for ${booking._id}:`, err);
    // Run both independently: a patchBooking failure must not prevent the reception
    // email — that email is the operator's only signal to issue the invoice manually.
    await Promise.allSettled([
      deps.patchBooking(booking._id, {
        refundStatus: "invoice_failed",
        stripeRefundId: charge.refundId,
      }),
      deps.sendInvoiceFailedEmail({
        patientName: booking.patientName,
        reservationNumber: booking.reservationNumber,
        buyerName: charge.billingName,
        paymentIntentId: charge.paymentIntentId,
      }),
    ]);
    return;
  }

  // The invoice now EXISTS. Recording it is a separate concern: a Sanity failure here must not
  // be reported as an invoice failure (that is what would ask reception to issue it by hand).
  // It rethrows instead, so Stripe retries — and the lookup above adopts the invoice.
  console.log(`[process-refund] Credit invoice ${invoiceNumber} issued for ${booking._id}`);
  await recordInvoice(invoiceNumber);
}
