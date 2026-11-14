import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NoticeTone = "error" | "success" | "warning" | "info";

const TONES: Record<NoticeTone, { box: string; badge: string; icon: string }> = {
  error: {
    box: "bg-coral-soft text-danger-ink",
    badge: "bg-coral text-navy",
    icon: "M12 8v5M12 16h.01",
  },
  success: {
    box: "bg-mint-pale text-[#1f5f5a]",
    badge: "bg-mint text-navy",
    icon: "M20 6 9 17l-5-5",
  },
  warning: {
    box: "bg-sun-soft text-[#5c4307] ring-[1.5px] ring-sun ring-inset",
    badge: "bg-sun text-navy",
    icon: "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  },
  info: {
    box: "bg-canvas text-muted-strong",
    badge: "bg-navy text-white",
    icon: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  },
};

interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone: NoticeTone;
  /** "pill": one-line message (auth errors). "box": multi-line card. */
  shape?: "pill" | "box";
  title?: ReactNode;
  /** Hide the round icon badge. */
  plain?: boolean;
  children?: ReactNode;
}

/** Inline status message in the Bento palette (error / success / warning / info). */
export function Notice({
  tone,
  shape = "box",
  title,
  plain = false,
  children,
  className,
  ...rest
}: NoticeProps) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "fade-up flex items-start gap-3 text-sm",
        shape === "pill"
          ? "rounded-tile py-3 pr-5 pl-3 font-bold"
          : "rounded-3xl px-5 py-4 leading-relaxed",
        plain && shape === "pill" && "pl-5",
        t.box,
        className,
      )}
      {...rest}
    >
      {!plain && (
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full",
            t.badge,
          )}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={t.icon} />
          </svg>
        </span>
      )}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1", !plain && "pt-[5px]")}>
        {title && <strong className="text-[15px] font-extrabold text-navy">{title}</strong>}
        {children}
      </div>
    </div>
  );
}
