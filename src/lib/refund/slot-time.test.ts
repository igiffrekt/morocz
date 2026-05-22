import { describe, expect, it } from "vitest";
import { budapestSlotToEpochMs, hoursUntilBudapestSlot } from "./slot-time";

describe("budapestSlotToEpochMs", () => {
  it("interprets a summer (CEST, UTC+2) slot as Budapest local time", () => {
    // 2026-06-03 10:00 Budapest (CEST) === 08:00 UTC
    expect(budapestSlotToEpochMs("2026-06-03", "10:00")).toBe(Date.parse("2026-06-03T08:00:00Z"));
  });

  it("interprets a winter (CET, UTC+1) slot as Budapest local time", () => {
    // 2026-01-15 10:00 Budapest (CET) === 09:00 UTC
    expect(budapestSlotToEpochMs("2026-01-15", "10:00")).toBe(Date.parse("2026-01-15T09:00:00Z"));
  });
});

describe("hoursUntilBudapestSlot", () => {
  it("is exactly 48h regardless of the runtime timezone (absolute now)", () => {
    // slot 2026-06-03 10:00 Budapest = 08:00Z; now 48h earlier = 2026-06-01 08:00Z
    const now = new Date("2026-06-01T08:00:00Z");
    expect(hoursUntilBudapestSlot("2026-06-03", "10:00", now)).toBe(48);
  });

  it("is negative for a slot in the past", () => {
    const now = new Date("2026-06-10T00:00:00Z");
    expect(hoursUntilBudapestSlot("2026-06-03", "10:00", now)).toBeLessThan(0);
  });
});
