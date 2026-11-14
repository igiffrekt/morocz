import type { ReactNode } from "react";
import { PillLink, type PillVariant } from "@/components/ui/PillButton";
import { cn } from "@/lib/cn";

interface CtaBandProps {
  eyebrow: string;
  title: string;
  text: ReactNode;
  href: string;
  label: string;
  /** Band surface + text colour, e.g. "bg-blush text-navy". */
  className?: string;
  buttonVariant?: PillVariant;
  buttonClassName?: string;
  /** Extra controls next to the main button (phone, e-mail …). */
  extra?: ReactNode;
}

/** Full-width coloured booking band with two decorative circles (Arak / Szolgaltatas). */
export function CtaBand({
  eyebrow,
  title,
  text,
  href,
  label,
  className = "bg-blush text-navy",
  buttonVariant = "navy",
  buttonClassName,
  extra,
}: CtaBandProps) {
  return (
    <section aria-label={eyebrow}>
      <div
        className={cn(
          "relative flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-[32px] p-6 sm:p-10 lg:rounded-hero lg:p-14",
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="absolute -top-[210px] -right-[100px] h-[420px] w-[420px] rounded-full bg-white/20"
        />
        <div
          aria-hidden="true"
          className="absolute right-[200px] -bottom-[170px] hidden h-[260px] w-[260px] rounded-full border-[1.5px] border-white/40 md:block"
        />
        <div className="relative flex max-w-[720px] flex-col gap-3">
          <span className="text-xs font-extrabold tracking-[.14em] uppercase opacity-85 md:text-[13px]">
            {eyebrow}
          </span>
          <h2 className="m-0 text-[28px] leading-[1.1] font-extrabold tracking-[-0.02em] md:text-[clamp(32px,3.4vw,44px)]">
            {title}
          </h2>
          <p className="m-0 text-[15px] leading-relaxed md:text-lg">{text}</p>
        </div>
        <div className="relative flex w-full flex-wrap gap-3 sm:w-auto">
          {extra}
          <PillLink
            href={href}
            variant={buttonVariant}
            size="lg"
            arrow
            className={cn("h-[58px] max-sm:w-full md:h-[60px] md:px-8", buttonClassName)}
          >
            {label}
          </PillLink>
        </div>
      </div>
    </section>
  );
}
