import { defineQuery } from "next-sanity";
import { generateAvailableSlots } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  bookingsForDateQuery,
  slotLocksForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

// Inline query for a single service by ID — not worth adding to queries.ts for a one-off
const serviceByIdQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  // ── 1. Validate query params ──────────────────────────────────────────────
  if (!date || !serviceId) {
    return Response.json(
      { error: "A 'date' és 'serviceId' paraméterek megadása kötelező." },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Érvénytelen dátumformátum. Várható formátum: YYYY-MM-DD." },
      { status: 400 },
    );
  }

  // ── 2. Fetch all data in parallel ─────────────────────────────────────────
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
    } | null>({
      query: weeklyScheduleQuery,
      tags: ["weeklySchedule"],
    }),
    sanityFetch<{
      dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null;
    } | null>({
      query: blockedDatesQuery,
      tags: ["blockedDate"],
    }),
    sanityFetch<
      Array<{
        _id: string;
        slotTime: string;
        service: { _id: string; appointmentDuration: number } | null;
      }>
    >({
      query: bookingsForDateQuery,
      params: { date },
      tags: ["booking"],
    }),
    sanityFetch<
      Array<{
        _id: string;
        _rev: string;
        slotId: string;
        status: string;
        heldUntil: string | null;
      }>
    >({
      query: slotLocksForDateQuery,
      params: { datePrefix: date },
      tags: ["slotLock"],
    }),
    sanityFetch<{ name: string; appointmentDuration: number } | null>({
      query: serviceByIdQuery,
      params: { serviceId },
      tags: ["service"],
    }),
  ]);

  // ── 3. Service not found ──────────────────────────────────────────────────
  if (!service) {
    return Response.json({ error: "A megadott szolgáltatás nem található." }, { status: 404 });
  }

  // ── 4. Extract booked/held times ─────────────────────────────────────────
  const bookedSlots = bookings.map((b) => b.slotTime);
  // slotLocksForDateQuery already filters: status=="booked" || (status=="held" && heldUntil > now())
  const heldSlots = slotLocks
    .filter((lock) => lock.status === "held")
    .map((lock) => {
      // slotId format: "2026-03-15T09:20:00" — extract HH:MM
      const parts = lock.slotId.split("T");
      return parts[1]?.slice(0, 5) ?? "";
    })
    .filter(Boolean);

  // ── 5. Build the schedule object for generateAvailableSlots ──────────────
  const scheduleForSlots = schedule ?? {
    defaultSlotDuration: 20,
    bufferMinutes: 0,
    days: [],
  };

  // ── 6. Generate available slots ───────────────────────────────────────────
  const blockedDates = (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean);
  const serviceDurationMinutes = service.appointmentDuration ?? 20;

  const slots = generateAvailableSlots({
    schedule: scheduleForSlots,
    blockedDates,
    bookedSlots,
    heldSlots,
    date,
    serviceDurationMinutes,
    maxDaysAhead: 30,
  });

  // ── 7. Return result ──────────────────────────────────────────────────────
  return Response.json({
    slots,
    date,
    serviceName: service.name,
    durationMinutes: serviceDurationMinutes,
  });
}
