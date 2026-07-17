"use client";

import Link from "next/link";
import { useEffect } from "react";
import { readConsent } from "@/lib/consent";

interface Props {
  reservationNumber: string;
  patientName: string;
  patientEmail: string;
  slotDate: string;
  slotTime: string;
  serviceName: string;
}

function formatDateHungarian(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function PaymentSuccessClient({
  reservationNumber,
  patientName,
  patientEmail,
  slotDate,
  slotTime,
  serviceName,
}: Props) {
  const formattedDate = formatDateHungarian(slotDate);

  // Verified paid booking → signal to GTM (Google Ads conversion fires on this event).
  // This page only renders after Stripe confirms payment, so it's the true conversion.
  // Guarded per reservation so a refresh / StrictMode re-render can't double-count.
  useEffect(() => {
    if (!reservationNumber) return;
    const key = `conv_foglalas_${reservationNumber}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    // Enhanced Conversions: hand the booking email to the Google tag BEFORE the conversion
    // fires — gtag hashes it (SHA-256) client-side and Consent Mode still gates whether it is
    // sent. Only with marketing consent. This GTM/tag version exposes no user-data toggle, so
    // the gtag layer is how EC data reaches the GTM-fired Google Ads conversion.
    if (readConsent()?.marketing && patientEmail) {
      window.gtag?.("set", "user_data", { email: patientEmail.trim().toLowerCase() });
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "foglalas_sikeres", reservation_number: reservationNumber });
  }, [reservationNumber, patientEmail]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#99CEB7]/20 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#99CEB7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Sikeres foglalás!</h2>
        <p className="text-gray-600 mb-6">
          Kedves <span className="font-semibold text-[var(--color-primary)]">{patientName}</span>,
          időpontja sikeresen rögzítésre került. A foglalási díj (10 000 Ft) befizetése megtörtént.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 text-left max-w-sm mx-auto space-y-3 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Foglalási szám:</span>
            <span className="text-sm font-bold tracking-wider text-[var(--color-primary)]">
              {reservationNumber}
            </span>
          </div>
          {serviceName && (
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Szolgáltatás:</span>
              <span className="text-sm font-semibold text-[var(--color-primary)]">{serviceName}</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Dátum:</span>
            <span className="text-sm font-medium text-gray-800 capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Időpont:</span>
            <span className="text-sm font-semibold text-[var(--color-primary)]">{slotTime}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-left mb-6">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 mt-0.5 shrink-0"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <div>
              <p className="text-sm text-gray-700">
                Visszaigazoló e-mailt küldtünk a(z){" "}
                <span className="font-medium text-gray-900">{patientEmail}</span> címre.
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                A Google ezt általában a{" "}
                <span className="font-medium text-gray-600">Promóciók</span> kategóriába helyezi —
                kérjük, ott is nézze meg.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-accent)]/10 rounded-2xl p-5 text-left mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">
            Tudnivalók a látogatással kapcsolatban
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#99CEB7] shrink-0" aria-hidden="true" />
              Kérjük, érkezzen 5 perccel a megadott időpont előtt.
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#99CEB7] shrink-0" aria-hidden="true" />
              Hozza magával a TAJ kártyáját és a személyi igazolványát.
            </li>
            <li className="flex items-start gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#99CEB7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 w-3.5 h-3.5 shrink-0"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-gray-700">2500 Esztergom, Martsa Alajos utca 6/c.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Vissza a főoldalra
          </Link>
          <Link
            href="/idopontfoglalas"
            className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--color-primary)]/90 shadow-md hover:shadow-lg transition-all duration-200 text-center"
          >
            Új időpont foglalása
          </Link>
        </div>
      </div>
    </div>
  );
}
