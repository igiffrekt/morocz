import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { JsonLd } from "@/components/seo/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { allLabTestsQuery, labTestBySlugQuery, siteSettingsQuery } from "@/sanity/lib/queries";
import type { LabTestDetailResult, SiteSettings } from "../../../../sanity.types";

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
  const [test, settings] = await Promise.all([
    sanityFetch<LabTestDetailResult | null>({
      query: labTestBySlugQuery,
      params: { slug },
      tags: ["labTest"],
    }),
    sanityFetch<SiteSettings | null>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
  ]);

  const title = test?.name ?? "Laborvizsgálat";
  const description = test?.description ?? undefined;
  const siteName = settings?.siteName ?? "Mórocz Medical";

  return {
    title: `${title} | ${siteName}`,
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

function formatPrice(price: number): string {
  return `${price.toLocaleString("hu-HU")} Ft`;
}

export default async function LabTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const test = await sanityFetch<LabTestDetailResult | null>({
    query: labTestBySlugQuery,
    params: { slug },
    tags: ["labTest"],
  });

  if (!test) {
    notFound();
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Kezdőlap",
        item: "https://drmoroczangela.hu",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Laborvizsgálatok",
        item: "https://drmoroczangela.hu/#laborvizsgalatok",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: test.name,
        item: `https://drmoroczangela.hu/laborvizsgalatok/${test.slug?.current}`,
      },
    ],
  };

  return (
    <div className="bg-white rounded-3xl px-6 py-12 md:px-10 md:py-16">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="max-w-3xl mx-auto mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-primary transition-colors duration-200">
              Kezdőlap
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/#laborvizsgalatok"
              className="hover:text-primary transition-colors duration-200"
            >
              Laborvizsgálatok
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-primary font-medium truncate max-w-[200px]">
            {test.name}
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">{test.name}</h1>

        {/* Price info */}
        {test.price != null && (
          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-2xl font-extrabold text-primary">{formatPrice(test.price)}</span>
            {test.originalPrice != null && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(test.originalPrice)}
              </span>
            )}
            {test.discount != null && (
              <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                -{test.discount}%
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {test.description && (
          <p className="text-lg text-gray-600 leading-relaxed mb-8">{test.description}</p>
        )}

        {/* Body (Portable Text) */}
        {test.body && test.body.length > 0 && <PortableTextRenderer body={test.body} />}

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link
            href="/#laborvizsgalatok"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Vissza a laborvizsgálatokhoz
          </Link>
        </div>
      </article>

      <JsonLd data={breadcrumbJsonLd} />
    </div>
  );
}
