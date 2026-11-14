import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";
import { Chip } from "@/components/ui/Chip";
import { PillLink } from "@/components/ui/PillButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bookingHref } from "@/lib/booking-services";
import { cn } from "@/lib/cn";
import {
  type CategoryTheme,
  categoryAnchor,
  categorySubtitle,
  type PriceMenuCategory,
  type PriceMenuItem,
} from "@/lib/price-menu";
import { formatFt } from "@/lib/service-menu";
import { ICON_PATHS, PathIcon } from "./PathIcon";

/** Category surface, round icon colours and icon (also used by the prices page overview). */
export const PRICE_THEMES: Record<CategoryTheme, { tint: string; accent: string; icon: string }> = {
  gyn: { tint: "bg-lavender", accent: "bg-navy text-white", icon: ICON_PATHS.gyn },
  screening: { tint: "bg-sun-soft", accent: "bg-sun text-navy", icon: ICON_PATHS.shield },
  sampling: { tint: "bg-mint-pale", accent: "bg-mint text-navy", icon: ICON_PATHS.tube },
  micro: { tint: "bg-[#e1efee]", accent: "bg-teal-ink text-white", icon: ICON_PATHS.micro },
  hpv: { tint: "bg-blush-soft", accent: "bg-blush text-navy", icon: ICON_PATHS.dna },
  other: { tint: "bg-coral-soft", accent: "bg-coral text-navy", icon: ICON_PATHS.doc },
};

interface PriceMenuProps {
  heading?: string | null;
  lead?: string | null;
  /** Sanity pricingPage.validityNote ("Érvényes 2026. július 1-től."). */
  validityNote: string;
  categories: PriceMenuCategory[];
  /** "vizsgálat ultrahanggal 43 000 Ft + LBC mintavétel 9 000 Ft = 52 000 Ft" or null. */
  surchargeExample: string | null;
  /** Section id (default "szolgaltatasok"); the heading id is derived from it. */
  id?: string;
  eyebrow?: string;
  /** Give every category a `#arlista-…` anchor that scrolls to and opens it. */
  anchors?: boolean;
}

function SurchargeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full bg-sun px-3 text-xs font-extrabold whitespace-nowrap text-navy",
        className,
      )}
    >
      + Felár
    </span>
  );
}

function SurchargeExplainer({ example }: { example: string | null }) {
  return (
    <>
      <div className="mx-1 mb-2 rounded-[20px] border-2 border-sun bg-white px-3.5 py-3 text-[13px] leading-normal text-muted-strong md:hidden">
        <strong className="text-navy">A nőgyógyászati vizsgálat díján felül fizetendő.</strong>
        {example && <> Pl. {example}.</>}
      </div>
      <div className="mx-3 mb-2.5 hidden flex-col gap-2 rounded-[24px] border-2 border-sun bg-white px-5 py-4 md:flex">
        <span className="flex items-center gap-2.5 text-[15px] font-extrabold text-navy">
          <SurchargeBadge />A nőgyógyászati vizsgálat díján felül fizetendő
        </span>
        <span className="text-sm leading-relaxed text-muted-strong">
          A vizsgálat során szakmailag indokolttá válhatnak további vizsgálatok, mintavételek,
          amelyek többletköltséggel járhatnak. Ezek elvégzése a páciens előzetes tájékoztatásával és
          beleegyezésével történnek.
        </span>
        {example && (
          <span className="self-start rounded-[18px] bg-canvas px-4 py-2 text-[13px] leading-snug font-bold text-navy">
            Például: {example}
          </span>
        )}
      </div>
    </>
  );
}

