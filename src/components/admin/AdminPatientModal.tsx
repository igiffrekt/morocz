"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminBooking } from "@/components/admin/AdminDashboard";
import AdminPatientHistory from "@/components/admin/AdminPatientHistory";
import AdminRescheduleModal from "@/components/admin/AdminRescheduleModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHungarianDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function isWithin24Hours(slotDate: string, slotTime: string): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - Date.now()) / (1000 * 60 * 60) < 24;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AdminPatientModalProps {
  booking: AdminBooking;
  onClose: () => void;
  onCancelled: () => void;
}

// ─── Sub-types ───────────────────────────────────────────────────────────────

type ModalView = "detail" | "cancel-confirm" | "complete" | "noshow-confirm";

type ServiceOption = {
  _id: string;
  name: string;
  price: number | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPatientModal({
  booking,
  onClose,
  onCancelled,
}: AdminPatientModalProps) {
  const [view, setView] = useState<ModalView>("detail");
  const [activeTab, setActiveTab] = useState<"bookings" | "history">("bookings");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [patientHistory, setPatientHistory] = useState<AdminBooking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [allServices, setAllServices] = useState<ServiceOption[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";
  const isNoShow = booking.status === "no-show";
  const canCancel =
    !isCancelled &&
    !isCompleted &&
    !isNoShow &&
    !isWithin24Hours(booking.slotDate, booking.slotTime);
  const canComplete = !isCancelled && !isCompleted && !isNoShow;
  const canEditCompleted = isCompleted;
  const canMarkNoShow = !isCancelled && !isCompleted && !isNoShow;
  const canReschedule = !isCancelled && !isCompleted && !isNoShow && booking.serviceId != null;
  const formattedDate = formatHungarianDate(booking.slotDate);

  // ── Fetch patient booking history ──────────────────────────────────────────
  useEffect(() => {
    setHistoryLoading(true);
    void fetch(`/api/admin/bookings?email=${encodeURIComponent(booking.patientEmail)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { bookings?: AdminBooking[] }) => {
        setPatientHistory(data.bookings ?? []);
      })
      .catch(() => {
        setPatientHistory([]);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [booking.patientEmail]);

  // ── Close menu on outside click ────────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  // ── Fetch services for complete booking ─────────────────────────────────────
  useEffect(() => {
    if (view !== "complete") return;
    void fetch("/api/admin/services")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { services?: ServiceOption[] }) => {
        setAllServices(data.services ?? []);
      })
      .catch(() => setAllServices([]));
  }, [view]);

  // ── Pre-fill selected services when editing a completed booking ───────────
  useEffect(() => {
    if (view !== "complete" || !isCompleted) return;
    const recorded = booking.completedServices ?? [];
    if (recorded.length === 0) return;
    setSelectedServices(
      recorded.map((s) => ({ _id: s.serviceId, name: s.serviceName, price: s.price })),
    );
  }, [view, isCompleted, booking.completedServices]);

  // ── Close service dropdown on outside click ────────────────────────────────
  useEffect(() => {
    if (!serviceDropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target as Node)) {
        setServiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [serviceDropdownOpen]);

  // ── Complete booking handler ───────────────────────────────────────────────
  async function handleCompleteBooking() {
    if (selectedServices.length === 0) return;
    setIsCompleting(true);
    setCompleteError(null);
    try {
      const res = await fetch("/api/admin/booking-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          completedServices: selectedServices.map((s) => ({
            serviceId: s._id,
            serviceName: s.name,
            price: s.price ?? 0,
          })),
        }),
      });
      if (res.ok) {
        onCancelled();
      } else {
        const data = (await res.json()) as { error?: string };
        setCompleteError(data.error ?? "Ismeretlen hiba történt.");
      }
    } catch {
      setCompleteError("Hálózati hiba. Kérjük, próbálja újra.");
    } finally {
      setIsCompleting(false);
    }
  }

  // ── Cancel handler ─────────────────────────────────────────────────────────
  async function handleCancelConfirm() {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/admin/booking-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          reason: cancelReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        onCancelled();
      } else {
        const data = (await res.json()) as { error?: string };
        setCancelError(data.error ?? "Ismeretlen hiba történt.");
      }
    } catch {
      setCancelError("Hálózati hiba. Kérjük, próbálja újra.");
    } finally {
      setIsCancelling(false);
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const S = {
    backdrop: {
      position: "fixed" as const,
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      zIndex: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    },
    modal: {
      position: "relative" as const,
      backgroundColor: "#ffffff",
      borderRadius: "1.5rem",
      width: "100%",
      maxWidth: "32rem",
      maxHeight: "90vh",
      overflowY: "auto" as const,
      overflowX: "hidden" as const,
      zIndex: 50,
      padding: "1.5rem",
      boxShadow: "0 25px 50px rgba(36,42,95,0.15)",
    },
    closeBtn: {
      position: "absolute" as const,
      top: "1rem",
      right: "3rem",
      background: "none",
      border: "none",
      color: "#94a3b8",
      fontSize: "1.25rem",
      cursor: "pointer",
      padding: "0.25rem",
      lineHeight: 1,
      borderRadius: "0.25rem",
    },
    menuBtn: {
      position: "absolute" as const,
      top: "1rem",
      right: "1rem",
      background: "none",
      border: "1px solid #e8eaf0",
      color: "#64748b",
      fontSize: "1.125rem",
      cursor: "pointer",
      padding: "0.1875rem 0.5rem",
      lineHeight: 1,
      borderRadius: "0.375rem",
      letterSpacing: "0.05em",
    },
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop close on click
    <div style={S.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal click trap prevents backdrop close */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal click trap prevents backdrop close */}
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Close (X) button ────────────────────────────────────────────── */}
        <button type="button" style={S.closeBtn} onClick={onClose} aria-label="Bezárás">
          ✕
        </button>

        {/* ── Three-dot menu button ───────────────────────────────────────── */}
        {(canCancel || canComplete || canMarkNoShow || canEditCompleted || canReschedule) && (
          <button
            ref={menuButtonRef}
            type="button"
            style={S.menuBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Műveletek"
          >
            ⋮
          </button>
        )}

        {/* ── Dropdown menu ───────────────────────────────────────────────── */}
        {menuOpen &&
          (canCancel || canComplete || canMarkNoShow || canEditCompleted || canReschedule) && (
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: (() => {
                  const rect = menuButtonRef.current?.getBoundingClientRect();
                  return rect ? `${rect.bottom + 4}px` : "auto";
                })(),
                left: (() => {
                  const rect = menuButtonRef.current?.getBoundingClientRect();
                  return rect ? `${rect.left}px` : "auto";
                })(),
                backgroundColor: "#ffffff",
                border: "1px solid #e8eaf0",
                borderRadius: "0.75rem",
                boxShadow: "0 8px 24px rgba(36,42,95,0.12)",
                zIndex: 60,
                minWidth: "12rem",
                overflow: "hidden",
              }}
            >
              {canComplete && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setView("complete");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "none",
                    border: "none",
                    color: "#099268",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left" as const,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Vizit lezárása
                </button>
              )}
              {canEditCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setView("complete");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left" as const,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Vizit szerkesztése
                </button>
              )}
              {canReschedule && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowReschedule(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "none",
                    border: "none",
                    borderTop: canComplete || canEditCompleted ? "1px solid #e8eaf0" : "none",
                    color: "#2563eb",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left" as const,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Időpont áthelyezése
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setView("cancel-confirm");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "none",
                    border: "none",
                    borderTop: canComplete ? "1px solid #e8eaf0" : "none",
                    color: "#9f1239",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left" as const,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Időpont lemondása
                </button>
              )}
              {canMarkNoShow && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setView("noshow-confirm");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid #e8eaf0",
                    color: "#d97706",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left" as const,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Nem jelent meg
                </button>
              )}
            </div>
          )}

        {/* ── Patient info section ────────────────────────────────────────── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h2
            style={{
              margin: "0 0 0.875rem",
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#242a5f",
              paddingRight: "4rem",
            }}
          >
            {booking.patientName}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {/* Email */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}>
                E-mail
              </span>
              <a
                href={`mailto:${booking.patientEmail}`}
                style={{ fontSize: "0.875rem", color: "#242a5f", textDecoration: "none" }}
              >
                {booking.patientEmail}
              </a>
            </div>

            {/* Phone */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}>
                Telefon
              </span>
              <a
                href={`tel:${booking.patientPhone}`}
                style={{ fontSize: "0.875rem", color: "#242a5f", textDecoration: "none" }}
              >
                {booking.patientPhone}
              </a>
            </div>

            {/* Service */}
            {booking.service && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}
                >
                  Szolgáltatás
                </span>
                <span style={{ fontSize: "0.875rem", color: "#1A1D2D" }}>
                  {booking.service.name}
                </span>
              </div>
            )}

            {/* Date */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}>
                Dátum
              </span>
              <span style={{ fontSize: "0.875rem", color: "#1A1D2D" }}>{formattedDate}</span>
            </div>

            {/* Time */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}>
                Időpont
              </span>
              <span style={{ fontSize: "0.875rem", color: "#1A1D2D" }}>{booking.slotTime}</span>
            </div>

            {/* Reservation number */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}>
                Foglalási sz.
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#94a3b8",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {booking.reservationNumber}
              </span>
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "5rem", flexShrink: 0 }}>
                Státusz
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.1875rem 0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: isCancelled
                    ? "rgba(231,193,211,0.15)"
                    : isCompleted
                      ? "rgba(59,130,246,0.1)"
                      : isNoShow
                        ? "rgba(217,119,6,0.1)"
                        : "rgba(153,206,183,0.15)",
                  color: isCancelled
                    ? "#9f1239"
                    : isCompleted
                      ? "#2563eb"
                      : isNoShow
                        ? "#d97706"
                        : "#099268",
                  border: isCancelled
                    ? "1px solid rgba(231,193,211,0.25)"
                    : isCompleted
                      ? "1px solid rgba(59,130,246,0.2)"
                      : isNoShow
                        ? "1px solid rgba(217,119,6,0.2)"
                        : "1px solid rgba(153,206,183,0.25)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.04em",
                }}
              >
                {isCancelled
                  ? "Lemondva"
                  : isCompleted
                    ? "Teljesítve"
                    : isNoShow
                      ? "Nem jelent meg"
                      : "Visszaigazolva"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick action: Complete booking ──────────────────────────────── */}
        {canComplete && view === "detail" && (
          <button
            type="button"
            onClick={() => setView("complete")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              width: "100%",
              padding: "0.625rem 1rem",
              backgroundColor: "#099268",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: "1rem",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#047857";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#099268";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Vizit lezárása
          </button>
        )}

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid #e8eaf0", marginBottom: "1.25rem" }} />

        {/* ── Complete booking view ────────────────────────────────────────── */}
        {view === "complete" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3
              style={{
                margin: "0 0 0.75rem",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#099268",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {isCompleted ? "Vizit szerkesztése" : "Vizit lezárása"}
            </h3>
            <p style={{ margin: "0 0 0.875rem", fontSize: "0.875rem", color: "#64748b" }}>
              {isCompleted
                ? "Módosítsa az elvégzett szolgáltatásokat vagy árakat:"
                : "Válassza ki az elvégzett szolgáltatásokat:"}
            </p>

            {/* Searchable service dropdown */}
            <div ref={serviceDropdownRef} style={{ position: "relative", marginBottom: "0.75rem" }}>
              <div
                onClick={() => setServiceDropdownOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.375rem",
                  minHeight: "2.5rem",
                  padding: "0.375rem 0.625rem",
                  border: "1px solid #e8eaf0",
                  borderRadius: "0.75rem",
                  cursor: "pointer",
                  backgroundColor: "#ffffff",
                }}
              >
                {selectedServices.map((s) => (
                  <span
                    key={s._id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.1875rem 0.5rem",
                      backgroundColor: "rgba(153,206,183,0.15)",
                      color: "#099268",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {s.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServices((prev) => prev.filter((x) => x._id !== s._id));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#099268",
                        cursor: "pointer",
                        padding: "0",
                        fontSize: "0.875rem",
                        lineHeight: 1,
                        display: "flex",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {selectedServices.length === 0 && (
                  <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                    Szolgáltatás kiválasztása...
                  </span>
                )}
              </div>

              {serviceDropdownOpen && (
                <div
                  style={{
                    position: "fixed",
                    top: (() => {
                      const rect = serviceDropdownRef.current?.getBoundingClientRect();
                      return rect ? `${rect.bottom + 4}px` : "auto";
                    })(),
                    left: (() => {
                      const rect = serviceDropdownRef.current?.getBoundingClientRect();
                      return rect ? `${rect.left}px` : "auto";
                    })(),
                    width: (() => {
                      const rect = serviceDropdownRef.current?.getBoundingClientRect();
                      return rect ? `${rect.width}px` : "auto";
                    })(),
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8eaf0",
                    borderRadius: "0.75rem",
                    boxShadow: "0 8px 24px rgba(36,42,95,0.12)",
                    zIndex: 70,
                    maxHeight: "15rem",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ padding: "0.5rem", borderBottom: "1px solid #e8eaf0" }}>
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Keresés..."
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "0.375rem 0.625rem",
                        border: "1px solid #e8eaf0",
                        borderRadius: "0.5rem",
                        fontSize: "0.8125rem",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <div style={{ overflowY: "auto", maxHeight: "11rem" }}>
                    {allServices
                      .filter((s) => {
                        const q = serviceSearch.toLowerCase();
                        return s.name.toLowerCase().includes(q);
                      })
                      .filter((s) => !selectedServices.some((sel) => sel._id === s._id))
                      .map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setSelectedServices((prev) => [...prev, s]);
                            setServiceSearch("");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            background: "none",
                            border: "none",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            textAlign: "left",
                            fontSize: "0.8125rem",
                            color: "#1A1D2D",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <span>{s.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                            {s.price != null ? `${s.price.toLocaleString("hu-HU")} Ft` : "—"}
                          </span>
                        </button>
                      ))}
                    {allServices.filter(
                      (s) =>
                        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) &&
                        !selectedServices.some((sel) => sel._id === s._id),
                    ).length === 0 && (
                      <div
                        style={{
                          padding: "0.75rem",
                          fontSize: "0.8125rem",
                          color: "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        Nincs találat
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected services summary */}
            {selectedServices.length > 0 && (
              <div
                style={{
                  padding: "0.625rem 0.75rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.75rem",
                  border: "1px solid #e8eaf0",
                  marginBottom: "0.875rem",
                }}
              >
                {selectedServices.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.25rem 0",
                      fontSize: "0.8125rem",
                      color: "#1A1D2D",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>{s.name}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        flexShrink: 0,
                      }}
                    >
                      <input
                        type="number"
                        value={s.price ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSelectedServices((prev) =>
                            prev.map((x) =>
                              x._id === s._id ? { ...x, price: Number.isNaN(val) ? 0 : val } : x,
                            ),
                          );
                        }}
                        style={{
                          width: "5rem",
                          padding: "0.1875rem 0.375rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.375rem",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "#1A1D2D",
                          textAlign: "right",
                          fontFamily: "inherit",
                          outline: "none",
                          boxSizing: "border-box",
                          backgroundColor: "#ffffff",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#99CEB7";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                        Ft
                      </span>
                    </div>
                  </div>
                ))}
                {booking.paymentStatus === "paid" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.375rem 0 0",
                      marginTop: "0.375rem",
                      borderTop: "1px solid #e2e8f0",
                      fontSize: "0.8125rem",
                      color: "#64748b",
                    }}
                  >
                    <span>Foglalási díj (már befizetve)</span>
                    <span style={{ fontWeight: 600 }}>−10 000 Ft</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0 0",
                    marginTop: booking.paymentStatus === "paid" ? "0.25rem" : "0.375rem",
                    borderTop: booking.paymentStatus === "paid" ? "none" : "1px solid #e2e8f0",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#242a5f",
                  }}
                >
                  <span>Pénzügybe kerül</span>
                  <span>
                    {Math.max(
                      0,
                      selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0) -
                        (booking.paymentStatus === "paid" ? 10000 : 0),
                    ).toLocaleString("hu-HU")}{" "}
                    Ft
                  </span>
                </div>
              </div>
            )}

            {completeError && (
              <p
                style={{
                  margin: "0 0 0.75rem",
                  fontSize: "0.875rem",
                  color: "#ef4444",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                }}
              >
                {completeError}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => void handleCompleteBooking()}
                disabled={isCompleting || selectedServices.length === 0}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: isCompleting
                    ? "#047857"
                    : selectedServices.length === 0
                      ? "#94a3b8"
                      : "#099268",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: isCompleting || selectedServices.length === 0 ? "not-allowed" : "pointer",
                  opacity: isCompleting ? 0.7 : 1,
                }}
              >
                {isCompleting
                  ? "Mentés..."
                  : isCompleted
                    ? "Módosítások mentése"
                    : "Vizit lezárása"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("detail");
                  setCompleteError(null);
                  setSelectedServices([]);
                  setServiceSearch("");
                }}
                disabled={isCompleting}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  border: "1px solid #e8eaf0",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: isCompleting ? "not-allowed" : "pointer",
                }}
              >
                Mégsem
              </button>
            </div>

            <div
              style={{
                borderTop: "1px solid #e8eaf0",
                marginTop: "1.25rem",
                marginBottom: "1.25rem",
              }}
            />
          </div>
        )}

        {/* ── Cancel confirmation view ────────────────────────────────────── */}
        {view === "cancel-confirm" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#9f1239",
              }}
            >
              Biztosan lemondja ezt az időpontot?
            </h3>
            <p style={{ margin: "0 0 0.875rem", fontSize: "0.875rem", color: "#64748b" }}>
              <strong style={{ color: "#1A1D2D" }}>{booking.patientName}</strong>
              {" — "}
              {formattedDate}, {booking.slotTime}
            </p>

            {/* Optional reason */}
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Indoklás (opcionális)"
              rows={3}
              style={{
                width: "100%",
                backgroundColor: "#ffffff",
                border: "1px solid #e8eaf0",
                borderRadius: "0.75rem",
                color: "#1A1D2D",
                fontSize: "0.875rem",
                padding: "0.625rem 0.75rem",
                resize: "vertical" as const,
                fontFamily: "inherit",
                marginBottom: "0.875rem",
                boxSizing: "border-box" as const,
                outline: "none",
              }}
            />

            {/* Error message */}
            {cancelError && (
              <p
                style={{
                  margin: "0 0 0.75rem",
                  fontSize: "0.875rem",
                  color: "#ef4444",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                }}
              >
                {cancelError}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => void handleCancelConfirm()}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: isCancelling ? "#881337" : "#9f1239",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: isCancelling ? "not-allowed" : "pointer",
                  opacity: isCancelling ? 0.7 : 1,
                }}
              >
                {isCancelling ? "Lemondás..." : "Lemondás megerősítése"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("detail");
                  setCancelError(null);
                  setCancelReason("");
                }}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  border: "1px solid #e8eaf0",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: isCancelling ? "not-allowed" : "pointer",
                }}
              >
                Mégsem
              </button>
            </div>

            {/* Divider before history */}
            <div
              style={{
                borderTop: "1px solid #e8eaf0",
                marginTop: "1.25rem",
                marginBottom: "1.25rem",
              }}
            />
          </div>
        )}

        {/* ── No-show confirmation view ──────────────────────────────────── */}
        {view === "noshow-confirm" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <h3
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#d97706",
              }}
            >
              Nem jelent meg a páciens?
            </h3>
            <p style={{ margin: "0 0 0.875rem", fontSize: "0.875rem", color: "#64748b" }}>
              <strong style={{ color: "#1A1D2D" }}>{booking.patientName}</strong>
              {" — "}
              {formattedDate}, {booking.slotTime}
            </p>
            <p style={{ margin: "0 0 0.875rem", fontSize: "0.8125rem", color: "#64748b" }}>
              {booking.paymentStatus === "paid"
                ? "A foglalási díj (10 000 Ft) bevételként kerül rögzítésre."
                : "Ez a foglalás nem tartalmazott előre fizetett foglalási díjat — nem kerül bevétel rögzítésre."}
            </p>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/booking/no-show", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ bookingId: booking._id }),
                    });
                    if (!res.ok) throw new Error("Failed");
                    onCancelled();
                  } catch {
                    setView("detail");
                  }
                }}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: "#d97706",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Nem jelent meg — megerősítés
              </button>
              <button
                type="button"
                onClick={() => setView("detail")}
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  border: "1px solid #e8eaf0",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mégsem
              </button>
            </div>

            <div
              style={{
                borderTop: "1px solid #e8eaf0",
                marginTop: "1.25rem",
                marginBottom: "1.25rem",
              }}
            />
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1.25rem",
            borderBottom: "1px solid #e8eaf0",
            paddingBottom: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            style={{
              background: "none",
              border: "none",
              padding: "0.375rem 0.75rem",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "bookings" ? 600 : 500,
              color: activeTab === "bookings" ? "#242a5f" : "#94a3b8",
              borderBottom: activeTab === "bookings" ? "2px solid #242a5f" : "none",
              marginBottom: "-0.75rem",
              cursor: "pointer",
            }}
          >
            Jelenlegi foglalások
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            style={{
              background: "none",
              border: "none",
              padding: "0.375rem 0.75rem",
              fontSize: "0.8125rem",
              fontWeight: activeTab === "history" ? 600 : 500,
              color: activeTab === "history" ? "#242a5f" : "#94a3b8",
              borderBottom: activeTab === "history" ? "2px solid #242a5f" : "none",
              marginBottom: "-0.75rem",
              cursor: "pointer",
            }}
          >
            Foglalási történet
          </button>
        </div>

        {/* ── Booking history section ─────────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div>
            <h3
              style={{
                margin: "0 0 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#242a5f",
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
              }}
            >
              Foglalási előzmények
            </h3>

            {historyLoading && (
              <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>Betöltés...</p>
            )}

            {!historyLoading && patientHistory.length === 0 && (
              <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
                Nincs korábbi foglalás.
              </p>
            )}

            {!historyLoading &&
              patientHistory.length === 1 &&
              patientHistory[0]?._id === booking._id && (
                <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
                  Nincs korábbi foglalás.
                </p>
              )}

            {!historyLoading &&
              patientHistory.length > 0 &&
              !(patientHistory.length === 1 && patientHistory[0]?._id === booking._id) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {(() => {
                    // Find next upcoming booking (closest future date, confirmed status)
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const nextBooking = patientHistory
                      .filter((b) => b.status === "confirmed")
                      .sort(
                        (a, b) => new Date(a.slotDate).getTime() - new Date(b.slotDate).getTime(),
                      )
                      .find((b) => new Date(b.slotDate) >= today);

                    return patientHistory.map((h) => {
                      const isNext = h._id === nextBooking?._id;
                      const hCancelled = h.status === "cancelled";
                      return (
                        <div
                          key={h._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.5rem 0.625rem",
                            backgroundColor: isNext ? "rgba(153,206,183,0.06)" : "#F2F4F8",
                            border: `1px solid ${isNext ? "#99CEB7" : "#e8eaf0"}`,
                            borderRadius: "0.75rem",
                            gap: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.125rem",
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                fontWeight: isNext ? 700 : 400,
                                color: isNext ? "#099268" : "#64748b",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatHungarianDate(h.slotDate)}, {h.slotTime}
                              {isNext && (
                                <span
                                  style={{
                                    marginLeft: "0.375rem",
                                    fontSize: "0.6875rem",
                                    color: "#099268",
                                    opacity: 0.75,
                                  }}
                                >
                                  (következő)
                                </span>
                              )}
                            </span>
                            {h.service && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {h.service.name}
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.4rem",
                              borderRadius: "9999px",
                              backgroundColor: hCancelled
                                ? "rgba(231,193,211,0.15)"
                                : "rgba(153,206,183,0.15)",
                              color: hCancelled ? "#9f1239" : "#099268",
                              textTransform: "uppercase" as const,
                              letterSpacing: "0.04em",
                              flexShrink: 0,
                            }}
                          >
                            {hCancelled ? "Lemondva" : "Visszaigazolva"}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
          </div>
        )}

        {/* ── Appointment History tab ─────────────────────────────────────── */}
        {activeTab === "history" && (
          <AdminPatientHistory
            patientEmail={booking.patientEmail}
            patientName={booking.patientName}
            patientPhone={booking.patientPhone}
          />
        )}
      </div>

      {showReschedule && booking.serviceId && (
        <AdminRescheduleModal
          bookingId={booking._id}
          patientName={booking.patientName}
          serviceId={booking.serviceId}
          serviceName={booking.service?.name ?? null}
          currentDate={booking.slotDate}
          currentTime={booking.slotTime}
          onClose={() => setShowReschedule(false)}
          onRescheduled={() => {
            setShowReschedule(false);
            // onCancelled is the dashboard's generic "reload bookings" callback,
            // reused here so the calendar reflects the moved appointment.
            onCancelled();
          }}
        />
      )}
    </div>
  );
}
