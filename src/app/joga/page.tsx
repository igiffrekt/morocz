import type { Metadata } from "next";
import { LelekzoJoga } from "@/components/joga/LelekzoJoga";
import { buildYogaTimetable, linkLabel } from "@/lib/yoga";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { yogaPageQuery, yogaScheduleQuery } from "@/sanity/lib/queries";
import { type YogaInstructorDoc, yogaInstructorsWithLinksQuery } from "@/sanity/lib/yoga-queries";
import type { YogaPageQueryResult, YogaScheduleQueryResult } from "../../../sanity.types";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const page = await sanityFetch<YogaPageQueryResult>({ query: yogaPageQuery, tags: ["yogaPage"] });
  const title = page?.heroHeadline || "Lélekző";
  const description =
    page?.metaDescription || "Fedezd fel jógaóráinkat és csatlakozz heti foglalkozásainkhoz.";
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: "/joga" },
  };
}

export default async function JogaPage() {
  const [page, schedule, instructors] = await Promise.all([
    sanityFetch<YogaPageQueryResult>({ query: yogaPageQuery, tags: ["yogaPage"] }),
    sanityFetch<YogaScheduleQueryResult | null>({
      query: yogaScheduleQuery,
      tags: ["yogaSchedule"],
    }),
    sanityFetch<YogaInstructorDoc[] | null>({
      query: yogaInstructorsWithLinksQuery,
      tags: ["yogaInstructor"],
    }),
  ]);

  const timetable = buildYogaTimetable(
    (schedule ?? []).map((s) => ({
      _id: s._id,
      className: s.yogaClass?.name ?? null,
      classColor: s.yogaClass?.color ?? null,
      description: s.yogaClass?.description ?? null,
      instructorName: s.instructor?.name ?? null,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      recurrence: s.recurrence,
      location: s.location,
      notes: s.notes,
    })),
    (instructors ?? []).map((i) => ({
      _id: i._id,
      name: i.name,
      slug: i.slug,
      photoUrl: i.photo?.asset ? urlFor(i.photo).width(640).height(640).fit("crop").url() : null,
      avatarUrl: i.photo?.asset ? urlFor(i.photo).width(168).height(168).fit("crop").url() : null,
      bio: i.bio,
      phone: i.phone,
      email: i.email,
      color: i.color,
      links: (i.links ?? [])
        .filter((l): l is { label: string | null; url: string } => Boolean(l.url))
        .map((l) => ({ label: linkLabel(l.label, l.url), url: l.url })),
    })),
  );

  const heroImageUrl = page?.heroImage?.asset
    ? urlFor(page.heroImage).width(1600).fit("max").url()
    : null;

  return (
    <LelekzoJoga
      headline={page?.heroHeadline || "Lélekző"}
      heroImageUrl={heroImageUrl}
      timetable={timetable}
    />
  );
}
