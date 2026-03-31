"use client";

import React, { useEffect, useState } from "react";

type HistoricalAppointment = {
  id: string;
  date: string;
  time: string;
  service: string;
  duration: number;
  staff: string;
  payment: number;
  createdAt: string;
  source: string;
};

type AppointmentHistoryDoc = {
  patientEmail: string;
  appointments: HistoricalAppointment[];
  matchedAt: string;
  matchConfidence: "email_match" | "manual";
};

type PatientInfo = {
  email: string;
  name?: string;
  phone?: string;
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

function getMonthAbbr(monthName: string): string {
  const abbrMap: { [key: string]: string } = {
    "január": "jan", "február": "feb", "március": "már", "április": "ápr",
    "május": "máj", "június": "jún", "július": "júl", "augusztus": "aug",
    "szeptember": "sze", "október": "okt", "november": "nov", "december": "dec"
  };
  return abbrMap[monthName] || monthName;
}

export default function AdminAppointmentHistoryView() {
  const [records, setRecords] = useState<AppointmentHistoryDoc[]>([]);
  const [patients, setPatients] = useState<Map<string, PatientInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [loadedYears, setLoadedYears] = useState<Set<string>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<Map<string, string>>(new Map());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/history").then((r) => r.json()),
      fetch("/api/admin/patients").then((r) => r.json()),
    ])
      .then(([histData, patData]) => {
        if (histData.error) {
          setError(histData.error);
        } else {
          setRecords(histData.appointments ?? []);
        }
        // Build patient map
        if (patData.patients) {
          const pMap = new Map<string, PatientInfo>();
          patData.patients.forEach((p: { email: string; name: string; phone: string }) => {
            pMap.set(p.email, { email: p.email, name: p.name, phone: p.phone });
          });
          setPatients(pMap);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nem sikerült betölteni az előzményeket.");
        setLoading(false);
      });
  }, []);

  // Filter records
  let filtered = records;

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.patientEmail.includes(s) ||
        r.appointments.some((a) => a.service?.toLowerCase().includes(s))
    );
  }

  // Flatten appointments with metadata
  const appointments: (HistoricalAppointment & { patientEmail: string; patientName?: string; patientPhone?: string })[] = [];
  for (const record of filtered) {
    const patientInfo = patients.get(record.patientEmail);
    for (const apt of record.appointments) {
      if ((!dateFrom || apt.date >= dateFrom) && (!dateTo || apt.date <= dateTo)) {
        appointments.push({
          ...apt,
          patientEmail: record.patientEmail,
          patientName: patientInfo?.name,
          patientPhone: patientInfo?.phone,
        });
      }
    }
  }

  // Sort by date DESC
  appointments.sort((a, b) => {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return b.time.localeCompare(a.time);
  });

  // Group by year and month
  const groupedByYearMonth: { [key: string]: { [key: string]: typeof appointments } } = {};
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
  
  // Set current year expanded by default, others closed (only on first load)
  React.useEffect(() => {
    if (sortedYears.length > 0 && !initialized) {
      const currentYear = new Date().getFullYear().toString();
      setExpandedYears(new Set([currentYear]));
      setLoadedYears(new Set([currentYear])); // Pre-load current year
      
      // Auto-select the latest month for the current year
      const months = Object.keys(groupedByYearMonth[currentYear]);
      if (months.length > 0) {
        months.sort((m1, m2) => {
          const monthOrder = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
          return monthOrder.indexOf(m1) - monthOrder.indexOf(m2);
        });
        setSelectedMonths(new Map([[currentYear, months[months.length - 1]]]));
      }
      
      setInitialized(true);
    }
  }, [sortedYears, initialized]);

  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
      // Mark year as loaded when expanding
      if (!loadedYears.has(year)) {
        setLoadedYears(new Set([...loadedYears, year]));
        // Set default selected month to most recent month (last in chronological order)
        const months = Object.keys(groupedByYearMonth[year]);
        if (months.length > 0) {
          months.sort((m1, m2) => {
            const monthOrder = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
            return monthOrder.indexOf(m1) - monthOrder.indexOf(m2);
          });
          setSelectedMonths(new Map([...selectedMonths, [year, months[months.length - 1]]]));
        }
      }
    }
    setExpandedYears(newExpanded);
  };

  return (
    <div style={{ padding: "1.25rem 1.5rem", flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#242a5f" }}>
            Foglalási történet
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#64748b" }}>
            {loading ? "Betöltés..." : `${appointments.length} előzmény összesen`}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Keresés email/szolgáltatás..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              width: "200px",
            }}
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          border: "1px solid #e8eaf0",
          overflow: "hidden",
          flex: 1,
          boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
        }}
      >
        {/* Content Area */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
            Betöltés...
          </div>
        ) : error ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444", fontSize: "0.875rem" }}>
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
            Nincs előzmény.
          </div>
        ) : (
          <div style={{ overflow: "auto", padding: "1.25rem" }}>
            {sortedYears.map((year) => {
              const isExpanded = expandedYears.has(year);
              const isLoaded = loadedYears.has(year);
              return (
                <div key={year} style={{ marginBottom: "1.5rem" }}>
                  {/* Year header — clickable to expand/collapse */}
                  <div
                    onClick={() => toggleYear(year)}
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "#242a5f",
                      marginBottom: isExpanded && isLoaded ? "1rem" : "0",
                      paddingBottom: "0.5rem",
                      paddingLeft: "0.5rem",
                      borderBottom: "2px solid #e8eaf0",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.7"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "1.25rem",
                        height: "1.25rem",
                        marginRight: "0.5rem",
                        transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                        transition: "transform 0.15s",
                      }}
                    >
                      ▼
                    </span>
                    {year}
                  </div>

                  {/* Month tabs — shown only when expanded AND loaded */}
                  {isExpanded && isLoaded && (
                    <div style={{ marginTop: "0.75rem" }}>
                      {/* Month tab bar */}
                      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", overflow: "auto", paddingLeft: "0.5rem" }}>
                        {Object.entries(groupedByYearMonth[year])
                          .sort(([m1], [m2]) => {
                            const monthOrder = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
                            return monthOrder.indexOf(m1) - monthOrder.indexOf(m2);
                          })
                          .map(([month]) => {
                            const isSelected = selectedMonths.get(year) === month;
                            return (
                              <button
                                key={`tab-${year}-${month}`}
                                onClick={() => setSelectedMonths(new Map([...selectedMonths, [year, month]]))}
                                style={{
                                  padding: "0.5rem 0.875rem",
                                  fontSize: "0.8125rem",
                                  fontWeight: isSelected ? 600 : 500,
                                  color: isSelected ? "#ffffff" : "#64748b",
                                  backgroundColor: isSelected ? "#3b82f6" : "#e8eaf0",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#d4d8e0"; }}
                                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e8eaf0"; }}
                              >
                                {getMonthAbbr(month)}
                              </button>
                            );
                          })}
                      </div>

                      {/* Selected month content */}
                      {(() => {
                        const selectedMonth = selectedMonths.get(year);
                        const monthApts = selectedMonth ? groupedByYearMonth[year][selectedMonth] : [];
                        return (
                          <div style={{ marginLeft: "0.5rem" }}>
                            {/* Table header */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1.2fr 1.2fr 1fr 0.8fr 0.7fr 1.2fr",
                                padding: "0.625rem 1rem",
                                backgroundColor: "#f8f9fb",
                                borderRadius: "0.375rem",
                                gap: "0.75rem",
                                marginBottom: "0.375rem",
                                fontSize: "0.6875rem",
                              }}
                            >
                              {["Név", "Email", "Telefon", "Dátum", "Idő", "Szolgáltatás"].map((h) => (
                                <div
                                  key={h}
                                  style={{
                                    fontWeight: 600,
                                    color: "#64748b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {h}
                                </div>
                              ))}
                            </div>

                            {/* Appointments */}
                            {monthApts && monthApts.length > 0 ? (
                              monthApts.map((apt, i) => (
                                <div
                                  key={`${apt.patientEmail}-${apt.date}-${apt.time}-${apt.id}`}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.2fr 1.2fr 1fr 0.8fr 0.7fr 1.2fr",
                                    padding: "0.625rem 1rem",
                                    borderBottom: i < monthApts.length - 1 ? "1px solid #f1f3f7" : "none",
                                    gap: "0.75rem",
                                    alignItems: "center",
                                    fontSize: "0.8125rem",
                                    backgroundColor: i % 2 === 0 ? "transparent" : "#fafbfc",
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f0f4ff"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = i % 2 === 0 ? "transparent" : "#fafbfc"; }}
                                >
                                  <span style={{ color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.patientName || "—"}</span>
                                  <span style={{ color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.patientEmail}</span>
                                  <span style={{ color: "#475569" }}>{apt.patientPhone || "—"}</span>
                                  <span style={{ color: "#475569" }}>{formatDate(apt.date)}</span>
                                  <span style={{ color: "#475569" }}>{apt.time}</span>
                                  <span style={{ color: "#475569" }}>{apt.service}</span>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8125rem" }}>
                                Nincs foglalás ebben a hónapban.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ padding: "1rem", backgroundColor: "#f8f9fb", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "#64748b", textAlign: "center", marginTop: "1rem" }}>
              Összes: {appointments.length} foglalás
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
