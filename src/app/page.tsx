import { HeroSection } from "@/components/sections/HeroSection";
import { sanityFetch } from "@/sanity/lib/fetch";
import { homepageQuery, siteSettingsQuery } from "@/sanity/lib/queries";
import type { Homepage, SiteSettings } from "../../sanity.types";

export default async function Home() {
  const homepage = await sanityFetch<Homepage | null>({
    query: homepageQuery,
    tags: ["homepage"],
  });

  // Need phone number from settings for CTA tel: link
  const settings = await sanityFetch<SiteSettings | null>({
    query: siteSettingsQuery,
    tags: ["siteSettings"],
  });

  return (
    <>
      <HeroSection
        headline={homepage?.heroHeadline}
        subtitle={homepage?.heroSubtitle}
        badges={homepage?.heroBadges}
        doctorImage={homepage?.heroDoctorImage}
        cards={homepage?.heroCards}
        phone={settings?.phone}
      />
      {/* Future sections (Phase 4+) will be added below */}
    </>
  );
}
