"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signOut } from "@/lib/auth-client";

// ─── Admin Sign Out Button ─────────────────────────────────────────────────────
// Used inside the server-rendered admin dashboard placeholder.

export function AdminSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut();
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      style={{
        padding: "0.375rem 0.875rem",
        backgroundColor: "transparent",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "9999px",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "0.8125rem",
        fontWeight: 500,
        opacity: loading ? 0.7 : 1,
        transition: "all 0.15s",
      }}
    >
      {loading ? "Kijelentkezés..." : "Kijelentkezés"}
    </button>
  );
}

// ─── Admin Login Form ──────────────────────────────────────────────────────────
// Email/password only — no Google OAuth, no registration, no forgot password.
// Utilitarian dark styling distinct from patient-facing UI.

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    let valid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Az e-mail cím megadása kötelező.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Érvénytelen e-mail cím formátum.");
      valid = false;
    }

    if (!password) {
      setPasswordError("A jelszó megadása kötelező.");
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
        rememberMe: true,
      });

      if (result?.error) {
        const code = result.error.status;
        if (code === 429) {
          setFormError("Túl sok próbálkozás. Kérjük, várjon egy percet.");
        } else if (code === 401 || code === 403 || code === 400) {
          setFormError("Hibás e-mail cím vagy jelszó.");
        } else {
          setFormError("Hiba történt, kérjük próbálja újra.");
        }
      } else {
        router.refresh();
      }
    } catch {
      setFormError("Hiba történt, kérjük próbálja újra.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    backgroundColor: "#ffffff",
    border: "1px solid #e8eaf0",
    borderRadius: "0.75rem",
    color: "#1A1D2D",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#64748b",
    marginBottom: "0.375rem",
  };

  const errorStyle: React.CSSProperties = {
    color: "#ef4444",
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  };

  return (
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
          boxShadow: "0 4px 24px rgba(36,42,95,0.08)",
        }}
      >
        {/* Heading */}
        <h1
          style={{
            margin: "0 0 0.375rem",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#242a5f",
            letterSpacing: "-0.01em",
          }}
        >
          Adminisztráció
        </h1>
        <p
          style={{
            margin: "0 0 1.75rem",
            fontSize: "0.875rem",
            color: "#64748b",
          }}
        >
          Kérjük, jelentkezzen be az admin fiókjával.
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="admin-email" style={labelStyle}>
              E-mail cím
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            {emailError && <p style={errorStyle}>{emailError}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="admin-password" style={labelStyle}>
              Jelszó
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              disabled={loading}
            />
            {passwordError && <p style={errorStyle}>{passwordError}</p>}
          </div>

          {/* Form-level error */}
          {formError && (
            <p
              style={{
                ...errorStyle,
                marginBottom: "1rem",
                padding: "0.625rem 0.875rem",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                borderRadius: "0.375rem",
                border: "1px solid rgba(239, 68, 68, 0.15)",
              }}
            >
              {formError}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.625rem 1rem",
              backgroundColor: loading ? "#1e2550" : "#242a5f",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Belépés..." : "Belépés"}
          </button>
        </form>
      </div>
    </div>
  );
}
