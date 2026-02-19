"use client";

import { motion } from "motion/react";
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

const cardDecorations = [
  { emoji: "\uD83E\uDE7A", rotation: "rotate-12", colorClass: "text-yellow-900/10" },
  { emoji: "\uD83D\uDD2C", rotation: "", colorClass: "text-green-900/10" },
  { emoji: "\uD83D\uDC8A", rotation: "-rotate-12", colorClass: "text-purple-900/10" },
  { emoji: "\uD83E\uDDEA", rotation: "", colorClass: "text-blue-900/10" },
];

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
    <motion.section
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {cards.map((card, index) => {
        const deco = cardDecorations[index % cardDecorations.length];
        return (
          <motion.div
            key={card._key}
            variants={item}
            className={[
              cardColors[index % cardColors.length],
              "p-8 rounded-[2rem] relative overflow-hidden h-[300px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all duration-300",
            ].join(" ")}
          >
            {/* Top: title + subtitle */}
            <div>
              {card.title && (
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {card.title}
                </h3>
              )}
              {card.subtitle && (
                <p className="text-sm font-medium text-gray-800/80">{card.subtitle}</p>
              )}
            </div>

            {/* Bottom-left: arrow button */}
            <div className="flex justify-between items-end relative z-10">
              <button
                type="button"
                className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                aria-label={`${card.title ?? "Szolgáltatás"} részletei`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17L17 7M17 7H7M17 7v10"
                  />
                </svg>
              </button>
            </div>

            {/* Background decorative element */}
            <span
              className={[
                "absolute -right-8 -bottom-8 text-[10rem] pointer-events-none select-none group-hover:scale-110 transition-transform duration-500",
                deco.rotation,
                deco.colorClass,
              ].join(" ")}
              aria-hidden="true"
            >
              {deco.emoji}
            </span>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
