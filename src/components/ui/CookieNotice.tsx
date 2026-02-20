"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieNotice() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem("cookie-notice-dismissed");
    if (!alreadyDismissed) {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem("cookie-notice-dismissed", "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <motion.div
      role="dialog"
      aria-label="Cookie tájékoztatás"
      className="fixed bottom-4 right-4 z-50 w-full max-w-xs rounded-2xl bg-white p-4 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <p className="mb-1 text-sm font-bold text-primary">Sütik használata</p>
      <p className="mb-3 text-sm text-gray-700 leading-relaxed">
        Ez a weboldal sütiket használ a jobb felhasználói élmény érdekében. Bővebb információt az{" "}
        <Link
          href="/adatkezelesi-tajekoztato"
          className="text-accent underline hover:opacity-80 transition-opacity"
        >
          adatkezelési tájékoztatóban
        </Link>{" "}
        talál.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="rounded-xl bg-primary px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
      >
        Rendben
      </button>
    </motion.div>
  );
}
