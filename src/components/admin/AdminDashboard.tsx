"use client";

import AdminAppointmentHistoryView from "@/components/admin/AdminAppointmentHistoryView";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminCancelModal from "@/components/admin/AdminCancelModal";
import AdminDayPanel from "@/components/admin/AdminDayPanel";
import AdminFinanceView from "@/components/admin/AdminFinanceView";
import { AdminSignOut } from "@/components/admin/AdminLogin";
import AdminPatientModal from "@/components/admin/AdminPatientModal";
import AdminPatientsView from "@/components/admin/AdminPatientsView";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type NavTab = "calendar" | "patients" | "finance" | "history";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Nav tab button ──────────────────────────────────────────────────────────

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
      className="admin-nav-tab"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.375rem",
        padding: "0.5rem 1rem",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: active ? 600 : 500,
        backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
        color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
        transition: "all 0.15s ease",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {children}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

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
  const [dayBookings, setDayBookings] = useState<AdminBooking[]>(initialDayBookings);
  const [monthBookings, setMonthBookings] = useState<AdminBooking[]>(initialMonthBookings);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<AdminBooking | null>(null);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

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

  // ── Fetch day bookings when selectedDate changes ───────────────────────────

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

  // ── Month navigation ───────────────────────────────────────────────────────

  function handleMonthChange(year: number, month: number) {
    const { startDate, endDate } = getMonthRange(year, month);
    void fetchBookings(startDate, endDate).then(setMonthBookings);
  }

  function handleBookingClick(booking: AdminBooking) {
    setSelectedBooking(booking);
  }

  function handleCancelBooking(bookingId: string) {
    const booking = dayBookings.find((b) => b._id === bookingId);
    if (booking) {
      setCancellingBooking(booking);
    }
  }

  async function handleConfirmCancel(bookingId: string, reason?: string) {
    try {
      const res = await fetch("/api/admin/booking-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Hiba történt a lemondás során.");
        return;
      }

      setCancellingBooking(null);

      // Refresh bookings
      const updatedDay = await fetchBookings(selectedDate, selectedDate);
      setDayBookings(updatedDay);
      const currentDate = new Date(selectedDate);
      const { startDate: mStart, endDate: mEnd } = getMonthRange(
        currentDate.getFullYear(),
        currentDate.getMonth(),
      );
      const updatedMonth = await fetchBookings(mStart, mEnd);
      setMonthBookings(updatedMonth);
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert("Hiba történt a lemondás során.");
    }
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
  }

  const confirmedCount = dayBookings.filter((b) => b.status === "confirmed").length;
  const cancelledCount = dayBookings.filter((b) => b.status === "cancelled").length;
  const totalToday = dayBookings.length;

  return (
    <div
      style={{
        minHeight: "auto",
        backgroundColor: "#F2F4F8",
        color: "#1A1D2D",
        fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      <style>{`
        /* ─── Header responsive strategy ─────────────────────────── */
        /* Mobile: stacked layout — nav always visible */
        /* Desktop: single row — [logo] [nav] [user] */

        .admin-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          background-color: #242a5f;
          border-radius: 0 0 1rem 1rem;
          margin-bottom: 1rem;
          gap: 0.75rem;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .admin-header-logo {
          flex-shrink: 0;
          order: 1;
        }

        .admin-header-nav {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          flex-wrap: wrap;
          visibility: visible;
          opacity: 1;
          height: auto;
          width: 100%;
          order: 3;
          padding-top: 0.25rem;
        }

        .admin-header-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          order: 2;
        }

        .admin-nav-tab:hover {
          background-color: rgba(255,255,255,0.15) !important;
          color: #ffffff !important;
          transform: translateY(-1px);
        }

        /* Desktop: single row */
        @media (min-width: 769px) {
          .admin-header {
            flex-wrap: nowrap;
            justify-content: flex-start;
            align-items: center;
            padding: 0.75rem 1.5rem;
            gap: 1.5rem;
          }

          .admin-header-logo {
            flex-shrink: 0;
            order: 1;
          }

          .admin-header-nav {
            flex: 1 1 auto;
            justify-content: center;
            order: 2;
            gap: 0.5rem;
            flex-wrap: nowrap;
            width: auto;
            padding-top: 0;
          }

          .admin-header-user {
            order: 3;
            flex-shrink: 0;
            margin-left: auto;
          }
        }

        /* ─── Mobile responsive layout ─────────────────────────── */
        @media (max-width: 768px) {
          /* Two-panel layout — single column on mobile */
          [data-admin-two-panel] {
            flex-direction: column !important;
          }

          [data-admin-two-panel] > div {
            flex: 0 0 100% !important;
          }

          /* Stats grid — scrollable horizontally on mobile */
          .admin-stats-grid {
            grid-template-columns: repeat(3, minmax(100px, 1fr)) !important;
            gap: 0.375rem !important;
            padding: 0.75rem 0.75rem 0 !important;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }

          /* Stat box — mobile optimized */
          .stat-box-label {
            font-size: 0.65rem !important;
            letter-spacing: 0.02em !important;
          }

          .stat-box-value {
            font-size: 1.625rem !important;
          }

          /* Table — compact on mobile */
          table {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 400px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.25rem !important;
          }

          .stat-box-label {
            font-size: 0.6rem !important;
          }

          .stat-box-value {
            font-size: 1.5rem !important;
          }

          .admin-header {
            gap: 0.5rem;
          }

          .admin-header-nav {
            gap: 0.125rem;
            padding-top: 0.375rem;
          }

          .admin-nav-tab {
            font-size: 0.75rem !important;
            padding: 0.4rem 0.75rem !important;
          }
        }

        @media (min-width: 1024px) {
          [data-admin-two-panel] {
            flex-direction: row !important;
          }

          [data-admin-two-panel] > div {
            flex: 0 0 50% !important;
          }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="admin-header" data-admin-header="true">
        {/* Left: Logo */}
        <div className="admin-header-logo">
          <Image src="/mm-logo-square.svg" alt="Mórocz Medical" width={32} height={32} />
        </div>

        {/* Center: Navigation tabs */}
        <nav className="admin-header-nav">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className="admin-nav-tab"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "calendar" ? 600 : 500,
              backgroundColor: activeTab === "calendar" ? "rgba(255,255,255,0.18)" : "transparent",
              color: activeTab === "calendar" ? "#ffffff" : "rgba(255,255,255,0.6)",
              transition: "all 0.15s ease",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            📅 Naptár
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("patients")}
            className="admin-nav-tab"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "patients" ? 600 : 500,
              backgroundColor: activeTab === "patients" ? "rgba(255,255,255,0.18)" : "transparent",
              color: activeTab === "patients" ? "#ffffff" : "rgba(255,255,255,0.6)",
              transition: "all 0.15s ease",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            👥 Páciensek
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className="admin-nav-tab"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "finance" ? 600 : 500,
              backgroundColor: activeTab === "finance" ? "rgba(255,255,255,0.18)" : "transparent",
              color: activeTab === "finance" ? "#ffffff" : "rgba(255,255,255,0.6)",
              transition: "all 0.15s ease",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            💰 Pénzügyek
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="admin-nav-tab"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "history" ? 600 : 500,
              backgroundColor: activeTab === "history" ? "rgba(255,255,255,0.18)" : "transparent",
              color: activeTab === "history" ? "#ffffff" : "rgba(255,255,255,0.6)",
              transition: "all 0.15s ease",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            Foglalási történet
          </button>
        </nav>

        {/* Right: User + sign out */}
        <div className="admin-header-user">
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div
              style={{
                width: "1.625rem",
                height: "1.625rem",
                borderRadius: "50%",
                backgroundColor: "#99CEB7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "#242a5f",
                flexShrink: 0,
              }}
            >
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.8)",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {session.user.name.split(" ")[0]}
            </span>
          </div>
          <AdminSignOut />
        </div>
      </header>

      {/* ── Calendar view ─────────────────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <>
          {/* Stats summary */}
          <div
            className="admin-stats-grid"
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
              iconPath={
                <>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </>
              }
              iconLabel="Naptár"
              labelColor="#242a5f"
            />
            <StatBox
              label="Aktív"
              value={confirmedCount}
              accent="#99CEB7"
              iconStroke="#099268"
              iconPath={<polyline points="20 6 9 17 4 12" />}
              iconLabel="Aktív"
              valueColor="#099268"
              labelColor="#099268"
            />
            <StatBox
              label="Lemondva"
              value={cancelledCount}
              accent="#e7c1d3"
              iconStroke="#9f1239"
              iconPath={
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              }
              iconLabel="Lemondva"
              valueColor="#9f1239"
              labelColor="#9f1239"
            />
          </div>

          {/* Two-panel layout — responsive */}
          <div
            style={{
              display: "flex",
              flex: "none",
              gap: "1rem",
              padding: "1.25rem 1rem 1.5rem",
              minHeight: 0,
              overflow: "visible",
              flexDirection: "column",
            }}
          >
            <div
              data-admin-two-panel
              style={{ display: "flex", flex: "none", gap: "1rem", flexDirection: "column" }}
            >
              <div
                style={{
                  flex: "0 0 100%",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "fit-content",
                }}
              >
                <AdminCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  monthBookings={monthBookings}
                  onMonthChange={handleMonthChange}
                  initialYear={today.getFullYear()}
                  initialMonth={today.getMonth()}
                  onBookingClick={handleBookingClick}
                />
              </div>
              <div
                style={{
                  flex: "0 0 100%",
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
                  onCancelBooking={handleCancelBooking}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Patients view ─────────────────────────────────────────────────── */}
      {activeTab === "patients" && <AdminPatientsView />}

      {/* ── Finance view ──────────────────────────────────────────────────── */}
      {activeTab === "finance" && <AdminFinanceView />}

      {/* ── Appointment History view ──────────────────────────────────────── */}
      {activeTab === "history" && <AdminAppointmentHistoryView />}

      {/* ── Patient detail modal ──────────────────────────────────────────── */}
      {selectedBooking && (
        <AdminPatientModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancelled={() => void handleCancelRefresh()}
        />
      )}

      {/* ── Cancel booking modal ──────────────────────────────────────────── */}
      {cancellingBooking && (
        <AdminCancelModal
          bookingId={cancellingBooking._id}
          patientName={cancellingBooking.patientName}
          slotDate={cancellingBooking.slotDate}
          slotTime={cancellingBooking.slotTime}
          serviceName={cancellingBooking.service?.name ?? null}
          onClose={() => setCancellingBooking(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}

// ─── Inline stat box (calendar view) ─────────────────────────────────────────

function StatBox({
  label,
  value,
  accent,
  iconStroke,
  iconPath,
  iconLabel,
  valueColor = "#242a5f",
  labelColor = "#242a5f",
}: {
  label: string;
  value: number;
  accent: string;
  iconStroke: string;
  iconPath: React.ReactNode;
  iconLabel: string;
  valueColor?: string;
  labelColor?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        padding: "0.875rem 1rem",
        border: "1px solid #e8eaf0",
        borderLeft: `4px solid ${accent}`,
        boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
        minHeight: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.375rem",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
        <div
          className="stat-box-label"
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: labelColor,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {label}
        </div>
        <div
          className="stat-box-value"
          style={{
            fontSize: "1.875rem",
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
