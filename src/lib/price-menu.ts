import { formatFt } from "@/lib/service-menu";

/**
 * Homepage price menu (Szolgáltatásaink): Sanity `serviceCategory` + `service`
 * documents turned into accordion cards. Colours/icons are matched on the
 * category name (A1 mockup); unknown categories cycle through the palette.
 */

export type CategoryTheme = "gyn" | "screening" | "sampling" | "micro" | "hpv" | "other";

export interface PriceMenuSourceService {
  _id: string;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  category?: { _id: string; name?: string | null } | null;
}

export interface PriceMenuSourceCategory {
  _id: string;
  name?: string | null;
}

export interface PriceMenuItem {
  id: string;
  name: string;
  /** Free text under the name ("Cél: …", "Ár kórokozónként"). */
  note: string;
  /** "Tartalma:" bullet lines, shown as white pills. */
  includes: string[];
  price: number | null;
}

export interface PriceMenuCategory {
  id: string;
  name: string;
  theme: CategoryTheme;
  /** Charged on top of the gynaecological examination. */
  surcharge: boolean;
  /** "Foglaljon időpontot" button inside the panel. */
  bookable: boolean;
  /** "Évente 1x" badge (screening packages). */
  yearly: boolean;
  items: PriceMenuItem[];
  minPrice: number | null;
}

