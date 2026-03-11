import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { defineQuery } from "next-sanity";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { buildConfirmationEmail } from "@/lib/booking-email";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";
import { generateAvailableSlots } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  bookingsForDateQuery,
  slotLockByIdQuery,
  slotLocksForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

// Inline query for service name + duration by ID
const serviceForEmailQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

// ── Request body schema ────────────────────────────────────────────────────────
const BookingSchema = z.object({
  serviceId: z.string().min(1, "Kérjük, válasszon szolgáltatást."),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
  patientName: z.string().min(2, "A név megadása kötelező."),
  patientEmail: z.string().email("Érvénytelen e-mail cím."),
  patientPhone: z.string().min(7, "Kérjük, adja meg telefonszámát."),
  slotLockId: z.string().optional(),
});

type SlotLock = {
  _id: string;
  _rev: string;
  status: string;
  heldUntil: string | null;
};

export async function POST(request: Request): Promise<Response> {
  try {
    // ── 1. Auth check ──────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return Response.json({ error: "Kérjük, jelentkezzen be." }, { status: 401 });
    }

  // ── 2. Validate request body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
    return Response.json({ error: firstError }, { status: 400 });
  }

  const { serviceId, slotDate, slotTime, patientName, patientEmail, patientPhone, slotLockId: providedSlotLockId } = parsed.data;

  // ── 3. Get slotLock — it's the source of truth for availability ──────────────
  const slotId = `${slotDate}T${slotTime}:00`;
  const slotLockDocId = providedSlotLockId ?? `slotLock-${slotDate}-${slotTime.replace(":", "-")}`;

  // Try to fetch existing lock
  let slotLock = await getWriteClient().fetch<SlotLock | null>(slotLockByIdQuery, { slotLockId: slotLockDocId });

  // If no lock exists, create one with "available" status (for non-held slots)
  if (!slotLock) {
    await getWriteClient().createIfNotExists({
      _id: slotLockDocId,
      _type: "slotLock",
      slotId,
      status: "available",
    });

    slotLock = await getWriteClient().fetch<SlotLock | null>(slotLockByIdQuery, { slotLockId: slotLockDocId });

    if (!slotLock) {
      return Response.json(
        { error: "Hiba történt az időpont lefoglalásakor. Kérjük, próbálja újra." },
        { status: 500 },
      );
    }
  }

  // ── 4. Check slot lock status ──────────────────────────────────────────────
  // If already booked, it's taken
  if (slotLock.status === "booked") {
    const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
    return Response.json(
      {
        error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.",
        alternatives,
      },
      { status: 409 },
    );
  }

  // If held and expired, user lost the hold
  if (slotLock.status === "held" && slotLock.heldUntil) {
    if (new Date(slotLock.heldUntil) < new Date()) {
      const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
      return Response.json(
        {
          error: "Az időpontfoglalásra fordított idő lejárt. Kérjük, válasszon új időpontot.",
          alternatives,
        },
        { status: 410 },
      );
    }
    // Hold is still valid - we can book with it
  }

  // ── 5. Optimistic lock — patch with ifRevisionID ───────────────────────────
  try {
    await getWriteClient()
      .patch(slotLock._id)
      .ifRevisionId(slotLock._rev)
      .set({ status: "booked" })
      .commit();
  } catch {
    // Another booking won the race — return conflict with alternatives
    const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
    return Response.json(
      {
        error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.",
        alternatives,
      },
      { status: 409 },
    );
  }

  // ── 7. Create booking document ─────────────────────────────────────────────
  const reservationNumber = generateReservationNumber();
  const managementToken = crypto.randomUUID();
  const booking = await getWriteClient().create({
    _type: "booking",
    reservationNumber,
    managementToken,
    service: { _type: "reference", _ref: serviceId },
    slotDate,
    slotTime,
    patientName,
    patientEmail,
    patientPhone,
    userId: session.user.id,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  });

  // ── 8. Update slotLock with bookingRef ────────────────────────────────────
  await getWriteClient()
    .patch(slotLock._id)
    .set({ bookingRef: { _type: "reference", _ref: booking._id } })
    .commit();

  // ── 8.5 Update user's phoneNumber if not already set ──────────────────────
  // Phone update disabled
  // ── 9. Google Calendar event (fire-and-forget) ────────────────────────────
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
        date: slotDate,
        startTime: slotTime,
        durationMinutes: svc?.appointmentDuration ?? 30,
      });
      if (eventId) {
        await getWriteClient().patch(booking._id).set({ googleCalendarEventId: eventId }).commit();
        console.log(`[booking] Google Calendar event created: ${eventId}`);
      }
    } catch (err) {
      console.error("[booking] Google Calendar sync failed:", err);
    }
  })();

  // ── 10. Send confirmation email (fire-and-forget) ──────────────────────────
  if (isEmailConfigured()) {
    void sendConfirmationEmail({
      booking: { _id: booking._id, managementToken },
      reservationNumber,
      serviceId,
      slotDate,
      slotTime,
      patientName,
      patientEmail,
    });
  }

    // ── 11. Return success ─────────────────────────────────────────────────────
    return Response.json(
      { bookingId: booking._id, reservationNumber, message: "Időpont sikeresen lefoglalva." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/booking] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Ismeretlen hiba történt.";
    return Response.json(
      { error: `Hiba az időpontfoglalás során: ${message}` },
      { status: 500 },
    );
  }
}

