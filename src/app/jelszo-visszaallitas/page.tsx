"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Érvénytelen link</h1>
        <p className="text-gray-600">
          Ez a link érvénytelen vagy lejárt. Kérjük, kérjen új jelszó-visszaállító e-mailt a
          bejelentkezési oldalon.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie");
      return;
    }
    if (password !== passwordConfirm) {
      setError("A két jelszó nem egyezik");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError("Ez a link érvénytelen vagy lejárt. Kérjük, kérjen újat.");
        return;
      }
      router.push("/idopontfoglalas");
    } catch {
      setError("Hiba történt. Próbálja újra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Új jelszó beállítása</h1>
      <p className="text-sm text-gray-600 mb-6">Adja meg az új jelszavát.</p>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
            Új jelszó
          </label>
          <input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="reset-password-confirm"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Jelszó megerősítése
          </label>
          <input
            id="reset-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Folyamatban…" : "Jelszó mentése"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center">Betöltés…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
