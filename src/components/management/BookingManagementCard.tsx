"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useState } from "react";
import { buildGoogleCalendarUrl } from "@/components/booking/BookingSuccess";
import { useSiteContact } from "@/components/layout/SiteContext";
import { Collapse } from "@/components/ui/Accordion";
import { ArrowIcon, pillClassName } from "@/components/ui/PillButton";
import { formatLongDate } from "@/lib/booking-dates";
import { cn } from "@/lib/cn";
import { isFeeWaived } from "@/lib/payment-status";
import { hoursUntilBudapestSlot } from "@/lib/refund/slot-time";
import { telHref } from "@/lib/site-nav";
import type { ScheduleForAvailability } from "@/lib/slots";
import { CancelDialog } from "./CancelDialog";
import { ReschedulePanel } from "./ReschedulePanel";

interface BookingManagementCardProps {
  booking: {
    _id: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reservationNumber: string;
    service: { name: string; appointmentDuration: number } | null;
    serviceId: string;
    slotDate: string;
    slotTime: string;
    status: string;
    managementToken: string;
    paymentStatus?: string | null;
  };
  scheduleData: {
    schedule: ScheduleForAvailability;
    blockedDates: string[];
    bookingWindowDays: number;
  };
}

type CardState = "idle" | "cancel-confirm" | "cancelled" | "rescheduled";

const FALLBACK_PHONE = "+36 70 639 5239";

const ICON = {
  svc: "M22 12h-4l-3 9L9 3l-3 9H2",
  cal: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  hash: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  move: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM10 15l2 2 4-4",
  x: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  tick: "M20 6 9 17l-5-5",
  calPlus:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 14v4M10 16h4",
};

const TILE_TONES = ["bg-sage", "bg-lavender", "bg-sun-soft", "bg-blush-soft"];

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Visszaigazolt foglalás",
  rescheduled: "Átütemezett foglalás",
};

function Svg({
  d,
  size = 18,
  strokeWidth = 2,
}: {
  d: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** White result card with a popping round icon (cancelled / rescheduled). */
function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-up flex flex-col items-start gap-[18px] rounded-panel bg-white p-6 sm:rounded-[36px] sm:p-[clamp(24px,4vw,48px)]">
      {children}
    </div>
  );
}

