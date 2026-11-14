import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { LabBody } from "@/components/lab/LabBody";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContactEmailPill, ContactPhonePill } from "@/components/subpage/ContactPills";
import { CtaBand } from "@/components/subpage/CtaBand";
import { HeroCard, PageHero } from "@/components/subpage/PageHero";
import { ArrowIcon, PillLink } from "@/components/ui/PillButton";
import { paramCount, parseLabBody } from "@/lib/lab-test";
import { formatFt } from "@/lib/service-menu";
import { breadcrumbJsonLd } from "@/lib/service-page";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allLabTestsQuery, labTestBySlugQuery } from "@/sanity/lib/queries";
import type { LabTestBySlugQueryResult } from "../../../../sanity.types";

// ─── Static Generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const tests = await sanityFetch<Array<{ slug: { current: string } }>>({
    query: allLabTestsQuery,
    tags: ["labTest"],
  });
  return tests.filter((t) => t.slug?.current).map((t) => ({ slug: t.slug.current }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await sanityFetch<LabTestBySlugQueryResult | null>({
    query: labTestBySlugQuery,
    params: { slug },
    tags: ["labTest"],
  });

  const title = test?.name ?? "Laborvizsgálat";
  const description = test?.description ?? undefined;

  return {
    // The root layout's title template appends the site name.
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      locale: "hu_HU",
    },
    alternates: {
      canonical: `/laborvizsgalatok/${slug}`,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TUBE = ICON_PATHS.tube;
const PRICES_PATH = "/szolgaltatasok-es-arak";

export default async function LabTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const test = await sanityFetch<LabTestBySlugQueryResult | null>({
    query: labTestBySlugQuery,
    params: { slug },
    tags: ["labTest"],
  });

  if (!test) {
    notFound();
  }

  const name = test.name ?? "Laborcsomag";
  const sections = parseLabBody(test.body);
  const count = sections ? (sections.map((s) => paramCount(s.title)).find(Boolean) ?? null) : null;
  const groups = sections?.flatMap((s) => s.blocks).filter((b) => b.kind === "group") ?? [];
  const hasPrice = test.price != null;

  const priceCard = hasPrice ? (
    <HeroCard>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint-pale text-navy">
            <PathIcon d={TUBE} size={20} strokeWidth={2} />
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.01em]">A csomag ára</span>
        </span>
        {test.discount != null && (
          <span className="rounded-full bg-sun px-3.5 py-2 text-xs font-extrabold whitespace-nowrap">
            -{test.discount}%
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[clamp(40px,4vw,56px)] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
          {formatFt(test.price as number)}
        </span>
        {test.originalPrice != null && (
          <span className="text-lg font-bold text-muted line-through">
            {formatFt(test.originalPrice)}
          </span>
        )}
      </div>
      {(count || groups.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {count && (
            <span className="rounded-full bg-canvas px-3.5 py-2 text-[13px] font-bold whitespace-nowrap">
              {count}
            </span>
          )}
          {groups.length > 0 && (
            <span className="rounded-full bg-canvas px-3.5 py-2 text-[13px] font-bold whitespace-nowrap">
              {groups.length} paramétercsoport
            </span>
          )}
        </div>
      )}
      <Link
        href={PRICES_PATH}
        className="btn-lift mt-0.5 flex min-h-[52px] items-center justify-between gap-2.5 rounded-full bg-navy py-0 pr-2.5 pl-[22px] text-sm font-extrabold whitespace-nowrap text-white no-underline hover:bg-navy-deep hover:text-white"
      >
        Szolgáltatások és Árak
        <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/14">
          <ArrowIcon size={16} />
        </span>
      </Link>
    </HeroCard>
  ) : undefined;

  return (
    <div className="flex flex-col gap-3 pb-4 lg:gap-4 lg:pb-0">
      <PageHero
        titleId="labor-cim"
        crumbs={[{ label: "Szolgáltatások és Árak", href: PRICES_PATH }, { label: name }]}
        eyebrow="Laborcsomag"
        eyebrowIcon={TUBE}
        accentClassName="bg-mint"
        title={name}
        lead={test.description}
        aside={priceCard}
        actions={
          <>
            <ContactPhonePill className="h-[58px] px-[30px] text-base max-sm:hidden" />
            <PillLink
              href={PRICES_PATH}
              variant="ghost"
              size="lg"
              className="border-[1.5px] border-white/28 font-bold text-white hover:bg-white/10 hover:text-white max-sm:hidden"
            >
              Teljes árlista
            </PillLink>
          </>
        }
      >
        {/* Phones / tablets: the price card is hidden, so the price sits in the hero. */}
        {hasPrice && (
          <div className="fade-up flex flex-wrap items-center gap-2 [--i:2] lg:hidden">
            <span className="inline-flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-lg font-extrabold whitespace-nowrap text-navy tabular-nums">
              {formatFt(test.price as number)}
            </span>
            {test.originalPrice != null && (
              <span className="text-sm font-bold whitespace-nowrap text-navy-faint line-through">
                {formatFt(test.originalPrice)}
              </span>
            )}
            {test.discount != null && (
              <span className="rounded-full bg-mint-light px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-navy">
                -{test.discount}%
              </span>
            )}
            {count && (
              <span className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-[#d6d9ec]">
                {count}
              </span>
            )}
          </div>
        )}
      </PageHero>

      <div className="mt-3 lg:mt-20">
        {sections ? (
          <LabBody sections={sections} />
        ) : (
          test.body &&
          test.body.length > 0 && (
            <article className="rounded-[32px] bg-white p-5 md:rounded-hero md:p-12">
              <PortableTextRenderer body={test.body} />
            </article>
          )
        )}
      </div>

      <div className="mt-9 lg:mt-24">
        <CtaBand
          eyebrow="Laborcsomag"
          title="Kérdése van a csomaggal kapcsolatban?"
          text="Rendelési időben telefonon, egyébként e-mailben érhet el minket."
          href="/kapcsolat"
          label="Kapcsolat"
          className="bg-mint text-navy"
          extra={
            <>
              <ContactPhonePill className="h-[58px] bg-white px-7 text-base hover:bg-white max-sm:w-full md:h-[60px]" />
              <ContactEmailPill className="h-[58px] px-7 text-base max-sm:hidden md:h-[60px]" />
            </>
          }
        />
      </div>

      <MobileActionBar />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Kezdőlap", path: "/" },
          { name: "Szolgáltatások és Árak", path: PRICES_PATH },
          { name, path: `/laborvizsgalatok/${test.slug?.current ?? slug}` },
        ])}
      />
    </div>
  );
}
