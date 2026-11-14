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
