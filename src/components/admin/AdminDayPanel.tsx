"use client";

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
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1rem", flexShrink: 0 }}>
        <h2
          style={{
            margin: "0 0 0.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Napi foglalások
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#f8fafc",
            textTransform: "capitalize",
          }}
        >
          {formatHungarianDate(selectedDate)}
        </p>
        {!isLoading && bookings.length > 0 && (
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#64748b" }}>
            {confirmedBookings.length} foglalás
            {cancelledBookings.length > 0 ? `, ${cancelledBookings.length} lemondva` : ""}
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "8rem",
              color: "#64748b",
              fontSize: "0.875rem",
            }}
          >
            Betöltés...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && bookings.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "8rem",
              color: "#64748b",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            Ezen a napon nincs foglalás.
          </div>
        )}

        {/* Booking rows */}
        {!isLoading && bookings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {bookings.map((booking) => {
              const isCancelled = booking.status === "cancelled";

              return (
                <button
                  key={booking._id}
                  type="button"
                  onClick={() => onBookingClick(booking)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                    padding: "0.75rem",
                    backgroundColor: isCancelled ? "#0f172a" : "#0f172a",
                    border: `1px solid ${isCancelled ? "#334155" : "#334155"}`,
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    opacity: isCancelled ? 0.6 : 1,
                    transition: "all 0.1s",
                  }}
                >
                  {/* Time + Status badge row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {booking.slotTime}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "9999px",
                        backgroundColor: isCancelled ? "#374151" : "#166534",
                        color: isCancelled ? "#9ca3af" : "#bbf7d0",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        flexShrink: 0,
                      }}
                    >
                      {isCancelled ? "Lemondva" : "Visszaigazolva"}
                    </span>
                  </div>

                  {/* Patient name */}
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "#f8fafc",
                    }}
                  >
                    {booking.patientName}
                  </span>

                  {/* Service name */}
                  {booking.service && (
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "#94a3b8",
                      }}
                    >
                      {booking.service.name}
                    </span>
                  )}

                  {/* Phone */}
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "#64748b",
                    }}
                  >
                    {booking.patientPhone}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
