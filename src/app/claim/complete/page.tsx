"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClaimCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }
    const q = new URLSearchParams({ token, email }).toString();
    fetch(`/api/auth/claim/verify?${q}`)
      .then((r) => r.json())
      .then((d) => setTokenValid(!!d.valid))
      .catch(() => setTokenValid(false))
      .finally(() => setVerifying(false));
  }, [token, email]);

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
      const res = await fetch("/api/auth/claim/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
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
      router.push("/");
    } catch {
      setError("Hiba történt. Próbálja újra.");
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center">Ellenőrzés…</div>;
  }

  if (!tokenValid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Érvénytelen link</h1>
        <p className="text-gray-600">
          Ez a link érvénytelen vagy lejárt. Kérjük, kérjen új aktiváló e-mailt a bejelentkezési oldalon.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Fiók aktiválása</h1>
      <p className="text-sm text-gray-600 mb-6">
        Állítson be jelszót és adja meg számlázási címét a fiók aktiválásához.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="claim-password" className="block text-sm font-medium text-gray-700 mb-1">
            Új jelszó
          </label>
          <input
            id="claim-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Jelszó megerősítése
          </label>
          <input
            id="claim-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-postal" className="block text-sm font-medium text-gray-700 mb-1">
            Irányítószám
          </label>
          <input
            id="claim-postal"
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
          <label htmlFor="claim-city" className="block text-sm font-medium text-gray-700 mb-1">
            Település
          </label>
          <input
            id="claim-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-street" className="block text-sm font-medium text-gray-700 mb-1">
            Utca, házszám
          </label>
          <input
            id="claim-street"
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
          {submitting ? "Folyamatban…" : "Fiók aktiválása"}
        </button>
      </form>
    </div>
  );
}
