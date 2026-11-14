"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AddressFields } from "@/components/auth/AddressFields";
import { AUTH_ICONS, AuthCardHeading } from "@/components/auth/AuthCardHeading";
import { Notice } from "@/components/ui/Notice";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";

export function AddressForm() {
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
    <div className="fade-up flex flex-col gap-5">
      <AuthCardHeading
        icon={AUTH_ICONS.home}
        title="Számlázási cím"
        lead="Az időpontfoglalás véglegesítéséhez kérjük, adja meg számlázási címét. Erre számlakiállítás miatt van szükség."
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
        <AddressFields
          postalCode={postalCode}
          city={city}
          streetAddress={streetAddress}
          onPostalCode={setPostalCode}
          onCity={setCity}
          onStreet={setStreetAddress}
          idPrefix="addr"
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
          {submitting ? "Folyamatban…" : "Mentés"}
          {!submitting && <ArrowIcon />}
        </button>
      </form>
    </div>
  );
}
