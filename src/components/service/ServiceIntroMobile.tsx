"use client";

import { useId, useState } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { Collapse } from "@/components/ui/Accordion";
import { cn } from "@/lib/cn";

/** Phones: first intro paragraph, the rest behind "Tovább olvasom" (MobilSzolgaltatas). */
export function ServiceIntroMobile({ intro }: { intro: string[] }) {
  const [open, setOpen] = useState(false);
  const panelId = `${useId().replace(/:/g, "")}-intro`;
  const [first, ...rest] = intro;
  if (!first) return null;
  return (
    <section
      aria-label="Bevezető"
      className="mt-3 flex flex-col gap-3 rounded-tile bg-white px-5 pt-5 pb-4 md:hidden"
    >
      {/* No entrance animation: on phones this paragraph is the LCP element. */}
      <p className="m-0 text-[15px] leading-[1.6] text-muted-strong">{first}</p>
      {rest.length > 0 && (
        <>
          <Collapse id={panelId} open={open}>
            {rest.map((p) => (
              <p key={p} className="m-0 pt-1 text-[15px] leading-[1.6] text-muted-strong">
                {p}
              </p>
            ))}
          </Collapse>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            className="tap-press inline-flex min-h-11 items-center gap-2 self-start rounded-full border-[1.5px] border-line bg-white px-[18px] text-sm font-extrabold whitespace-nowrap text-navy"
          >
            {open ? "Kevesebb" : "Tovább olvasom"}
            <span
              className={cn(
                "inline-flex transition-transform duration-[450ms] ease-bento",
                open && "rotate-180",
              )}
            >
              <PathIcon d={ICON_PATHS.chevronDown} size={16} strokeWidth={2.4} />
            </span>
          </button>
        </>
      )}
    </section>
  );
}
