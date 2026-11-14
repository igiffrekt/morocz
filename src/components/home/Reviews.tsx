"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ICON_PATHS, PathIcon } from "./PathIcon";

export interface Review {
  id: string;
  name: string;
  text: string;
}

interface ReviewsProps {
  heading: string;
  reviews: Review[];
  /** Sanity homepage.testimonialsCtaText / testimonialsCtaUrl. */
  ctaText?: string | null;
  ctaUrl?: string | null;
}

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 0-1 1v3c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  );
}

/** Scroll offset at which `slide` sits at the track's snap start. */
function snapLeft(track: HTMLElement, slide: HTMLElement): number {
  const pad = Number.parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
  return slide.offsetLeft - track.offsetLeft - pad;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Vélemények slider. One scroll-snap track for every breakpoint: phones swipe it
 * (cards peek), desktop drives it with the arrows/dots; the active dot follows the
 * scroll position either way.
 */
export function Reviews({ heading, reviews, ctaText, ctaUrl }: ReviewsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = reviews.length;

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const left = track.scrollLeft;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    slides.forEach((slide, i) => {
      const dist = Math.abs(snapLeft(track, slide) - left);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    // At the very end the last slide may not reach the snap start.
    if (left + track.clientWidth >= track.scrollWidth - 2) best = slides.length - 1;
    setActive(best);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const goTo = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({
      left: snapLeft(track, slide),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    setActive(index);
  };

  const cta =
    ctaText && ctaUrl ? (
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="link-grow py-0.5 text-[13px] font-bold whitespace-nowrap text-navy md:text-[15px]"
      >
        {ctaText} <span aria-hidden="true">→</span>
      </a>
    ) : null;

  if (count === 0) return null;

  return (
    <section
      id="velemenyek"
      aria-labelledby="velemenyek-cim"
      aria-roledescription="carousel"
      className="flex min-w-0 scroll-mt-28 flex-col gap-3.5 lg:flex-[3_1_560px] lg:gap-7 lg:overflow-hidden lg:rounded-hero lg:bg-white lg:p-12"
    >
      <div className="flex items-end justify-between gap-4 px-1.5 lg:flex-wrap lg:items-center lg:px-0">
        <div>
          <span className="text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase lg:text-[13px] lg:font-bold">
            Rólunk mondták
          </span>
          <h2
            id="velemenyek-cim"
            className="m-0 mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-navy lg:mt-2 lg:text-[40px] lg:tracking-normal"
          >
            {heading}
          </h2>
        </div>
        <div className="lg:hidden">{cta}</div>
        {count > 1 && (
          <div className="hidden gap-2 lg:flex">
            <button
              type="button"
              aria-label="Előző vélemény"
              onClick={() => goTo((active - 1 + count) % count)}
              className="btn-lift inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-line bg-white text-navy"
            >
              <PathIcon d={ICON_PATHS.arrowLeft} size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label="Következő vélemény"
              onClick={() => goTo((active + 1) % count)}
              className="btn-lift inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-0 bg-navy text-white"
            >
              <PathIcon d="M5 12h14M13 6l6 6-6 6" size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="scrollbar-none -mx-3 flex snap-x snap-mandatory scroll-px-3 gap-2.5 overflow-x-auto overscroll-x-contain px-3 lg:mx-0 lg:scroll-px-0 lg:gap-0 lg:px-0"
      >
        {reviews.map((review, index) => (
          <figure
            key={review.id}
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${count}`}
            className="m-0 flex flex-[0_0_calc(100%-36px)] snap-start flex-col gap-3.5 rounded-tile bg-white p-[22px] lg:flex-[0_0_100%] lg:gap-5 lg:rounded-none lg:p-0"
          >
            <QuoteMark className="h-8 w-8 text-mint lg:h-11 lg:w-11" />
            <blockquote className="m-0 text-[17px] leading-normal font-semibold text-navy lg:text-[26px] lg:leading-[1.45]">
              {review.text}
            </blockquote>
            <figcaption className="mt-auto text-[13px] font-bold text-muted lg:mt-0 lg:text-[15px]">
              {review.name}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-between">
        {count > 1 && (
          <div className="flex gap-1.5 lg:gap-2">
            {reviews.map((review, index) => (
              <button
                key={review.id}
                type="button"
                aria-label={`${index + 1}. vélemény`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
                className={cn(
                  "relative h-1.5 rounded-full border-0 p-0 before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] transition-[width,background-color] duration-[450ms] ease-bento lg:h-2.5",
                  index === active
                    ? "w-[22px] bg-navy lg:w-9"
                    : "w-1.5 bg-[#c5cad9] lg:w-2.5 lg:bg-line",
                )}
              />
            ))}
          </div>
        )}
        <div className="hidden lg:block">{cta}</div>
      </div>
    </section>
  );
}
