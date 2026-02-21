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
  { emoji: "\u2640\uFE0F", rotation: "rotate-12", colorClass: "text-yellow-900/10" },
  { emoji: "\uD83D\uDC76", rotation: "", colorClass: "text-green-900/10" },
  { emoji: "\uD83E\uDD30", rotation: "-rotate-12", colorClass: "text-purple-900/10" },
  { emoji: "\uD83D\uDC8A", rotation: "", colorClass: "text-blue-900/10" },
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
        const deco = cardDecorations[index % cardDecorations.length];
        return (
          <motion.div
            key={card._key}
            variants={item}
            className={[
              cardColors[index % cardColors.length],
              "p-8 rounded-[2rem] relative overflow-hidden h-[330px] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all duration-700 ease-out",
            ].join(" ")}
          >
            {/* Top: title + subtitle */}
            <div>
              {card.title && (
                <h3 className="text-2xl md:text-3xl font-extrabold text-primary leading-tight mb-2">
                  {card.title}
                </h3>
              )}
              {card.subtitle && (
                <p className="text-base font-medium text-gray-800/80">{card.subtitle}</p>
              )}
            </div>

            {/* Bottom-left: arrow button */}
            <div className="flex justify-between items-end relative z-10">
              <button
                type="button"
                className="relative w-12 h-12 bg-primary rounded-full flex items-center justify-center overflow-hidden transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[45deg]"
                aria-label={`${card.title ?? "Szolgáltatás"} részletei`}
              >
                {/* White fill expanding from center */}
                <span className="absolute -inset-3 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
                <svg
                  className="relative z-10 w-5 h-5 text-white transition-colors duration-700 ease-out group-hover:text-primary"
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
                "absolute -right-8 -bottom-8 text-[10rem] pointer-events-none select-none group-hover:scale-110 transition-transform duration-700 ease-out",
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
