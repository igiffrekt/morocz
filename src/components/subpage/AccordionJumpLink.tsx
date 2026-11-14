"use client";

import type { AnchorHTMLAttributes } from "react";
import { requestAccordionOpen } from "@/components/ui/Accordion";

type AccordionJumpLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** `anchor` of the target accordion item. */
  anchor: string;
};

/**
 * In-page link that scrolls to an accordion item and opens it — also when the URL already
 * points at it (a repeated click does not fire `hashchange` by itself).
 */
export function AccordionJumpLink({ anchor, onClick, ...rest }: AccordionJumpLinkProps) {
  return (
    <a
      href={`#${anchor}`}
      onClick={(event) => {
        onClick?.(event);
        requestAccordionOpen(anchor);
      }}
      {...rest}
    />
  );
}
