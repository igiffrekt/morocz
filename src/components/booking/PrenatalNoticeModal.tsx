"use client";

import { useEffect, useRef } from "react";

interface PrenatalNoticeModalProps {
  onAcknowledge: () => void;
}

/**
 * Non-dismissable notice: no close button, no backdrop click, no Escape.
 * It only goes away via the "Megértettem" button.
 */
export function PrenatalNoticeModal({ onAcknowledge }: PrenatalNoticeModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();

    // The button is the only focusable element — keep focus on it.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Escape") {
        e.preventDefault();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-primary)]/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prenatal-notice-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        <div className="h-1.5 rounded-t-3xl bg-[var(--color-accent)]" />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-primary)]"
              aria-hidden="true"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                />
              </svg>
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-blue-card)]">
                Várandósgondozás
              </p>
              <h2
                id="prenatal-notice-title"
                className="text-xl md:text-2xl font-bold text-[var(--color-primary)] leading-tight"
              >
                Fontos tájékoztatás várandós pácienseink részére
              </h2>
            </div>
          </div>

          <div className="space-y-4 text-[15px] leading-relaxed text-gray-700">
            <div className="rounded-2xl bg-[var(--color-background-light)] border-l-4 border-[var(--color-accent)] p-4">
              <p>
                A <strong className="text-[var(--color-primary)]">24. várandóssági hét</strong>{" "}
                betöltését követően, amennyiben első alkalommal jelentkezik rendelőmben
                várandósgondozásra, a szükséges részletes állapotfelmérés és dokumentáció
                áttekintése érdekében kizárólag{" "}
                <strong className="text-[var(--color-primary)]">dupla időpont foglalásával</strong>{" "}
                tudom biztosítani az ellátását.
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-background-light)] border-l-4 border-[var(--color-purple-card)] p-4">
              <p>
                A <strong className="text-[var(--color-primary)]">36. várandóssági héttől</strong> a
                szülésre választott intézmény szülészeti osztályát vagy a területileg illetékes
                szülészeti ügyeletet keresse fel.
              </p>
            </div>
            <p className="text-gray-600 italic">Köszönöm megértésüket és együttműködésüket!</p>
          </div>

          <button
            ref={buttonRef}
            type="button"
            onClick={onAcknowledge}
            className="mt-8 w-full rounded-xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--color-primary)]/90 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/60"
          >
            Megértettem
          </button>
        </div>
      </div>
    </div>
  );
}
