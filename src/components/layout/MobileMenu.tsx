"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Collapse } from "@/components/ui/Accordion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/cn";
import type { OpeningHours } from "@/lib/opening-hours";
import type { ServiceMenuItem } from "@/lib/service-menu";
import { isActiveHref, mapsHref, normalizeHref, PRICES_ROUTE, telHref } from "@/lib/site-nav";
import type { NavLink } from "./Header";
import { ArrowRightIcon, ChevronDownIcon, MailIcon, PhoneIcon, PinIcon } from "./icons";
import { isYogaLink, Lotus } from "./NavLinkContent";

interface MobileMenuProps {
  logoAlt: string;
  links: readonly NavLink[];
  phone?: string;
  email?: string;
  address?: string;
  openingHours: OpeningHours;
  serviceMenu: readonly ServiceMenuItem[];
  bookingHref: string;
}

type MenuEntry =
  | { kind: "link"; key: string; label: string; href: string }
  | { kind: "group"; key: string; label: string };

const EASE_REVEAL = "cubic-bezier(.77,0,.18,1)";
const EASE_SPRING = "cubic-bezier(.2,.8,.2,1)";
/** Centre of the 52px menu button: 12px right padding + 26px radius, 68px bar. */
const ORIGIN = "calc(100% - 38px) 34px";

function buildEntries(links: readonly NavLink[]): MenuEntry[] {
  const rest = links
    .filter((l) => normalizeHref(l.href) !== PRICES_ROUTE)
    .map<MenuEntry>((l) => ({
      kind: "link",
      key: l._key,
      label: l.label ?? "",
      href: normalizeHref(l.href),
    }));
  return [
    { kind: "link", key: "home", label: "Kezdőlap", href: "/" },
    { kind: "group", key: "services", label: "Szolgáltatások" },
    ...rest,
  ];
}

