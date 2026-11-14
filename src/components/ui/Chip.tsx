import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipTone = "white" | "canvas" | "sage" | "mint" | "sun" | "coral" | "blush" | "navy";

const TONES: Record<ChipTone, string> = {
  white: "bg-white text-navy",
  canvas: "bg-canvas text-navy",
  sage: "bg-sage text-navy",
  mint: "bg-mint-pale text-teal-ink",
  sun: "bg-sun-soft text-navy",
  coral: "bg-coral-soft text-navy",
  blush: "bg-blush-soft text-navy",
  navy: "bg-navy text-white",
};

const SIZES = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4 text-[13px]",
} as const;

interface ChipBaseProps {
  tone?: ChipTone;
  size?: keyof typeof SIZES;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

function chipClassName({
  tone = "white",
  size = "md",
  className,
}: Omit<ChipBaseProps, "children">) {
  return cn(
    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-bold",
    TONES[tone],
    SIZES[size],
    className,
  );
}

/** Static label pill (badges, “+ Felár”, meta tags). */
export function Chip({
  tone,
  size,
  icon,
  children,
  className,
  ...rest
}: ChipBaseProps & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">) {
  return (
    <span className={chipClassName({ tone, size, className })} {...rest}>
      {icon}
      {children}
    </span>
  );
}

/**
 * Toggleable filter chip. `selected` switches to the navy fill and is exposed as
 * aria-pressed (wrap a group in role="radiogroup" + role="radio" yourself if the
 * choice is exclusive).
 */
export function ChipButton({
  selected = false,
  size,
  icon,
  children,
  className,
  type = "button",
  ...rest
}: Omit<ChipBaseProps, "tone"> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    selected?: boolean;
  }) {
  return (
    <button
      type={type}
      aria-pressed={rest.role ? undefined : selected}
      className={cn(
        chipClassName({ size }),
        "chip-lift border-[1.5px]",
        selected
          ? "border-navy bg-navy text-white shadow-[0_12px_24px_-14px_rgba(36,42,95,.7)]"
          : "border-line bg-white text-navy hover:border-navy",
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
