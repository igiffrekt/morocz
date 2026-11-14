"use client";

import { useRef } from "react";
import { Collapse } from "@/components/ui/Accordion";
import { Modal } from "@/components/ui/Modal";
import { pillClassName } from "@/components/ui/PillButton";
import { cn } from "@/lib/cn";

const ALERT_ICON =
  "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z";

export const PRENATAL_NOTICE_TITLE = "Fontos tájékoztatás várandós pácienseink részére";

function AlertIcon({ size = 20 }: { size?: number }) {
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
      <path d={ALERT_ICON} />
    </svg>
  );
}

/** The two rules + closing line (shared by the modal and the yellow card). */
function PrenatalNoticeBody({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 text-sm leading-relaxed", className)}>
      <p className="m-0">
        A <strong>24. várandóssági hét</strong> betöltését követően, amennyiben első alkalommal
        jelentkezik rendelőmben várandósgondozásra, a szükséges részletes állapotfelmérés és
        dokumentáció áttekintése érdekében kizárólag <strong>dupla időpont foglalásával</strong>{" "}
        tudom biztosítani az ellátását.
      </p>
      <p className="m-0">
        A <strong>36. várandóssági héttől</strong> a szülésre választott intézmény szülészeti
        osztályát vagy a területileg illetékes szülészeti ügyeletet keresse fel.
      </p>
      <p className="m-0 italic">Köszönöm megértésüket és együttműködésüket!</p>
    </div>
  );
}

/**
 * Yellow notice under the booking summary while Várandósgondozás is selected
 * (grid-rows collapse; inert while closed).
 */
export function PrenatalNoticeCard({ open, className }: { open: boolean; className?: string }) {
  return (
    <Collapse open={open} className={className}>
      <div
        role="note"
        className="flex flex-col gap-3 rounded-panel bg-sun px-6 py-[22px] text-navy"
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-navy">
            <AlertIcon />
          </span>
          <strong className="text-base leading-tight">{PRENATAL_NOTICE_TITLE}</strong>
        </span>
        <PrenatalNoticeBody />
      </div>
    </Collapse>
  );
}

interface PrenatalNoticeModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

/**
 * Non-dismissable notice shown before Várandósgondozás is applied: no close button,
 * backdrop click and Escape do nothing — it only goes away via "Megértettem".
 */
export function PrenatalNoticeModal({ open, onAcknowledge }: PrenatalNoticeModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      open={open}
      onClose={() => {}}
      hideClose
      size="sm"
      variant="sheet"
      labelledBy="prenatal-notice-title"
      initialFocus={buttonRef}
      header={
        <div className="relative overflow-hidden bg-sun px-6 pt-7 pb-6 text-navy sm:px-8">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-white/25"
          />
          <span className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy">
            <AlertIcon size={24} />
          </span>
          <p className="relative m-0 text-xs font-extrabold tracking-[.14em] uppercase">
            Várandósgondozás
          </p>
          <h2
            id="prenatal-notice-title"
            className="relative m-0 mt-1 text-2xl leading-tight font-extrabold tracking-[-0.02em]"
          >
            {PRENATAL_NOTICE_TITLE}
          </h2>
        </div>
      }
    >
      <PrenatalNoticeBody className="pt-2 text-[15px] text-muted-strong [&_strong]:text-navy" />
      <button
        ref={buttonRef}
        type="button"
        onClick={onAcknowledge}
        className={pillClassName({
          variant: "navy",
          size: "lg",
          fullWidth: true,
          className: "mt-7",
        })}
      >
        Megértettem
      </button>
    </Modal>
  );
}
