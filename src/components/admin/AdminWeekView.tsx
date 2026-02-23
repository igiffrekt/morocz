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

function toDateString(d: Date): string {
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTodayString(): string {
  return toDateString(new Date());
}

/** Returns an array of 7 date strings (Mon..Sun) for the week containing dateStr */
function getWeekDays(dateStr: string): string[] {
  const date = new Date(dateStr);
  const dow = date.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

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
          marginBottom: "0.25rem",
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
                padding: "0.25rem 0",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                borderRadius: "0.375rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: isToday ? "#99CEB7" : "#64748b",
                  textTransform: "uppercase",
                }}
              >
                {HU_WEEKDAY_SHORT[idx]}
              </span>
              <span
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: isToday || isSelected ? 700 : 400,
                  color: isSelected ? "#99CEB7" : isToday ? "#99CEB7" : "#f8fafc",
                  width: "1.75rem",
                  height: "1.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: isSelected ? "rgba(153,206,183,0.15)" : "transparent",
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
                    fontSize: "0.6875rem",
                    color: "#475569",
                    lineHeight: 1,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
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

            return (
              <div
                key={dateStr}
                style={{
                  position: "relative",
                  borderLeft: "1px solid #1e293b",
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
                        borderTop: `1px solid ${hour === DAY_END_HOUR ? "transparent" : "#1e293b"}`,
                      }}
                    />
                  );
                })}

                {/* Appointment blocks */}
                {dayBookings.map((booking) => {
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

                  return (
                    <button
                      key={booking._id}
                      type="button"
                      onClick={() => onBookingClick(booking)}
                      title={`${booking.slotTime} ${booking.patientName}`}
                      style={{
                        position: "absolute",
                        top: `${clampedTop}%`,
                        left: "2px",
                        right: "2px",
                        height: `${clampedHeight}%`,
                        minHeight: "1.25rem",
                        backgroundColor: isCancelled ? "#475569" : "#99CEB7",
                        color: isCancelled ? "#94a3b8" : "#0f172a",
                        borderRadius: "0.25rem",
                        padding: "0.125rem 0.25rem",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        textAlign: "left",
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        lineHeight: 1.3,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        zIndex: 1,
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
                          opacity: 0.8,
                        }}
                      >
                        {booking.slotTime} – {endTimeStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
