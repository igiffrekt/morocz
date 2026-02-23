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

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
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
          padding: "0.875rem 1.5rem",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "-0.01em",
          }}
        >
          Admin felület
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>{session.user.name}</span>
          <AdminSignOut />
        </div>
      </header>

      {/* ── Two-panel dashboard ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: "1rem",
          padding: "1rem",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ── Left panel: Calendar (60%) ───────────────────────────────────── */}
        <div
          style={{
            flex: "0 0 60%",
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

        {/* ── Right panel: Day appointments (40%) ─────────────────────────── */}
        <div
          style={{
            flex: "0 0 40%",
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
