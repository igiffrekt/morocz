"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";
import { HeroHeadline } from "./HeroHeadline";

interface HeroSectionProps {
  headline?: string;
  subtitle?: string;
  badges?: Array<{ _key: string; emoji?: string; text?: string }>;
  doctorImage?: SanityImageObject;
  phone?: string;
}

export function HeroSection({ headline, subtitle, badges, doctorImage, phone }: HeroSectionProps) {
  const doctorImageUrl = doctorImage
    ? urlFor(doctorImage).width(600).height(700).fit("crop").url()
    : null;

  // Split badges into left and right groups for floating positioning
  const leftBadges = badges?.slice(0, 1) ?? [];
  const rightBadges = badges?.slice(1, 2) ?? [];

  return (
    <section className="relative bg-primary rounded-[2rem] overflow-hidden text-white pt-16 px-8 lg:px-16 min-h-[560px] flex flex-col justify-between">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]" />

      {/* Top: massive centered headline */}
      <div className="relative z-10 w-full text-center mb-4">
        <HeroHeadline text={headline ?? "Egészség"} />
      </div>

      {/* Floating badges — left side */}
      {leftBadges.map((badge) => (
        <motion.div
          key={badge._key}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8, type: "spring", bounce: 0.3 }}
          className="absolute top-48 left-[10%] hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg"
        >
          {badge.emoji && (
            <div className="bg-secondary/20 p-1.5 rounded-full">
              <span className="text-pink-200">{badge.emoji}</span>
            </div>
          )}
          <span className="text-sm font-medium">{badge.text}</span>
        </motion.div>
      ))}

      {/* Floating badges — right side */}
      {rightBadges.map((badge) => (
        <motion.div
          key={badge._key}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0, type: "spring", bounce: 0.3 }}
          className="absolute top-48 right-[10%] hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg"
        >
          {badge.emoji && (
            <div className="bg-accent/20 p-1.5 rounded-full">
              <span className="text-green-200">{badge.emoji}</span>
            </div>
          )}
          <span className="text-sm font-medium">{badge.text}</span>
        </motion.div>
      ))}

      {/* Any extra badges (3rd+) float further down */}
      {badges?.slice(2).map((badge, i) => (
        <motion.div
          key={badge._key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 + i * 0.2 }}
          className="absolute hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg"
          style={{
            top: `${320 + i * 60}px`,
            left: i % 2 === 0 ? "8%" : undefined,
            right: i % 2 === 1 ? "8%" : undefined,
          }}
        >
          {badge.emoji && (
            <div className="bg-white/20 p-1.5 rounded-full">
              <span>{badge.emoji}</span>
            </div>
          )}
          <span className="text-sm font-medium">{badge.text}</span>
        </motion.div>
      ))}

      {/* Bottom layout: 3-column flex — description | doctor image | CTA */}
      <div className="w-full flex flex-col md:flex-row items-end justify-between relative z-10 mt-auto">
        {/* Bottom-left: description text */}
        <FadeIn direction="up" delay={0.6}>
          <div className="md:w-full mb-16 text-sm text-gray-300 font-medium max-w-xs leading-relaxed hidden md:block">
            {subtitle ??
              "Professzionális egészségügyi szolgáltatások, személyre szabott kezelési tervek és gondoskodó orvosi ellátás."}
          </div>
        </FadeIn>

        {/* Bottom-center: doctor image */}
        <div className="md:w-1/3 flex justify-center relative">
          <FadeIn direction="up" delay={0.4}>
            {doctorImageUrl ? (
              <Image
                src={doctorImageUrl}
                alt="Dr. Morocz"
                className="h-96 md:h-[480px] object-cover object-top drop-shadow-2xl"
                width={400}
                height={480}
              />
            ) : (
              <div className="h-96 md:h-[480px] w-64 bg-white/5 rounded-t-3xl flex items-center justify-center text-white/30 text-sm">
                Orvos kép
              </div>
            )}
          </FadeIn>
        </div>

        {/* Bottom-right: CTA pill button */}
        <FadeIn direction="up" delay={0.8}>
          <div className="md:w-full flex justify-end mb-16 w-full md:w-auto">
            <a
              href={phone ? `tel:${phone}` : "#kapcsolat"}
              className="group flex items-center gap-4 bg-secondary text-primary pl-8 pr-2 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-secondary/20"
            >
              Foglaljon időpontot
              <span className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full group-hover:bg-primary/90 transition-colors">
                <svg
                  className="w-4 h-4"
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
              </span>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
