"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";

interface HeroServiceCardsProps {
  cards?: Array<{
    _key: string;
    title?: string;
    subtitle?: string;
    icon?: SanityImageObject;
  }>;
}

const cardColors = ["bg-yellow-card", "bg-green-card", "bg-purple-card", "bg-blue-card"];

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.6 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function HeroServiceCards({ cards }: HeroServiceCardsProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card._key}
          variants={item}
          className={`${cardColors[index % cardColors.length]} rounded-2xl p-5 flex flex-col gap-3`}
        >
          {card.icon && (
            <Image
              src={urlFor(card.icon).width(48).height(48).fit("crop").url()}
              alt={card.title ?? ""}
              className="w-12 h-12 object-contain"
              width={48}
              height={48}
            />
          )}
          {card.title && <p className="font-semibold text-primary">{card.title}</p>}
          {card.subtitle && <p className="text-sm text-primary/70">{card.subtitle}</p>}
        </motion.div>
      ))}
    </motion.div>
  );
}
