"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PillLink } from "@/components/ui/PillButton";
import { cn } from "@/lib/cn";
import type { OpeningHours } from "@/lib/opening-hours";
import type { ServiceMenuItem } from "@/lib/service-menu";
import { isActiveHref, normalizeHref, telHref } from "@/lib/site-nav";
import { PhoneIcon } from "./icons";
import { MobileMenu } from "./MobileMenu";
import { isYogaLink, Lotus } from "./NavLinkContent";

export interface NavLink {
  _key: string;
  label?: string | null;
  href?: string | null;
}

interface HeaderProps {
  clinicName?: string;
  navigationLinks?: readonly NavLink[] | null;
  phone?: string;
  email?: string;
  address?: string;
  openingHours: OpeningHours;
  serviceMenu: readonly ServiceMenuItem[];
}

const BOOKING_HREF = "/idopontfoglalas";

/**
 * Desktop: hides while scrolling down, comes back (with a floating shadow) on the
 * first deliberate scroll up. Small jitters are ignored.
 */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const last = useRef(0);
  const upTravel = useRef(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - last.current;
        last.current = y;
        setScrolled(y > 8);
        if (y < 120) {
          upTravel.current = 0;
          setHidden(false);
        } else if (delta > 4) {
          upTravel.current = 0;
          setHidden(true);
        } else if (delta < 0) {
          upTravel.current += -delta;
          if (upTravel.current > 48) setHidden(false);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { hidden, scrolled };
}

export function Header({
  clinicName,
  navigationLinks,
  phone,
  email,
  address,
  openingHours,
  serviceMenu,
}: HeaderProps) {
  const pathname = usePathname();
  const { hidden, scrolled } = useHideOnScroll();
  const links = (navigationLinks ?? []).filter((l) => l.label && l.href);
  const logoAlt = `${clinicName ?? "Mórocz Medical"} – kezdőlap`;

  return (
    <>
      {/* ── Desktop (lg+) ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "sticky top-0 z-40 hidden px-4 pt-4 transition-transform duration-500 ease-bento lg:block",
          // Keyboard users tabbing into a hidden header bring it back.
          hidden && "-translate-y-[calc(100%+12px)] focus-within:translate-y-0",
        )}
      >
        <header className="mx-auto max-w-site">
          <div
            className={cn(
              "flex items-center gap-3 rounded-full bg-white py-2.5 pr-2.5 pl-7 transition-shadow duration-500",
              scrolled ? "shadow-float" : "shadow-bar",
            )}
          >
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/mm-logo-web.svg"
                alt={logoAlt}
                width={155}
                height={38}
                className="h-[38px] w-auto"
                priority
              />
            </Link>

            <nav aria-label="Fő navigáció" className="mx-auto flex items-center gap-0.5">
              {links.map((link) => {
                const href = normalizeHref(link.href);
                const active = isActiveHref(pathname, href);
                const yoga = isYogaLink(href);
                return (
                  <Link
                    key={link._key}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "nav-pill relative inline-flex h-11 items-center whitespace-nowrap rounded-full pl-4 text-sm hover:bg-sage",
                      yoga ? "pr-[26px]" : "pr-4",
                      active ? "bg-sage font-extrabold" : "font-semibold",
                      yoga ? "text-yoga" : active ? "text-navy" : "text-muted hover:text-navy",
                    )}
                  >
                    {link.label}
                    {yoga && <Lotus className="absolute top-0.5 right-0.5 h-5 w-5 rotate-45" />}
                  </Link>
                );
              })}
            </nav>

            {phone && (
              <a
                href={telHref(phone)}
                aria-label={`Hívás: ${phone}`}
                className="link-grow mr-2 flex shrink-0 items-center gap-2 py-1 text-sm font-bold whitespace-nowrap text-navy"
              >
                <PhoneIcon size={17} />
                <span className="hidden xl:inline">{phone}</span>
              </a>
            )}

            <PillLink href={BOOKING_HREF} variant="navy" arrow className="font-bold">
              Időpontfoglalás
            </PillLink>
          </div>
        </header>
      </div>

      {/* ── Mobile / tablet (< lg) ───────────────────────────────────── */}
      <MobileMenu
        logoAlt={logoAlt}
        links={links}
        phone={phone}
        email={email}
        address={address}
        openingHours={openingHours}
        serviceMenu={serviceMenu}
        bookingHref={BOOKING_HREF}
      />
    </>
  );
}
