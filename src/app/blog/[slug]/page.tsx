import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { type ArticleCard, RelatedPosts } from "@/components/blog/RelatedPosts";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { PillLink } from "@/components/ui/PillButton";
import { assetDimensions, portraitFaceRect, readingMinutes } from "@/lib/blog";
import { cleanServiceName } from "@/lib/price-menu";
import { telHref } from "@/lib/site-nav";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  allBlogPostsQuery,
  blogPostBySlugQuery,
  homepageQuery,
  latestBlogPostsQuery,
  relatedBlogPostsQuery,
  siteSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  BlogPostBySlugQueryResult,
  HomepageQueryResult,
  LatestBlogPostsQueryResult,
  RelatedBlogPostsQueryResult,
  SiteSettings,
} from "../../../../sanity.types";

// ─── Static Generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const posts = await sanityFetch<Array<{ slug: { current: string } }>>({
    query: allBlogPostsQuery,
    tags: ["blogPost"],
  });
  return posts.filter((post) => post.slug?.current).map((post) => ({ slug: post.slug.current }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    sanityFetch<BlogPostBySlugQueryResult | null>({
      query: blogPostBySlugQuery,
      params: { slug },
      tags: ["blogPost"],
    }),
    sanityFetch<SiteSettings | null>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
  ]);

  // Same cleaning as the h1 (drops the leading emoji Sanity titles carry).
  const title = cleanServiceName(post?.title) || "Blog";
  const description = post?.metaDescription ?? post?.excerpt ?? undefined;

  // OG image cascade: ogImage > featuredImage > defaultOgImage
  const ogImageUrl =
    post?.ogImage?.asset != null
      ? urlFor(post.ogImage).width(1200).height(630).url()
      : post?.featuredImage?.asset != null
        ? urlFor(post.featuredImage).width(1200).height(630).url()
        : settings?.defaultOgImage?.asset != null
          ? urlFor(settings.defaultOgImage).width(1200).height(630).url()
          : undefined;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      locale: "hu_HU",
      ...(post?.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUTHOR = "Dr. Mórocz Angéla";
const AUTHOR_ROLE = "nőgyógyász szakorvos";
const CAL_PATH = ICON_PATHS.cal;
const CLOCK_PATH = "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2";
const LEAF_PATH =
  "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10ZM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12";

type DoctorImage = NonNullable<NonNullable<HomepageQueryResult>["heroDoctorImage"]>;

/** Round avatar of the doctor: the portrait cut-out cropped around the face. */
function doctorAvatarUrl(image: DoctorImage | null | undefined, px: number): string | null {
  if (!image?.asset) return null;
  const dims = assetDimensions(image.asset._ref);
  const builder = urlFor(image);
  if (!dims) return builder.width(px).height(px).fit("crop").crop("top").url();
  const rect = portraitFaceRect(dims.width, dims.height);
  return builder.rect(rect.left, rect.top, rect.size, rect.size).width(px).height(px).url();
}

function Avatar({ url, size, ring }: { url: string | null; size: number; ring?: boolean }) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-mint ${ring ? "shadow-[0_0_0_6px_var(--color-sage)]" : ""}`}
      style={{ width: size, height: size }}
    >
      {url && (
        // Decorative: the name is always printed next to the avatar.
        <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />
      )}
    </span>
  );
}

function formatHuLongDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Budapest",
  }).format(date);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [post, homepage, settings] = await Promise.all([
    sanityFetch<BlogPostBySlugQueryResult | null>({
      query: blogPostBySlugQuery,
      params: { slug },
      tags: ["blogPost"],
    }),
    sanityFetch<HomepageQueryResult | null>({ query: homepageQuery, tags: ["homepage"] }),
    sanityFetch<SiteSettings | null>({ query: siteSettingsQuery, tags: ["siteSettings"] }),
  ]);

  if (!post) {
    notFound();
  }

  // Related posts — fallback to latest if no category or too few results
  let related: RelatedBlogPostsQueryResult | LatestBlogPostsQueryResult = [];
  if (post.category?._id) {
    related = await sanityFetch<RelatedBlogPostsQueryResult>({
      query: relatedBlogPostsQuery,
      params: { categoryId: post.category._id, currentPostId: post._id },
      tags: ["blogPost"],
    });
  }
  if (related.length < 2) {
    related = await sanityFetch<LatestBlogPostsQueryResult>({
      query: latestBlogPostsQuery,
      tags: ["blogPost"],
    });
  }
  const others = related.filter((p) => p._id !== post._id && p.slug?.current).slice(0, 2);

  const title = cleanServiceName(post.title) || "Blog bejegyzés";
  const body = (post.body ?? []) as ComponentProps<typeof ArticleBody>["body"];
  const minutes = readingMinutes(body);
  const readTime = `≈ ${minutes} perc olvasás`;
  const published = formatHuLongDate(post.publishedAt);
  const category = post.category?.name ?? null;
  const phone = settings?.phone ?? "+36 70 639 5239";
  const address = (settings?.address ?? "2500 Esztergom, Martsa Alajos utca 6/c")
    .replace(/\s*\n\s*/g, ", ")
    .trim();

  const heroDims = assetDimensions(post.featuredImage?.asset?._ref);
  const heroUrl = post.featuredImage?.asset ? urlFor(post.featuredImage).width(1600).url() : null;
  const avatarSmall = doctorAvatarUrl(homepage?.heroDoctorImage, 96);
  const avatarLarge = doctorAvatarUrl(homepage?.heroDoctorImage, 264);

  const cards: ArticleCard[] = [
    {
      id: post._id,
      slug,
      title,
      category,
      imageUrl: post.featuredImage?.asset
        ? urlFor(post.featuredImage).width(880).height(480).url()
        : null,
      meta: readTime,
      current: true,
    },
    ...others.map((p) => ({
      id: p._id,
      slug: p.slug?.current ?? "",
      title: cleanServiceName(p.title),
      // Only the "latest posts" fallback query returns the category.
      category: (p as { category?: { name?: string | null } | null }).category?.name ?? null,
      imageUrl: p.featuredImage?.asset
        ? urlFor(p.featuredImage).width(880).height(480).url()
        : null,
      meta: p.excerpt ?? null,
    })),
  ];

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
        name: "Blog",
        item: "https://drmoroczangela.hu/#blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://drmoroczangela.hu/blog/${post.slug?.current}`,
      },
    ],
  };

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    image: post.featuredImage?.asset
      ? urlFor(post.featuredImage).width(1200).height(630).url()
      : undefined,
    datePublished: post.publishedAt ?? undefined,
    inLanguage: "hu",
    author: {
      "@type": "Organization",
      name: "Morocz Medical",
      url: "https://drmoroczangela.hu",
    },
    publisher: {
      "@type": "Organization",
      name: "Morocz Medical",
      url: "https://drmoroczangela.hu",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://drmoroczangela.hu/blog/${post.slug?.current}`,
    },
  };

  const chip =
    "inline-flex h-12 items-center gap-2 rounded-full bg-white px-[18px] text-sm font-semibold whitespace-nowrap text-muted";

  return (
    <div className="flex flex-col pb-6 lg:pb-0">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="mx-auto mt-4 flex w-full max-w-[1160px] flex-col items-start gap-4 px-1.5 md:mt-12 md:gap-[22px] md:px-0">
        <nav aria-label="Morzsamenü" className="max-w-full">
          <ol className="m-0 inline-flex max-w-full list-none items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-muted md:px-5">
            <li className="shrink-0">
              <Link href="/" className="link-grow tap-area py-0.5 text-muted hover:text-navy">
                Kezdőlap
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#9aa0b4]">
              /
            </li>
            <li className="shrink-0">
              <Link href="/#blog" className="link-grow py-0.5 text-muted hover:text-navy">
                Blog
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#9aa0b4]">
              /
            </li>
            <li aria-current="page" className="min-w-0 truncate font-bold text-navy">
              {title}
            </li>
          </ol>
        </nav>
        {category && (
          <span className="inline-flex items-center gap-2.5 rounded-full bg-sage py-2 pr-[18px] pl-2 text-[13px] font-extrabold tracking-[.04em] whitespace-nowrap text-teal-ink">
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-mint text-navy">
              <PathIcon d={LEAF_PATH} size={14} strokeWidth={2.2} />
            </span>
            {category}
          </span>
        )}
        <h1 className="fade-up m-0 max-w-[980px] text-[clamp(34px,6vw,68px)] leading-[1.04] font-extrabold tracking-[-0.035em] text-navy">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white py-[5px] pr-[18px] pl-[5px] text-sm font-bold whitespace-nowrap text-navy">
            <Avatar url={avatarSmall} size={38} />
            {AUTHOR}
          </span>
          {published && (
            <span className={chip}>
              <PathIcon d={CAL_PATH} size={16} strokeWidth={2} />
              <time dateTime={post.publishedAt ?? undefined}>{published}</time>
            </span>
          )}
          <span className={chip}>
            <PathIcon d={CLOCK_PATH} size={16} strokeWidth={2} />
            {readTime}
          </span>
        </div>
      </header>

      {/* ── Hero image (shown whole) ───────────────────────────────────── */}
      {heroUrl && (
        <div className="mx-auto mt-6 w-full max-w-[1160px] overflow-hidden rounded-panel bg-sage shadow-[0_34px_70px_-44px_rgba(36,42,95,.5)] md:mt-10 md:rounded-hero">
          <Image
            src={heroUrl}
            alt={title}
            width={heroDims?.width ?? 1600}
            height={heroDims?.height ?? 900}
            sizes="(min-width: 1200px) 1160px, 100vw"
            priority
            className="block h-auto w-full"
          />
        </div>
      )}

      {/* ── Body + rail ────────────────────────────────────────────────── */}
      <div className="mx-auto mt-3 grid w-full max-w-[1160px] items-start gap-3 md:mt-6 md:gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-panel bg-white px-[22px] pt-8 pb-10 md:rounded-hero md:px-[72px] md:pt-16 md:pb-[72px]">
          <ArticleBody body={body} />

          <div className="mx-auto mt-12 flex max-w-[680px] flex-wrap items-center gap-5 border-t border-line-soft pt-9">
            <Avatar url={avatarLarge} size={88} ring />
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
              <span className="text-xs font-bold tracking-[.12em] text-teal-ink uppercase">
                A cikk szerzője
              </span>
              <strong className="text-xl font-extrabold text-navy">{AUTHOR}</strong>
              <span className="text-[15px] text-muted">{AUTHOR_ROLE}</span>
            </div>
            <PillLink
              href="/szolgaltatasok-es-arak"
              variant="outline"
              arrow
              className="h-[50px] px-[22px]"
            >
              Szolgáltatások és Árak
            </PillLink>
          </div>
        </article>

        <aside
          aria-label="Időpontfoglalás"
          className="flex flex-wrap gap-3 min-[1100px]:sticky min-[1100px]:top-28 min-[1100px]:flex-col min-[1100px]:flex-nowrap"
        >
          <div className="flex min-w-0 flex-[1_1_300px] flex-col items-start gap-3.5 rounded-panel bg-white p-7">
            <div className="relative m-2.5 h-[132px] w-[132px]">
              <span
                aria-hidden="true"
                className="absolute -inset-2.5 rounded-full border-[1.5px] border-mint/50"
              />
              <Avatar url={avatarLarge} size={132} />
            </div>
            <div className="flex flex-col gap-1">
              <strong className="text-[19px] font-extrabold text-navy">{AUTHOR}</strong>
              <span className="text-sm text-muted">{AUTHOR_ROLE}</span>
            </div>
            <span className="max-w-full rounded-[22px] bg-sage px-4 py-2 text-[13px] font-bold text-teal-ink">
              {address}
            </span>
          </div>
          <div className="relative flex min-w-0 flex-[1_1_300px] flex-col gap-3 overflow-hidden rounded-panel bg-navy p-7 text-white">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:22px_22px]"
            />
            <strong className="relative text-[22px] leading-[1.2] font-extrabold">
              Foglaljon időpontot még ma!
            </strong>
            <span className="relative text-sm leading-[1.6] text-navy-soft">
              Modern nőgyógyászati ellátás Esztergomban. Foglaljon időpontot percek alatt!
            </span>
            <PillLink
              href="/idopontfoglalas"
              variant="mint"
              arrow
              fullWidth
              className="relative h-[52px] bg-mint text-[15px] hover:bg-mint-light"
            >
              Időpontfoglalás
            </PillLink>
            <PillLink
              href={telHref(phone)}
              variant="ghost"
              fullWidth
              className="relative h-12 border-[1.5px] border-white/28 font-bold text-white hover:bg-white/8 hover:text-white"
            >
              {phone}
            </PillLink>
          </div>
        </aside>
      </div>

      <RelatedPosts posts={cards} />

      <MobileActionBar />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={blogPostingJsonLd} />
    </div>
  );
}
