"use client";

import Link from "next/link";

interface SuccessProps {
  serviceName: string;
  date: string;           // Pre-formatted Hungarian date
  rawDate: string;        // YYYY-MM-DD
  time: string;           // "09:20"
  durationMinutes: number;
  reservationNumber: string;
  patientName: string;
  patientEmail: string;
  onNewBooking: () => void;
}

function buildGoogleCalendarUrl(
  title: string,
  rawDate: string,
  startTime: string,
  durationMinutes: number,
  description: string,
): string {
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const totalEnd = h * 60 + m + durationMinutes;
  const endH = String(Math.floor(totalEnd / 60) % 24).padStart(2, "0");
  const endM = String(totalEnd % 60).padStart(2, "0");
  const dateCompact = rawDate.replace(/-/g, "");
  const startStr = `${dateCompact}T${startTime.replace(":", "")}00`;
  const endStr   = `${dateCompact}T${endH}${endM}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStr}/${endStr}`,
    ctz: "Europe/Budapest",
    details: description,
    location: "2500 Esztergom, Martsa Alajos utca 6/c.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function BookingSuccess({
  serviceName,
  date,
  rawDate,
  time,
  durationMinutes,
  reservationNumber,
  patientName,
  patientEmail,
  onNewBooking,
}: SuccessProps) {
  const calendarUrl = buildGoogleCalendarUrl(
    `${serviceName} — Mórocz Medical`,
    rawDate,
    time,
    durationMinutes,
    `Foglalási szám: ${reservationNumber}\nHelyszín: 2500 Esztergom, Martsa Alajos utca 6/c.\nTelefon: +36 70 639 5239`,
  );
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
          <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Foglalási szám:</span>
          <span className="text-sm font-bold tracking-wider text-[var(--color-primary)]">{reservationNumber}</span>
        </div>
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

      {/* Info cards — 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
        {/* Email confirmation note with inbox tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
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
        <div className="bg-[var(--color-accent)]/10 rounded-2xl p-5">
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
              <a
                href="https://www.google.com/maps/place/47%C2%B048'02.9%22N+18%C2%B044'44.4%22E/@47.8007963,18.7430918,17z/data=!3m1!4b1!4m4!3m3!8m2!3d47.8007927!4d18.7456667?entry=ttu&g_ep=EgoyMDI1MDkyOC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                2500 Esztergom, Martsa Alajos utca 6/c.
              </a>
            </li>
          </ul>
        </div>

        {/* Cancellation policy */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 md:col-span-2">
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
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-center"
        >
          Vissza a főoldalra
        </Link>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ backgroundColor: "#4285F4" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden="true">
            <path d="M19.5 3h-2.25V1.5h-1.5V3H8.25V1.5h-1.5V3H4.5A2.25 2.25 0 0 0 2.25 5.25v15A2.25 2.25 0 0 0 4.5 22.5h15a2.25 2.25 0 0 0 2.25-2.25v-15A2.25 2.25 0 0 0 19.5 3Zm.75 17.25a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V9h16.5v11.25ZM3.75 7.5V5.25A.75.75 0 0 1 4.5 4.5h1.25V6h1.5V4.5h7.5V6h1.5V4.5H17.25a.75.75 0 0 1 .75.75V7.5H3.75Z"/>
          </svg>
          Mentés Google Naptárba
        </a>
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
