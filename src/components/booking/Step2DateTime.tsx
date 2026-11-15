"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { formatLongDate, toDateString } from "@/lib/booking-dates";
import { cn } from "@/lib/cn";
import { HU_DAY_NAMES } from "@/lib/opening-hours";
import { formatHuDate, monthsInWindow } from "@/lib/quick-booking";
import type { ScheduleForAvailability } from "@/lib/slots";
import { getAvailableDatesInRange } from "@/lib/slots";
import { MonthCalendar } from "./MonthCalendar";
import { EmptyWell, SlotGrid, SlotSkeleton } from "./SlotGrid";

interface ScheduleData {
  /** Sanity weeklySchedule (the page also passes its slot length). */
  schedule: ScheduleForAvailability & { defaultSlotDuration?: number };
  blockedDates: string[];
  bookingWindowDays: number;
}

interface Step2DateTimeProps {
  selectedDate: string | null;
  selectedTime: string | null;
  serviceId: string;
  serviceDuration: number;
  scheduleData: ScheduleData;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onSlotHold: (slotDate: string, slotTime: string, slotLockId: string, heldUntil: string) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getTodayString(): string {
  const today = new Date();
  return toDateString(today.getFullYear(), today.getMonth(), today.getDate());
}

function getMaxDateString(bookingWindowDays: number): string {
  const max = new Date();
  max.setDate(max.getDate() + bookingWindowDays);
  return toDateString(max.getFullYear(), max.getMonth(), max.getDate());
}

type DayAvailability = { available: number; total: number };

export function Step2DateTime({
  selectedDate,
  selectedTime,
  serviceId,
  scheduleData,
  onSelectDate,
  onSelectTime,
  onSlotHold,
}: Step2DateTimeProps) {
  const slotHeadingId = `slots-${useId().replace(/:/g, "")}`;
  const today = new Date();
  // Open the calendar on the month of a preselected date (homepage quick booking).
  const initialView = (() => {
    const [y, m] = (selectedDate ?? "").split("-").map(Number);
    return y && m
      ? { year: y, month: m - 1 }
      : { year: today.getFullYear(), month: today.getMonth() };
  })();
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [dayAvailability, setDayAvailability] = useState<Record<string, DayAvailability>>({});
  const [holdingSlot, setHoldingSlot] = useState<string | null>(null);

  const todayStr = getTodayString();
  const maxDateStr = getMaxDateString(scheduleData.bookingWindowDays);

  // Available dates (from the API so custom availability is included), merged per month.
  const [availableDatesSet, setAvailableDatesSet] = useState<Set<string>>(new Set());
  const [pendingMonths, setPendingMonths] = useState(0);

  // Every month the booking window touches is loaded up front: the desktop calendar pages
  // through them and the phone day strip lists the whole window at once.
  const windowMonths = useMemo(
    () => monthsInWindow(todayStr, scheduleData.bookingWindowDays),
    [todayStr, scheduleData.bookingWindowDays],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch only when the service or the booking window changes
  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    setPendingMonths(windowMonths.length);

    const merge = (dates: string[]) =>
      setAvailableDatesSet((prev) => {
        const next = new Set(prev);
        for (const d of dates) next.add(d);
        return next;
      });

    for (const monthStr of windowMonths) {
      fetch(`/api/slots/calendar?month=${monthStr}&serviceId=${encodeURIComponent(serviceId)}`, {
        cache: "no-store",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { dates?: string[] } | null) => {
          if (!cancelled && data?.dates) {
            // Filter to today..maxDate range
            merge(data.dates.filter((d) => d >= todayStr && d <= maxDateStr));
          }
        })
        .catch(() => {
          if (!cancelled) {
            // Fallback to client-side calculation
            const [y, m] = monthStr.split("-").map(Number);
            const year = y ?? today.getFullYear();
            const month = (m ?? 1) - 1;
            const firstDay = toDateString(year, month, 1);
            const lastDay = toDateString(year, month, getDaysInMonth(year, month));
            const rangeStart = firstDay < todayStr ? todayStr : firstDay;
            const rangeEnd = lastDay > maxDateStr ? maxDateStr : lastDay;
            if (rangeStart <= rangeEnd) {
              merge(
                getAvailableDatesInRange(
                  scheduleData.schedule,
                  scheduleData.blockedDates,
                  rangeStart,
                  rangeEnd,
                ),
              );
            }
          }
        })
        .finally(() => {
          if (!cancelled) setPendingMonths((n) => Math.max(0, n - 1));
        });

      // Per-day availability (batch endpoint) — fully booked days get disabled.
      fetch(`/api/slots/availability?month=${monthStr}&serviceId=${encodeURIComponent(serviceId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { availability?: Record<string, DayAvailability> } | null) => {
          if (!cancelled && data?.availability) {
            setDayAvailability((prev) => ({ ...prev, ...data.availability }));
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [serviceId, windowMonths, todayStr, maxDateStr]);

  // Fetch time slots when a date is selected
  const fetchSlots = useCallback(
    async (date: string) => {
      if (!serviceId) return;
      setSlotsLoading(true);
      setSlotsError(null);
      setSlots([]);
      try {
        const res = await fetch(
          `/api/slots?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`,
        );
        if (!res.ok) {
          setSlotsError("Nem sikerült betölteni az időpontokat. Kérjük, próbálja újra.");
          return;
        }
        const data = (await res.json()) as { slots?: string[] };
        setSlots(data.slots ?? []);
      } catch {
        setSlotsError("Hálózati hiba. Kérjük, ellenőrizze az internetkapcsolatát.");
      } finally {
        setSlotsLoading(false);
      }
    },
    [serviceId],
  );

  useEffect(() => {
    if (selectedDate) {
      void fetchSlots(selectedDate);
    } else {
      setSlots([]);
      setSlotsError(null);
    }
  }, [selectedDate, fetchSlots]);

  // A day is bookable when it is inside the window, the calendar API lists it and the
  // availability endpoint does not report it fully booked. Days whose counts have not
  // loaded yet stay clickable.
  const isBookable = useCallback(
    (dateStr: string) => {
      if (dateStr < todayStr || dateStr > maxDateStr) return false;
      if (!availableDatesSet.has(dateStr)) return false;
      const avail = dayAvailability[dateStr];
      return !(avail !== undefined && avail.available === 0);
    },
    [todayStr, maxDateStr, availableDatesSet, dayAvailability],
  );

  const bookableList = useMemo(
    () => [...availableDatesSet].filter(isBookable).sort(),
    [availableDatesSet, isBookable],
  );

  // Month navigation bounds
  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());
  const canGoNext = (() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + scheduleData.bookingWindowDays);
    return !(
      viewYear > maxDate.getFullYear() ||
      (viewYear === maxDate.getFullYear() && viewMonth >= maxDate.getMonth())
    );
  })();

  function prevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(dateStr: string) {
    if (!isBookable(dateStr)) return;
    onSelectDate(dateStr);
  }

  async function handleTimeSelect(time: string) {
    if (!selectedDate) return;

    setHoldingSlot(time);
    try {
      const res = await fetch("/api/slot-hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotDate: selectedDate, slotTime: time }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        setSlotsError(error.error ?? "Nem sikerült az időpont megtartása.");
        setHoldingSlot(null);
        return;
      }

      const data = (await res.json()) as { slotLockId?: string; heldUntil?: string };
      if (data.slotLockId && data.heldUntil) {
        // Notify parent wizard about the hold
        onSlotHold(selectedDate, time, data.slotLockId, data.heldUntil);
        onSelectTime(time);
      }
    } catch (err) {
      setSlotsError("Hálózati hiba. Kérjük, próbálja újra.");
      console.error("[Step2DateTime] Slot hold error:", err);
    } finally {
      setHoldingSlot(null);
    }
  }

  const lastDayLabel = formatHuDate(maxDateStr).replace(/\.$/, "");
  const windowNote =
    `Online a következő ${scheduleData.bookingWindowDays} napra foglalhat (${lastDayLabel}-ig)` +
    (pendingMonths === 0 ? ` · ${bookableList.length} foglalható nap` : "");

  return (
    <div className="flex flex-wrap items-start gap-5">
      {/* Desktop / tablet: month calendar */}
      <MonthCalendar
        className="flex-[1_1_380px] max-md:hidden"
        viewYear={viewYear}
        viewMonth={viewMonth}
        canPrev={canGoPrev}
        canNext={canGoNext}
        onPrev={prevMonth}
        onNext={nextMonth}
        todayStr={todayStr}
        selectedDate={selectedDate}
        isBookable={isBookable}
        onSelect={handleDayClick}
        footnote={windowNote}
      />

      {/* Phone: horizontal strip of the bookable days (MobilFoglalas) */}
      <DayStrip
        className="w-full md:hidden"
        days={bookableList}
        loading={pendingMonths > 0}
        selectedDate={selectedDate}
        availability={dayAvailability}
        onSelect={handleDayClick}
        windowDays={scheduleData.bookingWindowDays}
      />

      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
        {!selectedDate && (
          <EmptyWell icon className="min-h-[200px] md:min-h-[260px]">
            Válasszon egy napot a naptárból
          </EmptyWell>
        )}

        {selectedDate && (
          <>
            <div className="flex flex-col gap-1">
              <h3 id={slotHeadingId} className="m-0 text-[17px] font-extrabold text-navy">
                Elérhető időpontok
              </h3>
              <span className="text-sm font-semibold text-muted">
                <span>{formatLongDate(selectedDate)}</span>
                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <> · {slots.length} szabad időpont</>
                )}
              </span>
            </div>

            {slotsLoading && <SlotSkeleton />}

            {slotsError && !slotsLoading && (
              <Notice tone="error" role="alert">
                <span>{slotsError}</span>
                <button
                  type="button"
                  onClick={() => void fetchSlots(selectedDate)}
                  className="link-grow self-start py-0.5 font-extrabold text-navy"
                >
                  Újra megpróbál
                </button>
              </Notice>
            )}

            {!slotsLoading && !slotsError && slots.length === 0 && (
              <EmptyWell className="min-h-[120px] font-semibold">
                Ezen a napon nincs szabad időpont.
              </EmptyWell>
            )}

            {!slotsLoading && !slotsError && slots.length > 0 && (
              <>
                <SlotGrid
                  labelledBy={slotHeadingId}
                  slots={slots}
                  selectedTime={selectedTime}
                  onSelect={(time) => void handleTimeSelect(time)}
                  busyTime={holdingSlot}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface DayStripProps {
  days: string[];
  loading: boolean;
  selectedDate: string | null;
  availability: Record<string, DayAvailability>;
  onSelect: (date: string) => void;
  windowDays: number;
  className?: string;
}

/** Snap-scrolling row of 3-line day pills (day name / date / free slots). Never wraps. */
function DayStrip({
  days,
  loading,
  selectedDate,
  availability,
  onSelect,
  windowDays,
  className,
}: DayStripProps) {
  const labelId = `days-${useId().replace(/:/g, "")}`;
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-xs font-extrabold tracking-[.1em] text-muted uppercase">
          Nap
        </span>
        {!loading && (
          <span className="text-xs font-bold text-muted">{days.length} foglalható nap</span>
        )}
      </div>
      {loading && days.length === 0 ? (
        <div aria-hidden="true" className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((k) => (
            <span
              key={k}
              className="h-20 w-[108px] shrink-0 animate-pulse rounded-full bg-canvas"
            />
          ))}
        </div>
      ) : days.length === 0 ? (
        <p className="m-0 text-sm text-muted">
          A következő {windowDays} napban nincs szabad rendelési nap.
        </p>
      ) : (
        // biome-ignore lint/a11y/useSemanticElements: a fieldset would add native borders; this is a labelled button group
        <div
          role="group"
          aria-labelledby={labelId}
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pt-0.5 pb-4 -mb-3"
        >
          {days.map((date) => {
            const on = date === selectedDate;
            const [y, m, d] = date.split("-").map(Number);
            const dow = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).getDay();
            const free = availability[date]?.available;
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                aria-pressed={on}
                aria-label={`${formatLongDate(date)}${free ? `, ${free} szabad időpont` : ""}`}
                className={cn(
                  "tap-press flex min-h-20 min-w-[108px] shrink-0 snap-start flex-col items-center justify-center gap-px rounded-full border-[1.5px] px-4 py-2",
                  on
                    ? "border-navy bg-navy text-white shadow-[0_12px_24px_-14px_rgba(36,42,95,.7)]"
                    : "border-line bg-white text-navy",
                )}
              >
                <span className="text-[11px] font-extrabold tracking-[.06em] whitespace-nowrap uppercase opacity-80">
                  {HU_DAY_NAMES[dow]}
                </span>
                <span className="text-base font-extrabold whitespace-nowrap">
                  {formatHuDate(date, true)}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap tabular-nums opacity-80">
                  {free ? `${free} szabad` : "\u00a0"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
