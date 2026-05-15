// Pure slot generation algorithm.
// No side effects — safe to use in any server/client context.

/** Minutes before the day's start time at which a day becomes unbookable. */
export const DAY_LOCK_MINUTES_BEFORE_START = 60;

export interface SlotGenerationInput {
  schedule: {
    defaultSlotDuration: number;
    bufferMinutes: number;
    days: Array<{
      dayOfWeek: number;
      isDayOff: boolean;
      startTime: string;
      endTime: string;
    }>;
  };
  /** ISO date strings like "2026-03-15" */
  blockedDates: string[];
  /** Time strings like "09:00" — already confirmed-booked for the target date */
  bookedSlots: string[];
  /** Time strings like "09:20" — held (soft-lock) but not yet confirmed */
  heldSlots: string[];
  /** Target date "2026-03-15" */
  date: string;
  serviceDurationMinutes: number;
  /** Maximum number of days ahead bookings are allowed */
  maxDaysAhead: number;
  /** Current time in ms since epoch; defaults to Date.now(). Override in tests. */
  nowMs?: number;
}

/**
 * Parse "HH:MM" time string to total minutes from midnight.
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Convert total minutes from midnight to "HH:MM" string.
 */
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * "Today" in Budapest as a YYYY-MM-DD string. Used everywhere "today" must
 * match the clinic's wall clock, not the host server's.
 */
export function todayInBudapest(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
  }).format(new Date());
}

/**
 * Compute the number of days between today (Budapest) and the target date.
 * Returns negative if date is in the past.
 */
function daysAheadFromToday(dateStr: string): number {
  const [ty, tm, td] = todayInBudapest().split("-").map(Number);
  const todayMidnight = Date.UTC(ty ?? 0, (tm ?? 1) - 1, td ?? 1);
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetMidnight = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
}

/**
 * Get the day-of-week number (0=Sunday..6=Saturday) for an ISO date string.
 * Uses UTC to avoid timezone shift.
 */
function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

/**
 * Format a moment in time as "YYYY-MM-DD HH:MM" in Europe/Budapest local time.
 * Used for lexical comparison against schedule strings which are Budapest-local.
 */
