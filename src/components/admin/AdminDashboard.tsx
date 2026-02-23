"use client";

import { useCallback, useEffect, useState } from "react";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminDayPanel from "@/components/admin/AdminDayPanel";
import { AdminSignOut } from "@/components/admin/AdminLogin";
import AdminPatientModal from "@/components/admin/AdminPatientModal";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AdminBooking = {
  _id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reservationNumber: string;
  service: { name: string; appointmentDuration: number } | null;
  slotDate: string;
  slotTime: string;
  status: string;
  managementToken: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${String(y)}-${m}-${d}`;
}

function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) =>
    `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

function getWeekRange(dateStr: string): { startDate: string; endDate: string } {
  const date = new Date(dateStr);
  const dow = date.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(monday), endDate: fmt(sunday) };
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface AdminSession {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  };
}

interface AdminDashboardProps {
  session: AdminSession;
  initialDayBookings: AdminBooking[];
  initialMonthBookings: AdminBooking[];
}

export default function AdminDashboard({
  session,
  initialDayBookings,
  initialMonthBookings,
}: AdminDashboardProps) {
  const todayStr = getTodayString();
  const today = new Date(todayStr);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [dayBookings, setDayBookings] = useState<AdminBooking[]>(initialDayBookings);
  const [monthBookings, setMonthBookings] = useState<AdminBooking[]>(initialMonthBookings);
  const [weekBookings, setWeekBookings] = useState<AdminBooking[]>([]);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchBookings = useCallback(
    async (startDate: string, endDate: string): Promise<AdminBooking[]> => {
      const res = await fetch(
        `/api/admin/bookings?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      );
      if (!res.ok) return [];
      const data = (await res.json()) as { bookings?: AdminBooking[] };
      return data.bookings ?? [];
    },
    [],
  );

  // ── Fetch day bookings when selectedDate changes ──────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setIsDayLoading(true);
    void fetchBookings(selectedDate, selectedDate).then((bookings) => {
      if (!cancelled) {
        setDayBookings(bookings);
        setIsDayLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, fetchBookings]);

  // ── Fetch week bookings when viewMode is week or selectedDate changes in week mode ──

  useEffect(() => {
    if (viewMode !== "week") return;
    let cancelled = false;
    const { startDate, endDate } = getWeekRange(selectedDate);
    void fetchBookings(startDate, endDate).then((bookings) => {
      if (!cancelled) setWeekBookings(bookings);
    });
    return () => {
      cancelled = true;
    };
  }, [viewMode, selectedDate, fetchBookings]);

  // ── Month navigation handler ──────────────────────────────────────────────────

  function handleMonthChange(year: number, month: number) {
    const { startDate, endDate } = getMonthRange(year, month);
    void fetchBookings(startDate, endDate).then(setMonthBookings);
  }

  // ── Booking click: open patient detail modal ──────────────────────────────────

  function handleBookingClick(booking: AdminBooking) {
    setSelectedBooking(booking);
  }

  // ── Cancel refresh: refetch day, month, and week bookings ─────────────────────

  async function handleCancelRefresh() {
    setSelectedBooking(null);

    // Refetch day bookings
    const updatedDay = await fetchBookings(selectedDate, selectedDate);
    setDayBookings(updatedDay);

    // Refetch month bookings
    const currentDate = new Date(selectedDate);
    const { startDate: mStart, endDate: mEnd } = getMonthRange(
      currentDate.getFullYear(),
      currentDate.getMonth(),
    );
    const updatedMonth = await fetchBookings(mStart, mEnd);
    setMonthBookings(updatedMonth);

    // Refetch week bookings (if in week mode)
    if (viewMode === "week") {
      const { startDate: wStart, endDate: wEnd } = getWeekRange(selectedDate);
      const updatedWeek = await fetchBookings(wStart, wEnd);
      setWeekBookings(updatedWeek);
    }
  }

  // ── Compute stats from dayBookings ────────────────────────────────────────────

  const confirmedCount = dayBookings.filter((b) => b.status === "confirmed").length;
  const cancelledCount = dayBookings.filter((b) => b.status === "cancelled").length;
  const totalToday = dayBookings.length;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F2F4F8",
        color: "#1A1D2D",
        fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#242a5f",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.01em",
          }}
        >
          Admin felület
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                borderRadius: "50%",
                backgroundColor: "#99CEB7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#242a5f",
              }}
            >
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
              }}
            >
              {session.user.name}
            </span>
          </div>
          <AdminSignOut />
        </div>
      </header>

      {/* ── Stats summary row ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.75rem",
          padding: "1.25rem 1.5rem 0",
          flexShrink: 0,
        }}
      >
        {/* Today's appointments */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            border: "1px solid #e8eaf0",
            borderLeft: "4px solid #242a5f",
            boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
            minHeight: "5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(36,42,95,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#242a5f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Naptár"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Mai foglalások
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#242a5f",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totalToday}
            </div>
          </div>
        </div>

        {/* Confirmed */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            border: "1px solid #e8eaf0",
            borderLeft: "4px solid #99CEB7",
            boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
            minHeight: "5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(153,206,183,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#099268"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Visszaigazolva"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Visszaigazolva
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#242a5f",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {confirmedCount}
            </div>
          </div>
        </div>

        {/* Cancelled */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            border: "1px solid #e8eaf0",
            borderLeft: "4px solid #e7c1d3",
            boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
            minHeight: "5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(231,193,211,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9f1239"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Lemondva"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Lemondva
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: cancelledCount > 0 ? "#9f1239" : "#94a3b8",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {cancelledCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-panel dashboard ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "1rem",
          padding: "1.25rem 1.5rem 1.5rem",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Left panel: Calendar (50%) ───────────────────────────────────── */}
        <div
          style={{
            flex: "0 0 50%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AdminCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            monthBookings={monthBookings}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onMonthChange={handleMonthChange}
            initialYear={today.getFullYear()}
            initialMonth={today.getMonth()}
            weekBookings={weekBookings}
            onBookingClick={handleBookingClick}
          />
        </div>

        {/* ── Right panel: Day appointments (50%) ─────────────────────────── */}
        <div
          style={{
            flex: "0 0 calc(50% - 1rem)",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AdminDayPanel
            bookings={dayBookings}
            selectedDate={selectedDate}
            isLoading={isDayLoading}
            onBookingClick={handleBookingClick}
          />
        </div>
      </div>

      {/* ── Patient detail modal ─────────────────────────────────────────────── */}
      {selectedBooking && (
        <AdminPatientModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancelled={() => void handleCancelRefresh()}
        />
      )}
    </div>
  );
}
