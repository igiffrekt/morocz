"use client";

import Link from "next/link";
import { useState } from "react";
import { Notice } from "@/components/ui/Notice";
import { pillClassName } from "@/components/ui/PillButton";
import { formatLongDate } from "@/lib/booking-dates";
import { BOOKING_POLICY_URL } from "@/lib/consent-text";
import { hoursUntilBudapestSlot } from "@/lib/refund/slot-time";

interface CancelDialogProps {
  booking: {
    _id: string;
    patientName: string;
    service: { name: string; appointmentDuration: number } | null;
    slotDate: string;
    slotTime: string;
    managementToken: string;
    paymentStatus?: string | null;
  };
  onCancelled: () => void;
  onClose: () => void;
}

/**
 * In-page cancel confirmation (IdopontKezelese): appointment recap, the 48 h refund rule
 * and the refund / no-refund outcome for this booking. The server re-checks the rule.
 */
export function CancelDialog({ booking, onCancelled, onClose }: CancelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = formatLongDate(booking.slotDate);

  // Interpret the slot in Budapest time so this matches the server's resolveRefund
  // decision exactly, regardless of the browser's timezone.
  const hoursUntil = hoursUntilBudapestSlot(booking.slotDate, booking.slotTime, new Date());
  const isPaid = booking.paymentStatus === "paid";
  const willRefund = isPaid && hoursUntil >= 48;
  const noRefund = isPaid && hoursUntil < 48;

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/booking-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: booking.managementToken, confirmNoRefund: noRefund }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Hiba történt. Kérjük, próbálja újra.");
        setLoading(false);
        return;
      }

      onCancelled();
    } catch {
      setError("Hiba történt. Kérjük, ellenőrizze az internetkapcsolatát, majd próbálja újra.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[32px] bg-coral-soft p-5 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-navy">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6" />
          </svg>
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 text-xl font-extrabold text-navy">
            Biztosan lemondja az alábbi időpontot?
          </h3>
          <p className="m-0 text-[15px] leading-relaxed text-muted-strong">
            Ez a művelet nem visszavonható. A lemondott időpont más páciensek számára elérhetővé
            válik.
          </p>
        </div>
      </div>

      {/* Appointment summary repeated for clarity */}
      <div className="flex flex-wrap gap-x-7 gap-y-2 rounded-3xl bg-white px-5 py-3.5 text-[15px]">
        <span>
          <span className="font-semibold text-muted">Szolgáltatás:</span>{" "}
          <strong className="text-navy">{booking.service?.name ?? "Foglalt szolgáltatás"}</strong>
        </span>
        <span>
          <span className="font-semibold text-muted">Időpont:</span>{" "}
          <strong className="text-navy">
            {formattedDate}, {booking.slotTime}
          </strong>
        </span>
      </div>

      {isPaid && (
        <div className="flex flex-col gap-2 rounded-3xl bg-white/60 px-5 py-4 text-sm leading-relaxed text-muted-strong">
          <strong className="text-[13px] tracking-[.08em] text-navy uppercase">
            Foglalási és Lemondási Szabályzat
          </strong>
          <span>
            Ha a lemondás a foglalt időpontot megelőzően{" "}
            <strong className="text-navy">legalább 48 órával</strong> megtörténik, a teljes 10.000
            Ft foglalási díjat visszatérítjük.
          </span>
          <span>
            Ha a lemondás a foglalt időpontot megelőző{" "}
            <strong className="text-navy">48 órán belül</strong> történik, a foglalási díj nem kerül
            visszatérítésre.
          </span>
          <Link
            href={BOOKING_POLICY_URL}
            className="link-grow self-start py-0.5 font-bold text-navy"
          >
            A teljes szabályzat
          </Link>
        </div>
      )}

      {willRefund && (
        <Notice tone="success" shape="pill" role="status">
          A 10.000 Ft foglalási díj a lemondás után visszatérítésre kerül.
        </Notice>
      )}
      {noRefund && (
        <Notice tone="warning" role="alert" plain className="font-semibold">
          Kedves Páciensünk! 48 órán belüli lemondás esetén a 10.000 Ft-os foglalási díj NEM kerül
          visszatérítésre. Amennyiben ennek tudatában is le kívánja mondani az időpontot, kérjük
          kattintson a gombra.
        </Notice>
      )}

      {error && (
        <Notice tone="error" role="alert">
          {error}
        </Notice>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={pillClassName({
            variant: "navy",
            className: "bg-danger hover:bg-[#912018] max-sm:w-full",
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
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
          {loading ? "Feldolgozás..." : "Igen, lemondás"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={pillClassName({
            variant: "outline",
            className: "border-navy max-sm:w-full",
          })}
        >
          Mégsem
        </button>
      </div>
    </div>
  );
}
