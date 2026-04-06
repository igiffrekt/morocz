"use client";

import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { urlFor } from "@/sanity/lib/image";
import { usePathname } from "next/navigation";

interface PopupData {
  _id: string;
  headline: string;
  content: PortableTextBlock[];
  image?: {
    asset: { _ref: string };
    alt?: string;
  };
  ctaButton?: {
    label: string;
    href: string;
  };
  showOnPages: string[];
  displayDelay: number;
  showOncePerSession: boolean;
}

interface PopupModalProps {
  popup: PopupData | null;
}

export function PopupModal({ popup }: PopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (popup?.showOncePerSession) {
      sessionStorage.setItem(`popup-dismissed-${popup._id}`, "true");
    }
  }, [popup]);

  useEffect(() => {
    if (!popup) return;

    // Check if already dismissed this session
    if (popup.showOncePerSession) {
      const dismissed = sessionStorage.getItem(`popup-dismissed-${popup._id}`);
      if (dismissed) return;
    }

    // Check if should show on current page
    const shouldShowOnPage =
      popup.showOnPages?.includes("*") || popup.showOnPages?.includes(pathname);
    if (!shouldShowOnPage) return;

    // Show after delay
    const timeout = setTimeout(() => {
      setIsOpen(true);
    }, (popup.displayDelay || 2) * 1000);

    return () => clearTimeout(timeout);
  }, [popup, pathname]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleClose]);

  if (!popup) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-headline"
            className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-md transition-all hover:bg-white hover:text-gray-700 hover:shadow-lg"
                aria-label="Bezárás"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Content - Left side */}
                <div className="flex-1 p-6 md:p-8">
                  <h2
                    id="popup-headline"
                    className="mb-4 text-2xl font-bold text-medical-navy md:text-3xl"
                  >
                    {popup.headline}
                  </h2>

                  {popup.content && (
                    <div className="prose prose-sm max-w-none text-medical-text-gray">
                      <PortableText
                        value={popup.content}
                        components={{
                          block: {
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold text-medical-navy mt-4 mb-2">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-base font-semibold text-medical-navy mt-3 mb-1">
                                {children}
                              </h4>
                            ),
                            normal: ({ children }) => <p className="mb-2">{children}</p>,
                          },
                          marks: {
                            strong: ({ children }) => (
                              <strong className="font-bold">{children}</strong>
                            ),
                            em: ({ children }) => <em className="italic">{children}</em>,
                            link: ({ children, value }) => (
                              <a
                                href={value?.href}
                                className="text-medical-teal underline hover:text-medical-green"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          },
                        }}
                      />
                    </div>
                  )}

                  {popup.ctaButton?.label && popup.ctaButton?.href && (
                    <Link
                      href={popup.ctaButton.href}
                      onClick={handleClose}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-medical-green px-6 py-3 font-semibold text-white transition-all hover:bg-medical-teal hover:shadow-lg"
                    >
                      {popup.ctaButton.label}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Image - Right side */}
                {popup.image?.asset && (
                  <div className="relative aspect-square w-full md:aspect-auto md:w-2/5">
                    <Image
                      src={urlFor(popup.image).width(400).height(500).url()}
                      alt={popup.image.alt || popup.headline}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-medical-navy/20 to-transparent md:bg-gradient-to-r" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
