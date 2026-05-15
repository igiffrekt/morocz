import { defineQuery } from "next-sanity";
import { resolveScheduleForDate, type SeasonalScheduleSummary, todayInBudapest } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import { weeklyScheduleQuery, blockedDatesQuery, seasonalSchedulesForRangeQuery } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

// Query all custom availability in a given month
const customAvailabilityForMonthQuery = defineQuery(
  `*[_type == "customAvailability" && date >= $startDate && date <= $endDate]{
    _id, date, startTime, endTime, services[]->{_id}
  }`
);

/**
 * GET /api/slots/calendar?month=2026-04&serviceId=xyz
 * Returns { dates: string[] } - array of ISO date strings that have availability
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // e.g. "2026-04"
  const serviceId = searchParams.get("serviceId");

  if (!month || !serviceId) {
    return Response.json({ error: "month and serviceId required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return Response.json({ error: "Invalid month format (expected YYYY-MM)" }, { status: 400 });
  }

  try {
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr!, 10);
    const monthNum = parseInt(monthStr!, 10) - 1; // 0-indexed

    const firstDay = new Date(Date.UTC(year, monthNum, 1));
    const lastDay = new Date(Date.UTC(year, monthNum + 1, 0));

    const startDate = firstDay.toISOString().slice(0, 10);
    const endDate = lastDay.toISOString().slice(0, 10);

    // Fetch schedule, blocked dates, and custom availability in parallel
    const [schedule, seasonals, blockedDatesDoc, customAvails] = await Promise.all([
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        bookingWindowDays: number | null;
        days: Array<{
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      } | null>({
        query: weeklyScheduleQuery,
        tags: ["weeklySchedule"],
      }),
      sanityFetch<SeasonalScheduleSummary[]>({
        query: seasonalSchedulesForRangeQuery,
        params: { startDate, endDate },
        tags: ["seasonalSchedule"],
      }),
      sanityFetch<{
        dates: Array<{ date: string }> | null;
      } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
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
    ]);

    const blockedDates = new Set(
      (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean)
    );

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

    const bookingWindowDays = schedule?.bookingWindowDays ?? 30;
    // Budapest-local "today" + window = last bookable date (inclusive).
    // Same definition of "today" as generateAvailableSlots in src/lib/slots.ts.
    const horizon = new Date(todayInBudapest());
    horizon.setUTCDate(horizon.getUTCDate() + bookingWindowDays);
    const horizonStr = horizon.toISOString().slice(0, 10);

    const availableDates: string[] = [];
    const current = new Date(firstDay);

    // Iterate through each day in the month
    while (current <= lastDay) {
      const dateStr = current.toISOString().slice(0, 10);

      // Cap at booking window — dates beyond this are not bookable.
      if (dateStr > horizonStr) {
        current.setUTCDate(current.getUTCDate() + 1);
        continue;
      }

      const dow = current.getUTCDay();

      // Check for custom availability first (overrides blocked dates)
      if (customByDate.has(dateStr)) {
        const custom = customByDate.get(dateStr)!;
        if (custom.startTime && custom.endTime) {
          availableDates.push(dateStr);
          current.setUTCDate(current.getUTCDate() + 1);
          continue;
        }
      }

      // Check if date is blocked
      if (blockedDates.has(dateStr)) {
        current.setUTCDate(current.getUTCDate() + 1);
        continue;
      }

      // Otherwise check seasonal-or-default schedule
      const defaultForDate = schedule ?? {
        defaultSlotDuration: 20,
        bufferMinutes: 0,
        days: [],
      };
      const resolved = resolveScheduleForDate(dateStr, defaultForDate, seasonals);
      const dayConfig = resolved.days.find((d) => d.dayOfWeek === dow);
      if (dayConfig && !dayConfig.isDayOff && dayConfig.startTime && dayConfig.endTime) {
        availableDates.push(dateStr);
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return Response.json({ dates: availableDates });
  } catch (error) {
    console.error("[/api/slots/calendar] Error:", error);
    return Response.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
