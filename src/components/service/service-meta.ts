import type { ServiceSlug } from "@/content/services/types";
import type { BookingServiceSlug } from "@/lib/booking-services";

const ICONS = {
  pulse: "M22 12h-4l-3 9L9 3l-3 9H2",
  baby: "M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  heart:
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  pill: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7",
} as const;

export const CLOCK_ICON = "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2";

/** One colour of the card cycle: surface + number badge. */
export interface CardTone {
  surface: string;
  badge: string;
}

export interface ServiceMeta {
  short: string;
  href: string;
  icon: string;
  /** Which booking choice the CTAs preselect. */
  booking: BookingServiceSlug;
  /** Light surface (check list, FAQ numbers, related card). */
  tint: string;
  /** Strong accent + readable text (section numbers, checks, timeline). */
  accent: string;
  /** Hero disc / eyebrow icon / avatar ring. */
  mark: string;
  /** H1 accent text colour. */
  highlight: string;
  /** Box shadow ring around timeline numbers (tint colour). */
  ring: string;
  /** Literal md: variants (Tailwind only sees complete class names). */
  listSurfaceMd: string;
  checkMd: string;
  /** Timeline connector colour. */
  line: string;
  /** FAQ number colours while its question is open. */
  faqOpen: string;
  /** CTA band surface + text, and its button. */
  band: string;
  bandButton: string;
  cards: CardTone[];
}

const tone = (surface: string, badge: string): CardTone => ({ surface, badge });

/** Per-service accent system (Szolgaltatas mockup META). */
export const SERVICE_META: Record<ServiceSlug, ServiceMeta> = {
  nogyogyaszat: {
    short: "Nőgyógyászat",
    href: "/nogyogyaszat",
    icon: ICONS.pulse,
    booking: "nogyogyaszat",
    tint: "bg-mint-pale",
    accent: "bg-navy text-white",
    mark: "bg-mint",
    highlight: "text-mint-light",
    ring: "shadow-[0_0_0_6px_var(--color-mint-pale)]",
    listSurfaceMd: "md:bg-mint-pale",
    checkMd: "md:bg-navy md:text-white",
    line: "bg-navy",
    faqOpen: "group-aria-expanded:bg-navy group-aria-expanded:text-white",
    band: "bg-mint text-navy",
    bandButton: "",
    cards: [
      tone("bg-mint-pale", "bg-mint text-navy"),
      tone("bg-lavender", "bg-navy text-white"),
      tone("bg-sage", "bg-teal-ink text-white"),
      tone("bg-sun-soft", "bg-sun text-navy"),
    ],
  },
  szuleszet: {
    short: "Szülészet",
    href: "/szuleszet",
    icon: ICONS.baby,
    booking: "nogyogyaszat",
    tint: "bg-coral-soft",
    accent: "bg-coral text-navy",
    mark: "bg-coral",
    highlight: "text-coral",
    ring: "shadow-[0_0_0_6px_var(--color-coral-soft)]",
    listSurfaceMd: "md:bg-coral-soft",
    checkMd: "md:bg-coral md:text-navy",
    line: "bg-coral",
    faqOpen: "group-aria-expanded:bg-coral",
    band: "bg-coral text-navy",
    bandButton: "",
    cards: [
      tone("bg-coral-soft", "bg-coral text-navy"),
      tone("bg-sun-soft", "bg-sun text-navy"),
      tone("bg-blush-soft", "bg-blush text-navy"),
      tone("bg-lavender", "bg-navy text-white"),
    ],
  },
  varandosgondozas: {
    short: "Várandósgondozás",
    href: "/varandosgondozas",
    icon: ICONS.heart,
    booking: "varandosgondozas",
    tint: "bg-blush-soft",
    accent: "bg-blush text-navy",
    mark: "bg-blush",
    highlight: "text-blush",
    ring: "shadow-[0_0_0_6px_var(--color-blush-soft)]",
    listSurfaceMd: "md:bg-blush-soft",
    checkMd: "md:bg-blush md:text-navy",
    line: "bg-blush",
    faqOpen: "group-aria-expanded:bg-blush",
    band: "bg-blush text-navy",
    bandButton: "",
    cards: [
      tone("bg-blush-soft", "bg-blush text-navy"),
      tone("bg-coral-soft", "bg-coral text-navy"),
      tone("bg-mint-pale", "bg-mint text-navy"),
      tone("bg-sun-soft", "bg-sun text-navy"),
    ],
  },
  gyogyszerfeliras: {
    short: "Gyógyszerfelírás",
    href: "/gyogyszerfeliras",
    icon: ICONS.pill,
    booking: "nogyogyaszat",
    tint: "bg-[#e1efee]",
    accent: "bg-teal-ink text-white",
    mark: "bg-mint",
    highlight: "text-mint-light",
    ring: "shadow-[0_0_0_6px_#e1efee]",
    listSurfaceMd: "md:bg-[#e1efee]",
    checkMd: "md:bg-teal-ink md:text-white",
    line: "bg-teal-ink",
    faqOpen: "group-aria-expanded:bg-teal-ink group-aria-expanded:text-white",
    band: "bg-teal-ink text-white",
    bandButton: "bg-white text-navy hover:bg-white hover:text-navy",
    cards: [
      tone("bg-[#e1efee]", "bg-teal-ink text-white"),
      tone("bg-mint-pale", "bg-mint text-navy"),
      tone("bg-lavender", "bg-navy text-white"),
      tone("bg-blush-soft", "bg-blush text-navy"),
    ],
  },
};
