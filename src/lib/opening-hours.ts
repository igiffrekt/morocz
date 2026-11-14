import {
  type ResolvedSchedule,
  resolveScheduleForDate,
  type SeasonalScheduleSummary,
} from "@/lib/slots";

export const HU_DAY_NAMES = [
  "Vasárnap",
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
] as const;

export interface OpeningDay {
  dayOfWeek: number;
  name: string;
  /** "12:00 – 15:20" (24-hour, en dash). */
  hours: string;
}

export interface OpeningHours {
  /** Open days only, Monday first. */
  days: OpeningDay[];
}

/** Monday-first order (1..6, then Sunday). */
function weekOrder(dayOfWeek: number): number {
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

/**
 * Opening hours that apply on `date` (YYYY-MM-DD, Budapest): the seasonal schedule
 * covering that date overrides the weekly one — same rule as the slot generator
 * (`resolveScheduleForDate`).
 */
export function computeOpeningHours(
  date: string,
  weekly: Pick<ResolvedSchedule, "days"> | null | undefined,
  seasonals: readonly SeasonalScheduleSummary[] | null | undefined,
): OpeningHours {
  const fallback: ResolvedSchedule = {
    defaultSlotDuration: 0,
    bufferMinutes: 0,
    days: weekly?.days ?? [],
  };
  const resolved = resolveScheduleForDate(date, fallback, [...(seasonals ?? [])]);

  const days = (resolved.days ?? [])
    .filter((d) => !d.isDayOff && d.startTime && d.endTime)
    .sort((a, b) => weekOrder(a.dayOfWeek) - weekOrder(b.dayOfWeek))
    .map((d) => ({
      dayOfWeek: d.dayOfWeek,
      name: HU_DAY_NAMES[d.dayOfWeek] ?? "",
      hours: `${d.startTime} – ${d.endTime}`,
    }));

  return { days };
}
