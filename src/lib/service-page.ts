import type { ServiceContent, ServiceSlug } from "@/content/services/types";
import type { PriceMenuCategory, PriceMenuItem } from "@/lib/price-menu";

/** "01", "02", … */
export function twoDigit(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * "Kombinált orális fogamzásgátló — a hagyományos …" → lead + rest. Only splits when the
 * lead is short enough to be a label (the mockup uses < 80 characters).
 */
export function splitLead(text: string, max = 80): { lead: string; rest: string } {
  const at = text.indexOf(" — ");
  if (at > 0 && at < max) return { lead: text.slice(0, at), rest: text.slice(at + 3) };
  return { lead: "", rest: text };
}

/** Upper-cases the first letter ("a terhesség …" → "A terhesség …"). */
export function capitalize(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase("hu-HU") + text.slice(1) : text;
}

/**
 * H1 accent split: "Várandósgondozás — Orvosi kísérés …" → main "Várandósgondozás — ",
 * accent "Orvosi kísérés …"; "… Esztergomban" → accent "Esztergomban".
 */
export function splitHeroTitle(title: string): { main: string; accent: string } {
  const dash = title.indexOf(" — ");
  if (dash > 0) return { main: `${title.slice(0, dash)} — `, accent: title.slice(dash + 3) };
  if (/ Esztergomban$/.test(title)) {
    return { main: `${title.replace(/ Esztergomban$/, "")} `, accent: "Esztergomban" };
  }
  return { main: title, accent: "" };
}

export function sectionId(index: number): string {
  return `fejezet-${index + 1}`;
}

export const FAQ_SECTION_ID = "gyik";

/** Chapters for the sticky TOC / mobile chapter bar (sections + FAQ). */
export function serviceChapters(
  content: Pick<ServiceContent, "sections" | "faq">,
): { id: string; label: string; short: string }[] {
  const chapters = content.sections.map((s, i) => ({ id: sectionId(i), label: s.h, short: s.nav }));
  if (content.faq.length) {
    chapters.push({ id: FAQ_SECTION_ID, label: "Gyakran ismételt kérdések", short: "GYIK" });
  }
  return chapters;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLocaleLowerCase("hu-HU");

const allItems = (categories: readonly PriceMenuCategory[]) => categories.flatMap((c) => c.items);

/**
 * Hero card price rows per service, straight from the Sanity price list:
 * - Nőgyógyászat: the "Nőgyógyászati vizsgálatok" category without Várandósgondozás
 * - Várandósgondozás: its own service
 * - Gyógyszerfelírás: Receptírás only
 * - Szülészet: none (the card shows the opening hours instead)
 */
export function servicePriceRows(
  slug: ServiceSlug,
  categories: readonly PriceMenuCategory[],
): PriceMenuItem[] {
  switch (slug) {
    case "nogyogyaszat": {
      const gyn = categories.find((c) => c.theme === "gyn");
      return (gyn?.items ?? []).filter((i) => norm(i.name) !== "várandósgondozás");
    }
    case "varandosgondozas":
      return allItems(categories).filter((i) => norm(i.name) === "várandósgondozás");
    case "gyogyszerfeliras":
      return allItems(categories).filter((i) => norm(i.name).startsWith("receptírás"));
    default:
      return [];
  }
}

/** The two most common add-ons shown under the exam prices in the mobile price sheet. */
const COMMON_SURCHARGES = [
  "folyadékalapú méhnyakszűrés (lbc) mintavétel",
  "hpv dns alapú, 14 genotípus meghatározás (hpv14)",
];

export function commonSurcharges(categories: readonly PriceMenuCategory[]): PriceMenuItem[] {
  const surcharge = categories.filter((c) => c.surcharge).flatMap((c) => c.items);
  return COMMON_SURCHARGES.map((name) => surcharge.find((i) => norm(i.name) === name)).filter(
    (i): i is PriceMenuItem => Boolean(i && i.price != null),
  );
}

/** schema.org FAQPage built from the same items the page shows. */
export function faqJsonLd(faq: ServiceContent["faq"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

const SITE = "https://drmoroczangela.hu";

/** BreadcrumbList mirroring the visible hero breadcrumb. */
export function breadcrumbJsonLd(trail: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.path === "/" ? SITE : `${SITE}${crumb.path}`,
    })),
  };
}
