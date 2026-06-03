import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieve = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe", () => ({
  stripe: { checkout: { sessions: { retrieve } } },
  BOOKING_FEE_HUF: 10_000,
}));

const writeClient = vi.hoisted(() => ({ fetch: vi.fn(), patch: vi.fn() }));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

vi.mock("@/lib/email", () => ({ isEmailConfigured: () => false, sendEmail: vi.fn() }));
vi.mock("@/lib/booking-email", () => ({ buildConfirmationEmail: vi.fn(() => "<html>") }));
vi.mock("@/lib/google-calendar", () => ({ createCalendarEvent: vi.fn() }));

import { reconcilePendingBooking } from "./booking-reconciler";

function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.unset = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

const pendingBooking = {
  _id: "booking-1",
  _createdAt: "2020-01-01T00:00:00.000Z",
  stripeSessionId: "cs_test_abc",
  slotDate: "2026-07-15",
  slotTime: "09:00",
  patientEmail: "a@b.com",
  patientName: "Anna",
  reservationNumber: "M-X",
  managementToken: "t",
  googleCalendarEventId: null,
  serviceName: "Vizsgálat",
  serviceDuration: 20,
};

beforeEach(() => {
  retrieve.mockReset();
  writeClient.fetch.mockReset().mockResolvedValue(pendingBooking);
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
});

describe("reconcilePendingBooking — Stripe retrieve failures", () => {
  it("cancels the booking and releases the slot when the session is resource_missing", async () => {
    retrieve.mockRejectedValue(
      Object.assign(new Error("No such checkout.session"), {
        code: "resource_missing",
        statusCode: 404,
      }),
    );

    const result = await reconcilePendingBooking("booking-1");

    expect(result).toEqual({ bookingId: "booking-1", action: "cancelled" });
    expect(writeClient.patch).toHaveBeenCalledWith("booking-1");
    expect(writeClient.patch).toHaveBeenCalledWith("slotLock-2026-07-15-09-00");
  });

  it("skips (stays retryable) on a transient Stripe error", async () => {
    retrieve.mockRejectedValue(
      Object.assign(new Error("network blip"), { type: "StripeConnectionError" }),
    );

    const result = await reconcilePendingBooking("booking-1");

    expect(result).toEqual({ bookingId: "booking-1", action: "skipped", reason: "stripe-error" });
    expect(writeClient.patch).not.toHaveBeenCalledWith("booking-1");
  });
});
