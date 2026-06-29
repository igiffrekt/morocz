import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock("next/headers", () => ({ headers: vi.fn(() => Promise.resolve(new Headers())) }));

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

const getAvailableSlotsForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/availability", () => ({ getAvailableSlotsForDate }));

const assertDayStillOpen = vi.hoisted(() => vi.fn());
vi.mock("@/lib/booking-guards", () => ({ assertDayStillOpen }));

const writeClient = vi.hoisted(() => ({
  fetch: vi.fn(),
  createIfNotExists: vi.fn(),
  create: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

const sanityFetch = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/fetch", () => ({ sanityFetch }));

const generateAvailableSlots = vi.hoisted(() => vi.fn());
const resolveScheduleForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/slots", () => ({ generateAvailableSlots, resolveScheduleForDate }));

vi.mock("@/lib/google-calendar", () => ({ createCalendarEvent: vi.fn() }));
vi.mock("@/lib/email", () => ({ isEmailConfigured: () => false, sendEmail: vi.fn() }));
vi.mock("@/lib/booking-email", () => ({ buildConfirmationEmail: vi.fn(() => "<html>") }));
vi.mock("@/lib/db", () => ({ db: {} }));

import { POST } from "./route";

function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.unset = vi.fn(() => chain);
  chain.ifRevisionId = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

function req(body: unknown) {
  return new Request("http://localhost/api/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  serviceId: "svc-1",
  slotDate: "2026-06-30",
  slotTime: "14:00",
  patientName: "Teszt Anna",
  patientEmail: "anna@example.com",
  patientPhone: "+36301234567",
};

beforeEach(() => {
  getSession.mockReset().mockResolvedValue({ user: { id: "user-1" } });
  assertDayStillOpen.mockReset().mockResolvedValue(null);
  getAvailableSlotsForDate.mockReset();
  writeClient.fetch.mockReset();
  writeClient.createIfNotExists.mockReset().mockResolvedValue({});
  writeClient.create.mockReset().mockResolvedValue({ _id: "booking-1" });
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
  sanityFetch.mockReset().mockImplementation(({ tags }: { tags: string[] }) => {
    const tag = tags[0];
    if (tag === "booking" || tag === "slotLock") return Promise.resolve([]);
    if (tag === "weeklySchedule") return Promise.resolve({ days: [] });
    if (tag === "blockedDate") return Promise.resolve({ dates: [] });
    if (tag === "service") return Promise.resolve({ name: "Vizsgálat", appointmentDuration: 20 });
    return Promise.resolve(null);
  });
  generateAvailableSlots.mockReset().mockReturnValue([]);
  resolveScheduleForDate.mockReset().mockReturnValue({ days: [] });
});

describe("POST /api/booking — slot window validation", () => {
  it("rejects a slot outside the day's allowed window with 409 and creates no booking", async () => {
    // Custom rule narrows 2026-06-30 to 08:40–12:40; 14:00 is no longer offered.
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["08:40", "09:00", "12:20"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(409);
    expect(getAvailableSlotsForDate).toHaveBeenCalledWith("2026-06-30", "svc-1", undefined, {
      ignoreOccupancy: true,
    });
    expect(writeClient.create).not.toHaveBeenCalled();
    expect(writeClient.createIfNotExists).not.toHaveBeenCalled();
  });

  it("proceeds to create the booking when the slot is within the window", async () => {
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["08:40", "09:00", "14:00"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });
    // No existing lock, then a freshly-created available lock.
    writeClient.fetch.mockResolvedValueOnce(null).mockResolvedValueOnce({
      _id: "slotLock-2026-06-30-14-00",
      _rev: "r1",
      status: "available",
      heldUntil: null,
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(201);
    expect(writeClient.create).toHaveBeenCalledWith(
      expect.objectContaining({ slotDate: "2026-06-30", slotTime: "14:00", status: "confirmed" }),
    );
  });
});
