"use client";

import { useEffect, useState } from "react";

type PatientRow = {
  email: string;
  name: string;
  phone: string;
  latogatas: number;
  totalBookings: number;
  confirmedCount: number;
  cancelledCount: number;
  lastVisit: string | null;
  source: "booking" | "imported" | "both";
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

// Brand-adjacent avatar palette — blues, indigos, teals, purples (12 pairs)
const AVATAR_PALETTE = [
  { bg: "linear-gradient(135deg,#dce4ff,#c5d3ff)", text: "#3451c7" },
  { bg: "linear-gradient(135deg,#d0f0fd,#b6e4f7)", text: "#0c7ab5" },
  { bg: "linear-gradient(135deg,#e0e7ff,#c7d2fe)", text: "#4338ca" },
  { bg: "linear-gradient(135deg,#ccfbf1,#a7f3d0)", text: "#0f766e" },
  { bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", text: "#6d28d9" },
  { bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)", text: "#9d174d" },
  { bg: "linear-gradient(135deg,#fee2e2,#fecaca)", text: "#b91c1c" },
  { bg: "linear-gradient(135deg,#fef9c3,#fef08a)", text: "#92400e" },
  { bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", text: "#15803d" },
  { bg: "linear-gradient(135deg,#ffedd5,#fed7aa)", text: "#c2410c" },
  { bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", text: "#166534" },
  { bg: "linear-gradient(135deg,#e0f2fe,#bae6fd)", text: "#0369a1" },
];

function getAvatar(key: string) {
  const idx = hashCode(key) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

type FilterMode = "all" | "with-bookings";

// ─── Search Icon ───────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

// ─── Users Icon ───────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#242a5f"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ search }: { search: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#e8ecff,#d0d8ff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f6ef7"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
          {search ? "Nincs találat" : "Nincs páciens adat"}
        </p>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#94a3b8" }}>
          {search
            ? `"${search}" keresésre nem találtunk pácienseket.`
            : "Még nincsenek páciensek az adatbázisban."}
        </p>
      </div>
    </div>
  );
}

// ─── Table Row ─────────────────────────────────────────────────────────────────

function PatientRow({ p, i, total }: { p: PatientRow; i: number; total: number }) {
  const [hovered, setHovered] = useState(false);
  const avatar = getAvatar(p.email || p.name);

  const visitBadgeStyle: React.CSSProperties =
    p.latogatas === 0
      ? {
          background: "rgba(148,163,184,0.12)",
          color: "#94a3b8",
          border: "1px solid rgba(148,163,184,0.2)",
        }
      : {
          background: "linear-gradient(135deg,rgba(36,42,95,0.1),rgba(79,110,247,0.12))",
          color: "#242a5f",
          border: "1px solid rgba(36,42,95,0.15)",
        };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1.8fr 1fr 90px 120px",
        padding: "0.875rem 1.5rem",
        borderBottom: i < total - 1 ? "1px solid rgba(228,232,240,0.7)" : "none",
        gap: "1rem",
        alignItems: "center",
        transition: "background-color 0.15s, border-left-color 0.15s",
        backgroundColor: hovered ? "rgba(36,42,95,0.025)" : "transparent",
        borderLeft: hovered ? "3px solid #4f6ef7" : "3px solid transparent",
        cursor: "default",
      }}
    >
      {/* Name + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
        <div
          style={{
            width: "2.125rem",
            height: "2.125rem",
            borderRadius: "50%",
            background: avatar.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: avatar.text,
            flexShrink: 0,
            letterSpacing: "0.03em",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {initials(p.name)}
        </div>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#1a1d2d",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.name}
        </span>
      </div>

      {/* Email */}
      <div style={{ minWidth: 0 }}>
        {p.email ? (
          <a
            href={`mailto:${p.email}`}
            title={p.email}
            style={{
              fontSize: "0.8125rem",
              color: hovered ? "#4f6ef7" : "#3b5bdb",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              transition: "color 0.15s",
            }}
          >
            {p.email}
          </a>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* Phone */}
      <div>
        {p.phone ? (
          <a
            href={`tel:${p.phone}`}
            style={{
              fontSize: "0.8125rem",
              color: "#475569",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#4f6ef7";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#475569";
            }}
          >
            {p.phone}
          </a>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>—</span>
        )}
      </div>

      {/* Visit count */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "2rem",
            padding: "0.1875rem 0.5rem",
            borderRadius: "9999px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
            ...visitBadgeStyle,
          }}
        >
          {p.latogatas}
        </span>
      </div>

      {/* Last visit — chip style */}
      <div>
        {p.lastVisit ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.1875rem 0.625rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "#475569",
              backgroundColor: "rgba(71,85,105,0.07)",
              whiteSpace: "nowrap",
              letterSpacing: "0.01em",
            }}
          >
            {formatDate(p.lastVisit)}
          </span>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>—</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminPatientsView() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    void fetch("/api/admin/patients")
      .then((r) => r.json())
      .then((data: { patients?: PatientRow[]; total?: number; error?: string }) => {
        if (data.error) {
          setError(data.error);
        } else {
          // Sort by name (A-Z) by default
          const sorted = (data.patients ?? []).sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "hu"),
          );
          setPatients(sorted);
          setTotal(data.total ?? data.patients?.length ?? 0);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nem sikerült betölteni a páciens adatokat.");
        setLoading(false);
      });
  }, []);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "with-bookings" && p.latogatas > 0);
    return matchSearch && matchFilter;
  });

  const bookingCount = patients.filter((p) => p.latogatas > 0).length;

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentPagePatients = filtered.slice(startIdx, endIdx);

  return (
    <div
      style={{
        padding: "1.5rem 1rem",
        flex: "none",
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minHeight: 0,
      }}
    >
      <style>{`
        /* Mobile-first responsive for patients view */
        @media (max-width: 768px) {
          /* Tighten padding */
          [style*="padding: "1.5rem"] {
            padding: 0.75rem !important;
          }
          
          /* Search input — full width */
          input[type="text"] {
            width: 100% !important;
          }
          
          /* Table header — hide some columns on mobile */
          [style*="gridTemplateColumns: "1.6fr"] {
            grid-template-columns: 2fr 1fr 100px !important;
            gap: 0.5rem !important;
          }
          
          /* Table cell padding */
          [style*="padding: "0.75rem"] {
            padding: 0.5rem !important;
          }
          
          /* Pagination controls — stack */
          [style*="justifyContent: "space-between"] {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Title block */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg,#e8ecff,#d0d8ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UsersIcon />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 700,
                color: "#1a1d2d",
                lineHeight: 1.2,
              }}
            >
              Páciensek
            </h2>
            <p
              style={{
                margin: "0.125rem 0 0",
                fontSize: "0.8125rem",
                color: "#94a3b8",
              }}
            >
              {loading ? "Betöltés..." : `${total.toLocaleString("hu-HU")} páciens összesen`}
            </p>
          </div>
        </div>

        {/* Search input */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Keresés név vagy e-mail alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              paddingLeft: "2.5rem",
              paddingRight: "1rem",
              paddingTop: "0.5625rem",
              paddingBottom: "0.5625rem",
              border: searchFocused ? "1.5px solid #4f6ef7" : "1.5px solid rgba(228,232,240,0.9)",
              borderRadius: "9999px",
              fontSize: "0.8125rem",
              color: "#1a1d2d",
              backgroundColor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(8px)",
              outline: "none",
              width: "280px",
              boxShadow: searchFocused
                ? "0 0 0 3px rgba(79,110,247,0.12)"
                : "0 1px 3px rgba(36,42,95,0.06)",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          />
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        {(
          [
            { id: "all", label: `Összes`, count: total },
            { id: "with-bookings", label: `Foglalással`, count: bookingCount },
          ] as { id: FilterMode; label: string; count: number }[]
        ).map(({ id, label, count }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "9999px",
                border: active ? "1.5px solid #242a5f" : "1.5px solid rgba(228,232,240,0.9)",
                backgroundColor: active ? "#242a5f" : "rgba(255,255,255,0.75)",
                backdropFilter: active ? "none" : "blur(8px)",
                color: active ? "#ffffff" : "#64748b",
                fontSize: "0.8125rem",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: active
                  ? "0 2px 8px rgba(36,42,95,0.22)"
                  : "0 1px 2px rgba(36,42,95,0.04)",
              }}
            >
              {label}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "1.25rem",
                  padding: "0 0.3125rem",
                  height: "1.125rem",
                  borderRadius: "9999px",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  backgroundColor: active ? "rgba(255,255,255,0.2)" : "rgba(36,42,95,0.08)",
                  color: active ? "#ffffff" : "#475569",
                  lineHeight: 1,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table card ───────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1.125rem",
          border: "1px solid rgba(228,232,240,0.8)",
          overflow: "visible",
          flex: "none",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 1px 3px rgba(36,42,95,0.05), 0 4px 16px rgba(36,42,95,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset",
          minHeight: "auto",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.8fr 1fr 90px 120px",
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(180deg,#f8f9fd 0%,#f3f5fb 100%)",
            borderBottom: "1px solid rgba(228,232,240,0.8)",
            gap: "1rem",
          }}
        >
          {["Név", "E-mail cím", "Telefonszám", "Látogatás", "Utolsó látogatás"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows area */}
        <div style={{ overflow: "visible", flex: "none" }}>
          {loading ? (
            <div
              style={{
                padding: "4rem",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "0.875rem",
              }}
            >
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  border: "2px solid #e4e8f0",
                  borderTopColor: "#4f6ef7",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 0.75rem",
                }}
              />
              Betöltés...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#ef4444",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            currentPagePatients.map((p, i) => (
              <PatientRow key={p.email || `${p.name}-${i}`} p={p} i={i} total={filtered.length} />
            ))
          )}
        </div>

        {/* Footer — pagination controls */}
        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid rgba(228,232,240,0.7)",
              background: "rgba(248,249,253,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              fontSize: "0.875rem",
              color: "#64748b",
            }}
          >
            {/* Result count */}
            <div>
              <span style={{ fontWeight: 600, color: "#475569" }}>
                {startIdx + 1}–{Math.min(endIdx, filtered.length)}
              </span>
              &nbsp;/&nbsp;
              <span>{filtered.length}</span>
            </div>

            {/* Pagination buttons */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "0.375rem 0.75rem",
                  border: "1px solid #e4e8f0",
                  borderRadius: "0.5rem",
                  backgroundColor: currentPage === 1 ? "#f3f5fb" : "#ffffff",
                  color: currentPage === 1 ? "#cbd5e1" : "#64748b",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                ← Előző
              </button>

              <span style={{ padding: "0 0.5rem", fontWeight: 500, color: "#242a5f" }}>
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: "0.375rem 0.75rem",
                  border: "1px solid #e4e8f0",
                  borderRadius: "0.5rem",
                  backgroundColor: currentPage === totalPages ? "#f3f5fb" : "#ffffff",
                  color: currentPage === totalPages ? "#cbd5e1" : "#64748b",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}
              >
                Következő →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
