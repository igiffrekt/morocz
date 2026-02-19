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
      className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight"
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