const norm = (s: string | null | undefined) =>
  (s ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("hu-HU");

/** Drops leading emoji/symbols ("🌿 Komplex …") and doubled spaces from Sanity names. */
export function cleanServiceName(name: string | null | undefined): string {
  return (name ?? "")
    .replace(/^[^\p{L}\p{N}(]+/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a Sanity description into the free-text note and the "- " bullet list
 * (the "Tartalma:" label line is dropped — the pills make it obvious).
 */
export function parseServiceDescription(description: string | null | undefined): {
  note: string;
  includes: string[];
} {
  const lines = (description ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const includes: string[] = [];
  const notes: string[] = [];
  for (const line of lines) {
    const bullet = line.match(/^[-–•*]\s*(.+)$/);
    if (bullet?.[1]) includes.push(bullet[1].trim());
    else if (!/^tartalma:?$/i.test(line)) notes.push(line);
  }
  return { note: notes.join(" "), includes };
}

export function categoryTheme(name: string | null | undefined, index: number): CategoryTheme {
  const n = norm(name);
  if (n.startsWith("nőgyógyászati vizsgálat")) return "gyn";
  if (n.includes("szűrőcsomag") || n.includes("szűrő csomag")) return "screening";
  if (n.includes("mintavétel")) return "sampling";
  if (n.includes("mikrobiológ")) return "micro";
  if (n.includes("hpv")) return "hpv";
  if (n.startsWith("egyéb")) return "other";
  const cycle: CategoryTheme[] = ["gyn", "screening", "sampling", "micro", "hpv", "other"];
  return cycle[index % cycle.length] ?? "other";
}

export function buildPriceMenu(
  categories: readonly PriceMenuSourceCategory[],
  services: readonly PriceMenuSourceService[],
): PriceMenuCategory[] {
  const seen = new Set<string>();
  const unique = services.filter((s) => {
    const key = norm(s.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return categories
    .map((cat, index) => {
      const theme = categoryTheme(cat.name, index);
      const items = unique
        .filter((s) => s.category?._id === cat._id)
        .map((s) => {
          const { note, includes } = parseServiceDescription(s.description);
          return {
            id: s._id,
            name: cleanServiceName(s.name),
            note,
            includes,
            price: typeof s.price === "number" ? s.price : null,
          };
        });
      const prices = items.map((i) => i.price).filter((p): p is number => p != null && p > 0);
      return {
        id: cat._id,
        name: (cat.name ?? "").trim(),
        theme,
        surcharge: norm(cat.name).includes("felár"),
        bookable: theme === "gyn" || theme === "screening",
        yearly: theme === "screening",
        items,
        minPrice: prices.length ? Math.min(...prices) : null,
      };
    })
    .filter((c) => c.items.length > 0);
}

/** Price of the first service whose (cleaned, case-insensitive) name equals `name`. */
export function findServicePrice(
  services: readonly PriceMenuSourceService[],
  name: string,
): number | null {
  const target = norm(cleanServiceName(name));
  const hit = services.find(
    (s) => norm(cleanServiceName(s.name)) === target && typeof s.price === "number",
  );
  return hit?.price ?? null;
}

/**
 * "vizsgálat ultrahanggal 43 000 Ft + LBC mintavétel 9 000 Ft = 52 000 Ft" from the
 * live Sanity prices; null when either service is missing.
 */
export function surchargeExample(services: readonly PriceMenuSourceService[]): string | null {
  const base = findServicePrice(services, "Nőgyógyászati vizsgálat ultrahanggal");
  const extra = findServicePrice(services, "Folyadékalapú méhnyakszűrés (LBC) mintavétel");
  if (base == null || extra == null) return null;
  return `vizsgálat ultrahanggal ${formatFt(base)} + LBC mintavétel ${formatFt(extra)} = ${formatFt(base + extra)}`;
}

/** "Mintavételek (Felárak)" → "Mintavételek" (the + Felár badge says the rest). */
export function shortCategoryName(name: string): string {
  return name.replace(/\s*\(felárak\)\s*$/i, "").trim();
}

/** URL-safe anchor for a price category ("Éves Szűrőcsomagok" → "arlista-eves-szurocsomagok"). */
export function categoryAnchor(name: string): string {
  const slug = shortCategoryName(name)
    .toLocaleLowerCase("hu-HU")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `arlista-${slug || "kategoria"}`;
}

export interface PackageRow {
  text: string;
  included: boolean;
}

export interface ScreeningPackage {
  id: string;
  name: string;
  /** "Cél: …" line from the Sanity description. */
  goal: string;
  price: number | null;
  recommended: boolean;
  rows: PackageRow[];
}

/** First two words of a "Tartalma:" line — "Folyadékalapú méhnyakszűrés (LBC)" ≈ "… méhnyakszűrés". */
function featureKey(text: string): string {
  return norm(text)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

/**
 * Éves Szűrőcsomagok side by side: each package lists its own Sanity "Tartalma:" lines,
 * plus every line another package has and this one lacks (shown as "nem része a
 * csomagnak"). The "Kiterjesztett" package — or, failing that, the dearest — is "Ajánlott".
 */
export function comparePackages(items: readonly PriceMenuItem[]): ScreeningPackage[] {
  const named = items.findIndex((i) => /kiterjesztett/i.test(i.name));
  let recommended = named;
  if (recommended < 0 && items.length > 1) {
    const prices = items.map((i) => i.price ?? -1);
    recommended = prices.indexOf(Math.max(...prices));
  }

  return items.map((item, index) => {
    const own = new Set(item.includes.map(featureKey));
    const missing: PackageRow[] = [];
    const seen = new Set<string>();
    for (const other of items) {
      if (other === item) continue;
      for (const text of other.includes) {
        const key = featureKey(text);
        if (own.has(key) || seen.has(key)) continue;
        seen.add(key);
        missing.push({ text, included: false });
      }
    }
    return {
      id: item.id,
      name: item.name,
      goal: item.note,
      price: item.price,
      recommended: index === recommended,
      rows: [...item.includes.map((text) => ({ text, included: true })), ...missing],
    };
  });
}

/**
 * schema.org Offers for every priced row of the menu (search and answer engines read
 * prices from Offer/priceSpecification), built from the same Sanity data the page shows.
 */
export function priceMenuOffers(categories: readonly PriceMenuCategory[], url: string) {
  return categories.flatMap((cat) =>
    cat.items
      .filter((item) => item.price != null && item.name)
      .map((item) => {
        const description =
          item.includes.length > 0
            ? `Tartalmazza: ${item.includes.join(", ")}`
            : item.note || undefined;
        // "Ár kórokozónként" — the price is per unit, not per visit.
        const perUnit = /kórokozónként/i.test(item.note) ? { unitText: "kórokozó" } : {};
        return {
          "@type": "Offer",
          name: item.name,
          ...(description ? { description } : {}),
          category: shortCategoryName(cat.name),
          price: item.price,
          priceCurrency: "HUF",
          availability: "https://schema.org/InStock",
          url,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: item.price,
            priceCurrency: "HUF",
            ...perUnit,
          },
          itemOffered: { "@type": "MedicalProcedure", name: item.name },
        };
      }),
  );
}

/** Card subtitle, desktop and compact (mobile) wording. */
export function categorySubtitle(cat: PriceMenuCategory): { long: string; short: string } {
  const count = cat.items.length;
  const from =
    cat.minPrice != null ? `${cat.surcharge ? "+ " : ""}${formatFt(cat.minPrice)}-tól` : "";
  const tail = from ? ` · ${from}` : "";
  if (cat.surcharge) {
    return {
      long: `Vizsgálaton felül · ${count} tétel${tail}`,
      short: `Felár · ${count} tétel${tail}`,
    };
  }
  return { long: `${count} szolgáltatás${tail}`, short: `${count} tétel${tail}` };
}
