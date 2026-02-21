"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_KEY = "morocz-intro-seen";
const DOCTOR_NAME = "Dr. Mórocz Angéla";
/** Pre-indexed character list — avoids array-index key lint warning */
const CHARACTERS: { pos: number; char: string }[] = DOCTOR_NAME.split("").map((char, pos) => ({
  pos,
  char,
}));

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "icon-fade"
  | "typewriter"
  | "slide-up"
  | "repeat-show"
  | "repeat-fade"
  | "reduced-show"
  | "reduced-fade"
  | "done";

// ─── IntroOverlay ─────────────────────────────────────────────────────────────

export function IntroOverlay() {
  const prefersReducedMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase | null>(null);
  const [pointerEventsNone, setPointerEventsNone] = useState(false);

  // Determine initial phase after mount (requires browser APIs)
  useEffect(() => {
    const hasSeen = sessionStorage.getItem(SESSION_KEY) === "1";

    if (prefersReducedMotion) {
      setPhase("reduced-show");
    } else if (hasSeen) {
      setPhase("repeat-show");
    } else {
      setPhase("icon-fade");
    }
  }, [prefersReducedMotion]);

  // Mark session on first-visit completion
  const handleSlideUpComplete = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setPhase("done");
  };

  // Fade-out complete for repeat / reduced
  const handleFadeComplete = () => {
    setPhase("done");
  };

  // Disable pointer events early so page is interactive during slide-up
  const handleSlideUpStart = () => {
    setPointerEventsNone(true);
  };

  // ── Phase not yet determined (SSR / first render) ──────────────────────────
  if (phase === null || phase === "done") {
    return null;
  }

  // ── Reduced motion: logo + name immediately, quick fade ───────────────────
  if (phase === "reduced-show" || phase === "reduced-fade") {
    return (
      <AnimatePresence>
        {phase === "reduced-show" && (
          <motion.div
            key="reduced"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              // Hold briefly then fade
              setTimeout(() => setPhase("reduced-fade"), 300);
            }}
          >
            <IntroContent showText />
          </motion.div>
        )}
        {phase === "reduced-fade" && (
          <motion.div
            key="reduced-fade"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={handleFadeComplete}
          >
            <IntroContent showText />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── Repeat visit: show briefly then fade ──────────────────────────────────
  if (phase === "repeat-show" || phase === "repeat-fade") {
    return (
      <AnimatePresence>
        {phase === "repeat-show" && (
          <motion.div
            key="repeat"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0 }}
            onAnimationComplete={() => {
              setTimeout(() => setPhase("repeat-fade"), 300);
            }}
          >
            <IntroContent showText />
          </motion.div>
        )}
        {phase === "repeat-fade" && (
          <motion.div
            key="repeat-fade"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={handleFadeComplete}
          >
            <IntroContent showText />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── First visit: full sequence ─────────────────────────────────────────────

  // Phase 1: icon fades in
  if (phase === "icon-fade") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
        style={{ pointerEvents: pointerEventsNone ? "none" : "auto" }}
      >
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onAnimationComplete={() => setPhase("typewriter")}
        >
          <IntroIcon />
        </motion.div>
      </motion.div>
    );
  }

  // Phase 2: typewriter
  if (phase === "typewriter") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
        style={{ pointerEvents: pointerEventsNone ? "none" : "auto" }}
      >
        <div className="flex items-center gap-4">
          <IntroIcon />
          <motion.span
            className="text-white font-bold text-2xl font-[var(--font-plus-jakarta-sans)]"
            aria-label={DOCTOR_NAME}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0,
                },
              },
            }}
            onAnimationComplete={() => setPhase("slide-up")}
          >
            {CHARACTERS.map(({ pos, char }) => (
              <motion.span
                key={pos}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.05 } },
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.span>
        </div>
      </motion.div>
    );
  }

  // Phase 3: slide-up reveal
  if (phase === "slide-up") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#23264F]"
        style={{ pointerEvents: pointerEventsNone ? "none" : "auto" }}
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.1 }}
        onAnimationStart={handleSlideUpStart}
        onAnimationComplete={handleSlideUpComplete}
      >
        <IntroContent showText />
      </motion.div>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntroIcon() {
  return (
    <Image src="/mm-logo-square.svg" alt="Mórocz Medical logó" width={48} height={48} priority />
  );
}

function IntroContent({ showText }: { showText: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <IntroIcon />
      {showText && (
        <span className="text-white font-bold text-2xl font-[var(--font-plus-jakarta-sans)]">
          {DOCTOR_NAME}
        </span>
      )}
    </div>
  );
}
