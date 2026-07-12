import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogSection } from "@/components/sections/BlogSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HeroServiceCards } from "@/components/sections/HeroServiceCards";
import { ServicesSectionBento } from "@/components/sections/ServicesSectionBento";
// import { ServicesSectionScrollStack } from "@/components/sections/ServicesSectionScrollStack"; // Scroll stack version
// import { ServicesSectionAccordion } from "@/components/sections/ServicesSectionAccordion"; // 2-col accordion version
// import { ServicesSection } from "@/components/sections/ServicesSection"; // Original stacked version
import { YogaScheduleSection } from "@/components/sections/YogaScheduleSection";
import { TestimonialCarousel, type Testimonial } from "@/components/ui/testimonial";
import { ImportantInfoSection } from "@/components/sections/ImportantInfoSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  allServiceCategoriesQuery,
  allServicesQuery,
  homepageQuery,
  latestBlogPostsQuery,
  siteSettingsQuery,
  weeklyScheduleQuery,
  yogaScheduleQuery,
} from "@/sanity/lib/queries";
import type {
  LatestBlogPostsQueryResult,
  HomepageQueryResult,
  AllServiceCategoriesQueryResult,
  AllServicesQueryResult,
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

// ─── Structured data helpers ──────────────────────────────────────────────────

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// Opening hours come from the same weeklySchedule doc that drives the booking system,
// so what Google and the answer engines quote can never drift from the bookable reality.
function toOpeningHours(schedule: WeeklyScheduleQueryResult) {
  return (schedule?.days ?? [])
    .filter((day) => !day.isDayOff && day.dayOfWeek != null && day.startTime && day.endTime)
    .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0))
    .map((day) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAYS[day.dayOfWeek as number],
      opens: day.startTime,
      closes: day.endTime,
    }));
}

// ─── Homepage Page ────────────────────────────────────────────────────────────

