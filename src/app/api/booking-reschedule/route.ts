import { google } from "googleapis";
import { z } from "zod";
import { buildRescheduleEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

// ── Request body schema ────────────────────────────────────────────────────────
const RescheduleSchema = z.object({
  token: z.string().min(1, "Token megadása kötelező."),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  newTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
});

// ── Delete Google Calendar event ──────────────────────────────────────────────
async function deleteCalendarEvent(eventId: string | null): Promise<void> {
  if (!eventId) return;

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId,
    });

    console.log(`[booking-reschedule] Deleted old calendar event: ${eventId}`);
  } catch (err) {
    console.error(`[booking-reschedule] Failed to delete calendar event ${eventId}:`, err);
    // Don't fail reschedule if event delete fails
  }
}

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

    const parsed = RescheduleSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { token, newDate, newTime } = parsed.data;

    // ── 2. Fetch booking by managementToken ────────────────────────────────────
    // Note: $token is reserved in @sanity/client QueryParams — use $manageToken instead
    type BookingForReschedule = {
      _id: string;
      patientName: string;
      patientEmail: string;
      reservationNumber: string;
      service: { name: string; appointmentDuration: number } | null;
      slotDate: string;
      slotTime: string;
      managementToken: string;
      serviceId: string;
      googleCalendarEventId?: string | null;
    };

    const booking = await getWriteClient().fetch<BookingForReschedule | null>(
      `*[_type == "booking" && managementToken == $manageToken && status == "confirmed"][0]{
        _id, patientName, patientEmail, reservationNumber, service->{name, appointmentDuration},
        slotDate, slotTime, managementToken, "serviceId": service._ref, googleCalendarEventId
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
            "Az időpont már nem helyezhető át (kevesebb mint 24 óra van hátra). Kérjük, hívjon minket: +36 70 639 5239",
        },
        { status: 403 },
      );
    }

    // ── 4. Check the new slot is different from current ────────────────────────
    if (newDate === booking.slotDate && newTime === booking.slotTime) {
      return Response.json(
        {
          error: "Ez a jelenlegi időpont. Kérjük, válasszon másik időpontot.",
        },
        { status: 400 },
      );
    }

    // ── 5. STEP 1 — Lock the new slot (atomic swap, critical section) ──────────
    const newSlotId = `${newDate}T${newTime}:00`;
    const newSlotLockDocId = `slotLock-${newDate}-${newTime.replace(":", "-")}`;

    // Create the slotLock document if it doesn't exist yet
    await getWriteClient().createIfNotExists({
      _id: newSlotLockDocId,
      _type: "slotLock",
      slotId: newSlotId,
      status: "available",
    });

    // Fetch for current _rev (needed for optimistic locking)
    type SlotLock = { _id: string; _rev: string; status: string };
    const newSlotLock = await getWriteClient().fetch<SlotLock | null>(
      `*[_type == "slotLock" && slotId == $slotId][0]{_id, _rev, status}`,
      { slotId: newSlotId },
    );

    if (!newSlotLock) {
      return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
    }

    // Check if already booked before attempting optimistic lock
    if (newSlotLock.status === "booked") {
      return Response.json(
        { error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    // Optimistic lock: lock the new slot with ifRevisionId to prevent double-booking
    try {
      await getWriteClient()
        .patch(newSlotLock._id)
        .ifRevisionId(newSlotLock._rev)
        .set({ status: "booked", bookingRef: { _type: "reference", _ref: booking._id } })
        .commit();
    } catch {
      // ifRevisionId mismatch means another request locked it first — conflict
      return Response.json(
        { error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    // ── 6. STEP 2 — Release old slot and update booking ────────────────────────
    // Critical ordering: new slot locked BEFORE old slot released.
    // If this step partially fails, the degraded state is acceptable (admin can resolve).
    const oldSlotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;

    // Release old slot — if this fails, log but don't fail the reschedule
    try {
      await getWriteClient()
        .patch(oldSlotLockDocId)
        .set({ status: "available" })
        .unset(["bookingRef"])
        .commit();
    } catch (err) {
      // Log degraded state but do not fail — new slot is already locked
      console.error(
        "[api/booking-reschedule] Partial reschedule: new slot locked but old slot not released.",
        err,
      );
    }

    // Update booking document with new date/time
    await getWriteClient()
      .patch(booking._id)
      .set({ slotDate: newDate, slotTime: newTime, reminderSent: false })
      .commit();

    // ── 7. Update Google Calendar event ───────────────────────────────────────
    // Delete old event and create new event (fire-and-forget, don't block reschedule)
    void (async () => {
      try {
        // Delete old event
        if (booking.googleCalendarEventId) {
          await deleteCalendarEvent(booking.googleCalendarEventId);
        }

        // Create new event
        const newEventId = await createCalendarEvent({
          summary: `${booking.service?.name?.startsWith("Nőgyógyász") ? "Nőgyógyászati vizsgálat" : (booking.service?.name ?? "Foglalt szolgáltatás")} — ${booking.patientName}`,
          description: `Foglalási szám: ${booking.reservationNumber}\nPáciens: ${booking.patientName}\nTelefon: ${booking.patientEmail}`,
          date: newDate,
          startTime: newTime,
          durationMinutes: booking.service?.appointmentDuration ?? 20,
        });

        // Update booking with new eventId
        if (newEventId) {
          await getWriteClient()
            .patch(booking._id)
            .set({ googleCalendarEventId: newEventId })
            .commit();
          console.log(`[booking-reschedule] Created new calendar event: ${newEventId}`);
        }
      } catch (err) {
        console.error("[booking-reschedule] Calendar update failed:", err);
        // Don't block reschedule if calendar update fails
      }
    })();

    // ── 8. Send reschedule email (fire-and-forget) ─────────────────────────────
    if (isEmailConfigured()) {
      void sendRescheduleEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        reservationNumber: booking.reservationNumber,
        serviceName: booking.service?.name?.startsWith("Nőgyógyász")
          ? "Nőgyógyászati vizsgálat"
          : (booking.service?.name ?? "Szolgáltatás"),
        oldDate: booking.slotDate,
        oldTime: booking.slotTime,
        newDate,
        newTime,
        managementToken: booking.managementToken,
      });
    }

    // ── 9. Return success ──────────────────────────────────────────────────────
    return Response.json(
      { success: true, message: "Az időpont sikeresen áthelyezve." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/booking-reschedule] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}

// ── Helper: send reschedule email fire-and-forget ─────────────────────────────
async function sendRescheduleEmailAsync({
  patientName,
  patientEmail,
  reservationNumber,
  serviceName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  managementToken,
}: {
  patientName: string;
  patientEmail: string;
  reservationNumber: string;
  serviceName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  managementToken: string;
}) {
  try {
    const formatHuDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
    const manageUrl = `${appUrl}/foglalas/${managementToken}`;

    const html = buildRescheduleEmail({
      patientName,
      serviceName,
      reservationNumber,
      oldDate: formatHuDate(oldDate),
      oldTime,
      newDate: formatHuDate(newDate),
      newTime,
      manageUrl,
      clinicPhone: "+36 70 639 5239",
      clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
    });

    await sendEmail({
      to: patientEmail,
      subject: "Időpont áthelyezve — Mórocz Medical",
      html,
    });
  } catch (err) {
    // Fire-and-forget: log but never throw — reschedule is already processed
    console.error("[api/booking-reschedule] Failed to send reschedule email:", err);
  }
}
