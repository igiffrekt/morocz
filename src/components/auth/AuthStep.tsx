"use client";

import { useEffect, useId, useState } from "react";
import { OrDivider, PasswordField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { TabList, TabPanel } from "@/components/ui/Tabs";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import ForgotPassword from "./ForgotPassword";

interface AuthStepProps {
  onSuccess: () => void;
  defaultTab?: "belepes" | "regisztracio";
  className?: string;
}

type Tab = "belepes" | "regisztracio";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  postalCode?: string;
  city?: string;
  streetAddress?: string;
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

export default function AuthStep({ onSuccess, defaultTab = "belepes", className }: AuthStepProps) {
  const idBase = `auth-${useId().replace(/:/g, "")}`;
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [belepesStep, setBelepesStep] = useState<"email" | "password" | "ghost">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [claimEmailSent, setClaimEmailSent] = useState(false);

  useEffect(() => {
    if (!isPending && session) onSuccess();
  }, [session, isPending, onSuccess]);

  // The password step opens with its field focused.
  useEffect(() => {
    if (belepesStep === "password") document.getElementById("auth-password")?.focus();
  }, [belepesStep]);

  if (isPending) return null;
  if (session) return null;
  if (showForgotPassword) {
    return (
      <ForgotPassword
        onBack={() => setShowForgotPassword(false)}
        initialEmail={email}
        className={className}
      />
    );
  }

  function resetBelepes() {
    setBelepesStep("email");
    setPassword("");
    setClaimEmailSent(false);
    setErrors({});
    setGlobalError("");
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {};
    if (tab === "regisztracio") {
      if (!name.trim()) newErrors.name = "A név megadása kötelező";
      if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
        newErrors.phoneNumber = "A telefonszámnak legalább 10 számjegyből kell állnia";
      }
      if (!/^\d{4}$/.test(postalCode)) {
        newErrors.postalCode = "Az irányítószám 4 számjegyből áll";
      }
      if (!city.trim()) newErrors.city = "A település megadása kötelező";
      if (!streetAddress.trim()) newErrors.streetAddress = "A cím megadása kötelező";
    }
    if (!email.includes("@")) newErrors.email = "Érvénytelen e-mail cím";
    if (tab === "regisztracio" || belepesStep === "password") {
      if (password.length < 6) {
        newErrors.password = "A jelszónak legalább 6 karakter hosszúnak kell lennie";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function mapErrorMessage(error: unknown): string {
    let msg = "";
    if (error instanceof Error) msg = error.message;
    else if (typeof error === "string") msg = error;
    else if (error && typeof error === "object") {
      const obj = error as Record<string, unknown>;
      msg = String(obj.message ?? obj.code ?? obj.statusText ?? JSON.stringify(error));
    } else msg = String(error);
    msg = msg.toLowerCase();
    if (
      msg.includes("credential_account_not_found") ||
      msg.includes("credential account not found")
    ) {
      return 'Ehhez az e-mail címhez Google-fiókkal regisztrált. Kérjük, használja a „Folytatás Google-fiókkal" gombot.';
    }
    if (
      msg.includes("invalid") ||
      msg.includes("credentials") ||
      msg.includes("password") ||
      msg.includes("incorrect")
    ) {
      return "Hibás e-mail cím vagy jelszó";
    }
    if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
      return "Ez az e-mail cím már regisztrálva van";
    }
    if (msg.includes("rate") || msg.includes("429") || msg.includes("too many")) {
      return "Kérjük, várjon egy percet, majd próbálja újra";
    }
    if (msg.includes("weak") || msg.includes("short")) return "A jelszó túl gyenge";
    console.error("[AuthStep] Unhandled auth error:", error);
    return "Hiba történt, kérjük próbálja újra";
  }

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    const emailErr: FieldErrors = {};
    if (!email.includes("@")) {
      emailErr.email = "Érvénytelen e-mail cím";
      setErrors(emailErr);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(
        `/api/auth/email-status?email=${encodeURIComponent(email.toLowerCase())}`,
      );
      const data = await res.json();
      if (data.status === "new") {
        setTab("regisztracio");
        setLoading(false);
        return;
      }
      if (data.status === "oauth") {
        await signIn.social({ provider: "google", callbackURL: "/idopontfoglalas" });
        return;
      }
      if (data.status === "ghost") {
        setBelepesStep("ghost");
        setLoading(false);
        return;
      }
      setBelepesStep("password");
      setLoading(false);
    } catch {
      setGlobalError("Hiba történt, kérjük próbálja újra");
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
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
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisztracioSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/idopontfoglalas",
      });
      if (result?.data?.user?.id) {
        try {
          if (phoneNumber.trim()) {
            await fetch("/api/user/phone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
            });
          }
          await fetch("/api/user/address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postalCode,
              city: city.trim(),
              streetAddress: streetAddress.trim(),
            }),
          });
        } catch (err) {
          console.error("[AuthStep] Post-signup profile save failed:", err);
        }
      }
      if (result.error) {
        setGlobalError(mapErrorMessage(result.error));
        return;
      }
      onSuccess();
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
      await signIn.social({ provider: "google", callbackURL: "/idopontfoglalas" });
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleClaimStart() {
    setGlobalError("");
    setLoading(true);
    try {
      await fetch("/api/auth/claim/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      setClaimEmailSent(true);
    } catch {
      setGlobalError("Hiba történt, kérjük próbálja újra");
    } finally {
      setLoading(false);
    }
  }

  const busyLabel = "Folyamatban...";
  const submitClass = pillClassName({
    variant: "navy",
    size: "lg",
    fullWidth: true,
    className: "mt-1 h-[58px]",
  });

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <TabList
        idBase={idBase}
        label="Fiók"
        tone="light"
        value={tab}
        items={[
          { value: "belepes", label: "Belépés" },
          { value: "regisztracio", label: "Regisztráció" },
        ]}
        onChange={(next) => {
          setTab(next);
          if (next === "belepes") {
            resetBelepes();
          } else {
            setErrors({});
            setGlobalError("");
          }
        }}
        className="max-w-[460px] [&_[role=tab]]:h-[50px] [&_[role=tab]]:text-[15px]"
      />

      <TabPanel idBase={idBase} value={tab} className="flex flex-col gap-[18px]">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={pillClassName({
            variant: "outline",
            fullWidth: true,
            className: "h-[54px] gap-3 text-[15px] font-bold",
          })}
        >
          <GoogleIcon />
          Folytatás Google-fiókkal
        </button>

        <OrDivider />

        {globalError && (
          <Notice tone="error" shape="pill" role="alert" aria-live="polite">
            {globalError}
          </Notice>
        )}

        {tab === "belepes" && belepesStep === "email" && (
          <form onSubmit={handleEmailContinue} noValidate className="flex flex-col gap-[18px]">
            <TextField
              id="auth-email"
              type="email"
              label="E-mail cím"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              autoComplete="email"
              error={errors.email}
            />
            <button type="submit" disabled={loading} className={submitClass}>
              {loading ? busyLabel : "Tovább"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        )}

        {tab === "belepes" && belepesStep === "password" && (
          <form onSubmit={handlePasswordSubmit} noValidate className="flex flex-col gap-[18px]">
            <EmailChip email={email} onChange={resetBelepes} />
            <PasswordField
              id="auth-password"
              label="Jelszó"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Legalább 6 karakter"
              error={errors.password}
              labelAside={
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="link-grow border-0 bg-transparent px-0 py-0.5 text-[13px] font-bold text-teal-ink"
                >
                  Elfelejtett jelszó?
                </button>
              }
            />
            <button type="submit" disabled={loading} className={submitClass}>
              {loading ? busyLabel : "Belépés"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        )}

        {tab === "belepes" && belepesStep === "ghost" && (
          <div className="flex flex-col gap-[18px]">
            <EmailChip email={email} onChange={resetBelepes} />
            <p className="m-0 text-[15px] leading-relaxed text-muted-strong">
              Rendszerünkben szerepel egy foglalási fiók ezzel az e-mail címmel, de még nincs
              aktiválva. Válasszon az alábbi lehetőségek közül:
            </p>
            {claimEmailSent ? (
              <Notice tone="success" role="status">
                Elküldtük az aktiváló linket. Kérjük, ellenőrizze a postafiókját.
              </Notice>
            ) : (
              <button
                type="button"
                onClick={handleClaimStart}
                disabled={loading}
                className={submitClass}
              >
                {loading ? busyLabel : "Aktiváló link kérése e-mailben"}
              </button>
            )}
          </div>
        )}

        {tab === "regisztracio" && (
          <form
            onSubmit={handleRegisztracioSubmit}
            noValidate
            className="fade-up flex flex-col gap-4"
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
              <TextField
                id="auth-name"
                label="Teljes név"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kovács János"
                autoComplete="name"
                error={errors.name}
              />
              <TextField
                id="auth-phone"
                type="tel"
                label="Telefonszám"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+36 70 000 0000"
                autoComplete="tel"
                error={errors.phoneNumber}
              />
            </div>
            <TextField
              id="auth-email-reg"
              type="email"
              label="E-mail cím"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.hu"
              autoComplete="email"
              error={errors.email}
            />
            <PasswordField
              id="auth-password-reg"
              label="Jelszó"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Legalább 6 karakter"
              autoComplete="new-password"
              hint="Legalább 6 karakter"
              error={errors.password}
            />
            <fieldset className="m-0 flex flex-col gap-3 rounded-[28px] border-0 bg-field p-4 sm:p-5">
              <legend className="float-left mb-1 p-0 text-[13px] font-extrabold tracking-[.08em] text-muted uppercase">
                Számlázási cím
              </legend>
              <div className="clear-both grid grid-cols-6 gap-3.5">
                <TextField
                  id="auth-postal"
                  label="Irányítószám"
                  inputMode="numeric"
                  maxLength={4}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                  autoComplete="postal-code"
                  placeholder="Irsz."
                  tone="white"
                  error={errors.postalCode}
                  className="col-span-6 sm:col-span-2"
                />
                <TextField
                  id="auth-city"
                  label="Település"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  placeholder="Település"
                  tone="white"
                  error={errors.city}
                  className="col-span-6 sm:col-span-4"
                />
                <TextField
                  id="auth-street"
                  label="Utca, házszám"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  autoComplete="street-address"
                  placeholder="Utca, házszám"
                  tone="white"
                  error={errors.streetAddress}
                  className="col-span-6"
                />
              </div>
            </fieldset>
            <button type="submit" disabled={loading} className={submitClass}>
              {loading ? busyLabel : "Regisztráció"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        )}
      </TabPanel>
    </div>
  );
}

/** The e-mail being signed in with, plus a way back to the e-mail step. */
function EmailChip({ email, onChange }: { email: string; onChange: () => void }) {
  return (
    <div className="flex min-w-0 items-center gap-2 self-start rounded-full bg-canvas py-1.5 pr-1.5 pl-4 text-sm font-bold text-navy">
      <span className="min-w-0 truncate">{email}</span>
      <button
        type="button"
        onClick={onChange}
        className="tap-press inline-flex h-9 shrink-0 items-center rounded-full bg-white px-3.5 text-[13px] font-extrabold text-teal-ink hover:bg-sage"
      >
        változtatás
      </button>
    </div>
  );
}
