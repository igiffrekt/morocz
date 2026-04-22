"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function AddressGateContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(postalCode)) {
      setError("Az irányítószám 4 számjegyből áll");
      return;
    }
    if (!city.trim() || !streetAddress.trim()) {
      setError("A település és cím megadása kötelező");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode,
          city: city.trim(),
          streetAddress: streetAddress.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Hiba történt");
        return;
      }
      router.push(next);
    } catch {
      setError("Hiba történt. Próbálja újra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Számlázási cím</h1>
      <p className="text-sm text-gray-600 mb-6">
        Az időpontfoglalás véglegesítéséhez kérjük, adja meg számlázási címét. Erre számlakiállítás
        miatt van szükség.
      </p>

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
          <label htmlFor="addr-postal" className="block text-sm font-medium text-gray-700 mb-1">
            Irányítószám
          </label>
          <input
            id="addr-postal"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
            autoComplete="postal-code"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="addr-city" className="block text-sm font-medium text-gray-700 mb-1">
            Település
          </label>
          <input
            id="addr-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="addr-street" className="block text-sm font-medium text-gray-700 mb-1">
            Utca, házszám
          </label>
          <input
            id="addr-street"
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            autoComplete="street-address"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Folyamatban…" : "Mentés"}
        </button>
      </form>
    </div>
  );
}

export default function AddressGatePage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center">Betöltés…</div>}>
      <AddressGateContent />
    </Suspense>
  );
}
