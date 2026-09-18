import { describe, expect, it } from "vitest";
import {
  generateAvailableSlots,
  type ResolvedSchedule,
  resolveScheduleForDate,
  type SeasonalScheduleSummary,
  type SlotGenerationInput,
  todayInBudapest,
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

  it("carries the seasonal day's break fields through to the resolved schedule", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31", {
      days: [
        {
          dayOfWeek: 3,
          isDayOff: false,
          startTime: "09:00",
          endTime: "13:00",
          breakStart: "11:00",
          breakEnd: "11:20",
        },
      ],
    });
    const result = resolveScheduleForDate("2026-07-15", defaultSchedule, [seasonal]);
    expect(result.days[0]).toMatchObject({ breakStart: "11:00", breakEnd: "11:20" });
  });
});

describe("generateAvailableSlots — napi szünet", () => {
  // A date a week out keeps the day-lock (60 min before start) and the
  // booking-window check (maxDaysAhead) comfortably satisfied regardless of
  // when the test runs, and identical hours on all 7 dayOfWeek values make
  // the fixture independent of which weekday "today + 7" happens to land on.
  function addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
  }

  const targetDate = addDays(todayInBudapest(), 7);

  type DayExtra = {
    startTime?: string;
    endTime?: string;
    breakStart?: string | null;
    breakEnd?: string | null;
  };

  function makeDay(dayOfWeek: number, extra: DayExtra = {}) {
    return {
      dayOfWeek,
      isDayOff: false,
      startTime: "08:00",
      endTime: "16:00",
      ...extra,
    };
  }

  function makeSchedule(extra: DayExtra = {}): ResolvedSchedule {
    return {
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [0, 1, 2, 3, 4, 5, 6].map((dow) => makeDay(dow, extra)),
    };
  }

  function baseInput(overrides: Partial<SlotGenerationInput> = {}): SlotGenerationInput {
    return {
      schedule: makeSchedule({ breakStart: "12:00", breakEnd: "13:00" }),
      blockedDates: [],
      bookedSlots: [],
      heldSlots: [],
      date: targetDate,
      serviceDurationMinutes: 20,
      maxDaysAhead: 30,
      nowMs: Date.now(),
      ...overrides,
    };
  }

  it("excludes every slot that starts inside the break", () => {
    const result = generateAvailableSlots(baseInput());
    expect(result).toContain("11:40");
    expect(result).toContain("13:00");
    expect(result).not.toContain("12:00");
    expect(result).not.toContain("12:20");
    expect(result).not.toContain("12:40");
  });

  it("excludes a slot that would run into the break", () => {
    const result = generateAvailableSlots(baseInput({ serviceDurationMinutes: 60 }));
    expect(result).not.toContain("11:20");
  });

  it("keeps a slot that ends exactly when the break starts", () => {
    const result = generateAvailableSlots(baseInput({ serviceDurationMinutes: 60 }));
    expect(result).toContain("11:00");
  });

  it("keeps a slot that starts exactly when the break ends", () => {
    const result = generateAvailableSlots(baseInput({ serviceDurationMinutes: 60 }));
    expect(result).toContain("13:00");
  });

  it("excludes a slot that starts inside the break and ends after it", () => {
    const result = generateAvailableSlots(baseInput({ serviceDurationMinutes: 60 }));
    expect(result).not.toContain("12:40");
  });

  it("returns no slots when the break covers the whole working window", () => {
    const result = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: "08:00", breakEnd: "16:00" }) }),
    );
    expect(result).toEqual([]);
  });

  it("ignores an incomplete break (only breakStart set)", () => {
    const withBreak = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: "12:00", breakEnd: null }) }),
    );
    const withoutBreak = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: null, breakEnd: null }) }),
    );
    expect(withBreak).toEqual(withoutBreak);
  });

  it("ignores an inverted break (breakEnd before breakStart)", () => {
    const inverted = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: "13:00", breakEnd: "12:00" }) }),
    );
    const withoutBreak = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: null, breakEnd: null }) }),
    );
    expect(inverted).toEqual(withoutBreak);
  });

  it("is unaffected when the day has no break fields at all", () => {
    const noFields = generateAvailableSlots(
      baseInput({
        schedule: {
          defaultSlotDuration: 20,
          bufferMinutes: 0,
          days: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
            dayOfWeek: dow,
            isDayOff: false,
            startTime: "08:00",
            endTime: "16:00",
          })),
        },
      }),
    );
    const withoutBreak = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: null, breakEnd: null }) }),
    );
    expect(noFields).toEqual(withoutBreak);
  });

  it("applies the break and bufferMinutes together", () => {
    const result = generateAvailableSlots(
      baseInput({
        schedule: {
          defaultSlotDuration: 20,
          bufferMinutes: 20,
          days: [0, 1, 2, 3, 4, 5, 6].map((dow) =>
            makeDay(dow, { breakStart: "12:00", breakEnd: "13:00" }),
          ),
        },
        bookedSlots: ["10:00"],
      }),
    );
    expect(result).not.toContain("09:40");
    expect(result).not.toContain("10:20");
    expect(result).not.toContain("12:00");
    expect(result).not.toContain("12:20");
    expect(result).not.toContain("12:40");
    expect(result).toContain("09:00");
    expect(result).toContain("13:00");
  });

  it("treats a non-grid-aligned break conservatively", () => {
    const result = generateAvailableSlots(
      baseInput({ schedule: makeSchedule({ breakStart: "12:10", breakEnd: "12:50" }) }),
    );
    expect(result).not.toContain("12:00");
    expect(result).not.toContain("12:20");
    expect(result).not.toContain("12:40");
    expect(result).toContain("13:00");
  });
});
