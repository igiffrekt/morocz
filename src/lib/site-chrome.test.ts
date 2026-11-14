import { describe, expect, it } from "vitest";
import { computeOpeningHours } from "./opening-hours";
import { buildServiceMenu, formatFt } from "./service-menu";
import { classifyHref, isActiveHref, mapsHref, normalizeHref, telHref } from "./site-nav";

const day = (dayOfWeek: number, startTime = "", endTime = "", isDayOff = !startTime) => ({
  dayOfWeek,
  isDayOff,
  startTime,
  endTime,
});

describe("normalizeHref / isActiveHref", () => {
  it("strips the site origin from absolute nav URLs", () => {
    expect(normalizeHref("https://drmoroczangela.hu/#blog")).toBe("/#blog");
    expect(normalizeHref("https://drmoroczangela.hu/idopontfoglalas")).toBe("/idopontfoglalas");
    expect(normalizeHref("https://example.com/x")).toBe("https://example.com/x");
    expect(normalizeHref(null)).toBe("#");
  });

  it("matches plain routes and their children", () => {
    expect(isActiveHref("/kapcsolat", "/kapcsolat")).toBe(true);
    expect(isActiveHref("/kapcsolat/", "/kapcsolat")).toBe(true);
    expect(isActiveHref("/joga", "/kapcsolat")).toBe(false);
  });

  it("maps homepage anchors to their section route", () => {
    expect(isActiveHref("/blog/valami", "https://drmoroczangela.hu/#blog")).toBe(true);
    expect(isActiveHref("/", "/#blog")).toBe(false);
  });

  it("lights the price list on service pages", () => {
    expect(isActiveHref("/nogyogyaszat", "/szolgaltatasok-es-arak")).toBe(true);
    expect(isActiveHref("/laborvizsgalatok/hpv", "/szolgaltatasok-es-arak")).toBe(true);
    expect(isActiveHref("/joga", "/szolgaltatasok-es-arak")).toBe(false);
  });

  it("builds tel and maps links", () => {
    expect(telHref("+36 70 639 5239")).toBe("tel:+36706395239");
    expect(mapsHref("2500 Esztergom\nMartsa Alajos utca 6/c")).toBe(
      "https://maps.google.com/?q=2500%20Esztergom%20Martsa%20Alajos%20utca%206%2Fc",
    );
  });
});

describe("classifyHref", () => {
  it("makes site URLs relative and flags external / plain links", () => {
    expect(classifyHref("https://drmoroczangela.hu/idopontfoglalas")).toEqual({
      href: "/idopontfoglalas",
      kind: "internal",
    });
    expect(classifyHref("/#blog")).toEqual({ href: "/#blog", kind: "internal" });
    expect(classifyHref("https://www.google.com/maps/place/x")).toEqual({
      href: "https://www.google.com/maps/place/x",
      kind: "external",
    });
    expect(classifyHref("https://facebook.com/moroczmedical").kind).toBe("external");
    expect(classifyHref("tel:+36706395239")).toEqual({ href: "tel:+36706395239", kind: "plain" });
    expect(classifyHref("mailto:a@b.hu")).toEqual({ href: "mailto:a@b.hu", kind: "plain" });
    expect(classifyHref(null)).toEqual({ href: "#", kind: "plain" });
  });
});

describe("computeOpeningHours", () => {
  const weekly = {
    days: [day(1, "12:00", "15:20"), day(2, "12:00", "15:20"), day(3), day(4, "13:00", "16:40")],
  };
  const seasonals = [
    {
      name: "November",
      startDate: "2026-11-01",
      endDate: "2026-12-31",
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [day(0), day(4, "13:20", "16:40"), day(2, "13:20", "16:40"), day(3, "11:00", "14:20")],
    },
  ];

  it("uses the weekly schedule outside any season", () => {
    expect(computeOpeningHours("2026-10-15", weekly, seasonals)).toEqual({
      days: [
        { dayOfWeek: 1, name: "Hétfő", hours: "12:00 – 15:20" },
        { dayOfWeek: 2, name: "Kedd", hours: "12:00 – 15:20" },
        { dayOfWeek: 4, name: "Csütörtök", hours: "13:00 – 16:40" },
      ],
    });
  });

  it("lets the seasonal schedule override, Monday-first, open days only", () => {
    const result = computeOpeningHours("2026-11-14", weekly, seasonals);
    expect(result).not.toHaveProperty("seasonName");
    expect(result.days.map((d) => `${d.name} ${d.hours}`)).toEqual([
      "Kedd 13:20 – 16:40",
      "Szerda 11:00 – 14:20",
      "Csütörtök 13:20 – 16:40",
    ]);
  });

  it("copes with missing data", () => {
    expect(computeOpeningHours("2026-11-14", null, null)).toEqual({ days: [] });
  });
});

describe("buildServiceMenu", () => {
  it("derives price hints from Sanity services", () => {
    const menu = buildServiceMenu([
      { name: "Nőgyógyászati vizsgálat ultrahanggal", price: 43000 },
      { name: "Nőgyógyászati vizsgálat / tanácsadás (ultrahang nélkül)", price: 30000 },
      { name: "Várandósgondozás", price: 45000 },
      { name: "Receptírás rendelőnk páciensei részére", price: 4900 },
      { name: "Kontroll vizsgálat", price: 25000 },
    ]);
    expect(menu.map((m) => [m.label, m.href, m.meta])).toEqual([
      ["Nőgyógyászat", "/nogyogyaszat", "30 000 Ft-tól"],
      ["Várandósgondozás", "/varandosgondozas", "45 000 Ft"],
      ["Szülészet", "/szuleszet", ""],
      ["Gyógyszerfelírás", "/gyogyszerfeliras", "4 900 Ft"],
      ["Teljes árlista", "/szolgaltatasok-es-arak", ""],
    ]);
  });

  it("drops hints when services are missing", () => {
    expect(buildServiceMenu([]).every((m) => m.meta === "")).toBe(true);
    expect(formatFt(1234567)).toBe("1 234 567 Ft");
  });
});
