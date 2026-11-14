import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PillVariant = "navy" | "mint" | "pink" | "outline" | "ghost";
export type PillSize = "sm" | "md" | "lg";

const VARIANTS: Record<PillVariant, string> = {
  navy: "bg-navy text-white hover:bg-navy-deep hover:text-white",
  mint: "bg-mint-light text-navy hover:bg-mint hover:text-navy",
  pink: "bg-blush text-navy hover:text-navy",
  outline: "border-[1.5px] border-line bg-white text-navy hover:border-navy hover:text-navy",
  ghost: "bg-transparent text-navy hover:bg-sage hover:text-navy hover:shadow-none",
};

const SIZES: Record<PillSize, string> = {
  sm: "h-10 gap-2 px-4 text-[13px]",
  md: "h-12 gap-2 px-[22px] text-sm",
  lg: "h-[58px] gap-2.5 px-[30px] text-base",
};

interface PillStyleOptions {
  variant?: PillVariant;
  size?: PillSize;
  fullWidth?: boolean;
  className?: string;
}

/** Class string shared by every pill-shaped call to action. Never wraps its label. */
export function pillClassName({
  variant = "navy",
  size = "md",
  fullWidth = false,
  className,
}: PillStyleOptions = {}): string {
  return cn(
    "btn-lift inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-extrabold no-underline",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

export function ArrowIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("arrow shrink-0", className)}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

interface PillContentProps {
  children: ReactNode;
  arrow?: boolean;
  icon?: ReactNode;
}

function PillContent({ children, arrow, icon }: PillContentProps) {
  return (
    <>
      {icon}
      {children}
      {arrow && <ArrowIcon />}
    </>
  );
}

type PillButtonProps = PillStyleOptions &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    /** Trailing arrow that nudges right on hover. */
    arrow?: boolean;
    /** Leading icon. */
    icon?: ReactNode;
  };

export function PillButton({
  variant,
  size,
  fullWidth,
  className,
  arrow,
  icon,
  children,
  type = "button",
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={type}
      className={pillClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      <PillContent arrow={arrow} icon={icon}>
        {children}
      </PillContent>
    </button>
  );
}

type PillLinkProps = PillStyleOptions &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
    arrow?: boolean;
    icon?: ReactNode;
  };

/** Internal paths use next/link; tel:, mailto:, hash-only and absolute URLs a plain <a>. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function PillLink({
  href,
  variant,
  size,
  fullWidth,
  className,
  arrow,
  icon,
  children,
  ...rest
}: PillLinkProps) {
  const classes = pillClassName({ variant, size, fullWidth, className });
  const content = (
    <PillContent arrow={arrow} icon={icon}>
      {children}
    </PillContent>
  );
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...rest}>
      {content}
    </a>
  );
}
