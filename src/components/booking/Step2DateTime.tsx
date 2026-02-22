"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleForAvailability } from "@/lib/slots";
import { getAvailableDatesInRange } from "@/lib/slots";

interface ScheduleData {
  schedule: ScheduleForAvailability;
  blockedDates: string[];
}

interface Step2DateTimeProps {
  selectedDate: string | null;
  selectedTime: string | null;
  serviceId: string;
  serviceDuration: number;
  scheduleData: ScheduleData;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
}

// Hungarian weekday abbreviations, Monday-first
const HU_WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "long" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns the day-of-week for the 1st of the month converted to Monday-first index (0=Mon..6=Sun) */
function getFirstDayMondayIndex(year: number, month: number): number {
  const dow = new Date(year, month, 1).getDay();
  return (dow + 6) % 7;
}

function toDateString(year: number, month: number, day: number): string {
  return `${String(year)}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTodayString(): string {
  const today = new Date();
  return toDateString(today.getFullYear(), today.getMonth(), today.getDate());
}

function getMaxDateString(): string {
  const max = new Date();
  max.setDate(max.getDate() + 30);
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
  onNext,
  onBack,
}: Step2DateTimeProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [dayAvailability, setDayAvailability] = useState<Record<string, DayAvailability>>({});

  const todayStr = getTodayString();
  const maxDateStr = getMaxDateString();

  // Compute available dates for the currently visible month
  const availableDatesSet = useMemo(() => {
    const firstDay = toDateString(viewYear, viewMonth, 1);
    const lastDay = toDateString(viewYear, viewMonth, getDaysInMonth(viewYear, viewMonth));

    // Clamp to today..maxDate range
    const rangeStart = firstDay < todayStr ? todayStr : firstDay;
    const rangeEnd = lastDay > maxDateStr ? maxDateStr : lastDay;

    if (rangeStart > rangeEnd) return new Set<string>();

    const available = getAvailableDatesInRange(
      scheduleData.schedule,
      scheduleData.blockedDates,
      rangeStart,
      rangeEnd,
    );
    return new Set(available);
  }, [viewYear, viewMonth, scheduleData, todayStr, maxDateStr]);

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

  // Fetch per-day availability for the visible month (batch endpoint)
  useEffect(() => {
    if (!serviceId) return;
    const monthStr = `${String(viewYear)}-${String(viewMonth + 1).padStart(2, "0")}`;
    let cancelled = false;
    fetch(`/api/slots/availability?month=${monthStr}&serviceId=${encodeURIComponent(serviceId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { availability?: Record<string, DayAvailability> } | null) => {
        if (!cancelled && data?.availability) {
          setDayAvailability((prev) => ({ ...prev, ...data.availability }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth, serviceId]);

  // Month navigation bounds
  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());
  const canGoNext = (() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
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
    if (dateStr < todayStr || dateStr > maxDateStr) return;
    if (!availableDatesSet.has(dateStr)) return;
    onSelectDate(dateStr);
  }

  function formatSelectedDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayMondayIndex(viewYear, viewMonth);

  // Build calendar grid cells (null = empty padding cell)
  const calendarCells: Array<{ day: number; dateStr: string } | null> = [
    ...Array.from<null>({ length: firstDayIndex }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { day, dateStr: toDateString(viewYear, viewMonth, day) };
    }),
  ];
  // Pad to complete last row
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Válasszon időpontot</h2>

      {/* Calendar */}
      <div className="bg-gray-50 rounded-2xl p-4 md:p-6 mb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Előző hónap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <h3 className="text-sm font-bold text-gray-800 capitalize">
            {formatMonthYear(viewYear, viewMonth)}
          </h3>

          <button
            type="button"
            onClick={nextMonth}
            disabled={!canGoNext}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Következő hónap"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {HU_WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarCells.map((cell, idx) => {
            if (cell === null) {
              // biome-ignore lint/suspicious/noArrayIndexKey: empty padding cells have no stable key
              return <div key={`empty-${idx}`} className="h-10" aria-hidden="true" />;
            }

            const { day, dateStr } = cell;
            const isAvailable = availableDatesSet.has(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isPast = dateStr < todayStr;
            const isBeyondMax = dateStr > maxDateStr;
            const isClickable = isAvailable && !isPast && !isBeyondMax;

            // Availability stripe data
            const avail = dayAvailability[dateStr];
            const pct = avail && avail.total > 0 ? avail.available / avail.total : null;
            const stripeColor =
              pct === null
                ? ""
                : pct > 0.6
                  ? "bg-[#99CEB7]"
                  : pct > 0.25
                    ? "bg-amber-400"
                    : "bg-rose-400";

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDayClick(dateStr)}
                disabled={!isClickable}
                className={[
                  "h-10 w-full rounded-lg text-sm font-medium transition-all duration-150 flex flex-col items-center justify-center gap-0.5 relative",
                  isSelected
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : isClickable
                      ? "bg-white text-gray-800 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] shadow-sm cursor-pointer"
                      : "text-gray-300 cursor-not-allowed",
                  isToday && !isSelected ? "ring-1 ring-[var(--color-primary)]/30" : "",
                ]
                  .join(" ")
                  .trim()}
                aria-label={`${day}. nap${isAvailable && !isPast && !isBeyondMax ? " (szabad)" : " (nem elérhető)"}`}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
              >
                <span>{day}</span>
                {isClickable && pct !== null && (
                  <span
                    className={[
                      "h-[3px] rounded-full transition-all duration-300",
                      isSelected ? "bg-white/60" : stripeColor,
                    ].join(" ")}
                    style={{ width: `${Math.max(pct * 100, 12)}%` }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots — shown after a date is selected */}
      {selectedDate && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Elérhető időpontok</h3>
          <p className="text-xs text-gray-500 mb-4 capitalize">
            {formatSelectedDate(selectedDate)}
          </p>

          {/* Loading skeleton */}
          {slotsLoading && (
            <div aria-busy="true" className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7"].map((k) => (
                <div
                  key={k}
                  className="h-10 bg-gray-200 rounded-lg animate-pulse"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {slotsError && !slotsLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{slotsError}</p>
              <button
                type="button"
                onClick={() => void fetchSlots(selectedDate)}
                className="mt-2 text-xs text-red-700 underline hover:no-underline"
              >
                Újra megpróbál
              </button>
            </div>
          )}

          {/* No slots */}
          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                Ezen a napon nincs szabad időpont. Kérjük, válasszon másik napot.
              </p>
            </div>
          )}

          {/* Slots grid */}
          {!slotsLoading && !slotsError && slots.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {slots.map((time) => {
                const isTimeSelected = time === selectedTime;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onSelectTime(time)}
                    className={[
                      "h-10 rounded-lg text-sm font-semibold transition-all duration-150",
                      isTimeSelected
                        ? "bg-[var(--color-primary)] text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] shadow-sm",
                    ].join(" ")}
                    aria-pressed={isTimeSelected}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Vissza
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={selectedDate === null || selectedTime === null}
          className={[
            "px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
            selectedDate !== null && selectedTime !== null
              ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          Tovább
        </button>
      </div>
    </div>
  );
}
