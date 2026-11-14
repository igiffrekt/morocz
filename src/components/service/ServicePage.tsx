import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { PathIcon } from "@/components/home/PathIcon";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContactPhonePill } from "@/components/subpage/ContactPills";
import { CtaBand } from "@/components/subpage/CtaBand";
import { PageHero } from "@/components/subpage/PageHero";
import { PillLink } from "@/components/ui/PillButton";
import { SERVICE_CONTENT } from "@/content/services";
import type { ServiceSlug } from "@/content/services/types";
import { bookingHref } from "@/lib/booking-services";
import { cn } from "@/lib/cn";
import type { WeekdayHours } from "@/lib/opening-hours";
import type { PriceMenuItem } from "@/lib/price-menu";
import { formatFt } from "@/lib/service-menu";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  sectionId,
  serviceChapters,
  splitHeroTitle,
  twoDigit,
} from "@/lib/service-page";
import { urlFor } from "@/sanity/lib/image";
import type { DoctorPortrait } from "@/sanity/lib/subpage-data";
import { ServiceActionBar } from "./ServiceActionBar";
import { ServiceBlockView } from "./ServiceBlocks";
import { ServiceChapterBar, ServiceToc } from "./ServiceChapters";
import { ServiceFaq } from "./ServiceFaq";
import { cardTitle, ServiceCardBody, ServiceHeroCard } from "./ServiceHeroCard";
import { ServiceIntroMobile } from "./ServiceIntroMobile";
import { SERVICE_META } from "./service-meta";

export interface ServicePageData {
  /** Sanity price rows for the hero card (see `servicePriceRows`). */
  rows: PriceMenuItem[];
  /** Common surcharges listed in the mobile price sheet (Nőgyógyászat). */
  surcharges: PriceMenuItem[];
  validityNote: string;
  week: WeekdayHours[];
  portrait: DoctorPortrait | null;
}

const PRICES_PATH = "/szolgaltatasok-es-arak";

