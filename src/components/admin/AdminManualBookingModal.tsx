"use client";

import { useEffect, useState } from "react";

interface Service {
  _id: string;
  name: string;
}

interface AdminManualBookingModalProps {
  selectedDate: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function AdminManualBookingModal({
  selectedDate,
  onClose,
  onCreated,
}: AdminManualBookingModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState("");

  useEffect(() => {
    void fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data: { services?: Service[] }) => {
        setServices(data.services ?? []);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/booking-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: name,
          patientEmail: email,
          patientPhone: phone,
          serviceId,
          slotDate: date,
          slotTime: time,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Hiba történt.");
        setLoading(false);
        return;
      }

      onCreated();
    } catch {
      setError("Hiba történt a foglalás létrehozásakor.");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #d1d5db",
    fontSize: "0.875rem",
    color: "#1A1D2D",
    backgroundColor: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    marginBottom: "0.25rem",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "1rem",
          width: "100%",
          maxWidth: "28rem",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #e8eaf0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "#242a5f" }}>
            Új foglalás
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#94a3b8",
              padding: "0.25rem",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div>
              <label style={labelStyle}>Név</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Páciens neve"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciens@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Telefonszám</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+36 70 123 4567"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Szolgáltatás</label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Válasszon...</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Dátum</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Időpont</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "#ef4444", fontWeight: 500 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: loading ? "#94a3b8" : "#242a5f",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "0.25rem",
              }}
            >
              {loading ? "Létrehozás..." : "Foglalás létrehozása"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
