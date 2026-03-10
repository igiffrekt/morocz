"use client";

import { useState } from "react";
import type { AdminBooking } from "@/components/admin/AdminDashboard";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AdminDayPanelProps {
  bookings: AdminBooking[];
  selectedDate: string;
  isLoading: boolean;
  onBookingClick: (booking: AdminBooking) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatHungarianDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD — parse as local date to avoid UTC shift
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  const monthName =
    date.toLocaleDateString("hu-HU", { month: "long" }).charAt(0).toUpperCase() +
    date.toLocaleDateString("hu-HU", { month: "long" }).slice(1);
  const weekday =
    date.toLocaleDateString("hu-HU", { weekday: "long" }).charAt(0).toUpperCase() +
    date.toLocaleDateString("hu-HU", { weekday: "long" }).slice(1);
  return `${String(year)}. ${monthName} ${String(day)}., ${weekday}`;
}

const AVATAR_COLORS = [
  "#242a5f",
  "#99CEB7",
  "#e7c1d3",
  "#91bcf5",
  "#efda67",
  "#a3dac2",
  "#F4DCD6",
  "#64748b",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] as string;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminDayPanel({
  bookings,
  selectedDate,
  isLoading,
  onBookingClick,
}: AdminDayPanelProps) {
  const confirmedBookings = bookings.filter((b) => b.status !== "cancelled");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const sortedBookings = [...confirmedBookings, ...cancelledBookings];

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        padding: "0",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        border: "1px solid #e8eaf0",
        boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "1.125rem 1.25rem",
          borderBottom: "1px solid #e8eaf0",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 700,
            color: "#242a5f",
            lineHeight: 1.3,
          }}
        >
          {formatHungarianDate(selectedDate)}
        </h2>
        {!isLoading && (
          <p
            style={{
              margin: "0.375rem 0 0",
              fontSize: "0.8125rem",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            {bookings.length === 0
              ? "Nincs foglalás"
              : `${confirmedBookings.length} foglalás${cancelledBookings.length > 0 ? ` \u00B7 ${cancelledBookings.length} lemondva` : ""}`}
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: "none", overflowY: "visible", minHeight: "auto", padding: "0.5rem 0" }}>
        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "10rem",
              color: "#94a3b8",
              fontSize: "0.8125rem",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "1.5rem",
                height: "1.5rem",
                border: "2px solid #e2e8f0",
                borderTop: "2px solid #99CEB7",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            Betöltés...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && bookings.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "10rem",
              color: "#94a3b8",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "1.5rem",
              gap: "0.625rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Üres naptár"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Ezen a napon nincs foglalás.</span>
          </div>
        )}

        {/* Booking rows */}
        {!isLoading && sortedBookings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sortedBookings.map((booking) => {
              const isCancelled = booking.status === "cancelled";
              const isHovered = hoveredId === booking._id;
              const avatarColor = getAvatarColor(booking.patientName);
              const initial = getInitial(booking.patientName);

              return (
                <button
                  key={booking._id}
                  type="button"
                  onClick={() => onBookingClick(booking)}
                  onMouseEnter={() => setHoveredId(booking._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    minHeight: "3.75rem",
                    backgroundColor: isHovered ? "rgba(153,206,183,0.06)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid #f0f1f5",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    opacity: isCancelled ? 0.55 : 1,
                    transition: "background-color 0.15s",
                  }}
                >
                  {/* Avatar circle */}
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "50%",
                      backgroundColor: isCancelled ? "#475569" : avatarColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      opacity: isCancelled ? 0.6 : 0.85,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "#ffffff",
                        lineHeight: 1,
                      }}
                    >
                      {initial}
                    </span>
                  </div>

                  {/* Name + service block */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.125rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: isCancelled ? "#94a3b8" : "#1A1D2D",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                    >
                      {booking.patientName}
                    </span>
                    {booking.service && (
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "#94a3b8",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {booking.service.name}
                      </span>
                    )}
                  </div>

                  {/* Time + status + menu */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: isCancelled ? "#94a3b8" : "#1A1D2D",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {booking.slotTime}
                    </span>

                    {/* Status badge */}
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        padding: "0.1875rem 0.5rem",
                        borderRadius: "9999px",
                        backgroundColor: isCancelled
                          ? "rgba(231,193,211,0.15)"
                          : "rgba(153,206,183,0.15)",
                        color: isCancelled ? "#9f1239" : "#099268",
                        border: isCancelled
                          ? "1px solid rgba(231,193,211,0.25)"
                          : "1px solid rgba(153,206,183,0.25)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isCancelled ? "Lemondva" : "Visszaigazolva"}
                    </span>

                    {/* Three-dot menu */}
                    <span
                      style={{
                        width: "2rem",
                        height: "2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.375rem",
                        fontSize: "1.125rem",
                        color: "#64748b",
                        lineHeight: 1,
                        letterSpacing: "0.05em",
                        backgroundColor: isHovered ? "rgba(0,0,0,0.05)" : "transparent",
                        transition: "background-color 0.15s",
                      }}
                    >
                      &#8942;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
