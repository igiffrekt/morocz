"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminBooking } from "@/components/admin/AdminDashboard";

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Props ─────────────────────────────────────────────────────────────────────

interface AdminPatientModalProps {
  booking: AdminBooking;
  onClose: () => void;
  onCancelled: () => void;
}

// ─── Sub-types ─────────────────────────────────────────────────────────────────

type ModalView = "detail" | "cancel-confirm";

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminPatientModal({
  booking,
  onClose,
  onCancelled,
}: AdminPatientModalProps) {
  const [view, setView] = useState<ModalView>("detail");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [patientHistory, setPatientHistory] = useState<AdminBooking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCancelled = booking.status === "cancelled";
  const canCancel = !isCancelled && !isWithin24Hours(booking.slotDate, booking.slotTime);
  const formattedDate = formatHungarianDate(booking.slotDate);

  // ── Fetch patient booking history ────────────────────────────────────────────
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

  // ── Close menu on outside click ──────────────────────────────────────────────
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

  // ── Cancel handler ───────────────────────────────────────────────────────────
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

  // ─── Styles ──────────────────────────────────────────────────────────────────

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
        {/* ── Close (X) button ──────────────────────────────────────────────── */}
        <button type="button" style={S.closeBtn} onClick={onClose} aria-label="Bezárás">
          ✕
        </button>

        {/* ── Three-dot menu button ─────────────────────────────────────────── */}
        {canCancel && (
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

        {/* ── Dropdown menu ─────────────────────────────────────────────────── */}
        {menuOpen && canCancel && (
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
              minWidth: "10rem",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setView("cancel-confirm");
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "none",
                border: "none",
                color: "#9f1239",
                fontSize: "0.875rem",
                cursor: "pointer",
                textAlign: "left" as const,
              }}
            >
              Időpont lemondása
            </button>
          </div>
        )}

        {/* ── Patient info section ──────────────────────────────────────────── */}
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
                    : "rgba(153,206,183,0.15)",
                  color: isCancelled ? "#9f1239" : "#099268",
                  border: isCancelled
                    ? "1px solid rgba(231,193,211,0.25)"
                    : "1px solid rgba(153,206,183,0.25)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.04em",
                }}
              >
                {isCancelled ? "Lemondva" : "Visszaigazolva"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid #e8eaf0", marginBottom: "1.25rem" }} />

        {/* ── Cancel confirmation view ──────────────────────────────────────── */}
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

        {/* ── Booking history section ───────────────────────────────────────── */}
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
                    .sort((a, b) => new Date(a.slotDate).getTime() - new Date(b.slotDate).getTime())
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
      </div>
    </div>
  );
}
