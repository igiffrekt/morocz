import type { Metadata } from "next";
import { BlogSection } from "@/components/sections/BlogSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HeroServiceCards } from "@/components/sections/HeroServiceCards";
import { LabTestsSection } from "@/components/sections/LabTestsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  allLabTestsQuery,
  allServiceCategoriesQuery,
  allServicesQuery,
  allTestimonialsQuery,
  homepageQuery,
  latestBlogPostsQuery,
  siteSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  BlogPostQueryResult,
  Homepage,
  LabTestQueryResult,
  ServiceCategoryQueryResult,
  ServiceQueryResult,
  SiteSettings,
  TestimonialQueryResult,
} from "../../sanity.types";

// ─── Homepage Metadata ────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const [homepage, settings] = await Promise.all([
    sanityFetch<Homepage | null>({ query: homepageQuery, tags: ["homepage"] }),
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

// ─── Homepage Page ────────────────────────────────────────────────────────────

export default async function Home() {
  const [homepage, settings, categories, services, labTests, testimonials, latestPosts] =
    await Promise.all([
      sanityFetch<Homepage | null>({ query: homepageQuery, tags: ["homepage"] }),
      sanityFetch<SiteSettings | null>({ query: siteSettingsQuery, tags: ["siteSettings"] }),
      sanityFetch<ServiceCategoryQueryResult[]>({
        query: allServiceCategoriesQuery,
        tags: ["serviceCategory"],
      }),
      sanityFetch<ServiceQueryResult[]>({ query: allServicesQuery, tags: ["service"] }),
      sanityFetch<LabTestQueryResult[]>({ query: allLabTestsQuery, tags: ["labTest"] }),
      sanityFetch<TestimonialQueryResult[]>({
        query: allTestimonialsQuery,
        tags: ["testimonial"],
      }),
      sanityFetch<BlogPostQueryResult[]>({ query: latestBlogPostsQuery, tags: ["blogPost"] }),
    ]);

  const clinicJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MedicalClinic", "LocalBusiness"],
        "@id": "https://moroczmedical.hu/#clinic",
        name: "Morocz Medical",
        description: settings?.metaDescription ?? "Egészségügyi szolgáltatások Esztergomban",
        url: "https://moroczmedical.hu",
        telephone: settings?.phone ?? "",
        email: settings?.email ?? "",
        address: {
          "@type": "PostalAddress",
          // PLACEHOLDER: User will provide exact street address
          streetAddress: "",
          addressLocality: "Esztergom",
          addressRegion: "Komárom-Esztergom",
          // PLACEHOLDER: User will provide postal code
          postalCode: "",
          addressCountry: "HU",
        },
        geo: {
          "@type": "GeoCoordinates",
          // PLACEHOLDER: User will verify or provide exact GPS coordinates
          latitude: 47.7933,
          longitude: 18.7404,
        },
        openingHoursSpecification: [
          // PLACEHOLDER: User will provide actual opening hours per day
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "08:00",
            closes: "16:00",
          },
        ],
        image: settings?.defaultOgImage?.asset
          ? urlFor(settings.defaultOgImage).width(1200).height(630).url()
          : undefined,
        priceRange: "$$",
        medicalSpecialty: "GeneralPractice",
        inLanguage: "hu",
      },
      {
        "@type": "Physician",
        "@id": "https://moroczmedical.hu/#physician",
        // PLACEHOLDER: User will provide Dr. Morocz's full name and credentials
        name: "Dr. Morocz",
        // PLACEHOLDER: User will provide exact job title in Hungarian
        jobTitle: "Orvos",
        medicalSpecialty: "GeneralPractice",
        worksFor: { "@id": "https://moroczmedical.hu/#clinic" },
        url: "https://moroczmedical.hu",
        inLanguage: "hu",
      },
    ],
  };

  return (
    <>
      <HeroSection
        headline={homepage?.heroHeadline}
        subtitle={homepage?.heroSubtitle}
        badges={homepage?.heroBadges}
        doctorImage={homepage?.heroDoctorImage}
        phone={settings?.phone}
      />
      <HeroServiceCards cards={homepage?.heroCards} />
      <ServicesSection
        heading={homepage?.servicesHeadline}
        categories={categories ?? []}
        services={services ?? []}
      />
      <LabTestsSection heading={homepage?.labTestsHeadline} labTests={labTests ?? []} />
      <TestimonialsSection
        heading={homepage?.testimonialsHeadline}
        testimonials={testimonials ?? []}
      />
      <BlogSection heading={homepage?.blogHeadline} posts={latestPosts ?? []} />
      <JsonLd data={clinicJsonLd} />
    </>
  );
}
