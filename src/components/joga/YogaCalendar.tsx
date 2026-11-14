"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useId, useState } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { ChipButton } from "@/components/ui/Chip";
import { TabList, TabPanel } from "@/components/ui/Tabs";
import { toMinutes } from "@/lib/clinic-status";
import { cn } from "@/lib/cn";
import {
  durationLabel,
  hourRange,
  YOGA_DAY_NAMES,
  YOGA_DAY_SHORT,
  type YogaClassType,
  type YogaInstructor,
  type YogaSession,
} from "@/lib/yoga";

const ROW = 56;
const FILTER_PATH = "M22 3H2l8 9.46V19l4 2v-8.54L22 3z";

interface YogaCalendarProps {
  sessions: YogaSession[];
  classes: YogaClassType[];
  instructors: YogaInstructor[];
  /** Today on the Monday-first scale, null until the client clock is known. */
  today: number | null;
  onOpenSession: (id: string) => void;
  onOpenInstructor: (slug: string) => void;
}

function Dot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(36,42,95,.12)]"
      style={{ background: color, width: size, height: size }}
    />
  );
}

/** Lélekző órarend: week grid (tablet/desktop), day strip + list (phones). */
export function YogaCalendar({
  sessions,
  classes,
  instructors,
  today,
  onOpenSession,
  onOpenInstructor,
}: YogaCalendarProps) {
  const idBase = useId().replace(/:/g, "");
  const [filter, setFilter] = useState("");
  const [day, setDay] = useState("1");

  const { from, to } = hourRange(sessions);
  const rows = to - from;
  const gridHeight = rows * ROW;
  const hours = Array.from({ length: rows + 1 }, (_, k) => from + k);
  const instructorOf = (name: string) => instructors.find((i) => i.name === name) ?? null;

  // Phone strip: Mon–Fri, plus the weekend when there is a class on it.
  const stripDays = [1, 2, 3, 4, 5, 6, 7].filter(
    (d) => d <= 5 || sessions.some((s) => s.day === d),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: jump to today only when the client weekday becomes known
  useEffect(() => {
    if (today != null && stripDays.includes(today)) setDay(String(today));
  }, [today]);

  const selectedDay = Number(day);
  const daySessions = sessions.filter(
    (s) => s.day === selectedDay && (!filter || s.className === filter),
  );
  const nextDayWithFilter = filter
    ? sessions.find((s) => s.className === filter && s.day !== selectedDay)?.day
    : undefined;

  const filters = [{ name: "", color: "" }, ...classes];

  return (
    <section
      id="orarend"
      aria-labelledby="orarend-cim"
      className="mt-10 flex scroll-mt-28 flex-col gap-3 md:mt-24 md:gap-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 px-1.5 md:px-0">
        <div className="flex flex-col gap-1 md:gap-2.5">
          <span className="text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase md:text-[13px] md:font-bold">
            Heti órarend
          </span>
          <h2
            id="orarend-cim"
            className="m-0 text-[26px] leading-[1.05] font-extrabold tracking-[-0.02em] text-navy md:text-[44px] md:tracking-[-0.03em] lg:text-[52px]"
          >
            Jóga órarend
          </h2>
        </div>
        <span className="hidden text-sm font-semibold text-muted md:inline">
          Kattintson egy órára a részletekért.
        </span>
      </div>

      {/* Filter chips: dim the others on the grid, filter the phone list */}
      {classes.length > 1 && (
        <fieldset className="scrollbar-none -mx-3 m-0 flex min-w-0 items-center gap-1.5 overflow-x-auto border-0 px-3 pt-0.5 pb-1 md:mx-0 md:flex-wrap md:gap-2 md:overflow-visible md:px-0">
          <legend className="sr-only">Óratípus szűrő</legend>
          <span className="mr-1 hidden text-[#6b7280] md:inline-flex">
            <PathIcon d={FILTER_PATH} size={20} strokeWidth={2} />
          </span>
          {filters.map((f) => {
            const on = filter === f.name;
            return (
              <ChipButton
                key={f.name || "osszes"}
                selected={on}
                onClick={() => setFilter(on && f.name ? "" : f.name)}
                icon={f.color ? <Dot color={f.color} /> : undefined}
                className={cn(
                  "h-[42px] gap-2 px-[18px] text-sm",
                  !on && "border-white",
                  !on && filter && "opacity-75",
                )}
              >
                {f.name || "Összes"}
              </ChipButton>
            );
          })}
        </fieldset>
      )}

      {sessions.length === 0 && (
        <div className="rounded-panel bg-white p-10 text-center text-muted">
          Hamarosan frissül az órarend…
        </div>
      )}

      {/* ── Week grid ── */}
      {sessions.length > 0 && (
        <div className="hidden overflow-x-auto rounded-panel bg-white p-5 md:block">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-x-1.5 pb-3">
              <span />
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <span
                  key={d}
                  className={cn(
                    "rounded-full px-1.5 py-2.5 text-center text-sm font-extrabold transition-colors duration-500",
                    d === today ? "bg-navy text-white" : "bg-canvas text-navy",
                  )}
                >
                  {YOGA_DAY_NAMES[d]}
                  {d === today && <span className="sr-only"> (ma)</span>}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-x-1.5">
              <div aria-hidden="true" className="relative" style={{ height: gridHeight }}>
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className="absolute right-2.5 text-xs font-bold text-[#6b7280] tabular-nums"
                    style={{ top: (hour - from) * ROW - 8 }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <div
                  key={d}
                  className={cn(
                    "relative rounded-2xl bg-[linear-gradient(#e6e9f0_1px,transparent_1px)] transition-colors duration-500",
                    d === today ? "bg-[#f4f8f6]" : "bg-[#fbfbfd]",
                  )}
                  style={{ height: gridHeight, backgroundSize: `100% ${ROW}px` }}
                >
                  {sessions
                    .filter((s) => s.day === d)
                    .map((s) => {
                      const top = ((toMinutes(s.start) - from * 60) / 60) * ROW;
                      const height = ((toMinutes(s.end) - toMinutes(s.start)) / 60) * ROW;
                      const dim = Boolean(filter) && filter !== s.className;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onOpenSession(s.id)}
                          aria-label={`${s.className}, ${YOGA_DAY_NAMES[d]} ${s.start}–${s.end}${s.instructor ? `, ${s.instructor}` : ""}`}
                          className={cn(
                            "absolute right-1 left-1 flex flex-col items-start gap-0.5 overflow-hidden rounded-[18px] border-0 px-3 py-2 text-left",
                            "transition-[transform,box-shadow,opacity,filter] duration-300 ease-bento hover:z-10 hover:-translate-y-0.5 hover:shadow-lift active:scale-[.98]",
                            dim && "opacity-25 saturate-[.4]",
                          )}
                          style={
                            {
                              top: top + 3,
                              height: height - 6,
                              background: s.color,
                              color: s.ink,
                            } as CSSProperties
                          }
                        >
                          <span className="line-clamp-2 text-[13px] leading-[1.25] font-extrabold">
                            {s.className}
                          </span>
                          <span className="text-xs font-semibold tabular-nums opacity-85">
                            {s.start}–{s.end}
                          </span>
                          {height >= 80 && s.instructor && (
                            <span className="truncate text-xs opacity-85">{s.instructor}</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Phone: day strip + list ── */}
      {sessions.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          <TabList
            idBase={idBase}
            label="Napok"
            value={day}
            onChange={setDay}
            className="p-1"
            items={stripDays.map((d) => {
              const has = sessions.some((s) => s.day === d && (!filter || s.className === filter));
              const on = d === selectedDay;
              return {
                value: String(d),
                label: (
                  <span className="flex flex-col items-center gap-[3px] text-sm">
                    <span aria-hidden="true">{YOGA_DAY_SHORT[d]}</span>
                    <span className="sr-only">{YOGA_DAY_NAMES[d]}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-[5px] w-[5px] rounded-full",
                        has ? (on ? "bg-mint-light" : "bg-mint") : "bg-transparent",
                      )}
                    />
                  </span>
                ),
              };
            })}
          />
          <TabPanel
            key={`${day}-${filter}`}
            idBase={idBase}
            value={day}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between px-1.5">
              <strong className="text-[15px] text-navy">
                {YOGA_DAY_NAMES[selectedDay]}
                {selectedDay === today && <span className="font-semibold text-muted"> · ma</span>}
              </strong>
              <span className="text-xs font-bold text-muted">
                {daySessions.length ? `${daySessions.length} óra` : ""}
              </span>
            </div>
            {daySessions.length === 0 && (
              <div className="fade-up flex flex-col items-center gap-3 rounded-[26px] bg-white px-[18px] py-[22px] text-center">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage text-yoga">
                  <PathIcon d={ICON_PATHS.cal} size={20} />
                </span>
                <span className="text-sm text-muted">
                  {filter ? "Ezen a napon nincs ilyen óra." : "Ezen a napon nincs óra."}
                </span>
                {nextDayWithFilter && (
                  <button
                    type="button"
                    onClick={() => setDay(String(nextDayWithFilter))}
                    className="tap-press min-h-11 rounded-full border-0 bg-yoga px-[18px] text-sm font-extrabold whitespace-nowrap text-white"
                  >
                    Ugrás: {YOGA_DAY_NAMES[nextDayWithFilter]}
                  </button>
                )}
              </div>
            )}
            {daySessions.map((s, index) => {
              const person = instructorOf(s.instructor);
              const duration = durationLabel(s.start, s.end);
              return (
                <div
                  key={s.id}
                  className="fade-up flex items-center gap-2 rounded-[24px] bg-white py-2 pr-2 pl-3"
                  style={{ "--i": index } as CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => onOpenSession(s.id)}
                    className="tap-press flex min-w-0 flex-1 items-center gap-3 rounded-[20px] border-0 bg-transparent py-1.5 text-left text-navy"
                  >
                    <span
                      aria-hidden="true"
                      className="w-1.5 self-stretch rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className="flex min-w-[56px] flex-col">
                      <strong className="text-lg tabular-nums">{s.start}</strong>
                      <span className="text-xs text-muted tabular-nums">– {s.end}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <strong className="text-sm leading-[1.3]">{s.className}</strong>
                      <span className="flex flex-wrap gap-1">
                        {duration && (
                          <span className="rounded-full bg-mint-pale px-2.5 py-[3px] text-[11px] font-extrabold whitespace-nowrap text-yoga">
                            {duration}
                          </span>
                        )}
                        {s.recurrence && (
                          <span className="rounded-full bg-sun-soft px-2.5 py-[3px] text-[11px] font-extrabold whitespace-nowrap text-navy">
                            {s.recurrence}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  {person && (
                    <button
                      type="button"
                      onClick={() => onOpenInstructor(person.slug)}
                      aria-label={`${person.name} bemutatkozása`}
                      className="tap-press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-[#e3e7ef] bg-white pr-1.5 pl-1 text-navy"
                    >
                      {person.avatarUrl ? (
                        <Image
                          src={person.avatarUrl}
                          alt=""
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] rounded-full object-cover"
                        />
                      ) : (
                        <span className="h-[34px] w-[34px] rounded-full bg-sage" />
                      )}
                      <PathIcon d="m9 18 6-6-6-6" size={14} strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              );
            })}
          </TabPanel>
        </div>
      )}
    </section>
  );
}
