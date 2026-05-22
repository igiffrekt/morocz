import { describe, expect, it, vi, beforeEach } from "vitest";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe", () => ({
  stripe: { refunds: { create } },
  BOOKING_FEE_HUF: 10_000,
}));

import { issueRefund } from "./issue-refund";

describe("issueRefund", () => {
  beforeEach(() => create.mockReset());

  it("creates a Stripe refund with the booking id as idempotency key", async () => {
    create.mockResolvedValue({ id: "re_123" });
    const result = await issueRefund({ paymentIntentId: "pi_1", bookingId: "booking-9" });
    expect(create).toHaveBeenCalledWith(
      { payment_intent: "pi_1" },
      { idempotencyKey: "refund-booking-9" },
    );
    expect(result).toEqual({ refundId: "re_123" });
  });
});
