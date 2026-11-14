"use client";

import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { useSiteContact } from "@/components/layout/SiteContext";
import { pillClassName } from "@/components/ui/PillButton";
import { cn } from "@/lib/cn";
import { telHref } from "@/lib/site-nav";

const PHONE =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z";

interface ContactPillProps {
  className?: string;
  /** Plain text link instead of a pill. */
  plain?: boolean;
  icon?: boolean;
}

/** Reception phone (Sanity site settings) as a call pill. Renders nothing without a number. */
export function ContactPhonePill({ className, plain, icon = true }: ContactPillProps) {
  const contact = useSiteContact();
  if (!contact?.phone) return null;
  return (
    <a
      href={telHref(contact.phone)}
      className={
        plain
          ? cn("link-grow", className)
          : pillClassName({ variant: "mint", className: cn("bg-mint hover:bg-mint", className) })
      }
    >
      {icon && !plain && <PathIcon d={PHONE} size={17} strokeWidth={2} />}
      {contact.phone}
    </a>
  );
}

/** Reception e-mail (Sanity footer / site settings) as a pill. */
export function ContactEmailPill({ className, icon = true }: ContactPillProps) {
  const contact = useSiteContact();
  if (!contact?.email) return null;
  return (
    <a
      href={`mailto:${contact.email}`}
      className={pillClassName({
        variant: "outline",
        className: cn("max-w-full border-0", className),
      })}
    >
      {icon && <PathIcon d={ICON_PATHS.mail} size={17} strokeWidth={2} />}
      <span className="truncate">{contact.email}</span>
    </a>
  );
}
