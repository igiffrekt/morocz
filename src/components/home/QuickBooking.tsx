"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Collapse } from "@/components/ui/Accordion";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  BOOKING_SERVICE_LABELS,
  type BookingServiceSlug,
  bookingHref,
} from "@/lib/booking-services";
import { cn } from "@/lib/cn";
import { HU_DAY_NAMES } from "@/lib/opening-hours";
import {
  type AvailabilityMap,
  bookableDays,
  formatHuDate,
  monthsInWindow,
  type QuickBookingSchedule,
  type ScheduledDay,
  scheduledDays,
} from "@/lib/quick-booking";
import { todayInBudapest } from "@/lib/slots";
import { ICON_PATHS, PathIcon } from "./PathIcon";

interface QuickBookingProps {
  /** Sanity service ids the booking wizard uses for the two choices. */
  serviceIds: Record<BookingServiceSlug, string | null>;
  schedule: QuickBookingSchedule;
}

type Availability =
  | { status: "loading" }
  | { status: "ready"; map: AvailabilityMap }
  /** API unreachable: fall back to the schedule alone (the wizard shows the real slots). */
  | { status: "error" };

const SERVICE_OPTIONS = (Object.keys(BOOKING_SERVICE_LABELS) as BookingServiceSlug[]).map(
  (value) => ({ value, label: BOOKING_SERVICE_LABELS[value] }),
);

/** Desktop shows the first 4 days in one row; the phone snap row a few more. */
const DESKTOP_DAYS = 4;
const MOBILE_DAYS = 8;

