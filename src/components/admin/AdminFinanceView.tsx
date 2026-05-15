"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanceResponse } from "@/app/api/admin/finance/route";

// ── Types ──────────────────────────────────────────────────────────────────────

type FinanceData = FinanceResponse;

type DateRangePreset =
  | "today"
  | "7d"
  | "30d"
  | "mtd"
  | "lastMonth"
  | "ytd"
  | "sinceReset"
  | "all"
  | "custom";

// ── Palette ────────────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#242a5f",
  ink: "#1A1D2D",
  muted: "#64748b",
  faint: "#94a3b8",
  border: "#e8eaf0",
  borderFaint: "#f1f3f7",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceMuted2: "#f8f9fb",
  success: "#099268",
  successSoft: "#99CEB7",
  danger: "#dc2626",
  dangerSoft: "#e1bbcd",
  warning: "#d97706",
  info: "#2563eb",
  accent1: "#7c83cc",
  accent2: "#f0b97e",
  accent3: "#82b4c8",
  accent4: "#c4a9e0",
  accent5: "#8ec6b4",
};

const SERVICE_PALETTE = [
  COLORS.primary,
  COLORS.successSoft,
  COLORS.accent1,
  COLORS.accent2,
  COLORS.accent3,
  COLORS.accent4,
  COLORS.accent5,
  COLORS.dangerSoft,
];

// ── Formatting helpers ─────────────────────────────────────────────────────────

function fmtFt(n: number): string {
  return `${n.toLocaleString("hu-HU")} Ft`;
}

function fmtFtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M Ft`;
  if (n >= 1_000) return `${Math.round(n / 1000)}e Ft`;
  return `${n} Ft`;
}

function fmtInt(n: number): string {
  return n.toLocaleString("hu-HU");
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y?.slice(2)}`;
}

function formatLongDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

function daysBetween(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Date range computation ─────────────────────────────────────────────────────

function computeRange(
  preset: DateRangePreset,
  resetDate: string | null,
  custom: { start: string; end: string } | null,
): { startDate?: string; endDate?: string } {
  const today = formatDateISO(new Date());
  switch (preset) {
    case "today":
      return { startDate: today, endDate: today };
    case "7d":
      return { startDate: addDays(today, -6), endDate: today };
    case "30d":
      return { startDate: addDays(today, -29), endDate: today };
    case "mtd": {
      const now = new Date();
      return {
        startDate: formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: today,
      };
    }
    case "lastMonth": {
      const now = new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfPrevMonth = new Date(firstOfThisMonth);
      lastOfPrevMonth.setDate(0);
      const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
      return {
        startDate: formatDateISO(firstOfPrevMonth),
        endDate: formatDateISO(lastOfPrevMonth),
      };
    }
    case "ytd": {
      const now = new Date();
      return {
        startDate: formatDateISO(new Date(now.getFullYear(), 0, 1)),
        endDate: today,
      };
    }
    case "sinceReset":
      return { startDate: resetDate ?? undefined, endDate: today };
    case "all":
      return {};
    case "custom":
      return custom ? { startDate: custom.start, endDate: custom.end } : {};
  }
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Ma",
  "7d": "Utolsó 7 nap",
  "30d": "Utolsó 30 nap",
  mtd: "Aktuális hónap",
  lastMonth: "Előző hónap",
  ytd: "Idei év",
  sinceReset: "Nulla pont óta",
  all: "Mindenkori",
  custom: "Egyedi időszak",
};

// ── Trend badge ────────────────────────────────────────────────────────────────

function TrendBadge({
  pctChange,
  invertColor = false,
}: {
  pctChange: number | null;
  invertColor?: boolean;
}) {
  if (pctChange == null) {
    return <span style={{ fontSize: "0.75rem", color: COLORS.faint }}>—</span>;
  }
  const up = pctChange >= 0;
  const positive = invertColor ? !up : up;
  const color = pctChange === 0 ? COLORS.muted : positive ? COLORS.success : COLORS.danger;
  const bg = pctChange === 0 ? "rgba(100,116,139,0.08)" : positive ? "rgba(9,146,104,0.1)" : "rgba(220,38,38,0.08)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.1875rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        color,
        backgroundColor: bg,
        padding: "0.125rem 0.4375rem",
        borderRadius: "9999px",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: up ? "rotate(0deg)" : "rotate(180deg)" }}
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      {Math.abs(pctChange)}%
    </span>
  );
}

