import type { Metadata } from "next";
import { BlogSection } from "@/components/sections/BlogSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HeroServiceCards } from "@/components/sections/HeroServiceCards";
import { ImportantInfoSection } from "@/components/sections/ImportantInfoSection";
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
        "@id": "https://drmoroczangela.hu/#clinic",
        name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
        description:
          "Szülészet, nőgyógyászati vizsgálatok és várandósgondozás Esztergomban.",
        url: "https://drmoroczangela.hu",
        telephone: settings?.phone ?? "+36 70 639 5239",
        email: settings?.email ?? "",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Martsa Alajos utca 6/c.",
          addressLocality: "Esztergom",
          addressRegion: "Komárom-Esztergom",
          postalCode: "2500",
          addressCountry: "HU",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 47.8007963,
          longitude: 18.7430918,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Monday",
            opens: "12:00",
            closes: "15:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Tuesday",
            opens: "11:00",
            closes: "14:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Thursday",
            opens: "13:20",
            closes: "17:00",
          },
        ],
        image: settings?.defaultOgImage?.asset
          ? urlFor(settings.defaultOgImage).width(1200).height(630).url()
          : undefined,
        priceRange: "$$",
        medicalSpecialty: "Gynecology",
        inLanguage: "hu",
      },
      {
        "@type": "Physician",
        "@id": "https://drmoroczangela.hu/#physician",
        name: "Dr. Mórocz Angéla",
        jobTitle: "Nőgyógyász szakorvos",
        medicalSpecialty: "Gynecology",
        worksFor: { "@id": "https://drmoroczangela.hu/#clinic" },
        url: "https://drmoroczangela.hu",
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
      <div className="flex flex-col lg:flex-row lg:gap-3 lg:items-center">
        <div className="lg:w-[65%]">
          <ImportantInfoSection />
        </div>
        <div className="lg:w-[35%]">
          <TestimonialsSection
            heading={homepage?.testimonialsHeadline}
            testimonials={testimonials ?? []}
          />
        </div>
      </div>
      <BlogSection heading={homepage?.blogHeadline} posts={latestPosts ?? []} />
      <JsonLd data={clinicJsonLd} />
    </>
  );
}
