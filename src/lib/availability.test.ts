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
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
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
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [{ date: "2026-07-20" }] },
      customAvailability: null,
      booking: [{ slotTime: "10:00", service: { _id: "svc" } }],
      slotLock: [{ slotTime: "11:00", status: "booked", heldUntil: null }],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    const result = await getAvailableSlotsForDate("2026-07-15", "svc");

    expect(result).toEqual({ slots: ["09:00", "09:20"], serviceName: "Vizsgálat", durationMinutes: 20 });
    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.bookedSlots).toContain("10:00");
    expect(arg.heldSlots).toContain("11:00");
    expect(arg.blockedDates).toContain("2026-07-20");
    expect(arg.serviceDurationMinutes).toBe(20);
    expect(arg.date).toBe("2026-07-15");
  });
});
