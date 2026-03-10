import { z } from "zod";
import { buildCancellationEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

// ── Request body schema ────────────────────────────────────────────────────────
const CancelSchema = z.object({
  token: z.string().min(1, "Token megadása kötelező."),
});

// ── 24h window enforcement ─────────────────────────────────────────────────────
function isWithin24Hours(slotDate: string, slotTime: string): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - Date.now()) / (1000 * 60 * 60) < 24;
}

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

    const { token } = parsed.data;

    // ── 2. Fetch booking by managementToken ────────────────────────────────────
    // Note: $token is reserved in @sanity/client QueryParams — use $manageToken instead
    type BookingForCancel = {
      _id: string;
      patientName: string;
      patientEmail: string;
      reservationNumber: string;
      service: { name: string } | null;
      slotDate: string;
      slotTime: string;
      status: string;
      managementToken: string;
      googleCalendarEventId?: string | null;
    };

    const booking = await getWriteClient().fetch<BookingForCancel | null>(
      `*[_type == "booking" && managementToken == $manageToken && status == "confirmed"][0]{
        _id, patientName, patientEmail, reservationNumber, service->{name},
        slotDate, slotTime, status, managementToken, googleCalendarEventId
      }`,
      { manageToken: token },
    );

    if (!booking) {
      return Response.json({ error: "Érvénytelen vagy lejárt hivatkozás." }, { status: 404 });
    }

    // ── 3. Enforce 24h window server-side ──────────────────────────────────────
    if (isWithin24Hours(booking.slotDate, booking.slotTime)) {
      return Response.json(
        {
          error:
            "Az időpont már nem mondható le (kevesebb mint 24 óra van hátra). Kérjük, hívjon minket: +36 70 639 5239",
        },
        { status: 403 },
      );
    }

    // ── 4. Patch booking status to "cancelled" ─────────────────────────────────
    await getWriteClient().patch(booking._id).set({ status: "cancelled" }).commit();

    // ── 4b. Delete Google Calendar event (fire-and-forget) ────────────────────
    if (booking.googleCalendarEventId) {
      void deleteCalendarEvent(booking.googleCalendarEventId);
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

    // ── 6. Send cancellation email (fire-and-forget) ───────────────────────────
    if (isEmailConfigured()) {
      void sendCancellationEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        reservationNumber: booking.reservationNumber,
        serviceName: booking.service?.name?.startsWith("Nőgyógyász")
          ? "Nőgyógyászati vizsgálat"
          : (booking.service?.name ?? "Foglalt szolgáltatás"),
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
