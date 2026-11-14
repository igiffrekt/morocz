"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AUTH_ICONS, AuthCardHeading } from "@/components/auth/AuthCardHeading";
import { PasswordField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { PillLink, pillClassName } from "@/components/ui/PillButton";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="fade-up flex flex-col gap-5">
        <AuthCardHeading
          icon={AUTH_ICONS.alert}
          iconClassName="bg-sun-soft text-navy"
          title="Érvénytelen link"
          lead="Ez a link érvénytelen vagy lejárt. Kérjük, kérjen új jelszó-visszaállító e-mailt a bejelentkezési oldalon."
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
    <div className="fade-up flex flex-col gap-5">
      <AuthCardHeading
        icon={AUTH_ICONS.key}
        title="Új jelszó beállítása"
        lead="Adja meg az új jelszavát."
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
        <PasswordField
          id="reset-password"
          label="Új jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Legalább 6 karakter"
          hint="Legalább 6 karakter"
        />
        <PasswordField
          id="reset-password-confirm"
          label="Jelszó megerősítése"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          placeholder="Legalább 6 karakter"
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
          {submitting ? "Folyamatban…" : "Jelszó mentése"}
        </button>
      </form>
    </div>
  );
}