async function fetchAvailability(serviceId: string, months: string[]): Promise<AvailabilityMap> {
  const maps = await Promise.all(
    months.map(async (month) => {
      const res = await fetch(
        `/api/slots/availability?month=${month}&serviceId=${encodeURIComponent(serviceId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`availability ${res.status}`);
      const data = (await res.json()) as { availability?: AvailabilityMap };
      return data.availability ?? {};
    }),
  );
  return Object.assign({}, ...maps);
}

export function QuickBooking({ serviceIds, schedule }: QuickBookingProps) {
  const baseId = useId().replace(/:/g, "");
  const [service, setService] = useState<BookingServiceSlug>("nogyogyaszat");
  const [picked, setPicked] = useState<string | null>(null);
  // "Today" is read on the client so a cached (ISR) page never offers a past day.
  const [clock, setClock] = useState<{ today: string; nowMs: number } | null>(null);
  const [availability, setAvailability] = useState<
    Partial<Record<BookingServiceSlug, Availability>>
  >({});

  useEffect(() => {
    setClock({ today: todayInBudapest(), nowMs: Date.now() });
  }, []);

  const serviceId = serviceIds[service];
  const current = availability[service];

  // One request batch per service; results are kept when switching back and forth.
  const requested = useRef(new Set<BookingServiceSlug>());
  useEffect(() => {
    if (!clock || !serviceId || requested.current.has(service)) return;
    requested.current.add(service);
    setAvailability((prev) => ({ ...prev, [service]: { status: "loading" } }));
    fetchAvailability(serviceId, monthsInWindow(clock.today, schedule.bookingWindowDays))
      .then((map) => setAvailability((prev) => ({ ...prev, [service]: { status: "ready", map } })))
      .catch(() => setAvailability((prev) => ({ ...prev, [service]: { status: "error" } })));
  }, [clock, service, serviceId, schedule.bookingWindowDays]);

  const days: ScheduledDay[] | null = useMemo(() => {
    if (!clock || !serviceId) return serviceId ? null : [];
    if (!current || current.status === "loading") return null;
    const scheduled = scheduledDays(schedule, serviceId, clock.today, clock.nowMs);
    return current.status === "ready" ? bookableDays(scheduled, current.map) : scheduled;
  }, [clock, serviceId, current, schedule]);

  const shown = (days ?? []).slice(0, MOBILE_DAYS);
  const selected = shown.find((d) => d.date === picked)?.date ?? shown[0]?.date ?? null;
  const href = bookingHref(service, selected);
  const prenatal = service === "varandosgondozas";
  const windowDays = schedule.bookingWindowDays;

  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onPillKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    const step = forward ? 1 : back ? -1 : 0;
    if (!step || shown.length === 0) return;
    event.preventDefault();
    const next = (index + step + shown.length) % shown.length;
    const day = shown[next];
    if (!day) return;
    setPicked(day.date);
    pillRefs.current[next]?.focus();
  };

  const labelClass = "text-xs font-extrabold uppercase tracking-[.1em] text-muted md:font-bold";

  return (
    <div
      id="foglalas"
      className="relative z-[5] mx-3 -mt-14 scroll-mt-28 rounded-panel bg-white p-[18px] shadow-[0_24px_50px_-28px_rgba(36,42,95,.55)] md:mx-8 md:-mt-[136px] md:rounded-[36px] md:p-6 md:shadow-[0_34px_70px_-34px_rgba(36,42,95,.5)]"
    >
      <div className="flex flex-col gap-3.5 md:flex-row md:flex-wrap md:items-end md:gap-4">
        {/* Service */}
        <div className="flex min-w-0 flex-col gap-2.5 md:min-w-[260px] md:flex-[0_1_320px]">
          <span id={`${baseId}-svc`} className={cn(labelClass, "hidden md:block")}>
            Szolgáltatás
          </span>
          <SegmentedControl
            options={SERVICE_OPTIONS}
            value={service}
            onChange={(next) => {
              setService(next);
              setPicked(null);
            }}
            labelledBy={`${baseId}-svc`}
            size="lg"
            className="h-[56px] md:h-[84px]"
          />
        </div>

        {/* Prenatal notice — under the switch on phones, full width below the row on desktop */}
        <Collapse
          open={prenatal}
          className="md:order-last md:-mt-4 md:basis-full"
          innerClassName="min-w-0"
        >
          <PrenatalNotice />
        </Collapse>

        {/* Days */}
        <div className="flex min-w-0 flex-col gap-2.5 md:flex-[1_1_580px]">
          <span
            id={`${baseId}-day`}
            className={cn(labelClass, "flex items-baseline justify-between gap-3")}
          >
            <span>Szabad rendelési nap</span>
            {days && days.length > 0 && (
              <span className="font-semibold tracking-normal normal-case">
                <span className="md:hidden">
                  {days.length} nap / {windowDays} nap
                </span>
                <span className="hidden md:inline">
                  {days.length} nap foglalható a következő {windowDays} napban
                </span>
              </span>
            )}
          </span>

          {days === null ? (
            <div
              className="-mx-[18px] flex gap-2 overflow-hidden px-[18px] md:mx-0 md:grid md:px-0 md:[grid-template-columns:repeat(auto-fit,minmax(136px,1fr))]"
              aria-hidden="true"
            >
              {Array.from({ length: DESKTOP_DAYS }, (_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
                  key={i}
                  className="h-[76px] min-w-[116px] flex-none animate-pulse rounded-full bg-canvas md:h-[84px] md:min-w-0"
                />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="fade-up flex min-h-[76px] items-center justify-center rounded-tile border-[1.5px] border-dashed border-line px-5 text-center text-sm font-semibold text-muted md:min-h-[84px] md:rounded-full">
              A következő {windowDays} napban nincs szabad időpont erre a szolgáltatásra.
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-labelledby={`${baseId}-day`}
              className="scrollbar-none -mx-[18px] flex snap-x snap-mandatory scroll-px-[18px] gap-2 overflow-x-auto overscroll-x-contain px-[18px] pt-0.5 pb-3 -mb-2 md:mx-0 md:mb-0 md:grid md:snap-none md:overflow-visible md:p-0 md:[grid-template-columns:repeat(auto-fit,minmax(136px,1fr))]"
            >
              {shown.map((day, index) => {
                const on = day.date === selected;
                return (
                  // biome-ignore lint/a11y/useSemanticElements: design-drawn radio (no native inputs, see PLAN.md)
                  <button
                    key={`${service}-${day.date}`}
                    ref={(el) => {
                      pillRefs.current[index] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setPicked(day.date)}
                    onKeyDown={(event) => onPillKey(event, index)}
                    style={{ "--i": index } as CSSProperties}
                    className={cn(
                      "chip-lift fade-up flex min-h-[76px] min-w-[116px] flex-none snap-start flex-col items-center justify-center gap-px rounded-full border-[1.5px] px-4 py-2 md:min-h-[84px] md:min-w-0 md:gap-0.5 md:px-3.5 md:py-2.5",
                      index >= DESKTOP_DAYS && "md:hidden",
                      on
                        ? "border-navy bg-navy text-white shadow-[0_12px_24px_-14px_rgba(36,42,95,.7)]"
                        : "border-line bg-white text-navy hover:border-navy",
                    )}
                  >
                    <span className="text-[11px] font-extrabold uppercase tracking-[.06em] whitespace-nowrap opacity-80 md:text-xs md:font-bold">
                      {HU_DAY_NAMES[day.dayOfWeek]}
                    </span>
                    <span className="text-[15px] font-extrabold leading-tight whitespace-nowrap md:text-base">
                      <span className="md:hidden">{formatHuDate(day.date, true)}</span>
                      <span className="hidden md:inline">{formatHuDate(day.date)}</span>
                    </span>
                    <span className="text-[11px] font-semibold tabular-nums whitespace-nowrap opacity-80 md:text-xs">
                      {day.startTime}
                      <span className="md:hidden">–</span>
                      <span className="hidden md:inline"> – </span>
                      {day.endTime}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Link
          href={href}
          className={pillClassName({
            variant: "mint",
            className:
              "h-14 w-full gap-2.5 bg-mint px-7 text-base hover:bg-mint md:h-[84px] md:w-auto md:flex-none md:text-[15px]",
          })}
        >
          <span className="md:hidden">Szabad időpontok</span>
          <span className="hidden md:inline">Foglaljon időpontot</span>
          <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}

/** Text from the booking wizard's PrenatalNoticeModal. */
function PrenatalNotice() {
  return (
    <div className="flex items-start gap-4 rounded-[22px] bg-sun-soft px-4 py-3.5 md:mt-5 md:rounded-tile md:px-6 md:py-5">
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sun text-navy md:inline-flex">
        <PathIcon d={ICON_PATHS.alert} size={20} strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px] leading-[1.55] text-muted-strong md:gap-2 md:text-[15px] md:leading-relaxed">
        <strong className="text-navy md:text-base">
          Fontos tájékoztatás várandós pácienseink részére
        </strong>
        <span>
          A <strong className="text-navy">24. várandóssági hét</strong>
          <span className="md:hidden">
            {" "}
            után első jelentkezéskor kizárólag{" "}
            <strong className="text-navy">dupla időpont foglalásával</strong> tudom biztosítani az
            ellátását.
          </span>
          <span className="hidden md:inline">
            {" "}
            betöltését követően, amennyiben első alkalommal jelentkezik rendelőmben
            várandósgondozásra, a szükséges részletes állapotfelmérés és dokumentáció áttekintése
            érdekében kizárólag <strong className="text-navy">dupla időpont foglalásával</strong>{" "}
            tudom biztosítani az ellátását.
          </span>
        </span>
        <span>
          A <strong className="text-navy">36. várandóssági héttől</strong> a szülésre választott
          intézmény szülészeti osztályát vagy a területileg illetékes szülészeti ügyeletet keresse
          fel.
        </span>
      </div>
    </div>
  );
}
