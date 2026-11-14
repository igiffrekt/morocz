import type { ClinicSchedule } from "@/lib/clinic-status";
import { addDaysIso } from "@/lib/quick-booking";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  customAvailabilityForRangeQuery,
  seasonalSchedulesForRangeQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
import type { BlockedDatesQueryResult, WeeklyScheduleQueryResult } from "../../../sanity.types";

type WeeklyDay = NonNullable<NonNullable<WeeklyScheduleQueryResult>["days"]>[number];
type DayDoc = Partial<Omit<WeeklyDay, "_key">>;

interface SeasonalDoc {
  startDate: string | null;
  endDate: string | null;
  defaultSlotDuration: number | null;
  bufferMinutes: number | null;
  days: DayDoc[] | null;
}

interface CustomAvailabilityDoc {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  services: Array<{ _id: string } | null> | null;
}

/** Sanity returns nullable fields; the schedule resolver expects plain values. */
function normalizeDay(d: DayDoc) {
  return {
    dayOfWeek: d.dayOfWeek ?? -1,
    isDayOff: d.isDayOff ?? false,
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
    breakStart: d.breakStart ?? null,
    breakEnd: d.breakEnd ?? null,
  };
}

/**
 * The schedule documents (weeklySchedule → seasonalSchedule → customAvailability →
 * blockedDate) for [today, today + days], normalised for `clinicStatus`.
 */
export async function fetchClinicSchedule(today: string, days = 60): Promise<ClinicSchedule> {
  const end = addDaysIso(today, days);
  const [weekly, seasonalDocs, customDocs, blocked] = await Promise.all([
    sanityFetch<WeeklyScheduleQueryResult | null>({
      query: weeklyScheduleQuery,
      tags: ["weeklySchedule"],
    }),
    sanityFetch<SeasonalDoc[] | null>({
      query: seasonalSchedulesForRangeQuery,
      params: { startDate: today, endDate: end },
      tags: ["seasonalSchedule"],
    }),
    sanityFetch<CustomAvailabilityDoc[] | null>({
      query: customAvailabilityForRangeQuery,
      params: { startDate: today, endDate: end },
      tags: ["customAvailability"],
    }),
    sanityFetch<BlockedDatesQueryResult | null>({
      query: blockedDatesQuery,
      tags: ["blockedDate"],
    }),
  ]);

  return {
    weeklyDays: (weekly?.days ?? []).map(normalizeDay),
    seasonals: (seasonalDocs ?? [])
      .filter((s): s is SeasonalDoc & { startDate: string; endDate: string } =>
        Boolean(s.startDate && s.endDate),
      )
      .map((s) => ({
        startDate: s.startDate,
        endDate: s.endDate,
        defaultSlotDuration: s.defaultSlotDuration ?? 20,
        bufferMinutes: s.bufferMinutes ?? 0,
        days: (s.days ?? []).map(normalizeDay),
      })),
    blockedDates: (blocked?.dates ?? []).map((d) => d.date ?? "").filter(Boolean),
    customAvailability: (customDocs ?? [])
      .filter((c): c is CustomAvailabilityDoc & { date: string } => Boolean(c.date))
      .map((c) => ({
        date: c.date,
        startTime: c.startTime,
        endTime: c.endTime,
        serviceIds:
          c.services?.map((s) => s?._id).filter((id): id is string => Boolean(id)) ?? null,
      })),
  };
}
