"use client";

import Link from "next/link";

interface SuccessProps {
  serviceName: string;
  date: string; // Pre-formatted Hungarian date
  time: string; // "09:20"
  patientName: string;
  patientEmail: string;
  onNewBooking: () => void;
}

export function BookingSuccess({
  serviceName,
  date,
  time,
  patientName,
  patientEmail,
  onNewBooking,
}: SuccessProps) {
  return (
    <div className="py-6 text-center">
      {/* Green checkmark icon */}
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

      {/* Heading */}
      <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Sikeres foglalás!</h2>
      <p className="text-gray-600 mb-6">
        Kedves <span className="font-semibold text-[var(--color-primary)]">{patientName}</span>,
        időpontja sikeresen rögzítésre került.
      </p>

      {/* Booking summary card */}
      <div className="bg-gray-50 rounded-2xl p-5 text-left max-w-sm mx-auto space-y-3 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Szolgáltatás:</span>
          <span className="text-sm font-semibold text-[var(--color-primary)]">{serviceName}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Dátum:</span>
          <span className="text-sm font-medium text-gray-800 capitalize">{date}</span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Időpont:</span>
          <span className="text-sm font-semibold text-[var(--color-primary)]">{time}</span>
        </div>
      </div>

      {/* Email confirmation note with inbox tip */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-left max-w-sm mx-auto mb-4">
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
              A Google ezt általában a <span className="font-medium text-gray-600">Promóciók</span>{" "}
              kategóriába helyezi — kérjük, ott is nézze meg. A lemondással kapcsolatos
              információkat is ebben az e-mailben találja.
            </p>
          </div>
        </div>
      </div>

      {/* Visit info */}
      <div className="bg-[var(--color-accent)]/10 rounded-2xl p-5 text-left max-w-sm mx-auto mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">
          Tudnivalók a látogatással kapcsolatban
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-gray-700">
            <span
              className="mt-1 w-1.5 h-1.5 rounded-full bg-[#99CEB7] shrink-0"
              aria-hidden="true"
            />
            Kérjük, érkezzen 5 perccel a megadott időpont előtt.
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-700">
            <span
              className="mt-1 w-1.5 h-1.5 rounded-full bg-[#99CEB7] shrink-0"
              aria-hidden="true"
            />
            Hozza magával a TAJ kártyáját és a személyi igazolványát.
          </li>
        </ul>
      </div>

      {/* Cancellation policy */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-left max-w-sm mx-auto mb-8">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 mt-0.5 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 mb-1.5">
              Időpontfoglalás lemondása
            </h3>
            <p className="text-sm text-gray-700">
              Lemondani a foglalt időpontot maximum <span className="font-medium">24 órával</span> a
              rendelés előtt lehetséges a visszaigazoló e-mailben található linkre kattintva.
            </p>
            <p className="text-xs text-amber-700 mt-2 font-medium">
              A 24 órán belüli lemondásért készenléti díjat számolunk fel: 10.000 Ft / alkalom.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-center"
        >
          Vissza a főoldalra
        </Link>
        <button
          type="button"
          onClick={onNewBooking}
          className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--color-primary)]/90 shadow-md hover:shadow-lg transition-all duration-200"
        >
          Új időpont foglalása
        </button>
      </div>
    </div>
  );
}