export function BookingManagementCard({ booking, scheduleData }: BookingManagementCardProps) {
  const router = useRouter();
  const contact = useSiteContact();
  const phone = contact?.phone || FALLBACK_PHONE;
  const [cardState, setCardState] = useState<CardState>("idle");
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduledTo, setRescheduledTo] = useState<{ date: string; time: string } | null>(null);

  // Rescheduling is blocked within 24h; cancellation is always allowed (the cancel
  // dialog + server own the 48h refund-vs-no-refund decision).
  const within24h = hoursUntilBudapestSlot(booking.slotDate, booking.slotTime, new Date()) < 24;

  const serviceName = booking.service?.name ?? "Foglalt szolgáltatás";
  const when = `${formatLongDate(booking.slotDate)}, ${booking.slotTime}`;

  if (cardState === "cancelled") {
    return (
      <ResultCard>
        <span className="pop-in-slow inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-sage text-teal-ink">
          <Svg d={ICON.tick} size={34} strokeWidth={2.6} />
        </span>
        {/* biome-ignore lint/a11y/useSemanticElements: <output> cannot hold a heading; the heading itself is the status message */}
        <h2
          role="status"
          className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-navy sm:text-[34px]"
        >
          Időpont sikeresen lemondva
        </h2>
        <p className="m-0 max-w-[560px] text-base leading-relaxed text-muted">
          Megkaptuk a lemondási kérelmét. Hamarosan visszaigazoló e-mailt küldünk.
        </p>
        <div className="max-w-full rounded-tile bg-canvas px-[22px] py-3 text-[15px] text-muted line-through">
          {serviceName} · {when}
        </div>
        <div className="flex w-full flex-wrap gap-3">
          <Link
            href="/idopontfoglalas"
            className={pillClassName({
              variant: "mint",
              className: "bg-mint hover:bg-mint max-sm:w-full",
            })}
          >
            Új időpont foglalása
            <ArrowIcon />
          </Link>
          <Link
            href="/"
            className={pillClassName({ variant: "outline", className: "max-sm:w-full" })}
          >
            Vissza a főoldalra
          </Link>
        </div>
      </ResultCard>
    );
  }

  if (cardState === "rescheduled" && rescheduledTo) {
    const newWhen = `${formatLongDate(rescheduledTo.date)}, ${rescheduledTo.time}`;
    const calendarUrl = buildGoogleCalendarUrl(
      `${serviceName} — Mórocz Medical`,
      rescheduledTo.date,
      rescheduledTo.time,
      booking.service?.appointmentDuration ?? 20,
      `Foglalási szám: ${booking.reservationNumber}`,
      contact?.address || undefined,
    );

    return (
      <ResultCard>
        <span className="pop-in-slow inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-mint text-navy shadow-[0_0_0_10px_var(--color-mint-pale)]">
          <Svg d={ICON.tick} size={34} strokeWidth={2.6} />
        </span>
        {/* biome-ignore lint/a11y/useSemanticElements: <output> cannot hold a heading; the heading itself is the status message */}
        <h2
          role="status"
          className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-navy sm:text-[34px]"
        >
          Időpont sikeresen áthelyezve
        </h2>
        <div className="flex max-w-full flex-wrap items-center gap-2.5">
          <span className="rounded-tile bg-canvas px-5 py-3 text-sm text-muted line-through">
            {when}
          </span>
          <span aria-hidden="true" className="text-teal-ink">
            <ArrowIcon />
          </span>
          <span className="rounded-tile bg-navy px-[22px] py-3 text-[15px] font-extrabold text-white">
            <span className="font-bold text-mint-light">Új időpont:</span> {newWhen}
          </span>
        </div>
        <p className="m-0 text-base leading-relaxed text-muted">
          Visszaigazoló e-mailt küldtünk az új időpontról.
        </p>
        <div className="flex w-full flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.refresh()}
            className={pillClassName({ variant: "navy", className: "max-sm:w-full" })}
          >
            Foglalás megtekintése
            <ArrowIcon />
          </button>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={pillClassName({
              variant: "outline",
              className: "border-navy max-sm:w-full",
            })}
          >
            <Svg d={ICON.calPlus} />
            Mentés Google Naptárba
          </a>
        </div>
      </ResultCard>
    );
  }

  const cancelOpen = cardState === "cancel-confirm";
  const rescheduleOpen = showReschedule && cardState === "idle" && !within24h;
  const statusLabel = STATUS_LABEL[booking.status];
  const details = [
    { k: "Foglalt szolgáltatás", v: serviceName, icon: ICON.svc },
    { k: "Időpont", v: when, icon: ICON.cal },
    { k: "Páciens", v: booking.patientName, icon: ICON.user },
    { k: "Foglalási szám", v: booking.reservationNumber, icon: ICON.hash, mono: true },
  ];

  return (
    <div className="fade-up flex flex-col gap-6 rounded-panel bg-white p-4 sm:rounded-[36px] sm:p-[clamp(20px,3vw,36px)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-navy sm:text-[28px]">
          Az Ön időpontja
        </h2>
        {statusLabel && (
          <span className="inline-flex items-center gap-2 rounded-full bg-mint-pale px-4 py-2 text-[13px] font-extrabold whitespace-nowrap text-navy">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal-ink" />
            {statusLabel}
          </span>
        )}
      </div>

      <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {details.map((d, i) => (
          <div
            key={d.k}
            className={cn(
              "fade-up flex items-center gap-3.5 rounded-tile px-[18px] py-4",
              TILE_TONES[i],
            )}
            style={{ "--i": i } as CSSProperties}
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-teal-ink">
              <Svg d={d.icon} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-xs font-bold tracking-[.08em] text-muted uppercase">{d.k}</dt>
              <dd
                className={cn(
                  "m-0 text-[17px] leading-snug font-extrabold break-words text-navy first-letter:uppercase",
                  d.mono && "tracking-wider",
                )}
              >
                {d.v}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {/* Actions — cancellation is always available; rescheduling is blocked within 24h. */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          aria-expanded={rescheduleOpen}
          aria-controls="reschedule-panel"
          aria-disabled={within24h || undefined}
          aria-describedby={within24h ? "reschedule-lock" : undefined}
          onClick={() => {
            if (within24h) return;
            setShowReschedule((prev) => !prev);
            setCardState("idle");
          }}
          className={pillClassName({
            variant: rescheduleOpen ? "navy" : "outline",
            className: cn(
              "h-[54px] px-[26px] text-[15px] max-sm:w-full",
              !rescheduleOpen && "border-navy",
              within24h && "cursor-not-allowed opacity-[.42] hover:translate-y-0 hover:shadow-none",
            ),
          })}
        >
          <Svg d={ICON.move} />
          Időpont módosítása
        </button>
        <button
          type="button"
          aria-expanded={cancelOpen}
          aria-controls="cancel-panel"
          onClick={() => {
            setCardState(cancelOpen ? "idle" : "cancel-confirm");
            setShowReschedule(false);
          }}
          className={pillClassName({
            variant: "outline",
            className: cn(
              "h-[54px] px-[26px] text-[15px] max-sm:w-full",
              cancelOpen
                ? "border-danger bg-danger text-white hover:border-danger hover:text-white"
                : "border-[#e3b4ae] text-danger hover:border-danger hover:text-danger",
            ),
          })}
        >
          <Svg d={ICON.x} />
          Lemondás
        </button>
      </div>

      {within24h && (
        <div
          id="reschedule-lock"
          role="note"
          className="flex items-start gap-3.5 rounded-tile bg-canvas px-[22px] py-[18px]"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white">
            <Svg d={ICON.lock} size={16} />
          </span>
          <span className="text-[15px] leading-relaxed text-muted-strong">
            <strong className="text-navy">
              Az időpont már nem módosítható (kevesebb mint 24 óra van hátra).
            </strong>{" "}
            Kérdés esetén hívjon minket:{" "}
            <a
              href={telHref(phone)}
              className="link-grow font-extrabold whitespace-nowrap text-navy"
            >
              {phone}
            </a>
          </span>
        </div>
      )}

      {/* Reschedule picker */}
      {!within24h && (
        <Collapse id="reschedule-panel" open={rescheduleOpen}>
          <ReschedulePanel
            booking={{
              _id: booking._id,
              service: booking.service,
              slotDate: booking.slotDate,
              slotTime: booking.slotTime,
              managementToken: booking.managementToken,
              serviceId: booking.serviceId,
              feeWaived: isFeeWaived(booking.paymentStatus),
            }}
            scheduleData={scheduleData}
            onRescheduled={(newDate, newTime) => {
              setShowReschedule(false);
              setRescheduledTo({ date: newDate, time: newTime });
              setCardState("rescheduled");
            }}
            onCancel={() => setShowReschedule(false)}
          />
        </Collapse>
      )}

      {/* Cancel confirmation — in-page panel */}
      <Collapse id="cancel-panel" open={cancelOpen}>
        <CancelDialog
          booking={booking}
          onCancelled={() => setCardState("cancelled")}
          onClose={() => setCardState("idle")}
        />
      </Collapse>
    </div>
  );
}
