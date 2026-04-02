import { defineQuery } from "next-sanity";
import { generateAvailableSlots } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import { blockedDatesQuery, weeklyScheduleQuery } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

const bookingsForRangeQuery = defineQuery(
  `*[_type == "booking" && slotDate >= $startDate && slotDate <= $endDate && status == "confirmed"]{
  slotDate,
  slotTime
}`,
);

const slotLocksForRangeQuery = defineQuery(
  `*[_type == "slotLock" && slotId >= $startPrefix && slotId <= $endPrefix && (status == "booked" || (status == "held" && heldUntil > now()))]{
  slotId,
  status
}`,
);

const customAvailabilityForMonthQuery = defineQuery(
  `*[_type == "customAvailability" && date >= $startDate && date <= $endDate]{
    _id, date, startTime, endTime, services[]->{_id}
  }`
);

const serviceByIdQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{appointmentDuration}`,
);

/**
 * GET /api/slots/availability?month=2026-03&serviceId=xxx
 *
 * Returns per-day availability for the entire month in a single batch.
 * Response: { availability: { [date]: { available: number, total: number } } }
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const serviceId = searchParams.get("serviceId");

  if (!month || !serviceId || !/^\d{4}-\d{2}$/.test(month)) {
    return Response.json({ error: "Érvénytelen paraméterek." }, { status: 400 });
  }

  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const startDate = `${month}-01`;
  const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;

  const [schedule, blockedDatesDoc, bookings, slotLocks, customAvails, service] = await Promise.all([
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
    sanityFetch<Array<{ slotDate: string; slotTime: string }>>({
      query: bookingsForRangeQuery,
      params: { startDate, endDate },
      tags: ["booking"],
    }),
    sanityFetch<Array<{ slotId: string; status: string }>>({
      query: slotLocksForRangeQuery,
      params: {
        startPrefix: `${startDate}T00:00:00`,
        endPrefix: `${endDate}T23:59:59`,
      },
      tags: ["slotLock"],
    }),
    sanityFetch<
      Array<{
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        services: Array<{ _id: string }> | null;
      }>
    >({
      query: customAvailabilityForMonthQuery,
      params: { startDate, endDate },
      tags: ["customAvailability"],
    }),
    sanityFetch<{ appointmentDuration: number } | null>({
      query: serviceByIdQuery,
      params: { serviceId },
      tags: ["service"],
    }),
  ]);

  if (!service) {
    return Response.json({ error: "Szolgáltatás nem található." }, { status: 404 });
  }

  const scheduleForSlots = schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] };
  const blockedDates = (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean);
  const serviceDuration = service.appointmentDuration ?? 20;

  // Build map of custom availability by date
  const customByDate = new Map<string, typeof customAvails[0]>();
  for (const custom of customAvails) {
    // Check if this custom availability applies to the service
    const appliesToService =
      !custom.services ||
      custom.services.length === 0 ||
      custom.services.some((s) => s._id === serviceId);

    if (appliesToService) {
      customByDate.set(custom.date, custom);
    }
  }

  // Group bookings and locks by date
  const bookingsByDate = new Map<string, string[]>();
  for (const b of bookings) {
    const existing = bookingsByDate.get(b.slotDate) ?? [];
    existing.push(b.slotTime);
    bookingsByDate.set(b.slotDate, existing);
  }

  const heldByDate = new Map<string, string[]>();
  for (const lock of slotLocks) {
    if (lock.status === "held") {
      const dateStr = lock.slotId.split("T")[0] ?? "";
      const timeStr = lock.slotId.split("T")[1]?.slice(0, 5) ?? "";
      if (dateStr && timeStr) {
        const existing = heldByDate.get(dateStr) ?? [];
        existing.push(timeStr);
        heldByDate.set(dateStr, existing);
      }
    }
  }

  // Compute availability for each day
  const availability: Record<string, { available: number; total: number }> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;

    // Get the schedule for this date (either weekly or custom)
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = dateObj.getUTCDay();

    let scheduleToUse = { ...scheduleForSlots };

    // If custom availability exists for this date, override the schedule
    const customAvail = customByDate.get(dateStr);
    if (customAvail && customAvail.startTime && customAvail.endTime) {
      scheduleToUse = {
        ...scheduleForSlots,
        days: scheduleForSlots.days.map((day) => {
          if (day.dayOfWeek === dayOfWeek) {
            return {
              ...day,
              isDayOff: false,
              startTime: customAvail.startTime,
              endTime: customAvail.endTime,
            };
          }
          return day;
        }),
      };

      // If the day doesn't exist in schedule, add it
      if (!scheduleToUse.days.find((d) => d.dayOfWeek === dayOfWeek)) {
        scheduleToUse.days.push({
          _key: `custom-${dayOfWeek}`,
          dayOfWeek,
          isDayOff: false,
          startTime: customAvail.startTime,
          endTime: customAvail.endTime,
        });
      }
    }

    // Total = slots with no bookings
    const total = generateAvailableSlots({
      schedule: scheduleToUse,
      blockedDates,
      bookedSlots: [],
      heldSlots: [],
      date: dateStr,
      serviceDurationMinutes: serviceDuration,
      maxDaysAhead: 30,
    });

    if (total.length === 0) continue;

    // Available = slots after removing booked and held
    const available = generateAvailableSlots({
      schedule: scheduleToUse,
      blockedDates,
      bookedSlots: bookingsByDate.get(dateStr) ?? [],
      heldSlots: heldByDate.get(dateStr) ?? [],
      date: dateStr,
      serviceDurationMinutes: serviceDuration,
      maxDaysAhead: 30,
    });

    availability[dateStr] = { available: available.length, total: total.length };
  }

  return Response.json({ availability });
}
