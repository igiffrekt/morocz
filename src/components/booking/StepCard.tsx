import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** White step card of the booking flow (32 / 36 px radius). */
export function StepCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "flex flex-col gap-7 rounded-[32px] bg-white p-4 sm:rounded-[36px] sm:p-[clamp(20px,3vw,36px)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Left arrow that nudges left on hover inside a `.btn-lift` pill ("Vissza"). */
export function BackArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="arrow-back shrink-0"
    >
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}
