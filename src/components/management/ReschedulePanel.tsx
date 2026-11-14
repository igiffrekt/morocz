"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { MonthCalendar } from "@/components/booking/MonthCalendar";
import { EmptyWell, SlotGrid, SlotSkeleton } from "@/components/booking/SlotGrid";
import { Chip } from "@/components/ui/Chip";
import { Notice } from "@/components/ui/Notice";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { formatHuDate } from "@/lib/quick-booking";
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
    bookingWindowDays: number;
  };
  onRescheduled: (newDate: string, newTime: string) => void;
  onCancel: () => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toDateString(year: number, month: number, day: number): string {
  return `${String(year)}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  const slotHeadingId = `rslots-${useId().replace(/:/g, "")}`;
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
  const maxDateStr = getMaxDateString(scheduleData.bookingWindowDays);

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

  const canConfirm = Boolean(selectedDate && selectedTime) && !submitting;
  const newSlotText =
    selectedDate && selectedTime ? `${formatHuDate(selectedDate, true)} ${selectedTime}` : "";

  return (
    <div className="flex flex-col gap-[18px] border-t border-line-soft pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-xl font-extrabold text-navy">Új időpont kiválasztása</h3>
        <Chip tone="sage" className="text-teal-ink">
          A foglalási díj átvezetésre kerül
        </Chip>
      </div>

      {/* Error banner */}
      {submitError && (
        <Notice tone="error" role="alert">
          {submitError}
        </Notice>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <MonthCalendar
          compact
          showLegend={false}
          className="flex-[1_1_340px]"
          viewYear={viewYear}
          viewMonth={viewMonth}
          canPrev={canGoPrev}
          canNext={canGoNext}
          onPrev={prevMonth}
          onNext={nextMonth}
          todayStr={todayStr}
          selectedDate={selectedDate}
          isBookable={(d) => availableDatesSet.has(d) && d >= todayStr && d <= maxDateStr}
          onSelect={handleDayClick}
        />

        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
          {!selectedDate && (
            <EmptyWell className="min-h-[200px] text-sm">Válasszon egy napot a naptárból</EmptyWell>
          )}

          {selectedDate && (
            <>
              <div className="flex flex-col gap-0.5">
                <h4 id={slotHeadingId} className="m-0 text-[15px] font-extrabold text-navy">
                  Elérhető időpontok
                </h4>
                <span className="text-[13px] font-semibold text-muted first-letter:uppercase">
                  {formatSelectedDate(selectedDate)}
                </span>
              </div>

              {slotsLoading && <SlotSkeleton compact count={6} />}

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
                <EmptyWell className="min-h-[100px] text-sm font-semibold">
                  Ezen a napon nincs szabad időpont.
                </EmptyWell>
              )}

              {!slotsLoading && !slotsError && slots.length > 0 && (
                <SlotGrid
                  compact
                  labelledBy={slotHeadingId}
                  slots={slots}
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm section */}
      <div className="flex flex-wrap-reverse justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={pillClassName({ variant: "outline", className: "h-[52px] max-sm:w-full" })}
        >
          Mégsem
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={!canConfirm}
          className={pillClassName({
            variant: "navy",
            className: "h-[52px] px-7 max-sm:w-full",
          })}
        >
          {submitting ? "Folyamatban..." : "Megerősítés"}
          {newSlotText && !submitting && (
            <span className="font-semibold text-mint-light">· {newSlotText}</span>
          )}
          {!submitting && <ArrowIcon />}
        </button>
      </div>
    </div>
  );
}
