"use client";

import Link from "next/link";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/cn";
import { telHref } from "@/lib/site-nav";
import { ArrowRightIcon, PhoneIcon } from "./icons";
import { useSiteContact } from "./SiteContext";

interface MobileActionBarProps {
  /** Booking target (defaults to the booking wizard). */
  bookingHref?: string;
  bookingLabel?: string;
  /** Replaces the round call button (e.g. a "Árak" sheet trigger on service pages). */
  leading?: ReactNode;
  className?: string;
}

/**
 * Floating bottom bar for phones (< lg): round call button + navy "Időpontfoglalás".
 * Opt-in per page — render it anywhere in the page tree; it reads the phone number
 * from <SiteContactProvider> and, while mounted, flags <body> so the footer grows a
 * bottom padding and the bar never covers the legal links.
 */
export function MobileActionBar({
  bookingHref = "/idopontfoglalas",
  bookingLabel = "Időpontfoglalás",
  leading,
  className,
}: MobileActionBarProps) {
  const contact = useSiteContact();

  useEffect(() => {
    document.body.setAttribute("data-mobile-action-bar", "");
    return () => document.body.removeAttribute("data-mobile-action-bar");
  }, []);

  return (
    <div
      className={cn(
        "fixed right-3 bottom-[max(14px,env(safe-area-inset-bottom))] left-3 z-30 flex gap-2 rounded-full bg-white/82 p-1.5 shadow-float backdrop-blur-[16px] lg:hidden",
        className,
      )}
    >
      {leading}
      {!leading && contact?.phone && (
        <a
          href={telHref(contact.phone)}
          aria-label={`Hívás: ${contact.phone}`}
          className="tap-press inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-sage text-navy"
        >
          <PhoneIcon size={20} />
        </a>
      )}
      <Link
        href={bookingHref}
        className="tap-press inline-flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full bg-navy text-base font-extrabold whitespace-nowrap text-white no-underline"
      >
        {bookingLabel}
        <ArrowRightIcon size={18} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
