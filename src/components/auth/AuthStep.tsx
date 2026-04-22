"use client";

import { useEffect, useState } from "react";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import ForgotPassword from "./ForgotPassword";

interface AuthStepProps {
  onSuccess: () => void;
  defaultTab?: "belepes" | "regisztracio";
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

export default function AuthStep({ onSuccess, defaultTab = "belepes" }: AuthStepProps) {
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

  if (isPending) return null;
  if (session) return null;
  if (showForgotPassword) return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;

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
    if (msg.includes("credential_account_not_found") || msg.includes("credential account not found")) {
      return 'Ehhez az e-mail címhez Google-fiókkal regisztrált. Kérjük, használja a „Folytatás Google-fiókkal" gombot.';
    }
    if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password") || msg.includes("incorrect")) {
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

  const inputCx = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
      hasError ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 px-4">
      <p className="text-center text-sm text-gray-600 mb-6 max-w-md">
        Az időpontfoglalás véglegesítéséhez kérjük, jelentkezzen be vagy hozzon létre egy fiókot.
      </p>

      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => { setTab("belepes"); resetBelepes(); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "belepes" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Belépés
          </button>
          <button
            type="button"
            onClick={() => { setTab("regisztracio"); setErrors({}); setGlobalError(""); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "regisztracio" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Regisztráció
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <GoogleIcon />
          Folytatás Google-fiókkal
        </button>

        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">vagy</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {globalError && (
          <div role="alert" aria-live="polite" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{globalError}</p>
          </div>
        )}

        {tab === "belepes" && belepesStep === "email" && (
          <form onSubmit={handleEmailContinue} noValidate className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail cím
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                autoComplete="email"
                className={inputCx(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Folyamatban..." : "Tovább"}
            </button>
          </form>
        )}

        {tab === "belepes" && belepesStep === "password" && (
          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
            <div className="text-sm text-gray-600">
              <span>{email}</span>{" "}
              <button type="button" onClick={resetBelepes} className="text-primary hover:underline">
                (változtatás)
              </button>
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">
                Jelszó
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={inputCx(!!errors.password)}
                autoFocus
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-primary hover:underline"
              >
                Elfelejtett jelszó?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Folyamatban..." : "Belépés"}
            </button>
          </form>
        )}

        {tab === "belepes" && belepesStep === "ghost" && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <span>{email}</span>{" "}
              <button type="button" onClick={resetBelepes} className="text-primary hover:underline">
                (változtatás)
              </button>
            </div>
            <p className="text-sm text-gray-700">
              Rendszerünkben szerepel egy foglalási fiók ezzel az e-mail címmel, de még nincs aktiválva.
              Válasszon az alábbi lehetőségek közül:
            </p>
            {claimEmailSent ? (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Elküldtük az aktiváló linket. Kérjük, ellenőrizze a postafiókját.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimStart}
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Folyamatban..." : "Aktiváló link kérése e-mailben"}
              </button>
            )}
          </div>
        )}

        {tab === "regisztracio" && (
          <form onSubmit={handleRegisztracioSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-gray-700 mb-1">Teljes név</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kovács János"
                autoComplete="name"
                className={inputCx(!!errors.name)}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="auth-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefonszám</label>
              <input
                id="auth-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+36 70 000 0000"
                autoComplete="tel"
                className={inputCx(!!errors.phoneNumber)}
              />
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
            </div>
            <div>
              <label htmlFor="auth-email-reg" className="block text-sm font-medium text-gray-700 mb-1">E-mail cím</label>
              <input
                id="auth-email-reg"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                autoComplete="email"
                className={inputCx(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="auth-password-reg" className="block text-sm font-medium text-gray-700 mb-1">Jelszó</label>
              <input
                id="auth-password-reg"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Legalább 6 karakter"
                autoComplete="new-password"
                className={inputCx(!!errors.password)}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="auth-postal" className="block text-sm font-medium text-gray-700 mb-1">Irányítószám</label>
              <input
                id="auth-postal"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                autoComplete="postal-code"
                className={inputCx(!!errors.postalCode)}
              />
              {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
            </div>
            <div>
              <label htmlFor="auth-city" className="block text-sm font-medium text-gray-700 mb-1">Település</label>
              <input
                id="auth-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                className={inputCx(!!errors.city)}
              />
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="auth-street" className="block text-sm font-medium text-gray-700 mb-1">Utca, házszám</label>
              <input
                id="auth-street"
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                autoComplete="street-address"
                className={inputCx(!!errors.streetAddress)}
              />
              {errors.streetAddress && <p className="mt-1 text-xs text-red-600">{errors.streetAddress}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Folyamatban..." : "Regisztráció"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
