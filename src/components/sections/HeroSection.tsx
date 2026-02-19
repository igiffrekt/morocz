"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";
import { HeroHeadline } from "./HeroHeadline";
import { HeroServiceCards } from "./HeroServiceCards";

interface HeroSectionProps {
  headline?: string;
  subtitle?: string;
  badges?: Array<{ _key: string; emoji?: string; text?: string }>;
  doctorImage?: SanityImageObject;
  cards?: Array<{
    _key: string;
    title?: string;
    subtitle?: string;
    icon?: SanityImageObject;
  }>;
  phone?: string;
}

export function HeroSection({
  headline,
  subtitle,
  badges,
  doctorImage,
  cards,
  phone,
}: HeroSectionProps) {
  return (
    <section className="max-w-[88rem] mx-auto px-6 pt-28 pb-8">
      {/* pt-28 accounts for fixed header height */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left column: headline + subtitle + badges + CTA */}
        <div>
          <HeroHeadline text={headline ?? ""} />

          {/* Subtitle (HERO-04) */}
          <FadeIn direction="up" delay={0.5}>
            <p className="text-lg text-text-light/70 mt-6 max-w-lg">{subtitle}</p>
          </FadeIn>

          {/* Badges (HERO-03) — below headline on mobile, inline on desktop */}
          {badges && badges.length > 0 && (
            <FadeIn direction="up" delay={0.7}>
              <div className="flex flex-wrap gap-3 mt-6">
                {badges.map((badge) => (
                  <motion.div
                    key={badge._key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.8,
                      type: "spring",
                      bounce: 0.4,
                    }}
                    className="bg-surface-white shadow-md rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-medium"
                  >
                    {badge.emoji && <span>{badge.emoji}</span>}
                    <span>{badge.text}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          )}

          {/* CTA button (HERO-05) */}
          <FadeIn direction="up" delay={0.9}>
            <a
              href={phone ? `tel:${phone}` : "#kapcsolat"}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-semibold mt-8 group hover:bg-primary/90 transition-colors"
            >
              Foglaljon idopontot
              {/* Arrow icon that slides right on hover */}
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </FadeIn>
        </div>

        {/* Right column: Doctor image (HERO-02) — hidden on mobile (locked decision) */}
        <div className="hidden md:block relative">
          <FadeIn direction="right" delay={0.4}>
            {doctorImage ? (
              <Image
                src={urlFor(doctorImage).width(600).height(700).fit("crop").url()}
                alt="Dr. Morocz"
                className="rounded-3xl w-full object-cover"
                width={600}
                height={700}
              />
            ) : (
              <div className="bg-secondary/30 rounded-3xl w-full aspect-[6/7] flex items-center justify-center text-primary/40">
                Orvos kep
              </div>
            )}
          </FadeIn>
        </div>
      </div>

      {/* Service cards row below hero (HERO-06) */}
      <div className="mt-12">
        <HeroServiceCards cards={cards} />
      </div>
    </section>
  );
}
