import { describe, expect, it } from "vitest";
import { resolveRefund } from "./policy";

const apptIn = (hoursFromNow: number) => {
  const d = new Date(Date.now() + hoursFromNow * 3600_000);
  const slotDate = d.toISOString().slice(0, 10);
  const slotTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { slotDate, slotTime };
};

describe("resolveRefund", () => {
  it("refunds when paid and >48h before appointment", () => {
    const r = resolveRefund({ ...apptIn(72), paymentStatus: "paid", confirmNoRefund: false });
    expect(r).toEqual({ eligible: true, requiresConfirmation: false, reason: "ok" });
  });

  it("treats exactly 48h as eligible (>=48h)", () => {
    // Slot 2026-06-03 10:00 Budapest (CEST) === 08:00 UTC; an absolute `now` exactly
    // 48h earlier makes the boundary deterministic regardless of the test runtime TZ.
    const now = new Date("2026-06-01T08:00:00Z");
    const r = resolveRefund({
      slotDate: "2026-06-03",
      slotTime: "10:00",
      paymentStatus: "paid",
      confirmNoRefund: false,
      now,
    });
    expect(r.eligible).toBe(true);
  });

  it("within 48h requires confirmation and gives no refund", () => {
    const r = resolveRefund({ ...apptIn(10), paymentStatus: "paid", confirmNoRefund: false });
    expect(r).toEqual({ eligible: false, requiresConfirmation: true, reason: "within_window" });
  });

  it("within 48h with confirmNoRefund proceeds without refund, no confirmation needed", () => {
    const r = resolveRefund({ ...apptIn(10), paymentStatus: "paid", confirmNoRefund: true });
    expect(r).toEqual({ eligible: false, requiresConfirmation: false, reason: "within_window" });
  });

  it("unpaid booking never needs refund or confirmation", () => {
    const r = resolveRefund({ ...apptIn(72), paymentStatus: "pending", confirmNoRefund: false });
    expect(r).toEqual({ eligible: false, requiresConfirmation: false, reason: "not_paid" });
  });
});
