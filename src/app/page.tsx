import type { Metadata } from "next";
import { BlogTeaser } from "@/components/home/BlogTeaser";
import { HomeHero } from "@/components/home/HomeHero";
import { ImportantInfo, type WeekHours } from "@/components/home/ImportantInfo";
import { PriceMenu } from "@/components/home/PriceMenu";
import { Reviews } from "@/components/home/Reviews";
import { type YogaClassSlot, YogaWeek } from "@/components/home/YogaWeek";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { pickBookingServices } from "@/lib/booking-services";
import { computeOpeningHours, HU_DAY_NAMES } from "@/lib/opening-hours";
import { buildPriceMenu, findServicePrice, surchargeExample } from "@/lib/price-menu";
import { addDaysIso, type QuickBookingSchedule } from "@/lib/quick-booking";
import { formatFt } from "@/lib/service-menu";
import {
  type ResolvedSchedule,
  resolveScheduleForDate,
  type SeasonalScheduleSummary,
  todayInBudapest,
} from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  allServiceCategoriesQuery,
  allServicesQuery,
  blockedDatesQuery,
  customAvailabilityForRangeQuery,
  homepageQuery,
  latestBlogPostsQuery,
  pricingPageQuery,
  seasonalSchedulesForRangeQuery,
  servicesForBookingQuery,
  siteSettingsQuery,
  weeklyScheduleQuery,
  yogaScheduleQuery,
} from "@/sanity/lib/queries";
import type {
  AllServiceCategoriesQueryResult,
  AllServicesQueryResult,
  BlockedDatesQueryResult,
  HomepageQueryResult,
  LatestBlogPostsQueryResult,
  PricingPageQueryResult,
  ServicesForBookingQueryResult,
  SiteSettings,
  WeeklyScheduleQueryResult,
  YogaScheduleQueryResult,
} from "../../sanity.types";

// ─── ISR Configuration ────────────────────────────────────────────────────────
// Revalidate every 30 seconds with webhook-based on-demand revalidation
export const revalidate = 30;

// ─── Homepage Metadata ────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const [homepage, settings] = await Promise.all([
    sanityFetch<HomepageQueryResult | null>({ query: homepageQuery, tags: ["homepage"] }),
    sanityFetch<SiteSettings | null>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
  ]);

  const siteName = settings?.siteName ?? settings?.clinicName ?? "Mórocz Medical";
  const description =
    homepage?.metaDescription ??
    settings?.metaDescription ??
    "Mórocz Medical — Egészségügyi szolgáltatások Esztergomban. Foglaljon időpontot online.";

  const ogImageUrl =
    homepage?.ogImage?.asset != null
      ? urlFor(homepage.ogImage).width(1200).height(630).url()
      : settings?.defaultOgImage?.asset != null
        ? urlFor(settings.defaultOgImage).width(1200).height(630).url()
        : undefined;

  return {
    title: {
      absolute: siteName,
    },
    description,
    openGraph: {
      type: "website",
      locale: "hu_HU",
      title: siteName,
      description,
      url: "/",
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
    alternates: {
      canonical: "/",
    },
  };
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

type WeeklyDay = NonNullable<NonNullable<WeeklyScheduleQueryResult>["days"]>[number];

/** Sanity returns nullable fields; the schedule resolver expects plain values. */
function normalizeDay(d: Partial<Omit<WeeklyDay, "_key">>) {
  return {
    dayOfWeek: d.dayOfWeek ?? -1,
    isDayOff: d.isDayOff ?? false,
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
    breakStart: d.breakStart ?? null,
    breakEnd: d.breakEnd ?? null,
  };
}

interface SeasonalDoc {
  startDate: string | null;
  endDate: string | null;
  defaultSlotDuration: number | null;
  bufferMinutes: number | null;
  days: Partial<Omit<WeeklyDay, "_key">>[] | null;
}

interface CustomAvailabilityDoc {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  services: Array<{ _id: string } | null> | null;
}

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Opening hours come from the same schedule documents that drive the booking system
// (weekly, overridden by the seasonal schedule in force today), so what Google and
// the answer engines quote can never drift from the bookable reality.
function toOpeningHours(days: ResolvedSchedule["days"]) {
  return days
    .filter((day) => !day.isDayOff && day.dayOfWeek >= 0 && day.startTime && day.endTime)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .flatMap((day) => {
      const dayOfWeek = SCHEMA_DAYS[day.dayOfWeek];
      // A break splits the day into two published windows so opening hours
      // never claim the clinic is open during the lunch break.
      if (day.breakStart && day.breakEnd) {
        return [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek,
            opens: day.startTime,
            closes: day.breakStart,
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek,
            opens: day.breakEnd,
            closes: day.endTime,
          },
        ];
      }
      return [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek,
          opens: day.startTime,
          closes: day.endTime,
        },
      ];
    });
}

const YOGA_DAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Class colours from the A1 palette, assigned in timetable order (Sanity colour wins). */
const YOGA_PALETTE = ["#469993", "#76c8b6", "#e1bbcd", "#eb8966", "#efc462", "#242a5f"];

