export interface ServicePrice {
  name: string | null;
  price: number | null;
}

export interface ServiceMenuItem {
  label: string;
  href: string;
  /** Price hint from Sanity ("30 000 Ft-tól"), empty when unknown. */
  meta: string;
}

/** "30 000 Ft" with a non-breaking thousands separator. */
export function formatFt(value: number): string {
  const digits = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${digits} Ft`;
}

const norm = (s: string | null) => (s ?? "").trim().toLocaleLowerCase("hu-HU");

function prices(services: readonly ServicePrice[], match: (name: string) => boolean): number[] {
  return services
    .filter((s) => typeof s.price === "number" && s.price > 0 && match(norm(s.name)))
    .map((s) => s.price as number);
}

/**
 * The mobile menu's "Szolgáltatások" submenu. Prices come from the Sanity `service`
 * documents (same source as the price list); a hint is dropped when no matching
 * service exists rather than showing a stale number.
 */
export function buildServiceMenu(services: readonly ServicePrice[]): ServiceMenuItem[] {
  const gyn = prices(services, (n) => n.startsWith("nőgyógyászati vizsgálat"));
  const prenatal = prices(services, (n) => n === "várandósgondozás");
  const rx = prices(services, (n) => n.startsWith("receptírás"));

  return [
    {
      label: "Nőgyógyászat",
      href: "/nogyogyaszat",
      meta: gyn.length ? `${formatFt(Math.min(...gyn))}-tól` : "",
    },
    {
      label: "Várandósgondozás",
      href: "/varandosgondozas",
      meta: prenatal.length ? formatFt(Math.min(...prenatal)) : "",
    },
    { label: "Szülészet", href: "/szuleszet", meta: "" },
    {
      label: "Gyógyszerfelírás",
      href: "/gyogyszerfeliras",
      meta: rx.length ? formatFt(Math.min(...rx)) : "",
    },
    { label: "Teljes árlista", href: "/szolgaltatasok-es-arak", meta: "" },
  ];
}
