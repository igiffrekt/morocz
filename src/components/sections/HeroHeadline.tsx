"use client";

import { motion } from "motion/react";

interface HeroHeadlineProps {
  text: string;
}

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.2 },
  },
};

const child = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function HeroHeadline({ text }: HeroHeadlineProps) {
  const characters = text.split("");

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      className="text-6xl md:text-8xl lg:text-[10rem] font-extrabold tracking-tighter text-white/95 leading-none text-center"
    >
      {characters.map((char, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: letter-by-letter animation requires stable position keys
        <motion.span key={`char-${index}`} variants={child} style={{ display: "inline-block" }}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}