// ── Helper: get alternative slots near the requested time ─────────────────────
async function getAlternativeSlots(
  slotDate: string,
  slotTime: string,
  serviceId: string,
): Promise<string[]> {
  try {
    const [schedule, blockedDatesDoc, bookings, slotLocks, service] = await Promise.all([
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{
          _key: string;
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      } | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
      sanityFetch<{
        dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null;
      } | null>({ query: blockedDatesQuery, tags: ["blockedDate"] }),
      sanityFetch<Array<{ _id: string; slotTime: string }>>({
        query: bookingsForDateQuery,
        params: { date: slotDate },
        tags: ["booking"],
      }),
      sanityFetch<Array<{ _id: string; slotId: string; status: string }>>({
        query: slotLocksForDateQuery,
        params: { datePrefix: slotDate },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceForEmailQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

    const bookedSlots = bookings.map((b) => b.slotTime);
    const heldSlots = slotLocks
      .filter((lock) => lock.status === "held")
      .map((lock) => {
        const parts = lock.slotId.split("T");
        return parts[1]?.slice(0, 5) ?? "";
      })
      .filter(Boolean);

    const available = generateAvailableSlots({
      schedule: schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] },
      blockedDates: (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean),
      bookedSlots,
      heldSlots,
      date: slotDate,
      serviceDurationMinutes: service?.appointmentDuration ?? 20,
      maxDaysAhead: 30,
    });

    // Sort by time distance from requested slot, pick up to 5
    const [reqH, reqM] = slotTime.split(":").map(Number);
    const reqMinutes = (reqH ?? 0) * 60 + (reqM ?? 0);

    const alternatives = available
      .filter((t) => t !== slotTime)
      .sort((a, b) => {
        const [aH, aM] = a.split(":").map(Number);
        const [bH, bM] = b.split(":").map(Number);
        const aMin = (aH ?? 0) * 60 + (aM ?? 0);
        const bMin = (bH ?? 0) * 60 + (bM ?? 0);
        return Math.abs(aMin - reqMinutes) - Math.abs(bMin - reqMinutes);
      })
      .slice(0, 5);

    console.log(`[booking] getAlternativeSlots(${slotDate}, ${slotTime}): found ${alternatives.length} alternatives`);
    return alternatives;
  } catch (err) {
    console.error("[booking] getAlternativeSlots error:", err);
    return [];
  }
}

// ── Helper: send confirmation email fire-and-forget ───────────────────────────
async function sendConfirmationEmail({
  booking,
  reservationNumber,
  serviceId,
  slotDate,
  slotTime,
  patientName,
  patientEmail,
}: {
  booking: { _id: string; managementToken: string };
  reservationNumber: string;
  serviceId: string;
  slotDate: string;
  slotTime: string;
  patientName: string;
  patientEmail: string;
}) {
  try {
    const service = await sanityFetch<{ name: string } | null>({
      query: serviceForEmailQuery,
      params: { serviceId },
      tags: ["service"],
    });

    const formattedDate = new Date(slotDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
    const manageUrl = `${appUrl}/foglalas/${booking.managementToken}`;

    const html = buildConfirmationEmail({
      patientName,
      serviceName: service?.name?.startsWith("Nőgyógyász")
        ? "Nőgyógyászati vizsgálat"
        : (service?.name ?? "Foglalt szolgáltatás"),
      reservationNumber,
      date: formattedDate,
      time: slotTime,
      manageUrl,
      clinicPhone: "+36 70 639 5239",
      clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
    });

    console.log("[api/booking] Email configured:", isEmailConfigured());
    console.log("[api/booking] Sending email to:", patientEmail);

    await sendEmail({
      to: patientEmail,
      subject: "Időpontfoglalás visszaigazolása — Mórocz Medical",
      html,
    });

    console.log("[api/booking] Email sent successfully!");
  } catch (err) {
    // Fire-and-forget: log but never throw — booking is already confirmed
    console.error("[api/booking] Failed to send confirmation email:", err);
  }
}

// ── Helper: generate a short, readable reservation number ────────────────────
function generateReservationNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `M-${code}`;
}
