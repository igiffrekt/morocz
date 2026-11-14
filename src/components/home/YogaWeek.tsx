"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useId, useState } from "react";
import { ArrowIcon, PillLink } from "@/components/ui/PillButton";
import { TabList, TabPanel } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { HU_DAY_NAMES } from "@/lib/opening-hours";

export interface YogaClassSlot {
  id: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  start: string;
  end: string;
  name: string;
  instructor: string;
  color: string;
  /** "Páros hét" / "Páratlan hét" for biweekly classes. */
  recurrence: string | null;
}

const WEEKDAYS = [1, 2, 3, 4, 5] as const;
const SHORT = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];

function budapestWeekday(): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Budapest",
    weekday: "short",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

function meta(slot: YogaClassSlot) {
  return slot.recurrence ? `${slot.instructor} · ${slot.recurrence}` : slot.instructor;
}

/** Lélekző Jóga teaser: Mon–Fri timetable from Sanity yogaSchedule, today highlighted. */
export function YogaWeek({ classes }: { classes: YogaClassSlot[] }) {
  const idBase = useId().replace(/:/g, "");
  // Weekday is read on the client so a cached page never highlights yesterday.
  const [today, setToday] = useState<number | null>(null);
  const [day, setDay] = useState<string>("1");

  useEffect(() => {
    const dow = budapestWeekday();
    setToday(dow);
    if (dow >= 1 && dow <= 5) setDay(String(dow));
  }, []);

  const byDay = (dow: number) => classes.filter((c) => c.dayOfWeek === dow);
  const selected = Number(day);

  return (
    <section
      id="joga"
      aria-labelledby="joga-cim"
      className="flex scroll-mt-28 flex-col gap-3.5 rounded-panel bg-sage px-4 py-[22px] md:gap-9 md:rounded-hero md:p-10 lg:p-14"
    >
      <div className="flex items-end justify-between gap-2.5 px-1 md:flex-wrap md:gap-5 md:px-0">
        <div className="flex flex-col gap-1 md:gap-3">
          <span className="text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase md:text-[13px] md:font-bold">
            <span className="md:hidden">Órarend</span>
            <span className="hidden md:inline">Jógaközpontunk eseményei</span>
          </span>
          <h2
            id="joga-cim"
            className="m-0 text-[28px] leading-[1.05] font-extrabold tracking-[-0.02em] text-yoga md:text-[44px] md:tracking-[-0.03em] md:text-navy lg:text-[52px]"
          >
            Lélekző Jóga
          </h2>
        </div>
        <PillLink
          href="/joga"
          variant="navy"
          arrow
          className="hidden h-[54px] px-[26px] text-[15px] md:inline-flex"
        >
          Tovább a jóga oldalra
        </PillLink>
        <Link
          href="/joga"
          aria-label="Tovább a jóga oldalra"
          className="tap-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white md:hidden"
        >
          <ArrowIcon size={16} />
        </Link>
      </div>

      {/* Desktop: the whole week */}
      <div className="hidden gap-3 md:grid md:[grid-template-columns:repeat(auto-fit,minmax(160px,1fr))] lg:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {WEEKDAYS.map((dow) => {
          const list = byDay(dow);
          const isToday = dow === today;
          return (
            <div key={dow} className="flex flex-col gap-2.5">
              <span
                className={cn(
                  "self-start rounded-full px-4 py-2.5 text-sm font-extrabold whitespace-nowrap",
                  isToday ? "bg-navy text-white" : "bg-white text-navy",
                )}
              >
                {HU_DAY_NAMES[dow]}
                {isToday && <span className="sr-only"> (ma)</span>}
              </span>
              {list.length === 0 && (
                <span className="rounded-[22px] border-[1.5px] border-dashed border-[#b9c7bf] p-[18px] text-center text-sm text-muted">
                  Nincs óra
                </span>
              )}
              {list.map((slot) => (
                <Link
                  key={slot.id}
                  href="/joga"
                  className="card-lift flex flex-col gap-2 rounded-[22px] border-t-[5px] bg-white p-[18px] text-navy no-underline"
                  style={{ borderTopColor: slot.color }}
                >
                  <span className="text-[13px] font-extrabold text-teal-ink tabular-nums">
                    {slot.start} – {slot.end}
                  </span>
                  <span className="text-base leading-[1.3] font-extrabold">{slot.name}</span>
                  <span className="text-[13px] text-muted">{meta(slot)}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>

      {/* Phone: day tabs */}
      <div className="flex flex-col gap-3.5 md:hidden">
        <TabList
          idBase={idBase}
          label="Napok"
          value={day}
          onChange={setDay}
          className="p-1"
          items={WEEKDAYS.map((dow) => {
            const has = byDay(dow).length > 0;
            const on = dow === selected;
            return {
              value: String(dow),
              label: (
                <span className="flex flex-col items-center gap-[3px] text-sm text-navy">
                  <span aria-hidden="true" className={cn(on && "text-white")}>
                    {SHORT[dow]}
                  </span>
                  <span className="sr-only">{HU_DAY_NAMES[dow]}</span>
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
        <TabPanel key={day} idBase={idBase} value={day} className="flex flex-col gap-2">
          {byDay(selected).length === 0 && (
            <div className="fade-up rounded-[24px] bg-white p-5 text-center text-sm text-muted">
              Ezen a napon nincs óra.
            </div>
          )}
          {byDay(selected).map((slot, index) => (
            <Link
              key={slot.id}
              href="/joga"
              className="tap-press fade-up flex items-center gap-3.5 rounded-[24px] bg-white px-4 py-3.5 text-navy no-underline"
              style={{ "--i": index } as CSSProperties}
            >
              <span
                aria-hidden="true"
                className="w-1.5 self-stretch rounded-full"
                style={{ background: slot.color }}
              />
              <span className="flex min-w-[58px] flex-col">
                <strong className="text-[17px] tabular-nums">{slot.start}</strong>
                <span className="text-xs text-muted">– {slot.end}</span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-sm leading-[1.3]">{slot.name}</strong>
                <span className="text-xs text-muted">{meta(slot)}</span>
              </span>
            </Link>
          ))}
        </TabPanel>
      </div>
    </section>
  );
}
