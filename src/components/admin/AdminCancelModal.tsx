"use client";

import { useState } from "react";

interface AdminCancelModalProps {
  bookingId: string;
  patientName: string;
  slotDate: string;
  slotTime: string;
  serviceName: string | null;
  onClose: () => void;
  onConfirm: (bookingId: string, reason?: string) => void;
}

export default function AdminCancelModal({
  bookingId,
  patientName,
  slotDate,
  slotTime,
  serviceName,
  onClose,
  onConfirm,
}: AdminCancelModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    await onConfirm(bookingId, reason.trim() || undefined);
    setIsSubmitting(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
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
          animation: "slideUp 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 1.5rem 1rem",
            borderBottom: "1px solid #e8eaf0",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#242a5f",
            }}
          >
            Időpont lemondása
          </h2>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          {/* Booking details */}
          <div
            style={{
              backgroundColor: "#f8f9fb",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.5rem",
              border: "1px solid #e8eaf0",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#242a5f",
              }}
            >
              {patientName}
            </p>
            {serviceName && (
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.8125rem",
                  color: "#64748b",
                }}
              >
                {serviceName}
              </p>
            )}
            <p
              style={{
                margin: 0,
                fontSize: "0.8125rem",
                color: "#64748b",
              }}
            >
              {formatDate(slotDate)}, {slotTime}
            </p>
          </div>

          {/* Reason textarea */}
          <div>
            <label
              htmlFor="cancel-reason"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#242a5f",
                marginBottom: "0.5rem",
              }}
            >
              Lemondás oka (opcionális)
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pl. időpont módosítás, orvosi ok..."
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: "6rem",
                padding: "0.75rem",
                border: "1px solid #e8eaf0",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "#1A1D2D",
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#99CEB7";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e8eaf0";
              }}
            />
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.75rem",
                color: "#94a3b8",
              }}
            >
              Ez az információ el lesz küldve a páciensnek az értesítő e-mailben.
            </p>
          </div>
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
              transition: "all 0.15s",
              opacity: isSubmitting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "#f8f9fb";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            Mégsem
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: isSubmitting ? "#f87171" : "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "#dc2626";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "#ef4444";
              }
            }}
          >
            {isSubmitting ? "Lemondás..." : "Időpont lemondása"}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
