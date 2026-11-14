import Link from "next/link";
import type { ReactNode } from "react";
import { PillLink } from "@/components/ui/PillButton";
import { cn } from "@/lib/cn";
import { classifyHref, telHref } from "@/lib/site-nav";

interface FooterColumnLink {
  _key: string;
  label?: string | null;
  href?: string | null;
}

interface FooterColumn {
  _key: string;
  heading?: string | null;
  links?: readonly FooterColumnLink[] | null;
}

interface FooterProps {
  clinicName?: string;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks?: ReadonlyArray<{
    _key: string;
    platform?: "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok" | null;
    url?: string | null;
  }> | null;
  /** Sanity `siteSettings.footerColumns` — the footer link columns. */
  footerColumns?: readonly FooterColumn[] | null;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  termsOfServiceUrl?: string;
  bookingPolicyUrl?: string;
  generalPatientInfoUrl?: string;
}

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
};

/** Footer anchor: site routes via next/link, external URLs in a new tab, tel:/mailto: as-is. */
function FooterLink({
  href,
  children,
  className,
}: {
  href: string | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  const classes = cn("link-grow text-navy-soft hover:text-white", className);
  const link = classifyHref(href);
  if (link.kind === "internal") {
    return (
      <Link href={link.href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      className={classes}
      {...(link.kind === "external" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/** Drop links without a label and columns without any link; never throws on missing data. */
function cleanColumns(columns: FooterProps["footerColumns"]) {
  return (columns ?? [])
    .map((col) => ({
      key: col._key,
      heading: col.heading?.trim() ?? "",
      links: (col.links ?? []).filter((l): l is FooterColumnLink & { label: string } =>
        Boolean(l.label?.trim()),
      ),
    }))
    .filter((col) => col.heading || col.links.length > 0);
}

export default function Footer({
  clinicName,
  phone,
  email,
  address,
  socialLinks,
  footerColumns,
  privacyPolicyUrl,
  cookiePolicyUrl,
  termsOfServiceUrl,
  bookingPolicyUrl,
  generalPatientInfoUrl,
}: FooterProps) {
  const displayName = clinicName ?? "Mórocz Medical";
  const addressLine = address?.replace(/\s*\n\s*/g, " ");

  const legalLinks = [
    {
      label: "Adatkezelési tájékoztató",
      short: "Adatkezelés",
      href: privacyPolicyUrl || "/adatkezelesi-tajekoztato",
    },
    { label: "Cookie Szabályzat", short: "Cookie", href: cookiePolicyUrl || "/cookie-szabalyzat" },
    {
      label: "Felhasználási Feltételek",
      short: "Felhasználási feltételek",
      href: termsOfServiceUrl || "/felhasznalasi-feltetelek",
    },
    {
      label: "Foglalási és Lemondási Szabályzat",
      short: "Foglalás és lemondás",
      href: bookingPolicyUrl || "/foglalasi-es-lemondasi-szabalyzat",
    },
    {
      label: "Általános Betegtájékoztató",
      short: "Betegtájékoztató",
      href: generalPatientInfoUrl || "/altalanos-betegtajekoztato",
    },
  ];

  const socials = (socialLinks ?? []).filter(
    (s): s is { _key: string; platform: NonNullable<typeof s.platform>; url: string } =>
      Boolean(s.platform && s.url),
  );

  const columns = cleanColumns(footerColumns);
  // Social links join the "Kapcsolat" column (or the last one when there is none).
  const kapcsolatIdx = columns.findIndex((c) => c.heading.toLowerCase() === "kapcsolat");
  const socialColumnIdx = kapcsolatIdx >= 0 ? kapcsolatIdx : columns.length - 1;

  // Phones: the contact paragraph already shows address / phone / email, so the
  // compact link grid skips the column links that duplicate it.
  const normalise = (v: string) => v.replace(/\s+/g, " ").trim().toLowerCase();
  const isContactLink = (l: FooterColumnLink & { label: string }) => {
    const href = l.href?.trim() ?? "";
    return (
      href.startsWith("tel:") ||
      href.startsWith("mailto:") ||
      (addressLine !== undefined && normalise(l.label) === normalise(addressLine))
    );
  };
  const addressLink = columns
    .flatMap((c) => c.links)
    .find((l) => addressLine !== undefined && normalise(l.label) === normalise(addressLine));
  const mobileLinks = columns.flatMap((c) => c.links).filter((l) => !isContactLink(l));

  const year = new Date().getFullYear();

  return (
    <div className="mt-12 px-3 md:mt-16 lg:mt-28 lg:px-4">
      {/* ── Phones: compact footer (MobilFooldal) ─────────────────────── */}
      <footer className="site-footer flex flex-col gap-5 rounded-t-[32px] bg-navy px-[22px] pt-[26px] pb-7 text-sm text-navy-soft md:hidden">
        <h2 className="m-0 text-2xl leading-[1.15] font-extrabold text-white">
          Foglaljon időpontot még ma!
        </h2>
        <p className="m-0 leading-relaxed">
          {addressLine &&
            (addressLink?.href ? (
              <FooterLink href={addressLink.href}>{addressLine}</FooterLink>
            ) : (
              addressLine
            ))}
          {addressLine && <br />}
          {phone && <FooterLink href={telHref(phone)}>{phone}</FooterLink>}
          {phone && email && " · "}
          {email && <FooterLink href={`mailto:${email}`}>{email}</FooterLink>}
        </p>
        {mobileLinks.length > 0 && (
          <nav aria-label="Lábléc navigáció" className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {mobileLinks.map((link) => (
              <FooterLink
                key={link._key}
                href={link.href}
                className="font-bold text-white no-underline"
              >
                {link.label}
              </FooterLink>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap gap-x-3.5 gap-y-2 border-t border-white/12 pt-4 text-xs text-navy-faint">
          {legalLinks.map((link) => (
            <FooterLink
              key={link.label}
              href={link.href}
              className="text-navy-faint underline hover:text-white"
            >
              {link.short}
            </FooterLink>
          ))}
          <span>
            © {year} {displayName}
          </span>
        </div>
      </footer>

      {/* ── Tablet / desktop (Footer.dc) ──────────────────────────────── */}
      <footer className="site-footer mx-auto hidden max-w-site flex-col gap-10 rounded-t-[32px] bg-navy px-10 pt-12 pb-7 text-navy-soft md:flex lg:gap-12 lg:rounded-t-hero lg:px-14 lg:pt-16 lg:pb-8">
        {/* CTA band */}
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/12 pb-10 lg:pb-12">
          <div className="flex max-w-[620px] flex-col gap-3">
            <h2 className="m-0 text-[32px] font-extrabold leading-[1.1] text-white lg:text-[44px]">
              Foglaljon időpontot még ma!
            </h2>
            <p className="m-0 text-base leading-relaxed lg:text-[17px]">
              Ne várjon - egészsége a legfontosabb. Vegye fel velünk a kapcsolatot és foglaljon
              időpontot percek alatt.
            </p>
          </div>
          <PillLink href="/idopontfoglalas" variant="pink" size="lg" arrow>
            Időpontfoglalás
          </PillLink>
        </div>

        {/* Link columns (Sanity siteSettings.footerColumns) */}
        {(columns.length > 0 || socials.length > 0) && (
          <nav
            aria-label="Lábléc navigáció"
            className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 text-[15px]"
          >
            {columns.map((col, i) => (
              <div key={col.key} className="flex flex-col items-start gap-2.5">
                {col.heading && (
                  <h3 className="m-0 text-[15px] font-extrabold text-white">{col.heading}</h3>
                )}
                {col.links.map((link) =>
                  link.href?.trim() ? (
                    <FooterLink key={link._key} href={link.href}>
                      {link.label}
                    </FooterLink>
                  ) : (
                    <span key={link._key}>{link.label}</span>
                  ),
                )}
                {i === socialColumnIdx &&
                  socials.map((s) => (
                    <FooterLink key={s._key} href={s.url}>
                      {SOCIAL_LABELS[s.platform] ?? s.platform}
                    </FooterLink>
                  ))}
              </div>
            ))}
            {columns.length === 0 && (
              <div className="flex flex-col items-start gap-2.5">
                {socials.map((s) => (
                  <FooterLink key={s._key} href={s.url}>
                    {SOCIAL_LABELS[s.platform] ?? s.platform}
                  </FooterLink>
                ))}
              </div>
            )}
          </nav>
        )}

        {/* Legal row */}
        <div className="flex flex-wrap justify-between gap-4 text-[13px] text-navy-faint">
          <span>
            © {year} {displayName}. Minden jog fenntartva.
          </span>
          <span className="flex flex-wrap gap-x-[18px] gap-y-2">
            {legalLinks.map((link) => (
              <FooterLink
                key={link.label}
                href={link.href}
                className="text-navy-faint hover:text-white"
              >
                {link.label}
              </FooterLink>
            ))}
          </span>
        </div>
      </footer>
    </div>
  );
}
