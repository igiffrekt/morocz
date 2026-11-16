import { describe, expect, it } from "vitest";
import { resolveRefund } from "./policy";

// The policy reads slotDate/slotTime as Budapest wall-clock time, so the helper
// formats both in Europe/Budapest too (mixing a UTC date with local hours broke the
// test between 00:00 and 01:00 local time). `now` is pinned so nothing drifts.
const NOW = new Date();
const budapestParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Budapest",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const apptIn = (hoursFromNow: number) => {
  const d = new Date(NOW.getTime() + hoursFromNow * 3600_000);
  const p = Object.fromEntries(budapestParts.formatToParts(d).map((x) => [x.type, x.value]));
  return { slotDate: `${p.year}-${p.month}-${p.day}`, slotTime: `${p.hour}:${p.minute}`, now: NOW };
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

  it("fee-waived booking is never refunded, even >48h ahead", () => {
    const r = resolveRefund({ ...apptIn(72), paymentStatus: "waived", confirmNoRefund: false });
    expect(r).toEqual({ eligible: false, requiresConfirmation: false, reason: "waived" });
  });

  it("fee-waived booking within 48h needs no forfeited-fee confirmation", () => {
    const r = resolveRefund({ ...apptIn(10), paymentStatus: "waived", confirmNoRefund: false });
    expect(r).toEqual({ eligible: false, requiresConfirmation: false, reason: "waived" });
  });
});
