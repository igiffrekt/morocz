import { eq, sql } from "drizzle-orm";
import { runBookingConfirmedSideEffects } from "@/lib/booking-confirmed";
import {
  buildInvoiceFailedEmail,
  buildInvoiceResolvedEmail,
  INVOICE_FAILED_SUBJECT,
  INVOICE_RESOLVED_SUBJECT,
} from "@/lib/booking-email";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { processRefund, type RefundBooking } from "@/lib/refund/process-refund";
import { resolveLatestRefundId } from "@/lib/refund/resolve-latest-refund";
import { getWriteClient } from "@/lib/sanity-write-client";
import { releaseSlotLock } from "@/lib/slot-lock";
import { stripe } from "@/lib/stripe";
import { creditInvoiceExternalId } from "@/lib/szamlazz/build-credit-invoice-xml";
import { findCreditInvoiceByExternalId, issueCreditInvoice } from "@/lib/szamlazz/client";

export const dynamic = "force-dynamic";

const RECEPTION_EMAIL = "recepcio@drmoroczangela.hu";

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata ?? {};
    const bookingId = metadata.bookingId;

    if (!bookingId) {
      console.error("[stripe-webhook] No bookingId in metadata");
      return Response.json({ received: true });
    }

    console.log(`[stripe-webhook] Payment completed for booking ${bookingId}`);

    try {
      await getWriteClient()
        .patch(bookingId)
        .set({
          paymentStatus: "paid",
          stripePaymentIntentId: session.payment_intent as string,
        })
        .commit();

      // Fire-and-forget: Google Calendar + confirmation email (shared with the
      // fee-waived checkout path, see src/lib/booking-confirmed.ts).
      void runBookingConfirmedSideEffects(
        {
          bookingId,
          reservationNumber: metadata.reservationNumber ?? "",
          managementToken: metadata.managementToken ?? "",
          serviceId: metadata.serviceId ?? "",
          slotDate: metadata.slotDate ?? "",
          slotTime: metadata.slotTime ?? "",
          patientName: metadata.patientName ?? "",
          patientEmail: metadata.patientEmail ?? "",
          patientPhone: metadata.patientPhone ?? "",
        },
        "[stripe-webhook]",
      );
    } catch (err) {
      console.error("[stripe-webhook] Failed to update booking:", err);
      return Response.json({ error: "Failed to process" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      console.log(`[stripe-webhook] Checkout expired for booking ${bookingId}, cleaning up`);
      try {
        const booking = await getWriteClient().fetch<{ slotDate: string; slotTime: string } | null>(
          `*[_type == "booking" && _id == $id][0]{slotDate, slotTime}`,
          { id: bookingId },
        );

        await getWriteClient()
          .patch(bookingId)
          .set({ status: "cancelled", paymentStatus: "failed" })
          .commit();

        if (booking) {
          await releaseSlotLock({ _id: bookingId, ...booking }).catch(() => {});
        }
      } catch (err) {
        console.error("[stripe-webhook] Failed to clean up expired checkout:", err);
      }
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : (charge.payment_intent?.id ?? null);
    // API version 2026-03-25.dahlia does not embed `refunds` on the charge, so we list the
    // charge's refunds when absent. Newest-first, and we only ever issue one full refund per
    // booking, so refunds[0] is unambiguously the refund that triggered this event.
    const latestRefundId = await resolveLatestRefundId(charge, async (chargeId) => {
      const list = await stripe.refunds.list({ charge: chargeId, limit: 1 });
      return list.data;
    });

    if (paymentIntentId && latestRefundId) {
      try {
        await processRefund(
          {
            paymentIntentId,
            refundId: latestRefundId,
            billingName: charge.billing_details?.name ?? null,
            billingAddress: {
              zip: charge.billing_details?.address?.postal_code ?? null,
              city: charge.billing_details?.address?.city ?? null,
              address: charge.billing_details?.address?.line1 ?? null,
            },
          },
          {
            findBooking: (pi) =>
              getWriteClient().fetch<RefundBooking | null>(
                `*[_type == "booking" && stripePaymentIntentId == $pi][0]{
                  _id, patientName, patientEmail, reservationNumber, refundStatus,
                  creditInvoiceNumber
                }`,
                { pi },
              ),
            getBuyerAddress: async (email) => {
              const row = await db.query.user.findFirst({
                where: eq(sql`lower(${user.email})`, email.toLowerCase()),
                columns: { postalCode: true, city: true, streetAddress: true },
              });
              return row
                ? { zip: row.postalCode, city: row.city, address: row.streetAddress }
                : null;
            },
            findExistingCreditInvoice: (bookingId) =>
              findCreditInvoiceByExternalId(creditInvoiceExternalId(bookingId)),
            issueCreditInvoice,
            patchBooking: async (bookingId, fields) => {
              await getWriteClient().patch(bookingId).set(fields).commit();
            },
            sendInvoiceFailedEmail: async (notice) => {
              if (!isEmailConfigured()) return;
              await sendEmail({
                to: RECEPTION_EMAIL,
                subject: INVOICE_FAILED_SUBJECT,
                html: buildInvoiceFailedEmail(notice),
              });
            },
            sendInvoiceResolvedEmail: async (notice) => {
              if (!isEmailConfigured()) return;
              await sendEmail({
                to: RECEPTION_EMAIL,
                subject: INVOICE_RESOLVED_SUBJECT,
                html: buildInvoiceResolvedEmail(notice),
              });
            },
          },
        );
      } catch (err) {
        // The refund already happened and the credit invoice still must be issued.
        // processRefund is idempotent, so we deliberately return 500 to let Stripe
        // retry on transient Sanity/DB failures rather than silently dropping it.
        console.error("[stripe-webhook] charge.refunded processing failed, will retry:", err);
        return Response.json({ error: "Failed to process refund" }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
