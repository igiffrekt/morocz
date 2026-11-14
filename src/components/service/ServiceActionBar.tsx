"use client";

import { type ReactNode, useState } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { Sheet } from "@/components/ui/Modal";
import { CLOCK_ICON } from "./service-meta";

interface ServiceActionBarProps {
  bookingHref: string;
  /** Sheet trigger label ("Árak" / "Rendelési idő"). */
  label: string;
  sheetTitle: string;
  /** The sheet shows opening hours (clock icon) rather than prices. */
  schedule?: boolean;
  /** Sheet body, rendered on the server. */
  children: ReactNode;
}

/**
 * MobilSzolgaltatas bottom bar: "Árak" opens a bottom sheet with the Sanity prices (or the
 * opening hours), the navy pill goes to the booking wizard.
 */
export function ServiceActionBar({
  bookingHref,
  label,
  sheetTitle,
  schedule = false,
  children,
}: ServiceActionBarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileActionBar
        bookingHref={bookingHref}
        leading={
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className="tap-press inline-flex h-[52px] shrink-0 items-center gap-2 rounded-full border-0 bg-sage px-5 text-[15px] font-extrabold whitespace-nowrap text-navy"
          >
            <PathIcon d={schedule ? CLOCK_ICON : ICON_PATHS.coin} size={18} strokeWidth={2} />
            {label}
          </button>
        }
      />
      <Sheet open={open} onClose={() => setOpen(false)} title={sheetTitle} size="md">
        <div className="flex flex-col gap-2.5 text-navy">{children}</div>
      </Sheet>
    </>
  );
}
