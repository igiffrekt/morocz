"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AddressFields } from "@/components/auth/AddressFields";
import { AUTH_ICONS, AuthCardHeading } from "@/components/auth/AuthCardHeading";
import { PasswordField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PillLink, pillClassName } from "@/components/ui/PillButton";

export function ClaimCompleteForm() {
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
      router.push("/idopontfoglalas");
    } catch {
      setError("Hiba történt. Próbálja újra.");
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <output className="m-0 block py-10 text-center text-[15px] font-semibold text-muted">
        Ellenőrzés…
      </output>
    );
  }

  if (!tokenValid) {
    return (
      <div className="fade-up flex flex-col gap-5">
        <AuthCardHeading
          icon={AUTH_ICONS.alert}
          iconClassName="bg-sun-soft text-navy"
          title="Érvénytelen link"
          lead="Ez a link érvénytelen vagy lejárt. Kérjük, kérjen új aktiváló e-mailt a bejelentkezési oldalon."
        />
        <PillLink
          href="/idopontfoglalas"
          variant="navy"
          size="lg"
          arrow
          fullWidth
          className="h-[58px]"
        >
          Tovább a bejelentkezéshez
        </PillLink>
      </div>
    );
  }

  return (
    <div className="fade-up flex flex-col gap-5">
      <AuthCardHeading
        icon={AUTH_ICONS.user}
        title="Fiók aktiválása"
        lead="Állítson be jelszót és adja meg számlázási címét a fiók aktiválásához."
      />

      {email && (
        <span className="self-start rounded-full bg-canvas px-4 py-2 text-sm font-bold break-all text-navy">
          {email}
        </span>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
        <PasswordField
          id="claim-password"
          label="Új jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Legalább 6 karakter"
          hint="Legalább 6 karakter"
        />
        <PasswordField
          id="claim-password-confirm"
          label="Jelszó megerősítése"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          placeholder="Legalább 6 karakter"
        />
        <AddressFields
          postalCode={postalCode}
          city={city}
          streetAddress={streetAddress}
          onPostalCode={setPostalCode}
          onCity={setCity}
          onStreet={setStreetAddress}
          idPrefix="claim"
        />

        {error && (
          <Notice tone="error" shape="pill" role="alert" aria-live="polite">
            {error}
          </Notice>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={pillClassName({
            variant: "navy",
            size: "lg",
            fullWidth: true,
            className: "h-[58px]",
          })}
        >
          {submitting ? "Folyamatban…" : "Fiók aktiválása"}
        </button>
      </form>
    </div>
  );
}
