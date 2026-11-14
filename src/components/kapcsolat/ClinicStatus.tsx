"use client";

import { Fragment } from "react";
import { useNow } from "@/hooks/useNow";
import {
  budapestClock,
  type ClinicSchedule,
  type ClinicState,
  clinicStatus,
} from "@/lib/clinic-status";
import { cn } from "@/lib/cn";
import type { OpeningDay } from "@/lib/opening-hours";

const TONES: Record<ClinicState | "idle", { pill: string; dot: string }> = {
  open: { pill: "bg-mint-pale text-[#1f5f5a]", dot: "bg-teal-ink" },
  later: { pill: "bg-sun-soft text-[#5c4307]", dot: "bg-sun" },
  closed: { pill: "bg-canvas text-muted-strong", dot: "bg-disabled-ink" },
  idle: { pill: "bg-canvas text-muted-strong", dot: "bg-disabled-ink" },
};

interface ClinicStatusProps {
  schedule: ClinicSchedule;
  /** Days with consultation in the schedule in force today (no closed days). */
  openDays: OpeningDay[];
}

function useStatus(schedule: ClinicSchedule) {
  const now = useNow();
  if (now == null) return { status: null, today: null };
  return { status: clinicStatus(schedule, now), today: budapestClock(now).dayOfWeek };
}

/** Kapcsolat hero card: live status + next session + the consulting days of the week. */
export function ClinicStatusCard({ schedule, openDays }: ClinicStatusProps) {
  const { status, today } = useStatus(schedule);
  const tone = TONES[status?.state ?? "idle"];

  return (
    <div className="fade-up flex min-w-0 flex-col gap-4 rounded-panel bg-white p-[26px] text-navy shadow-[0_30px_60px_-30px_rgba(0,0,0,.5)] [--i:2]">
      {/* biome-ignore lint/a11y/useSemanticElements: a live status pill, not a form result (<output>) */}
      <span
        role="status"
        className={cn(
          "inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-[13px] font-extrabold whitespace-nowrap transition-colors duration-500",
          tone.pill,
        )}
      >
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-full", tone.dot, status && "animate-pulse")}
        />
        {status?.title ?? "Rendelési idő"}
      </span>

      <div className="flex min-h-[58px] flex-col gap-1">
        {status?.nextValue && (
          <>
            <span className="text-[13px] font-bold text-muted">{status.nextLabel}</span>
            <span className="text-2xl leading-[1.2] font-extrabold tracking-[-0.02em]">
              {status.nextValue.split(" · ").map((part, index) => (
                <span key={part} className={cn("block", index > 0 && "tabular-nums")}>
                  {part}
                </span>
              ))}
            </span>
          </>
        )}
      </div>

      {openDays.length > 0 && (
        <ul aria-label="Rendelési napok" className="m-0 flex list-none gap-2 p-0">
          {openDays.map((day) => {
            const [start, end] = day.hours.split(" – ");
            const isToday = day.dayOfWeek === today;
            return (
              <li
                key={day.dayOfWeek}
                className={cn(
                  "flex min-w-0 flex-[1_1_0] flex-col items-center gap-0.5 rounded-[999px] bg-sage px-1.5 py-3 text-center text-navy transition-shadow duration-500",
                  isToday && "shadow-[inset_0_0_0_2px_var(--color-navy)]",
                )}
              >
                <span className="max-w-full truncate text-xs font-extrabold">
                  {day.name}
                  {isToday && <span className="sr-only"> (ma)</span>}
                </span>
                <span className="text-[11px] leading-[1.3] font-bold tabular-nums">{start}</span>
                <span className="text-[11px] leading-[1.3] font-bold tabular-nums">
                  <span className="sr-only">–</span>
                  {end}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <span className="text-[13px] text-muted">
        Telefonon csak a rendelési időben vagyunk elérhetőek.
      </span>
    </div>
  );
}

/** Compact status pill for the phone hero. */
export function ClinicStatusPill({ schedule }: Pick<ClinicStatusProps, "schedule">) {
  const { status } = useStatus(schedule);
  const dot =
    status?.state === "open" ? "bg-mint" : status?.state === "later" ? "bg-sun" : "bg-disabled-ink";
  return (
    // biome-ignore lint/a11y/useSemanticElements: a live status line, not a form result (<output>)
    <div role="status" className="relative flex min-h-[58px] flex-col items-start gap-2">
      <span className="inline-flex h-[38px] items-center gap-2.5 rounded-full border border-white/14 bg-white/8 pr-4 pl-3 text-[13px] font-bold whitespace-nowrap">
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 shrink-0 rounded-full", dot, status && "animate-pulse")}
        />
        {status?.title ?? "Rendelési idő"}
      </span>
      {status?.nextValue && (
        <span className="text-[13px] leading-snug text-navy-soft">
          {status.nextLabel}:{" "}
          <strong className="font-bold text-white">
            {/* Keep "Kedd, november 17." and "13:20 – 16:40" each on one line. */}
            {status.nextValue.split(" · ").map((part, index) => (
              <Fragment key={part}>
                {index > 0 && " · "}
                <span className="whitespace-nowrap">{part}</span>
              </Fragment>
            ))}
          </strong>
        </span>
      )}
    </div>
  );
}
