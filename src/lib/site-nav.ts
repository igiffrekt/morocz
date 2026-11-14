/** Hosts treated as "this site" when Sanity stores absolute nav URLs. */
const SITE_ORIGINS = ["https://drmoroczangela.hu", "https://www.drmoroczangela.hu"];

/** Service sub-pages that belong to the "Szolgáltatások és Árak" nav item. */
export const SERVICE_ROUTES = [
  "/szolgaltatasok-es-arak",
  "/nogyogyaszat",
  "/varandosgondozas",
  "/szuleszet",
  "/gyogyszerfeliras",
  "/laborvizsgalatok",
] as const;

export const PRICES_ROUTE = "/szolgaltatasok-es-arak";

/** Turn `https://drmoroczangela.hu/#blog` into `/#blog` so it stays a client-side link. */
export function normalizeHref(href: string | null | undefined): string {
  if (!href) return "#";
  for (const origin of SITE_ORIGINS) {
    if (href === origin) return "/";
    if (href.startsWith(`${origin}/`) || href.startsWith(`${origin}#`)) {
      const rest = href.slice(origin.length);
      return rest.startsWith("#") ? `/${rest}` : rest;
    }
  }
  return href;
}

function stripTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Whether a nav href represents the current page.
 * - `/kapcsolat` is active on `/kapcsolat` and its children.
 * - Homepage anchors (`/#blog`) are active on the matching section route (`/blog/...`).
 * - The prices page also lights up on the individual service pages.
 */
export function isActiveHref(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  const normal = normalizeHref(href);
  if (!normal.startsWith("/")) return false;
  const current = stripTrailingSlash(pathname);
  const [rawPath = "/", hash = ""] = normal.split("#");
  const path = stripTrailingSlash(rawPath.split("?")[0] || "/");

  if (path === "/") {
    if (!hash) return current === "/";
    return current === `/${hash}` || current.startsWith(`/${hash}/`);
  }
  if (path === PRICES_ROUTE) {
    return SERVICE_ROUTES.some((r) => current === r || current.startsWith(`${r}/`));
  }
  return current === path || current.startsWith(`${path}/`);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function mapsHref(address: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(address.replace(/\s*\n\s*/g, " "))}`;
}
