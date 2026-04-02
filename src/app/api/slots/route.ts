import { defineQuery } from "next-sanity";
import { generateAvailableSlots } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  bookingsForDateQuery,
  customAvailabilityForDateQuery,
  slotLocksForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

// Inline query for a single service by ID
const serviceByIdQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  // 1. Validate query params
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

  try {
    // Calculate start and end of the requested day for queries
    const startDate = `${date}T00:00:00Z`;
    const endDate = `${date}T23:59:59Z`;

    // 2. Fetch all data in parallel
    const [schedule, blockedDatesDoc, customAvail, bookings, slotLocks, service] = await Promise.all([
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
      sanityFetch<{
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        services: Array<{ _id: string }> | null;
      } | null>({
        query: customAvailabilityForDateQuery,
        params: { date },
        tags: ["customAvailability"],
      }),
      sanityFetch<
        Array<{
          _id: string;
          dateTime: string;
          serviceId: string;
        }>
      >({
        query: bookingsForDateQuery,
        params: { startDate, endDate },
        tags: ["booking"],
      }),
      sanityFetch<
        Array<{
          _id: string;
          dateTime: string;
          status: string;
        }>
      >({
        query: slotLocksForDateQuery,
        params: { startDate, endDate },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceByIdQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

    // 3. Service not found
    if (!service) {
      return Response.json({ error: "A megadott szolgáltatás nem található." }, { status: 404 });
    }

    // 4. Extract booked times from bookings (dateTime contains full timestamp)
    const bookedSlots = bookings
      .filter((b) => b.serviceId === serviceId)
      .map((b) => {
        // Extract HH:MM from dateTime (format: 2026-03-15T09:20:00Z or similar)
        const timePart = b.dateTime.split("T")[1];
        return timePart?.slice(0, 5) ?? "";
      })
      .filter(Boolean);

    // 5. Extract held times from slotLocks
    const heldSlots = slotLocks
      .filter((lock) => lock.status === "held")
      .map((lock) => {
        const timePart = lock.dateTime.split("T")[1];
        return timePart?.slice(0, 5) ?? "";
      })
      .filter(Boolean);

    // 6. Check if custom availability exists for this date and service
    let scheduleForSlots = schedule ?? {
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [],
    };

    // If custom availability exists and applies to this service (or all services)
    if (customAvail) {
      const appliesToService =
        !customAvail.services || customAvail.services.length === 0 || customAvail.services.some((s) => s._id === serviceId);

      if (appliesToService) {
        // Override schedule for this specific date with custom availability
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

        scheduleForSlots = {
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
        if (!scheduleForSlots.days.find((d) => d.dayOfWeek === dayOfWeek)) {
          scheduleForSlots.days.push({
            _key: `custom-${dayOfWeek}`,
            dayOfWeek,
            isDayOff: false,
            startTime: customAvail.startTime,
            endTime: customAvail.endTime,
          });
        }
      }
    }

    // 7. Generate available slots
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

    // 8. Return result
    return Response.json({
      slots,
      date,
      serviceName: service.name,
      durationMinutes: serviceDurationMinutes,
    });
  } catch (error) {
    console.error("[/api/slots] Error:", error);
    return Response.json(
      { error: "Hiba történt az időpontok lekérdezésekor." },
      { status: 500 },
    );
  }
}
