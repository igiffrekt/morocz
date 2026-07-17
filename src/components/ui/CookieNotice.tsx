"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Consent, readConsent, saveConsent } from "@/lib/consent";

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
      aria-label="Cookie beállítások"
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <p className="mb-1 text-sm font-bold text-primary">Sütik használata</p>
      <p className="mb-3 text-sm text-gray-700 leading-relaxed">
        Sütiket használunk a weboldal működéséhez, valamint — hozzájárulásoddal — analitikai és
        marketing (Google Ads) célból. Részletek az{" "}
        <Link
          href="/adatkezelesi-tajekoztato"
          className="text-accent underline hover:opacity-80 transition-opacity"
        >
          adatkezelési tájékoztatóban
        </Link>
        .
      </p>

      {showSettings && (
        <div className="mb-3 space-y-2 rounded-xl bg-gray-50 p-3">
          <label className="flex items-start justify-between gap-3 opacity-60">
            <span className="text-sm text-gray-700">
              <span className="font-medium">Szükséges</span>
              <br />
              <span className="text-xs">A weboldal működéséhez elengedhetetlen.</span>
            </span>
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-primary" />
          </label>
          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <span className="text-sm text-gray-700">
              <span className="font-medium">Analitika</span>
              <br />
              <span className="text-xs">Névtelen látogatottsági statisztika (GA4).</span>
            </span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
          </label>
          <label className="flex items-start justify-between gap-3 cursor-pointer">
            <span className="text-sm text-gray-700">
              <span className="font-medium">Marketing</span>
              <br />
              <span className="text-xs">Google Ads konverziómérés a hirdetések hatékonyságához.</span>
            </span>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => commit({ analytics: true, marketing: true })}
          className="rounded-xl bg-primary px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
        >
          Elfogad mind
        </button>
        <button
          type="button"
          onClick={() => commit({ analytics: false, marketing: false })}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Elutasít
        </button>
        {showSettings ? (
          <button
            type="button"
            onClick={() => commit({ analytics, marketing })}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Mentés
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="text-sm text-accent underline hover:opacity-80 transition-opacity"
          >
            Beállítások
          </button>
        )}
      </div>
    </motion.div>
  );
}
