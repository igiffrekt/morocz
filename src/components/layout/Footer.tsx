"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import SocialIcon from "./SocialIcon";

interface FooterProps {
  clinicName?: string;
  phone?: string;
  email?: string;
  address?: string;
  footerColumns?: Array<{
    _key: string;
    heading?: string;
    links?: Array<{ _key: string; label?: string; href?: string }>;
  }>;
  socialLinks?: Array<{
    _key: string;
    platform?: "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok";
    url?: string;
  }>;
  privacyPolicyUrl?: string;
}

export default function Footer({
  clinicName,
  phone,
  address,
  footerColumns,
  socialLinks,
  privacyPolicyUrl,
}: FooterProps) {
  const displayName = clinicName ?? "Mórocz Medical";

  const activeSocials = (socialLinks ?? []).filter(
    (s): s is { _key: string; platform: NonNullable<(typeof s)["platform"]>; url: string } =>
      s.platform != null && s.url != null,
  );

  return (
    <footer className="bg-[#0d112f] rounded-t-[3rem] lg:rounded-[3rem] overflow-hidden">
      <FadeIn viewport>
        <div className="px-5 pt-5 pb-0 md:px-10 md:pt-10">
          {/* ── White card ───────────────────────────────────────────── */}
          <div className="bg-white rounded-[2rem] px-8 py-10 md:px-12 md:py-12">
            {/* Navigation columns */}
            {footerColumns && footerColumns.length > 0 && (
              <nav
                aria-label="Lábléc navigáció"
                className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-10"
              >
                {footerColumns.slice(0, 3).map((col) => (
                  <div key={col._key}>
                    {col.heading && (
                      <h4 className="font-bold mb-5 text-lg text-primary">{col.heading}</h4>
                    )}
                    <ul className="space-y-5 text-base text-gray-700 font-medium">
                      {col.links?.map((link) => (
                        <li key={link._key}>
                          <a
                            href={link.href ?? "#"}
                            className="hover:text-primary hover:underline transition-all"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100 mb-8" />

            {/* Contact info */}
            {(phone || address) && (
              <div className="flex flex-col gap-2 mb-6 text-base text-gray-600 md:flex-row md:gap-6">
                {phone && (
                  <a href={`tel:${phone}`} className="hover:text-primary transition-colors">
                    {phone}
                  </a>
                )}
                {address && <span>{address}</span>}
              </div>
            )}

            {/* Social icons */}
            {activeSocials.length > 0 && (
              <div className="flex items-center gap-3">
                {activeSocials.map((social) => (
                  <SocialIcon
                    key={social._key}
                    platform={social.platform}
                    url={social.url}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300"
                  />
                ))}
              </div>
            )}
          </div>
          {/* ── End white card ───────────────────────────────────────── */}

          {/* ── Logo + copyright row (dark background) ───────────────── */}
          <div className="px-4 md:px-8 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/mm-logo-web.svg"
              alt={displayName}
              width={530}
              height={130}
              className="h-8 md:h-12 w-auto object-contain brightness-0 invert"
            />
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-white/50">
              <p>
                &copy;{new Date().getFullYear()} {displayName}. Minden jog fenntartva.
              </p>
              <Link
                href={privacyPolicyUrl ?? "/adatkezelesi-tajekoztato"}
                className="hover:text-white transition-colors"
              >
                Adatkezelési tájékoztató
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </footer>
  );
}
