import {
  isDayBookable,
  type ResolvedSchedule,
  resolveScheduleForDate,
  type ScheduleForAvailability,
  type SeasonalScheduleSummary,
} from "@/lib/slots";

/**
 * Schedule inputs for the homepage quick booking — the same Sanity documents
 * /api/slots/availability reads (weeklySchedule, seasonalSchedule,
 * customAvailability, blockedDate), already normalised to plain values.
 */
export interface QuickBookingSchedule {
  weeklyDays: ScheduleForAvailability["days"];
  bookingWindowDays: number;
  seasonals: SeasonalScheduleSummary[];
  blockedDates: string[];
  customAvailability: Array<{
    date: string;
    startTime: string | null;
    endTime: string | null;
    /** null / empty = applies to every service. */
    serviceIds: string[] | null;
  }>;
}

export interface ScheduledDay {
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** ISO date + n days (UTC arithmetic, no DST drift). */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days));
  return t.toISOString().slice(0, 10);
}

function dayOfWeekIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

/** "YYYY-MM" of every month touched by [today, today + windowDays]. */
export function monthsInWindow(today: string, windowDays: number): string[] {
  const months: string[] = [];
  for (let i = 0; i <= windowDays; i++) {
    const month = addDaysIso(today, i).slice(0, 7);
    if (!months.includes(month)) months.push(month);
  }
  return months;
}

/**
 * Days in the booking window on which `serviceId` has consulting hours, resolved
 * exactly like /api/slots/availability: weekly → seasonal override →
 * customAvailability (for this service; also unblocks the date) → blockedDate,
 * with today locked DAY_LOCK_MINUTES_BEFORE_START before the start time.
 * Whether any slot is still free is decided separately from the API counts.
 */
export function scheduledDays(
  source: QuickBookingSchedule,
  serviceId: string,
  today: string,
  nowMs: number,
): ScheduledDay[] {
  const weekly: ResolvedSchedule = {
    defaultSlotDuration: 0,
    bufferMinutes: 0,
    days: source.weeklyDays,
  };
  const blocked = new Set(source.blockedDates);
  const result: ScheduledDay[] = [];

  for (let i = 0; i <= source.bookingWindowDays; i++) {
    const date = addDaysIso(today, i);
    const dayOfWeek = dayOfWeekIso(date);

    // Same precedence as the API's Map: the last matching document wins.
    const custom = source.customAvailability
      .filter(
        (c) =>
          c.date === date &&
          (!c.serviceIds || c.serviceIds.length === 0 || c.serviceIds.includes(serviceId)),
      )
      .at(-1);

    let startTime: string | null = null;
    let endTime: string | null = null;
    if (custom?.startTime && custom.endTime) {
      startTime = custom.startTime;
      endTime = custom.endTime;
    } else if (!blocked.has(date)) {
      const resolved = resolveScheduleForDate(date, weekly, source.seasonals);
      const day = resolved.days.find((d) => d.dayOfWeek === dayOfWeek);
      if (day && !day.isDayOff && day.startTime && day.endTime) {
        startTime = day.startTime;
        endTime = day.endTime;
      }
    }

    if (!startTime || !endTime) continue;
    if (!isDayBookable(date, startTime, nowMs)) continue;
    result.push({ date, dayOfWeek, startTime, endTime });
  }

  return result;
}

export type AvailabilityMap = Record<string, { available: number; total: number }>;

/** Scheduled days that still have at least one free slot according to the API. */
export function bookableDays(
  days: readonly ScheduledDay[],
  availability: AvailabilityMap,
): ScheduledDay[] {
  return days.filter((d) => (availability[d.date]?.available ?? 0) > 0);
}

const HU_MONTHS = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
] as const;

const HU_MONTHS_SHORT = [
  "jan.",
  "febr.",
  "márc.",
  "ápr.",
  "máj.",
  "jún.",
  "júl.",
  "aug.",
  "szept.",
  "okt.",
  "nov.",
  "dec.",
] as const;

/** "november 24." / "nov. 24." */
export function formatHuDate(iso: string, short = false): string {
  const [, m, d] = iso.split("-").map(Number);
  const months = short ? HU_MONTHS_SHORT : HU_MONTHS;
  return `${months[(m ?? 1) - 1]} ${d}.`;
}