function formatBudapestLocal(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

/**
 * Returns true if `date` (with consulting `startTime`, Budapest local) is still
 * accepting new bookings — i.e. "now" in Budapest is earlier than
 * (date at startTime) - DAY_LOCK_MINUTES_BEFORE_START.
 */
export function isDayBookable(date: string, startTime: string, nowMs: number): boolean {
  const startMin = timeToMinutes(startTime);
  const thresholdMin = startMin - DAY_LOCK_MINUTES_BEFORE_START;
  // Edge case: start time within the lock window of midnight — block entirely.
  if (thresholdMin < 0) return false;
  const threshold = `${date} ${minutesToTime(thresholdMin)}`;
  return formatBudapestLocal(nowMs) < threshold;
}

/**
 * Generate available time slots for a given date.
 *
 * Returns "HH:MM" time strings for every 20-minute interval where:
 * - The date is not blocked
 * - The day is a working day
 * - The full service duration fits before end time
 * - None of the 20-minute sub-slots within the service window are booked or held
 */
export function generateAvailableSlots(input: SlotGenerationInput): string[] {
  const {
    schedule,
    blockedDates,
    bookedSlots,
    heldSlots,
    date,
    serviceDurationMinutes,
    maxDaysAhead,
    nowMs = Date.now(),
  } = input;

  // 1. Check date range
  const daysAhead = daysAheadFromToday(date);
  if (daysAhead < 0 || daysAhead > maxDaysAhead) return [];

  // 2. Check blocked dates
  if (blockedDates.includes(date)) return [];

  // 3. Find day config
  const dayOfWeek = getDayOfWeek(date);
  const dayConfig = schedule.days.find((d) => d.dayOfWeek === dayOfWeek);

  // 4. Validate day config
  if (!dayConfig || dayConfig.isDayOff || !dayConfig.startTime || !dayConfig.endTime) return [];

  // 4b. Day-lock: block new bookings within DAY_LOCK_MINUTES_BEFORE_START of the day's start.
  if (!isDayBookable(date, dayConfig.startTime, nowMs)) return [];

  const startMinutes = timeToMinutes(dayConfig.startTime);
  const endMinutes = timeToMinutes(dayConfig.endTime);

  const bufferMinutes = schedule.bufferMinutes ?? 0;

  // Build a set of occupied 20-minute sub-slots (including buffer) for fast lookup
  const occupiedTimes = new Set<string>([...bookedSlots, ...heldSlots]);

  const BASE_GRANULARITY = 20;

  // Expand occupied times to include buffer zones before and after each booking
  if (bufferMinutes > 0) {
    for (const slot of [...bookedSlots, ...heldSlots]) {
      const slotMin = timeToMinutes(slot);
      // Add buffer sub-slots before the booking
      for (let b = BASE_GRANULARITY; b <= bufferMinutes; b += BASE_GRANULARITY) {
        occupiedTimes.add(minutesToTime(slotMin - b));
      }
      // Add buffer sub-slots after the booking (serviceDuration + buffer)
      for (let b = 0; b < bufferMinutes; b += BASE_GRANULARITY) {
        occupiedTimes.add(minutesToTime(slotMin + serviceDurationMinutes + b));
      }
    }
  }

  const availableSlots: string[] = [];

  // 5 & 6. Step through in 20-minute increments
  for (
    let currentMinutes = startMinutes;
    currentMinutes + serviceDurationMinutes <= endMinutes;
    currentMinutes += BASE_GRANULARITY
  ) {
    // Check all 20-minute sub-slots within the service window
    let slotIsClear = true;
    for (
      let subSlot = currentMinutes;
      subSlot < currentMinutes + serviceDurationMinutes;
      subSlot += BASE_GRANULARITY
    ) {
      const subSlotTime = minutesToTime(subSlot);
      if (occupiedTimes.has(subSlotTime)) {
        slotIsClear = false;
        break;
      }
    }
    if (slotIsClear) {
      availableSlots.push(minutesToTime(currentMinutes));
    }
  }

  return availableSlots;
}

export interface ScheduleForAvailability {
  days: Array<{
    dayOfWeek: number;
    isDayOff: boolean;
    startTime: string;
    endTime: string;
  }>;
}

/**
 * Returns date strings (ISO "YYYY-MM-DD") in [startDate, endDate] range
 * that have at least one working hour (not blocked, not a day off, has startTime+endTime).
 *
 * Used by the booking calendar to highlight available days.
 */
export function getAvailableDatesInRange(
  schedule: ScheduleForAvailability,
  blockedDates: string[],
  startDate: string,
  endDate: string,
  nowMs: number = Date.now(),
): string[] {
  const blockedSet = new Set(blockedDates);
  const result: string[] = [];

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  const start = new Date(Date.UTC(startYear ?? 0, (startMonth ?? 1) - 1, startDay ?? 1));
  const end = new Date(Date.UTC(endYear ?? 0, (endMonth ?? 1) - 1, endDay ?? 1));

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const dow = current.getUTCDay();

    if (!blockedSet.has(dateStr)) {
      const dayConfig = schedule.days.find((d) => d.dayOfWeek === dow);
      if (
        dayConfig &&
        !dayConfig.isDayOff &&
        dayConfig.startTime &&
        dayConfig.endTime &&
        isDayBookable(dateStr, dayConfig.startTime, nowMs)
      ) {
        result.push(dateStr);
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}

export interface ResolvedSchedule {
  defaultSlotDuration: number;
  bufferMinutes: number;
  days: ScheduleForAvailability["days"];
}

export interface SeasonalScheduleSummary {
  startDate: string;        // "YYYY-MM-DD"
  endDate: string;          // "YYYY-MM-DD"
  defaultSlotDuration: number;
  bufferMinutes: number;
  days: ScheduleForAvailability["days"];
}

/**
 * Pick the schedule that applies for a target date.
 *
 * Returns the first seasonal whose [startDate, endDate] (inclusive) contains
 * `date`, preferring the one with the earliest startDate as a deterministic
 * tie-breaker if multiple overlap. Falls back to `defaultSchedule` when none match.
 *
 * Overlap is prevented at save time in Sanity; the earliest-startDate pick is a
 * safety net for race conditions or bypassed validation.
 */
export function resolveScheduleForDate(
  date: string,
  defaultSchedule: ResolvedSchedule,
  seasonalSchedules: SeasonalScheduleSummary[],
): ResolvedSchedule {
  const matches = seasonalSchedules.filter(
    (s) => s.startDate && s.endDate && s.startDate <= date && date <= s.endDate,
  );
  if (matches.length === 0) return defaultSchedule;

  if (matches.length > 1) {
    console.warn(
      `[resolveScheduleForDate] ${matches.length} seasonal schedules overlap for ${date}; using earliest startDate.`,
    );
  }

  const pick = matches.reduce((earliest, s) =>
    s.startDate < earliest.startDate ? s : earliest,
  );
  return {
    defaultSlotDuration: pick.defaultSlotDuration,
    bufferMinutes: pick.bufferMinutes,
    days: pick.days,
  };
}
