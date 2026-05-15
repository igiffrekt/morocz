import { buildConfirmationEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";
import { stripe } from "@/lib/stripe";

// Grace period before a pending booking is considered stale.
// Stripe sessions are created with a 35-minute expiry (see checkout/route.ts).
const STALE_PENDING_MS = 35 * 60 * 1000;

type PendingBooking = {
  _id: string;
  _createdAt: string;
  stripeSessionId: string | null;
  slotDate: string;
  slotTime: string;
  patientEmail: string | null;
  patientName: string | null;
  reservationNumber: string | null;
  managementToken: string | null;
  googleCalendarEventId: string | null;
  serviceName: string | null;
  serviceDuration: number | null;
};

type ReconcileOutcome =
  | { bookingId: string; action: "paid" }
  | { bookingId: string; action: "cancelled" }
  | { bookingId: string; action: "skipped"; reason: string };

export async function reconcilePendingBooking(bookingId: string): Promise<ReconcileOutcome> {
  const booking = await getWriteClient().fetch<PendingBooking | null>(
    `*[_type == "booking" && _id == $id][0]{
      _id, _createdAt, stripeSessionId, slotDate, slotTime, patientEmail, patientName,
      reservationNumber, managementToken, googleCalendarEventId,
      "serviceName": service->name,
      "serviceDuration": service->appointmentDuration
    }`,
    { id: bookingId },
  );

  if (!booking) return { bookingId, action: "skipped", reason: "not-found" };
  if (!booking.stripeSessionId) {
    return { bookingId, action: "skipped", reason: "no-stripe-session" };
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
  } catch (err) {
    console.error(`[reconciler] Stripe retrieve failed for ${bookingId}:`, err);
    return { bookingId, action: "skipped", reason: "stripe-error" };
  }

  const isPaid = session.status === "complete" && session.payment_status === "paid";
  const isExpired =
    session.status === "expired" ||
    (session.status === "complete" && session.payment_status === "unpaid");
  const isStaleOpen =
    session.status === "open" &&
    Date.now() - new Date(booking._createdAt).getTime() > STALE_PENDING_MS;

  if (isPaid) {
    await markPaidAndNotify(booking, session);
    return { bookingId, action: "paid" };
  }

  if (isExpired || isStaleOpen) {
    await cancelAndReleaseSlot(booking);
    return { bookingId, action: "cancelled" };
  }

  return { bookingId, action: "skipped", reason: `stripe-status=${session.status}` };
}

export async function reconcileAllStalePending(): Promise<ReconcileOutcome[]> {
  const cutoffIso = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  const ids = await getWriteClient().fetch<string[]>(
    `*[_type == "booking" && paymentStatus == "pending" && _createdAt < $cutoff]._id`,
    { cutoff: cutoffIso },
  );

  const results: ReconcileOutcome[] = [];
  for (const id of ids) {
    try {
      results.push(await reconcilePendingBooking(id));
    } catch (err) {
      console.error(`[reconciler] Unexpected error for ${id}:`, err);
      results.push({ bookingId: id, action: "skipped", reason: "unexpected-error" });
    }
  }
  return results;
}

async function markPaidAndNotify(
  booking: PendingBooking,
  session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>,
): Promise<void> {
  await getWriteClient()
    .patch(booking._id)
    .set({
      paymentStatus: "paid",
      stripePaymentIntentId: (session.payment_intent as string | null) ?? undefined,
    })
    .commit();

  if (!booking.googleCalendarEventId) {
    try {
      const eventId = await createCalendarEvent({
        summary: `${booking.serviceName ?? "Foglalás"} — ${booking.patientName ?? ""}`,
        description: `Páciens: ${booking.patientName ?? ""}\nE-mail: ${booking.patientEmail ?? ""}\nFoglalási szám: ${booking.reservationNumber ?? ""}`,
        date: booking.slotDate,
        startTime: booking.slotTime,
        durationMinutes: booking.serviceDuration ?? 20,
      });
      if (eventId) {
        await getWriteClient().patch(booking._id).set({ googleCalendarEventId: eventId }).commit();
      }
    } catch (err) {
      console.error(`[reconciler] Calendar create failed for ${booking._id}:`, err);
    }
  }

  if (isEmailConfigured() && booking.patientEmail) {
    try {
      const formattedDate = new Date(booking.slotDate).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
      const manageUrl = booking.managementToken
        ? `${appUrl}/foglalas/${booking.managementToken}`
        : `${appUrl}/profil`;
      const html = buildConfirmationEmail({
        patientName: booking.patientName ?? "",
        serviceName: booking.serviceName?.startsWith("Nőgyógyász")
          ? "Nőgyógyászati vizsgálat"
          : (booking.serviceName ?? "Foglalt szolgáltatás"),
        reservationNumber: booking.reservationNumber ?? "",
        date: formattedDate,
        time: booking.slotTime,
        manageUrl,
        clinicPhone: "+36 70 639 5239",
        clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
      });
      await sendEmail({
        to: booking.patientEmail,
        subject: "Időpontfoglalás visszaigazolása — Mórocz Medical",
        html,
      });
    } catch (err) {
      console.error(`[reconciler] Confirmation email failed for ${booking._id}:`, err);
    }
  }
}

async function cancelAndReleaseSlot(booking: PendingBooking): Promise<void> {
  await getWriteClient()
    .patch(booking._id)
    .set({ status: "cancelled", paymentStatus: "failed" })
    .commit();

  const slotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
  try {
    await getWriteClient()
      .patch(slotLockDocId)
      .set({ status: "available" })
      .unset(["bookingRef"])
      .commit();
  } catch (err) {
    console.warn(`[reconciler] Failed to release slotLock ${slotLockDocId}:`, err);
  }
}
