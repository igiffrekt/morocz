"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { urlFor } from "@/sanity/lib/image";
import type { TestimonialQueryResult } from "../../../sanity.types";

interface TestimonialsSectionProps {
  heading?: string;
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
      className="w-20 h-20 rounded-full"
    >
      <circle cx="40" cy="40" r="40" fill="#d1d5db" />
      <circle cx="40" cy="30" r="13" fill="#9ca3af" />
      <path d="M10 72 Q10 52 40 52 Q70 52 70 72" fill="#9ca3af" />
    </svg>
  );
}

export function TestimonialsSection({ heading, testimonials }: TestimonialsSectionProps) {
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
    <section className="py-12 md:py-16">
      <div className="max-w-8xl mx-auto px-4 md:px-8">
        <div className="bg-accent rounded-3xl py-14 px-6 md:px-16">
          {heading && (
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-10 text-center">
              {heading}
            </h2>
          )}

          {/* Keyboard navigation: fieldset is the semantic element for role="group".
              tabIndex={0} is required per WCAG carousel pattern so arrow keys work. */}
          <fieldset
            aria-label="Vélemények körhinta"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: carousel keyboard navigation (WCAG carousel pattern) requires tabIndex so arrow keys work
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl border-0 p-0 m-0"
          >
            <motion.div
              drag={single ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={single ? undefined : handleDragEnd}
              className="cursor-grab active:cursor-grabbing select-none"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={active._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  aria-live="polite"
                  className="flex flex-col items-center text-center gap-5 max-w-2xl mx-auto"
                >
                  {/* Photo */}
                  {active.photo?.asset ? (
                    <Image
                      src={urlFor(active.photo).width(160).height(160).url()}
                      alt={active.patientName ?? "Páciens"}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white/60"
                    />
                  ) : (
                    <PlaceholderAvatar />
                  )}

                  {/* Name */}
                  {active.patientName && (
                    <p className="font-bold text-primary text-base">{active.patientName}</p>
                  )}

                  {/* Quote */}
                  {active.text && (
                    <blockquote className="text-xl italic text-primary/80 leading-relaxed">
                      &#8220;{active.text}&#8221;
                    </blockquote>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Dot navigation */}
            {!single && (
              <nav aria-label="Vélemény navigáció" className="flex justify-center gap-2.5 mt-10">
                {testimonials.map((t, i) => (
                  <button
                    key={t._id}
                    type="button"
                    aria-label={t.patientName ?? `${i + 1}. vélemény`}
                    onClick={() => setActiveIndex(i)}
                    className={[
                      "rounded-full transition-all duration-300",
                      i === activeIndex
                        ? "w-3 h-3 bg-primary"
                        : "w-2.5 h-2.5 bg-primary/30 hover:bg-primary/50",
                    ].join(" ")}
                  />
                ))}
              </nav>
            )}
          </fieldset>
        </div>
      </div>
    </section>
  );
}
