import { PathIcon } from "@/components/home/PathIcon";
import { PRICE_THEMES } from "@/components/home/PriceMenu";
import { AccordionJumpLink } from "@/components/subpage/AccordionJumpLink";
import { HeroCard } from "@/components/subpage/PageHero";
import { cn } from "@/lib/cn";
import { categoryAnchor, type PriceMenuCategory, shortCategoryName } from "@/lib/price-menu";
import { formatFt } from "@/lib/service-menu";

/** "Árak röviden": every Sanity category with its lowest price; a row opens that category. */
export function PriceOverviewCard({ categories }: { categories: PriceMenuCategory[] }) {
  return (
    <HeroCard className="gap-1.5 p-[clamp(18px,2.6vw,26px)]">
      <div className="flex items-center justify-between gap-2.5 px-2 pt-1 pb-2.5">
        <span className="text-[22px] font-extrabold tracking-[-0.01em]">Árak röviden</span>
        <span className="rounded-full bg-canvas px-3.5 py-2 text-xs font-bold whitespace-nowrap">
          {categories.length} kategória
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {categories.map((cat) => {
          const theme = PRICE_THEMES[cat.theme];
          const from =
            cat.minPrice != null ? `${cat.surcharge ? "+ " : ""}${formatFt(cat.minPrice)}-tól` : "";
          return (
            <li key={cat.id}>
              <AccordionJumpLink
                anchor={categoryAnchor(cat.name)}
                className="tap-press flex min-h-14 items-center gap-3.5 rounded-full py-2 pr-3 pl-2 text-navy no-underline hover:bg-canvas hover:text-navy"
              >
                <span
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    theme.accent,
                  )}
                >
                  <PathIcon d={theme.icon} size={18} strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-[1.25] font-extrabold">
                    {shortCategoryName(cat.name)}
                  </span>
                  <span className="text-xs font-semibold text-muted">
                    {cat.surcharge
                      ? `Felár · ${cat.items.length} tétel`
                      : `${cat.items.length} szolgáltatás`}
                  </span>
                </span>
                {from && (
                  <span className="text-sm font-extrabold whitespace-nowrap tabular-nums">
                    {from}
                  </span>
                )}
              </AccordionJumpLink>
            </li>
          );
        })}
      </ul>
    </HeroCard>
  );
}
