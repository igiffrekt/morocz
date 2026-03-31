"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import type { AllTestimonialsQueryResult } from "../../../sanity.types";

type TestimonialQueryResult = AllTestimonialsQueryResult[number];

interface TestimonialsSectionProps {
  heading?: string;
  ctaText?: string;
  ctaUrl?: string;
  testimonials: TestimonialQueryResult[];
}

function PlaceholderAvatar() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      aria-label="Névtelen páciens"
      className="h-16 w-16 rounded-full"
    >
      <circle cx="40" cy="40" r="40" fill="#d1d5db" />
      <circle cx="40" cy="30" r="13" fill="#9ca3af" />
      <path d="M10 72 Q10 52 40 52 Q70 52 70 72" fill="#9ca3af" />
    </svg>
  );
}

export function TestimonialsSection({
  heading,
  ctaText,
  ctaUrl,
  testimonials,
}: TestimonialsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (testimonials.length === 0) return null;

  const single = testimonials.length === 1;
  const active = testimonials[activeIndex];

  function goNext() {
    setActiveIndex((i) => (i + 1) % testimonials.length);
  }

  function goPrev() {
    setActiveIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFieldSetElement>) {
    if (e.key === "ArrowLeft") goPrev();
    else if (e.key === "ArrowRight") goNext();
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -50) goNext();
    else if (info.offset.x > 50) goPrev();
  }

  return (
    <section aria-labelledby="velemenyek-cim" className="bg-yellow-300 px-4 py-12 md:py-20">
      {heading && (
        <FadeIn viewport>
          <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <h2 id="velemenyek-cim" className="text-3xl font-extrabold text-primary md:text-4xl">
              {heading}
            </h2>
            {ctaText && ctaUrl && (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline md:ml-auto"
              >
                {ctaText}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </FadeIn>
      )}

      <FadeIn viewport delay={0.15}>
        <div className="relative">
          {/* Prev button */}
          {!single && (
            <button
              onClick={goPrev}
              aria-label="Előző vélemény"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 rounded-full p-2 text-primary hover:bg-yellow-200/50 transition-colors md:left-auto md:translate-x-0"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <fieldset
            aria-label="Vélemények körhinta"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: carousel keyboard navigation (WCAG carousel pattern) requires tabIndex so arrow keys work
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="m-0 border-0 p-0 outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <motion.div
              drag={single ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={single ? undefined : handleDragEnd}
              className="cursor-grab select-none active:cursor-grabbing"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={active._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  aria-live="polite"
                  className="rounded-2xl border border-gray-200 px-10 py-12 md:px-32 md:py-16"
                >
                  <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-0">
                    {/* Left: photo + name row */}
                    <div className="flex shrink-0 items-center gap-4">
                      {active.photo?.asset ? (
                        <Image
                          src={urlFor(active.photo).width(128).height(128).url()}
                          alt={active.patientName ?? "Páciens"}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <PlaceholderAvatar />
                      )}
                      {active.patientName && (
                        <div>
                          <p className="text-base font-extrabold text-primary">
                            {active.patientName}
                          </p>
                          <p className="text-sm font-medium text-primary/50">Páciens</p>
                        </div>
                      )}
                    </div>

                    {/* Separator */}
                    <div className="hidden h-20 w-px bg-gray-200 md:block md:mx-12" />

                    {/* Right: quote */}
                    {active.text && (
                      <p className="text-lg font-medium leading-relaxed text-primary/80 md:text-xl">
                        {active.text}
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Dot navigation */}
            {!single && (
              <nav aria-label="Vélemény navigáció" className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f2f6fa] px-8 py-3.5">
                  {testimonials.map((t, i) => (
                    <button
                      key={t._id}
                      type="button"
                      aria-label={t.patientName ?? `${i + 1}. vélemény`}
                      onClick={() => setActiveIndex(i)}
                      className={[
                        "rounded-full transition-all duration-300",
                        i === activeIndex
                          ? "h-2 w-2 bg-primary"
                          : "h-1.5 w-1.5 bg-primary/25 hover:bg-primary/40",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </nav>
            )}
          </fieldset>

          {/* Next button */}
          {!single && (
            <button
              onClick={goNext}
              aria-label="Következő vélemény"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 rounded-full p-2 text-primary hover:bg-yellow-200/50 transition-colors md:right-auto md:translate-x-0"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
