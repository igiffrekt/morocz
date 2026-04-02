import { Metadata } from "next";
import { Suspense } from "react";
import { sanityFetch } from "@/sanity/lib/fetch";
import { yogaPageQuery, yogaScheduleQuery, yogaInstructorsQuery } from "@/sanity/lib/queries";
import { YogaHeroSection } from "@/components/sections/YogaHeroSection";
import { YogaScheduleSection } from "@/components/sections/YogaScheduleSection";
import { YogaInstructorsSection } from "@/components/sections/YogaInstructorsSection";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await sanityFetch<any>({
    query: yogaPageQuery,
    tags: ["yogaPage"],
  });

  return {
    title: page?.heroHeadline || "Jóga",
    description: page?.metaDescription || "Fedezd fel jógaóráinkat és csatlakozz heti foglalkozásainkhoz.",
    openGraph: {
      title: page?.heroHeadline || "Jóga",
      description: page?.metaDescription || "Fedezd fel jógaóráinkat.",
    },
  };
}

export default async function JogaPage() {
  const [page, schedule, instructors] = await Promise.all([
    sanityFetch<any>({ query: yogaPageQuery, tags: ["yogaPage"] }),
    sanityFetch<any[]>({ query: yogaScheduleQuery, tags: ["yogaSchedule"] }),
    sanityFetch<any[]>({ query: yogaInstructorsQuery, tags: ["yogaInstructor"] }),
  ]);

  return (
    <div className="min-h-screen">
      {/* Spacing for header */}
      <div className="h-4 md:h-6" />

      {/* Hero Section */}
      <YogaHeroSection
        headline={page?.heroHeadline}
        subtitle={page?.heroSubtitle}
        badges={page?.heroBadges}
        heroImage={page?.heroImage}
      />

      {/* Schedule Section */}
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <YogaScheduleSection schedule={schedule || []} />
      </Suspense>

      {/* Instructors Section */}
      {instructors && instructors.length > 0 && (
        <YogaInstructorsSection instructors={instructors} />
      )}
    </div>
  );
}
