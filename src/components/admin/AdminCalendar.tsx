"use client";

import { useMemo, useState } from "react";
import type { AdminBooking } from "@/components/admin/AdminDashboard";
import AdminWeekView from "@/components/admin/AdminWeekView";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const HU_WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "long" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns Monday-first index for the 1st of the month (0=Mon..6=Sun) */
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

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AdminCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  monthBookings: AdminBooking[];
  viewMode: "month" | "week";
  onViewModeChange: (mode: "month" | "week") => void;
  onMonthChange: (year: number, month: number) => void;
  initialYear: number;
  initialMonth: number;
  weekBookings: AdminBooking[];
  onBookingClick: (booking: AdminBooking) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminCalendar({
  selectedDate,
  onSelectDate,
  monthBookings,
  viewMode,
  onViewModeChange,
  onMonthChange,
  initialYear,
  initialMonth,
  weekBookings,
  onBookingClick,
}: AdminCalendarProps) {
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const todayStr = getTodayString();

  // ── Build booking dot map: Map<dateStr, count> ───────────────────────────────

  const bookingDotMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of monthBookings) {
      if (b.status === "cancelled") continue; // only show confirmed bookings as dots
      const existing = map.get(b.slotDate) ?? 0;
      map.set(b.slotDate, existing + 1);
    }
    return map;
  }, [monthBookings]);

  // ── Month navigation ─────────────────────────────────────────────────────────

  function prevMonth() {
    let y = viewYear;
    let m = viewMonth;
    if (m === 0) {
      y -= 1;
      m = 11;
    } else {
      m -= 1;
    }
    setViewYear(y);
    setViewMonth(m);
    onMonthChange(y, m);
  }

  function nextMonth() {
    let y = viewYear;
    let m = viewMonth;
    if (m === 11) {
      y += 1;
      m = 0;
    } else {
      m += 1;
    }
    setViewYear(y);
    setViewMonth(m);
    onMonthChange(y, m);
  }

  // ── Calendar grid cells ───────────────────────────────────────────────────────

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
    <div
      style={{
        backgroundColor: "#1e293b",
        borderRadius: "0.5rem",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Toggle bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Naptár
        </h2>
        {/* Month/Week pill toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#0f172a",
            borderRadius: "9999px",
            padding: "0.2rem",
            gap: "0.125rem",
          }}
        >
          {(["month", "week"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              style={{
                padding: "0.25rem 0.875rem",
                borderRadius: "9999px",
                border: "none",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                backgroundColor: viewMode === mode ? "#334155" : "transparent",
                color: viewMode === mode ? "#f8fafc" : "#64748b",
              }}
            >
              {mode === "month" ? "Hónap" : "Hét"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Month view ───────────────────────────────────────────────────────── */}
      {viewMode === "month" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Month navigation header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Előző hónap"
              style={{
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "1px solid #334155",
                borderRadius: "0.375rem",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.15s",
              }}
            >
              ‹
            </button>

            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#f8fafc",
                textTransform: "capitalize",
              }}
            >
              {formatMonthYear(viewYear, viewMonth)}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Következő hónap"
              style={{
                width: "2rem",
                height: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "1px solid #334155",
                borderRadius: "0.375rem",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.15s",
              }}
            >
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: "0.375rem",
            }}
          >
            {HU_WEEKDAYS.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#475569",
                  padding: "0.25rem 0",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.25rem",
            }}
          >
            {calendarCells.map((cell, idx) => {
              if (cell === null) {
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: empty padding cells have no stable key
                  <div key={`empty-${idx}`} style={{ height: "2.5rem" }} aria-hidden="true" />
                );
              }

              const { day, dateStr } = cell;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const bookingCount = bookingDotMap.get(dateStr) ?? 0;
              const hasDot = bookingCount > 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  aria-label={`${String(day)}. nap`}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  style={{
                    height: "2.5rem",
                    width: "100%",
                    borderRadius: "0.375rem",
                    border: isToday && !isSelected ? "1px solid #99CEB7" : "1px solid transparent",
                    backgroundColor: isSelected ? "#99CEB7" : "transparent",
                    color: isSelected ? "#0f172a" : isToday ? "#99CEB7" : "#cbd5e1",
                    fontSize: "0.875rem",
                    fontWeight: isToday || isSelected ? 700 : 400,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2px",
                    transition: "all 0.1s",
                    position: "relative",
                  }}
                >
                  <span>{day}</span>
                  {hasDot && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: isSelected ? "#0f172a" : "#99CEB7",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Week view ─────────────────────────────────────────────────────────── */}
      {viewMode === "week" && (
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <AdminWeekView
            selectedDate={selectedDate}
            bookings={weekBookings}
            onSelectDate={onSelectDate}
            onBookingClick={onBookingClick}
          />
        </div>
      )}
    </div>
  );
}
