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

  async function handleGoogleSignIn() {
    setFormError("");
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // biome-ignore lint/suspicious/noExplicitAny: error type depends on signIn provider
      setFormError(err.message || "Google sign-in failed");
      setLoading(false);
    }
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

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.625rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "#ffffff",
            border: "1px solid #e8eaf0",
            borderRadius: "0.75rem",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#242a5f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1804l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
            <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
          </svg>
          {loading ? "Bejelentkezés..." : "Bejelentkezés Google-lel"}
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e8eaf0" }} />
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>VAGY</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#e8eaf0" }} />
        </div>

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