function PriceRow({ item, surcharge }: { item: PriceMenuItem; surcharge: boolean }) {
  const price = item.price != null ? `${surcharge ? "+ " : ""}${formatFt(item.price)}` : null;
  return (
    <div className="flex flex-col gap-1 border-t border-navy/8 px-2 py-2.5 transition-colors duration-250 md:gap-1.5 md:rounded-[22px] md:border-0 md:px-3 md:py-3.5 md:hover:bg-white/60">
      <div className="flex items-start justify-between gap-3 md:items-end">
        <span className="text-sm leading-[1.35] font-bold text-navy md:max-w-[70%] md:text-base">
          {item.name}
        </span>
        <span
          aria-hidden="true"
          className="mb-1.5 hidden min-w-6 flex-1 border-b-2 border-dotted border-navy/25 md:block"
        />
        {price && (
          <span
            className={cn(
              "shrink-0 text-sm font-extrabold whitespace-nowrap text-navy md:text-[17px]",
              surcharge && "rounded-full bg-white px-2.5 py-1 md:px-3.5 md:py-1.5",
            )}
          >
            {price}
          </span>
        )}
      </div>
      {item.note && (
        <span className="text-xs leading-normal text-muted md:max-w-[80%] md:text-sm">
          {item.note}
        </span>
      )}
      {item.includes.length > 0 && (
        <span className="mt-0.5 flex flex-wrap gap-1.5">
          {item.includes.map((inc) => (
            <span
              key={inc}
              className="rounded-full bg-white px-3 py-1 text-xs font-bold whitespace-nowrap text-navy md:px-3.5 md:py-1.5 md:text-[13px]"
            >
              {inc}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** Szolgáltatásaink: Sanity price list as single-open accordion cards (all closed by default). */
export function PriceMenu({
  heading,
  lead,
  validityNote,
  categories,
  surchargeExample,
  id = "szolgaltatasok",
  eyebrow = "Szolgáltatások és Árak",
  anchors = false,
}: PriceMenuProps) {
  const headingId = `${id}-cim`;
  const items: AccordionItemData[] = categories.map((cat) => {
    const theme = PRICE_THEMES[cat.theme];
    const sub = categorySubtitle(cat);
    return {
      id: cat.id,
      anchor: anchors ? categoryAnchor(cat.name) : undefined,
      className: cn(theme.tint, anchors && "scroll-mt-24 lg:scroll-mt-8"),
      icon: (
        <span
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full md:h-14 md:w-14",
            theme.accent,
          )}
        >
          <PathIcon d={theme.icon} size={22} className="md:h-6 md:w-6" />
        </span>
      ),
      title: cat.name,
      subtitle: (
        <>
          <span className="md:hidden">{sub.short}</span>
          <span className="hidden md:inline">{sub.long}</span>
        </>
      ),
      badge: cat.surcharge ? (
        <Chip
          tone="sun"
          className="hidden h-auto bg-sun px-4 py-2 text-xs font-extrabold tracking-[.04em] md:inline-flex"
        >
          + Felár
        </Chip>
      ) : cat.yearly ? (
        <Chip
          tone="white"
          className="hidden h-auto px-4 py-2 text-xs font-extrabold tracking-[.04em] md:inline-flex"
        >
          Évente 1x
        </Chip>
      ) : undefined,
      content: (
        <div className="flex flex-col gap-0.5 md:gap-1">
          {cat.surcharge && <SurchargeExplainer example={surchargeExample} />}
          {cat.items.map((item) => (
            <PriceRow key={item.id} item={item} surcharge={cat.surcharge} />
          ))}
          {cat.bookable && (
            <PillLink
              href={bookingHref("nogyogyaszat")}
              variant="navy"
              arrow
              className="mx-1 mt-2 h-[50px] w-auto px-6 text-[15px] md:mx-3 md:mt-2.5 md:self-start md:text-sm"
            >
              Foglaljon időpontot
            </PillLink>
          )}
        </div>
      ),
    };
  });

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex scroll-mt-28 flex-col gap-3.5 md:gap-8"
    >
      <SectionHeading
        id={headingId}
        eyebrow={eyebrow}
        title={heading || "Szolgáltatásaink"}
        lead={lead}
        className="px-1.5 md:px-0"
        aside={
          <div className="flex flex-col items-start gap-2.5 md:items-end">
            <span className="hidden rounded-full bg-white px-5 py-2.5 text-[13px] font-bold whitespace-nowrap text-navy lg:inline-flex">
              {validityNote} Az árváltoztatás jogát fenntartjuk.
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-sun-soft py-1.5 pr-3.5 pl-1.5 text-xs font-semibold whitespace-nowrap text-navy md:gap-3 md:py-2 md:pr-5 md:pl-2 md:text-sm">
              <SurchargeBadge className="h-6 px-2.5 md:h-8 md:px-3.5 md:text-[13px]" />
              <span className="md:hidden">a nőgyógyászati vizsgálat díján felül</span>
              <span className="hidden md:inline">
                A nőgyógyászati vizsgálat díján felül fizetendő tétel
              </span>
            </span>
          </div>
        }
      />
      <Accordion
        items={items}
        className="grid items-start gap-3.5 md:gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr))]"
        itemClassName="rounded-tile md:rounded-panel"
        triggerClassName="gap-3 rounded-tile p-3.5 md:gap-[18px] md:rounded-panel md:px-6 md:py-[22px]"
        titleClassName="text-base leading-[1.25] md:text-xl md:leading-tight"
        subtitleClassName="text-xs md:text-sm"
        plusClassName="h-9 w-9 md:h-[42px] md:w-[42px]"
        contentClassName="px-2.5 pb-3.5 md:px-4 md:pb-5"
      />
    </section>
  );
}
