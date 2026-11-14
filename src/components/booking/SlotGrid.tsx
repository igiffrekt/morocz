"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SlotGridProps {
  /** id of the heading that names the group. */
  labelledBy: string;
  /** 24-hour "HH:MM" start times (free slots only, as /api/slots returns them). */
  slots: string[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  /** Slot currently being held (POST /api/slot-hold in flight). */
  busyTime?: string | null;
  compact?: boolean;
}

/** 24-hour time pills. Buttons with aria-pressed — picking one may call the API. */
export function SlotGrid({
  labelledBy,
  slots,
  selectedTime,
  onSelect,
  busyTime,
  compact = false,
}: SlotGridProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: labelled button group; a fieldset would bring native borders
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={cn(
        "grid",
        compact
          ? "grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5"
          : "grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(92px,1fr))]",
      )}
    >
      {slots.map((time, i) => {
        const on = time === selectedTime;
        const busy = busyTime === time;
        return (
          // Entrance stagger lives on the wrapper so it never fights the hover lift.
          <span
            key={time}
            className="fade-up flex"
            style={{ "--i": Math.min(i, 16) * 0.35 } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => onSelect(time)}
              disabled={busy}
              aria-pressed={on}
              aria-busy={busy || undefined}
              className={cn(
                "w-full rounded-full border-[1.5px] font-extrabold whitespace-nowrap tabular-nums",
                "transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-bento",
                compact ? "h-11 text-sm" : "h-12 text-[15px]",
                on
                  ? "border-navy bg-navy text-white shadow-[0_10px_22px_-12px_rgba(36,42,95,.8)]"
                  : "border-line bg-white text-navy hover:-translate-y-0.5 hover:border-navy active:scale-[.96]",
                busy && "cursor-wait opacity-50",
              )}
            >
              {time}
            </button>
          </span>
        );
      })}
    </div>
  );
}

/** Pill-shaped placeholders while slots load. */
export function SlotSkeleton({
  count = 8,
  compact = false,
}: {
  count?: number;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(92px,1fr))]"
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          key={i}
          className={cn("animate-pulse rounded-full bg-canvas", compact ? "h-11" : "h-12")}
        />
      ))}
    </div>
  );
}

/** Dashed empty-state well ("Válasszon egy napot a naptárból"). */
export function EmptyWell({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fade-up flex flex-col items-center justify-center gap-3.5 rounded-tile border-[1.5px] border-dashed border-line p-6 text-center text-[15px] font-bold text-muted",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage text-teal-ink"
        >
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
        </span>
      )}
      {children}
    </div>
  );
}
