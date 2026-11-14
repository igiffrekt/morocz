import type { CSSProperties } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { SwipeRow } from "@/components/subpage/SwipeRow";
import { PillLink } from "@/components/ui/PillButton";
import { bookingHref } from "@/lib/booking-services";
import { cn } from "@/lib/cn";
import type { ScreeningPackage } from "@/lib/price-menu";

const STAR = "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z";
const CROSS = "M18 6 6 18M6 6l12 12";

const thousands = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function PackageCard({ pack, index }: { pack: ScreeningPackage; index: number }) {
  const hi = pack.recommended;
  return (
    // fade-up sits on a wrapper: its animation would otherwise cancel the hover lift.
    <div className="fade-up flex w-full" style={{ "--i": index } as CSSProperties}>
      <article
        aria-labelledby={`csomag-${pack.id}`}
        className={cn(
          "card-lift flex w-full flex-col gap-[18px] rounded-panel p-5 md:gap-[22px] md:rounded-[36px] md:p-[clamp(24px,3vw,36px)]",
          hi
            ? "bg-navy text-white shadow-[0_34px_70px_-36px_rgba(36,42,95,.7)]"
            : "bg-white text-navy",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3
              id={`csomag-${pack.id}`}
              className="m-0 text-xl leading-[1.2] font-extrabold tracking-[-0.01em] md:text-[26px]"
            >
              {pack.name}
            </h3>
            {pack.goal && (
              <span
                className={cn(
                  "text-[13px] leading-normal font-semibold md:text-[15px]",
                  hi ? "text-navy-soft" : "text-muted",
                )}
              >
                {pack.goal}
              </span>
            )}
          </div>
          {hi && (
            <span className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-sun px-3.5 text-[13px] font-extrabold whitespace-nowrap text-navy">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={STAR} />
              </svg>
              Ajánlott
            </span>
          )}
        </div>
        {pack.price != null && (
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] leading-none font-extrabold tracking-[-0.03em] tabular-nums md:text-[clamp(44px,4.4vw,60px)]">
              {thousands(pack.price)}
            </span>
            <span className="text-base font-extrabold md:text-xl">Ft</span>
          </div>
        )}
        <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 p-0">
          {pack.rows.map((row) => (
            <li
              key={row.text}
              className={cn(
                "flex items-start gap-3 rounded-[22px] px-4 py-3 text-sm leading-normal font-bold md:text-base",
                hi ? "bg-white/8" : row.included ? "bg-sun-soft" : "bg-canvas text-muted",
              )}
            >
              <span
                className={cn(
                  "-mt-px inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full",
                  !row.included
                    ? "bg-line text-muted"
                    : hi
                      ? "bg-sun text-navy"
                      : "bg-navy text-white",
                )}
              >
                <PathIcon d={row.included ? ICON_PATHS.tick : CROSS} size={14} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                {row.text}
                {!row.included && (
                  <span className="block text-[13px] font-semibold text-muted">
                    nem része a csomagnak
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <PillLink
          href={bookingHref("nogyogyaszat")}
          variant={hi ? "mint" : "navy"}
          arrow
          className={cn(
            "h-[50px] w-full md:h-[54px] md:w-auto md:self-start md:px-[26px] md:text-[15px]",
            hi && "bg-sun text-navy hover:bg-sun",
          )}
        >
          Foglaljon időpontot
        </PillLink>
      </article>
    </div>
  );
}

/** Éves Szűrőcsomagok compared side by side (swipe carousel on phones). */
export function ScreeningCompare({ packages }: { packages: ScreeningPackage[] }) {
  if (!packages.length) return null;
  return (
    <section
      id="szurocsomagok"
      aria-labelledby="szurocsomagok-cim"
      className="relative flex scroll-mt-28 flex-col gap-5 overflow-hidden rounded-panel bg-sun-soft px-[18px] py-6 md:gap-9 md:rounded-hero md:p-[clamp(24px,4.5vw,56px)]"
    >
      <div
        aria-hidden="true"
        className="absolute -top-[200px] -right-[120px] h-[420px] w-[420px] rounded-full border-[1.5px] border-sun/70"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[680px] flex-col gap-3">
          <span className="text-xs font-bold tracking-[.14em] text-teal-ink uppercase md:text-[13px]">
            Összehasonlítás
          </span>
          <h2
            id="szurocsomagok-cim"
            className="m-0 text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em] text-navy sm:text-[44px] lg:text-[52px]"
          >
            Éves Szűrőcsomagok
          </h2>
        </div>
        <span className="inline-flex items-center gap-2.5 rounded-full bg-white py-2 pr-5 pl-2 text-[13px] font-extrabold whitespace-nowrap text-navy md:py-2.5 md:pl-2.5 md:text-sm">
          <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-sun">
            <PathIcon d={ICON_PATHS.cal} size={16} strokeWidth={2.2} />
          </span>
          Évente 1x igénybe vehető
        </span>
      </div>
      <SwipeRow
        label="Éves Szűrőcsomagok"
        className="relative"
        gridClassName="md:items-stretch md:[grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))] md:gap-4"
        slideClassName="flex-[0_0_calc(100%-36px)]"
      >
        {packages.map((pack, index) => (
          <PackageCard key={pack.id} pack={pack} index={index} />
        ))}
      </SwipeRow>
    </section>
  );
}
