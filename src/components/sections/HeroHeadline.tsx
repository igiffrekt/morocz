"use client";

import { motion } from "motion/react";

interface HeroHeadlineProps {
  text: string;
  id?: string;
}

// Word-level animation — 2 elem mobilon vs. előző 14+ karakter-szintű span.
// Sokkal kisebb GPU terhelés, a vizuális hatás megmarad.
const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const wordVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

export function HeroHeadline({ text, id }: HeroHeadlineProps) {
  const words = text.split(" ");

  return (
    <motion.h1
      id={id}
      variants={container}
      initial="hidden"
      animate="visible"
      // Mobilon: flex flex-col → szavak egymás alatt, gap-0 → nincs sortávolság
      // Desktopon: md:block → inline szavak egy sorban
      className="text-8xl sm:text-9xl md:text-8xl lg:text-[8rem] xl:text-[10rem] font-extrabold tracking-tighter text-[#dae8fe] text-center flex flex-col gap-0 md:block"
    >
      {words.map((w, wi) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: word position is stable
        <motion.span key={wi} variants={wordVariant} className="block md:inline leading-none">
          {w}
          {/* Desktop: szóköz a szavak között */}
          {wi < words.length - 1 && <span className="hidden md:inline">&nbsp;</span>}
        </motion.span>
      ))}
    </motion.h1>
  );
}
