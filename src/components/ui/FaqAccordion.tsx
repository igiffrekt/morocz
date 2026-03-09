"use client";

import { AnimatePresence, motion, type Transition } from "motion/react";
import { useState } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

const spring: Transition = { type: "spring", stiffness: 350, damping: 28 };

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="space-y-0">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const isHovered = hoveredIndex === index;
          const number = String(index + 1).padStart(2, "0");

          return (
            <div key={item.question}>
              <motion.button
                onClick={() => setActiveIndex(isActive ? null : index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="w-full group relative text-left"
                initial={false}
              >
                <div className="flex items-center gap-5 py-5 px-1">
                  {/* Number with animated circle */}
                  <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary"
                      initial={false}
                      animate={{
                        scale: isActive ? 1 : isHovered ? 0.85 : 0,
                        opacity: isActive ? 1 : isHovered ? 0.12 : 0,
                      }}
                      transition={spring}
                    />
                    <motion.span
                      className="relative z-10 text-xs font-semibold tracking-wide"
                      animate={{
                        color: isActive ? "#ffffff" : "#9ca3af",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {number}
                    </motion.span>
                  </div>

                  {/* Title */}
                  <motion.h3
                    className="text-lg font-semibold tracking-tight flex-1"
                    animate={{
                      x: isActive || isHovered ? 3 : 0,
                      color: isActive || isHovered ? "#242a5f" : "#6b7280",
                    }}
                    transition={spring}
                  >
                    {item.question}
                  </motion.h3>

                  {/* Animated + / x indicator */}
                  <div className="ml-auto flex items-center shrink-0">
                    <motion.div
                      className="flex items-center justify-center w-7 h-7"
                      animate={{ rotate: isActive ? 45 : 0 }}
                      transition={spring}
                    >
                      <motion.svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-primary"
                        animate={{ opacity: isActive || isHovered ? 1 : 0.35 }}
                        transition={{ duration: 0.2 }}
                        aria-hidden="true"
                      >
                        <motion.path
                          d="M8 1V15M1 8H15"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          initial={false}
                        />
                      </motion.svg>
                    </motion.div>
                  </div>
                </div>

                {/* Base underline */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 origin-left"
                  initial={false}
                />
                {/* Animated accent underline */}
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-accent origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: isActive ? 1 : isHovered ? 0.3 : 0,
                  }}
                  transition={spring}
                />
              </motion.button>

              {/* Content */}
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: spring,
                        opacity: { duration: 0.2, delay: 0.1 },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: spring,
                        opacity: { duration: 0.1 },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <motion.p
                      className="pl-[3.5rem] pr-10 py-4 text-gray-600 leading-relaxed"
                      initial={{ y: -8 }}
                      animate={{ y: 0 }}
                      exit={{ y: -8 }}
                      transition={spring}
                    >
                      {item.answer}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
