import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the slot math so the test is deterministic (no real-time/day-lock dependency).
const generateAvailableSlots = vi.hoisted(() => vi.fn());
const resolveScheduleForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/slots", () => ({ generateAvailableSlots, resolveScheduleForDate }));

// Mock Sanity fetch — return canned docs keyed by the first tag.
const sanityFetch = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/fetch", () => ({ sanityFetch }));

import { getAvailableSlotsForDate } from "./availability";

function mockSanityByTag(map: Record<string, unknown>) {
  sanityFetch.mockImplementation(({ tags }: { tags: string[] }) =>
    Promise.resolve(map[tags[0]] ?? null),
  );
}

describe("getAvailableSlotsForDate", () => {
  beforeEach(() => {
    generateAvailableSlots.mockReset();
    resolveScheduleForDate.mockReset();
    sanityFetch.mockReset();
    resolveScheduleForDate.mockReturnValue({ defaultSlotDuration: 20, bufferMinutes: 0, days: [] });
    generateAvailableSlots.mockReturnValue(["09:00", "09:20"]);
  });

  it("returns null when the service is not found", async () => {
    mockSanityByTag({
      weeklySchedule: {
        defaultSlotDuration: 20,
        bufferMinutes: 0,
        bookingWindowDays: 30,
        days: [],
      },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: null,
      booking: [],
      slotLock: [],
      service: null, // not found
    });

    const result = await getAvailableSlotsForDate("2026-07-15", "missing");
    expect(result).toBeNull();
  });

  it("returns slots and threads booked/held times into generateAvailableSlots", async () => {
    mockSanityByTag({
      weeklySchedule: {
        defaultSlotDuration: 20,
        bufferMinutes: 0,
        bookingWindowDays: 30,
        days: [],
      },
      seasonalSchedule: null,
      blockedDate: { dates: [{ date: "2026-07-20" }] },
      customAvailability: null,
      booking: [{ slotTime: "10:00", service: { _id: "svc" } }],
      slotLock: [{ slotTime: "11:00", status: "booked", heldUntil: null }],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    const result = await getAvailableSlotsForDate("2026-07-15", "svc");

    expect(result).toEqual({
      slots: ["09:00", "09:20"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });
    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.bookedSlots).toContain("10:00");
    expect(arg.heldSlots).toContain("11:00");
    expect(arg.blockedDates).toContain("2026-07-20");
    expect(arg.serviceDurationMinutes).toBe(20);
    expect(arg.date).toBe("2026-07-15");
  });

  it("with ignoreOccupancy, does not exclude booked/held slots from the window", async () => {
    mockSanityByTag({
      weeklySchedule: {
        defaultSlotDuration: 20,
        bufferMinutes: 0,
        bookingWindowDays: 30,
        days: [],
      },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: null,
      booking: [{ slotTime: "10:00", service: { _id: "svc" } }],
      slotLock: [{ slotTime: "11:00", status: "held", heldUntil: "2999-01-01T00:00:00Z" }],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    await getAvailableSlotsForDate("2026-07-15", "svc", undefined, { ignoreOccupancy: true });

    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.bookedSlots).toEqual([]);
    expect(arg.heldSlots).toEqual([]);
  });

  it("passes the resolved day's break through to generateAvailableSlots", async () => {
    resolveScheduleForDate.mockReturnValue({
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [
        {
          dayOfWeek: 3,
          isDayOff: false,
          startTime: "08:00",
          endTime: "16:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        },
      ],
    });
    mockSanityByTag({
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: null,
      booking: [],
      slotLock: [],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    await getAvailableSlotsForDate("2026-07-15", "svc");

    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.schedule.days[0]).toMatchObject({ breakStart: "12:00", breakEnd: "13:00" });
  });

  it("replaces the schedule day's break with the customAvailability break", async () => {
    resolveScheduleForDate.mockReturnValue({
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [
        {
          dayOfWeek: 3,
          isDayOff: false,
          startTime: "08:00",
          endTime: "16:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        },
      ],
    });
    mockSanityByTag({
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: {
        startTime: "08:00",
        endTime: "14:00",
        breakStart: "11:00",
        breakEnd: "11:30",
        services: [],
      },
      booking: [],
      slotLock: [],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    await getAvailableSlotsForDate("2026-07-15", "svc");

    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.schedule.days[0]).toMatchObject({ breakStart: "11:00", breakEnd: "11:30" });
  });

  it("clears the schedule day's break when customAvailability applies without a break", async () => {
    resolveScheduleForDate.mockReturnValue({
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [
        {
          dayOfWeek: 3,
          isDayOff: false,
          startTime: "08:00",
          endTime: "16:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        },
      ],
    });
    mockSanityByTag({
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: {
        startTime: "08:00",
        endTime: "14:00",
        breakStart: null,
        breakEnd: null,
        services: [],
      },
      booking: [],
      slotLock: [],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    await getAvailableSlotsForDate("2026-07-15", "svc");

    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.schedule.days[0].breakStart).toBeNull();
    expect(arg.schedule.days[0].breakEnd).toBeNull();
  });

  it("adds a break-bearing day when the resolved schedule has no entry for that weekday", async () => {
    resolveScheduleForDate.mockReturnValue({ defaultSlotDuration: 20, bufferMinutes: 0, days: [] });
    mockSanityByTag({
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: {
        startTime: "08:00",
        endTime: "14:00",
        breakStart: "11:00",
        breakEnd: "11:30",
        services: [],
      },
      booking: [],
      slotLock: [],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    await getAvailableSlotsForDate("2026-07-15", "svc");

    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.schedule.days[0]).toMatchObject({
      dayOfWeek: 3,
      breakStart: "11:00",
      breakEnd: "11:30",
    });
  });
});
