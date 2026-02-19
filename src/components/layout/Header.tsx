"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  logo?: SanityImageObject;
  clinicName?: string;
  navigationLinks?: Array<{ _key: string; label?: string; href?: string }>;
  phone?: string;
}

export function Header({ logo, clinicName, navigationLinks, phone }: HeaderProps) {
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

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 bg-surface-white transition-all duration-300",
          scrolled ? "py-3 shadow-md" : "py-5",
        ].join(" ")}
      >
        <div className="max-w-[88rem] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={clinicName ?? "Morocz Medical"}
                width={140}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            ) : (
              <span className="text-primary font-semibold text-lg">
                {clinicName ?? "Morocz Medical"}
              </span>
            )}
          </a>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Főnavigáció">
            {navigationLinks?.map((link) => (
              <a
                key={link._key}
                href={link.href ?? "#"}
                className="text-text-light font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Foglaljon időpontot
              </a>
            ) : (
              <button
                type="button"
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Foglaljon időpontot
              </button>
            )}
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
        </div>

        {/* Mobile menu — rendered inside header so it drops down below */}
        <div className="md:hidden">
          <MobileMenu
            isOpen={mobileMenuOpen}
            navigationLinks={navigationLinks}
            phone={phone}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      </header>

      {/* Spacer to push page content below the fixed header */}
      <div className={scrolled ? "h-16" : "h-24"} aria-hidden="true" />
    </>
  );
}
