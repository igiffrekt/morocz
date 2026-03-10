"use client";

import { useMemo, useState } from "react";
import type { AdminBooking } from "@/components/admin/AdminDashboard";


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
  onMonthChange: (year: number, month: number) => void;
  initialYear: number;
  initialMonth: number;
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
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

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
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        padding: "0",
        display: "flex",
        flexDirection: "column",
        height: "auto",
        overflow: "hidden",
        border: "1px solid #e8eaf0",
        boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
      }}
    >
      <style>{`
        /* Mobile-first responsive for calendar */
        @media (max-width: 768px) {
          /* Smaller padding inside calendar */
          [style*="padding: \"0.75rem"] {
            padding: 0.5rem !important;
          }
          
          /* Smaller day cells */
          [style*="height: \"2.5rem"] {
            height: 2rem !important;
            font-size: 0.75rem !important;
          }
          
          /* Smaller month nav buttons */
          [style*="width: \"2.25rem"] {
            width: 1.75rem !important;
            height: 1.75rem !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
      {/* ── Toggle bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          borderBottom: "1px solid #e8eaf0",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#242a5f",
            letterSpacing: "0.01em",
          }}
        >
          Naptár
        </h2>
        {/* Month/Week pill toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#f1f5f9",
            borderRadius: "9999px",
            padding: "0.1875rem",
            gap: "0.125rem",
          }}
        >

        </div>
      </div>

      {/* ── Month view ───────────────────────────────────────────────────────── */}
      {viewMode === "month" && (
        <div style={{ flex: 1, overflow: "auto", padding: "0.75rem 0.875rem 0.875rem" }}>
          {/* Month navigation header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Előző hónap"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "1px solid #e8eaf0",
                borderRadius: "0.5rem",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "1.125rem",
                transition: "all 0.15s",
              }}
            >
              &#8249;
            </button>

            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#242a5f",
                textTransform: "capitalize",
                minWidth: "10rem",
                textAlign: "center",
              }}
            >
              {formatMonthYear(viewYear, viewMonth)}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Következő hónap"
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "transparent",
                border: "1px solid #e8eaf0",
                borderRadius: "0.5rem",
                color: "#64748b",
                cursor: "pointer",
                fontSize: "1.125rem",
                transition: "all 0.15s",
              }}
            >
              &#8250;
            </button>
          </div>

          {/* Weekday headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: "0.5rem",
            }}
          >
            {HU_WEEKDAYS.map((day, idx) => {
              const isWeekend = idx >= 5;
              return (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: isWeekend ? "#cbd5e1" : "#94a3b8",
                    padding: "0.375rem 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Day grid — rendered as week rows with separators */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Array.from({ length: Math.ceil(calendarCells.length / 7) }, (_, rowIdx) => {
              const rowCells = calendarCells.slice(rowIdx * 7, rowIdx * 7 + 7);
              const isLastRow = rowIdx === Math.ceil(calendarCells.length / 7) - 1;

              return (
                <div
                  key={`row-${String(rowIdx)}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "0.25rem",
                    padding: "0.25rem 0",
                    borderBottom: isLastRow ? "none" : "1px solid #f0f1f5",
                  }}
                >
                  {rowCells.map((cell, colIdx) => {
                    const isWeekendCol = colIdx >= 5;

                    if (cell === null) {
                      return (
                        <div
                          key={`empty-r${String(rowIdx)}c${String(colIdx)}`}
                          style={{
                            height: "2.5rem",
                            backgroundColor: isWeekendCol ? "rgba(0,0,0,0.02)" : "transparent",
                            borderRadius: "0.5rem",
                          }}
                          aria-hidden="true"
                        />
                      );
                    }

                    const { day, dateStr } = cell;
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isHovered = dateStr === hoveredDay;
                    const bookingCount = bookingDotMap.get(dateStr) ?? 0;
                    const hasBookings = bookingCount > 0;

                    let cellBg = isWeekendCol ? "rgba(0,0,0,0.02)" : "transparent";
                    if (isHovered && !isSelected) {
                      cellBg = "rgba(0,0,0,0.04)";
                    }

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => onSelectDate(dateStr)}
                        onMouseEnter={() => setHoveredDay(dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                        aria-label={`${String(day)}. nap`}
                        aria-pressed={isSelected}
                        aria-current={isToday ? "date" : undefined}
                        style={{
                          height: "2.5rem",
                          width: "100%",
                          borderRadius: "0.5rem",
                          border: "1px solid transparent",
                          backgroundColor: cellBg,
                          color: "#1e293b",
                          fontSize: "0.875rem",
                          fontWeight: isToday || isSelected ? 700 : 400,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.12s ease",
                          position: "relative",
                          overflow: "hidden",
                          padding: 0,
                        }}
                      >
                        {/* Left-border accent for days with bookings */}
                        {hasBookings && (
                          <span
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              left: "0",
                              top: "20%",
                              bottom: "20%",
                              width: "3px",
                              borderRadius: "0 2px 2px 0",
                              backgroundColor: "#99CEB7",
                            }}
                          />
                        )}

                        {/* Day number with circle background for today/selected */}
                        <span
                          style={{
                            width: "2rem",
                            height: "2rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            backgroundColor: isSelected
                              ? "#242a5f"
                              : isToday
                                ? "#99CEB7"
                                : "transparent",
                            color: isSelected || isToday ? "#ffffff" : "#1A1D2D",
                            lineHeight: 1,
                            transition: "all 0.12s ease",
                          }}
                        >
                          {day}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}
