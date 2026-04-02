import { z } from "zod";
import { auth } from "@/lib/auth";
import { buildAdminCancellationEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

// ── Request body schema ────────────────────────────────────────────────────────
const AdminCancelSchema = z.object({
  bookingId: z.string().min(1, "A foglalás azonosítója megadása kötelező."),
  reason: z.string().optional(),
});

// ── 24h window enforcement ─────────────────────────────────────────────────────
function isWithin24Hours(slotDate: string, slotTime: string): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - Date.now()) / (1000 * 60 * 60) < 24;
}

// ── POST /api/admin/booking-cancel ─────────────────────────────────────────────
// Cancels a booking by _id with admin session auth.
// Enforces 24h rule, releases slot, sends admin cancellation email.
export async function POST(request: Request): Promise<Response> {
  try {
    // ── 1. Admin session check ─────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
    }

    // ── 2. Parse and validate body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
    }

    const parsed = AdminCancelSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { bookingId, reason } = parsed.data;

    // ── 3. Fetch booking by _id ────────────────────────────────────────────────
    // Note: $token is reserved in @sanity/client QueryParams — use $bookingId
    type BookingForAdminCancel = {
      _id: string;
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      reservationNumber: string;
      service: { name: string } | null;
      slotDate: string;
      slotTime: string;
      status: string;
      googleCalendarEventId?: string | null;
    };

    const booking = await getWriteClient().fetch<BookingForAdminCancel | null>(
      `*[_type == "booking" && _id == $bookingId][0]{
        _id, patientName, patientEmail, patientPhone, reservationNumber,
        service->{name}, slotDate, slotTime, status, googleCalendarEventId
      }`,
      { bookingId },
    );

    if (!booking) {
      return Response.json({ error: "A foglalás nem található." }, { status: 404 });
    }

    // ── 4. Validate booking status ─────────────────────────────────────────────
    if (booking.status !== "confirmed") {
      return Response.json({ error: "Ez az időpont már nem aktív." }, { status: 400 });
    }

    // ── 5. Admin bypass: no 24h restriction ────────────────────────────────────
    // Admin users can cancel at any time, so we skip the 24h window check

    // ── 6. Patch booking status to "cancelled" ─────────────────────────────────
    await getWriteClient().patch(booking._id).set({ status: "cancelled" }).commit();

    // ── 6b. Delete Google Calendar event (fire-and-forget) ───────────────────
    if (booking.googleCalendarEventId) {
      void deleteCalendarEvent(booking.googleCalendarEventId);
    }

    // ── 7. Release the slot — patch slotLock to available ─────────────────────
    const slotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
    try {
      await getWriteClient()
        .patch(slotLockDocId)
        .set({ status: "available" })
        .unset(["bookingRef"])
        .commit();
    } catch (slotErr) {
      // If slotLock doesn't exist or fails, log warning but do not fail the cancellation
      console.warn("[api/admin/booking-cancel] Failed to release slotLock:", slotErr);
    }

    // ── 8. Send admin cancellation email (fire-and-forget) ─────────────────────
    if (isEmailConfigured()) {
      void sendAdminCancellationEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        reservationNumber: booking.reservationNumber,
        serviceName: booking.service?.name?.startsWith("Nőgyógyász")
          ? "Nőgyógyászati vizsgálat"
          : (booking.service?.name ?? "Foglalt szolgáltatás"),
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
        reason,
      });
    }

    // ── 9. Return success ──────────────────────────────────────────────────────
    return Response.json(
      { success: true, message: "Az időpont sikeresen lemondva." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/admin/booking-cancel] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}

// ── Helper: send admin cancellation email fire-and-forget ──────────────────────
async function sendAdminCancellationEmailAsync({
  patientName,
  patientEmail,
  reservationNumber,
  serviceName,
  slotDate,
  slotTime,
  reason,
}: {
  patientName: string;
  patientEmail: string;
  reservationNumber: string;
  serviceName: string;
  slotDate: string;
  slotTime: string;
  reason?: string;
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

    const html = buildAdminCancellationEmail({
      patientName,
      serviceName,
      reservationNumber,
      date: formattedDate,
      time: slotTime,
      reason,
      clinicPhone: "+36 70 639 5239",
      clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
      newBookingUrl,
    });

    await sendEmail({
      to: patientEmail,
      subject: "Időpont lemondva a rendelő által — Mórocz Medical",
      html,
    });
  } catch (err) {
    // Fire-and-forget: log but never throw — cancellation is already processed
    console.error("[api/admin/booking-cancel] Failed to send admin cancellation email:", err);
  }
}
