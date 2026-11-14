"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

function Tick({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface CheckboxPillProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  /** id of the panel the checkbox reveals. */
  controls?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Design-drawn checkbox shaped as a pill with a round tick on the left
 * ("Céges számlát kérek"). role="checkbox" button — Space / Enter toggle it.
 */
export function CheckboxPill({
  checked,
  onChange,
  children,
  controls,
  disabled,
  className,
}: CheckboxPillProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: design-drawn checkbox (no native inputs, see PLAN.md)
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-controls={controls}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "chip-lift inline-flex min-h-[52px] max-w-full items-center gap-3 self-start rounded-full border-[1.5px] py-2 pr-[22px] pl-2 text-left text-[15px] font-extrabold text-navy",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-mint bg-sage" : "border-line bg-white hover:border-navy",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,color] duration-300",
          checked ? "border-navy bg-navy text-white" : "border-line bg-canvas text-transparent",
        )}
      >
        <Tick />
      </span>
      {children}
    </button>
  );
}

interface CheckboxRowProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Label content — may contain links (they stay separately focusable). */
  children: ReactNode;
  required?: boolean;
  invalid?: boolean;
  /** id of an error message to announce with the checkbox. */
  errorId?: string;
  size?: "md" | "sm";
  className?: string;
}

/**
 * Round tick box + rich label (consents). The box is a role="checkbox" button named by
 * the label via aria-labelledby; clicking the label text toggles it too (native <label>).
 */
export function CheckboxRow({
  id,
  checked,
  onChange,
  children,
  required,
  invalid,
  errorId,
  size = "md",
  className,
}: CheckboxRowProps) {
  const labelId = `${id}-label`;
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-[28px] py-1.5 pr-3.5 pl-1.5 transition-colors duration-300",
        invalid ? "bg-coral-soft" : "bg-transparent",
        className,
      )}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: design-drawn checkbox (no native inputs, see PLAN.md) */}
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] p-0",
          "transition-[background-color,border-color,color,transform] duration-300 ease-bento active:scale-[.92]",
          size === "sm" ? "h-10 w-10" : "h-11 w-11",
          checked
            ? "border-navy bg-navy text-white"
            : cn("bg-white text-transparent", invalid ? "border-danger" : "border-[#b9bfd3]"),
        )}
      >
        <Tick size={16} />
      </button>
      {/* A <label> for the button: clicking the text toggles it, links inside stay links. */}
      <label
        id={labelId}
        htmlFor={id}
        className={cn(
          "cursor-pointer leading-normal text-muted-strong",
          size === "sm" ? "pt-2.5 text-sm" : "pt-[11px] text-[15px]",
        )}
      >
        {children}
        {required && (
          <span aria-hidden="true" className="ml-1 font-extrabold text-danger">
            *
          </span>
        )}
      </label>
    </div>
  );
}
