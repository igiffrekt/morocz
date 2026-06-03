"use client";

import { useEffect, useState } from "react";

interface AdminRescheduleModalProps {
  bookingId: string;
  patientName: string;
  serviceId: string;
  serviceName: string | null;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
  onRescheduled: () => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function AdminRescheduleModal({
  bookingId,
  patientName,
  serviceId,
  serviceName,
  currentDate,
  currentTime,
  onClose,
  onRescheduled,
}: AdminRescheduleModalProps) {
  const [date, setDate] = useState(currentDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch free slots whenever the date changes ─────────────────────────────
  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    setError(null);
    void fetch(`/api/slots?date=${date}&serviceId=${encodeURIComponent(serviceId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { slots?: string[] }) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, serviceId]);

  async function handleConfirm() {
    if (!selectedTime) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/booking-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, newDate: date, newTime: selectedTime, notifyPatient }),
      });
      if (res.ok) {
        onRescheduled();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Ismeretlen hiba történt.");
        // A 409 likely means the slot was just taken — refresh the list.
        if (res.status === 409) {
          setSelectedTime(null);
          void fetch(`/api/slots?date=${date}&serviceId=${encodeURIComponent(serviceId)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((d: { slots?: string[] }) => setSlots(d.slots ?? []))
            .catch(() => {});
        }
      }
    } catch {
      setError("Hálózati hiba. Kérjük, próbálja újra.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isNoOp = date === currentDate && selectedTime === currentTime;

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop close on click */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop close on click */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9998 }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          zIndex: 9999,
          width: "90%",
          maxWidth: "32rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid #e8eaf0" }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#242a5f" }}>
            Időpont áthelyezése
          </h2>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Current booking */}
          <div
            style={{
              backgroundColor: "#f8f9fb",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.25rem",
              border: "1px solid #e8eaf0",
            }}
          >
            <p
              style={{
                margin: "0 0 0.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#242a5f",
              }}
            >
              {patientName}
            </p>
            {serviceName && (
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "#64748b" }}>
                {serviceName}
              </p>
            )}
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b" }}>
              Jelenleg: {formatDate(currentDate)}, {currentTime}
            </p>
          </div>

          {/* Date picker */}
          <label
            htmlFor="reschedule-date"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#242a5f",
              marginBottom: "0.5rem",
            }}
          >
            Új dátum
          </label>
          <input
            id="reschedule-date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: "#1A1D2D",
              boxSizing: "border-box",
              marginBottom: "1.25rem",
              fontFamily: "inherit",
            }}
          />

          {/* Slot list */}
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#242a5f",
              margin: "0 0 0.5rem",
            }}
          >
            Szabad időpontok
          </p>
          {slotsLoading && (
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>Betöltés...</p>
          )}
          {!slotsLoading && slots.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Nincs szabad időpont ezen a napon.
            </p>
          )}
          {!slotsLoading && slots.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {slots.map((t) => {
                const selected = t === selectedTime;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    disabled={isSubmitting}
                    style={{
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.5rem",
                      border: selected ? "1px solid #099268" : "1px solid #e8eaf0",
                      backgroundColor: selected ? "rgba(153,206,183,0.15)" : "#ffffff",
                      color: selected ? "#099268" : "#1A1D2D",
                      fontSize: "0.875rem",
                      fontWeight: selected ? 700 : 500,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}

          {/* Notify checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1.25rem",
              fontSize: "0.875rem",
              color: "#242a5f",
            }}
          >
            <input
              type="checkbox"
              checked={notifyPatient}
              disabled={isSubmitting}
              onChange={(e) => setNotifyPatient(e.target.checked)}
            />
            Páciens értesítése e-mailben
          </label>

          {error && (
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.875rem",
                color: "#ef4444",
                backgroundColor: "rgba(239,68,68,0.08)",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e8eaf0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: "#ffffff",
              color: "#64748b",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Mégsem
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting || !selectedTime || isNoOp}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: !selectedTime || isNoOp ? "#94a3b8" : "#099268",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: isSubmitting || !selectedTime || isNoOp ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {isSubmitting ? "Áthelyezés..." : "Időpont áthelyezése"}
          </button>
        </div>
      </div>
    </>
  );
}
