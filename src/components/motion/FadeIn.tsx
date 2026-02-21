"use client";

import type { HTMLMotionProps, Transition } from "motion/react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "viewport"> {
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  viewport?: boolean;
  children: ReactNode;
}

export function FadeIn({
  direction = "up",
  delay = 0,
  duration = 0.5,
  viewport = false,
  children,
  ...props
}: FadeInProps) {
  const directionOffset = {
    up: { y: 24 },
    down: { y: -24 },
    left: { x: 24 },
    right: { x: -24 },
    none: {},
  };

  const initial = { opacity: 0, ...directionOffset[direction] };
  const animatedState = { opacity: 1, x: 0, y: 0 };
  const transition: Transition = { duration, delay, ease: "easeOut" };

  const animationProps = viewport
    ? {
        whileInView: animatedState,
        viewport: { once: true, amount: 0.2 },
      }
    : {
        animate: animatedState,
      };

  return (
    <motion.div initial={initial} transition={transition} {...animationProps} {...props}>
      {children}
    </motion.div>
  );
}
