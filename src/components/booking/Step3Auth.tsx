"use client";

import AuthStep from "@/components/auth/AuthStep";

interface Step3Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function Step3Auth({ onSuccess, onBack }: Step3Props) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">Bejelentkezés</h2>
        <p className="text-sm text-gray-600">
          A foglalás véglegesítéséhez kérjük, jelentkezzen be.
        </p>
      </div>

      {/* AuthStep handles Google OAuth and email/password, auto-advances if session exists */}
      <AuthStep onSuccess={onSuccess} />

      <div className="mt-4 flex">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Vissza
        </button>
      </div>
    </div>
  );
}
