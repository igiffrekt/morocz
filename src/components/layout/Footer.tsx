import Image from "next/image";
import Link from "next/link";
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
      <nav
        aria-label="Lábléc navigáció"
        className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-20 relative z-10"
      >
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
      </nav>

      {/* Logo + Social icons row */}
      <div className="flex items-center justify-between mb-12 relative z-10">
        <Image
          src="/mm-logo-web.svg"
          alt={displayName}
          width={530}
          height={130}
          className="h-10 md:h-14 w-auto object-contain"
        />
        {activeSocials.length > 0 && (
          <div className="flex items-center gap-4">
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
      </div>

      {/* Copyright line */}
      <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/60 pt-8 border-t border-white/15">
        <p>
          &copy;{new Date().getFullYear()} {displayName}. Minden jog fenntartva.
        </p>
        <Link
          href={privacyPolicyUrl ?? "/adatkezelesi-tajekoztato"}
          className="hover:text-white transition-colors mt-2 md:mt-0"
        >
          Adatkezelési tájékoztató
        </Link>
      </div>
    </footer>
  );
}
