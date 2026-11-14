"use client";

import { cn } from "@/lib/cn";

interface StepIndicatorProps {
  /** 1-based; `steps.length + 1` = finished. */
  currentStep: number;
  steps: string[];
  className?: string;
}

function TickIcon({ size = 14 }: { size?: number }) {
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

/**
 * Hero step indicator (md+): one translucent pill, a mint progress fill that slides to
 * the current step, numbered / ticked step labels.
 */
export function StepIndicator({ currentStep, steps, className }: StepIndicatorProps) {
  const count = steps.length;
  const filled = Math.min(currentStep, count);
  return (
    <ol
      aria-label="Foglalás lépései"
      className={cn(
        "relative m-0 grid w-full max-w-[640px] flex-[1_1_520px] list-none rounded-full border border-white/14 bg-white/8 p-1.5 max-md:hidden",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-mint shadow-[0_10px_24px_-12px_rgba(118,200,182,.9)] transition-[width] duration-[800ms] ease-bento"
        style={{ width: `calc((100% - 12px) * ${filled} / ${count})` }}
      />
      {steps.map((label, index) => {
        const n = index + 1;
        const done = n < currentStep;
        const current = n === currentStep;
        const isFilled = n <= currentStep;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className={cn(
              "relative z-[1] flex h-[52px] min-w-0 items-center justify-center gap-2.5 rounded-full px-3 text-sm font-extrabold transition-colors duration-500",
              isFilled ? "text-navy" : "text-navy-soft",
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white transition-colors duration-500",
                isFilled ? "bg-navy" : "bg-white/12",
              )}
            >
              {done ? <TickIcon /> : n}
              {done && <span className="sr-only">kész:</span>}
            </span>
            <span className="truncate whitespace-nowrap">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

interface MobileStepProgressProps extends StepIndicatorProps {
  /** Previous step; the round back button is inactive on the first step. */
  onBack?: () => void;
}

/**
 * Phone step progress (MobilFoglalas): sticky under the 68 px mobile header, round back
 * button and three bars that fill as the patient advances.
 */
export function MobileStepProgress({
  currentStep,
  steps,
  onBack,
  className,
}: MobileStepProgressProps) {
  const canGoBack = Boolean(onBack) && currentStep > 1 && currentStep <= steps.length;
  return (
    <div
      className={cn(
        "sticky top-[68px] z-20 -mx-3 bg-canvas/90 px-3 pt-1.5 pb-2.5 backdrop-blur-[16px] md:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Vissza az előző lépéshez"
          disabled={!canGoBack}
          className="tap-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-navy disabled:pointer-events-none disabled:opacity-35"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <ol
          aria-label="Foglalás lépései"
          className="m-0 grid min-w-0 flex-1 list-none gap-1.5 p-0"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((label, index) => {
            const n = index + 1;
            const done = n < currentStep;
            const current = n === currentStep;
            return (
              <li
                key={label}
                aria-current={current ? "step" : undefined}
                className="flex min-w-0 flex-col gap-1.5"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-full bg-[#dde1ea]"
                >
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width,background-color] duration-[600ms] ease-bento",
                      done ? "bg-mint" : "bg-navy",
                    )}
                    style={{ width: done || current ? "100%" : "0%" }}
                  />
                </span>
                <span
                  className={cn(
                    "flex min-w-0 items-center gap-[5px] text-[11px] font-extrabold whitespace-nowrap",
                    current ? "text-navy" : "text-[#6b7280]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] transition-colors duration-[400ms]",
                      done
                        ? "bg-mint text-navy"
                        : current
                          ? "bg-navy text-white"
                          : "bg-[#dde1ea] text-muted",
                    )}
                  >
                    {done ? <TickIcon size={10} /> : n}
                  </span>
                  <span className="truncate">{label}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
