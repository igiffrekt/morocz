"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface StaggerChildrenProps {
  staggerDelay?: number;
  children: ReactNode;
  className?: string;
}

export function StaggerChildren({ staggerDelay = 0.1, children, className }: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
