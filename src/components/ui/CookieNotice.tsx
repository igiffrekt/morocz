"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/PillButton";
import { CheckboxRow } from "@/components/ui/PillCheckbox";
import { type Consent, readConsent, saveConsent } from "@/lib/consent";

/**
 * z-[80]: a hozzájárulási sáv MINDEN más rétegen felül van, a Modal (z-[70]) felett is.
 *
 * Ha egy felugró ablak backdropja letakarja, az „Elfogad mind" gombra fizikailag nem
 * lehet kattintani, amíg a látogató be nem zárja az ablakot. Hozzájárulás nélkül a
 * Google Ads konverziómérés nem fut (gcs=G100), tehát egy letakart cookie-sáv
 * közvetlenül mérési kiesés.
 */
const NOTICE_CLASS =
  "fixed inset-x-3 bottom-3 z-[80] flex max-h-[calc(100dvh-1.5rem)] flex-col gap-3.5 overflow-y-auto rounded-tile bg-white p-5 text-navy shadow-float ring-1 ring-line-soft sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px] sm:p-6";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Non-necessary categories default OFF — GDPR requires explicit opt-in, so the visitor
  // must actively tick these (or use "Elfogad mind"). "Elutasít" leaves both off.
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Show the banner only until the visitor has made a choice.
    if (readConsent() === null) setVisible(true);
  }, []);

  function commit(consent: Consent) {
    saveConsent(consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <motion.div
      role="dialog"
      aria-labelledby="cookie-notice-title"
      className={NOTICE_CLASS}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex flex-col gap-1.5">
        <p id="cookie-notice-title" className="m-0 text-base font-extrabold">
          Sütik használata
        </p>
        <p className="m-0 text-sm leading-relaxed text-muted">
          Sütiket használunk a weboldal működéséhez, valamint — hozzájárulásoddal — analitikai és
          marketing (Google Ads) célból. Részletek az{" "}
          <Link
            href="/adatkezelesi-tajekoztato"
            className="font-bold text-teal-ink underline underline-offset-2 hover:text-navy"
          >
            adatkezelési tájékoztatóban
          </Link>
          .
        </p>
      </div>

      {showSettings && (
        <div className="flex flex-col gap-1 rounded-[22px] bg-field p-2">
          <p className="m-0 px-3.5 py-2 text-sm leading-normal text-muted-strong">
            <span className="font-extrabold text-navy">Szükséges</span> — a weboldal működéséhez
            elengedhetetlen, mindig aktív.
          </p>
          <CheckboxRow id="cookie-analytics" checked={analytics} onChange={setAnalytics} size="sm">
            <span className="font-extrabold text-navy">Analitika</span> — névtelen látogatottsági
            statisztika (GA4).
          </CheckboxRow>
          <CheckboxRow id="cookie-marketing" checked={marketing} onChange={setMarketing} size="sm">
            <span className="font-extrabold text-navy">Marketing</span> — Google Ads konverziómérés
            a hirdetések hatékonyságához.
          </CheckboxRow>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <PillButton
          size="md"
          fullWidth
          className="col-span-2 h-11"
          onClick={() => commit({ analytics: true, marketing: true })}
        >
          Elfogad mind
        </PillButton>
        <PillButton
          variant="outline"
          size="md"
          fullWidth
          className="h-11 px-3"
          onClick={() => commit({ analytics: false, marketing: false })}
        >
          Elutasít
        </PillButton>
        {showSettings ? (
          <PillButton
            variant="outline"
            size="md"
            fullWidth
            className="h-11 px-3"
            onClick={() => commit({ analytics, marketing })}
          >
            Mentés
          </PillButton>
        ) : (
          <PillButton
            variant="ghost"
            size="md"
            fullWidth
            className="h-11 bg-canvas px-3"
            aria-expanded={false}
            onClick={() => setShowSettings(true)}
          >
            Beállítások
          </PillButton>
        )}
      </div>
    </motion.div>
  );
}