// ── Metric card ────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  previous,
  pctChange,
  formatPrev,
  invertColor,
}: {
  label: string;
  value: string;
  previous: string;
  pctChange: number | null;
  formatPrev?: string;
  invertColor?: boolean;
}) {
  return (
    <div
      className="fin-metric-card"
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "1rem",
        padding: "1.125rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        className="fin-metric-card-value"
        style={{
          fontSize: "1.625rem",
          fontWeight: 700,
          color: COLORS.primary,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "1.25rem", flexWrap: "wrap" }}>
        <TrendBadge pctChange={pctChange} invertColor={invertColor} />
        <span className="fin-metric-card-prev" style={{ fontSize: "0.75rem", color: COLORS.faint, fontVariantNumeric: "tabular-nums" }}>
          {formatPrev ?? `előző: ${previous}`}
        </span>
      </div>
    </div>
  );
}

// ── Date range picker ──────────────────────────────────────────────────────────

function DateRangePicker({
  preset,
  custom,
  hasReset,
  period,
  onChange,
}: {
  preset: DateRangePreset;
  custom: { start: string; end: string } | null;
  hasReset: boolean;
  period: { startDate: string; endDate: string } | null;
  onChange: (next: { preset: DateRangePreset; custom: { start: string; end: string } | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<{ start: string; end: string }>(
    custom ?? { start: period?.startDate ?? "", end: period?.endDate ?? "" },
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const presetList: DateRangePreset[] = [
    "today",
    "7d",
    "30d",
    "mtd",
    "lastMonth",
    "ytd",
    ...(hasReset ? (["sinceReset"] as const) : []),
    "all",
  ];

  const buttonLabel =
    preset === "custom" && custom
      ? `${formatShortDate(custom.start)} – ${formatShortDate(custom.end)}`
      : PRESET_LABELS[preset];

  return (
    <div ref={ref} className="fin-date-picker" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0.875rem",
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "0.625rem",
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: COLORS.ink,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
          minWidth: "11rem",
          justifyContent: "space-between",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4375rem" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.muted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {buttonLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.muted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="fin-date-picker-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 0.375rem)",
            right: 0,
            minWidth: "16rem",
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "0.875rem",
            boxShadow: "0 12px 32px rgba(36,42,95,0.14)",
            zIndex: 40,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "0.375rem" }}>
            {presetList.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange({ preset: p, custom: null });
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  background: preset === p ? "rgba(36,42,95,0.06)" : "none",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: preset === p ? 600 : 500,
                  color: preset === p ? COLORS.primary : COLORS.ink,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {PRESET_LABELS[p]}
                {preset === p && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.borderFaint}`, padding: "0.625rem 0.75rem" }}>
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: COLORS.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.375rem",
              }}
            >
              Egyedi időszak
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
              <input
                type="date"
                value={customDraft.start}
                onChange={(e) => setCustomDraft((c) => ({ ...c, start: e.target.value }))}
                style={{
                  flex: 1,
                  padding: "0.375rem 0.5rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.75rem",
                  fontFamily: "inherit",
                  outline: "none",
                  color: COLORS.ink,
                }}
              />
              <span style={{ fontSize: "0.75rem", color: COLORS.muted }}>→</span>
              <input
                type="date"
                value={customDraft.end}
                onChange={(e) => setCustomDraft((c) => ({ ...c, end: e.target.value }))}
                style={{
                  flex: 1,
                  padding: "0.375rem 0.5rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.75rem",
                  fontFamily: "inherit",
                  outline: "none",
                  color: COLORS.ink,
                }}
              />
            </div>
            <button
              type="button"
              disabled={!customDraft.start || !customDraft.end}
              onClick={() => {
                if (!customDraft.start || !customDraft.end) return;
                onChange({ preset: "custom", custom: customDraft });
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "0.375rem 0.75rem",
                backgroundColor: customDraft.start && customDraft.end ? COLORS.primary : COLORS.faint,
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: customDraft.start && customDraft.end ? "pointer" : "not-allowed",
              }}
            >
              Alkalmazás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Revenue breakdown bar ──────────────────────────────────────────────────────

function RevenueBreakdownCard({ data }: { data: FinanceData }) {
  const { revenueBreakdown: rb } = data;
  const realized = rb.deposits + rb.onSite + rb.noShowFees;
  const total = realized + rb.pendingConfirmed;

  const segments = [
    { label: "Foglalási díj (Stripe)", value: rb.deposits, color: COLORS.primary },
    { label: "Helyszíni bevétel", value: rb.onSite, color: COLORS.successSoft },
    { label: "Nem jelent meg díj", value: rb.noShowFees, color: COLORS.dangerSoft },
    { label: "Várható (függő)", value: rb.pendingConfirmed, color: COLORS.faint, striped: true },
  ];

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "1rem",
        padding: "1.125rem 1.25rem",
        boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "0.875rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.ink }}>
            Bevétel megoszlása
          </div>
          <div style={{ fontSize: "0.75rem", color: COLORS.muted, marginTop: "0.125rem" }}>
            Tényleges {fmtFtCompact(realized)} + várható {fmtFtCompact(rb.pendingConfirmed)}
          </div>
        </div>
        <div
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: COLORS.primary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmtFt(total)}
        </div>
      </div>

      {/* Stacked bar */}
      <div
        style={{
          display: "flex",
          height: "0.75rem",
          borderRadius: "9999px",
          overflow: "hidden",
          backgroundColor: COLORS.borderFaint,
          marginBottom: "0.75rem",
        }}
      >
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                style={{
                  width: `${(s.value / total) * 100}%`,
                  backgroundColor: s.color,
                  backgroundImage: s.striped
                    ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 3px, transparent 3px, transparent 6px)"
                    : undefined,
                }}
                title={`${s.label}: ${fmtFt(s.value)}`}
              />
            ))}
      </div>

      {/* Legend */}
      <div
        className="fin-revenue-legend"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
          gap: "0.625rem",
        }}
      >
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}
          >
            <span
              style={{
                width: "0.625rem",
                height: "0.625rem",
                borderRadius: "2px",
                backgroundColor: s.color,
                backgroundImage: s.striped
                  ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 4px)"
                  : undefined,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.6875rem", color: COLORS.muted, lineHeight: 1.2 }}>
                {s.label}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: COLORS.ink,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtFt(s.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Daily revenue chart ────────────────────────────────────────────────────────

// biome-ignore lint/suspicious/noExplicitAny: recharts tooltip payload is untyped
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "0.625rem",
        padding: "0.5rem 0.75rem",
        boxShadow: "0 8px 20px rgba(36,42,95,0.12)",
        fontSize: "0.75rem",
      }}
    >
      <div style={{ fontWeight: 600, color: COLORS.primary, marginBottom: "0.1875rem" }}>
        {typeof label === "string" ? formatLongDate(label) : label}
      </div>
      <div style={{ color: COLORS.muted, fontVariantNumeric: "tabular-nums" }}>
        Bevétel:{" "}
        <strong style={{ color: COLORS.ink }}>{fmtFt(payload[0].value as number)}</strong>
      </div>
      <div style={{ color: COLORS.muted, fontVariantNumeric: "tabular-nums" }}>
        Foglalások: <strong style={{ color: COLORS.ink }}>{payload[0].payload.count} db</strong>
      </div>
    </div>
  );
}

function DailyRevenueChart({ data }: { data: FinanceData }) {
  const daily = data.dailyRevenue;
  const totalDays = daily.length;
  // Tick spacing to avoid crowding
  const tickInterval = Math.max(0, Math.floor(totalDays / 10));

  const peak = daily.reduce(
    (max, d) => (d.revenue > max.revenue ? d : max),
    daily[0] ?? { date: "", revenue: 0, count: 0 },
  );

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "1rem",
        padding: "1.25rem",
        boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.ink }}>
            Napi bevétel
          </div>
          <div style={{ fontSize: "0.75rem", color: COLORS.muted, marginTop: "0.125rem" }}>
            {formatLongDate(data.period.startDate)} – {formatLongDate(data.period.endDate)}
          </div>
        </div>
        {peak && peak.revenue > 0 && (
          <div
            style={{
              fontSize: "0.75rem",
              color: COLORS.muted,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Csúcs: <strong style={{ color: COLORS.primary }}>{fmtFt(peak.revenue)}</strong>{" "}
            ({formatShortDate(peak.date)})
          </div>
        )}
      </div>
      <div className="fin-chart-frame" style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderFaint} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: COLORS.faint }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
            tickFormatter={(v: string) => formatShortDate(v)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: COLORS.faint }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : v >= 1000 ? `${Math.round(v / 1000)}e` : String(v)
            }
            width={50}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: COLORS.border }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.primary}
            strokeWidth={2}
            fill="url(#dailyGrad)"
            dot={false}
            activeDot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Service breakdown (donut) ──────────────────────────────────────────────────

function ServiceBreakdownCard({ data }: { data: FinanceData }) {
  const top = data.serviceBreakdown.slice(0, 7);
  const rest = data.serviceBreakdown.slice(7);
  const restTotal = rest.reduce((s, r) => s + r.revenue, 0);
  const restCount = rest.reduce((s, r) => s + r.count, 0);
  const list = rest.length
    ? [...top, { name: `Egyéb (${rest.length})`, revenue: restTotal, count: restCount }]
    : top;
  const total = list.reduce((s, r) => s + r.revenue, 0);

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "1rem",
        padding: "1.25rem",
        boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.ink }}>
          Szolgáltatás szerint
        </div>
        <div style={{ fontSize: "0.75rem", color: COLORS.muted, marginTop: "0.125rem" }}>
          Bevétel-eloszlás
        </div>
      </div>

      {list.length === 0 || total === 0 ? (
        <div
          style={{
            padding: "2rem 1rem",
            textAlign: "center",
            color: COLORS.faint,
            fontSize: "0.8125rem",
          }}
        >
          Nincs adat ebben az időszakban.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={list}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={1}
                  stroke="none"
                >
                  {list.map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable pie order
                    <Cell key={i} fill={SERVICE_PALETTE[i % SERVICE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // biome-ignore lint/suspicious/noExplicitAny: recharts untyped
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={(props: any) => {
                    if (!props.active || !props.payload?.length) return null;
                    const p = props.payload[0];
                    return (
                      <div
                        style={{
                          backgroundColor: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "0.5rem",
                          padding: "0.4375rem 0.625rem",
                          fontSize: "0.75rem",
                          boxShadow: "0 4px 12px rgba(36,42,95,0.1)",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: COLORS.primary }}>{p.payload.name}</div>
                        <div style={{ color: COLORS.muted, fontVariantNumeric: "tabular-nums" }}>
                          {fmtFt(p.value as number)} • {p.payload.count} db
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: "0.625rem", color: COLORS.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Összes
              </div>
              <div
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: COLORS.primary,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.1,
                }}
              >
                {fmtFtCompact(total)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {list.map((s, i) => {
              const pct = total > 0 ? (s.revenue / total) * 100 : 0;
              return (
                <div
                  key={s.name}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}
                >
                  <span
                    style={{
                      width: "0.5rem",
                      height: "0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: SERVICE_PALETTE[i % SERVICE_PALETTE.length],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: COLORS.ink,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: COLORS.muted,
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: COLORS.ink,
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                      minWidth: "4rem",
                      textAlign: "right",
                    }}
                  >
                    {fmtFtCompact(s.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Status breakdown card ─────────────────────────────────────────────────────

function StatusBreakdownCard({ data }: { data: FinanceData }) {
  const { statusBreakdown: sb } = data;
  const revenueTotalCount = sb.confirmed.count + sb.completed.count + sb.noShow.count;
  const grandTotalCount = revenueTotalCount + sb.cancelled.count;

  const rows = [
    {
      label: "Visszaigazolt",
      sub: "Közelgő vagy fizetett",
      count: sb.confirmed.count,
      revenue: sb.confirmed.revenue,
      color: COLORS.info,
      bg: "rgba(37,99,235,0.08)",
    },
    {
      label: "Teljesített",
      sub: "Elvégzett vizit",
      count: sb.completed.count,
      revenue: sb.completed.revenue,
      color: COLORS.success,
      bg: "rgba(9,146,104,0.08)",
    },
    {
      label: "Nem jelent meg",
      sub: "Foglalási díj elveszett",
      count: sb.noShow.count,
      revenue: sb.noShow.revenue,
      color: COLORS.warning,
      bg: "rgba(217,119,6,0.08)",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "1rem",
        padding: "1.25rem",
        boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.ink }}>
          Foglalás státusz
        </div>
        <div style={{ fontSize: "0.75rem", color: COLORS.muted, marginTop: "0.125rem" }}>
          Bevételszerző foglalások megoszlása
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
        {rows.map((r) => {
          const pct = revenueTotalCount > 0 ? (r.count / revenueTotalCount) * 100 : 0;
          return (
            <div key={r.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.375rem",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: COLORS.ink,
                    }}
                  >
                    {r.label}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: COLORS.faint }}>{r.sub}</span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: COLORS.primary,
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1.1,
                    }}
                  >
                    {fmtInt(r.count)} <span style={{ fontSize: "0.6875rem", color: COLORS.muted, fontWeight: 500 }}>db</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: COLORS.muted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtFt(r.revenue)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  height: "0.375rem",
                  backgroundColor: r.bg,
                  borderRadius: "9999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${pct}%`,
                    backgroundColor: r.color,
                    borderRadius: "9999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sb.cancelled.count > 0 && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "0.75rem",
            borderTop: `1px solid ${COLORS.borderFaint}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
          }}
        >
          <span style={{ color: COLORS.muted }}>
            Ebből lemondott foglalás (nem számít bevételbe)
          </span>
          <span
            style={{
              color: COLORS.danger,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {fmtInt(sb.cancelled.count)} db
          </span>
        </div>
      )}

      {grandTotalCount === 0 && (
        <div
          style={{
            padding: "1.5rem 1rem",
            textAlign: "center",
            color: COLORS.faint,
            fontSize: "0.8125rem",
          }}
        >
          Nincs foglalás ebben az időszakban.
        </div>
      )}
    </div>
  );
}

// ── Transactions table ─────────────────────────────────────────────────────────

type StatusFilter = "all" | "confirmed" | "completed" | "no-show";

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: "Visszaigazolt", color: COLORS.info, bg: "rgba(37,99,235,0.1)" },
    completed: { label: "Teljesített", color: COLORS.success, bg: "rgba(9,146,104,0.1)" },
    "no-show": { label: "Nem jelent meg", color: COLORS.warning, bg: "rgba(217,119,6,0.1)" },
    cancelled: { label: "Lemondva", color: COLORS.danger, bg: "rgba(220,38,38,0.08)" },
  };
  const c = config[status] ?? { label: status, color: COLORS.muted, bg: "rgba(100,116,139,0.08)" };
  return (
    <span
      style={{
        fontSize: "0.6875rem",
        fontWeight: 600,
        padding: "0.1875rem 0.5rem",
        borderRadius: "9999px",
        backgroundColor: c.bg,
        color: c.color,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}

function TransactionsCard({ data }: { data: FinanceData }) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.transactions.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.patientName.toLowerCase().includes(q) && !t.service.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data.transactions, filter, search]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Mind" },
    { key: "completed", label: "Teljesített" },
    { key: "confirmed", label: "Visszaigazolt" },
    { key: "no-show", label: "Nem jelent meg" },
  ];

  return (
    <div
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "1rem",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(36,42,95,0.04)",
      }}
    >
      <div
        className="fin-txn-controls"
        style={{
          padding: "1rem 1.25rem",
          borderBottom: `1px solid ${COLORS.borderFaint}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.ink }}>
            Tranzakciók
          </div>
          <div style={{ fontSize: "0.75rem", color: COLORS.muted, marginTop: "0.125rem" }}>
            {filtered.length} találat az időszakban
          </div>
        </div>

        <div className="fin-txn-controls-right" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Filter chips */}
          <div
            className="fin-txn-chips"
            style={{
              display: "inline-flex",
              backgroundColor: COLORS.surfaceMuted2,
              borderRadius: "9999px",
              padding: "0.1875rem",
              gap: "0.125rem",
            }}
          >
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "0.3125rem 0.75rem",
                  backgroundColor: filter === f.key ? COLORS.surface : "transparent",
                  color: filter === f.key ? COLORS.primary : COLORS.muted,
                  border: "none",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: filter === f.key ? 600 : 500,
                  cursor: "pointer",
                  boxShadow: filter === f.key ? "0 1px 2px rgba(36,42,95,0.08)" : "none",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="fin-txn-search" style={{ position: "relative" }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke={COLORS.faint}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: "absolute",
                left: "0.625rem",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés..."
              className="fin-txn-search-input"
              style={{
                padding: "0.375rem 0.625rem 0.375rem 1.75rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                fontFamily: "inherit",
                outline: "none",
                width: "10rem",
                color: COLORS.ink,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* Header row */}
      <div
        className="fin-txn-header"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1.4fr 110px 130px 100px",
          padding: "0.625rem 1.25rem",
          backgroundColor: COLORS.surfaceMuted2,
          borderBottom: `1px solid ${COLORS.border}`,
          gap: "1rem",
        }}
      >
        {["Páciens", "Szolgáltatás", "Dátum", "Státusz", "Összeg"].map((h, i) => (
          <div
            key={h}
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: COLORS.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textAlign: i === 4 ? "right" : "left",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: "26rem", overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "2.5rem 1rem",
              textAlign: "center",
              color: COLORS.faint,
              fontSize: "0.8125rem",
            }}
          >
            Nincs a szűrőnek megfelelő tranzakció.
          </div>
        ) : (
          filtered.map((t, i) => (
            <div
              key={t.id}
              className="fin-txn-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.4fr 110px 130px 100px",
                padding: "0.75rem 1.25rem",
                borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.borderFaint}` : "none",
                gap: "1rem",
                alignItems: "center",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.surfaceMuted;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div className="fin-txn-patient" style={{ display: "flex", alignItems: "center", gap: "0.4375rem", minWidth: 0 }}>
                {t.paymentStatus === "paid" && (
                  <span
                    title="Foglalási díj fizetve (Stripe)"
                    style={{
                      width: "0.375rem",
                      height: "0.375rem",
                      borderRadius: "9999px",
                      backgroundColor: COLORS.success,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: COLORS.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.patientName}
                </span>
              </div>
              <span
                className="fin-txn-service"
                style={{
                  fontSize: "0.8125rem",
                  color: COLORS.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {t.service}
              </span>
              <span
                className="fin-txn-date"
                style={{
                  fontSize: "0.75rem",
                  color: COLORS.muted,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {formatShortDate(t.date)}
                {t.time ? <span style={{ color: COLORS.faint }}> • {t.time}</span> : null}
              </span>
              <span className="fin-txn-status">
                <StatusPill status={t.status} />
              </span>
              <span
                className="fin-txn-amount"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: t.price > 0 ? COLORS.primary : COLORS.faint,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {t.price > 0 ? fmtFt(t.price) : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  const shimmer = {
    background:
      "linear-gradient(90deg, #f1f3f7 0%, #e8eaf0 50%, #f1f3f7 100%)",
    backgroundSize: "200% 100%",
    animation: "financeShimmer 1.4s ease-in-out infinite",
  } as const;

  const card = (height: string): React.CSSProperties => ({
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "1rem",
    height,
    ...shimmer,
  });

  return (
    <div className="fin-root" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`
        @keyframes financeShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @media (max-width: 768px) {
          .fin-root { padding: 0.75rem !important; gap: 0.75rem !important; }
          .fin-metric-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
          .fin-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ ...card("2.75rem"), width: "14rem" }} />
        <div style={{ ...card("2.25rem"), width: "11rem" }} />
      </div>
      <div className="fin-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <div style={card("6.75rem")} />
        <div style={card("6.75rem")} />
        <div style={card("6.75rem")} />
        <div style={card("6.75rem")} />
      </div>
      <div style={card("7rem")} />
      <div style={card("18rem")} />
      <div className="fin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={card("20rem")} />
        <div style={card("20rem")} />
      </div>
      <div style={card("16rem")} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminFinanceView() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>("sinceReset");
  const [custom, setCustom] = useState<{ start: string; end: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const loadData = useCallback(
    (p: DateRangePreset, c: { start: string; end: string } | null, knownResetDate: string | null) => {
      setLoading(true);
      setError(null);

      // If preset is sinceReset but no reset date exists, fall back to 30d
      const effectivePreset = p === "sinceReset" && !knownResetDate ? "30d" : p;
      const range = computeRange(effectivePreset, knownResetDate, c);
      const params = new URLSearchParams();
      if (range.startDate) params.set("startDate", range.startDate);
      if (range.endDate) params.set("endDate", range.endDate);

      const url = `/api/admin/finance${params.toString() ? `?${params.toString()}` : ""}`;
      void fetch(url)
        .then((r) => r.json())
        .then((d: FinanceData & { error?: string }) => {
          if (d.error) {
            setError(d.error);
          } else {
            setData(d);
            if (effectivePreset !== p) setPreset(effectivePreset);
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Nem sikerült betölteni a pénzügyi adatokat.");
          setLoading(false);
        });
    },
    [],
  );

  // Initial load: peek at resetDate first
  useEffect(() => {
    void fetch("/api/admin/finance")
      .then((r) => r.json())
      .then((d: FinanceData & { error?: string }) => {
        if (d.error) {
          setError(d.error);
          setLoading(false);
          return;
        }
        setData(d);
        setLoading(false);
        if (!d.resetDate) setPreset("30d");
      })
      .catch(() => {
        setError("Nem sikerült betölteni a pénzügyi adatokat.");
        setLoading(false);
      });
  }, []);

  const handleRangeChange = (next: { preset: DateRangePreset; custom: { start: string; end: string } | null }) => {
    setPreset(next.preset);
    setCustom(next.custom);
    loadData(next.preset, next.custom, data?.resetDate ?? null);
  };

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/api/admin/finance/reset", { method: "POST" });
      if (res.ok) {
        setResetConfirm(false);
        setPreset("sinceReset");
        setCustom(null);
        // Reload with fresh reset date from server
        void fetch("/api/admin/finance")
          .then((r) => r.json())
          .then((d: FinanceData & { error?: string }) => {
            if (!d.error) setData(d);
          });
      }
    } finally {
      setResetting(false);
    }
  }

  if (loading && !data) return <Skeleton />;
  if (error || !data) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          color: COLORS.danger,
          fontSize: "0.875rem",
          flex: 1,
        }}
      >
        {error ?? "Hiba történt."}
      </div>
    );
  }

  const periodDays = Math.max(1, daysBetween(data.period.startDate, data.period.endDate) + 1);

  return (
    <div
      className="fin-root"
      style={{
        padding: "1.25rem 1.5rem",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .fin-root { padding: 0.75rem !important; gap: 0.75rem !important; }
          .fin-header { gap: 0.625rem !important; }
          .fin-header-controls { width: 100%; justify-content: stretch !important; }
          .fin-date-picker { flex: 1 1 auto; min-width: 0; }
          .fin-date-picker > button { width: 100% !important; min-width: 0 !important; }
          .fin-date-picker-panel { left: 0 !important; right: 0 !important; min-width: 0 !important; }
          .fin-reset-button { flex-shrink: 0; }
          .fin-metric-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
          .fin-metric-card { padding: 0.875rem !important; gap: 0.4375rem !important; }
          .fin-metric-card-value { font-size: 1.25rem !important; }
          .fin-metric-card-prev { font-size: 0.6875rem !important; }
          .fin-two-col { grid-template-columns: 1fr !important; }
          .fin-revenue-legend { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
          .fin-chart-frame { height: 200px !important; }
          .fin-card-pad { padding: 1rem !important; }
          .fin-txn-controls { flex-direction: column !important; align-items: stretch !important; gap: 0.625rem !important; padding: 0.875rem 1rem !important; }
          .fin-txn-controls-right { flex-direction: column !important; align-items: stretch !important; gap: 0.5rem !important; width: 100%; }
          .fin-txn-chips { overflow-x: auto !important; flex-wrap: nowrap !important; max-width: 100%; padding: 0.1875rem !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
          .fin-txn-chips::-webkit-scrollbar { display: none; }
          .fin-txn-chips > button { flex-shrink: 0; }
          .fin-txn-search { width: 100%; }
          .fin-txn-search-input { width: 100% !important; }
          .fin-txn-header { display: none !important; }
          .fin-txn-row {
            grid-template-columns: 1fr auto !important;
            grid-template-areas:
              "patient amount"
              "service status"
              "date    status" !important;
            gap: 0.25rem 0.75rem !important;
            padding: 0.875rem 1rem !important;
            align-items: start !important;
          }
          .fin-txn-patient { grid-area: patient; }
          .fin-txn-service { grid-area: service; }
          .fin-txn-date { grid-area: date; }
          .fin-txn-status { grid-area: status; align-self: center !important; justify-self: end !important; }
          .fin-txn-amount { grid-area: amount; text-align: right !important; }
        }
      `}</style>
      {/* Header */}
      <div
        className="fin-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.875rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: COLORS.primary, letterSpacing: "-0.01em" }}>
            Pénzügyi áttekintő
          </h2>
          <div
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.8125rem",
              color: COLORS.muted,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span>
              {formatLongDate(data.period.startDate)} – {formatLongDate(data.period.endDate)}
            </span>
            <span style={{ color: COLORS.faint }}>•</span>
            <span>
              {periodDays} {periodDays === 1 ? "nap" : "nap"}
            </span>
            {data.resetDate && (
              <>
                <span style={{ color: COLORS.faint }}>•</span>
                <span style={{ color: COLORS.faint }}>
                  Mérés kezdete: {formatShortDate(data.resetDate)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="fin-header-controls" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <DateRangePicker
            preset={preset}
            custom={custom}
            hasReset={!!data.resetDate}
            period={data.period}
            onChange={handleRangeChange}
          />

          {!resetConfirm ? (
            <button
              type="button"
              className="fin-reset-button"
              onClick={() => setResetConfirm(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4375rem",
                padding: "0.5rem 0.875rem",
                backgroundColor: "transparent",
                color: COLORS.muted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "0.625rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.faint;
                e.currentTarget.style.color = "#475569";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.muted;
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
              Nulláról indítás
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4375rem" }}>
              <span style={{ fontSize: "0.8125rem", color: COLORS.muted }}>Biztosan?</span>
              <button
                type="button"
                onClick={() => void handleReset()}
                disabled={resetting}
                style={{
                  padding: "0.4375rem 0.75rem",
                  backgroundColor: COLORS.danger,
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: resetting ? "not-allowed" : "pointer",
                  opacity: resetting ? 0.7 : 1,
                }}
              >
                {resetting ? "..." : "Igen"}
              </button>
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                style={{
                  padding: "0.4375rem 0.75rem",
                  backgroundColor: "transparent",
                  color: COLORS.muted,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "0.5rem",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Mégsem
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="fin-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <MetricCard
          label="Bevétel"
          value={fmtFt(data.revenue.current)}
          previous={fmtFt(data.revenue.previous)}
          pctChange={data.revenue.pctChange}
        />
        <MetricCard
          label="Foglalások"
          value={fmtInt(data.bookings.current)}
          previous={fmtInt(data.bookings.previous)}
          pctChange={data.bookings.pctChange}
        />
        <MetricCard
          label="Átlag / foglalás"
          value={fmtFt(data.avgTicket.current)}
          previous={fmtFt(data.avgTicket.previous)}
          pctChange={data.avgTicket.pctChange}
        />
        <MetricCard
          label="Páciensek"
          value={fmtInt(data.patients.current)}
          previous={fmtInt(data.patients.previous)}
          pctChange={data.patients.pctChange}
        />
      </div>

      {/* Revenue breakdown */}
      <RevenueBreakdownCard data={data} />

      {/* Daily chart */}
      <DailyRevenueChart data={data} />

      {/* Two-column breakdowns */}
      <div className="fin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <ServiceBreakdownCard data={data} />
        <StatusBreakdownCard data={data} />
      </div>

      {/* Transactions */}
      <TransactionsCard data={data} />
    </div>
  );
}
