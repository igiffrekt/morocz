"use client";

import { Children, type ReactNode, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface SwipeRowProps {
  /** Carousel name for screen readers. */
  label: string;
  children: ReactNode;
  /** Grid used from `md` up, e.g. "md:[grid-template-columns:repeat(auto-fit,minmax(270px,1fr))]". */
  gridClassName?: string;
  /** Slide width on phones (default: full width minus a peek of the next one). */
  slideClassName?: string;
  /** Horizontal bleed so the row scrolls edge to edge (matches the parent's padding). */
  bleedClassName?: string;
  /** Show the "Lapozzon oldalra · 1 / 3" header above the row. */
  counter?: boolean;
  className?: string;
}

/**
 * Phones: horizontal scroll-snap carousel with an active-slide scale, dots and a counter
 * (MobilSzolgaltatas / MobilArak). From `md` up the same items sit in a plain grid.
 */
export function SwipeRow({
  label,
  children,
  gridClassName = "md:[grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))]",
  slideClassName = "flex-[0_0_calc(100%-56px)]",
  bleedClassName = "-mx-[18px] px-[18px] scroll-px-[18px]",
  counter = true,
  className,
}: SwipeRowProps) {
  const slides = Children.toArray(children);
  const [active, setActive] = useState(0);
  const rowRef = useRef<HTMLElement>(null);
  const raf = useRef(0);

  const onScroll = useCallback(() => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const row = rowRef.current;
      const first = row?.firstElementChild as HTMLElement | null;
      if (!row || !first) return;
      const step = first.offsetWidth + 10;
      const index = Math.min(Math.round(row.scrollLeft / Math.max(step, 1)), slides.length - 1);
      setActive((prev) => (prev === index ? prev : index));
    });
  }, [slides.length]);

  const goTo = (index: number) => {
    const row = rowRef.current;
    const target = row?.children[index] as HTMLElement | undefined;
    if (!row || !target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({
      left: target.offsetLeft - row.offsetLeft - 18,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {counter && slides.length > 1 && (
        <div className="flex items-center justify-between md:hidden">
          <span className="text-xs font-bold text-muted">Lapozzon oldalra</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-navy tabular-nums">
            {active + 1} / {slides.length}
          </span>
        </div>
      )}
      <section
        ref={rowRef}
        onScroll={onScroll}
        aria-roledescription="carousel"
        aria-label={label}
        className={cn(
          "scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1",
          bleedClassName,
          "md:mx-0 md:grid md:snap-none md:gap-3 md:overflow-visible md:px-0 md:pb-0",
          gridClassName,
        )}
      >
        {slides.map((slide, index) => (
          // biome-ignore lint/a11y/useSemanticElements: APG carousel slides are role="group" + aria-roledescription="slide"; a <fieldset> would be wrong here
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: slides are positional
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${slides.length}`}
            className={cn(
              "flex min-w-0 snap-start transition-[transform,opacity] duration-[450ms] ease-bento md:flex-auto",
              slideClassName,
              index === active ? "scale-100 opacity-100" : "scale-[.96] opacity-[.78]",
              "md:scale-100 md:opacity-100",
            )}
          >
            {slide}
          </div>
        ))}
      </section>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden">
          {slides.map((_, index) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional
              key={index}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full border-0 p-0 transition-[width,background-color] duration-[400ms] ease-bento",
                index === active ? "w-[22px] bg-navy" : "w-1.5 bg-[#c5cad9]",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
