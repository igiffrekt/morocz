"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface StaggerChildrenProps {
  staggerDelay?: number;
  viewport?: boolean;
  children: ReactNode;
  className?: string;
}

export function StaggerChildren({
  staggerDelay = 0.1,
  viewport = false,
  children,
  className,
}: StaggerChildrenProps) {
  const variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const animationProps = viewport
    ? {
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.2 },
      }
    : {
        animate: "visible" as const,
      };

  return (
    <motion.div initial="hidden" variants={variants} className={className} {...animationProps}>
      {children}
    </motion.div>
  );
}
