import type { Metadata } from "next";
import { BlogSection } from "@/components/sections/BlogSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HeroServiceCards } from "@/components/sections/HeroServiceCards";
import { LabTestsSection } from "@/components/sections/LabTestsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { TestimonialCarousel, type Testimonial } from "@/components/ui/testimonial";
import { ImportantInfoSection } from "@/components/sections/ImportantInfoSection";
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
  const [homepage, settings, categories, services, labTests, latestPosts] =
    await Promise.all([
      sanityFetch<Homepage | null>({ query: homepageQuery, tags: ["homepage"] }),
      sanityFetch<SiteSettings | null>({ query: siteSettingsQuery, tags: ["siteSettings"] }),
      sanityFetch<ServiceCategoryQueryResult[]>({
        query: allServiceCategoriesQuery,
        tags: ["serviceCategory"],
      }),
      sanityFetch<ServiceQueryResult[]>({ query: allServicesQuery, tags: ["service"] }),
      sanityFetch<LabTestQueryResult[]>({ query: allLabTestsQuery, tags: ["labTest"] }),
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
      
      {/* ImportantInfo + Testimonials 70-30 layout */}
      <div className="px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 md:gap-8">
          {/* 70% - ImportantInfoSection */}
          <div>
            <ImportantInfoSection />
          </div>
          
          {/* 30% - Testimonials */}
            <div className="relative overflow-hidden rounded-3xl bg-secondary">
              {/* Decorative blobs (matching ImportantInfoSection style) */}
              <div
                className="hidden md:block absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full blur-[120px] opacity-40"
                style={{ background: "radial-gradient(circle, #99CEB7 0%, transparent 70%)" }}
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
                    {homepage.testimonialsHeadline}
                  </h2>
                  
                  {/* Subtitle - matching ImportantInfoSection style */}
                  {homepage?.testimonialsCtaText && homepage?.testimonialsCtaUrl && (
                    <a
                      href={homepage.testimonialsCtaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-base text-primary/45 hover:text-primary/60 transition-colors"
                    >
                      {homepage.testimonialsCtaText}
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
                
                <TestimonialCarousel
                  testimonials={(homepage.testimonials as TestimonialQueryResult[]).map((t) => ({
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
      <BlogSection heading={homepage?.blogHeadline} posts={latestPosts ?? []} />
      <JsonLd data={clinicJsonLd} />
    </>
  );
}
