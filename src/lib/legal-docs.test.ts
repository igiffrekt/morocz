import { describe, expect, it } from "vitest";
import {
  blockPlainText,
  formatLegalDate,
  LEGAL_DOCS,
  type LegalBlockLike,
  legalReadingMinutes,
  legalWordCount,
  nextLegalDoc,
  prepareLegalBody,
  slugifyHeading,
  splitHeadingNumber,
} from "./legal-docs";

const block = (key: string, text: string, style = "normal", extra = {}): LegalBlockLike => ({
  _type: "block",
  _key: key,
  style,
  children: [{ _type: "span", text }],
  ...extra,
});

describe("legal document registry", () => {
  it("lists the five documents with their routes", () => {
    expect(LEGAL_DOCS.map((d) => d.href)).toEqual([
      "/adatkezelesi-tajekoztato",
      "/cookie-szabalyzat",
      "/felhasznalasi-feltetelek",
      "/foglalasi-es-lemondasi-szabalyzat",
      "/altalanos-betegtajekoztato",
    ]);
  });

  it("wraps around for the next document", () => {
    expect(nextLegalDoc("altalanos-betegtajekoztato").key).toBe("adatkezelesi-tajekoztato");
    expect(nextLegalDoc("cookie-szabalyzat").key).toBe("felhasznalasi-feltetelek");
  });
});

describe("splitHeadingNumber / slugifyHeading", () => {
  it("splits dotted and multi-level numbers", () => {
    expect(splitHeadingNumber("3. A foglalási díj")).toEqual({
      num: "3",
      dot: ".",
      rest: "A foglalási díj",
    });
    expect(splitHeadingNumber("7.1. Általános rendelkezések")).toEqual({
      num: "7.1",
      dot: ".",
      rest: "Általános rendelkezések",
    });
    expect(splitHeadingNumber("2 Kapcsolat")).toEqual({ num: "2", dot: "", rest: "Kapcsolat" });
    expect(splitHeadingNumber("Adatkezelő elérhetőségei")).toBeNull();
    expect(splitHeadingNumber("2026")).toBeNull();
  });

  it("builds ASCII slugs from Hungarian text", () => {
    expect(slugifyHeading("7.1. Általános rendelkezések")).toBe("7-1-altalanos-rendelkezesek");
    expect(slugifyHeading("Önt, mint érintettet megillető jogok")).toBe(
      "ont-mint-erintettet-megilleto-jogok",
    );
    expect(slugifyHeading("Ő ű")).toBe("o-u");
    expect(slugifyHeading("—")).toBe("fejezet");
  });
});

describe("prepareLegalBody", () => {
  it("numbers h2 headings from their text and keeps the rest of the text", () => {
    const body = [
      block("a", "Mórocz Medical Kft.", "h3"),
      block("b", "1. Üzemeltető adatai", "h2"),
      block("c", "Szöveg egy két három."),
      block("d", "7.1. Általános rendelkezések", "h2"),
      block("e", "Javasolt jelölőnégyzet", "h2"),
    ];
    const out = prepareLegalBody(body);
    expect(out.toc).toEqual([
      { id: "1-uzemelteto-adatai", num: "1", generated: false, text: "Üzemeltető adatai" },
      {
        id: "7-1-altalanos-rendelkezesek",
        num: "7.1",
        generated: false,
        text: "Általános rendelkezések",
      },
      {
        id: "javasolt-jelolonegyzet",
        num: null,
        generated: false,
        text: "Javasolt jelölőnégyzet",
      },
    ]);
    // A sub-heading before the first h2 would skip a level after the page h1: it stays a
    // plain block (LegalBody renders it as a bold paragraph).
    expect(out.headings.a).toBeUndefined();
    expect(out.headings.b).toMatchObject({ rank: 2, num: "1", numDot: "." });
    // number prefix moved to the pill: rendered text = num + dot + " " + rest
    const b = out.body[1];
    expect(b && blockPlainText(b)).toBe("Üzemeltető adatai");
    // untouched source
    expect(blockPlainText(body[1] as LegalBlockLike)).toBe("1. Üzemeltető adatai");
  });

  it("generates numbers when no top heading is numbered", () => {
    const out = prepareLegalBody([
      block("a", "Miről szól a tájékoztató?", "h2"),
      block("b", "Sütik", "h3"),
      block("c", "Adatkezelő elérhetőségei", "h2"),
    ]);
    expect(out.toc.map((t) => [t.num, t.generated])).toEqual([
      ["1", true],
      ["2", true],
    ]);
    expect(out.headings.b?.rank).toBe(3);
  });

  it("promotes h3 to the top level when the document has no h2", () => {
    const out = prepareLegalBody([
      block("a", "1. Méhnyakszűrés", "h3"),
      block("b", "Az ismételt mintavétel költsége", "h4"),
      block("c", "2. A citológiai mintavétel két módja", "h3"),
    ]);
    expect(out.headings.a).toMatchObject({ rank: 2, num: "1" });
    expect(out.headings.b).toMatchObject({ rank: 3, num: null });
    expect(out.toc).toHaveLength(2);
  });

  it("keeps the heading untouched when the number spans several spans", () => {
    const heading: LegalBlockLike = {
      _type: "block",
      _key: "x",
      style: "h2",
      children: [
        { _type: "span", text: "1" },
        { _type: "span", text: ". Cím" },
      ],
    };
    const out = prepareLegalBody([heading, block("y", "2. Másik", "h2")]);
    expect(out.body[0]).toBe(heading);
    expect(out.headings.x?.num).toBeNull();
    expect(out.headings.y?.num).toBe("2");
  });

  it("makes duplicate heading ids unique and ignores list items / empty headings", () => {
    const out = prepareLegalBody([
      block("a", "Kapcsolat", "h2"),
      block("b", "Kapcsolat", "h2"),
      block("c", "   ", "h2"),
      block("d", "Lista", "h2", { listItem: "bullet" }),
    ]);
    expect(out.toc.map((t) => t.id)).toEqual(["kapcsolat", "kapcsolat-2"]);
  });

  it("counts words of text blocks and table cells", () => {
    const body: LegalBlockLike[] = [
      block("a", "egy két három"),
      { _type: "styledTable", _key: "t", table: { rows: [{ cells: ["négy öt", "hat"] }] } },
      { _type: "image", _key: "i" },
    ];
    expect(legalWordCount(body)).toBe(6);
    expect(legalReadingMinutes(6)).toBe(1);
    expect(legalReadingMinutes(1000)).toBe(5);
    expect(prepareLegalBody(null).toc).toEqual([]);
  });
});

describe("formatLegalDate", () => {
  it("formats like the previous pages and tolerates missing values", () => {
    expect(formatLegalDate("2026-07-21")).toBe(
      new Date("2026-07-21").toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
    expect(formatLegalDate(null)).toBeNull();
    expect(formatLegalDate("nope")).toBeNull();
  });
});
