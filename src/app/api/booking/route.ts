import { headers } from "next/headers";
import { defineQuery } from "next-sanity";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { buildConfirmationEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
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
});

type SlotLock = {
  _id: string;
  _rev: string;
  status: string;
  heldUntil: string | null;
};

export async function POST(request: Request): Promise<Response> {
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

  const { serviceId, slotDate, slotTime, patientName, patientEmail, patientPhone } = parsed.data;

  // ── 3. Verify slot availability ────────────────────────────────────────────
  const currentBookings = await getWriteClient().fetch<Array<{ _id: string; slotTime: string }>>(
    `*[_type == "booking" && slotDate == $date && status == "confirmed"]{_id, slotTime}`,
    { date: slotDate },
  );

  const isAlreadyBooked = currentBookings.some((b) => b.slotTime === slotTime);
  if (isAlreadyBooked) {
    const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
    return Response.json(
      {
        error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.",
        alternatives,
      },
      { status: 409 },
    );
  }

  // ── 4. Get or create slotLock document ────────────────────────────────────
  const slotId = `${slotDate}T${slotTime}:00`;
  const slotLockDocId = `slotLock-${slotDate}-${slotTime.replace(":", "-")}`;

  // Try to fetch existing lock
  let slotLock = await getWriteClient().fetch<SlotLock | null>(slotLockByIdQuery, { slotId });

  // If it exists and is already booked, go straight to conflict response
  if (slotLock && slotLock.status === "booked") {
    const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
    return Response.json(
      {
        error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.",
        alternatives,
      },
      { status: 409 },
    );
  }

  // Create if not exists
  await getWriteClient().createIfNotExists({
    _id: slotLockDocId,
    _type: "slotLock",
    slotId,
    status: "available",
  });

  // Re-fetch to get current _rev for optimistic locking
  slotLock = await getWriteClient().fetch<SlotLock | null>(slotLockByIdQuery, { slotId });

  if (!slotLock) {
    return Response.json(
      { error: "Hiba történt az időpont lefoglalásakor. Kérjük, próbálja újra." },
      { status: 500 },
    );
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

  // ── 9. Send confirmation email (fire-and-forget) ───────────────────────────
  if (isEmailConfigured()) {
    void sendConfirmationEmail({
      booking: { _id: booking._id, managementToken },
      serviceId,
      slotDate,
      slotTime,
      patientName,
      patientEmail,
    });
  }

  // ── 10. Return success ─────────────────────────────────────────────────────
  return Response.json(
    { bookingId: booking._id, reservationNumber, message: "Időpont sikeresen lefoglalva." },
    { status: 201 },
  );
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

    return available
      .filter((t) => t !== slotTime)
      .sort((a, b) => {
        const [aH, aM] = a.split(":").map(Number);
        const [bH, bM] = b.split(":").map(Number);
        const aMin = (aH ?? 0) * 60 + (aM ?? 0);
        const bMin = (bH ?? 0) * 60 + (bM ?? 0);
        return Math.abs(aMin - reqMinutes) - Math.abs(bMin - reqMinutes);
      })
      .slice(0, 5);
  } catch {
    return [];
  }
}

// ── Helper: send confirmation email fire-and-forget ───────────────────────────
async function sendConfirmationEmail({
  booking,
  serviceId,
  slotDate,
  slotTime,
  patientName,
  patientEmail,
}: {
  booking: { _id: string; managementToken: string };
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
      serviceName: service?.name?.startsWith("Nőgyógyász") ? "Nőgyógyászati vizsgálat" : (service?.name ?? "Foglalt szolgáltatás"),
      date: formattedDate,
      time: slotTime,
      manageUrl,
      clinicPhone: "+36 1 000 0000",
      clinicAddress: "1000 Budapest, Klinika utca 1.",
    });

    await sendEmail({
      to: patientEmail,
      subject: "Időpontfoglalás visszaigazolása — Mórocz Medical",
      html,
    });
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
