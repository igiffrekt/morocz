import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
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
  logo,
  clinicName,
  phone,
  email,
  address,
  footerColumns,
  socialLinks,
  privacyPolicyUrl,
}: FooterProps) {
  const logoUrl = logo ? urlFor(logo).width(200).url() : null;

  // Filter to only social links with both platform and url defined
  const activeSocials = (socialLinks ?? []).filter(
    (s): s is { _key: string; platform: NonNullable<(typeof s)["platform"]>; url: string } =>
      s.platform != null && s.url != null,
  );

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-[88rem] mx-auto px-6 py-16">
        {/* Top section: nav columns + logo-on-pink */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* CMS-driven navigation columns (expecting 3 from Sanity) */}
          {footerColumns?.map((col) => (
            <div key={col._key}>
              {col.heading && <h3 className="font-semibold text-lg mb-4">{col.heading}</h3>}
              <ul className="space-y-2.5">
                {col.links?.map((link) => (
                  <li key={link._key}>
                    <a
                      href={link.href ?? "#"}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Logo on pink — contained block (locked decision: not full-width band) */}
          <div className="bg-secondary rounded-2xl p-8 flex items-center justify-center min-h-[160px]">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={clinicName ?? "Morocz Medical"}
                width={200}
                height={80}
                className="w-full max-w-[180px] h-auto object-contain"
              />
            ) : (
              <span className="text-primary font-semibold text-xl text-center">
                {clinicName ?? "Morocz Medical"}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-white/20 my-10" />

        {/* Bottom section: contact info + social icons + privacy */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Contact info */}
          <div className="space-y-1.5">
            {phone && (
              <p className="text-white/80">
                <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p className="text-white/80">
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                  {email}
                </a>
              </p>
            )}
            {address && <p className="text-white/80 whitespace-pre-line">{address}</p>}
          </div>

          {/* Social icons — CMS-driven, only render platforms with URLs */}
          {activeSocials.length > 0 && (
            <div className="flex gap-4">
              {activeSocials.map((social) => (
                <SocialIcon
                  key={social._key}
                  platform={social.platform}
                  url={social.url}
                  className="text-white/70 hover:text-white transition-colors"
                />
              ))}
            </div>
          )}

          {/* Privacy policy link */}
          {privacyPolicyUrl && (
            <a
              href={privacyPolicyUrl}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Adatvédelmi irányelv
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
