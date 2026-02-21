"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

interface PhoneCallDialogProps {
  phone: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PhoneCallDialog({ phone, isOpen, onClose }: PhoneCallDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop — use button for accessibility */}
      <button
        type="button"
        aria-label="Bezárás"
        className="absolute inset-0 bg-black/50 cursor-default"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="relative rounded-2xl bg-white p-6 shadow-xl max-w-sm w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-dialog-title"
      >
        {/* Phone icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 id="phone-dialog-title" className="text-lg font-bold text-primary text-center mb-2">
          Valóban hívni szeretné a Mórocz Medical rendelőt?
        </h2>

        {/* Phone number */}
        <p className="text-gray-600 text-center text-sm mb-6">{phone}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 text-gray-700 px-4 py-3 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Mégse
          </button>
          <a
            href={`tel:${phone}`}
            className="flex-1 rounded-xl bg-accent text-primary px-4 py-3 text-sm font-bold text-center hover:bg-accent/80 transition-colors"
          >
            Hívás
          </a>
        </div>
      </motion.div>
    </div>
  );
}
