import type { SanityImageObject } from "../../../sanity.types";
import SocialIcon from "./SocialIcon";

interface FooterProps {
  logo?: SanityImageObject;
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
  footerColumns,
  socialLinks,
  privacyPolicyUrl,
}: FooterProps) {
  const displayName = clinicName ?? "Mórocz Medical";

  // Filter to only social links with both platform and url defined
  const activeSocials = (socialLinks ?? []).filter(
    (s): s is { _key: string; platform: NonNullable<(typeof s)["platform"]>; url: string } =>
      s.platform != null && s.url != null,
  );

  return (
    <footer className="bg-primary text-white rounded-t-[3rem] lg:rounded-[3rem] pt-20 pb-10 px-8 md:px-16 overflow-hidden relative">
      {/* Navigation columns — 3 columns as per locked decision */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-20 relative z-10">
        {footerColumns?.slice(0, 3).map((col) => (
          <div key={col._key}>
            {col.heading && <h4 className="font-bold mb-8 text-lg">{col.heading}</h4>}
            <ul className="space-y-4 text-sm text-gray-300 font-medium">
              {col.links?.map((link) => (
                <li key={link._key}>
                  <a
                    href={link.href ?? "#"}
                    className="hover:text-white hover:underline transition-all"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Social icons row */}
      {activeSocials.length > 0 && (
        <div className="flex items-center justify-center md:justify-end gap-4 mb-16 relative z-10">
          {activeSocials.map((social) => (
            <SocialIcon
              key={social._key}
              platform={social.platform}
              url={social.url}
              className="w-12 h-12 rounded-full bg-[#2A2D40] border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-300"
            />
          ))}
        </div>
      )}

      {/* HUGE pink banner with logo text */}
      <div className="bg-secondary rounded-[2.5rem] py-16 md:py-24 flex justify-center items-center relative overflow-hidden mb-12">
        <div className="flex items-center gap-6 relative z-10">
          <svg
            className="w-16 h-16 md:w-24 md:h-24 text-primary"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z" />
          </svg>
          <span className="text-6xl md:text-[7rem] font-extrabold text-primary tracking-tighter">
            {displayName}
          </span>
        </div>
        {/* Subtle texture in banner */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_25%_25%,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:24px_24px]" />
      </div>

      {/* Copyright line */}
      <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 pt-8 border-t border-white/10 font-medium">
        <p>
          &copy;{new Date().getFullYear()} {displayName}. Minden jog fenntartva.
        </p>
        {privacyPolicyUrl ? (
          <a href={privacyPolicyUrl} className="hover:text-white transition-colors mt-2 md:mt-0">
            Adatvédelmi irányelv
          </a>
        ) : (
          <p className="mt-2 md:mt-0">Adatvédelmi irányelv</p>
        )}
      </div>
    </footer>
  );
}
