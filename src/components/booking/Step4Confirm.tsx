"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { Collapse } from "@/components/ui/Accordion";
import { TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { pillClassName } from "@/components/ui/PillButton";
import { CheckboxPill, CheckboxRow } from "@/components/ui/PillCheckbox";
import { signOut, useSession } from "@/lib/auth-client";
import {
  BOOKING_POLICY_LABEL,
  BOOKING_POLICY_LINK_TEXT,
  BOOKING_POLICY_URL,
  CONSENT_LABEL,
  CONSENT_LINK_TEXT,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_LINK_TEXT,
  TERMS_OF_SERVICE_URL,
} from "@/lib/consent-text";
import { isValidHungarianTaxNumber } from "@/lib/szamlazz/tax-number";
import { BackArrowIcon, StepCard } from "./StepCard";

interface Step4Props {
  selections: {
    serviceId: string;
    serviceName: string;
    serviceDuration: number;
    selectedDate: string;
    selectedTime: string;
    slotLockId?: string | null;
  };
  onBack: () => void;
  onSuccess: (
    bookingId: string,
    reservationNumber: string,
    patientName: string,
    patientEmail: string,
  ) => void;
  onConflict: (alternatives: string[]) => void;
}

const BookingFormSchema = z.object({
  patientName: z.string().min(2, "A név megadása kötelező."),
  patientEmail: z.string().email("Érvénytelen e-mail cím."),
  patientPhone: z.string().min(7, "Kérjük, adja meg telefonszámát."),
});

type BookingFormData = z.infer<typeof BookingFormSchema>;
type FormErrors = Partial<Record<keyof BookingFormData, string>>;

// onSuccess is kept in the props for the in-wizard success screen; payment now always
// redirects to Stripe Checkout, so it is not called here.
export function Step4Confirm({
  selections,
  onBack,
  onSuccess: _onSuccess,
  onConflict,
}: Step4Props) {
  const { data: session } = useSession();

  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: prefill once per session change only
  useEffect(() => {
    if (session?.user?.name && !patientName) setPatientName(session.user.name);
    if (session?.user?.email && !patientEmail) setPatientEmail(session.user.email);

    // Fetch fresh user data from API to get phone_number from database
    if (session?.user?.id && !patientPhone) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((user) => {
          if (user.phone_number) {
            setPatientPhone(user.phone_number);
          }
        })
        .catch((err) => console.error("Failed to fetch user profile:", err));
    }
  }, [session]);

  const [patientPhone, setPatientPhone] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [policyChecked, setPolicyChecked] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [businessErrors, setBusinessErrors] = useState<{ taxNumber?: string; company?: string }>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [wantsBusinessInvoice, setWantsBusinessInvoice] = useState(false);
  const [taxNumber, setTaxNumber] = useState("");
  const [companySameAsPersonal, setCompanySameAsPersonal] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [companyZip, setCompanyZip] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  function validate(): boolean {
    const result = BookingFormSchema.safeParse({ patientName, patientEmail, patientPhone });
    if (result.success) {
      setErrors({});
      return true;
    }
    const newErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof BookingFormData;
      if (field && !newErrors[field]) {
        newErrors[field] = issue.message;
      }
    }
    setErrors(newErrors);
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    // Check if phone is required but empty (Google Sign-Up users)
    if (!patientPhone || patientPhone.length < 7) {
      // phoneNumber is stored separately
      // Google Sign-Up user without phone - show modal
      setShowPhoneModal(true);
      return;
    }

    if (!validate()) return;

    if (wantsBusinessInvoice) {
      const be: { taxNumber?: string; company?: string } = {};
      if (!isValidHungarianTaxNumber(taxNumber)) {
        be.taxNumber = "Érvénytelen adószám. A helyes formátum: 12345678-1-23.";
      }
      if (
        !companySameAsPersonal &&
        (!companyName.trim() || !companyZip.trim() || !companyCity.trim() || !companyAddress.trim())
      ) {
        be.company = "Kérjük, töltse ki a cégnevet és a teljes címet.";
      }
      if (be.taxNumber || be.company) {
        setBusinessErrors(be);
        return;
      }
    }
    setBusinessErrors({});

    // Both gates are evaluated before returning, so a patient who missed both
    // checkboxes sees both errors at once instead of one per submit attempt.
    setConsentError(consentChecked ? null : "Az adatkezelési hozzájárulás elfogadása kötelező.");
    setPolicyError(
      policyChecked
        ? null
        : "A Foglalási és Lemondási Szabályzat elfogadása kötelező a foglaláshoz.",
    );
    if (!consentChecked || !policyChecked) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selections.serviceId,
          slotDate: selections.selectedDate,
          slotTime: selections.selectedTime,
          patientName,
          patientEmail,
          patientPhone,
          ...(selections.slotLockId && { slotLockId: selections.slotLockId }),
          ...(wantsBusinessInvoice && {
            businessInvoice: {
              taxNumber,
              sameAsPersonal: companySameAsPersonal,
              ...(!companySameAsPersonal && {
                companyName,
                companyZip,
                companyCity,
                companyAddress,
              }),
            },
          }),
        }),
      });

      const data = (await res.json()) as {
        checkoutUrl?: string;
        bookingId?: string;
        reservationNumber?: string;
        error?: string;
        alternatives?: string[];
      };

      if (res.status === 201 && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (res.status === 409 && data.alternatives) {
        onConflict(data.alternatives);
        return;
      }

      if (res.status === 401) {
        setGlobalError("A munkamenet lejárt. Kérjük, jelentkezzen be újra.");
        return;
      }

      setGlobalError(data.error ?? "Hiba történt. Kérjük, próbálja újra.");
    } catch {
      setGlobalError("Hálózati hiba történt. Kérjük, ellenőrizze az internetkapcsolatát.");
    } finally {
      setSubmitting(false);
    }
  }

  const linkClass = "link-grow font-bold text-navy";
  const policyErrorId = "confirm-policy-error";
  const consentErrorId = "confirm-consent-error";

  return (
    <StepCard className="gap-[22px]">
      {/* Phone dialog for Google Sign-Up users */}
      <Modal
        open={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        title="Telefonszám megadása"
        description="Az időpontfoglalás véglegesítéséhez szükséges a telefonszáma."
        size="sm"
        variant="sheet"
      >
        <div className="flex flex-col gap-5">
          <TextField
            id="confirm-phone-modal"
            type="tel"
            label="Telefonszám"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="+36 70 000 0000"
            autoComplete="tel"
            error={
              patientPhone.length < 10 && patientPhone.length > 0
                ? "Legalább 10 szám szükséges"
                : undefined
            }
          />
          <div className="flex flex-wrap-reverse gap-3">
            <button
              type="button"
              onClick={() => setShowPhoneModal(false)}
              className={pillClassName({ variant: "outline", className: "flex-1" })}
            >
              Mégsem
            </button>
            <button
              type="button"
              onClick={async () => {
                if (patientPhone.length >= 10) {
                  // Save phone to user profile
                  try {
                    await fetch("/api/user/phone", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ phoneNumber: patientPhone }),
                    });
                  } catch (err) {
                    console.error("Failed to save phone number:", err);
                    // Non-critical — continue anyway
                  }
                  setShowPhoneModal(false);
                }
              }}
              className={pillClassName({ variant: "navy", className: "flex-1" })}
            >
              Folytatás
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-navy sm:text-[28px]">
          Megerősítés
        </h2>
        <p className="m-0 text-[15px] leading-relaxed text-muted sm:text-base">
          Ellenőrizze adatait, majd a foglalási díj megfizetésével véglegesítse az időpontot.
        </p>
      </div>

      {/* Global error */}
      {globalError && (
        <Notice tone="error" role="alert">
          <span>{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="link-grow self-start py-0.5 text-[13px] font-bold text-navy"
          >
            Bezárás
          </button>
        </Notice>
      )}

      {/* Patient details form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[22px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="confirm-name"
            label="Teljes név"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Kovács János"
            autoComplete="name"
            error={errors.patientName}
            className="col-span-full"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <TextField
              id="confirm-email"
              type="email"
              label="E-mail cím"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="pelda@email.hu"
              autoComplete="email"
              error={errors.patientEmail}
            />
            <p className="m-0 pl-[22px] text-[13px] text-muted">
              Ez nem a te email címed?{" "}
              <button
                type="button"
                onClick={async () => {
                  sessionStorage.clear();
                  await signOut();
                  window.location.reload();
                }}
                className="link-grow border-0 bg-transparent p-0 font-bold text-navy"
              >
                Jelentkezz be a fiókoddal
              </button>
            </p>
          </div>
          <TextField
            id="confirm-phone"
            type="tel"
            label="Telefonszám"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="+36 70 000 0000"
            autoComplete="tel"
            error={errors.patientPhone}
          />
        </div>

        {/* Business invoice opt-in */}
        <div className="flex flex-col gap-0">
          <CheckboxPill
            checked={wantsBusinessInvoice}
            onChange={setWantsBusinessInvoice}
            controls="confirm-company-panel"
          >
            Céges számlát kérek
          </CheckboxPill>
          <Collapse id="confirm-company-panel" open={wantsBusinessInvoice}>
            <div className="mt-4 flex flex-col gap-3.5 rounded-tile bg-field p-4 sm:p-5">
              <TextField
                id="tax-number"
                label="Adószám"
                inputMode="numeric"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="12345678-1-23"
                tone="white"
                error={businessErrors.taxNumber}
              />

              <CheckboxRow
                id="company-same"
                size="sm"
                checked={companySameAsPersonal}
                onChange={setCompanySameAsPersonal}
              >
                A céges adatok megegyeznek a személyes adatokkal (pl. EV)
              </CheckboxRow>

              <Collapse open={!companySameAsPersonal}>
                <div className="grid grid-cols-6 gap-3.5 pt-1">
                  <TextField
                    id="company-name"
                    label="Cégnév"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Cégnév"
                    autoComplete="organization"
                    tone="white"
                    className="col-span-6"
                  />
                  <TextField
                    id="company-zip"
                    label="Irányítószám"
                    inputMode="numeric"
                    value={companyZip}
                    onChange={(e) => setCompanyZip(e.target.value)}
                    placeholder="Irsz."
                    autoComplete="postal-code"
                    tone="white"
                    className="col-span-6 sm:col-span-2"
                  />
                  <TextField
                    id="company-city"
                    label="Település"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="Település"
                    autoComplete="address-level2"
                    tone="white"
                    className="col-span-6 sm:col-span-4"
                  />
                  <TextField
                    id="company-address"
                    label="Cím (utca, házszám)"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Cím (utca, házszám)"
                    autoComplete="street-address"
                    tone="white"
                    className="col-span-6"
                  />
                  {businessErrors.company && (
                    <span
                      role="alert"
                      className="col-span-6 pl-[22px] text-[13px] font-bold text-danger"
                    >
                      {businessErrors.company}
                    </span>
                  )}
                </div>
              </Collapse>

              <p className="m-0 px-1 text-[13px] leading-relaxed text-muted">
                A számla hibás adószám esetén nem állítható ki. A részletes ellenőrzést a fizetés
                indításakor végezzük.
              </p>
            </div>
          </Collapse>
        </div>

        {/* Consents */}
        <div className="flex flex-col gap-3 border-t border-line-soft pt-5">
          <CheckboxRow
            id="confirm-consent"
            required
            checked={consentChecked}
            invalid={!!consentError}
            errorId={consentErrorId}
            onChange={(next) => {
              setConsentChecked(next);
              if (next) setConsentError(null);
            }}
          >
            {CONSENT_LABEL} —{" "}
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {CONSENT_LINK_TEXT}
            </a>
          </CheckboxRow>

          {/* Booking & cancellation policy */}
          <CheckboxRow
            id="confirm-policy"
            required
            checked={policyChecked}
            invalid={!!policyError}
            errorId={policyErrorId}
            onChange={(next) => {
              setPolicyChecked(next);
              if (next) setPolicyError(null);
            }}
          >
            {BOOKING_POLICY_LABEL}{" "}
            <a
              href={BOOKING_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {BOOKING_POLICY_LINK_TEXT}
            </a>{" "}
            és a{" "}
            <a
              href={TERMS_OF_SERVICE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {TERMS_OF_SERVICE_LINK_TEXT}
            </a>
            . Tudomásul veszem, hogy a 10.000 Ft foglalási díj a foglalt időpontot megelőző 48 órán
            belüli lemondás vagy meg nem jelenés esetén nem jár vissza.
          </CheckboxRow>

          {(consentError || policyError) && (
            <div
              role="alert"
              className="fade-up flex flex-col gap-1 rounded-3xl bg-coral-soft px-5 py-3.5 text-sm font-bold text-danger-ink"
            >
              {consentError && <span id={consentErrorId}>{consentError}</span>}
              {policyError && <span id={policyErrorId}>{policyError}</span>}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-wrap-reverse items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className={pillClassName({
              variant: "outline",
              className: "h-14 px-6 max-sm:w-full",
            })}
          >
            <BackArrowIcon />
            Vissza
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={pillClassName({
              variant: "navy",
              size: "lg",
              className: "h-[60px] px-8 max-sm:w-full max-sm:px-5",
            })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {submitting ? "Átirányítás a fizetéshez..." : "Foglalás és fizetés (10 000 Ft)"}
          </button>
        </div>
      </form>
    </StepCard>
  );
}
