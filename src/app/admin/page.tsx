import { headers } from "next/headers";
import Link from "next/link";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";
import LogoutButton from "@/components/admin/LogoutButton";
import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

// Role check happens here via auth.api.getSession() — NOT just middleware cookie check.
// Middleware only checks cookie existence (fast, no DB call).
// This Server Component does the actual role verification.

type AdminBooking = {
  _id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reservationNumber: string;
  service: { name: string; appointmentDuration: number } | null;
  slotDate: string;
  slotTime: string;
  status: string;
  managementToken: string;
};

function getTodayString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${String(y)}-${m}-${d}`;
}

function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) =>
    `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

const BOOKINGS_QUERY = `*[_type == "booking" && !(_id in path("drafts.**")) && slotDate >= $startDate && slotDate <= $endDate] | order(slotDate asc, slotTime asc) {
  _id,
  patientName,
  patientEmail,
  patientPhone,
  reservationNumber,
  service->{name, appointmentDuration},
  slotDate,
  slotTime,
  status,
  managementToken
}`;

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Hide website navbar on admin page
  const navbarHideStyle = `
    nav { display: none !important; }
    header:not(.admin-header) { display: none !important; }
    body > header { display: none !important; }
  `;

  // ── No session → show login form ─────────────────────────────────────────
  if (!session) {
    return <AdminLogin />;
  }

  // ── Session exists but NOT an admin → show login form with option to switch accounts ──────────────────────
  if (session.user.role !== "admin") {
    return (
      <>
        <style>{navbarHideStyle}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            backgroundColor: "#F2F4F8",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "24rem",
              backgroundColor: "#ffffff",
              borderRadius: "1.5rem",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(36,42,95,0.08)",
            }}
          >
            <h1
              style={{
                margin: "0 0 0.75rem",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#ef4444",
              }}
            >
              Hozzáférés megtagadva
            </h1>
            <p
              style={{
                margin: "0 0 1.5rem",
                fontSize: "0.875rem",
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              Ez az oldal csak adminisztrátorok számára érhető el.
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <LogoutButton />
            </div>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "0.5rem 1.25rem",
                backgroundColor: "#242a5f",
                color: "#ffffff",
                borderRadius: "9999px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Vissza a főoldalra
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ── Admin session → fetch initial data and render dashboard ───────────────
  const todayStr = getTodayString();
  const today = new Date(todayStr);
  const { startDate: monthStart, endDate: monthEnd } = getMonthRange(
    today.getFullYear(),
    today.getMonth(),
  );

  // Fetch today's bookings and current month's bookings in parallel
  // Server Component has direct access to Sanity write client — no API call needed
  let todayBookings: AdminBooking[] = [];
  let monthBookings: AdminBooking[] = [];

  try {
    [todayBookings, monthBookings] = await Promise.all([
      getWriteClient().fetch<AdminBooking[]>(BOOKINGS_QUERY, {
        startDate: todayStr,
        endDate: todayStr,
      }),
      getWriteClient().fetch<AdminBooking[]>(BOOKINGS_QUERY, {
        startDate: monthStart,
        endDate: monthEnd,
      }),
    ]);
  } catch {
    // If Sanity is unavailable (e.g. missing token during dev), render with empty data
    console.error("[admin/page] Failed to fetch initial bookings from Sanity");
  }

  return (
    <>
      <style>{`
        /* Hide website navbar/header but NOT the admin header */
        header:not([data-admin-header="true"]),
        body > nav:first-of-type,
        footer {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
      <AdminDashboard
        session={session}
        initialDayBookings={todayBookings}
        initialMonthBookings={monthBookings}
      />
    </>
  );
}
