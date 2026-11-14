"use client";

import { type MouseEvent, useEffect, useState } from "react";

/**
 * Index of the last section whose top has passed `offset` px from the viewport top, and the
 * page scroll progress (0–100). rAF-throttled, passive listener. When the page is scrolled to
 * the very bottom, the last section counts as active (short final sections never reach the
 * offset line otherwise) — only with `activateLastAtBottom`.
 */
export function useScrollSpy(
  ids: readonly string[],
  offset: number,
  { activateLastAtBottom = false }: { activateLastAtBottom?: boolean } = {},
) {
  const [state, setState] = useState({ active: -1, progress: 0 });
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let frame = 0;
    const measure = () => {
      frame = 0;
      let active = -1;
      list.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) active = i;
      });
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100)));
      if (activateLastAtBottom && list.length > 0 && window.scrollY >= max - 2) {
        active = list.length - 1;
      }
      setState((prev) =>
        prev.active === active && prev.progress === progress ? prev : { active, progress },
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key, offset, activateLastAtBottom]);

  return state;
}

/** Smooth-scrolls to `id` (instant with reduced motion), updates the hash, moves focus. */
export function scrollToId(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
  // Move focus for keyboard / screen-reader users without a second scroll jump.
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  return true;
}

/** onClick for in-page anchor links: falls back to the native jump if the target is missing. */
export function jumpTo(event: MouseEvent<HTMLElement>, id: string) {
  if (document.getElementById(id)) {
    event.preventDefault();
    scrollToId(id);
  }
}
