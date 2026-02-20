"use client";

import { motion } from "motion/react";

interface HeroHeadlineProps {
  text: string;
  id?: string;
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

export function HeroHeadline({ text, id }: HeroHeadlineProps) {
  const characters = text.split("");

  return (
    <motion.h1
      id={id}
      variants={container}
      initial="hidden"
      animate="visible"
      className="text-5xl md:text-8xl lg:text-[8rem] xl:text-[10rem] font-extrabold tracking-tighter text-[#dae8fe] leading-none text-center whitespace-nowrap"
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
