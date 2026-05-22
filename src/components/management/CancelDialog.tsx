"use client";

import { useState } from "react";

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

export function CancelDialog({ booking, onCancelled, onClose }: CancelDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(booking.slotDate).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const hoursUntil =
    (new Date(`${booking.slotDate}T${booking.slotTime}:00`).getTime() - Date.now()) / 3600_000;
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
    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
      <h3 className="mb-2 text-lg font-semibold text-[#23264F]">
        Biztosan lemondja az alábbi időpontot?
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        Ez a művelet nem visszavonható. A lemondott időpont más páciensek számára elérhetővé válik.
      </p>

      {/* Appointment summary repeated for clarity */}
      <div className="mb-6 rounded-lg bg-white p-4 text-sm">
        <div className="mb-2">
          <span className="font-medium text-gray-500">Szolgáltatás:</span>{" "}
          <span className="font-semibold text-[#23264F]">
            {booking.service?.name ?? "Foglalt szolgáltatás"}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Időpont:</span>{" "}
          <span className="font-semibold text-[#23264F]">
            {formattedDate}, {booking.slotTime}
          </span>
        </div>
      </div>

      {willRefund && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          A 10.000 Ft foglalási díj a lemondás után visszatérítésre kerül.
        </div>
      )}
      {noRefund && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">
          Kedves Páciensünk! 48 órán belüli lemondás esetén a 10.000 Ft-os foglalási díj NEM kerül
          visszatérítésre. Amennyiben ennek tudatában is le kívánja mondani az időpontot, kérjük
          kattintson a gombra.
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Feldolgozás..." : "Igen, lemondás"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Mégsem
        </button>
      </div>
    </div>
  );
}
