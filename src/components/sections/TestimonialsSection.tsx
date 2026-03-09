"use client";

import { motion, type PanInfo } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
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
      className="h-16 w-16 rounded-full"
    >
      <circle cx="40" cy="40" r="40" fill="#d1d5db" />
      <circle cx="40" cy="30" r="13" fill="#9ca3af" />
      <path d="M10 72 Q10 52 40 52 Q70 52 70 72" fill="#9ca3af" />
    </svg>
  );
}

export function TestimonialsSection({ heading, testimonials }: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitX, setExitX] = useState(0);

  if (testimonials.length === 0) return null;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80) {
      setExitX(info.offset.x);
      setTimeout(() => {
        setCurrentIndex((prev) =>
          info.offset.x < 0
            ? (prev + 1) % testimonials.length
            : (prev - 1 + testimonials.length) % testimonials.length,
        );
        setExitX(0);
      }, 200);
    }
  };

  return (
    <section aria-labelledby="velemenyek-cim" className="p-6 md:p-10 lg:p-14 bg-[#efda67] rounded-3xl">
      {heading && (
        <FadeIn viewport>
          <div className="mb-12">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-primary/40 mb-4"
            >
              <span className="w-8 h-px bg-primary/20" />
              Rólunk mondták
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              id="velemenyek-cim"
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary leading-tight"
            >
              {heading}
            </motion.h2>
          </div>
        </FadeIn>
      )}

      <FadeIn viewport delay={0.15}>
        <div className="flex items-center justify-center min-h-[22rem]">
          <div className="relative w-full max-w-xs h-72">
            {testimonials.map((t, index) => {
              const isCurrent = index === currentIndex;
              const isNext = index === (currentIndex + 1) % testimonials.length;
              const isPrev = index === (currentIndex + 2) % testimonials.length;

              if (!isCurrent && !isNext && !isPrev) return null;

              return (
                <motion.div
                  key={t._id}
                  className="absolute inset-0 rounded-2xl bg-white shadow-xl cursor-grab active:cursor-grabbing"
                  style={{ zIndex: isCurrent ? 3 : isNext ? 2 : 1 }}
                  drag={isCurrent ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={isCurrent ? handleDragEnd : undefined}
                  initial={{
                    scale: 0.95,
                    opacity: 0,
                    y: isCurrent ? 0 : isNext ? 8 : 16,
                    rotate: isCurrent ? 0 : isNext ? -2 : -4,
                  }}
                  animate={{
                    scale: isCurrent ? 1 : 0.95,
                    opacity: isCurrent ? 1 : isNext ? 0.6 : 0.3,
                    x: isCurrent ? exitX : 0,
                    y: isCurrent ? 0 : isNext ? 8 : 16,
                    rotate: isCurrent ? exitX / 20 : isNext ? -2 : -4,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="p-8 flex flex-col items-center gap-4 h-full justify-center">
                    {t.photo?.asset ? (
                      <Image
                        src={urlFor(t.photo).width(128).height(128).url()}
                        alt={t.patientName ?? "Páciens"}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <PlaceholderAvatar />
                    )}
                    {t.patientName && (
                      <h3 className="text-lg font-bold text-primary">{t.patientName}</h3>
                    )}
                    {t.text && (
                      <p className="text-center text-sm text-gray-600 leading-relaxed line-clamp-4">
                        {t.text}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Dots */}
            {testimonials.length > 1 && (
              <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
                {testimonials.map((t, index) => (
                  <button
                    key={t._id}
                    type="button"
                    aria-label={t.patientName ?? `${index + 1}. vélemény`}
                    onClick={() => setCurrentIndex(index)}
                    className={[
                      "rounded-full transition-all duration-300",
                      index === currentIndex
                        ? "w-2 h-2 bg-primary"
                        : "w-1.5 h-1.5 bg-primary/25 hover:bg-primary/40",
                    ].join(" ")}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
