"use client";

import { useEffect, useState } from "react";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import ForgotPassword from "./ForgotPassword";

interface AuthStepProps {
  onSuccess: () => void;
  defaultTab?: "belepes" | "regisztracio";
}

type Tab = "belepes" | "regisztracio";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function AuthStep({ onSuccess, defaultTab = "belepes" }: AuthStepProps) {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Auto-advance if session already exists
  useEffect(() => {
    if (!isPending && session) {
      onSuccess();
    }
  }, [session, isPending, onSuccess]);

  // While session is loading, don't render anything
  if (isPending) {
    return null;
  }

  // If session exists, nothing to render (useEffect will call onSuccess)
  if (session) {
    return null;
  }

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {};

    if (tab === "regisztracio") {
      if (!name.trim()) {
        newErrors.name = "A név megadása kötelező";
      }
      if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
        newErrors.phoneNumber = "A telefonszámnak legalább 10 számjegyből kell állnia";
      }
    }

    if (!email.includes("@")) {
      newErrors.email = "Érvénytelen e-mail cím";
    }

    if (password.length < 6) {
      newErrors.password = "A jelszónak legalább 6 karakter hosszúnak kell lennie";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function mapErrorMessage(error: unknown): string {
    // Better Auth returns { message?: string, code?: string, status?: number }
    let msg = "";
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === "string") {
      msg = error;
    } else if (error && typeof error === "object") {
      const obj = error as Record<string, unknown>;
      msg = String(obj.message ?? obj.code ?? obj.statusText ?? JSON.stringify(error));
    } else {
      msg = String(error);
    }
    msg = msg.toLowerCase();

    if (
      msg.includes("invalid") ||
      msg.includes("credentials") ||
      msg.includes("password") ||
      msg.includes("not found") ||
      msg.includes("incorrect")
    ) {
      return "Hibás e-mail cím vagy jelszó";
    }
    if (
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered") ||
      msg.includes("user_already")
    ) {
      return "Ez az e-mail cím már regisztrálva van";
    }
    if (msg.includes("rate") || msg.includes("429") || msg.includes("too many")) {
      return "Kérjük, várjon egy percet, majd próbálja újra";
    }
    if (msg.includes("weak") || msg.includes("short")) {
      return "A jelszó túl gyenge. Kérjük, válasszon erősebb jelszót";
    }
    console.error("[AuthStep] Unhandled auth error:", error);
    return "Hiba történt, kérjük próbálja újra";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");

    if (!validate()) return;

    setLoading(true);

    try {
      if (tab === "belepes") {
        const result = await signIn.email({
          email,
          password,
          rememberMe: true,
          callbackURL: "/idopontfoglalas",
        });

        if (result.error) {
          setGlobalError(mapErrorMessage(result.error));
          return;
        }

        onSuccess();
      } else {
        const result = await signUp.email({
          email,
          password,
          name,
          callbackURL: "/idopontfoglalas",
        });

        // Save phoneNumber separately (Better Auth doesn't support custom fields)
        if (result?.data?.user?.id && phoneNumber.trim()) {
          try {
            await fetch("/api/user/phone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
            });
          } catch (err) {
            console.error("[AuthStep] Phone save failed:", err);
          }
        }

        if (result.error) {
          setGlobalError(mapErrorMessage(result.error));
          return;
        }

        onSuccess();
      }
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGlobalError("");
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/idopontfoglalas",
      });
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 px-4">
      {/* Contextual message */}
      <p className="text-center text-sm text-gray-600 mb-6 max-w-md">
        Az időpontfoglalás véglegesítéséhez kérjük, jelentkezzen be vagy hozzon létre egy fiókot.
      </p>

      {/* Auth card */}
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
        {/* Tab toggle */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("belepes");
              setPhoneNumber("");
              setErrors({});
              setGlobalError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "belepes"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Belépés
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("regisztracio");
              setPhoneNumber("");
              setErrors({});
              setGlobalError("");
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "regisztracio"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Regisztráció
          </button>
        </div>

        {/* Google OAuth button — prominent, top position */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <GoogleIcon />
          Folytatás Google-fiókkal
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">vagy</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Global error */}
        {globalError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{globalError}</p>
          </div>
        )}

        {/* Email/password form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name field — registration only */}
          {tab === "regisztracio" && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Teljes név
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kovács János"
                  autoComplete="name"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.name ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Phone field — registration only */}
              <div>
                <label
                  htmlFor="auth-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Telefonszám
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+36 70 000 0000"
                  autoComplete="tel"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.phoneNumber ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            </>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail cím
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              autoComplete={tab === "belepes" ? "email" : "email"}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">
              Jelszó
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "belepes" ? "••••••••" : "Legalább 6 karakter"}
              autoComplete={tab === "belepes" ? "current-password" : "new-password"}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                errors.password ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Forgot password link — login tab only */}
          {tab === "belepes" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-primary hover:underline"
              >
                Elfelejtett jelszó?
              </button>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Folyamatban..." : tab === "belepes" ? "Belépés" : "Regisztráció"}
          </button>
        </form>
      </div>
    </div>
  );
}


