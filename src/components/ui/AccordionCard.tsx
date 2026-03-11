"use client";

import { AnimatePresence, motion } from "motion/react";

export interface AccordionItemProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: string;
}

interface AccordionCardProps {
  card: AccordionItemProps;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

const accordionSpring = { type: "spring", stiffness: 320, damping: 26 };

export default function AccordionCard({
  card,
  index,
  isOpen,
  onToggle,
}: AccordionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-[0_2px_16px_rgba(36,42,95,0.04)] transition-[background-color,border-color,box-shadow] duration-500 ease-out hover:bg-white/80 hover:border-white/90 hover:shadow-[0_8px_32px_rgba(36,42,95,0.08)]">
      {/* Decorative number watermark */}
      <span className="absolute -top-2 -right-1 text-[4.5rem] font-black text-primary/[0.04] leading-none select-none pointer-events-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Trigger */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-left relative z-10 flex items-center gap-2.5 p-4 md:px-5 cursor-pointer group"
      >
        {/* Icon */}
        <motion.span
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          animate={{
            color: isOpen ? "rgba(36,42,95,1)" : "rgba(36,42,95,0.4)",
            backgroundColor: isOpen ? "rgba(36,42,95,0.1)" : "rgba(36,42,95,0.05)",
            borderColor: isOpen ? "rgba(36,42,95,0.15)" : "rgba(36,42,95,0.08)",
          }}
          style={{ borderWidth: 1 }}
          transition={{ duration: 0.35 }}
        >
          {card.icon}
        </motion.span>

        {/* Title */}
        <motion.span
          className="flex-1 text-[0.85rem] font-bold leading-snug"
          animate={{
            color: isOpen ? "rgba(36,42,95,1)" : "rgba(36,42,95,0.6)",
          }}
          transition={{ duration: 0.3 }}
        >
          {card.title}
        </motion.span>

        {/* Plus → X indicator */}
        <motion.span
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={accordionSpring}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <motion.path
              d="M8 1V15M1 8H15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{
                color: isOpen ? "rgba(36,42,95,0.8)" : "rgba(36,42,95,0.2)",
              }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        </motion.span>
      </button>

      {/* Animated accent underline */}
      <motion.div
        className="absolute bottom-0 left-0 h-px bg-primary/40 origin-left"
        initial={false}
        animate={{ scaleX: isOpen ? 1 : 0 }}
        transition={accordionSpring}
      />

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { type: "tween", duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.25, delay: 0.08 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { type: "tween", duration: 0.25, ease: [0.5, 0, 0.75, 0] },
                opacity: { duration: 0.12 },
              },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 md:px-5 pb-4 md:pb-5 pl-[3rem] md:pl-[3.25rem]">
              <motion.p
                className="text-sm text-primary/70 leading-relaxed whitespace-pre-wrap"
                initial={{ y: -6 }}
                animate={{ y: 0 }}
                exit={{ y: -6 }}
                transition={accordionSpring}
              >
                {card.body}
              </motion.p>

              {card.highlight && (
                <motion.div
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/[0.06] border border-primary/[0.1] rounded-full px-3 py-1.5"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                  {card.highlight}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
