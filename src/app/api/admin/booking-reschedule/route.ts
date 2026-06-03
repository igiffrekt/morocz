import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAvailableSlotsForDate } from "@/lib/availability";
import { buildRescheduleEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

const AdminRescheduleSchema = z.object({
  bookingId: z.string().min(1, "A foglalás azonosítója megadása kötelező."),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  newTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
  notifyPatient: z.boolean().optional().default(true),
});

type BookingForReschedule = {
  _id: string;
  patientName: string;
  patientEmail: string;
  reservationNumber: string;
  service: { name: string; appointmentDuration: number } | null;
  serviceId: string | null;
  slotDate: string;
  slotTime: string;
  status: string;
  managementToken: string;
  googleCalendarEventId?: string | null;
};

// POST /api/admin/booking-reschedule
// Admin-only. Moves a confirmed booking to another free slot (date + time only).
// No 24h restriction (admin bypass). No payment change. Patient optionally emailed.
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
    const parsed = AdminRescheduleSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }
    const { bookingId, newDate, newTime, notifyPatient } = parsed.data;

    // ── 3. Fetch booking by _id ────────────────────────────────────────────────
    const booking = await getWriteClient().fetch<BookingForReschedule | null>(
      `*[_type == "booking" && _id == $bookingId][0]{
        _id, patientName, patientEmail, reservationNumber,
        service->{name, appointmentDuration}, "serviceId": service._ref,
        slotDate, slotTime, status, managementToken, googleCalendarEventId
      }`,
      { bookingId },
    );

    if (!booking) {
      return Response.json({ error: "A foglalás nem található." }, { status: 404 });
    }
    if (booking.status !== "confirmed") {
      return Response.json({ error: "Ez az időpont már nem aktív." }, { status: 400 });
    }

    // ── 4. Reject no-op ────────────────────────────────────────────────────────
    if (newDate === booking.slotDate && newTime === booking.slotTime) {
      return Response.json(
        { error: "Ez a jelenlegi időpont. Kérjük, válasszon másik időpontot." },
        { status: 400 },
      );
    }

    // ── 5. Server-side authority: the new slot must be genuinely free ──────────
    if (!booking.serviceId) {
      return Response.json(
        { error: "A foglaláshoz nincs szolgáltatás rendelve." },
        { status: 400 },
      );
    }
    const availability = await getAvailableSlotsForDate(newDate, booking.serviceId);
    if (!availability || !availability.slots.includes(newTime)) {
      return Response.json(
        { error: "Ez az időpont nem foglalható. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    // ── 6. Atomic swap — lock the new slot FIRST (critical section) ────────────
    const newSlotId = `${newDate}T${newTime}:00`;
    const newSlotLockDocId = `slotLock-${newDate}-${newTime.replace(":", "-")}`;

    await getWriteClient().createIfNotExists({
      _id: newSlotLockDocId,
      _type: "slotLock",
      slotId: newSlotId,
      status: "available",
    });

    type SlotLock = { _id: string; _rev: string; status: string };
    const newSlotLock = await getWriteClient().fetch<SlotLock | null>(
      `*[_type == "slotLock" && slotId == $slotId][0]{_id, _rev, status}`,
      { slotId: newSlotId },
    );
    if (!newSlotLock) {
      return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
    }
    if (newSlotLock.status === "booked") {
      return Response.json(
        { error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    try {
      await getWriteClient()
        .patch(newSlotLock._id)
        .ifRevisionId(newSlotLock._rev)
        .set({ status: "booked", bookingRef: { _type: "reference", _ref: booking._id } })
        .commit();
    } catch {
      return Response.json(
        { error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    // ── 7. Release the old slot lock (non-fatal if missing) ────────────────────
    const oldSlotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
    try {
      await getWriteClient()
        .patch(oldSlotLockDocId)
        .set({ status: "available" })
        .unset(["bookingRef"])
        .commit();
    } catch (err) {
      console.error(
        "[api/admin/booking-reschedule] Partial reschedule: new slot locked but old slot not released.",
        err,
      );
    }

    // ── 8. Patch the booking with the new date/time ────────────────────────────
    const oldDate = booking.slotDate;
    const oldTime = booking.slotTime;
    await getWriteClient()
      .patch(booking._id)
      .set({ slotDate: newDate, slotTime: newTime, reminderSent: false })
      .commit();

    // ── 9. Update Google Calendar (fire-and-forget) ────────────────────────────
    void (async () => {
      try {
        if (booking.googleCalendarEventId) {
          await deleteCalendarEvent(booking.googleCalendarEventId);
        }
        const newEventId = await createCalendarEvent({
          summary: `${
            booking.service?.name?.startsWith("Nőgyógyász")
              ? "Nőgyógyászati vizsgálat"
              : (booking.service?.name ?? "Foglalt szolgáltatás")
          } — ${booking.patientName}`,
          description: `Foglalási szám: ${booking.reservationNumber}\nPáciens: ${booking.patientName}\nTelefon: ${booking.patientEmail}`,
          date: newDate,
          startTime: newTime,
          durationMinutes: booking.service?.appointmentDuration ?? 20,
        });
        if (newEventId) {
          await getWriteClient()
            .patch(booking._id)
            .set({ googleCalendarEventId: newEventId })
            .commit();
        }
      } catch (err) {
        console.error("[api/admin/booking-reschedule] Calendar update failed:", err);
      }
    })();

    // ── 10. Notify the patient (fire-and-forget) ───────────────────────────────
    if (notifyPatient && isEmailConfigured()) {
      void sendRescheduleEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        reservationNumber: booking.reservationNumber,
        serviceName: booking.service?.name?.startsWith("Nőgyógyász")
          ? "Nőgyógyászati vizsgálat"
          : (booking.service?.name ?? "Szolgáltatás"),
        oldDate,
        oldTime,
        newDate,
        newTime,
        managementToken: booking.managementToken,
      });
    }

    return Response.json(
      { success: true, message: "Az időpont sikeresen áthelyezve." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/admin/booking-reschedule] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}

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
      subject: "Időpont áthelyezve a rendelő által — Mórocz Medical",
      html,
    });
  } catch (err) {
    console.error("[api/admin/booking-reschedule] Failed to send reschedule email:", err);
  }
}
