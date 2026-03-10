"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneCallDialog } from "@/components/ui/PhoneCallDialog";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  clinicName?: string;
  navigationLinks?: Array<{ _key: string; label?: string; href?: string }>;
  phone?: string;
  address?: string;
}

type NavState = "default" | "hidden" | "compact";

export function Header({ clinicName, navigationLinks, phone, address }: HeaderProps) {
  const [navState, setNavState] = useState<NavState>("default");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const upAccumulated = useRef(0);
  const SHOW_THRESHOLD = 80; // px felfelé kell görgetni mielőtt nav visszajön

  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      const atTop = currentY < 50;
      const atBottom = currentY + window.innerHeight >= document.documentElement.scrollHeight - 60;

      if (atTop) {
        upAccumulated.current = 0;
        setNavState("default");
      } else if (atBottom) {
        // Oldal aljánál marad hidden (iOS browser UI jitter)
        upAccumulated.current = 0;
        setNavState("hidden");
      } else if (delta > 4) {
        // Lefelé görgetés: azonnal elrejt, reset accumulator
        upAccumulated.current = 0;
        setNavState("hidden");
      } else if (delta < 0) {
        // Felfelé görgetés: csak SHOW_THRESHOLD px után jelenik meg
        upAccumulated.current += Math.abs(delta);
        if (upAccumulated.current >= SHOW_THRESHOLD) {
          setNavState("compact");
        }
      }
      // delta 0–4 között: browser jitter, ignorál

      lastScrollY.current = currentY;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const displayName = clinicName ?? "Mórocz Medical";

  const isCompact = navState === "compact";

  return (
    <div className="sticky top-0 z-50 w-full">
      {/* Default header */}
      <header
        className={[
          "w-full bg-background-light rounded-xl flex items-center justify-between transition-all duration-500 ease-in-out",
          "px-8 py-5 shadow-sm",
          navState === "default"
            ? "opacity-100 translate-y-0"
            : navState === "hidden"
              ? "opacity-0 -translate-y-full pointer-events-none absolute"
              : "opacity-100 translate-y-0 md:opacity-0 md:-translate-y-full md:pointer-events-none md:absolute",
        ].join(" ")}
      >
        {/* Left: logo + address */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/mm-logo-web.svg"
              alt={displayName}
              width={200}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Address + phone — desktop only */}
          {address && (
            <div className="hidden xl:flex items-center gap-3 text-xs text-gray-500 border-l border-gray-200 pl-6 h-10">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <div>
                <p className="font-bold text-gray-900">{address.replace(/\n/g, " ")}</p>
                {phone && <p>{phone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Center: desktop nav */}
        <nav
          aria-label="Fő navigáció"
          className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-600"
        >
          {navigationLinks?.map((link, i) => (
            <a
              key={link._key}
              href={link.href ?? "#"}
              className={[
                "transition-colors",
                i === 0 ? "text-primary" : "hover:text-primary",
              ].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: CTA button (desktop) */}
        <div className="hidden md:block">
          <Link
            href="/idopontfoglalas"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#a3dac2] hover:bg-[#8fcdb3] transition-colors text-sm font-bold text-primary"
          >
            Időpontfoglalás
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Menü bezárása" : "Menü megnyitása"}
          className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5"
        >
          <span
            className={[
              "block w-6 h-0.5 bg-text-light transition-all duration-300",
              mobileMenuOpen ? "translate-y-2 rotate-45" : "",
            ].join(" ")}
          />
          <span
            className={[
              "block w-6 h-0.5 bg-text-light transition-all duration-300",
              mobileMenuOpen ? "opacity-0" : "",
            ].join(" ")}
          />
          <span
            className={[
              "block w-6 h-0.5 bg-text-light transition-all duration-300",
              mobileMenuOpen ? "-translate-y-2 -rotate-45" : "",
            ].join(" ")}
          />
        </button>

        {/* Mobile menu dropdown */}
        <div className="md:hidden absolute top-full left-0 right-0">
          <MobileMenu
            isOpen={mobileMenuOpen}
            navigationLinks={navigationLinks}
            phone={phone}
            onClose={() => setMobileMenuOpen(false)}
            onPhoneClick={() => setPhoneDialogOpen(true)}
          />
        </div>
      </header>

      {/* Compact header — scroll-up variant */}
      <header
        className={[
          "fixed top-3 left-1/2 -translate-x-1/2 w-[70%] max-w-[61.6rem]",
          "rounded-2xl hidden md:flex items-center justify-between px-5 py-2.5",
          "backdrop-blur-xl bg-white/60 border border-white/30 shadow-lg",
          "transition-all duration-500 ease-in-out",
          isCompact ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none",
        ].join(" ")}
      >
        {/* Left: icon logo only */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/mm-logo-square.svg"
            alt={displayName}
            width={48}
            height={48}
            className="h-8 w-8 object-contain"
          />
        </Link>

        {/* Center: nav links */}
        <nav
          aria-label="Fő navigáció"
          className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600"
        >
          {navigationLinks?.map((link, i) => (
            <a
              key={link._key}
              href={link.href ?? "#"}
              className={[
                "transition-colors",
                i === 0 ? "text-primary" : "hover:text-primary",
              ].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: CTA */}
        <div className="hidden md:block">
          <Link
            href="/idopontfoglalas"
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#a3dac2] hover:bg-[#8fcdb3] transition-colors text-sm font-bold text-primary"
          >
            Időpontfoglalás
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Menü bezárása" : "Menü megnyitása"}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
        >
          <span
            className={[
              "block w-5 h-0.5 bg-text-light transition-all duration-300",
              mobileMenuOpen ? "translate-y-2 rotate-45" : "",
            ].join(" ")}
          />
          <span
            className={[
              "block w-5 h-0.5 bg-text-light transition-all duration-300",
              mobileMenuOpen ? "opacity-0" : "",
            ].join(" ")}
          />
          <span
            className={[
              "block w-5 h-0.5 bg-text-light transition-all duration-300",
              mobileMenuOpen ? "-translate-y-2 -rotate-45" : "",
            ].join(" ")}
          />
        </button>

        {/* Mobile menu dropdown — compact variant */}
        <div className="md:hidden absolute top-full left-0 right-0 mt-1">
          <MobileMenu
            isOpen={mobileMenuOpen && isCompact}
            navigationLinks={navigationLinks}
            phone={phone}
            onClose={() => setMobileMenuOpen(false)}
            onPhoneClick={() => setPhoneDialogOpen(true)}
          />
        </div>
      </header>

      {/* Phone confirmation dialog — shared by both header variants */}
      {phone && (
        <PhoneCallDialog
          phone={phone}
          isOpen={phoneDialogOpen}
          onClose={() => setPhoneDialogOpen(false)}
        />
      )}
    </div>
  );
}
