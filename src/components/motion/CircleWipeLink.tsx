"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CircleWipeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the href should trigger a circle wipe transition.
 *
 * Triggers when:
 *   - current page is the homepage (pathname === "/")
 *   - href is an internal path (starts with "/")
 *   - href is NOT an anchor link (does not start with "#")
 *
 * Excluded: anchor links (#section), external links, tel:, mailto:
 */
function shouldWipe(href: string, currentPathname: string): boolean {
  // Must be on the homepage
  if (currentPathname !== "/") return false;
  // Must be an internal path (not anchor, not external, not tel:/mailto:)
  if (!href.startsWith("/")) return false;
  return true;
}

// ─── CircleWipeLink ───────────────────────────────────────────────────────────

export function CircleWipeLink({ href, children, className }: CircleWipeLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const [isWiping, setIsWiping] = useState(false);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!shouldWipe(href, pathname)) {
      // Non-homepage or non-internal links — let Next.js Link handle it normally
      return;
    }

    e.preventDefault();

    if (prefersReducedMotion) {
      // Respect reduced motion: navigate immediately with no animation
      router.push(href);
      return;
    }

    setIsWiping(true);
  };

  const handleAnimationComplete = () => {
    router.push(href);
  };

  return (
    <>
      <Link href={href} onClick={handleClick} className={className}>
        {children}
      </Link>

      {isWiping &&
        typeof document !== "undefined" &&
        createPortal(
          <motion.div
            className="fixed inset-0 z-[60] bg-[#F4DCD6]"
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: "circle(150% at 50% 50%)" }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            onAnimationComplete={handleAnimationComplete}
          >
            {/* Center white dot — visible at end state when circle is full */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full" />
          </motion.div>,
          document.body,
        )}
    </>
  );
}
