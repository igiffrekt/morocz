import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { buildCancellationEmail, buildReceptionCancellationEmail } from "@/lib/booking-email";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { issueRefund } from "@/lib/refund/issue-refund";
import { resolveRefund } from "@/lib/refund/policy";
import { getWriteClient } from "@/lib/sanity-write-client";

const RECEPTION_EMAIL = "recepcio@drmoroczangela.hu";

export const dynamic = "force-dynamic";

// ── Request body schema ────────────────────────────────────────────────────────
const CancelSchema = z.object({
  token: z.string().min(1, "Token megadása kötelező."),
  confirmNoRefund: z.boolean().optional().default(false),
});

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  try {
    // ── 1. Parse and validate body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
    }

    const parsed = CancelSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { token, confirmNoRefund } = parsed.data;

    // ── 2. Fetch booking by managementToken ────────────────────────────────────
    // Note: $token is reserved in @sanity/client QueryParams — use $manageToken instead
    type BookingForCancel = {
      _id: string;
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      reservationNumber: string;
      service: { name: string } | null;
      slotDate: string;
      slotTime: string;
      status: string;
      managementToken: string;
      googleCalendarEventId?: string | null;
      paymentStatus?: string | null;
      stripePaymentIntentId?: string | null;
    };

    const booking = await getWriteClient().fetch<BookingForCancel | null>(
      `*[_type == "booking" && managementToken == $manageToken && status == "confirmed"][0]{
        _id, patientName, patientEmail, patientPhone, reservationNumber, service->{name},
        slotDate, slotTime, status, managementToken, googleCalendarEventId,
        paymentStatus, stripePaymentIntentId
      }`,
      { manageToken: token },
    );

    if (!booking) {
      return Response.json({ error: "Érvénytelen vagy lejárt hivatkozás." }, { status: 404 });
    }

    // ── 3. Resolve refund eligibility (48h policy) ─────────────────────────────
    const decision = resolveRefund({
      slotDate: booking.slotDate,
      slotTime: booking.slotTime,
      paymentStatus: booking.paymentStatus ?? "pending",
      confirmNoRefund,
    });

    if (decision.requiresConfirmation) {
      return Response.json(
        {
          requiresConfirmation: true,
          warning:
            "Kedves Páciensünk! 48 órán belüli lemondás esetén a 10.000 Ft-os foglalási díj NEM kerül visszatérítésre. Amennyiben ennek tudatában is le kívánja mondani az időpontot, kérjük kattintson a gombra.",
        },
        { status: 409 },
      );
    }

    // ── 4. Patch booking status to "cancelled" ─────────────────────────────────
    await getWriteClient().patch(booking._id).set({ status: "cancelled" }).commit();

    // ── 4a. Refund (the credit invoice is issued by the Stripe webhook) ────────
    if (decision.eligible && booking.stripePaymentIntentId) {
      try {
        await issueRefund({
          paymentIntentId: booking.stripePaymentIntentId,
          bookingId: booking._id,
        });
      } catch (refundErr) {
        console.error("[booking-cancel] Refund failed:", refundErr);
      }
    } else if (decision.reason === "within_window") {
      await getWriteClient().patch(booking._id).set({ refundStatus: "no_refund" }).commit();
    }

    // ── 4b. Delete Google Calendar event ─────────────────────────────────────
    if (booking.googleCalendarEventId) {
      try {
        await deleteCalendarEvent(booking.googleCalendarEventId);
        console.log(`[booking-cancel] Deleted calendar event: ${booking.googleCalendarEventId}`);
      } catch (calErr) {
        console.error("[booking-cancel] Failed to delete calendar event:", calErr);
      }
    } else {
      console.warn(`[booking-cancel] No googleCalendarEventId on booking ${booking._id}`);
    }

    // ── 5. Release the slot — patch slotLock to available ─────────────────────
    const slotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
    try {
      await getWriteClient()
        .patch(slotLockDocId)
        .set({ status: "available" })
        .unset(["bookingRef"])
        .commit();
    } catch (slotErr) {
      // If slotLock doesn't exist or fails, log warning but do not fail the cancellation
      console.warn("[api/booking-cancel] Failed to release slotLock:", slotErr);
    }

    // ── 6. Send cancellation emails (fire-and-forget) ──────────────────────────
    if (isEmailConfigured()) {
      const serviceName = booking.service?.name?.startsWith("Nőgyógyász")
        ? "Nőgyógyászati vizsgálat"
        : (booking.service?.name ?? "Foglalt szolgáltatás");

      void sendCancellationEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        reservationNumber: booking.reservationNumber,
        serviceName,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
      });

      void sendReceptionCancellationEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        patientPhone: booking.patientPhone,
        reservationNumber: booking.reservationNumber,
        serviceName,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
      });
    }

    // ── 7. Return success ──────────────────────────────────────────────────────
    return Response.json(
      { success: true, message: "Az időpont sikeresen lemondva." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/booking-cancel] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}

// ── Helper: send cancellation email fire-and-forget ───────────────────────────
async function sendCancellationEmailAsync({
  patientName,
  patientEmail,
  reservationNumber,
  serviceName,
  slotDate,
  slotTime,
}: {
  patientName: string;
  patientEmail: string;
  reservationNumber: string;
  serviceName: string;
  slotDate: string;
  slotTime: string;
}) {
  try {
    const formattedDate = new Date(slotDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
    const newBookingUrl = `${appUrl}/idopontfoglalas`;

    const html = buildCancellationEmail({
      patientName,
      serviceName,
      reservationNumber,
      date: formattedDate,
      time: slotTime,
      clinicPhone: "+36 70 639 5239",
      clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
      newBookingUrl,
    });

    await sendEmail({
      to: patientEmail,
      subject: "Időpont lemondva — Mórocz Medical",
      html,
    });
  } catch (err) {
    // Fire-and-forget: log but never throw — cancellation is already processed
    console.error("[api/booking-cancel] Failed to send cancellation email:", err);
  }
}

// ── Helper: notify reception (fire-and-forget) ────────────────────────────────
async function sendReceptionCancellationEmailAsync({
  patientName,
  patientEmail,
  patientPhone,
  reservationNumber,
  serviceName,
  slotDate,
  slotTime,
}: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reservationNumber: string;
  serviceName: string;
  slotDate: string;
  slotTime: string;
}) {
  try {
    const formattedDate = new Date(slotDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const addressRow = patientEmail
      ? await db.query.user.findFirst({
          where: eq(sql`lower(${user.email})`, patientEmail.toLowerCase()),
          columns: { postalCode: true, city: true, streetAddress: true },
        })
      : null;

    const html = buildReceptionCancellationEmail({
      patientName,
      patientEmail,
      patientPhone,
      billingAddress: {
        postalCode: addressRow?.postalCode ?? null,
        city: addressRow?.city ?? null,
        streetAddress: addressRow?.streetAddress ?? null,
      },
      serviceName,
      reservationNumber,
      date: formattedDate,
      time: slotTime,
    });

    await sendEmail({
      to: RECEPTION_EMAIL,
      subject: `Páciens lemondás — ${patientName}, ${formattedDate} ${slotTime}`,
      html,
    });
  } catch (err) {
    console.error("[api/booking-cancel] Failed to send reception notification:", err);
  }
}