function toYogaSlots(schedule: YogaScheduleQueryResult | null): YogaClassSlot[] {
  const slots = (schedule ?? [])
    .map((s) => ({ ...s, dow: YOGA_DAYS[s.dayOfWeek ?? ""] ?? -1 }))
    .filter((s) => s.dow >= 0 && s.startTime && s.endTime && s.yogaClass?.name)
    .sort(
      (a, b) =>
        ((a.dow + 6) % 7) - ((b.dow + 6) % 7) ||
        (a.startTime ?? "").localeCompare(b.startTime ?? ""),
    );
  const colorOf = new Map<string, string>();
  for (const s of slots) {
    const name = s.yogaClass?.name ?? "";
    if (!colorOf.has(name)) {
      colorOf.set(
        name,
        s.yogaClass?.color || YOGA_PALETTE[colorOf.size % YOGA_PALETTE.length] || "#469993",
      );
    }
  }
  return slots.map((s) => ({
    id: s._id,
    dayOfWeek: s.dow,
    start: s.startTime ?? "",
    end: s.endTime ?? "",
    name: s.yogaClass?.name ?? "",
    instructor: s.instructor?.name ?? "",
    color: colorOf.get(s.yogaClass?.name ?? "") ?? "#469993",
    recurrence:
      s.recurrence === "biweekly-even"
        ? "páros hét"
        : s.recurrence === "biweekly-odd"
          ? "páratlan hét"
          : null,
  }));
}

// ─── Homepage Page ────────────────────────────────────────────────────────────

