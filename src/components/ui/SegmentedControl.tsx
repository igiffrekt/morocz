"use client";

import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  /** `null` = nothing chosen yet: the indicator stays hidden until the first pick. */
  value: T | null;
  onChange: (value: T) => void;
  /** Accessible name — pass either this or `labelledBy`. */
  label?: string;
  labelledBy?: string;
  /** "light" = canvas track (on white cards), "white" = white track (on canvas). */
  tone?: "light" | "white";
  size?: "md" | "lg";
  className?: string;
}

/**
 * Single-choice pill switch (role="radiogroup") with a navy indicator that slides
 * under the selected option. Arrow keys move the selection, as with native radios.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  tone = "light",
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = Math.max(options.length, 1);
  const found = options.findIndex((o) => o.value === value);
  const hasValue = found >= 0;
  const selected = Math.max(found, 0);

  const move = (from: number, step: number) => {
    for (let i = 1; i <= options.length; i++) {
      const next = (from + step * i + options.length) % options.length;
      const option = options[next];
      if (option && !option.disabled) {
        onChange(option.value);
        refs.current[next]?.focus();
        return;
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn(
        "relative grid rounded-full p-[5px]",
        tone === "light" ? "bg-canvas" : "bg-white",
        size === "lg" ? "h-[84px]" : "h-[58px]",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "slide-indicator absolute top-[5px] bottom-[5px] left-[5px] rounded-full bg-navy shadow-indicator",
          "transition-[transform,opacity] duration-[550ms]",
          !hasValue && "opacity-0",
        )}
        style={{
          width: `calc((100% - 10px) / ${count})`,
          transform: `translateX(${selected * 100}%)`,
        }}
      />
      {options.map((option, index) => {
        const isOn = hasValue && index === selected;
        // Roving tab stop: the chosen option, or the first one while nothing is chosen.
        const isTabStop = index === selected;
        return (
          // biome-ignore lint/a11y/useSemanticElements: design-drawn radio (no native inputs, see PLAN.md)
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isOn}
            disabled={option.disabled}
            tabIndex={isTabStop ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "relative z-[1] whitespace-nowrap rounded-full border-0 bg-transparent px-2 text-sm font-extrabold transition-colors duration-[400ms]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isOn ? "text-white" : "text-navy",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
