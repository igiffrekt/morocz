import { HeroSection } from "@/components/sections/HeroSection";
import { HeroServiceCards } from "@/components/sections/HeroServiceCards";
import { LabTestsSection } from "@/components/sections/LabTestsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allLabTestsQuery,
  allServiceCategoriesQuery,
  allServicesQuery,
  homepageQuery,
  siteSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  Homepage,
  LabTestQueryResult,
  ServiceCategoryQueryResult,
  ServiceQueryResult,
  SiteSettings,
} from "../../sanity.types";

export default async function Home() {
  const [homepage, settings, categories, services, labTests] = await Promise.all([
    sanityFetch<Homepage | null>({ query: homepageQuery, tags: ["homepage"] }),
    sanityFetch<SiteSettings | null>({ query: siteSettingsQuery, tags: ["siteSettings"] }),
    sanityFetch<ServiceCategoryQueryResult[]>({
      query: allServiceCategoriesQuery,
      tags: ["serviceCategory"],
    }),
    sanityFetch<ServiceQueryResult[]>({ query: allServicesQuery, tags: ["service"] }),
    sanityFetch<LabTestQueryResult[]>({ query: allLabTestsQuery, tags: ["labTest"] }),
  ]);

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
    </>
  );
}
