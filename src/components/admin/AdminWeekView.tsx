"use client";

import { useMemo } from "react";
import type { AdminBooking } from "@/components/admin/AdminDashboard";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 18;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

const HU_WEEKDAY_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeToTopPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const minutesFromStart = (h ?? 0) * 60 + (m ?? 0) - DAY_START_HOUR * 60;
  return (minutesFromStart / TOTAL_MINUTES) * 100;
}

function durationToHeightPercent(durationMinutes: number): number {
  return (durationMinutes / TOTAL_MINUTES) * 100;
}

/** Detect overlapping bookings and assign column positions */
function layoutOverlappingBookings(
  dayBookings: AdminBooking[],
): Map<string, { colIndex: number; totalCols: number }> {
  const result = new Map<string, { colIndex: number; totalCols: number }>();
  if (dayBookings.length === 0) return result;

  // Parse each booking's start/end in minutes
  const parsed = dayBookings.map((b) => {
    const [h, m] = b.slotTime.split(":").map(Number);
    const startMin = (h ?? 0) * 60 + (m ?? 0);
    const duration = b.service?.appointmentDuration ?? 20;
    return { id: b._id, startMin, endMin: startMin + duration };
  });

  // Sort by start time
  parsed.sort((a, b) => a.startMin - b.startMin);

  // Greedy column assignment: for each booking, find the first column
  // where it doesn't overlap with any already-placed booking
  const columns: Array<Array<{ startMin: number; endMin: number; id: string }>> = [];

  for (const item of parsed) {
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c]!;
      const lastInCol = col[col.length - 1]!;
      if (item.startMin >= lastInCol.endMin) {
        col.push(item);
        result.set(item.id, { colIndex: c, totalCols: 0 }); // totalCols set later
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([item]);
      result.set(item.id, { colIndex: columns.length - 1, totalCols: 0 });
    }
  }

  // Now determine totalCols for each booking by finding how many columns
  // overlap at its specific time range
  for (const item of parsed) {
    const layout = result.get(item.id)!;
    // Count how many columns have a booking that overlaps with this item
    let maxCols = 0;
    for (const col of columns) {
      for (const other of col) {
        if (other.startMin < item.endMin && other.endMin > item.startMin) {
          maxCols++;
          break; // this column has an overlap, count it once
        }
      }
    }
    layout.totalCols = maxCols;
  }

  return result;
}

function parseLocalDate(dateStr: string): Date {
  // Parse YYYY-MM-DD as local date, not UTC
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function toDateString(d: Date): string {
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTodayString(): string {
  return toDateString(new Date());
}

/** Returns an array of 7 date strings (Mon..Sun) for the week containing dateStr */
function getWeekDays(dateStr: string): string[] {
  const date = parseLocalDate(dateStr);
  const dow = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Calculate offset to Monday: if Sunday (0), go back 6 days to get Monday of same week
  // Otherwise, go back (dow-1) days to get Monday
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  // Verify Monday is in the correct week (not off by timezone/DST)
  // If dow was 0 (Sunday), we want Monday of that same week (6 days prior)
  // If dow was 1+ (Mon-Sat), we want that week's Monday (0 to 5 days prior)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateString(d);
  });
}

