import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { buildInfoGroups, type InfoItem } from "@/components/home/info-content";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { ClinicStatusCard, ClinicStatusPill } from "@/components/kapcsolat/ClinicStatus";
import {
  ContactInfo,
  type ContactInfoGroup,
  type ContactInfoItem,
  type ContactInfoLink,
} from "@/components/kapcsolat/ContactInfo";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { ArrowIcon, PillLink } from "@/components/ui/PillButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { computeOpeningHours, HU_DAY_NAMES } from "@/lib/opening-hours";
import { findServicePrice } from "@/lib/price-menu";
import { formatFt } from "@/lib/service-menu";
import { telHref } from "@/lib/site-nav";
import { todayInBudapest } from "@/lib/slots";
import { fetchClinicSchedule } from "@/sanity/lib/clinic-schedule";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allServicesQuery, KAPCSOLAT_QUERY, siteSettingsQuery } from "@/sanity/lib/queries";
import type {
  AllServicesQueryResult,
  KAPCSOLAT_QUERYResult,
  SiteSettingsQueryResult,
} from "../../../sanity.types";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Kapcsolat",
  description:
    "Lépjen kapcsolatba velünk. Rendelési idő, elérhetőségek, helyszín és további információ.",
  alternates: { canonical: "/kapcsolat" },
};

const ICONS = {
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  route: "M3 11l19-9-9 19-2-8-8-2z",
  car: "M5 17h14M6 17v2M18 17v2M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6v4H3zM7 13h.01M17 13h.01",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  card: "M2 5h20v14H2zM2 10h20M6 15h4",
} as const;

// ─── Fallbacks (only used if the Sanity document is missing) ──────────────────

const FALLBACK_ADDRESS = "2500 Esztergom, Martsa Alajos utca 6/c";
const FALLBACK_ARRIVAL = [
  {
    title: "Parkolás",
    description: "Rendelőnk mellett ingyenes parkolási lehetőség biztosított.",
    url: null,
  },
  {
    title: "Érkezés",
    description: "Kérjük, 10 perccel a foglalt időpont előtt érkezzen.",
    url: null,
  },
  {
    title: "Fizetés",
    description:
      "Készpénz és bankkártya egyaránt elfogadott. A vizsgálat, illetve a szükséges kezelések árát megtalálja a főoldalon.",
    url: null,
  },
];

// ─── E-mail cards ─────────────────────────────────────────────────────────────

type MailKind = "reception" | "medication" | "urgent";

const MAIL_STYLE: Record<
  MailKind,
  { icon: string; card: string; badge: string; note: string; order: number }
> = {
  reception: {
    icon: ICON_PATHS.mail,
    card: "bg-white",
    badge: "bg-sage text-teal-ink",
    note: "Időpontfoglalással kapcsolatos, illetve egyéb technikai kérdések.",
    order: 0,
  },
  medication: {
    icon: ICON_PATHS.pill,
    card: "bg-blush-soft",
    badge: "bg-blush text-navy",
    note: "Gyógyszert felírni csak a rendelési napokon tudunk.",
    order: 1,
  },
  urgent: {
    icon: ICON_PATHS.alert,
    card: "bg-coral-soft",
    badge: "bg-coral text-navy",
    note: "Sürgős esetben rendelési időben telefonon, rendelési időn kívül pedig e-mailben vegyék fel velünk a kapcsolatot.",
    order: 2,
  },
};

function mailKind(label: string, email: string): MailKind {
  const l = label.toLowerCase();
  if (l.includes("sürgős")) return "urgent";
  if (l.includes("gyógyszer") || email.startsWith("gyogyszer@")) return "medication";
  return "reception";
}

interface MailCard {
  label: string;
  email: string;
  kind: MailKind;
}

