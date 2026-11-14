import { describe, expect, it } from "vitest";
import { SERVICE_CONTENT } from "@/content/services";
import { paramCount, parseLabBody, splitParams } from "./lab-test";
import {
  buildPriceMenu,
  categoryAnchor,
  comparePackages,
  type PriceMenuItem,
  shortCategoryName,
} from "./price-menu";
import {
  breadcrumbJsonLd,
  commonSurcharges,
  faqJsonLd,
  serviceChapters,
  servicePriceRows,
  splitHeroTitle,
  splitLead,
} from "./service-page";

// Snapshot of the published Sanity price list (service + serviceCategory).
const categories = [
  { _id: "gyn", name: "Nőgyógyászati vizsgálatok" },
  { _id: "egyeb", name: "Egyéb szolgáltatások" },
  { _id: "minta", name: "Mintavételek (Felárak)" },
  { _id: "hpv", name: "HPV vizsgálatok (Felárak)" },
  { _id: "szuro", name: "Éves Szűrőcsomagok" },
];
const svc = (id: string, cat: string, name: string, price: number, description = "") => ({
  _id: id,
  name,
  price,
  description,
  category: { _id: cat },
});
const services = [
  svc(
    "s1",
    "szuro",
    "🌿 Komplex Szűrővizsgálat",
    52000,
    "Cél: rutinszűrés panaszmentes pácienseknek\n\nTartalma:\n- Nőgyógyászati vizsgálat + ultrahang vizsgálat\n- Folyadékalapú méhnyakszűrés (LBC)",
  ),
  svc("s2", "gyn", "Nőgyógyászati vizsgálat / tanácsadás (ultrahang nélkül)", 30000),
  svc("s3", "gyn", "Nőgyógyászati vizsgálat ultrahanggal", 43000),
  svc(
    "s4",
    "szuro",
    "🌸 Kiterjesztett Komplex Szűrés",
    68000,
    "Cél: teljesebb prevenció, HPV-szűréssel\n\nTartalma:\n- Nőgyógyászati vizsgálat + ultrahang\n- Folyadékalapú méhnyakszűrés\n- HPV DNS tipizálás (HPV14, 14 genotípus)",
  ),
  svc("s5", "egyeb", "Sürgősségi fogamzásgátlás", 10000),
  svc("s6", "egyeb", "Receptírás rendelőnk páciensei részére", 4900),
  svc("s7", "minta", "Folyadékalapú méhnyakszűrés (LBC) mintavétel", 9000),
  svc("s8", "hpv", "HPV DNS alapú, 14 genotípus meghatározás (HPV14)", 18000),
  svc("s9", "gyn", "Várandósgondozás", 45000, "Tájékozódó ultrahang."),
];
const menu = buildPriceMenu(categories, services);

describe("service page helpers", () => {
  it("splits short leads on the em dash only", () => {
    expect(splitLead("Kombinált tabletta — ösztrogént tartalmaz")).toEqual({
      lead: "Kombinált tabletta",
      rest: "ösztrogént tartalmaz",
    });
    expect(splitLead("Nincs gondolatjel benne")).toEqual({
      lead: "",
      rest: "Nincs gondolatjel benne",
    });
    expect(splitLead(`${"x".repeat(90)} — késő`).lead).toBe("");
  });

  it("accents the part after the dash or 'Esztergomban'", () => {
    expect(splitHeroTitle("Várandósgondozás — Orvosi kísérés")).toEqual({
      main: "Várandósgondozás — ",
      accent: "Orvosi kísérés",
    });
    expect(splitHeroTitle("Szülészeti ellátás Esztergomban")).toEqual({
      main: "Szülészeti ellátás ",
      accent: "Esztergomban",
    });
    expect(splitHeroTitle("Gyógyszerfelírás")).toEqual({ main: "Gyógyszerfelírás", accent: "" });
  });

  it("lists every section plus the FAQ as chapters", () => {
    const chapters = serviceChapters(SERVICE_CONTENT.nogyogyaszat);
    expect(chapters).toHaveLength(SERVICE_CONTENT.nogyogyaszat.sections.length + 1);
    expect(chapters.at(-1)).toMatchObject({ id: "gyik", short: "GYIK" });
    expect(new Set(chapters.map((c) => c.id)).size).toBe(chapters.length);
  });

  it("picks the hero price rows per service from Sanity", () => {
    expect(servicePriceRows("nogyogyaszat", menu).map((r) => r.price)).toEqual([30000, 43000]);
    expect(servicePriceRows("varandosgondozas", menu).map((r) => r.name)).toEqual([
      "Várandósgondozás",
    ]);
    // Gyógyszerfelírás shows Receptírás only — never the emergency contraception row.
    expect(servicePriceRows("gyogyszerfeliras", menu).map((r) => r.name)).toEqual([
      "Receptírás rendelőnk páciensei részére",
    ]);
    expect(servicePriceRows("szuleszet", menu)).toEqual([]);
  });

  it("finds the common surcharges for the mobile price sheet", () => {
    expect(commonSurcharges(menu).map((r) => r.price)).toEqual([9000, 18000]);
  });

  it("builds FAQ and breadcrumb structured data", () => {
    const faq = faqJsonLd([{ q: "K?", a: "V." }]);
    expect(faq.mainEntity[0]).toMatchObject({ name: "K?", acceptedAnswer: { text: "V." } });
    const crumbs = breadcrumbJsonLd([
      { name: "Kezdőlap", path: "/" },
      { name: "Szülészet", path: "/szuleszet" },
    ]);
    expect(crumbs.itemListElement.map((c) => c.item)).toEqual([
      "https://drmoroczangela.hu",
      "https://drmoroczangela.hu/szuleszet",
    ]);
  });
});