export function MobileMenu({
  logoAlt,
  links,
  phone,
  email,
  address,
  openingHours,
  serviceMenu,
  bookingHref,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const subId = useId();

  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    // Keep keyboard focus on the toggle when it was inside the menu (Escape, ✕).
    if (rootRef.current?.contains(document.activeElement)) {
      toggleRef.current?.focus({ preventScroll: true });
    }
    setOpen(false);
    setSubOpen(false);
  }, []);

  useScrollLock(open);
  useFocusTrap(rootRef, open, {
    onEscape: close,
    initialFocus: firstLinkRef,
    restoreFocus: false,
  });

  // Close on navigation and when the viewport grows into the desktop header.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [close]);

  const entries = buildEntries(links);

  const reveal = (i: number): CSSProperties => {
    const delay = open ? 180 + i * 60 : 0;
    return {
      opacity: open ? 1 : 0,
      transform: open ? "translateY(0)" : "translateY(28px)",
      transition: `opacity .5s ${EASE_SPRING} ${delay}ms, transform .6s ${EASE_SPRING} ${delay}ms`,
    };
  };

  const fade = cn(
    "transition-[opacity,transform] duration-[350ms,450ms] ease-bento",
    open ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100",
  );

  const quick = [
    phone && { label: "Hívás", href: telHref(phone), icon: <PhoneIcon size={20} /> },
    email && { label: "E-mail", href: `mailto:${email}`, icon: <MailIcon size={20} /> },
    address && {
      label: "Útvonal",
      href: mapsHref(address),
      icon: <PinIcon size={20} />,
      external: true,
    },
  ].filter(Boolean) as Array<{ label: string; href: string; icon: ReactNode; external?: boolean }>;

  const bar = (rotate: string, closed: string) =>
    cn(
      "absolute h-[2.5px] w-5 rounded-full transition-[transform,background-color] duration-500",
      open ? `bg-navy ${rotate}` : `bg-white ${closed}`,
    );

  return (
    <div ref={rootRef} className="sticky top-0 z-40 text-navy lg:hidden">
      {/* App bar */}
      <div
        className={cn(
          "relative z-[60] flex h-[68px] items-center gap-2 pr-3 pl-4 transition-colors duration-[400ms]",
          open ? "bg-transparent" : "bg-canvas/86 backdrop-blur-[16px]",
        )}
      >
        <Link href="/" inert={open} className={cn("mr-auto flex items-center", fade)}>
          <Image
            src="/mm-logo-web.svg"
            alt={logoAlt}
            width={122}
            height={30}
            className="h-[30px] w-auto"
            priority
          />
        </Link>
        {phone && (
          <a
            href={telHref(phone)}
            inert={open}
            aria-label={`Hívás: ${phone}`}
            className={cn(
              "tap-press inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy",
              fade,
            )}
          >
            <PhoneIcon size={19} />
          </a>
        )}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-expanded={open}
          aria-controls="mobil-menu"
          aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
          className={cn(
            "relative inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-0 active:scale-95",
            "transition-[background-color,transform] duration-[450ms,300ms] ease-reveal",
            open ? "bg-blush" : "bg-navy",
          )}
        >
          <span aria-hidden="true" className={bar("rotate-45", "-translate-y-1")} />
          <span aria-hidden="true" className={bar("-rotate-45", "translate-y-1 scale-x-[.7]")} />
        </button>
      </div>

      {/* Full-screen menu: circular reveal from the menu button */}
      <div
        id="mobil-menu"
        inert={!open}
        className="fixed inset-0 z-50 bg-navy text-white"
        style={{
          clipPath: `circle(${open ? "160%" : "0px"} at ${ORIGIN})`,
          WebkitClipPath: `circle(${open ? "160%" : "0px"} at ${ORIGIN})`,
          visibility: open ? "visible" : "hidden",
          pointerEvents: open ? "auto" : "none",
          transition: `clip-path .75s ${EASE_REVEAL}, -webkit-clip-path .75s ${EASE_REVEAL}, visibility 0s linear ${open ? "0s" : ".75s"}`,
        }}
      >
        <div className="flex h-full flex-col gap-[22px] overflow-y-auto overscroll-contain px-5 pt-[92px] pb-[max(28px,env(safe-area-inset-bottom))]">
          <nav aria-label="Mobil navigáció">
            <ul className="m-0 flex list-none flex-col p-0">
              {entries.map((entry, i) => {
                const num = String(i + 1).padStart(2, "0");
                const numEl = (
                  <span className="w-6 shrink-0 text-[13px] font-bold tabular-nums text-mint-light">
                    {num}
                  </span>
                );

                if (entry.kind === "group") {
                  return (
                    <li key={entry.key} className="border-b border-white/10" style={reveal(i)}>
                      <button
                        type="button"
                        onClick={() => setSubOpen((v) => !v)}
                        aria-expanded={subOpen}
                        aria-controls={subId}
                        className="flex w-full items-center gap-3.5 border-0 bg-transparent px-1 py-4 text-left text-white"
                      >
                        {numEl}
                        <span className="flex-1 text-[28px] font-extrabold tracking-[-0.02em]">
                          {entry.label}
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            "transition-[transform,background-color,color] duration-[450ms,300ms,300ms] ease-bento",
                            subOpen
                              ? "rotate-180 bg-mint-light text-navy"
                              : "rotate-0 bg-white/10 text-white",
                          )}
                        >
                          <ChevronDownIcon size={16} strokeWidth={2.6} />
                        </span>
                      </button>
                      <Collapse id={subId} open={subOpen}>
                        <ul className="m-0 flex list-none flex-col gap-1.5 pr-0 pb-3.5 pl-[38px]">
                          {serviceMenu.map((sub) => (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                onClick={close}
                                aria-current={pathname === sub.href ? "page" : undefined}
                                className="tap-press flex min-h-12 items-center justify-between gap-2.5 rounded-full bg-white/8 px-[18px] text-base font-bold text-white no-underline hover:bg-white/14"
                              >
                                <span className="whitespace-nowrap">{sub.label}</span>
                                {sub.meta && (
                                  <span className="whitespace-nowrap text-[13px] font-semibold text-mint-light">
                                    {sub.meta}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </Collapse>
                    </li>
                  );
                }

                const active = isActiveHref(pathname, entry.href);
                const yoga = isYogaLink(entry.href);
                return (
                  <li key={entry.key} className="border-b border-white/10" style={reveal(i)}>
                    <Link
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={entry.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-center gap-3.5 px-1 py-4 text-white no-underline"
                    >
                      {numEl}
                      <span
                        className={cn(
                          "flex-1 text-[28px] font-extrabold tracking-[-0.02em]",
                          yoga ? "text-mint" : active ? "text-mint-light" : "text-white",
                        )}
                      >
                        <span className={cn("relative", yoga && "pr-[30px]")}>
                          {entry.label}
                          {yoga && (
                            <Lotus className="absolute -top-1.5 -right-0.5 h-6 w-6 rotate-45" />
                          )}
                        </span>
                      </span>
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition-[background-color,transform] duration-300 ease-bento group-hover:translate-x-1 group-hover:bg-white/16">
                        <ArrowRightIcon size={16} strokeWidth={2.4} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {quick.length > 0 && (
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${quick.length}, minmax(0, 1fr))`,
                ...reveal(entries.length),
              }}
            >
              {quick.map((q) => (
                <a
                  key={q.label}
                  href={q.href}
                  {...(q.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="tap-press flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-tile bg-white/8 text-[13px] font-bold text-white no-underline hover:bg-white/14"
                >
                  <span className="text-mint-light">{q.icon}</span>
                  {q.label}
                </a>
              ))}
            </div>
          )}

          {openingHours.days.length > 0 && (
            <div
              className="flex flex-col gap-2.5 rounded-tile border border-white/10 bg-white/6 px-5 py-[18px]"
              style={reveal(entries.length + 1)}
            >
              <p className="m-0 flex items-center justify-between text-xs font-extrabold uppercase tracking-[.12em] text-mint-light">
                <span>Rendelési idő</span>
                {openingHours.seasonName && (
                  <span className="whitespace-nowrap rounded-full bg-mint-light px-3 py-1 tracking-normal normal-case text-navy">
                    {openingHours.seasonName}
                  </span>
                )}
              </p>
              <dl className="m-0 flex flex-col gap-2.5">
                {openingHours.days.map((d) => (
                  <div key={d.dayOfWeek} className="flex justify-between text-[15px] text-white">
                    <dt className="text-navy-soft">{d.name}</dt>
                    <dd className="m-0 font-bold tabular-nums">{d.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <Link
            href={bookingHref}
            onClick={close}
            className="tap-press mt-auto flex min-h-[60px] shrink-0 items-center justify-center gap-2.5 rounded-full bg-blush text-[17px] font-extrabold whitespace-nowrap text-navy no-underline"
            style={reveal(entries.length + 2)}
          >
            Időpontfoglalás
            <ArrowRightIcon size={18} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </div>
  );
}
