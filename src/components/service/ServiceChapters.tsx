"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { twoDigit } from "@/lib/service-page";

export interface Chapter {
  id: string;
  label: string;
  short: string;
}

/**
 * Index of the last chapter whose top has passed `offset` px from the viewport top, and the
 * page scroll progress (0–100). rAF-throttled, passive listener.
 */
function useScrollSpy(ids: readonly string[], offset: number) {
  const [state, setState] = useState({ active: -1, progress: 0 });
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|");
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
  }, [key, offset]);

  return state;
}

function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
  // Move focus for keyboard / screen-reader users without a second scroll jump.
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

/** Desktop sticky "Tartalom" list; the current chapter is highlighted as you scroll. */
export function ServiceToc({ chapters, mark }: { chapters: Chapter[]; mark: string }) {
  const { active } = useScrollSpy(
    chapters.map((c) => c.id),
    160,
  );
  const current = Math.max(active, 0);
  return (
    <nav
      aria-label="Az oldal tartalma"
      className="flex flex-col gap-1 rounded-panel bg-white px-3.5 pt-6 pb-3.5"
    >
      <span className="px-3.5 pb-2.5 text-[13px] font-bold tracking-[.14em] text-teal-ink uppercase">
        Tartalom
      </span>
      {chapters.map((chapter, i) => {
        const on = i === current;
        return (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            aria-current={on ? "true" : undefined}
            onClick={(e) => jumpTo(e, chapter.id)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-full py-2 pr-4 pl-2 text-sm leading-[1.35] no-underline transition-colors duration-300",
              on
                ? "bg-navy font-extrabold text-white hover:bg-navy hover:text-white"
                : "font-semibold text-muted-strong hover:bg-sage hover:text-navy",
            )}
          >
            <span
              className={cn(
                "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-navy transition-colors duration-300",
                on ? mark : "bg-canvas",
              )}
            >
              {twoDigit(i)}
            </span>
            <span className="min-w-0 flex-1">{chapter.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

/**
 * Phones / tablets: sticky horizontal chapter pills under the app bar with a reading
 * progress line; the active pill scrolls itself into view.
 */
export function ServiceChapterBar({ chapters }: { chapters: Chapter[] }) {
  const { active, progress } = useScrollSpy(
    chapters.map((c) => c.id),
    150,
  );
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const pill = active >= 0 ? (bar.children[active] as HTMLElement | undefined) : undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bar.scrollTo({
      left: pill ? Math.max(pill.offsetLeft - 12, 0) : 0,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  return (
    <div className="sticky top-[68px] z-20 -mx-3 bg-canvas/90 backdrop-blur-[16px] lg:hidden">
      <nav aria-label="Fejezetek">
        <div
          ref={barRef}
          className="scrollbar-none flex scroll-px-3 gap-1.5 overflow-x-auto px-3 pt-2 pb-2.5"
        >
          {chapters.map((chapter, i) => {
            const on = i === active;
            return (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                aria-current={on ? "true" : undefined}
                onClick={(e) => jumpTo(e, chapter.id)}
                className={cn(
                  "tap-press inline-flex min-h-11 flex-[0_0_auto] items-center gap-2 rounded-full border-[1.5px] py-0 pr-4 pl-1.5 text-sm font-extrabold whitespace-nowrap no-underline transition-[background-color,color,border-color] duration-[400ms] ease-bento",
                  on
                    ? "border-navy bg-navy text-white hover:text-white"
                    : "border-[#e3e7ef] bg-white text-navy hover:text-navy",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors duration-[400ms]",
                    on ? "bg-mint-light text-navy" : "bg-canvas text-teal-ink",
                  )}
                >
                  {chapter.id === "gyik" ? "?" : twoDigit(i)}
                </span>
                {chapter.short}
              </a>
            );
          })}
        </div>
      </nav>
      <div aria-hidden="true" className="h-[3px] bg-[#e3e7ef]">
        <div
          className="h-[3px] rounded-r-full bg-mint transition-[width] duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
