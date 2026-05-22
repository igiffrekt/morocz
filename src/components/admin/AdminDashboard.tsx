"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminAppointmentHistoryView from "@/components/admin/AdminAppointmentHistoryView";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminCancelModal from "@/components/admin/AdminCancelModal";
import AdminDayPanel from "@/components/admin/AdminDayPanel";
import AdminFinanceView from "@/components/admin/AdminFinanceView";
import { AdminSignOut } from "@/components/admin/AdminLogin";
import AdminManualBookingModal from "@/components/admin/AdminManualBookingModal";
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
  paymentStatus: string | null;
  completedServices?: { serviceId: string; serviceName: string; price: number }[] | null;
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
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ── Close profile dropdown on outside click ────────────────────────────────
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

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

  async function handleConfirmCancel(bookingId: string, reason?: string, refund?: boolean) {
    try {
      const res = await fetch("/api/admin/booking-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason, refund }),
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
        minHeight: "100vh",
        backgroundColor: "#F2F4F8",
        color: "#1A1D2D",
        fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      <style>{`
        .admin-header {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: flex-start;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #1e2152 0%, #2a3070 50%, #242a5f 100%);
          border-bottom: 1px solid rgba(153,206,183,0.15);
          gap: 0.75rem;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .admin-header-logo { flex-shrink: 0; }

        .admin-header-nav {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          flex-wrap: nowrap;
          flex: 1 1 auto;
          padding: 0.25rem;
          background: rgba(0,0,0,0.2);
          border-radius: 0.75rem;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-shrink: 0;
          margin-left: auto;
          position: relative;
        }

        .admin-nav-tab {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 500;
          background-color: transparent;
          color: rgba(255,255,255,0.5);
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: 0.01em;
          white-space: nowrap;
          line-height: 1.4;
        }

        .admin-nav-tab:hover {
          background-color: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.85) !important;
        }

        .admin-nav-tab[data-active="true"] {
          background: rgba(153,206,183,0.15) !important;
          color: #99CEB7 !important;
          font-weight: 600 !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }

        .admin-nav-tab svg {
          opacity: 0.7;
          transition: opacity 0.2s;
          width: 20px;
          height: 20px;
        }

        .admin-nav-tab[data-active="true"] svg {
          opacity: 1;
        }

        .admin-profile-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: #ffffff;
          border-radius: 0.75rem;
          box-shadow: 0 8px 30px rgba(36,42,95,0.18);
          border: 1px solid #e8eaf0;
          min-width: 12rem;
          z-index: 100;
          overflow: hidden;
          animation: adminDropIn 0.15s ease-out;
        }

        @keyframes adminDropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          [data-admin-two-panel] { flex-direction: column !important; }
          [data-admin-two-panel] > div { flex: 0 0 100% !important; }
          .admin-header-stats { display: none !important; }
          .admin-content-width { max-width: 100vw !important; padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          .admin-header { padding: 0.375rem 0.5rem; gap: 0.375rem; }
          .admin-header-nav { gap: 0.125rem; padding: 0.1875rem; }
          .admin-nav-tab { font-size: 0.75rem !important; padding: 0.5rem 0.75rem !important; gap: 0.25rem !important; min-height: 2.5rem; }
          .admin-nav-tab svg { width: 20px !important; height: 20px !important; }
          .admin-nav-tab-label { display: none !important; }
          table { font-size: 0.7rem !important; }
        }

        @media (min-width: 1024px) {
          [data-admin-two-panel] { flex-direction: row !important; }
          [data-admin-two-panel] > div { flex: 0 0 50% !important; }
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#1e2152",
        }}
      >
        <header
          className="admin-header admin-content-width"
          data-admin-header="true"
          style={{ maxWidth: "75vw", width: "100%" }}
        >
          <div className="admin-header-logo">
            <Image src="/mm-logo-square.svg" alt="Mórocz Medical" width={30} height={30} />
          </div>

          <nav className="admin-header-nav">
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className="admin-nav-tab"
              data-active={activeTab === "calendar"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="admin-nav-tab-label">Naptár</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("patients")}
              className="admin-nav-tab"
              data-active={activeTab === "patients"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="admin-nav-tab-label">Páciensek</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("finance")}
              className="admin-nav-tab"
              data-active={activeTab === "finance"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="admin-nav-tab-label">Pénzügyek</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className="admin-nav-tab"
              data-active={activeTab === "history"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="admin-nav-tab-label">Történet</span>
            </button>
          </nav>

          <div className="admin-header-right">
            {activeTab === "calendar" && (
              <div
                className="admin-header-stats"
                style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "0.1875rem 0.5rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                    whiteSpace: "nowrap",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {totalToday}
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "0.1875rem 0.5rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(153,206,183,0.12)",
                    color: "#99CEB7",
                    whiteSpace: "nowrap",
                    border: "1px solid rgba(153,206,183,0.15)",
                  }}
                >
                  {confirmedCount} aktív
                </span>
                {cancelledCount > 0 && (
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "0.1875rem 0.5rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "rgba(231,193,211,0.12)",
                      color: "#e7c1d3",
                      whiteSpace: "nowrap",
                      border: "1px solid rgba(231,193,211,0.15)",
                    }}
                  >
                    {cancelledCount}
                  </span>
                )}
              </div>
            )}

            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  background: "linear-gradient(135deg, #99CEB7, #7ab89e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                  boxShadow: "0 1px 4px rgba(153,206,183,0.3)",
                  border: profileOpen ? "2px solid #99CEB7" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                aria-label="Profil menü"
              >
                {session.user.name.charAt(0).toUpperCase()}
              </button>

              {profileOpen && (
                <div className="admin-profile-dropdown">
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #e8eaf0" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#242a5f" }}>
                      {session.user.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.125rem" }}>
                      {session.user.email}
                    </div>
                  </div>
                  <div style={{ padding: "0.25rem" }}>
                    <AdminSignOut />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* ── Content area ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#F2F4F8",
          display: "flex",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <div
          className="admin-content-width"
          style={{
            width: "100%",
            maxWidth: "75vw",
            padding: "1rem 0 1.5rem",
          }}
        >
          {activeTab === "calendar" && (
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
                  onAddBooking={() => setShowManualBooking(true)}
                />
              </div>
            </div>
          )}

          {activeTab === "patients" && <AdminPatientsView />}

          {activeTab === "finance" && <AdminFinanceView />}

          {activeTab === "history" && <AdminAppointmentHistoryView />}
        </div>
      </div>

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
          paymentStatus={cancellingBooking.paymentStatus}
          onClose={() => setCancellingBooking(null)}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* ── Manual booking modal ─────────────────────────────────────────── */}
      {showManualBooking && (
        <AdminManualBookingModal
          selectedDate={selectedDate}
          onClose={() => setShowManualBooking(false)}
          onCreated={() => {
            setShowManualBooking(false);
            void (async () => {
              const updatedDay = await fetchBookings(selectedDate, selectedDate);
              setDayBookings(updatedDay);
              const currentDate = new Date(selectedDate);
              const { startDate: mStart, endDate: mEnd } = getMonthRange(
                currentDate.getFullYear(),
                currentDate.getMonth(),
              );
              const updatedMonth = await fetchBookings(mStart, mEnd);
              setMonthBookings(updatedMonth);
            })();
          }}
        />
      )}
    </div>
  );
}
