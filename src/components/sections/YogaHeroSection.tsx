"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageCrop, SanityImageHotspot } from "../../../sanity.types";

type SanityImageObject = {
  asset?: {
    _ref: string;
    _type: "reference";
  };
  media?: unknown;
  hotspot?: SanityImageHotspot;
  crop?: SanityImageCrop;
  _type: "image";
};

interface YogaHeroSectionProps {
  headline?: string;
  subtitle?: string;
  badges?: Array<{ _key: string; emoji?: string; text?: string }>;
  heroImage?: SanityImageObject;
}

export function YogaHeroSection({
  headline,
  subtitle,
  badges,
  heroImage,
}: YogaHeroSectionProps) {
  const heroImageUrl = heroImage
    ? urlFor(heroImage).width(600).height(500).fit("crop").url()
    : null;

  const mobileHeroImageUrl = heroImage
    ? urlFor(heroImage).width(800).height(400).fit("crop").url()
    : null;

  const leftBadge = badges?.[0];
  const rightBadge = badges?.[1];

  return (
    <>
      {/* Mobile Hero */}
      <section
        aria-labelledby="yoga-hero-cim-mobile"
        className="md:hidden relative rounded-[2rem] overflow-hidden min-h-[280px]"
      >
        {/* Background image */}
        {mobileHeroImageUrl && (
          <Image
            src={mobileHeroImageUrl}
            alt="Jóga"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full min-h-[280px] p-6 pb-8">
          <FadeIn direction="up" delay={0.2}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-white/70 mb-3">
              <span className="w-6 h-px bg-white/50" />
              Jóga
            </span>
          </FadeIn>

          <FadeIn direction="up" delay={0.3}>
            <h1
              id="yoga-hero-cim-mobile"
              className="text-3xl font-extrabold leading-tight text-white mb-2"
            >
              {headline || "Fedezd fel a jóga nyugalmát"}
            </h1>
          </FadeIn>

          {subtitle && (
            <FadeIn direction="up" delay={0.4}>
              <p className="text-sm text-white/80 leading-relaxed max-w-xs">
                {subtitle}
              </p>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Desktop Hero */}
      <section
        aria-labelledby="yoga-hero-cim"
        className="hidden md:flex relative bg-primary rounded-[2.5rem] overflow-hidden text-white px-8 lg:px-16 min-h-[500px] flex-col"
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:24px_24px]" />

        {/* Main content */}
        <div className="relative z-10 flex flex-row items-end justify-between flex-1 py-16 gap-8">
          {/* Left: Text content */}
          <div className="flex-1 max-w-xl">
            <FadeIn direction="up" delay={0.2}>
              <span className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-white/60 mb-4">
                <span className="w-8 h-px bg-white/40" />
                Jóga
              </span>
            </FadeIn>

            <FadeIn direction="up" delay={0.3}>
              <h1
                id="yoga-hero-cim"
                className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
              >
                {headline || "Fedezd fel a jóga nyugalmát"}
              </h1>
            </FadeIn>

            <FadeIn direction="up" delay={0.4}>
              <p className="text-lg text-white/80 leading-relaxed max-w-md">
                {subtitle ||
                  "Csatlakozz heti jógaóráinkhoz és találd meg a belső egyensúlyt tapasztalt oktatóink vezetésével."}
              </p>
            </FadeIn>
          </div>

          {/* Right: Image */}
          <div className="relative flex-shrink-0">
            {/* Badges */}
            {leftBadge && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8, type: "spring", bounce: 0.3 }}
                className="absolute top-8 -left-4 lg:-left-16 flex items-center gap-3 z-20"
              >
                {leftBadge.emoji && (
                  <div className="bg-[#e1bbcd] w-10 h-10 rounded-full flex items-center justify-center">
                    <span className="text-lg">{leftBadge.emoji}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-white bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {leftBadge.text}
                </span>
              </motion.div>
            )}

            {rightBadge && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0, type: "spring", bounce: 0.3 }}
                className="absolute bottom-16 -right-4 lg:-right-16 flex items-center gap-3 z-20"
              >
                {rightBadge.emoji && (
                  <div className="bg-[#99CEB7] w-10 h-10 rounded-full flex items-center justify-center">
                    <span className="text-lg">{rightBadge.emoji}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-white bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {rightBadge.text}
                </span>
              </motion.div>
            )}

            <FadeIn direction="up" delay={0.4}>
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt="Jóga"
                  width={500}
                  height={420}
                  priority
                  className="rounded-3xl object-cover"
                  sizes="500px"
                />
              ) : (
                <div className="w-[500px] h-[420px] bg-white/5 rounded-3xl flex items-center justify-center text-white/30 text-6xl">
                  🧘
                </div>
              )}
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