export default async function Home() {
  const today = todayInBudapest();

  const [homepage, settings, weeklySchedule, blockedDoc] = await Promise.all([
    sanityFetch<HomepageQueryResult | null>({ query: homepageQuery, tags: ["homepage"] }),
    sanityFetch<SiteSettings | null>({ query: siteSettingsQuery, tags: ["siteSettings"] }),
    sanityFetch<WeeklyScheduleQueryResult | null>({
      query: weeklyScheduleQuery,
      tags: ["weeklySchedule"],
    }),
    sanityFetch<BlockedDatesQueryResult | null>({
      query: blockedDatesQuery,
      tags: ["blockedDate"],
    }),
  ]);

  const windowDays = weeklySchedule?.bookingWindowDays ?? 30;
  // A couple of spare days: the client may already be on "tomorrow" when the cached page is served.
  const rangeEnd = addDaysIso(today, windowDays + 2);

  const [
    categories,
    services,
    bookingServices,
    seasonalDocs,
    customDocs,
    pricing,
    yoga,
    latestPosts,
  ] = await Promise.all([
    sanityFetch<AllServiceCategoriesQueryResult>({
      query: allServiceCategoriesQuery,
      tags: ["serviceCategory"],
    }),
    sanityFetch<AllServicesQueryResult>({ query: allServicesQuery, tags: ["service"] }),
    sanityFetch<ServicesForBookingQueryResult>({
      query: servicesForBookingQuery,
      tags: ["service"],
    }),
    sanityFetch<SeasonalDoc[] | null>({
      query: seasonalSchedulesForRangeQuery,
      params: { startDate: today, endDate: rangeEnd },
      tags: ["seasonalSchedule"],
    }),
    sanityFetch<CustomAvailabilityDoc[] | null>({
      query: customAvailabilityForRangeQuery,
      params: { startDate: today, endDate: rangeEnd },
      tags: ["customAvailability"],
    }),
    sanityFetch<PricingPageQueryResult | null>({ query: pricingPageQuery, tags: ["pricingPage"] }),
    sanityFetch<YogaScheduleQueryResult | null>({
      query: yogaScheduleQuery,
      tags: ["yogaSchedule"],
    }),
    sanityFetch<LatestBlogPostsQueryResult | null>({
      query: latestBlogPostsQuery,
      tags: ["blogPost"],
    }),
  ]);

  // ── Schedule (weekly → seasonal → customAvailability → blockedDate) ─────────
  const weeklyDays = (weeklySchedule?.days ?? []).map(normalizeDay);
  const seasonals: SeasonalScheduleSummary[] = (seasonalDocs ?? [])
    .filter((s): s is SeasonalDoc & { startDate: string; endDate: string } =>
      Boolean(s.startDate && s.endDate),
    )
    .map((s) => ({
      startDate: s.startDate,
      endDate: s.endDate,
      defaultSlotDuration: s.defaultSlotDuration ?? 20,
      bufferMinutes: s.bufferMinutes ?? 0,
      days: (s.days ?? []).map(normalizeDay),
    }));

  const schedule: QuickBookingSchedule = {
    weeklyDays,
    bookingWindowDays: windowDays,
    seasonals,
    blockedDates: (blockedDoc?.dates ?? []).map((d) => d.date ?? "").filter(Boolean),
    customAvailability: (customDocs ?? [])
      .filter((c): c is CustomAvailabilityDoc & { date: string } => Boolean(c.date))
      .map((c) => ({
        date: c.date,
        startTime: c.startTime,
        endTime: c.endTime,
        serviceIds:
          c.services?.map((s) => s?._id).filter((id): id is string => Boolean(id)) ?? null,
      })),
  };

  const { gyne, prenatal } = pickBookingServices(
    (bookingServices ?? []).filter((s) => s.name != null),
  );
  const serviceIds = { nogyogyaszat: gyne?._id ?? null, varandosgondozas: prenatal?._id ?? null };

  // Hours shown in "Fontos tudnivalók" and published as structured data: today's schedule.
  const resolvedToday = resolveScheduleForDate(
    today,
    { defaultSlotDuration: 0, bufferMinutes: 0, days: weeklyDays },
    seasonals,
  );
  const openDays = computeOpeningHours(today, { days: weeklyDays }, seasonals).days;
  const week: WeekHours[] = [1, 2, 3, 4, 5].map((dow) => ({
    name: HU_DAY_NAMES[dow] ?? "",
    hours: openDays.find((d) => d.dayOfWeek === dow)?.hours ?? null,
  }));

  // ── Prices ──────────────────────────────────────────────────────────────────
  const priceMenu = buildPriceMenu(categories ?? [], services ?? []);
  const certificate = findServicePrice(
    services ?? [],
    "Szakorvosi dokumentáció (igazolás) kiállítása",
  );
  const validityNote = (pricing?.validityNote || "Érvényes 2026. július 1-től.").trim();

  // ── Reviews ─────────────────────────────────────────────────────────────────
  const reviews = (homepage?.testimonials ?? [])
    .filter((t) => t?.text)
    .map((t) => ({ id: t._id, name: t.patientName ?? "Páciens", text: t.text ?? "" }));

  // ── Structured data ─────────────────────────────────────────────────────────
  const clinicPhone = settings?.phone ?? "+36 70 639 5239";
  const clinicAddress = {
    "@type": "PostalAddress",
    streetAddress: "Martsa Alajos utca 6/c.",
    addressLocality: "Esztergom",
    addressRegion: "Komárom-Esztergom",
    postalCode: "2500",
    addressCountry: "HU",
  };
  const clinicImage = settings?.defaultOgImage?.asset
    ? urlFor(settings.defaultOgImage).width(1200).height(630).url()
    : undefined;
  const openingHours = toOpeningHours(resolvedToday.days);

  const clinicJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MedicalClinic", "LocalBusiness"],
        "@id": "https://drmoroczangela.hu/#clinic",
        name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
        description: "Szülészet, nőgyógyászati vizsgálatok és várandósgondozás Esztergomban.",
        url: "https://drmoroczangela.hu",
        telephone: clinicPhone,
        email: settings?.email ?? "",
        address: clinicAddress,
        geo: {
          "@type": "GeoCoordinates",
          latitude: 47.8007963,
          longitude: 18.7430918,
        },
        ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
        image: clinicImage,
        priceRange: "$$",
        medicalSpecialty: "Gynecology",
        inLanguage: "hu",
      },
      {
        // Physician is a LocalBusiness subtype: Google expects the contact fields on
        // this node too, not only on the clinic it links to.
        "@type": "Physician",
        "@id": "https://drmoroczangela.hu/#physician",
        name: "Dr. Mórocz Angéla",
        jobTitle: "Nőgyógyász szakorvos",
        medicalSpecialty: "Gynecology",
        worksFor: { "@id": "https://drmoroczangela.hu/#clinic" },
        url: "https://drmoroczangela.hu",
        telephone: clinicPhone,
        address: clinicAddress,
        image: clinicImage,
        priceRange: "$$",
        ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
        inLanguage: "hu",
      },
    ],
  };

  return (
    <div className="flex flex-col gap-12 pb-0 lg:gap-28">
      <HomeHero
        subtitle={homepage?.heroSubtitle}
        doctorImage={homepage?.heroDoctorImage}
        serviceIds={serviceIds}
        schedule={schedule}
      />
      <PriceMenu
        heading={homepage?.servicesHeadline}
        lead={homepage?.servicesSubtitle}
        validityNote={validityNote}
        categories={priceMenu}
        surchargeExample={surchargeExample(services ?? [])}
      />
      <ImportantInfo
        week={week}
        certificatePrice={certificate != null ? formatFt(certificate) : null}
      />
      <YogaWeek classes={toYogaSlots(yoga)} />
      <div className="flex flex-col gap-12 lg:flex-row lg:flex-wrap lg:gap-4">
        <Reviews
          heading={homepage?.testimonialsHeadline || "Vélemények"}
          reviews={reviews}
          ctaText={homepage?.testimonialsCtaText}
          ctaUrl={homepage?.testimonialsCtaUrl}
        />
        <BlogTeaser heading={homepage?.blogHeadline} post={latestPosts?.[0]} />
      </div>
      <MobileActionBar />
      <JsonLd data={clinicJsonLd} />
    </div>
  );
}
