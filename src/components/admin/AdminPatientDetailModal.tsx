"use client";

import { useEffect, useState } from "react";

type AddressData = {
  postalCode: string | null;
  city: string | null;
  streetAddress: string | null;
};

interface AdminPatientDetailModalProps {
  name: string;
  email: string;
  phone: string;
  onClose: () => void;
}

export default function AdminPatientDetailModal({
  name,
  email,
  phone,
  onClose,
}: AdminPatientDetailModalProps) {
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    void fetch(`/api/admin/patient-address?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: AddressData) => setAddress(data))
      .catch(() => setAddress(null))
      .finally(() => setLoading(false));
  }, [email]);

  const hasAddress = !!(address?.postalCode || address?.city || address?.streetAddress);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop close on click
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal click trap */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal click trap */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          backgroundColor: "#ffffff",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "28rem",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "1.5rem",
          boxShadow: "0 25px 50px rgba(36,42,95,0.15)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Bezárás"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "1.25rem",
            cursor: "pointer",
            padding: "0.25rem",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <h2
          style={{
            margin: "0 0 1.25rem",
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#242a5f",
            paddingRight: "2rem",
          }}
        >
          {name}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Row label="E-mail">
            {email ? (
              <a
                href={`mailto:${email}`}
                style={{ fontSize: "0.875rem", color: "#242a5f", textDecoration: "none" }}
              >
                {email}
              </a>
            ) : (
              <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>—</span>
            )}
          </Row>

          <Row label="Telefon">
            {phone ? (
              <a
                href={`tel:${phone}`}
                style={{ fontSize: "0.875rem", color: "#242a5f", textDecoration: "none" }}
              >
                {phone}
              </a>
            ) : (
              <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>—</span>
            )}
          </Row>

          <div
            style={{
              borderTop: "1px solid #e8eaf0",
              margin: "0.5rem 0 0.25rem",
            }}
          />

          <Row label="Számlázási cím" align="flex-start">
            {loading ? (
              <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Betöltés...</span>
            ) : hasAddress ? (
              <span style={{ fontSize: "0.875rem", color: "#1A1D2D", lineHeight: 1.45 }}>
                {address?.postalCode ? `${address.postalCode} ` : ""}
                {address?.city ?? ""}
                {address?.streetAddress ? (
                  <>
                    <br />
                    {address.streetAddress}
                  </>
                ) : null}
              </span>
            ) : (
              <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>Nincs megadva</span>
            )}
          </Row>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  align = "center",
  children,
}: {
  label: string;
  align?: "center" | "flex-start";
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: align, gap: "0.5rem" }}>
      <span
        style={{
          fontSize: "0.75rem",
          color: "#94a3b8",
          width: "7rem",
          flexShrink: 0,
          paddingTop: align === "flex-start" ? "0.125rem" : 0,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
