import type { ReactNode } from "react";
import { type Crumb, HeroBreadcrumb } from "@/components/subpage/PageHero";
import { cn } from "@/lib/cn";

interface BookingHeroProps {
  crumbs: readonly Crumb[];
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Right-hand slot (step indicator, …). */
  aside?: ReactNode;
  /** Decorative disc position: booking = top right, management = bottom left. */
  disc?: "top-right" | "bottom-left";
  className?: string;
}

/**
 * Compact navy hero of the booking flow pages (Idopontfoglalas / IdopontKezelese):
 * dotted texture, a soft mint disc, breadcrumb pill, eyebrow and H1.
 */
export function BookingHero({
  crumbs,
  eyebrow,
  title,
  lead,
  aside,
  disc = "top-right",
  className,
}: BookingHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[32px] bg-navy text-white lg:rounded-hero",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:26px_26px]"
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute rounded-full bg-mint",
          disc === "top-right"
            ? "-top-[170px] -right-[90px] h-[380px] w-[380px] opacity-[.16]"
            : "-bottom-[260px] -left-[140px] h-[420px] w-[420px] opacity-[.14]",
        )}
      />
      <div className="relative flex flex-wrap items-end justify-between gap-7 px-5 py-6 sm:px-[clamp(20px,4vw,56px)] sm:py-10">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3 sm:gap-4">
          <HeroBreadcrumb crumbs={crumbs} />
          <span className="text-xs font-bold tracking-[.14em] text-mint-light uppercase sm:text-[13px]">
            {eyebrow}
          </span>
          <h1 className="fade-up m-0 text-[34px] leading-[1.04] font-extrabold tracking-[-0.03em] sm:text-[clamp(40px,5vw,60px)] sm:leading-[1.02]">
            {title}
          </h1>
          {lead && (
            <p className="fade-up m-0 max-w-[640px] text-[15px] leading-relaxed text-navy-soft [--i:1] sm:text-[17px]">
              {lead}
            </p>
          )}
        </div>
        {aside}
      </div>
    </section>
  );
}
