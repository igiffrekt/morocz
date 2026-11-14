import Link from "next/link";
import type { ReactNode } from "react";
import { PathIcon } from "@/components/home/PathIcon";
import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  /** Shorter label for phones (keeps the breadcrumb pill on one line). */
  shortLabel?: string;
  /** Omit for the current page. */
  href?: string;
}

const HOME_ICON = "m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z";

/** Pill breadcrumb on navy. Intermediate crumbs are hidden on phones (Kezdőlap / current). */
export function HeroBreadcrumb({ crumbs }: { crumbs: readonly Crumb[] }) {
  const last = crumbs.length - 1;
  return (
    <nav aria-label="Morzsamenü" className="relative max-w-full self-start">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 rounded-full border border-white/14 bg-white/8 py-1.5 pr-4 pl-1.5 text-xs font-semibold text-[#d6d9ec] md:text-[13px]">
        <li className="flex">
          <Link
            href="/"
            className="link-grow tap-area inline-flex items-center gap-2 rounded-full py-0.5 pr-1.5 pl-0.5 text-[#d6d9ec] hover:text-white"
          >
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-mint text-navy">
              <PathIcon d={HOME_ICON} size={14} strokeWidth={2.4} />
            </span>
            Kezdőlap
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const middle = i < last;
          return (
            <li key={crumb.label} className={cn("contents", middle && "max-sm:hidden")}>
              <span aria-hidden="true" className="px-1 opacity-50">
                /
              </span>
              {crumb.href && middle ? (
                <Link
                  href={crumb.href}
                  className="link-grow tap-area px-1 py-0.5 text-[#d6d9ec] hover:text-white"
                >
                  {crumb.label}
                </Link>
              ) : middle ? (
                // Section label without a page of its own (e.g. "Jogi információk").
                <span className="px-1 py-0.5">{crumb.label}</span>
              ) : (
                <span aria-current="page" className="px-1 py-0.5 font-extrabold text-white">
                  {crumb.shortLabel ? (
                    <>
                      <span className="sm:hidden">{crumb.shortLabel}</span>
                      <span className="max-sm:hidden">{crumb.label}</span>
                    </>
                  ) : (
                    crumb.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface PageHeroProps {
  crumbs: readonly Crumb[];
  eyebrow: string;
  /** Path for the eyebrow's round icon. */
  eyebrowIcon: string;
  /** Background of the eyebrow icon and of the big decorative disc, e.g. "bg-sun". */
  accentClassName: string;
  title: ReactNode;
  titleId?: string;
  lead?: ReactNode;
  leadClassName?: string;
  /** Chips / notices under the lead. */
  children?: ReactNode;
  /** CTA pills. */
  actions?: ReactNode;
  /** White card on the right (desktop); hidden below `asideFrom`. */
  aside?: ReactNode;
  /** Breakpoint from which the aside card is shown (default lg). */
  asideFrom?: "md" | "lg";
}

/**
 * Navy subpage hero (Arak / Szolgaltatas): dotted texture, accent disc + mint ring,
 * breadcrumb pill, eyebrow, H1, lead, actions and an optional white card on the right.
 */
export function PageHero({
  crumbs,
  eyebrow,
  eyebrowIcon,
  accentClassName,
  title,
  titleId,
  lead,
  leadClassName,
  children,
  actions,
  aside,
  asideFrom = "lg",
}: PageHeroProps) {
  return (
    <section aria-labelledby={titleId}>
      <div className="relative flex flex-wrap items-center gap-12 overflow-hidden rounded-panel bg-navy px-5 pt-5 pb-6 text-white sm:px-10 sm:py-12 lg:min-h-[640px] lg:rounded-hero lg:px-[clamp(20px,5vw,64px)] lg:py-[clamp(28px,5vw,72px)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.08)_1.2px,transparent_1.6px)] bg-[length:18px_18px] lg:bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] lg:bg-[length:26px_26px]"
        />
        <div
          aria-hidden="true"
          className={cn(
            "absolute -top-[70px] -right-[70px] h-[200px] w-[200px] rounded-full opacity-20",
            "lg:top-auto lg:-right-[150px] lg:-bottom-[250px] lg:h-[560px] lg:w-[560px] lg:opacity-[.92]",
            accentClassName,
          )}
        />
        <div
          aria-hidden="true"
          className="absolute -right-[260px] -bottom-[330px] hidden h-[780px] w-[780px] rounded-full border-[1.5px] border-mint-light/30 lg:block"
        />

        <div className="relative flex min-w-0 flex-[1_1_520px] flex-col gap-3.5 lg:gap-[26px]">
          <HeroBreadcrumb crumbs={crumbs} />
          <span className="inline-flex items-center gap-2.5 text-xs font-bold tracking-[.14em] text-mint-light uppercase md:text-[13px]">
            <span
              className={cn(
                "hidden h-[30px] w-[30px] items-center justify-center rounded-full text-navy md:inline-flex",
                accentClassName,
              )}
            >
              <PathIcon d={eyebrowIcon} size={16} strokeWidth={2.2} />
            </span>
            {eyebrow}
          </span>
          <h1
            id={titleId}
            className="fade-up m-0 max-w-[720px] text-[31px] leading-[1.08] font-extrabold tracking-[-0.025em] sm:text-5xl lg:text-[clamp(36px,4.6vw,60px)] lg:leading-[1.04] lg:tracking-[-0.03em]"
          >
            {title}
          </h1>
          {lead && (
            <p
              className={cn(
                "fade-up m-0 max-w-[620px] text-[15px] leading-[1.6] text-navy-soft [--i:1] lg:text-lg lg:leading-[1.65]",
                leadClassName,
              )}
            >
              {lead}
            </p>
          )}
          {children}
          {actions && <div className="flex flex-wrap gap-3 pt-1">{actions}</div>}
        </div>

        {aside && (
          <div
            className={cn(
              "relative hidden min-w-[min(100%,300px)] flex-[0_1_460px]",
              asideFrom === "md" ? "md:block" : "lg:block",
            )}
          >
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}

/** White card shell used on the right of the hero. */
export function HeroCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "fade-up flex flex-col gap-3.5 rounded-panel bg-white p-[clamp(20px,3vw,30px)] text-navy shadow-[0_40px_80px_-40px_rgba(10,12,40,.65)] [--i:2]",
        className,
      )}
    >
      {children}
    </div>
  );
}
