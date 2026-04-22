"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!email.includes("@")) {
      setEmailError("Érvénytelen e-mail cím");
      return;
    }

    setLoading(true);

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/jelszo-visszaallitas",
      });
      // Always show success — don't reveal whether email exists
      setSent(true);
    } catch {
      setError("Hiba történt, kérjük próbálja újra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 px-4">
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
        {/* Back link */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <span aria-hidden="true">←</span>
          Vissza a bejelentkezéshez
        </button>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-text-light mb-2">Elfelejtett jelszó</h2>

        {!sent ? (
          <>
            {/* Description */}
            <p className="text-sm text-gray-600 mb-6">
              Adja meg az e-mail címét, és küldünk egy jelszó-visszaállító linket.
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-mail cím
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelda@email.hu"
                  autoComplete="email"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    emailError ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Küldés..." : "Visszaállító link küldése"}
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center">
            {/* Check icon */}
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7 text-green-600"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Ellenőrizze a postaládáját! Ha regisztrált ezzel az e-mail címmel, hamarosan kap egy
              visszaállító linket.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            >
              Vissza a bejelentkezéshez
            </button>
          </div>
        )}

        {/* Google suggestion */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
          <span className="text-blue-500 text-lg leading-none mt-0.5" aria-hidden="true">
            ℹ
          </span>
          <p className="text-xs text-blue-700">
            <span className="font-medium">Tipp:</span> Ha Google-fiókkal regisztrált, egyszerűen
            használja a Google bejelentkezést!
          </p>
        </div>
      </div>
    </div>
  );
}
