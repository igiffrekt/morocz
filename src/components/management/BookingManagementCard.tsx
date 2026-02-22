"use client";

import { useState } from "react";
import type { ScheduleForAvailability } from "@/lib/slots";
import { CancelDialog } from "./CancelDialog";

interface BookingManagementCardProps {
  booking: {
    _id: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reservationNumber: string;
    service: { name: string; appointmentDuration: number } | null;
    slotDate: string;
    slotTime: string;
    status: string;
    managementToken: string;
  };
  scheduleData: {
    schedule: ScheduleForAvailability;
    blockedDates: string[];
  };
}

function isWithin24Hours(slotDate: string, slotTime: string): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - Date.now()) / (1000 * 60 * 60) < 24;
}

type CardState = "idle" | "cancel-confirm" | "cancelled";

export function BookingManagementCard({ booking, scheduleData }: BookingManagementCardProps) {
  // scheduleData will be used by Plan 03 reschedule flow
  void scheduleData;
  const [cardState, setCardState] = useState<CardState>("idle");

  const within24h = isWithin24Hours(booking.slotDate, booking.slotTime);

  const formattedDate = new Date(booking.slotDate).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  if (cardState === "cancelled") {
    return (
      <div className="rounded-xl bg-white p-8 shadow-md">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#99CEB7]">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#23264F]">Időpont sikeresen lemondva</h2>
        </div>
        <p className="mb-6 text-gray-600">
          Megkaptuk a lemondási kérelmét. Hamarosan visszaigazoló e-mailt küldünk.
        </p>
        <a
          href="/idopontfoglalas"
          className="inline-block rounded-lg bg-[#99CEB7] px-6 py-3 text-sm font-semibold text-[#23264F] transition hover:bg-[#80bea6]"
        >
          Új időpont foglalása
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-md">
      <h2 className="mb-6 text-xl font-bold text-[#23264F]">Az Ön időpontja</h2>

      {/* Appointment details */}
      <div className="mb-6 rounded-lg border-l-4 border-[#99CEB7] bg-gray-50 p-5">
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            Szolgáltatás
          </p>
          <p className="text-base font-semibold text-[#23264F]">
            {booking.service?.name ?? "Foglalt szolgáltatás"}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Időpont</p>
          <p className="text-base font-semibold text-[#23264F]">
            {formattedDate}, {booking.slotTime}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Páciens</p>
          <p className="text-base font-semibold text-[#23264F]">{booking.patientName}</p>
        </div>

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
            Foglalási szám
          </p>
          <p className="font-mono text-base font-semibold text-[#23264F]">
            {booking.reservationNumber}
          </p>
        </div>
      </div>

      {/* 24h warning or action buttons */}
      {within24h ? (
        <div className="rounded-lg bg-[#F4DCD6] p-4 text-sm text-[#23264F]">
          <p className="font-semibold">Az időpont már nem módosítható (24 órán belüli foglalás).</p>
          <p className="mt-1">
            Kérjük, hívjon minket:{" "}
            <a
              href="tel:+3610000000"
              className="font-bold underline hover:no-underline"
            >
              +36 1 000 0000
            </a>
          </p>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setCardState("cancel-confirm")}
            className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Lemondás
          </button>
          {/* Plan 03 will activate the reschedule flow */}
          <button
            disabled
            title="Hamarosan elérhető"
            className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-400"
          >
            Átütemezés
          </button>
        </div>
      )}

      {/* Cancel confirmation inline panel */}
      {cardState === "cancel-confirm" && (
        <CancelDialog
          booking={booking}
          onCancelled={() => setCardState("cancelled")}
          onClose={() => setCardState("idle")}
        />
      )}
    </div>
  );
}
