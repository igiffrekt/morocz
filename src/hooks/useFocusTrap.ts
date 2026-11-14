"use client";

import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0,
  );
}

interface FocusTrapOptions {
  /** Called on Escape. */
  onEscape?: () => void;
  /** Element to focus when the trap activates; defaults to the first focusable. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Restore focus to the previously focused element on deactivate (default true). */
  restoreFocus?: boolean;
}

/**
 * Keeps Tab / Shift+Tab inside `containerRef` while `active`, closes on Escape and
 * returns focus to whatever had it before the trap was activated.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  { onEscape, initialFocus, restoreFocus = true }: FocusTrapOptions = {},
): void {
  // Keep the latest callback without re-running the trap (which would re-focus).
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const target = initialFocus?.current ?? getFocusable(container)[0] ?? container;
      target.focus({ preventScroll: true });
    };
    // Wait a frame so freshly mounted / un-inerted content is focusable.
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (escapeRef.current) {
          event.stopPropagation();
          escapeRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable(container);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      if (restoreFocus && previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, initialFocus, restoreFocus]);
}