describe("service copy (doctor-approved content.json)", () => {
  it("has the corrected wording", () => {
    const all = JSON.stringify(SERVICE_CONTENT);
    expect(all).toContain("hüvelyi mintavétellel");
    expect(all).toContain("további genetikai vizsgálatok is kérhetők");
    expect(all).toContain("ösztrogént nem szedhető nők");
  });

  it("links Gyógyszerfelírás only to Nőgyógyászat and Várandósgondozás", () => {
    expect(SERVICE_CONTENT.gyogyszerfeliras.related.map((r) => r.slug)).toEqual([
      "nogyogyaszat",
      "varandosgondozas",
    ]);
  });
});

describe("price list helpers", () => {
  it("names and anchors categories", () => {
    expect(shortCategoryName("Mintavételek (Felárak)")).toBe("Mintavételek");
    expect(categoryAnchor("Éves Szűrőcsomagok")).toBe("arlista-eves-szurocsomagok");
    expect(categoryAnchor("Mikrobiológiai vizsgálatok (Felárak)")).toBe(
      "arlista-mikrobiologiai-vizsgalatok",
    );
  });

  it("compares the screening packages side by side", () => {
    const screening = menu.find((c) => c.theme === "screening");
    const packs = comparePackages(screening?.items ?? []);
    expect(packs.map((p) => [p.name, p.recommended])).toEqual([
      ["Komplex Szűrővizsgálat", false],
      ["Kiterjesztett Komplex Szűrés", true],
    ]);
    // Komplex lacks only the HPV typing; slightly different wording is not a difference.
    expect(packs[0]?.rows).toEqual([
      { text: "Nőgyógyászati vizsgálat + ultrahang vizsgálat", included: true },
      { text: "Folyadékalapú méhnyakszűrés (LBC)", included: true },
      { text: "HPV DNS tipizálás (HPV14, 14 genotípus)", included: false },
    ]);
    expect(packs[1]?.rows.every((r) => r.included)).toBe(true);
    expect(packs[0]?.goal).toBe("Cél: rutinszűrés panaszmentes pácienseknek");
  });

  it("recommends the dearest package when none is called Kiterjesztett", () => {
    const item = (id: string, price: number): PriceMenuItem => ({
      id,
      name: id,
      note: "",
      includes: [],
      price,
    });
    expect(comparePackages([item("A", 10), item("B", 30)]).map((p) => p.recommended)).toEqual([
      false,
      true,
    ]);
  });
});

describe("lab package body", () => {
  const block = (text: string, style = "normal", listItem?: string, marks: string[] = []) => ({
    _type: "block",
    style,
    listItem,
    children: [{ _type: "span", text, marks }],
  });

  it("splits parameters on top-level commas only", () => {
    expect(splitParams("GOT, GPT, GGT, ALP (máj-, csont- és izomműködés)")).toEqual([
      "GOT",
      "GPT",
      "GGT",
      "ALP (máj-, csont- és izomműködés)",
    ]);
    expect(paramCount("Mit vizsgálunk? (2×34 paraméter)")).toBe("2×34 paraméter");
    expect(paramCount("Eredmények")).toBeNull();
  });

  it("groups h3 parameter lists and keeps plain bullets as a list", () => {
    const parsed = parseLabBody([
      block("Mikor válassza ezt a csomagot?", "h2"),
      block("Panaszmentes személyeknek."),
      block("Mit vizsgálunk? (5 paraméter)", "h2"),
      block("Vérképző rendszer", "h3"),
      block("Teljes vérkép, vas, transzferrin", "normal", "bullet"),
      block("Elektrolitok", "h3"),
      block("Nátrium, kálium", "normal", "bullet"),
      block("Felkészülés a vizsgálatra", "h2"),
      block("Ne egyen", "normal", "bullet"),
      block("Igyon vizet", "normal", "bullet"),
      block("Eredmények", "h2"),
      block("1 munkanap alatt.", "normal", undefined, ["strong"]),
    ]);
    expect(parsed?.map((s) => s.title)).toEqual([
      "Mikor válassza ezt a csomagot?",
      "Mit vizsgálunk? (5 paraméter)",
      "Felkészülés a vizsgálatra",
      "Eredmények",
    ]);
    expect(parsed?.[1]?.blocks).toEqual([
      {
        kind: "group",
        title: "Vérképző rendszer",
        params: ["Teljes vérkép", "vas", "transzferrin"],
      },
      { kind: "group", title: "Elektrolitok", params: ["Nátrium", "kálium"] },
    ]);
    expect(parsed?.[2]?.blocks).toEqual([
      {
        kind: "list",
        items: [[{ text: "Ne egyen", strong: false }], [{ text: "Igyon vizet", strong: false }]],
      },
    ]);
    expect(parsed?.[3]?.blocks[0]).toEqual({
      kind: "p",
      spans: [{ text: "1 munkanap alatt.", strong: true }],
    });
  });

  it("bails out on content it cannot lay out", () => {
    expect(parseLabBody([{ _type: "image" }])).toBeNull();
    expect(parseLabBody([block("Idézet", "blockquote")])).toBeNull();
    expect(parseLabBody([])).toBeNull();
  });
});
