"use client";

import Link from "next/link";
import { type CSSProperties, useEffect } from "react";
import { useSiteContact } from "@/components/layout/SiteContext";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { readConsent } from "@/lib/consent";
import { BOOKING_POLICY_URL } from "@/lib/consent-text";

const FALLBACK_ADDRESS = "2500 Esztergom, Martsa Alajos utca 6/c.";
const MAPS_URL =
  "https://www.google.com/maps/place/47%C2%B048'02.9%22N+18%C2%B044'44.4%22E/@47.8007963,18.7430918,17z/data=!3m1!4b1!4m4!3m3!8m2!3d47.8007927!4d18.7456667?entry=ttu&g_ep=EgoyMDI1MDkyOC4wIKXMDSoASAFQAw%3D%3D";

export function buildGoogleCalendarUrl(
  title: string,
  rawDate: string,
  startTime: string,
  durationMinutes: number,
  description: string,
  location: string = FALLBACK_ADDRESS,
): string {
  const [hStr, mStr] = startTime.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const totalEnd = h * 60 + m + durationMinutes;
  const endH = String(Math.floor(totalEnd / 60) % 24).padStart(2, "0");
  const endM = String(totalEnd % 60).padStart(2, "0");
  const dateCompact = rawDate.replace(/-/g, "");
  const startStr = `${dateCompact}T${startTime.replace(":", "")}00`;
  const endStr = `${dateCompact}T${endH}${endM}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStr}/${endStr}`,
    ctz: "Europe/Budapest",
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const CAL_PLUS =
  "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v4M10 16h4";
const PIN = "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";

export interface BookingSuccessPanelProps {
  serviceName: string;
  /** Pre-formatted Hungarian date. */
  date: string;
  /** YYYY-MM-DD (for the calendar link). */
  rawDate: string;
  /** "09:20" */
  time: string;
  durationMinutes: number;
  reservationNumber: string;
  patientName: string;
  patientEmail: string;
  /** Paid via Stripe (the /foglalas/sikeres page). */
  paid?: boolean;
  /** Booked without the booking fee (allowlisted account): no fee, no refund wording. */
  waived?: boolean;
  /** In-wizard restart; without it the link opens a fresh wizard. */
  onNewBooking?: () => void;
}

/** Success screen (Idopontfoglalas "Sikeres foglalás!"): no side effects, see BookingSuccess. */
export function BookingSuccessPanel({
  serviceName,
  date,
  rawDate,
  time,
  durationMinutes,
  reservationNumber,
  patientName,
  patientEmail,
  paid = false,
  waived = false,
  onNewBooking,
}: BookingSuccessPanelProps) {
  const contact = useSiteContact();
  const address = contact?.address || FALLBACK_ADDRESS;
  const calendarUrl =
    rawDate && time
      ? buildGoogleCalendarUrl(
          `${serviceName} — Mórocz Medical`,
          rawDate,
          time,
          durationMinutes,
          `Foglalási szám: ${reservationNumber}\nHelyszín: ${address}\nTelefon: ${contact?.phone || "+36 70 639 5239"}`,
          address,
        )
      : null;

  const rows = [
    { k: "Foglalási szám", v: reservationNumber },
    { k: "Szolgáltatás", v: serviceName },
    { k: "Dátum", v: date },
    { k: "Időpont", v: time },
    { k: "Foglalási díj", v: waived ? "Díjmentes" : "" },
  ].filter((r) => r.v);

  const newBookingClass =
    "link-grow self-start border-0 bg-transparent px-0 py-1 text-sm font-bold text-teal-ink";

  return (
    <div className="fade-up flex flex-wrap items-start gap-10 rounded-panel bg-white p-6 sm:rounded-hero sm:p-[clamp(24px,4vw,56px)]">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[22px]">
        <span className="pop-in-slow inline-flex h-[84px] w-[84px] items-center justify-center rounded-full bg-mint text-navy shadow-[0_0_0_12px_var(--color-mint-pale)]">
          <Icon d="M20 6 9 17l-5-5" size={40} />
        </span>
        {/* biome-ignore lint/a11y/useSemanticElements: <output> cannot hold a heading; the heading itself is the status message */}
        <h2
          role="status"
          className="m-0 text-[36px] leading-[1.05] font-extrabold tracking-[-0.03em] text-navy sm:text-[clamp(36px,4vw,48px)]"
        >
          Sikeres foglalás!
        </h2>
        <div className="flex flex-col gap-3 text-base leading-relaxed text-muted">
          <p className="m-0">
            Kedves <strong className="text-navy">{patientName}</strong>, időpontja sikeresen
            rögzítésre került.
            {paid && " A foglalási díj (10 000 Ft) befizetése megtörtént."}
            {waived && " A foglalás díjmentes, foglalási díjat nem kell fizetnie."}
          </p>
          <p className="m-0">
            Visszaigazoló e-mailt küldtünk a(z){" "}
            <strong className="break-all text-navy">{patientEmail}</strong> címre. A Google ezt
            általában a <strong className="text-navy">Promóciók</strong> kategóriába helyezi —
            kérjük, ott is nézze meg. A lemondással kapcsolatos információkat is ebben az e-mailben
            találja.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {calendarUrl && (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={pillClassName({
                variant: "outline",
                className: "border-navy max-sm:w-full",
              })}
            >
              <Icon d={CAL_PLUS} />
              Mentés Google Naptárba
            </a>
          )}
          <Link href="/" className={pillClassName({ variant: "navy", className: "max-sm:w-full" })}>
            Vissza a főoldalra
            <ArrowIcon />
          </Link>
        </div>
        {onNewBooking ? (
          <button type="button" onClick={onNewBooking} className={newBookingClass}>
            Új foglalás indítása
          </button>
        ) : (
          <Link href="/idopontfoglalas" className={newBookingClass}>
            Új foglalás indítása
          </Link>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
        <dl className="m-0 rounded-panel bg-canvas px-6 py-2.5">
          {rows.map((r, i) => (
            <div
              key={r.k}
              className="fade-up flex items-center justify-between gap-4 border-b border-[#dfe3ec] py-4 last:border-b-0"
              style={{ "--i": 2 + i } as CSSProperties}
            >
              <dt className="text-[13px] font-bold tracking-[.06em] text-muted uppercase">{r.k}</dt>
              <dd className="m-0 text-right text-base font-extrabold text-navy first-letter:uppercase">
                {r.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2.5 rounded-tile bg-mint-pale px-[22px] py-[18px] text-sm leading-relaxed text-muted-strong">
          <strong className="text-[15px] text-navy">Tudnivalók a látogatással kapcsolatban</strong>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            <li className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-ink"
              />
              Kérjük, érkezzen 5 perccel a megadott időpont előtt.
            </li>
            <li className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-ink"
              />
              Hozza magával a TAJ kártyáját és a személyi igazolványát.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 shrink-0 text-teal-ink">
                <Icon d={PIN} size={15} />
              </span>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="link-grow font-bold text-navy"
              >
                {address}
              </a>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-1.5 rounded-tile bg-sun-soft px-[22px] py-[18px] text-sm leading-relaxed text-muted-strong">
          <strong className="text-[15px] text-navy">Időpontfoglalás lemondása</strong>
          <span>
            A foglalt időpontot bármikor lemondhatja a visszaigazoló e-mailben található linkre
            kattintva.
            {!waived && (
              <>
                {" "}
                Legalább 48 órával az időpont előtt lemondva a 10 000 Ft foglalási díjat
                visszatérítjük; a 48 órán belüli lemondás esetén a foglalási díj nem kerül
                visszatérítésre.
              </>
            )}{" "}
            <Link href={BOOKING_POLICY_URL} className="link-grow font-bold text-navy">
              Foglalási és Lemondási Szabályzat
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

interface SuccessProps extends Omit<BookingSuccessPanelProps, "paid" | "onNewBooking"> {
  onNewBooking: () => void;
}

export function BookingSuccess(props: SuccessProps) {
  const { reservationNumber, patientEmail, waived = false } = props;

  // Signal a completed booking to GTM (Google Ads conversion fires on this event).
  // Guarded per reservation so a remount / StrictMode double-render can't double-count.
  // A fee-waived booking (allowlisted account, typically staff/testing) is not an ad
  // conversion, so it is not reported.
  useEffect(() => {
    if (!reservationNumber || waived) return;
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
  }, [reservationNumber, patientEmail, waived]);

  return <BookingSuccessPanel {...props} />;
}
