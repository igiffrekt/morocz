"use client";

import { useId } from "react";
import { formatLongDate, toDateString } from "@/lib/booking-dates";
import { cn } from "@/lib/cn";

/** Hungarian weekday abbreviations, Monday-first. */
export const HU_WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("hu-HU", { year: "numeric", month: "long" });
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={dir === "left" ? "arrow-back" : "arrow"}
    >
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

interface MonthCalendarProps {
  viewYear: number;
  viewMonth: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  todayStr: string;
  selectedDate: string | null;
  /** True when the day can be picked (schedule + API availability). */
  isBookable: (dateStr: string) => boolean;
  onSelect: (dateStr: string) => void;
  /** Smaller cells and icon-only month buttons (reschedule panel). */
  compact?: boolean;
  showLegend?: boolean;
  footnote?: string;
  className?: string;
}

/**
 * Custom month grid (no native date input): only bookable days are enabled, the chosen
 * day pops in navy, bookable days carry a mint ring and a small dot.
 */
export function MonthCalendar({
  viewYear,
  viewMonth,
  canPrev,
  canNext,
  onPrev,
  onNext,
  todayStr,
  selectedDate,
  isBookable,
  onSelect,
  compact = false,
  showLegend = true,
  footnote,
  className,
}: MonthCalendarProps) {
  const titleId = `cal-${useId().replace(/:/g, "")}`;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const lead = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells: Array<{ day: number; dateStr: string } | null> = [
    ...Array.from<null>({ length: lead }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      dateStr: toDateString(viewYear, viewMonth, i + 1),
    })),
  ];

  const navBase =
    "btn-lift inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full text-[13px] font-bold disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col bg-field",
        compact ? "gap-3 rounded-[28px] p-4" : "gap-4 rounded-[32px] p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Előző hónap"
          className={cn(
            navBase,
            "border-[1.5px] border-line bg-white text-navy",
            compact ? "w-11" : "w-11 sm:w-auto sm:px-4",
          )}
        >
          <Chevron dir="left" />
          {!compact && <span className="max-sm:hidden">Előző hónap</span>}
        </button>
        <span
          id={titleId}
          aria-live="polite"
          className={cn(
            "text-center font-extrabold whitespace-nowrap text-navy",
            compact ? "text-base" : "text-[17px]",
          )}
        >
          {formatMonthYear(viewYear, viewMonth)}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Következő hónap"
          className={cn(navBase, "bg-navy text-white", compact ? "w-11" : "w-11 sm:w-auto sm:px-4")}
        >
          {!compact && <span className="max-sm:hidden">Következő hónap</span>}
          <Chevron dir="right" />
        </button>
      </div>

      <div aria-hidden="true" className="grid grid-cols-7 gap-1">
        {HU_WEEKDAYS.map((d) => (
          <span
            key={d}
            className={cn(
              "py-1 text-center font-extrabold tracking-[.04em] text-muted",
              compact ? "text-[11px]" : "text-xs",
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: labelled button group; a fieldset would bring native borders */}
      <div role="group" aria-labelledby={titleId} className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) {
            // biome-ignore lint/suspicious/noArrayIndexKey: leading blanks have no identity
            return <span key={`blank-${idx}`} aria-hidden="true" />;
          }
          const { day, dateStr } = cell;
          const ok = isBookable(dateStr);
          const on = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const longLabel = formatLongDate(dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => ok && onSelect(dateStr)}
              disabled={!ok && !on}
              aria-pressed={on}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${longLabel} – ${on ? "kiválasztva" : ok ? "foglalható" : "nem foglalható"}`}
              className={cn(
                "relative mx-auto inline-flex aspect-square w-full items-center justify-center rounded-full border-[1.5px] p-0 tabular-nums",
                "transition-[background-color,color,transform,box-shadow] duration-300 ease-bento",
                compact
                  ? "max-h-[46px] min-h-10 max-w-[46px] text-sm"
                  : "max-h-14 min-h-11 max-w-14 text-[15px]",
                on
                  ? "pop-in border-navy bg-navy font-extrabold text-white shadow-[0_10px_22px_-12px_rgba(36,42,95,.8)]"
                  : ok
                    ? "border-mint bg-white font-extrabold text-navy hover:-translate-y-0.5 hover:bg-sage"
                    : "cursor-not-allowed border-transparent bg-transparent font-medium text-disabled-ink",
                isToday && !on && "shadow-[inset_0_0_0_2px_var(--color-line)]",
              )}
            >
              {day}
              {ok && !on && !compact && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-teal-ink"
                />
              )}
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-[1.5px] border-mint bg-white" />
            Szabad nap
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-navy" />
            Kiválasztva
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#e4e7ef]" />
            Nem foglalható
          </span>
        </div>
      )}
      {footnote && <span className="text-[13px] leading-normal text-muted">{footnote}</span>}
    </div>
  );
}
