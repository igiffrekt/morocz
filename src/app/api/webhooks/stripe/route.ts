import { eq, sql } from "drizzle-orm";
import { defineQuery } from "next-sanity";
import {
  buildConfirmationEmail,
  buildInvoiceFailedEmail,
  INVOICE_FAILED_SUBJECT,
} from "@/lib/booking-email";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { processRefund, type RefundBooking } from "@/lib/refund/process-refund";
import { getWriteClient } from "@/lib/sanity-write-client";
import { stripe } from "@/lib/stripe";
import { issueCreditInvoice } from "@/lib/szamlazz/client";
import { sanityFetch } from "@/sanity/lib/fetch";

export const dynamic = "force-dynamic";

const serviceForEmailQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

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

      // Fire-and-forget: Google Calendar + email
      const {
        reservationNumber,
        managementToken,
        serviceId,
        slotDate,
        slotTime,
        patientName,
        patientEmail,
        patientPhone,
      } = metadata;

      void (async () => {
        try {
          const svc = await getWriteClient().fetch<{
            name: string;
            appointmentDuration: number;
          } | null>(`*[_type == "service" && _id == $id][0]{name, appointmentDuration}`, {
            id: serviceId,
          });
          const eventId = await createCalendarEvent({
            summary: `${svc?.name ?? "Foglalás"} — ${patientName}`,
            description: `Páciens: ${patientName}\nE-mail: ${patientEmail}\nTelefon: ${patientPhone}\nFoglalási szám: ${reservationNumber}`,
            date: slotDate!,
            startTime: slotTime!,
            durationMinutes: svc?.appointmentDuration ?? 20,
          });
          if (eventId) {
            await getWriteClient()
              .patch(bookingId)
              .set({ googleCalendarEventId: eventId })
              .commit();
            console.log(`[stripe-webhook] Google Calendar event created: ${eventId}`);
          }
        } catch (err) {
          console.error("[stripe-webhook] Google Calendar sync failed:", err);
        }
      })();

      if (isEmailConfigured() && patientEmail) {
        void (async () => {
          try {
            const service = await sanityFetch<{ name: string } | null>({
              query: serviceForEmailQuery,
              params: { serviceId },
              tags: ["service"],
            });

            const formattedDate = new Date(slotDate!).toLocaleDateString("hu-HU", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            });

            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
            const manageUrl = `${appUrl}/foglalas/${managementToken}`;

            const html = buildConfirmationEmail({
              patientName: patientName!,
              serviceName: service?.name?.startsWith("Nőgyógyász")
                ? "Nőgyógyászati vizsgálat"
                : (service?.name ?? "Foglalt szolgáltatás"),
              reservationNumber: reservationNumber!,
              date: formattedDate,
              time: slotTime!,
              manageUrl,
              clinicPhone: "+36 70 639 5239",
              clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
            });

            await sendEmail({
              to: patientEmail,
              subject: "Időpontfoglalás visszaigazolása — Mórocz Medical",
              html,
            });
            console.log(`[stripe-webhook] Confirmation email sent to ${patientEmail}`);
          } catch (err) {
            console.error("[stripe-webhook] Failed to send confirmation email:", err);
          }
        })();
      }
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
          const slotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
          await getWriteClient()
            .patch(slotLockDocId)
            .set({ status: "available" })
            .unset(["bookingRef"])
            .commit()
            .catch(() => {});
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
    // Stripe embeds refunds newest-first, so data[0] is the refund that triggered this
    // event. We only ever issue one full refund per booking, so this is unambiguous.
    const latestRefund = charge.refunds?.data?.[0];

    if (paymentIntentId && latestRefund) {
      try {
        await processRefund(
          {
            paymentIntentId,
            refundId: latestRefund.id,
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
                  _id, patientName, patientEmail, stripeRefundId
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
            issueCreditInvoice,
            patchBooking: async (bookingId, fields) => {
              await getWriteClient().patch(bookingId).set(fields).commit();
            },
            sendInvoiceFailedEmail: async ({ patientName }) => {
              if (!isEmailConfigured()) return;
              await sendEmail({
                to: RECEPTION_EMAIL,
                subject: INVOICE_FAILED_SUBJECT,
                html: buildInvoiceFailedEmail({ patientName }),
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
