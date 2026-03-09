"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useSession } from "@/lib/auth-client";
import { CONSENT_LABEL, PRIVACY_POLICY_URL, CONSENT_LINK_TEXT } from "@/lib/consent-text";

interface Step4Props {
  selections: {
    serviceId: string;
    serviceName: string;
    serviceDuration: number;
    selectedDate: string;
    selectedTime: string;
  };
  onBack: () => void;
  onSuccess: (bookingId: string, reservationNumber: string, patientName: string, patientEmail: string) => void;
  onConflict: (alternatives: string[]) => void;
}

const BookingFormSchema = z.object({
  patientName: z.string().min(2, "A név megadása kötelező."),
  patientEmail: z.string().email("Érvénytelen e-mail cím."),
  patientPhone: z.string().min(7, "Kérjük, adja meg telefonszámát."),
});

type BookingFormData = z.infer<typeof BookingFormSchema>;
type FormErrors = Partial<Record<keyof BookingFormData, string>>;

function formatDateHungarian(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function Step4Confirm({ selections, onBack, onSuccess, onConflict }: Step4Props) {
  const { data: session } = useSession();

  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (session?.user?.name && !patientName) setPatientName(session.user.name);
    if (session?.user?.email && !patientEmail) setPatientEmail(session.user.email);
    // Pre-fill phone from user profile if available (e.g., from registration)
    if (session?.user?.phoneNumber && !patientPhone) setPatientPhone(session.user.phoneNumber);
  }, [session]);
  
  const [patientPhone, setPatientPhone] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const formattedDate = formatDateHungarian(selections.selectedDate);

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
      if (!session?.user?.phoneNumber) {
        // Google Sign-Up user without phone - show modal
        setShowPhoneModal(true);
        return;
      }
    }

    if (!validate()) return;

    if (!consentChecked) {
      setConsentError("Az adatkezelési hozzájárulás elfogadása kötelező.");
      return;
    }
    setConsentError(null);

    setSubmitting(true);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selections.serviceId,
          slotDate: selections.selectedDate,
          slotTime: selections.selectedTime,
          patientName,
          patientEmail,
          patientPhone,
        }),
      });

      const data = (await res.json()) as {
        bookingId?: string;
        reservationNumber?: string;
        error?: string;
        alternatives?: string[];
      };

      if (res.status === 201 && data.bookingId) {
        onSuccess(data.bookingId, data.reservationNumber ?? "", patientName, patientEmail);
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

  return (
    <div>
      {/* Phone Modal for Google Sign-Up users */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">Telefonszám megadása</h3>
            <p className="text-sm text-gray-600 mb-4">
              Az időpontfoglalás véglegesítéséhez szükséges a telefonszáma.
            </p>
            <div className="mb-4">
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+36 70 000 0000"
                autoComplete="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
              />
              {patientPhone.length < 10 && patientPhone.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Legalább 10 szám szükséges</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Folytatás
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Megerősítés</h2>

      {/* Booking summary card */}
      <div className="bg-[var(--color-accent)]/10 rounded-2xl p-4 mb-6 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Szolgáltatás:</span>
          <span className="text-sm font-semibold text-[var(--color-primary)]">
            {selections.serviceName}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Dátum:</span>
          <span className="text-sm font-medium text-gray-800 capitalize">{formattedDate}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Időpont:</span>
          <span className="text-sm font-semibold text-[var(--color-primary)]">
            {selections.selectedTime}
          </span>
        </div>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{globalError}</p>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="mt-1 text-xs text-red-700 underline hover:no-underline"
          >
            Bezárás
          </button>
        </div>
      )}

      {/* Patient details form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full name */}
        <div>
          <label htmlFor="confirm-name" className="block text-sm font-medium text-gray-700 mb-1">
            Teljes név
          </label>
          <input
            id="confirm-name"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Kovács János"
            autoComplete="name"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors ${
              errors.patientName ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.patientName && <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="confirm-email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail cím
          </label>
          <input
            id="confirm-email"
            type="email"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
            placeholder="pelda@email.hu"
            autoComplete="email"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors ${
              errors.patientEmail ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.patientEmail && (
            <p className="mt-1 text-xs text-red-600">{errors.patientEmail}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="confirm-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefonszám
          </label>
          <input
            id="confirm-phone"
            type="tel"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="+36 70 000 0000"
            autoComplete="tel"
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors ${
              errors.patientPhone ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.patientPhone && (
            <p className="mt-1 text-xs text-red-600">{errors.patientPhone}</p>
          )}
        </div>

        {/* Consent checkbox */}
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => {
                setConsentChecked(e.target.checked);
                if (e.target.checked) setConsentError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
            />
            <span className="text-xs text-gray-600">
              {CONSENT_LABEL} —{" "}
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] underline hover:no-underline"
              >
                {CONSENT_LINK_TEXT}
              </a>
            </span>
          </label>
          {consentError && <p className="mt-1 text-xs text-red-600">{consentError}</p>}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Vissza
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--color-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
          >
            {submitting ? "Foglalás folyamatban..." : "Időpont foglalása"}
          </button>
        </div>
      </form>
    </div>
  );
}
