import { defineQuery } from "next-sanity";
import { buildConfirmationEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";
import { stripe } from "@/lib/stripe";
import { sanityFetch } from "@/sanity/lib/fetch";

export const dynamic = "force-dynamic";

const serviceForEmailQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

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
            await getWriteClient().patch(bookingId).set({ googleCalendarEventId: eventId }).commit();
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

  return Response.json({ received: true });
}
