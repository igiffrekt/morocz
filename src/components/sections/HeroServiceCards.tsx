"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { SanityImageCrop, SanityImageHotspot } from "../../../sanity.types";

// Type definition for Sanity image objects
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

interface HeroServiceCardsProps {
  cards?: Array<{
    _key: string;
    title?: string;
    subtitle?: string;
    icon?: SanityImageObject;
    href?: string;
  }>;
}

// Mobilon hosszú magyar összetett szavak törése kötőjellel
function formatCardTitle(title: string): string {
  return title
    .replace("Várandósgondozás", "Várandós-\ngondozás")
    .replace("várandósgondozás", "várandós-\ngondozás")
    .replace("Gyógyszerfelírás", "Gyógyszer-\nfelírás")
    .replace("gyógyszerfelírás", "gyógyszer-\nfelírás");
}

const cardStyles = [
  { bg: "bg-yellow-card", title: "text-primary", subtitle: "text-primary/70" },
  { bg: "bg-green-card", title: "text-white", subtitle: "text-white/80" },
  { bg: "bg-purple-card", title: "text-white", subtitle: "text-white/80" },
  { bg: "bg-blue-card", title: "text-white", subtitle: "text-white/80" },
];

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
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
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map((card, index) => {
        const style = cardStyles[index % cardStyles.length];
        const cardClass = [
          style.bg,
          "block p-5 md:p-6 rounded-[2rem] relative overflow-hidden h-[140px] md:h-[165px] flex flex-col justify-start group cursor-pointer hover:shadow-lg transition-all duration-500 ease-out",
        ].join(" ");

        const cardContent = (
          <div>
            {card.title && (
              <h3 className={`text-lg md:text-xl lg:text-2xl font-extrabold leading-tight mb-1 whitespace-pre-line ${style.title}`}>
                {formatCardTitle(card.title)}
              </h3>
            )}
            {card.subtitle && (
              <p className={`text-xs md:text-sm font-medium ${style.subtitle}`}>
                {card.subtitle}
              </p>
            )}
          </div>
        );

        return (
          <motion.div key={card._key} variants={item}>
            {card.href ? (
              <Link href={card.href} className={cardClass}>
                {cardContent}
              </Link>
            ) : (
              <div className={cardClass}>
                {cardContent}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.section>
  );
}
