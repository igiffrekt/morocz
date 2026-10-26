import { beforeEach, describe, expect, it, vi } from "vitest";

const writeClient = vi.hoisted(() => ({ fetch: vi.fn(), patch: vi.fn() }));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

import { releaseSlotLock, slotLockIdFor } from "./slot-lock";

function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.unset = vi.fn(() => chain);
  chain.ifRevisionId = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

const booking = { _id: "booking-1", slotDate: "2026-10-27", slotTime: "09:40" };

beforeEach(() => {
  writeClient.fetch.mockReset();
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
});

describe("slotLockIdFor", () => {
  it("builds the lock document id from date and time", () => {
    expect(slotLockIdFor("2026-10-27", "09:40")).toBe("slotLock-2026-10-27-09-40");
  });
});

describe("releaseSlotLock", () => {
  it("releases a booked lock when no other confirmed booking holds the slot", async () => {
    writeClient.fetch.mockResolvedValue({
      lock: { _rev: "r1", status: "booked" },
      otherBookings: 0,
    });

    await expect(releaseSlotLock(booking)).resolves.toBe(true);

    expect(writeClient.patch).toHaveBeenCalledWith("slotLock-2026-10-27-09-40");
    const chain = writeClient.patch.mock.results[0]?.value as Record<
      string,
      ReturnType<typeof vi.fn>
    >;
    expect(chain.ifRevisionId).toHaveBeenCalledWith("r1");
    expect(chain.set).toHaveBeenCalledWith({ status: "available" });
  });

  it("keeps the lock when another confirmed booking still occupies the slot", async () => {
    writeClient.fetch.mockResolvedValue({
      lock: { _rev: "r1", status: "booked" },
      otherBookings: 1,
    });

    await expect(releaseSlotLock(booking)).resolves.toBe(false);
    expect(writeClient.patch).not.toHaveBeenCalled();
  });

  it("leaves a lock alone that is held by someone else", async () => {
    writeClient.fetch.mockResolvedValue({ lock: { _rev: "r1", status: "held" }, otherBookings: 0 });

    await expect(releaseSlotLock(booking)).resolves.toBe(false);
    expect(writeClient.patch).not.toHaveBeenCalled();
  });

  it("does nothing when the lock does not exist", async () => {
    writeClient.fetch.mockResolvedValue({ lock: null, otherBookings: 0 });

    await expect(releaseSlotLock(booking)).resolves.toBe(false);
    expect(writeClient.patch).not.toHaveBeenCalled();
  });
});
