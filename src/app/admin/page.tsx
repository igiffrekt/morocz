import { headers } from "next/headers";
import Link from "next/link";
import AdminLogin, { AdminSignOut } from "@/components/admin/AdminLogin";
import { auth } from "@/lib/auth";

// Role check happens here via auth.api.getSession() — NOT just middleware cookie check.
// Middleware only checks cookie existence (fast, no DB call).
// This Server Component does the actual role verification.

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // ── No session → show login form ─────────────────────────────────────────
  if (!session) {
    return <AdminLogin />;
  }

  // ── Session exists but NOT an admin → access denied ──────────────────────
  if (session.user.role !== "admin") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          backgroundColor: "#0f172a",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "24rem",
            backgroundColor: "#1e293b",
            borderRadius: "0.5rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#f87171",
            }}
          >
            Hozzáférés megtagadva
          </h1>
          <p
            style={{
              margin: "0 0 1.5rem",
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            Ez az oldal csak adminisztrátorok számára érhető el.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              backgroundColor: "#334155",
              color: "#f8fafc",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    );
  }

  // ── Admin session → placeholder dashboard ─────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        backgroundColor: "#0f172a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          backgroundColor: "#1e293b",
          borderRadius: "0.5rem",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            margin: "0 0 0.375rem",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#f8fafc",
          }}
        >
          Admin felület
        </h1>
        <p
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1rem",
            color: "#cbd5e1",
          }}
        >
          Üdvözöljük, {session.user.name}!
        </p>
        <p
          style={{
            margin: "0",
            fontSize: "0.875rem",
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Az admin felület a 13. fázisban kerül megvalósításra.
        </p>
        <AdminSignOut />
      </div>
    </div>
  );
}