export default async function Home() {
  const [homepage, settings, categories, services, yogaSchedule, latestPosts, weeklySchedule] =
    await Promise.all([
      sanityFetch<HomepageQueryResult | null>({ query: homepageQuery, tags: ["homepage"] }),
      sanityFetch<SiteSettings | null>({ query: siteSettingsQuery, tags: ["siteSettings"] }),
      sanityFetch<AllServiceCategoriesQueryResult>({
        query: allServiceCategoriesQuery,
        tags: ["serviceCategory"],
      }),
      sanityFetch<AllServicesQueryResult>({ query: allServicesQuery, tags: ["service"] }),
      sanityFetch<YogaScheduleQueryResult>({ query: yogaScheduleQuery, tags: ["yogaSchedule"] }),
      sanityFetch<LatestBlogPostsQueryResult>({ query: latestBlogPostsQuery, tags: ["blogPost"] }),
      sanityFetch<WeeklyScheduleQueryResult>({
        query: weeklyScheduleQuery,
        tags: ["weeklySchedule"],
      }),
    ]);

  // Transform homepage: convert null to undefined for type compatibility
  const transformedHomepage = homepage ? {
    ...homepage,
    heroHeadline: homepage.heroHeadline ?? undefined,
    heroSubtitle: homepage.heroSubtitle ?? undefined,
    heroBadges: (homepage.heroBadges ?? []).map(badge => ({
      _key: badge._key,
      emoji: badge.emoji ?? undefined,
      text: badge.text ?? undefined,
    })),
    heroCards: (homepage.heroCards ?? []).map(card => ({
      _key: card._key,
      title: card.title ?? undefined,
      subtitle: card.subtitle ?? undefined,
      icon: card.icon ?? undefined,
    })),
    servicesHeadline: homepage.servicesHeadline ?? undefined,
    servicesSubtitle: homepage.servicesSubtitle ?? undefined,
    labTestsHeadline: homepage.labTestsHeadline ?? undefined,
    labTestsSubtitle: homepage.labTestsSubtitle ?? undefined,
    testimonialsHeadline: homepage.testimonialsHeadline ?? undefined,
    testimonialsCtaText: homepage.testimonialsCtaText ?? undefined,
    testimonialsCtaUrl: homepage.testimonialsCtaUrl ?? undefined,
    blogHeadline: homepage.blogHeadline ?? undefined,
    ctaHeadline: homepage.ctaHeadline ?? undefined,
    ctaDescription: homepage.ctaDescription ?? undefined,
    metaDescription: homepage.metaDescription ?? undefined,
    heroDoctorImage: homepage.heroDoctorImage ?? undefined,
    ogImage: homepage.ogImage ?? undefined,
  } : null;

  // Transform categories: convert null to undefined for type compatibility
  const transformedCategories = (categories ?? []).map((cat) => ({
    _id: cat._id,
    name: cat.name ?? undefined,
    emoji: cat.emoji ?? undefined,
    order: cat.order ?? undefined,
  }));

  // Transform services: convert null to undefined for type compatibility
  // Also deduplicate by name (keep first occurrence)
  const seenNames = new Set<string>();
  const transformedServices = (services ?? [])
    .map((svc) => ({
      _id: svc._id,
      name: svc.name ?? undefined,
      description: svc.description ?? undefined,
      price: svc.price ?? undefined,
      icon: svc.icon,
      category: svc.category ? {
        _id: svc.category._id,
        name: svc.category.name ?? undefined,
        emoji: svc.category.emoji ?? undefined,
      } : undefined,
      order: svc.order ?? undefined,
    }))
    .filter((svc) => {
      if (!svc.name || seenNames.has(svc.name)) return false;
      seenNames.add(svc.name);
      return true;
    });

  // Transform latestPosts: convert null to undefined for type compatibility
  const transformedLatestPosts = (latestPosts ?? []).map((post) => ({
    _id: post._id,
    title: post.title ?? undefined,
    slug: post.slug ?? undefined,
    category: post.category ? {
      _id: post.category._id,
      name: post.category.name ?? undefined,
    } : undefined,
    featuredImage: post.featuredImage,
    excerpt: post.excerpt ?? undefined,
    content: post.content,
  }));

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
  const openingHours = toOpeningHours(weeklySchedule);

  const clinicJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MedicalClinic", "LocalBusiness"],
        "@id": "https://drmoroczangela.hu/#clinic",
        name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
        description:
          "Szülészet, nőgyógyászati vizsgálatok és várandósgondozás Esztergomban.",
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
    <>
      <HeroSection
        headline={transformedHomepage?.heroHeadline}
        subtitle={transformedHomepage?.heroSubtitle}
        badges={transformedHomepage?.heroBadges}
        doctorImage={transformedHomepage?.heroDoctorImage}
        phone={settings?.phone}
      />
      <HeroServiceCards cards={transformedHomepage?.heroCards} />
      <ServicesSectionBento
        heading={transformedHomepage?.servicesHeadline}
        categories={transformedCategories}
        services={transformedServices}
      />
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <YogaScheduleSection schedule={yogaSchedule ?? []} showCta inlineModal />
      </Suspense>

      {/* ImportantInfo + Testimonials 70-30 layout */}
      <div className="px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 md:gap-8">
          {/* 70% - ImportantInfoSection */}
          <div>
            <ImportantInfoSection />
          </div>
          
          {/* 30% - Testimonials */}
          {transformedHomepage?.testimonialsHeadline && transformedHomepage?.testimonials && (transformedHomepage.testimonials).length > 0 && (
            <div className="relative overflow-hidden rounded-3xl bg-secondary">
              {/* Decorative blobs (matching ImportantInfoSection style) */}
              <div
                className="hidden md:block absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full blur-[120px] opacity-40"
                style={{ background: "radial-gradient(circle, #76c8b6 0%, transparent 70%)" }}
              />
              <div
                className="hidden md:block absolute -bottom-32 right-0 w-[350px] h-[350px] rounded-full blur-[100px] opacity-30"
                style={{ background: "radial-gradient(circle, #b8cfc0 0%, transparent 70%)" }}
              />
              
              {/* Content */}
              <div className="relative z-10 p-6 md:p-10 lg:p-14">
                {/* Overline - matching ImportantInfoSection style */}
                <span className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-primary/40 mb-4">
                  <span className="w-8 h-px bg-primary/20" />
                  Rólunk mondták
                </span>
                
                {/* Heading - matching ImportantInfoSection style */}
                <div className="mb-8 md:mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight">
                    {transformedHomepage.testimonialsHeadline}
                  </h2>
                  
                  {/* Subtitle - matching ImportantInfoSection style */}
                  {transformedHomepage?.testimonialsCtaText && transformedHomepage?.testimonialsCtaUrl && (
                    <a
                      href={transformedHomepage.testimonialsCtaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-base text-primary/45 hover:text-primary/60 transition-colors"
                    >
                      {transformedHomepage.testimonialsCtaText}
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
                
                <TestimonialCarousel
                  testimonials={(transformedHomepage.testimonials).map((t) => ({
                    id: t._id,
                    name: t.patientName ?? "Páciens",
                    avatar: t.photo?.asset ? urlFor(t.photo).width(128).height(128).url() : "https://via.placeholder.com/64",
                    description: t.text ?? "",
                  }))}
                  className="max-w-none"
                  showArrows={true}
                  showDots={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <BlogSection heading={transformedHomepage?.blogHeadline} posts={latestPosts ?? []} />
      <JsonLd data={clinicJsonLd} />
    </>
  );
}
