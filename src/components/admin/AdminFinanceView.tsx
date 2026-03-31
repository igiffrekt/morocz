"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

type MonthlyRevenue = {
  month: string;
  label: string;
  shortLabel?: string;
  revenue: number;
  count: number;
};

type ServiceRevenue = {
  service: string;
  revenue: number;
  count: number;
};

type RecentTransaction = {
  id: string;
  patientName: string;
  service: string;
  price: number;
  date: string;
};

type FinanceData = {
  totalRevenue: number;
  currentMonthRevenue: number;
  avgRevenue: number;
  totalConfirmed: number;
  totalCancelled: number;
  uniquePatients: number;
  monthlyRevenue: MonthlyRevenue[];
  serviceRevenue: ServiceRevenue[];
  recentTransactions: RecentTransaction[];
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("hu-HU") + " Ft";
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}.`;
}

const SERVICE_COLORS = [
  "#242a5f",
  "#99CEB7",
  "#e1bbcd",
  "#7c83cc",
  "#f0b97e",
  "#82b4c8",
  "#c4a9e0",
  "#8ec6b4",
];

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "1rem",
        padding: "1rem 1.25rem",
        border: "1px solid #e8eaf0",
        borderLeft: `4px solid ${accent}`,
        boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
      }}
    >
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "50%",
          backgroundColor: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#242a5f",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ─── Custom tooltip for area chart ─────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: recharts tooltip payload is untyped
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RevenueTooltip({ active, payload, label }: any) {
  // biome-ignore lint/suspicious/noExplicitAny: recharts tooltips are untyped
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e8eaf0",
        borderRadius: "0.625rem",
        padding: "0.625rem 0.875rem",
        boxShadow: "0 4px 12px rgba(36,42,95,0.12)",
        fontSize: "0.8125rem",
      }}
    >
      <div style={{ fontWeight: 600, color: "#242a5f", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ color: "#475569" }}>
        Bevétel: <strong style={{ color: "#242a5f" }}>{fmt(payload[0].value)}</strong>
      </div>
      <div style={{ color: "#475569" }}>
        Foglalások: <strong style={{ color: "#242a5f" }}>{payload[0].payload.count} db</strong>
      </div>
    </div>
  );
}

// biome-ignore lint/suspicious/noExplicitAny: recharts tooltip payload is untyped
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ServiceTooltip({ active, payload }: any) {
  // biome-ignore lint/suspicious/noExplicitAny: recharts tooltips are untyped
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #e8eaf0",
        borderRadius: "0.625rem",
        padding: "0.625rem 0.875rem",
        boxShadow: "0 4px 12px rgba(36,42,95,0.12)",
        fontSize: "0.8125rem",
      }}
    >
      <div style={{ fontWeight: 600, color: "#242a5f", marginBottom: "0.25rem" }}>
        {payload[0].payload.service}
      </div>
      <div style={{ color: "#475569" }}>
        Bevétel: <strong style={{ color: "#242a5f" }}>{fmt(payload[0].value)}</strong>
      </div>
      <div style={{ color: "#475569" }}>
        Foglalások: <strong style={{ color: "#242a5f" }}>{payload[0].payload.count} db</strong>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function AdminFinanceView() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/finance")
      .then((r) => r.json())
      .then((d: FinanceData & { error?: string }) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nem sikerült betölteni a pénzügyi adatokat.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "0.875rem",
          flex: 1,
        }}
      >
        Adatok betöltése...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: "#ef4444",
          fontSize: "0.875rem",
          flex: 1,
        }}
      >
        {error ?? "Hiba történt."}
      </div>
    );
  }

  // Find best month
  const bestMonth = data.monthlyRevenue.reduce(
    (best, m) => (m.revenue > best.revenue ? m : best),
    data.monthlyRevenue[0],
  );

  // Shorten service names for chart axis
  const serviceChartData = data.serviceRevenue.map((s) => ({
    ...s,
    shortName: s.service.length > 22 ? `${s.service.substring(0, 20)}…` : s.service,
  }));

  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        flex: "none",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#242a5f" }}>
          Pénzügyi áttekintő
        </h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#64748b" }}>
          Visszaigazolt foglalások alapján számítva
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
        }}
      >
        <StatCard
          label="Összes bevétel"
          value={fmt(data.totalRevenue)}
          sub={`${data.totalConfirmed} visszaigazolt foglalás`}
          accent="#242a5f"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#242a5f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Pénz"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Aktuális hónap"
          value={fmt(data.currentMonthRevenue)}
          sub="Folyó havi bevétel"
          accent="#99CEB7"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#099268"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Naptár"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Átlagos látogatás"
          value={fmt(data.avgRevenue)}
          sub="Átlagos bevétel/foglalás"
          accent="#e1bbcd"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9f1239"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Diagram"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          label="Legjobb hónap"
          value={fmt(bestMonth?.revenue ?? 0)}
          sub={bestMonth?.label ?? "—"}
          accent="#7c83cc"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7c83cc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Trend"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1rem" }}>
        {/* Monthly revenue area chart */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            border: "1px solid #e8eaf0",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#242a5f" }}>
              Havi bevétel alakulása
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              Elmúlt 12 hónap
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={data.monthlyRevenue}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#242a5f" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#242a5f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f7" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}e` : String(v))}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#242a5f"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={{ fill: "#242a5f", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#242a5f" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service revenue bar chart */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "1rem",
            border: "1px solid #e8eaf0",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#242a5f" }}>
              Bevétel szolgáltatásonként
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              Top szolgáltatások
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={serviceChartData}
              layout="vertical"
              margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f7" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}e` : String(v))}
              />
              <YAxis
                dataKey="shortName"
                type="category"
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<ServiceTooltip />} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={16}>
                {serviceChartData.map((_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable order
                  <Cell key={index} fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          border: "1px solid #e8eaf0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(36,42,95,0.06)",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #f1f3f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#242a5f" }}>
            Legutóbbi foglalások
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#94a3b8",
              backgroundColor: "#f8f9fb",
              padding: "0.25rem 0.625rem",
              borderRadius: "9999px",
            }}
          >
            Visszaigazolt
          </div>
        </div>

        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1.5fr 80px 90px",
            padding: "0.625rem 1.25rem",
            backgroundColor: "#f8f9fb",
            borderBottom: "1px solid #e8eaf0",
            gap: "1rem",
          }}
        >
          {["Páciens", "Szolgáltatás", "Összeg", "Dátum"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: "0.6875rem",
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

        {data.recentTransactions.length === 0 ? (
          <div
            style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}
          >
            Nincs visszaigazolt foglalás.
          </div>
        ) : (
          data.recentTransactions.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.5fr 80px 90px",
                padding: "0.75rem 1.25rem",
                borderBottom: i < data.recentTransactions.length - 1 ? "1px solid #f1f3f7" : "none",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#1A1D2D",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.patientName}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#475569",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.service}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: t.price > 0 ? "#099268" : "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {t.price > 0 ? fmt(t.price) : "—"}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "#64748b", whiteSpace: "nowrap" }}>
                {formatDate(t.date)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