/** Hero + detail e-mail addresses from Sanity, one card per address. */
function mailCards(data: KAPCSOLAT_QUERYResult, fallbackEmail?: string | null): MailCard[] {
  const all = [...(data?.heroEmailAddresses ?? []), ...(data?.emailAddresses ?? [])];
  const seen = new Set<string>();
  const cards: MailCard[] = [];
  for (const entry of all) {
    const email = entry.email?.trim();
    if (!email || seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    const label = entry.label?.trim() || "E-mail";
    cards.push({ label, email, kind: mailKind(label, email) });
  }
  if (cards.length === 0 && fallbackEmail) {
    cards.push({ label: "Recepció", email: fallbackEmail, kind: "reception" });
  }
  return cards.sort((a, b) => MAIL_STYLE[a.kind].order - MAIL_STYLE[b.kind].order);
}

// ─── Hasznos információk / Fontos tudnivalók ─────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()/-]{7,}$/;

/**
 * info-content.ts item → accordion item: e-mail / phone highlights become link
 * pills, anything else stays a yellow note.
 */
function toContactItem(item: InfoItem, extraLinks: ContactInfoLink[] = []): ContactInfoItem {
  const links: ContactInfoLink[] = [...extraLinks];
  const notes: string[] = [];
  for (const line of (item.highlight ?? "").split("\n").map((l) => l.trim())) {
    if (!line) continue;
    if (EMAIL_RE.test(line)) links.push({ text: line, href: `mailto:${line}` });
    else if (PHONE_RE.test(line)) links.push({ text: line, href: telHref(line) });
    else notes.push(line);
  }
  return {
    title: item.title,
    body: item.body,
    highlight: notes.join(" · ") || undefined,
    links,
  };
}

const USEFUL = [
  "Időpontfoglalás",
  "Sürgősségi ellátás",
  "Gyógyszer igénylés",
  "Leletek beadása",
  "Egyéb kérdések",
];
const IMPORTANT = [
  "Leletek küldése",
  "Diagnózis felállítása",
  "Igazolások kiállítása",
  "Egészségpénztár",
  "Intimtorna tanfolyam",
  "Magzati genetikai ultrahang",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function KapcsolatPage() {
  const today = todayInBudapest();
  const [data, settings, services, schedule] = await Promise.all([
    sanityFetch<KAPCSOLAT_QUERYResult>({ query: KAPCSOLAT_QUERY, tags: ["kapcsolat"] }),
    sanityFetch<SiteSettingsQueryResult | null>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
    sanityFetch<AllServicesQueryResult | null>({ query: allServicesQuery, tags: ["service"] }),
    fetchClinicSchedule(today),
  ]);

  const phoneEntry = data?.phoneNumbers?.find((p) => p.number);
  const phone = phoneEntry?.number ?? settings?.phone ?? "+36 70 639 5239";
  const phoneLabel = phoneEntry?.label ?? "Rendelési időben";
  const address = (data?.address ?? settings?.address ?? FALLBACK_ADDRESS)
    .replace(/\s*\n\s*/g, ", ")
    .trim();
  const [addressTown, ...addressRest] = address.split(", ");
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  const mails = mailCards(data, settings?.email);
  const receptionEmail = mails.find((m) => m.kind === "reception")?.email ?? settings?.email ?? "";
  const clinicImage = data?.heroImage?.asset?.url ?? "/morocz-medical-kulter.webp";

  // Hours: the schedule in force today (weekly or seasonal) — never a season name.
  const openDays = computeOpeningHours(
    today,
    { days: schedule.weeklyDays },
    schedule.seasonals,
  ).days;
  const week = [1, 2, 3, 4, 5].map((dow) => ({
    name: HU_DAY_NAMES[dow] ?? "",
    hours: openDays.find((d) => d.dayOfWeek === dow)?.hours ?? null,
  }));

  // Accordion copy: the corrected Fontos tudnivalók texts (48 h rule, Sanity fee).
  const certificate = findServicePrice(
    services ?? [],
    "Szakorvosi dokumentáció (igazolás) kiállítása",
  );
  const info = buildInfoGroups({
    phone,
    email: receptionEmail,
    certificatePrice: certificate != null ? formatFt(certificate) : null,
  }).flatMap((g) => g.items);
  const pick = (titles: string[], extra: Record<string, ContactInfoLink[]> = {}) =>
    titles
      .map((t) => info.find((i) => i.title === t))
      .filter((i): i is InfoItem => Boolean(i))
      .map((i) => toContactItem(i, extra[i.title]));

  const groups: ContactInfoGroup[] = [
    {
      id: "hasznos",
      eyebrow: data?.hasznos_label || "Tudnivalók",
      title: data?.hasznos_title || "Hasznos információk",
      lead: data?.hasznos_subtitle || "Válaszok az Ön legfontosabb kérdéseire",
      short: "Hasznos",
      items: pick(USEFUL, {
        Időpontfoglalás: [{ text: "Időpontfoglalás", href: "/idopontfoglalas" }],
      }),
    },
    {
      id: "fontos",
      eyebrow: data?.fontos_label || "Fontos",
      title: data?.fontos_title || "Fontos tudnivalók",
      lead: data?.fontos_subtitle || "Biztonság és komfort az ellátás során",
      short: "Fontos",
      items: pick(IMPORTANT),
    },
  ];

  const arrival = (data?.goodToKnowCards?.length ? data.goodToKnowCards : FALLBACK_ARRIVAL).map(
    (card) => {
      const title = card.title ?? "";
      const t = title.toLowerCase();
      const kind = t.includes("parkol") ? "car" : t.includes("érkez") ? "clock" : "card";
      const style = {
        car: { icon: ICONS.car, tint: "bg-sage", badge: "bg-mint" },
        clock: { icon: ICONS.clock, tint: "bg-sun-soft", badge: "bg-sun" },
        card: { icon: ICONS.card, tint: "bg-blush-soft", badge: "bg-blush" },
      }[kind];
      const link =
        kind === "card"
          ? { href: "/szolgaltatasok-es-arak", text: "Szolgáltatások és Árak", external: false }
          : card.url
            ? { href: card.url, text: "Megnyitás a térképen", external: true }
            : null;
      return { title, description: card.description?.trim() ?? "", link, ...style };
    },
  );

  const routeLabel = (
    <>
      Útvonaltervezés
      <span className="sr-only"> (Google Térkép, új lapon)</span>
    </>
  );

  return (
    <div className="flex flex-col pb-6 lg:pb-0">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="kapcsolat-cim"
        className="relative overflow-hidden rounded-panel bg-navy text-white lg:rounded-hero"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:26px_26px]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-[60px] -right-[60px] h-[190px] w-[190px] rounded-full bg-blush opacity-20 md:hidden"
        />
        <div className="relative flex flex-wrap items-center gap-10 px-5 pt-5 pb-[22px] sm:px-10 sm:py-12 lg:px-16 lg:py-[72px]">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3 md:gap-6">
            <nav
              aria-label="Morzsamenü"
              className="fade-up inline-flex items-center gap-2 self-start rounded-full border border-white/14 bg-white/8 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[#d6d9ec] md:px-4 md:py-2 md:text-[13px]"
            >
              <Link href="/" className="link-grow tap-area text-[#d6d9ec] hover:text-white">
                Kezdőlap
              </Link>
              <span aria-hidden="true" className="opacity-50">
                /
              </span>
              <span aria-current="page" className="text-white">
                Kapcsolat
              </span>
            </nav>
            <span className="fade-up hidden text-[13px] font-bold tracking-[.14em] text-mint-light uppercase [--i:1] md:block">
              Elérhetőségek
            </span>
            <h1
              id="kapcsolat-cim"
              className="fade-up m-0 text-[34px] leading-[1.04] font-extrabold tracking-[-0.025em] [--i:1] md:text-[clamp(48px,6vw,64px)] md:leading-none md:tracking-[-0.03em]"
            >
              {data?.heroTitle || "Kapcsolat"}
            </h1>
            <p className="fade-up m-0 max-w-[520px] text-[15px] leading-[1.55] text-navy-soft [--i:2] md:text-[19px]">
              {data?.heroDescription ||
                "Kérdése van? Keressen minket bizalommal az alábbi elérhetőségek valamelyikén."}
            </p>
            <div className="md:hidden">
              <ClinicStatusPill schedule={schedule} />
            </div>
            <div className="fade-up hidden flex-wrap gap-3 [--i:3] md:flex">
              <PillLink href="/idopontfoglalas" variant="pink" size="lg" arrow>
                Foglaljon időpontot
              </PillLink>
              <PillLink
                href={telHref(phone)}
                variant="ghost"
                size="lg"
                icon={<PathIcon d={ICONS.phone} size={17} strokeWidth={2} />}
                className="border-[1.5px] border-white/28 font-bold text-white hover:bg-white/8 hover:text-white"
              >
                {phone}
              </PillLink>
            </div>
          </div>
          <div className="hidden min-w-0 flex-[0_1_420px] md:block">
            <ClinicStatusCard schedule={schedule} openDays={openDays} />
          </div>
        </div>
      </section>

      {/* ── PHONE: action tiles, clinic, e-mails, hours ──────────────────── */}
      <section aria-label="Elérhetőségeink" className="mt-3 flex flex-col gap-3 md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telHref(phone)}
            className="tap-press col-span-2 flex min-h-[84px] items-center gap-3.5 rounded-tile bg-mint px-4 py-3.5 text-navy no-underline"
          >
            <span className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-navy text-white">
              <PathIcon d={ICONS.phone} size={22} strokeWidth={2} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[11px] font-extrabold tracking-[.12em] uppercase">
                Telefon · {phoneLabel}
              </span>
              <strong className="text-xl font-extrabold whitespace-nowrap">{phone}</strong>
            </span>
            <ArrowIcon size={18} />
          </a>
          {receptionEmail && (
            <a
              href={`mailto:${receptionEmail}`}
              className="tap-press flex min-h-[120px] flex-col gap-2.5 rounded-tile bg-white p-4 text-navy no-underline"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blush-soft">
                <PathIcon d={ICON_PATHS.mail} size={20} />
              </span>
              <strong className="mt-auto text-base">E-mail</strong>
              <span className="text-xs font-semibold text-muted">Recepció</span>
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-press flex min-h-[120px] flex-col gap-2.5 rounded-tile bg-white p-4 text-navy no-underline"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sun-soft">
              <PathIcon d={ICONS.route} size={20} strokeWidth={2} />
            </span>
            <strong className="mt-auto text-base">Útvonal</strong>
            <span className="text-xs font-semibold text-muted">
              Google Maps<span className="sr-only"> (új lapon)</span>
            </span>
          </a>
        </div>

        <div className="overflow-hidden rounded-[30px] bg-navy text-white">
          <Image
            src={clinicImage}
            alt={`A rendelő épülete – ${address}`}
            width={1000}
            height={750}
            sizes="100vw"
            className="block h-[190px] w-full object-cover"
          />
          <div className="flex items-center gap-3 px-[18px] pt-4 pb-[18px]">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[11px] font-extrabold tracking-[.12em] text-mint-light uppercase">
                Rendelő
              </span>
              <address className="text-base leading-[1.35] font-bold not-italic">{address}</address>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Útvonaltervezés a rendelőhöz (Google Térkép, új lapon)"
              className="tap-press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush text-navy"
            >
              <PathIcon d={ICONS.route} size={20} strokeWidth={2} />
            </a>
          </div>
        </div>

        {mails.length > 0 && (
          <div className="mt-5 flex flex-col gap-2.5">
            <div className="px-1.5">
              <span className="text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase">
                Írjon nekünk
              </span>
              <h2 className="m-0 mt-1 text-[26px] font-extrabold tracking-[-0.02em] text-navy">
                E-mail címeink
              </h2>
            </div>
            <ul className="m-0 flex list-none flex-col rounded-tile bg-white p-1.5">
              {mails.map((mail) => {
                const style = MAIL_STYLE[mail.kind];
                return (
                  <li key={mail.email}>
                    <a
                      href={`mailto:${mail.email}`}
                      className="tap-press flex min-h-16 items-center gap-3 rounded-[22px] px-3 py-2.5 text-navy no-underline hover:bg-canvas"
                    >
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          style.badge,
                        )}
                      >
                        <PathIcon d={style.icon} size={18} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-xs font-extrabold tracking-[.08em] text-muted uppercase">
                          {mail.label}
                        </span>
                        <span className="text-sm font-bold break-all">{mail.email}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-1.5 rounded-tile bg-navy px-5 py-[18px] text-white">
          <span className="text-xs font-extrabold tracking-[.12em] text-mint-light uppercase">
            Rendelési idő
          </span>
          {week.map((day) => (
            <span key={day.name} className="flex justify-between gap-4 py-1 text-sm">
              <span className="text-navy-soft">{day.name}</span>
              <span
                className={cn(
                  "whitespace-nowrap tabular-nums",
                  day.hours ? "font-extrabold text-mint-light" : "text-navy-faint",
                )}
              >
                {day.hours ?? "zárva"}
              </span>
            </span>
          ))}
          <span className="mt-1.5 text-xs leading-normal text-navy-soft">
            Telefonon csak a rendelési időben vagyunk elérhetőek.
          </span>
        </div>
      </section>

      {/* ── DESKTOP BENTO ────────────────────────────────────────────────── */}
      <section
        aria-label="Elérhetőségeink"
        className="mt-4 hidden grid-flow-dense gap-4 md:grid md:grid-cols-12"
      >
        <a
          href={telHref(phone)}
          className="card-lift flex min-h-[240px] flex-col gap-3.5 rounded-panel bg-mint p-7 text-navy no-underline md:col-span-6 xl:col-span-4"
        >
          <span className="flex items-center justify-between">
            <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-navy text-white">
              <PathIcon d={ICONS.phone} size={22} strokeWidth={2} />
            </span>
            <span className="card-go inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/50">
              <ArrowIcon size={18} />
            </span>
          </span>
          <span className="mt-auto text-[13px] font-extrabold tracking-[.12em] uppercase">
            Telefon · {phoneLabel}
          </span>
          <span className="text-[clamp(26px,2.4vw,32px)] font-extrabold tracking-[-0.02em] whitespace-nowrap">
            {phone}
          </span>
        </a>

        <div className="zoom-frame fade-up relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-panel bg-navy p-6 text-white [--i:1] md:col-span-12 xl:col-span-8 xl:row-span-2">
          <Image
            src={clinicImage}
            alt={`A rendelő épülete – ${address}`}
            fill
            sizes="(min-width: 1280px) 900px, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,42,95,0)_45%,rgba(36,42,95,.78)_100%)]"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-extrabold tracking-[.12em] text-mint-light uppercase">
                Cím
              </span>
              <address className="text-[clamp(22px,2.2vw,30px)] leading-[1.2] font-extrabold tracking-[-0.02em] not-italic">
                {addressTown}
                {addressRest.length > 0 && (
                  <>
                    ,<br />
                    {addressRest.join(", ")}
                  </>
                )}
              </address>
            </div>
            <PillLink
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              icon={<PathIcon d={ICONS.route} size={18} strokeWidth={2} />}
              className="h-[54px] border-0 px-6 text-[15px]"
            >
              {routeLabel}
            </PillLink>
          </div>
        </div>

        <div className="fade-up flex flex-col gap-3 rounded-panel bg-white p-[26px] [--i:2] md:col-span-6 xl:col-span-4">
          <span className="text-[13px] font-extrabold tracking-[.12em] text-teal-ink uppercase">
            Rendelési idő
          </span>
          <div>
            {week.map((day, index) => (
              <div
                key={day.name}
                className={cn(
                  "flex justify-between py-[9px] text-[15px] text-navy",
                  index < week.length - 1 && "border-b border-line-soft",
                )}
              >
                <span className="font-bold">{day.name}</span>
                <span
                  className={cn(
                    "whitespace-nowrap",
                    day.hours ? "font-extrabold text-teal-ink tabular-nums" : "text-[#6b7280]",
                  )}
                >
                  {day.hours ?? "zárva"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {mails.map((mail, index) => {
          const style = MAIL_STYLE[mail.kind];
          return (
            <a
              key={mail.email}
              href={`mailto:${mail.email}`}
              className={cn(
                "card-lift flex min-h-[230px] flex-col gap-2.5 rounded-panel p-[26px] text-navy no-underline md:col-span-6 xl:col-span-4",
                style.card,
              )}
              style={{ "--i": index + 3 } as CSSProperties}
            >
              <span className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-[52px] w-[52px] items-center justify-center rounded-full",
                    style.badge,
                  )}
                >
                  <PathIcon d={style.icon} size={22} />
                </span>
                <span className="card-go inline-flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  <ArrowIcon size={16} />
                </span>
              </span>
              <span className="text-[13px] font-extrabold tracking-[.12em] uppercase">
                {mail.label}
              </span>
              <span className="text-lg font-extrabold break-words">{mail.email}</span>
              <span className="text-sm leading-[1.55] text-muted-strong">{style.note}</span>
            </a>
          );
        })}
      </section>

      {/* ── JÓ TUDNI ÉRKEZÉS ELŐTT ───────────────────────────────────────── */}
      <section
        aria-labelledby="erkezes-cim"
        className="mt-12 flex flex-col gap-3 md:mt-28 md:gap-8"
      >
        <SectionHeading
          id="erkezes-cim"
          eyebrow={data?.goodToKnowLabel || "Hasznos"}
          title={data?.goodToKnowTitle || "Jó tudni érkezés előtt"}
          lead={data?.goodToKnowSubtitle || "Segítünk, hogy stresszmentes legyen a vizit"}
          className="px-1.5 md:px-0 max-md:[&_h2]:text-[26px] max-md:[&_p]:text-sm"
        />
        <ul className="scrollbar-none -mx-3 m-0 flex list-none snap-x snap-mandatory scroll-px-3 gap-2.5 overflow-x-auto px-3 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {arrival.map((card, index) => (
            <li
              key={card.title}
              className={cn(
                "card-lift flex w-[82%] shrink-0 snap-start flex-col gap-3.5 rounded-panel p-6 md:w-auto md:p-8",
                card.tint,
              )}
              style={{ "--i": index } as CSSProperties}
            >
              <span
                className={cn(
                  "inline-flex h-[52px] w-[52px] items-center justify-center rounded-full text-navy md:h-[60px] md:w-[60px]",
                  card.badge,
                )}
              >
                <PathIcon d={card.icon} size={24} />
              </span>
              <h3 className="m-0 text-xl font-extrabold text-navy md:text-[22px]">{card.title}</h3>
              <p className="m-0 text-sm leading-[1.6] text-muted-strong md:text-base">
                {card.description}
              </p>
              {card.link &&
                (card.link.external ? (
                  <a
                    href={card.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-grow tap-area mt-auto self-start py-0.5 text-[15px] font-extrabold text-navy"
                  >
                    {card.link.text} →<span className="sr-only"> (új lapon)</span>
                  </a>
                ) : (
                  <Link
                    href={card.link.href}
                    className="link-grow tap-area mt-auto self-start py-0.5 text-[15px] font-extrabold text-navy"
                  >
                    {card.link.text} →
                  </Link>
                ))}
            </li>
          ))}
        </ul>
      </section>

      <ContactInfo groups={groups} />

      <MobileActionBar />
    </div>
  );
}
