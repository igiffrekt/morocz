"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScheduleForAvailability } from "@/lib/slots";
import { getAvailableDatesInRange } from "@/lib/slots";

interface ReschedulePanelProps {
  booking: {
    _id: string;
    service: { name: string; appointmentDuration: number } | null;
    slotDate: string;
    slotTime: string;
    managementToken: string;
    serviceId: string;
  };
  scheduleData: {
    schedule: ScheduleForAvailability;
    blockedDates: string[];
  };
  onRescheduled: (newDate: string, newTime: string) => void;
  onCancel: () => void;
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

export function ReschedulePanel({
  booking,
  scheduleData,
  onRescheduled,
  onCancel,
}: ReschedulePanelProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const todayStr = getTodayString();
  const maxDateStr = getMaxDateString();

  // Compute available dates for the currently visible month
  const availableDatesSet = useMemo(() => {
    const firstDay = toDateString(viewYear, viewMonth, 1);
    const lastDay = toDateString(viewYear, viewMonth, getDaysInMonth(viewYear, viewMonth));

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
      if (!booking.serviceId) return;
      setSlotsLoading(true);
      setSlotsError(null);
      setSlots([]);
      setSelectedTime(null);
      try {
        const res = await fetch(
          `/api/slots?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(booking.serviceId)}`,
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
    [booking.serviceId],
  );

  useEffect(() => {
    if (selectedDate) {
      void fetchSlots(selectedDate);
    } else {
      setSlots([]);
      setSlotsError(null);
    }
  }, [selectedDate, fetchSlots]);

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
    setSelectedDate(dateStr);
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/booking-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: booking.managementToken,
          newDate: selectedDate,
          newTime: selectedTime,
        }),
      });

      if (res.ok) {
        onRescheduled(selectedDate, selectedTime);
        return;
      }

      const data = (await res.json()) as { error?: string };
      if (res.status === 409) {
        setSubmitError(data.error ?? "Ez az időpont már foglalt. Kérjük, válasszon másikat.");
        // Keep picker open so patient can try another slot
        setSelectedTime(null);
      } else if (res.status === 403) {
        setSubmitError(
          data.error ?? "Az időpont már nem módosítható (kevesebb mint 24 óra van hátra).",
        );
      } else {
        setSubmitError(data.error ?? "Hiba történt. Kérjük, próbálja újra.");
      }
    } catch {
      setSubmitError("Hálózati hiba. Kérjük, ellenőrizze az internetkapcsolatát.");
    } finally {
      setSubmitting(false);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayIndex = getFirstDayMondayIndex(viewYear, viewMonth);

  const calendarCells: Array<{ day: number; dateStr: string } | null> = [
    ...Array.from<null>({ length: firstDayIndex }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { day, dateStr: toDateString(viewYear, viewMonth, day) };
    }),
  ];
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  return (
    <div className="mt-4 rounded-xl border border-[#99CEB7]/40 bg-[#F8FBFA] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#23264F]">Új időpont kiválasztása</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
          disabled={submitting}
        >
          Mégsem
        </button>
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Calendar — left column */}
        <div className="rounded-2xl bg-white p-4 sm:w-[65%]">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Előző hónap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <h4 className="text-sm font-bold capitalize text-gray-800">
              {formatMonthYear(viewYear, viewMonth)}
            </h4>

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Következő hónap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
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
          <div className="mb-1 grid grid-cols-7">
            {HU_WEEKDAYS.map((day) => (
              <div key={day} className="py-1 text-center text-xs font-semibold text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarCells.map((cell, idx) => {
              if (cell === null) {
                // biome-ignore lint/suspicious/noArrayIndexKey: empty padding cells have no stable key
                return <div key={`empty-${idx}`} className="h-9" aria-hidden="true" />;
              }

              const { day, dateStr } = cell;
              const isAvailable = availableDatesSet.has(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isPast = dateStr < todayStr;
              const isBeyondMax = dateStr > maxDateStr;
              const isClickable = isAvailable && !isPast && !isBeyondMax;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  disabled={!isClickable}
                  className={[
                    "flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-150",
                    isSelected
                      ? "bg-[#23264F] text-white shadow-md"
                      : isClickable
                        ? "bg-gray-50 text-gray-800 hover:bg-[#99CEB7]/20 hover:text-[#23264F] cursor-pointer"
                        : "cursor-not-allowed text-gray-300",
                    isToday && !isSelected ? "ring-1 ring-[#23264F]/30" : "",
                  ]
                    .join(" ")
                    .trim()}
                  aria-label={`${day}. nap${isClickable ? " (szabad)" : " (nem elérhető)"}`}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots — right column */}
        <div className="sm:w-[35%]">
          {!selectedDate && (
            <div className="flex h-full items-center justify-center rounded-2xl bg-white px-4 py-8">
              <p className="text-center text-sm text-gray-400">Válasszon egy napot a naptárból</p>
            </div>
          )}

          {selectedDate && (
            <div className="rounded-2xl bg-white p-4">
              <h4 className="mb-1 text-sm font-semibold text-gray-700">Elérhető időpontok</h4>
              <p className="mb-3 text-xs capitalize text-gray-500">
                {formatSelectedDate(selectedDate)}
              </p>

              {/* Loading skeleton */}
              {slotsLoading && (
                <div aria-busy="true" className="grid grid-cols-2 gap-2">
                  {["s0", "s1", "s2", "s3", "s4", "s5"].map((k) => (
                    <div
                      key={k}
                      className="h-9 animate-pulse rounded-lg bg-gray-200"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}

              {/* Error state */}
              {slotsError && !slotsLoading && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
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
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-500">Ezen a napon nincs szabad időpont.</p>
                </div>
              )}

              {/* Slots grid */}
              {!slotsLoading && !slotsError && slots.length > 0 && (
                <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto">
                  {slots.map((time) => {
                    const isTimeSelected = time === selectedTime;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={[
                          "h-9 rounded-lg text-sm font-semibold transition-all duration-150",
                          isTimeSelected
                            ? "bg-[#23264F] text-white shadow-md"
                            : "border border-gray-200 bg-white text-gray-700 hover:border-[#99CEB7] hover:text-[#23264F] shadow-sm",
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
        </div>
      </div>

      {/* Confirm section */}
      {selectedDate && selectedTime && (
        <div className="mt-4 rounded-xl border border-[#99CEB7] bg-white p-4">
          <p className="mb-3 text-sm text-gray-600">
            Új időpont:{" "}
            <span className="font-semibold text-[#23264F]">
              {formatSelectedDate(selectedDate)}, {selectedTime}
            </span>
          </p>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting}
            className={[
              "w-full rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
              submitting
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-[#23264F] text-white hover:bg-[#1a1d3b]",
            ].join(" ")}
          >
            {submitting ? "Folyamatban..." : "Megerősítés"}
          </button>
        </div>
      )}
    </div>
  );
}