function SheetBody({ slug, data }: { slug: ServiceSlug; data: ServicePageData }) {
  const meta = SERVICE_META[slug];
  return (
    <>
      <ServiceCardBody
        data={{ slug, rows: data.rows, validityNote: data.validityNote, week: data.week }}
        compact
      />
      {data.surcharges.length > 0 && (
        <div className="flex flex-col gap-2 rounded-[26px] bg-sun-soft px-4 py-3.5">
          <span className="flex items-center gap-2 text-[13px] font-extrabold">
            <span className="inline-flex h-[26px] items-center rounded-full bg-sun px-2.5 whitespace-nowrap">
              + Felár
            </span>
            a vizsgálat díján felül
          </span>
          {data.surcharges.map((row) => (
            <div key={row.id} className="flex justify-between gap-3 text-sm">
              <span className="leading-[1.35] font-bold">{row.name}</span>
              {row.price != null && (
                <strong className="self-start rounded-full bg-white px-2.5 py-[3px] text-[13px] whitespace-nowrap">
                  + {formatFt(row.price)}
                </strong>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <PillLink href={PRICES_PATH} variant="outline" className="h-[52px] flex-1 px-4 text-[15px]">
          Teljes árlista
        </PillLink>
        <PillLink
          href={bookingHref(meta.booking)}
          variant="navy"
          className="h-[52px] flex-[1.3] px-4 text-[15px]"
        >
          Időpontfoglalás
        </PillLink>
      </div>
    </>
  );
}

/**
 * Shared service page (Szolgaltatas / MobilSzolgaltatas): navy hero with the per-service
 * Sanity card, intro, sticky TOC + chapter bar, content blocks, FAQ, CTA band and related
 * services. Copy comes from src/content/services, prices and hours from Sanity.
 */
export function ServicePage({
  slug,
  data,
  jsonLd = [],
}: {
  slug: ServiceSlug;
  data: ServicePageData;
  /** Page-specific structured data (MedicalWebPage) rendered next to the shared ones. */
  jsonLd?: Record<string, unknown>[];
}) {
  const content = SERVICE_CONTENT[slug];
  const meta = SERVICE_META[slug];
  const chapters = serviceChapters(content);
  const { main, accent } = splitHeroTitle(content.title);
  const booking = bookingHref(meta.booking);
  const cardData = { slug, rows: data.rows, validityNote: data.validityNote, week: data.week };
  const portrait = data.portrait?.asset ? urlFor(data.portrait).width(200).height(200).url() : null;
  const sheetTitle =
    slug === "nogyogyaszat"
      ? "Nőgyógyászati vizsgálatok"
      : slug === "szuleszet"
        ? "Rendelési idő"
        : meta.short;

  return (
    <div className="flex flex-col pb-4 lg:pb-0">
      <PageHero
        titleId="szolgaltatas-cim"
        crumbs={[{ label: "Szolgáltatások és Árak", href: PRICES_PATH }, { label: meta.short }]}
        eyebrow={meta.short}
        eyebrowIcon={meta.icon}
        accentClassName={meta.mark}
        title={
          <>
            {main}
            {accent && <span className={meta.highlight}>{accent}</span>}
          </>
        }
        lead={content.intro[0]}
        leadClassName="max-md:hidden"
        aside={<ServiceHeroCard data={cardData} />}
        actions={
          <>
            <PillLink href={booking} variant="pink" size="lg" arrow className="max-sm:hidden">
              Foglaljon időpontot
            </PillLink>
            <PillLink
              href={PRICES_PATH}
              variant="ghost"
              size="lg"
              className="border-[1.5px] border-white/28 font-bold text-white hover:bg-white/10 hover:text-white max-sm:hidden"
            >
              Árak
            </PillLink>
          </>
        }
      />

      <ServiceIntroMobile intro={content.intro} />

      {content.intro[1] && (
        <section
          aria-label="Bemutatkozás"
          className="fade-up mt-24 hidden flex-wrap items-start gap-7 px-[clamp(4px,4vw,56px)] md:flex"
        >
          <div
            className={cn(
              "relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-full",
              meta.mark,
            )}
          >
            {portrait && (
              <Image
                src={portrait}
                alt=""
                fill
                sizes="92px"
                className="object-cover object-[50%_4%]"
              />
            )}
          </div>
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
            <p className="m-0 max-w-[1040px] text-[clamp(21px,2.1vw,28px)] leading-normal font-semibold tracking-[-0.01em] text-navy">
              {content.intro[1]}
            </p>
            <span className="text-[15px] font-bold text-muted">
              Dr. Mórocz Angéla · nőgyógyász szakorvos
            </span>
          </div>
        </section>
      )}

      <div className="mt-3.5 flex flex-col lg:mt-20">
        <ServiceChapterBar chapters={chapters} />

        <div className="flex flex-wrap items-start gap-6">
          <aside className="sticky top-6 hidden min-w-0 flex-[0_1_320px] flex-col gap-3 lg:flex">
            <ServiceToc chapters={chapters} mark={meta.mark} />
            <div className="flex flex-col gap-2.5 rounded-panel bg-navy p-6 text-white">
              <span className="text-[13px] font-extrabold tracking-[.12em] text-mint-light uppercase">
                Időpontfoglalás
              </span>
              <span className="text-lg leading-[1.3] font-extrabold">
                Online időpontfoglalás pár kattintással.
              </span>
              <PillLink
                href={booking}
                variant="pink"
                arrow
                className="mt-1.5 h-[52px] w-full text-[15px]"
              >
                Foglaljon időpontot
              </PillLink>
              <ContactPhonePill
                plain
                className="self-center py-1.5 text-sm font-bold text-navy-soft hover:text-white"
              />
            </div>
          </aside>

          <div className="flex min-w-0 flex-[1_1_600px] flex-col gap-0 lg:gap-4">
            {content.sections.map((section, i) => (
              <section
                key={section.h}
                id={sectionId(i)}
                aria-labelledby={`${sectionId(i)}-cim`}
                className="fade-up flex scroll-mt-[140px] flex-col gap-3.5 px-1.5 pt-[34px] outline-none md:gap-5 md:rounded-hero md:bg-white md:p-[clamp(24px,4vw,48px)] lg:scroll-mt-6 md:[&:not(:first-child)]:mt-4 lg:[&:not(:first-child)]:mt-0"
                style={{ "--i": Math.min(i, 4) } as CSSProperties}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                  <span
                    className={cn(
                      "self-start rounded-full px-3 py-[5px] text-xs font-extrabold tracking-[.14em]",
                      "md:inline-flex md:h-12 md:w-12 md:shrink-0 md:items-center md:justify-center md:self-auto md:p-0 md:text-[15px] md:tracking-normal",
                      // Phones: small sage pill; from md the service accent circle.
                      meta.accent,
                      "max-md:bg-sage max-md:text-teal-ink",
                    )}
                  >
                    {twoDigit(i)}
                  </span>
                  <h2
                    id={`${sectionId(i)}-cim`}
                    className="m-0 text-[26px] leading-[1.15] font-extrabold tracking-[-0.02em] text-navy md:text-[clamp(26px,2.6vw,34px)]"
                  >
                    {section.h}
                  </h2>
                </div>
                {section.blocks.map((block, k) => (
                  <ServiceBlockView
                    // biome-ignore lint/suspicious/noArrayIndexKey: blocks are static, positional copy
                    key={k}
                    block={block}
                    meta={meta}
                    sectionTitle={section.h}
                  />
                ))}
              </section>
            ))}
          </div>
        </div>

        <div className="lg:mt-28">
          <ServiceFaq faq={content.faq} meta={meta} />
        </div>
      </div>

      <div className="mt-10 lg:mt-28">
        <CtaBand
          eyebrow={`Időpontfoglalás · ${meta.short}`}
          title="Foglaljon időpontot"
          text={content.cta}
          href={booking}
          label="Időpontfoglalás"
          className={meta.band}
          buttonVariant="navy"
          buttonClassName={meta.bandButton}
        />
      </div>

      {content.related.length > 0 && (
        <section
          aria-labelledby="kapcsolodo-cim"
          className="mt-10 flex flex-col gap-4 lg:mt-28 lg:gap-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4 px-1.5 md:px-0">
            <div className="flex flex-col gap-2 md:gap-3">
              <span className="text-xs font-bold tracking-[.14em] text-teal-ink uppercase md:text-[13px]">
                Szolgáltatásaink
              </span>
              <h2
                id="kapcsolodo-cim"
                className="m-0 text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em] text-navy sm:text-[44px] lg:text-[52px]"
              >
                Kapcsolódó szolgáltatások
              </h2>
            </div>
            <Link
              href={PRICES_PATH}
              className="link-grow tap-area py-1 text-[15px] font-bold whitespace-nowrap text-navy"
            >
              Szolgáltatások és Árak →
            </Link>
          </div>
          <div className="grid gap-3 md:gap-4 md:[grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            {content.related.map((rel, i) => {
              const rm = SERVICE_META[rel.slug];
              return (
                <div key={rel.slug} className="fade-up flex" style={{ "--i": i } as CSSProperties}>
                  <Link
                    href={rm.href}
                    className={cn(
                      "card-lift flex w-full min-h-[150px] flex-col justify-between rounded-tile p-5 text-navy no-underline hover:text-navy md:min-h-[230px] md:rounded-[36px] md:p-7",
                      rm.tint,
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full md:h-[60px] md:w-[60px]",
                          rm.accent,
                        )}
                      >
                        <PathIcon d={rm.icon} size={24} />
                      </span>
                      <span className="card-go inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy">
                        <PathIcon d="M5 12h14M13 6l6 6-6 6" size={20} strokeWidth={2.2} />
                      </span>
                    </span>
                    <span className="mt-6 flex flex-col gap-1.5 md:mt-9">
                      <span className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[26px]">
                        {rel.h}
                      </span>
                      <span className="text-sm font-semibold text-muted-strong md:text-base">
                        {rel.s}
                      </span>
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ServiceActionBar
        bookingHref={booking}
        label={cardTitle(slug)}
        sheetTitle={sheetTitle}
        schedule={slug === "szuleszet"}
      >
        <SheetBody slug={slug} data={data} />
      </ServiceActionBar>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Kezdőlap", path: "/" },
          { name: "Szolgáltatások és Árak", path: PRICES_PATH },
          { name: meta.short, path: meta.href },
        ])}
      />
      <JsonLd data={faqJsonLd(content.faq)} />
      {jsonLd.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static structured-data list
        <JsonLd key={i} data={item} />
      ))}
    </div>
  );
}
