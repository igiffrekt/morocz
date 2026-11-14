import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  /** Small uppercase teal label above the title. */
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Heading level (default h2). */
  as?: ElementType;
  id?: string;
  /** "dark" = on navy surfaces. */
  tone?: "light" | "dark";
  align?: "start" | "center";
  /** Right-hand slot (tabs, notes, links); wraps below on narrow screens. */
  aside?: ReactNode;
  className?: string;
}

/**
 * Bento Pro section header: eyebrow + h2 + lead. (The older `SectionHeader` is kept
 * for pages that have not been redesigned yet.)
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  as: Heading = "h2",
  id,
  tone = "light",
  align = "start",
  aside,
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  const intro = (
    <div
      className={cn(
        "flex max-w-[680px] flex-col gap-3",
        align === "center" && "mx-auto items-center text-center",
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "text-[13px] font-bold uppercase tracking-[.14em]",
            dark ? "text-mint-light" : "text-teal-ink",
          )}
        >
          {eyebrow}
        </span>
      )}
      <Heading
        id={id}
        className={cn(
          "m-0 text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[44px] lg:text-[52px]",
          dark ? "text-white" : "text-navy",
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p
          className={cn(
            "m-0 text-base leading-relaxed lg:text-lg",
            dark ? "text-navy-soft" : "text-muted",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );

  if (!aside) return <div className={className}>{intro}</div>;

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      {intro}
      {aside}
    </div>
  );
}
