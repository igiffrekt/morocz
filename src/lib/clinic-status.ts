import { HU_DAY_NAMES } from "@/lib/opening-hours";
import { addDaysIso, formatHuDate, type QuickBookingSchedule } from "@/lib/quick-booking";
import { resolveScheduleForDate } from "@/lib/slots";

/** The schedule documents that decide whether the clinic consults on a date. */
export type ClinicSchedule = Pick<
  QuickBookingSchedule,
  "weeklyDays" | "seasonals" | "blockedDates" | "customAvailability"
>;

export interface BudapestClock {
  /** YYYY-MM-DD in Europe/Budapest. */
  date: string;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  /** Minutes since local midnight. */
  minutes: number;
}

function dayOfWeekIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Wall-clock date / weekday / minutes in Budapest for a moment in time. */
export function budapestClock(nowMs: number): BudapestClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(nowMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return {
    date,
    dayOfWeek: dayOfWeekIso(date),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export interface ConsultingHours {
  start: string;
  end: string;
}

/**
 * Consulting hours on `date`, resolved like the booking API: a customAvailability
 * day wins (and unblocks the date), then blockedDate closes it, otherwise the
 * seasonal schedule covering the date overrides the weekly one.
 */
export function hoursOnDate(schedule: ClinicSchedule, date: string): ConsultingHours | null {
  const custom = schedule.customAvailability
    .filter((c) => c.date === date && c.startTime && c.endTime)
    .at(-1);
  if (custom?.startTime && custom.endTime) return { start: custom.startTime, end: custom.endTime };
  if (schedule.blockedDates.includes(date)) return null;

  const resolved = resolveScheduleForDate(
    date,
    { defaultSlotDuration: 0, bufferMinutes: 0, days: schedule.weeklyDays },
    schedule.seasonals,
  );
  const day = resolved.days.find((d) => d.dayOfWeek === dayOfWeekIso(date));
  if (!day || day.isDayOff || !day.startTime || !day.endTime) return null;
  return { start: day.startTime, end: day.endTime };
}

export type ClinicState = "open" | "later" | "closed";

export interface ClinicStatus {
  state: ClinicState;
  /** "Most rendelünk" / "Ma rendelünk" / "Ma nincs rendelés" / "Ma már nem rendelünk". */
  title: string;
  /** "Mai rendelési idő" / "Következő rendelési nap" ("" if none found). */
  nextLabel: string;
  /** "13:20 – 16:40" or "Kedd, november 17. · 13:20 – 16:40". */
  nextValue: string;
}

const range = (h: ConsultingHours) => `${h.start} – ${h.end}`;

/** Live "are they consulting now?" status plus the next consulting session. */
export function clinicStatus(
  schedule: ClinicSchedule,
  nowMs: number,
  horizonDays = 60,
): ClinicStatus {
  const now = budapestClock(nowMs);
  const today = hoursOnDate(schedule, now.date);

  if (today && now.minutes >= toMinutes(today.start) && now.minutes < toMinutes(today.end)) {
    return {
      state: "open",
      title: "Most rendelünk",
      nextLabel: "Mai rendelési idő",
      nextValue: range(today),
    };
  }
  if (today && now.minutes < toMinutes(today.start)) {
    return {
      state: "later",
      title: "Ma rendelünk",
      nextLabel: "Mai rendelési idő",
      nextValue: range(today),
    };
  }

  const title = today ? "Ma már nem rendelünk" : "Ma nincs rendelés";
  for (let i = 1; i <= horizonDays; i++) {
    const date = addDaysIso(now.date, i);
    const hours = hoursOnDate(schedule, date);
    if (hours) {
      return {
        state: "closed",
        title,
        nextLabel: "Következő rendelési nap",
        nextValue: `${HU_DAY_NAMES[dayOfWeekIso(date)]}, ${formatHuDate(date)} · ${range(hours)}`,
      };
    }
  }
  return { state: "closed", title, nextLabel: "", nextValue: "" };
}
