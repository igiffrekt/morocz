/**
 * The booking wizard offers exactly two choices, collapsed from the Sanity `service`
 * documents (servicesForBookingQuery, ordered by `order`):
 *  - "Nőgyógyászat": the first service whose name starts with "Nőgyógyász"
 *  - "Várandósgondozás": the service named exactly "Várandósgondozás"
 * The homepage quick booking and the wizard both use this so the availability they
 * show is always computed for the same service id.
 */

export type BookingServiceSlug = "nogyogyaszat" | "varandosgondozas";

export const BOOKING_SERVICE_LABELS: Record<BookingServiceSlug, string> = {
  nogyogyaszat: "Nőgyógyászat",
  varandosgondozas: "Várandósgondozás",
};

/** Query-string keys understood by /idopontfoglalas for preselection. */
export const BOOKING_QUERY = { service: "szolgaltatas", date: "datum" } as const;

interface NamedService {
  _id: string;
  name?: string | null;
}

export function pickBookingServices<T extends NamedService>(
  services: readonly T[],
): { gyne: T | undefined; prenatal: T | undefined } {
  return {
    gyne: services.find((s) => s.name?.startsWith("Nőgyógyász")),
    prenatal: services.find((s) => s.name === "Várandósgondozás"),
  };
}

export function isBookingServiceSlug(value: unknown): value is BookingServiceSlug {
  return value === "nogyogyaszat" || value === "varandosgondozas";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "/idopontfoglalas?szolgaltatas=…&datum=…" (date optional). */
export function bookingHref(slug: BookingServiceSlug, date?: string | null): string {
  const params = new URLSearchParams({ [BOOKING_QUERY.service]: slug });
  if (date && ISO_DATE.test(date)) params.set(BOOKING_QUERY.date, date);
  return `/idopontfoglalas?${params.toString()}`;
}

/** Validated `datum` param: ISO date that is not before `today`, else null. */
export function parseBookingDate(value: unknown, today: string): string | null {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
  if (probe.toISOString().slice(0, 10) !== value) return null;
  return value >= today ? value : null;
}
