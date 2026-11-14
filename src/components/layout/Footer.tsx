import Link from "next/link";
import type { ReactNode } from "react";
import { isInternalHref, PillLink } from "@/components/ui/PillButton";
import { cn } from "@/lib/cn";
import { telHref } from "@/lib/site-nav";

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

const COLUMNS = [
  {
    heading: "Szolgáltatások",
    links: [
      { label: "Nőgyógyászat", href: "/nogyogyaszat" },
      { label: "Szülészet", href: "/szuleszet" },
      { label: "Várandósgondozás", href: "/varandosgondozas" },
      { label: "Gyógyszerfelírás", href: "/gyogyszerfeliras" },
      { label: "Szolgáltatások és Árak", href: "/szolgaltatasok-es-arak" },
    ],
  },
  {
    heading: "Információk",
    links: [
      { label: "Időpontfoglalás", href: "/idopontfoglalas" },
      { label: "Lélekző Jóga", href: "/joga" },
      { label: "Blog", href: "/#blog" },
      { label: "Kapcsolat", href: "/kapcsolat" },
    ],
  },
];

const MOBILE_LINKS = [
  { label: "Nőgyógyászat", href: "/nogyogyaszat" },
  { label: "Árak", href: "/szolgaltatasok-es-arak" },
  { label: "Szülészet", href: "/szuleszet" },
  { label: "Lélekző Jóga", href: "/joga" },
  { label: "Várandósgondozás", href: "/varandosgondozas" },
  { label: "Kapcsolat", href: "/kapcsolat" },
];

function FooterLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const classes = cn("link-grow text-navy-soft hover:text-white", className);
  if (isInternalHref(href) && !external) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={classes}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export default function Footer({
  clinicName,
  phone,
  email,
  address,
  socialLinks,
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

  const year = new Date().getFullYear();

  return (
    <div className="mt-12 px-3 md:mt-16 lg:mt-28 lg:px-4">
      {/* ── Phones: compact footer (MobilFooldal) ─────────────────────── */}
      <footer className="site-footer flex flex-col gap-5 rounded-t-[32px] bg-navy px-[22px] pt-[26px] pb-7 text-sm text-navy-soft md:hidden">
        <h2 className="m-0 text-2xl leading-[1.15] font-extrabold text-white">
          Foglaljon időpontot még ma!
        </h2>
        <p className="m-0 leading-relaxed">
          {addressLine}
          {addressLine && <br />}
          {phone && <FooterLink href={telHref(phone)}>{phone}</FooterLink>}
          {phone && email && " · "}
          {email && <FooterLink href={`mailto:${email}`}>{email}</FooterLink>}
        </p>
        <nav aria-label="Lábléc navigáció" className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {MOBILE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="font-bold text-white no-underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap gap-x-3.5 gap-y-2 border-t border-white/12 pt-4 text-xs text-navy-faint">
          {legalLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-navy-faint underline">
              {link.short}
            </Link>
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

        {/* Link columns */}
        <nav
          aria-label="Lábléc navigáció"
          className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 text-[15px]"
        >
          {COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col items-start gap-2.5">
              <h3 className="m-0 text-[15px] font-extrabold text-white">{col.heading}</h3>
              {col.links.map((link) => (
                <FooterLink key={link.href + link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </div>
          ))}
          <div className="flex flex-col items-start gap-2.5">
            <h3 className="m-0 text-[15px] font-extrabold text-white">Kapcsolat</h3>
            {addressLine && <span>{addressLine}</span>}
            {phone && <FooterLink href={telHref(phone)}>{phone}</FooterLink>}
            {email && <FooterLink href={`mailto:${email}`}>{email}</FooterLink>}
            {socials.map((s) => (
              <FooterLink key={s._key} href={s.url} external>
                {SOCIAL_LABELS[s.platform] ?? s.platform}
              </FooterLink>
            ))}
          </div>
        </nav>

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
