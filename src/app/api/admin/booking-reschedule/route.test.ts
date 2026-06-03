import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

const getAvailableSlotsForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/availability", () => ({ getAvailableSlotsForDate }));

const writeClient = vi.hoisted(() => ({
  fetch: vi.fn(),
  createIfNotExists: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

vi.mock("@/lib/google-calendar", () => ({
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ isEmailConfigured: () => false, sendEmail: vi.fn() }));
vi.mock("@/lib/booking-email", () => ({ buildRescheduleEmail: vi.fn(() => "<html>") }));

import { POST } from "./route";

// Chainable patch builder: .set().unset().ifRevisionId().commit()
function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.unset = vi.fn(() => chain);
  chain.ifRevisionId = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

function req(body: unknown) {
  return new Request("http://localhost/api/admin/booking-reschedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const confirmedBooking = {
  _id: "booking-1",
  patientName: "Teszt Anna",
  patientEmail: "anna@example.com",
  reservationNumber: "M-ABCD12",
  service: { name: "Vizsgálat", appointmentDuration: 20 },
  serviceId: "svc-1",
  slotDate: "2026-07-15",
  slotTime: "09:00",
  managementToken: "tok-1",
  googleCalendarEventId: null,
};

beforeEach(() => {
  getSession.mockReset();
  getAvailableSlotsForDate.mockReset();
  writeClient.fetch.mockReset();
  writeClient.createIfNotExists.mockReset().mockResolvedValue({});
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
  getSession.mockResolvedValue({ user: { role: "admin" } });
  getAvailableSlotsForDate.mockResolvedValue({
    slots: ["10:00", "10:20"],
    serviceName: "Vizsgálat",
    durationMinutes: 20,
  });
});

describe("POST /api/admin/booking-reschedule", () => {
  it("rejects non-admin sessions with 403", async () => {
    getSession.mockResolvedValue({ user: { role: "user" } });
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated requests with 401", async () => {
    getSession.mockResolvedValue(null);
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects when booking is not confirmed", async () => {
    writeClient.fetch.mockResolvedValueOnce({ ...confirmedBooking, status: "cancelled" });
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects when the booking has no service assigned", async () => {
    writeClient.fetch.mockResolvedValueOnce({
      ...confirmedBooking,
      status: "confirmed",
      serviceId: null,
    });
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a no-op (same date and time)", async () => {
    writeClient.fetch.mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" });
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "09:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects when the new slot is not in the available list", async () => {
    writeClient.fetch.mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" });
    getAvailableSlotsForDate.mockResolvedValue({
      slots: ["11:00"],
      serviceName: "Vizsgálat",
      durationMinutes: 20,
    });
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(409);
  });

  it("returns 409 when the slotLock is already booked", async () => {
    writeClient.fetch
      .mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" }) // booking
      .mockResolvedValueOnce({ _id: "slotLock-x", _rev: "r1", status: "booked" }); // new slot lock
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(409);
  });

  it("patches the booking and swaps slot locks on success", async () => {
    writeClient.fetch
      .mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" }) // booking
      .mockResolvedValueOnce({ _id: "slotLock-new", _rev: "r1", status: "available" }); // new slot lock
    const res = await POST(
      req({
        bookingId: "booking-1",
        newDate: "2026-07-15",
        newTime: "10:00",
        notifyPatient: false,
      }),
    );
    expect(res.status).toBe(200);
    // booking patched to new date/time
    expect(writeClient.patch).toHaveBeenCalledWith("booking-1");
    // new slot lock id and old slot lock id both patched
    expect(writeClient.patch).toHaveBeenCalledWith("slotLock-new");
    expect(writeClient.patch).toHaveBeenCalledWith("slotLock-2026-07-15-09-00");
    // the created lock carries slotDate/slotTime so it stays queryable
    expect(writeClient.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({ slotDate: "2026-07-15", slotTime: "10:00" }),
    );
  });
});
