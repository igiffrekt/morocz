"use client";

import { PathIcon } from "@/components/home/PathIcon";
import { pillClassName } from "@/components/ui/PillButton";
import { telHref } from "@/lib/site-nav";
import { useSiteContact } from "./SiteContext";

const HELP_PATH =
  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01";
const PHONE_PATH =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z";

/** "Kérdése van?" bar with the Sanity phone + reception e-mail (404 page). */
export function ContactStrip() {
  const contact = useSiteContact();
  return (
    <section
      aria-label="Elérhetőségek"
      className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] bg-white px-5 py-6 md:rounded-hero md:px-8 md:py-7"
    >
      <div className="flex min-w-0 flex-[1_1_360px] items-center gap-4">
        <span className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-sage text-teal-ink">
          <PathIcon d={HELP_PATH} size={22} strokeWidth={2} />
        </span>
        <span className="flex flex-col gap-0.5">
          <strong className="text-lg font-extrabold text-navy">Kérdése van?</strong>
          <span className="text-sm text-muted">
            Telefonon csak a rendelési időben vagyunk elérhetőek.
          </span>
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {contact?.phone && (
          <a
            href={telHref(contact.phone)}
            className={pillClassName({
              variant: "mint",
              className: "h-[52px] bg-mint px-6 text-[15px] hover:bg-mint-light",
            })}
          >
            <PathIcon d={PHONE_PATH} size={16} strokeWidth={2} />
            {contact.phone}
          </a>
        )}
        {contact?.email && (
          <a
            href={`mailto:${contact.email}`}
            className={pillClassName({
              variant: "ghost",
              className: "h-[52px] bg-canvas px-6 text-[15px] font-bold hover:bg-sage",
            })}
          >
            {contact.email}
          </a>
        )}
      </div>
    </section>
  );
}
