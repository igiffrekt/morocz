import { describe, expect, it } from "vitest";
import {
  type ResolvedSchedule,
  resolveScheduleForDate,
  type SeasonalScheduleSummary,
} from "./slots";

const defaultSchedule: ResolvedSchedule = {
  defaultSlotDuration: 20,
  bufferMinutes: 0,
  days: [
    { dayOfWeek: 1, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 2, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 3, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 4, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 5, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
    { dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
  ],
};

function makeSeasonal(
  startDate: string,
  endDate: string,
  overrides: Partial<SeasonalScheduleSummary> = {},
): SeasonalScheduleSummary {
  return {
    startDate,
    endDate,
    defaultSlotDuration: 15,
    bufferMinutes: 5,
    days: [
      { dayOfWeek: 1, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 2, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 3, isDayOff: true, startTime: "", endTime: "" },
      { dayOfWeek: 4, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 5, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
      { dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
    ],
    ...overrides,
  };
}

describe("resolveScheduleForDate", () => {
  it("returns the default schedule when no seasonals are provided", () => {
    const result = resolveScheduleForDate("2026-05-14", defaultSchedule, []);
    expect(result).toBe(defaultSchedule);
  });

  it("returns the default schedule when no seasonal covers the date", () => {
    const seasonals = [makeSeasonal("2026-06-01", "2026-08-31")];
    const result = resolveScheduleForDate("2026-05-14", defaultSchedule, seasonals);
    expect(result).toBe(defaultSchedule);
  });

  it("returns the seasonal schedule when the date is inside its range", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31");
    const result = resolveScheduleForDate("2026-07-15", defaultSchedule, [seasonal]);
    expect(result.defaultSlotDuration).toBe(15);
    expect(result.bufferMinutes).toBe(5);
    expect(result.days).toBe(seasonal.days);
  });

  it("treats startDate as inclusive", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31");
    const result = resolveScheduleForDate("2026-06-01", defaultSchedule, [seasonal]);
    expect(result.defaultSlotDuration).toBe(15);
  });

  it("treats endDate as inclusive", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31");
    const result = resolveScheduleForDate("2026-08-31", defaultSchedule, [seasonal]);
    expect(result.defaultSlotDuration).toBe(15);
  });

  it("picks the seasonal with the earliest startDate when ranges overlap", () => {
    // Validator should prevent this at save time; resolver picks deterministically as a safety net.
    const earlier = makeSeasonal("2026-06-01", "2026-08-31", {
      defaultSlotDuration: 15,
    });
    const later = makeSeasonal("2026-07-15", "2026-09-15", {
      defaultSlotDuration: 30,
    });
    const result = resolveScheduleForDate("2026-08-01", defaultSchedule, [
      later, // intentionally out of order
      earlier,
    ]);
    expect(result.defaultSlotDuration).toBe(15);
  });
});