/** Hour labels array from DAY_START_HOUR to DAY_END_HOUR - 1 */
const HOUR_LABELS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
);

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AdminWeekViewProps {
  selectedDate: string;
  bookings: AdminBooking[];
  onSelectDate: (date: string) => void;
  onBookingClick: (booking: AdminBooking) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminWeekView({
  selectedDate,
  bookings,
  onSelectDate,
  onBookingClick,
}: AdminWeekViewProps) {
  const todayStr = getTodayString();
  const weekDays = getWeekDays(selectedDate);

  // Group bookings by slotDate
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
      const existing = map.get(booking.slotDate) ?? [];
      existing.push(booking);
      map.set(booking.slotDate, existing);
    }
    return map;
  }, [bookings]);

  // Total height of the timeline area in px (used for scroll container)
  const TIMELINE_HEIGHT = 660; // 11 hours * 60px/hour

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Grid header: gutter + 7 day column headers ────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3rem repeat(7, 1fr)",
          marginBottom: "0.375rem",
          flexShrink: 0,
        }}
      >
        {/* Gutter cell */}
        <div />
        {weekDays.map((dateStr, idx) => {
          const dayNum = parseInt(dateStr.split("-")[2] ?? "0", 10);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0.375rem 0",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                borderRadius: "0.5rem",
                gap: "0.125rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: isToday ? "#99CEB7" : "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {HU_WEEKDAY_SHORT[idx]}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: isSelected ? 700 : isToday ? 600 : 500,
                  color: isSelected ? "#ffffff" : isToday ? "#099268" : "#1A1D2D",
                  width: "1.75rem",
                  height: "1.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: isSelected
                    ? "#242a5f"
                    : isToday
                      ? "rgba(153,206,183,0.2)"
                      : "transparent",
                  transition: "all 0.15s ease",
                  border: isSelected ? "2px solid #242a5f" : "2px solid transparent",
                }}
              >
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Scrollable timeline body ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3rem repeat(7, 1fr)",
            position: "relative",
            height: `${TIMELINE_HEIGHT}px`,
          }}
        >
          {/* ── Hour label gutter ────────────────────────────────────────── */}
          <div style={{ position: "relative" }}>
            {HOUR_LABELS.map((hour) => {
              const topPct =
                hour === DAY_END_HOUR
                  ? 100
                  : ((hour - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)) * 100;
              return (
                <div
                  key={hour}
                  style={{
                    position: "absolute",
                    top: `calc(${topPct}% - 0.5em)`,
                    right: "0.5rem",
                    fontSize: "0.625rem",
                    color: "#94a3b8",
                    lineHeight: 1,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                  }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          {/* ── Day columns ──────────────────────────────────────────────── */}
          {weekDays.map((dateStr) => {
            const dayBookings = bookingsByDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                style={{
                  position: "relative",
                  borderLeft: "1px solid #e8eaf0",
                  backgroundColor: isToday ? "rgba(153,206,183,0.04)" : "transparent",
                }}
              >
                {/* Hour grid lines */}
                {HOUR_LABELS.map((hour) => {
                  const topPct =
                    hour === DAY_END_HOUR
                      ? 100
                      : ((hour - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)) * 100;
                  return (
                    <div
                      key={hour}
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: `${topPct}%`,
                        left: 0,
                        right: 0,
                        borderTop: `1px solid ${hour === DAY_END_HOUR ? "transparent" : "#e8eaf0"}`,
                      }}
                    />
                  );
                })}

                {/* Appointment blocks */}
                {(() => {
                  const layoutMap = layoutOverlappingBookings(dayBookings);
                  return dayBookings.map((booking) => {
                    const isCancelled = booking.status === "cancelled";
                    const topPct = timeToTopPercent(booking.slotTime);
                    const duration = booking.service?.appointmentDuration ?? 20;
                    const heightPct = durationToHeightPercent(duration);

                    // Calculate end time for display
                    const [startH, startM] = booking.slotTime.split(":").map(Number);
                    const startTotalMin = (startH ?? 0) * 60 + (startM ?? 0);
                    const endTotalMin = startTotalMin + duration;
                    const endH = Math.floor(endTotalMin / 60);
                    const endM = endTotalMin % 60;
                    const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

                    // Clamp to visible range
                    const clampedTop = Math.max(0, Math.min(topPct, 100));
                    const clampedHeight = Math.min(heightPct, 100 - clampedTop);

                    // Overlap layout positioning
                    const layout = layoutMap.get(booking._id);
                    const totalCols = layout?.totalCols ?? 1;
                    const colIndex = layout?.colIndex ?? 0;
                    const colWidthPct = 100 / totalCols;

                    return (
                      <button
                        key={booking._id}
                        type="button"
                        onClick={() => onBookingClick(booking)}
                        title={`${booking.slotTime} ${booking.patientName}`}
                        style={{
                          position: "absolute",
                          top: `${clampedTop}%`,
                          left: totalCols === 1 ? "2px" : `calc(${colIndex * colWidthPct}% + 1px)`,
                          width:
                            totalCols === 1 ? "calc(100% - 4px)" : `calc(${colWidthPct}% - 2px)`,
                          height: `${clampedHeight}%`,
                          minHeight: "1.25rem",
                          backgroundColor: isCancelled ? "#F4DCD6" : "#99CEB7",
                          color: isCancelled ? "#9f1239" : "#0f172a",
                          borderRadius: "0.25rem",
                          padding: "0.125rem 0.25rem",
                          fontSize: "0.625rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "none",
                          textAlign: "left",
                          overflow: "hidden",
                          boxShadow: isCancelled ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                          lineHeight: 1.3,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          zIndex: 1,
                          transition: "opacity 0.1s",
                        }}
                      >
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "block",
                          }}
                        >
                          {booking.patientName}
                        </span>
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "block",
                            opacity: 0.75,
                          }}
                        >
                          {booking.slotTime} – {endTimeStr}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
