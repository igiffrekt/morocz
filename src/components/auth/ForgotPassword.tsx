"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

interface ForgotPasswordProps {
  onBack: () => void;
  /** Pre-fills the e-mail typed on the sign-in step. */
  initialEmail?: string;
  className?: string;
}

const KEY_ICON =
  "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4";

export default function ForgotPassword({
  onBack,
  initialEmail = "",
  className,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail);
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

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className={pillClassName({
        variant: "outline",
        size: "sm",
        className: "h-11 self-start pr-[18px] pl-3 text-sm font-bold",
      })}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="arrow-back"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Vissza a bejelentkezéshez
    </button>
  );

  return (
    <div className={cn("fade-up flex flex-col gap-5", className)}>
      {backButton}
      <span
        aria-hidden="true"
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-sun-soft text-navy"
      >
        <svg
          aria-hidden="true"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={KEY_ICON} />
        </svg>
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.03em] text-navy sm:text-[34px]">
          Elfelejtett jelszó
        </h2>
        {!sent && (
          <p className="m-0 text-[15px] leading-relaxed text-muted">
            Adja meg az e-mail címét, és küldünk egy jelszó-visszaállító linket.
          </p>
        )}
      </div>

      {!sent ? (
        <>
          {error && (
            <Notice tone="error" shape="pill" role="alert">
              {error}
            </Notice>
          )}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
            <TextField
              id="forgot-email"
              type="email"
              label="E-mail cím"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              autoComplete="email"
              error={emailError}
            />
            <button
              type="submit"
              disabled={loading}
              className={pillClassName({
                variant: "navy",
                size: "lg",
                fullWidth: true,
                className: "h-[58px]",
              })}
            >
              {loading ? "Küldés..." : "Visszaállító link küldése"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        </>
      ) : (
        <>
          <output className="fade-up flex items-start gap-3.5 rounded-[28px] bg-mint-pale px-[22px] py-[18px]">
            <span className="pop-in-slow inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint text-navy">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="text-[15px] leading-relaxed font-semibold text-[#1f4f4b]">
              Ellenőrizze a postaládáját! Ha regisztrált ezzel az e-mail címmel, hamarosan kap egy
              visszaállító linket.
            </span>
          </output>
          <button
            type="button"
            onClick={onBack}
            className={pillClassName({
              variant: "navy",
              size: "lg",
              fullWidth: true,
              className: "h-[58px]",
            })}
          >
            Vissza a bejelentkezéshez
          </button>
        </>
      )}

      <Notice tone="info" title="Tipp">
        <span>Ha Google-fiókkal regisztrált, egyszerűen használja a Google bejelentkezést!</span>
      </Notice>
    </div>
  );
}
