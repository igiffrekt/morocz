"use client";

import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PillLink } from "@/components/ui/PillButton";
import { urlFor } from "@/sanity/lib/image";

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

/** Sanity-driven announcement (e.g. holiday closures), drawn with the shared Modal. */
export function PopupModal({ popup }: PopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (popup?.showOncePerSession) {
      try {
        sessionStorage.setItem(`popup-dismissed-${popup._id}`, "true");
      } catch {
        // storage blocked: the popup simply shows again next time
      }
    }
  }, [popup]);

  useEffect(() => {
    if (!popup) return;

    if (popup.showOncePerSession) {
      try {
        if (sessionStorage.getItem(`popup-dismissed-${popup._id}`)) return;
      } catch {
        // storage blocked: fall through and show it
      }
    }

    const shouldShowOnPage =
      popup.showOnPages?.includes("*") || popup.showOnPages?.includes(pathname);
    if (!shouldShowOnPage) return;

    const timeout = setTimeout(() => setIsOpen(true), (popup.displayDelay || 2) * 1000);
    return () => clearTimeout(timeout);
  }, [popup, pathname]);

  if (!popup) return null;

  return (
    <Modal open={isOpen} onClose={handleClose} title={popup.headline} size="lg">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          {popup.content && (
            <div className="text-[15px] leading-relaxed text-muted-strong">
              <PortableText
                value={popup.content}
                components={{
                  block: {
                    h3: ({ children }) => (
                      <h3 className="mt-4 mb-2 text-lg font-extrabold text-navy">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="mt-3 mb-1 text-base font-extrabold text-navy">{children}</h4>
                    ),
                    normal: ({ children }) => <p className="mb-2">{children}</p>,
                  },
                  marks: {
                    strong: ({ children }) => (
                      <strong className="font-extrabold text-navy">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic">{children}</em>,
                    link: ({ children, value }) => (
                      <a
                        href={value?.href}
                        className="font-bold text-teal-ink underline underline-offset-2 hover:text-navy"
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
            <PillLink
              href={popup.ctaButton.href}
              onClick={handleClose}
              arrow
              className="mt-5 self-start"
            >
              {popup.ctaButton.label}
            </PillLink>
          )}
        </div>

        {popup.image?.asset && (
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-tile md:aspect-[4/5] md:w-2/5">
            <Image
              src={urlFor(popup.image).width(480).height(600).url()}
              alt={popup.image.alt || ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 320px"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
