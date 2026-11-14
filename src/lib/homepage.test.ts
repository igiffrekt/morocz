import { describe, expect, it } from "vitest";
import { bookingHref, parseBookingDate, pickBookingServices } from "./booking-services";
import {
  buildPriceMenu,
  categorySubtitle,
  cleanServiceName,
  findServicePrice,
  parseServiceDescription,
  surchargeExample,
} from "./price-menu";
import {
  addDaysIso,
  bookableDays,
  formatHuDate,
  monthsInWindow,
  type QuickBookingSchedule,
  scheduledDays,
} from "./quick-booking";

// 2026-11-16 is a Monday. 06:00 Budapest (UTC+1) on that day.
const MONDAY_MORNING = Date.UTC(2026, 10, 16, 5, 0);

const weekly: QuickBookingSchedule["weeklyDays"] = [
  { dayOfWeek: 1, isDayOff: false, startTime: "12:00", endTime: "15:20" },
  { dayOfWeek: 2, isDayOff: false, startTime: "12:00", endTime: "15:20" },
  { dayOfWeek: 3, isDayOff: true, startTime: "", endTime: "" },
  { dayOfWeek: 4, isDayOff: false, startTime: "13:00", endTime: "16:40" },
  { dayOfWeek: 5, isDayOff: true, startTime: "", endTime: "" },
  { dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
  { dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
];

function source(overrides: Partial<QuickBookingSchedule> = {}): QuickBookingSchedule {
  return {
    weeklyDays: weekly,
    bookingWindowDays: 6,
    seasonals: [],
    blockedDates: [],
    customAvailability: [],
    ...overrides,
  };
}

describe("quick booking schedule", () => {
  it("lists weekly consulting days inside the window", () => {
    const days = scheduledDays(source(), "svc", "2026-11-16", MONDAY_MORNING);
    expect(days.map((d) => d.date)).toEqual(["2026-11-16", "2026-11-17", "2026-11-19"]);
    expect(days[2]).toMatchObject({ startTime: "13:00", endTime: "16:40" });
  });

  it("locks today 60 minutes before the start", () => {
    const at1105 = Date.UTC(2026, 10, 16, 10, 5); // 11:05 Budapest, start 12:00
    const days = scheduledDays(source(), "svc", "2026-11-16", at1105);
    expect(days[0]?.date).toBe("2026-11-17");
  });

  it("applies seasonal overrides, blocked dates and per-service custom days", () => {
    const s = source({
      seasonals: [
        {
          startDate: "2026-11-01",
          endDate: "2026-12-31",
          defaultSlotDuration: 20,
          bufferMinutes: 0,
          days: [
            { dayOfWeek: 1, isDayOff: true, startTime: "", endTime: "" },
            { dayOfWeek: 2, isDayOff: false, startTime: "13:20", endTime: "16:40" },
            { dayOfWeek: 3, isDayOff: false, startTime: "11:00", endTime: "14:20" },
          ],
        },
      ],
      blockedDates: ["2026-11-17", "2026-11-18"],
      customAvailability: [
        { date: "2026-11-18", startTime: "09:00", endTime: "12:00", serviceIds: ["gyn"] },
        { date: "2026-11-20", startTime: "08:00", endTime: "10:00", serviceIds: null },
      ],
    });
    expect(scheduledDays(s, "gyn", "2026-11-16", MONDAY_MORNING).map((d) => d.date)).toEqual([
      "2026-11-18",
      "2026-11-20",
    ]);
    expect(scheduledDays(s, "prenatal", "2026-11-16", MONDAY_MORNING).map((d) => d.date)).toEqual([
      "2026-11-20",
    ]);
  });

  it("keeps only days the API reports as having free slots", () => {
    const days = scheduledDays(source(), "svc", "2026-11-16", MONDAY_MORNING);
    const result = bookableDays(days, {
      "2026-11-16": { available: 0, total: 10 },
      "2026-11-19": { available: 3, total: 10 },
    });
    expect(result.map((d) => d.date)).toEqual(["2026-11-19"]);
  });

  it("covers every month the window touches", () => {
    expect(monthsInWindow("2027-01-31", 30)).toEqual(["2027-01", "2027-02", "2027-03"]);
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("formats Hungarian dates", () => {
    expect(formatHuDate("2026-11-24")).toBe("november 24.");
    expect(formatHuDate("2026-11-04", true)).toBe("nov. 4.");
  });
});

describe("booking service helpers", () => {
  it("picks the same two services as the wizard", () => {
    const { gyne, prenatal } = pickBookingServices([
      { _id: "a", name: "🌿 Komplex Szűrővizsgálat" },
      { _id: "b", name: "Nőgyógyászati vizsgálat / tanácsadás" },
      { _id: "c", name: "Várandósgondozás" },
    ]);
    expect(gyne?._id).toBe("b");
    expect(prenatal?._id).toBe("c");
  });

  it("builds and validates preselection params", () => {
    expect(bookingHref("varandosgondozas", "2026-11-24")).toBe(
      "/idopontfoglalas?szolgaltatas=varandosgondozas&datum=2026-11-24",
    );
    expect(bookingHref("nogyogyaszat")).toBe("/idopontfoglalas?szolgaltatas=nogyogyaszat");
    expect(parseBookingDate("2026-11-24", "2026-11-14")).toBe("2026-11-24");
    expect(parseBookingDate("2026-11-01", "2026-11-14")).toBeNull();
    expect(parseBookingDate("2026-02-30", "2026-01-01")).toBeNull();
    expect(parseBookingDate("x", "2026-01-01")).toBeNull();
  });
});

/** formatFt separates thousands with U+00A0; compare with plain spaces. */
const plain = (s: string | null | undefined) => (s ?? "").replace(/\u00a0/g, " ");

describe("price menu", () => {
  const categories = [
    { _id: "gyn", name: "Nőgyógyászati vizsgálatok" },
    { _id: "lab", name: "Mintavételek (Felárak)" },
    { _id: "pack", name: "Éves Szűrőcsomagok" },
    { _id: "empty", name: "Üres" },
  ];
  const services = [
    {
      _id: "1",
      name: "Nőgyógyászati vizsgálat ultrahanggal",
      price: 43000,
      category: { _id: "gyn" },
    },
    {
      _id: "2",
      name: "Folyadékalapú méhnyakszűrés (LBC) mintavétel",
      price: 9000,
      category: { _id: "lab" },
    },
    { _id: "3", name: "Injekció beadása", price: 6000, category: { _id: "lab" } },
    {
      _id: "4",
      name: "🌿 Komplex Szűrővizsgálat",
      description: "Cél: rutinszűrés\n\nTartalma:\n- Vizsgálat + ultrahang\n- LBC",
      price: 52000,
      category: { _id: "pack" },
    },
    { _id: "5", name: "Injekció beadása", price: 1, category: { _id: "lab" } },
  ];

  it("groups services, flags surcharges and drops empty categories", () => {
    const menu = buildPriceMenu(categories, services);
    expect(menu.map((c) => c.id)).toEqual(["gyn", "lab", "pack"]);
    const lab = menu[1];
    expect(lab?.surcharge).toBe(true);
    expect(lab?.items).toHaveLength(2);
    expect(plain(lab && categorySubtitle(lab).long)).toBe(
      "Vizsgálaton felül · 2 tétel · + 6 000 Ft-tól",
    );
    expect(menu[0]?.bookable).toBe(true);
    expect(menu[2]).toMatchObject({ bookable: true, yearly: true, theme: "screening" });
    expect(menu[2]?.items[0]).toMatchObject({
      name: "Komplex Szűrővizsgálat",
      note: "Cél: rutinszűrés",
      includes: ["Vizsgálat + ultrahang", "LBC"],
    });
  });

  it("computes the surcharge example from live prices", () => {
    expect(plain(surchargeExample(services))).toBe(
      "vizsgálat ultrahanggal 43 000 Ft + LBC mintavétel 9 000 Ft = 52 000 Ft",
    );
    expect(surchargeExample(services.slice(1))).toBeNull();
  });

  it("matches names regardless of emoji and doubled spaces", () => {
    expect(cleanServiceName("Szakorvosi dokumentáció  (igazolás) kiállítása")).toBe(
      "Szakorvosi dokumentáció (igazolás) kiállítása",
    );
    expect(
      findServicePrice(
        [{ _id: "x", name: "Szakorvosi dokumentáció  (igazolás) kiállítása", price: 12000 }],
        "Szakorvosi dokumentáció (igazolás) kiállítása",
      ),
    ).toBe(12000);
    expect(parseServiceDescription(null)).toEqual({ note: "", includes: [] });
  });
});
