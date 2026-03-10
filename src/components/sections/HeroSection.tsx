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
  // Desktop: 600×700 (6:7 arány)
  const doctorImageUrl = doctorImage
    ? urlFor(doctorImage).width(600).height(700).fit("crop").url()
    : null;

  // Mobil: 480px — elég a ~80vw megjelenítéshez (max 430px eszközök),
  // drop-shadow eltávolítva (CSS filter nagyon drága mobilon)
  const mobileDoctorImageUrl = doctorImage ? urlFor(doctorImage).width(480).url() : null;

  const leftBadge = badges?.[0];
  const rightBadge = badges?.[1];

  const ctaButton = (
    <a href="/idopontfoglalas" className="group relative inline-flex items-center">
      {/* Left circle — hidden by default, scales in on hover */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-[#e1bbcd] text-primary rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 12h14m0 0l-5-5m5 5l-5 5"
          />
        </svg>
      </span>
      {/* Pill — slides right on hover */}
      <span className="inline-flex items-center h-14 rounded-full bg-[#e1bbcd] text-primary px-8 font-bold text-sm whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-x-14">
        Foglaljon időpontot
      </span>
      {/* Right circle — scales out to 0 on hover */}
      <span className="w-14 h-14 flex items-center justify-center bg-[#e1bbcd] text-primary rounded-full shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-0">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 12h14m0 0l-5-5m5 5l-5 5"
          />
        </svg>
      </span>
    </a>
  );

  return (
    <section
      aria-labelledby="hero-cim"
      className="relative bg-primary rounded-[2.5rem] overflow-hidden text-white px-8 lg:px-16 min-h-[580px] md:min-h-[560px] flex flex-col justify-between"
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]" />

      {/* Headline — upper area (both mobile & desktop) */}
      {/* Mobilon pt-10 (2.5rem) → elég tér a nav alatt; desktopon pt-12 */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-center pointer-events-none px-8 pt-10 lg:pt-12">
        <HeroHeadline id="hero-cim" text={headline ?? "Mórocz Medical"} />
      </div>

      {/* Left badge */}
      {leftBadge && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8, type: "spring", bounce: 0.3 }}
          className="absolute bottom-[38%] left-[12%] xl:left-[18%] hidden lg:flex items-center gap-3 z-10"
        >
          {leftBadge.emoji && (
            <div className="bg-purple-card w-10 h-10 rounded-full flex items-center justify-center">
              <span className="text-lg">{leftBadge.emoji}</span>
            </div>
          )}
          <span className="text-lg font-light text-white">{leftBadge.text}</span>
        </motion.div>
      )}

      {/* Right badge */}
      {rightBadge && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.0, type: "spring", bounce: 0.3 }}
          className="absolute bottom-[38%] right-[12%] xl:right-[18%] hidden lg:flex items-center gap-3 z-10"
        >
          {rightBadge.emoji && (
            <div className="bg-green-card w-10 h-10 rounded-full flex items-center justify-center">
              <span className="text-lg">{rightBadge.emoji}</span>
            </div>
          )}
          <span className="text-lg font-light text-white">{rightBadge.text}</span>
        </motion.div>
      )}

      {/* ===== MOBIL LAYOUT ===== */}

      {/*
        Profil kép — 80% szélesség, középre igazítva.
        - drop-shadow ELTÁVOLÍTVA: CSS filter nagyon drága mobilon, minden repaintnél GPU pass kell
        - 480px Sanity URL: elég a ~80vw megjelenítéshez mobilon
        - w-full h-auto: eredeti arány megmarad, nincs crop
        - sizes prop: Next.js Image optimalizáció
      */}
      <div className="md:hidden absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-[80%]">
        <FadeIn direction="up" delay={0.4}>
          {mobileDoctorImageUrl ? (
            <Image
              src={mobileDoctorImageUrl}
              alt="Dr. Mórocz"
              width={480}
              height={640}
              priority
              sizes="80vw"
              className="w-full h-auto"
            />
          ) : (
            <div className="w-full h-[280px] bg-white/5 flex items-center justify-center text-white/30 text-sm">
              Orvos kép
            </div>
          )}
        </FadeIn>
      </div>

      {/*
        Mobil CTA gomb — bal oldal, alul.
      */}
      <div className="md:hidden absolute bottom-6 left-6 z-20">
        <FadeIn direction="up" delay={0.8}>
          <a
            href="/idopontfoglalas"
            className="inline-flex items-center gap-3 rounded-full bg-[#e1bbcd] text-primary font-bold text-sm pl-6 pr-2.5 py-3.5 shadow-lg active:scale-95 transition-transform"
          >
            Foglaljon időpontot
            <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 12h14m0 0l-5-5m5 5l-5 5"
                />
              </svg>
            </span>
          </a>
        </FadeIn>
      </div>

      {/* ===== DESKTOP LAYOUT (md+) ===== */}
      <div className="hidden md:flex flex-row items-end justify-between relative z-10 mt-auto">
        {/* Bottom-left: description text */}
        <FadeIn direction="up" delay={0.6}>
          <div className="mb-16 text-base text-gray-300 font-semibold max-w-xs leading-relaxed uppercase tracking-wide">
            {subtitle ??
              "MODERN NŐGYÓGYÁSZATI ELLÁTÁS ESZTERGOMBAN. FOGLALJON IDŐPONTOT PERCEK ALATT!"}
          </div>
        </FadeIn>

        {/* Bottom-center: doctor image */}
        <div className="w-1/3 flex justify-center relative">
          <FadeIn direction="up" delay={0.4}>
            {doctorImageUrl ? (
              <Image
                src={doctorImageUrl}
                alt="Dr. Mórocz"
                className="h-[480px] object-cover object-top drop-shadow-2xl"
                width={400}
                height={480}
                priority
                sizes="(min-width: 768px) 33vw, 0px"
              />
            ) : (
              <div className="h-[480px] w-64 bg-white/5 rounded-t-3xl flex items-center justify-center text-white/30 text-sm">
                Orvos kép
              </div>
            )}
          </FadeIn>
        </div>

        {/* Bottom-right: CTA pill button */}
        <FadeIn direction="up" delay={0.8}>
          <div className="flex justify-end mb-16">{ctaButton}</div>
        </FadeIn>
      </div>
    </section>
  );
}
