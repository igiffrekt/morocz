"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, type RefObject, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/cn";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Visible title; also the dialog's accessible name. */
  title?: ReactNode;
  /** Accessible name when no visible title is rendered. */
  ariaLabel?: string;
  description?: ReactNode;
  children: ReactNode;
  /**
   * "dialog": centred card. "sheet": bottom sheet on phones, centred card from `sm` up.
   */
  variant?: "dialog" | "sheet";
  size?: "sm" | "md" | "lg";
  initialFocus?: RefObject<HTMLElement | null>;
  /** Hide the round close button (provide your own close control then). */
  hideClose?: boolean;
  className?: string;
}

const WIDTHS = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" } as const;

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * Accessible modal / bottom sheet: portal to <body>, focus trapped inside, Escape and
 * backdrop click close it, page scroll locked, focus restored on close.
 */
export function Modal({
  open,
  onClose,
  title,
  ariaLabel,
  description,
  children,
  variant = "dialog",
  size = "md",
  initialFocus,
  hideClose = false,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);
  useScrollLock(open);
  useFocusTrap(panelRef, open && mounted, { onEscape: onClose, initialFocus });

  if (!mounted) return null;

  const isSheet = variant === "sheet";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[70] flex justify-center",
            isSheet ? "items-end sm:items-center sm:p-6" : "items-center p-4 sm:p-6",
          )}
        >
          <motion.button
            type="button"
            aria-label="Bezárás"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-navy/55 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={cn(
              "relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden bg-white text-navy shadow-card outline-none",
              isSheet
                ? "max-h-[92dvh] rounded-t-[32px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[32px]"
                : "rounded-[32px]",
              WIDTHS[size],
              className,
            )}
            initial={isSheet ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={isSheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isSheet ? { y: "100%" } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: isSheet ? 0.5 : 0.4, ease: EASE }}
          >
            {isSheet && (
              <span
                aria-hidden="true"
                className="mx-auto mt-3 block h-1.5 w-11 shrink-0 rounded-full bg-line sm:hidden"
              />
            )}
            {(title || !hideClose) && (
              <div className="flex items-start gap-4 px-6 pt-5 sm:px-8 sm:pt-7">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {title && (
                    <h2 id={titleId} className="m-0 text-2xl font-extrabold leading-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="m-0 text-[15px] leading-relaxed text-muted">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Bezárás"
                    className="tap-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas text-navy hover:bg-sage"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-6 sm:px-8 sm:pb-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Bottom sheet on phones (alias of `<Modal variant="sheet">`). */
export function Sheet(props: Omit<ModalProps, "variant">) {
  return <Modal {...props} variant="sheet" />;
}
