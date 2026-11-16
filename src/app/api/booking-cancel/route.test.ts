import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const writeClient = vi.hoisted(() => ({ fetch: vi.fn(), patch: vi.fn() }));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

const issueRefund = vi.hoisted(() => vi.fn());
vi.mock("@/lib/refund/issue-refund", () => ({ issueRefund }));

const releaseSlotLock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/slot-lock", () => ({ releaseSlotLock }));

const deleteCalendarEvent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/google-calendar", () => ({ deleteCalendarEvent }));

vi.mock("@/lib/email", () => ({ isEmailConfigured: () => false, sendEmail: vi.fn() }));
vi.mock("@/lib/booking-email", () => ({
  buildCancellationEmail: vi.fn(),
  buildReceptionCancellationEmail: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: { query: { user: { findFirst: vi.fn() } } } }));

import { POST } from "./route";

function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

function req(body: unknown) {
  return new Request("http://localhost/api/booking-cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** A Budapest-local slot `days` days from now (far outside / inside the 48 h window). */
function slotInDays(days: number) {
  const d = new Date(Date.now() + days * 24 * 3600_000);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Budapest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { slotDate: `${p.year}-${p.month}-${p.day}`, slotTime: "10:00" };
}

function booking(overrides: Record<string, unknown>) {
  return {
    _id: "booking-1",
    patientName: "Teszt Anna",
    patientEmail: "anna@example.com",
    patientPhone: "+36301234567",
    reservationNumber: "M-ABC123",
    service: { name: "Vizsgálat" },
    status: "confirmed",
    managementToken: "tok-1",
    googleCalendarEventId: "evt-1",
    stripePaymentIntentId: null,
    ...slotInDays(5),
    ...overrides,
  };
}

function patchSets(): unknown[] {
  return writeClient.patch.mock.results.flatMap((r) =>
    (r.value as { set: ReturnType<typeof vi.fn> }).set.mock.calls.map((a) => a[0]),
  );
}

beforeEach(() => {
  writeClient.fetch.mockReset();
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
  issueRefund.mockReset().mockResolvedValue({ refundId: "re_1" });
  releaseSlotLock.mockReset().mockResolvedValue(undefined);
  deleteCalendarEvent.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/booking-cancel — fee-waived bookings", () => {
  it("cancels a waived booking >48h ahead without any refund or refund status", async () => {
    writeClient.fetch.mockResolvedValue(booking({ paymentStatus: "waived" }));

    const res = await POST(req({ token: "tok-1" }));

    expect(res.status).toBe(200);
    expect(issueRefund).not.toHaveBeenCalled();
    expect(patchSets()).toEqual([{ status: "cancelled" }]);
    expect(releaseSlotLock).toHaveBeenCalledTimes(1);
    expect(deleteCalendarEvent).toHaveBeenCalledWith("evt-1");
  });

  it("cancels a waived booking within 48h without the forfeited-fee confirmation", async () => {
    writeClient.fetch.mockResolvedValue(booking({ paymentStatus: "waived", ...slotInDays(1) }));

    const res = await POST(req({ token: "tok-1" }));

    expect(res.status).toBe(200);
    expect(issueRefund).not.toHaveBeenCalled();
    // No refundStatus "no_refund" either: there was never a fee to keep.
    expect(patchSets()).toEqual([{ status: "cancelled" }]);
  });

  it("still refunds a paid booking >48h ahead (control)", async () => {
    writeClient.fetch.mockResolvedValue(
      booking({ paymentStatus: "paid", stripePaymentIntentId: "pi_1" }),
    );

    const res = await POST(req({ token: "tok-1" }));

    expect(res.status).toBe(200);
    expect(issueRefund).toHaveBeenCalledWith({ paymentIntentId: "pi_1", bookingId: "booking-1" });
  });
});
