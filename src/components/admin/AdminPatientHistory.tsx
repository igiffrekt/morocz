"use client";

import { useEffect, useState } from "react";

type HistoricalAppointment = {
  id: string;
  date: string;
  time: string;
  service: string;
  createdAt: string;
  source: string;
};

type AppointmentHistoryDoc = {
  patientEmail: string;
  patientName?: string;
  patientPhone?: string;
  appointments: HistoricalAppointment[];
  matchedAt: string;
  matchConfidence: "email_match" | "manual";
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}.`;
}

function getYearMonth(dateStr: string): { year: string; month: string } {
  const [y, m] = dateStr.split("-");
  const monthNames = ["", "január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  return { year: y, month: monthNames[parseInt(m)] || "" };
}

interface AdminPatientHistoryProps {
  patientEmail: string;
  patientName?: string;
  patientPhone?: string;
}

export default function AdminPatientHistory({ patientEmail, patientName, patientPhone }: AdminPatientHistoryProps) {
  const [history, setHistory] = useState<AppointmentHistoryDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/admin/history?email=${encodeURIComponent(patientEmail)}`)
      .then((r) => r.json())
      .then((data: { appointments?: AppointmentHistoryDoc[] }) => {
        if (data.appointments && data.appointments.length > 0) {
          setHistory(data.appointments[0]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nem sikerült betölteni az előzményeket.");
        setLoading(false);
      });
  }, [patientEmail]);

  if (loading) {
    return <div style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.875rem" }}>Betöltés...</div>;
  }

  if (error) {
    return <div style={{ padding: "1rem", color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>;
  }

  if (!history || history.appointments.length === 0) {
    return <div style={{ padding: "1rem", color: "#94a3b8", fontSize: "0.875rem" }}>Nincs foglalási előzmény.</div>;
  }

  const appointments = [...history.appointments].sort((a, b) => b.date.localeCompare(a.date));

  // Group by year and month
  const groupedByYearMonth: { [key: string]: { [key: string]: HistoricalAppointment[] } } = {};
  appointments.forEach((apt) => {
    const { year, month } = getYearMonth(apt.date);
    if (!groupedByYearMonth[year]) {
      groupedByYearMonth[year] = {};
    }
    if (!groupedByYearMonth[year][month]) {
      groupedByYearMonth[year][month] = [];
    }
    groupedByYearMonth[year][month].push(apt);
  });

  const sortedYears = Object.keys(groupedByYearMonth).sort().reverse();

  return (
    <div style={{ overflow: "auto" }}>
      {/* Patient info */}
      {(patientName || patientPhone) && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f0f9ff", borderBottom: "1px solid #bae6fd", marginBottom: "0.5rem" }}>
          <div style={{ fontSize: "0.8125rem", color: "#0369a1" }}>
            {patientName && <div><strong>Név:</strong> {patientName}</div>}
            {patientPhone && <div><strong>Telefon:</strong> {patientPhone}</div>}
          </div>
        </div>
      )}

      {/* Confidence badge */}
      {history.matchConfidence === "email_match" && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "#dcfce7", borderBottom: "1px solid #bbf7d0", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534" }}>✅ Email alapján illesztett</span>
        </div>
      )}

      {/* Grouped appointments by year/month */}
      <div style={{ padding: "1rem" }}>
        {sortedYears.map((year) => (
          <div key={year} style={{ marginBottom: "1.5rem" }}>
            {/* Year header */}
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#242a5f", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "2px solid #e8eaf0" }}>
              {year}
            </div>

            {/* Months in this year */}
            {Object.entries(groupedByYearMonth[year])
              .sort(([m1], [m2]) => {
                const monthOrder = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
                return monthOrder.indexOf(m2) - monthOrder.indexOf(m1);
              })
              .map(([month, monthAppointments]) => (
                <div key={`${year}-${month}`} style={{ marginBottom: "1rem" }}>
                  {/* Month header */}
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#475569", marginBottom: "0.5rem", marginLeft: "0.5rem" }}>
                    {month} ({monthAppointments.length})
                  </div>

                  {/* Appointments in this month */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {monthAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        style={{
                          padding: "0.625rem 0.75rem",
                          backgroundColor: "#f8f9fb",
                          borderRadius: "0.5rem",
                          border: "1px solid #e8eaf0",
                          fontSize: "0.8125rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, color: "#242a5f" }}>
                            {formatDate(apt.date)} {apt.time}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.125rem" }}>
                            {apt.service}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f8f9fb", borderTop: "1px solid #e8eaf0", fontSize: "0.75rem", color: "#64748b", textAlign: "center" }}>
        Összes: {appointments.length} foglalás
      </div>
    </div>
  );
}
