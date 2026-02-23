// Pure slot generation algorithm.
// No side effects, no imports — safe to use in any server/client context.

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
 * Compute the number of days between today (UTC midnight) and the target date.
 * Returns negative if date is in the past.
 */
function daysAheadFromToday(dateStr: string): number {
  const today = new Date();
  const todayMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
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
      if (dayConfig && !dayConfig.isDayOff && dayConfig.startTime && dayConfig.endTime) {
        result.push(dateStr);
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}
