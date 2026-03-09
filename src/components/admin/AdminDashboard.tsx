"use client";

import { useCallback, useEffect, useState } from "react";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminDayPanel from "@/components/admin/AdminDayPanel";
import AdminFinanceView from "@/components/admin/AdminFinanceView";
import { AdminSignOut } from "@/components/admin/AdminLogin";
import AdminPatientModal from "@/components/admin/AdminPatientModal";
import AdminPatientsView from "@/components/admin/AdminPatientsView";

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

type NavTab = "calendar" | "patients" | "finance";

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
  const dow = date.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(monday), endDate: fmt(sunday) };
}

// ─── Nav tab button ────────────────────────────────────────────────────────────

function NavTabBtn({
  id,
  active,
  onClick,
  children,
}: {
  id: NavTab;
  active: boolean;
  onClick: (id: NavTab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.375rem 0.875rem",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: active ? 600 : 500,
        backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
        color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
        transition: "all 0.15s",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </button>
  );
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

  const [activeTab, setActiveTab] = useState<NavTab>("calendar");
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

  // ── Fetch week bookings ────────────────────────────────────────────────────────

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

  // ── Month navigation ──────────────────────────────────────────────────────────

  function handleMonthChange(year: number, month: number) {
    const { startDate, endDate } = getMonthRange(year, month);
    void fetchBookings(startDate, endDate).then(setMonthBookings);
  }

  function handleBookingClick(booking: AdminBooking) {
    setSelectedBooking(booking);
  }

  async function handleCancelRefresh() {
    setSelectedBooking(null);
    const updatedDay = await fetchBookings(selectedDate, selectedDate);
    setDayBookings(updatedDay);
    const currentDate = new Date(selectedDate);
    const { startDate: mStart, endDate: mEnd } = getMonthRange(
      currentDate.getFullYear(),
      currentDate.getMonth(),
    );
    const updatedMonth = await fetchBookings(mStart, mEnd);
    setMonthBookings(updatedMonth);
    if (viewMode === "week") {
      const { startDate: wStart, endDate: wEnd } = getWeekRange(selectedDate);
      const updatedWeek = await fetchBookings(wStart, wEnd);
      setWeekBookings(updatedWeek);
    }
  }

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
          padding: "0.625rem 1.5rem",
          backgroundColor: "#242a5f",
          flexShrink: 0,
          gap: "1rem",
        }}
      >
        {/* Left: Brand */}
        <h1
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            flexShrink: 0,
          }}
        >
          Mórocz Medical
        </h1>

        {/* Center: Navigation tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <NavTabBtn id="calendar" active={activeTab === "calendar"} onClick={setActiveTab}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Naptár
          </NavTabBtn>

          <NavTabBtn id="patients" active={activeTab === "patients"} onClick={setActiveTab}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Páciensek
          </NavTabBtn>

          <NavTabBtn id="finance" active={activeTab === "finance"} onClick={setActiveTab}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Pénzügyek
          </NavTabBtn>
        </nav>

        {/* Right: User + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
            <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              {session.user.name}
            </span>
          </div>
          <AdminSignOut />
        </div>
      </header>

      {/* ── Calendar view ────────────────────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <>
          {/* Stats summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
              padding: "1.25rem 1.5rem 0",
              flexShrink: 0,
            }}
          >
            <StatBox
              label="Mai foglalások"
              value={totalToday}
              accent="#242a5f"
              iconStroke="#242a5f"
              iconPath={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
              iconLabel="Naptár"
            />
            <StatBox
              label="Visszaigazolva"
              value={confirmedCount}
              accent="#99CEB7"
              iconStroke="#099268"
              iconPath={<polyline points="20 6 9 17 4 12" />}
              iconLabel="Visszaigazolva"
              valueColor="#242a5f"
            />
            <StatBox
              label="Lemondva"
              value={cancelledCount}
              accent="#e7c1d3"
              iconStroke="#9f1239"
              iconPath={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
              iconLabel="Lemondva"
              valueColor={cancelledCount > 0 ? "#9f1239" : "#94a3b8"}
            />
          </div>

          {/* Two-panel layout */}
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
            <div style={{ flex: "0 0 50%", minWidth: 0, display: "flex", flexDirection: "column" }}>
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
        </>
      )}

      {/* ── Patients view ────────────────────────────────────────────────────── */}
      {activeTab === "patients" && <AdminPatientsView />}

      {/* ── Finance view ─────────────────────────────────────────────────────── */}
      {activeTab === "finance" && <AdminFinanceView />}

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

// ─── Inline stat box (calendar view) ───────────────────────────────────────────

function StatBox({
  label,
  value,
  accent,
  iconStroke,
  iconPath,
  iconLabel,
  valueColor = "#242a5f",
}: {
  label: string;
  value: number;
  accent: string;
  iconStroke: string;
  iconPath: React.ReactNode;
  iconLabel: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        padding: "1rem 1.25rem",
        border: "1px solid #e8eaf0",
        borderLeft: `4px solid ${accent}`,
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
          backgroundColor: `${accent}28`,
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
          stroke={iconStroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label={iconLabel}
        >
          {iconPath}
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
          {label}
        </div>
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: valueColor,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
