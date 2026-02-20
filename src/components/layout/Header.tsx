"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  logo?: SanityImageObject;
  clinicName?: string;
  navigationLinks?: Array<{ _key: string; label?: string; href?: string }>;
  phone?: string;
  address?: string;
}

export function Header({ logo, clinicName, navigationLinks, phone, address }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoUrl = logo ? urlFor(logo).width(140).url() : null;
  const displayName = clinicName ?? "Mórocz Medical";

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full bg-background-light rounded-3xl flex items-center justify-between transition-all duration-300",
        scrolled ? "px-6 py-3 shadow-md" : "px-8 py-5 shadow-sm",
      ].join(" ")}
    >
      {/* Left: logo + address */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={displayName}
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          ) : (
            <>
              <svg
                className="w-8 h-8 text-primary"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z" />
              </svg>
              <span className="text-2xl font-bold text-primary tracking-tight">{displayName}</span>
            </>
          )}
        </Link>

        {/* Address info — desktop only */}
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
              <p className="font-bold text-gray-900">{address.split(",")[0]?.trim()}</p>
              <p>{address.split(",").slice(1).join(",").trim() || address}</p>
            </div>
          </div>
        )}
      </div>

      {/* Center: desktop nav */}
      <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-600">
        {navigationLinks?.map((link, i) => (
          <a
            key={link._key}
            href={link.href ?? "#"}
            className={["transition-colors", i === 0 ? "text-primary" : "hover:text-primary"].join(
              " ",
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Right: CTA button (desktop) */}
      <div className="hidden md:block">
        <a
          href={phone ? `tel:${phone}` : "#kapcsolat"}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#a3dac2] hover:bg-[#8fcdb3] transition-colors text-sm font-bold text-primary"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Foglaljon időpontot
        </a>
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
        />
      </div>
    </header>
  );
}
