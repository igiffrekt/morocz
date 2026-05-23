import { describe, expect, it, vi } from "vitest";

import { resolveLatestRefundId } from "./resolve-latest-refund";

describe("resolveLatestRefundId", () => {
  it("uses the embedded refund when the charge includes it (no API call)", async () => {
    const listRefunds = vi.fn();
    const id = await resolveLatestRefundId(
      { id: "ch_1", refunds: { data: [{ id: "re_embedded" }] } },
      listRefunds,
    );
    expect(id).toBe("re_embedded");
    expect(listRefunds).not.toHaveBeenCalled();
  });

  it("falls back to listing refunds when the charge omits the refunds list", async () => {
    // API version 2026-03-25.dahlia does not embed `refunds` by default.
    const listRefunds = vi.fn().mockResolvedValue([{ id: "re_fetched" }]);
    const id = await resolveLatestRefundId({ id: "ch_1", refunds: null }, listRefunds);
    expect(id).toBe("re_fetched");
    expect(listRefunds).toHaveBeenCalledWith("ch_1");
  });

  it("falls back when refunds.data is present but empty", async () => {
    const listRefunds = vi.fn().mockResolvedValue([{ id: "re_fetched" }]);
    const id = await resolveLatestRefundId({ id: "ch_1", refunds: { data: [] } }, listRefunds);
    expect(id).toBe("re_fetched");
    expect(listRefunds).toHaveBeenCalledWith("ch_1");
  });

  it("returns null when no refund exists anywhere", async () => {
    const listRefunds = vi.fn().mockResolvedValue([]);
    const id = await resolveLatestRefundId({ id: "ch_1" }, listRefunds);
    expect(id).toBeNull();
  });
});
