import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { JsonLd } from "@/components/seo/JsonLd";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  allBlogPostsQuery,
  blogPostBySlugQuery,
  latestBlogPostsQuery,
  relatedBlogPostsQuery,
  siteSettingsQuery,
} from "@/sanity/lib/queries";
import type {
  BlogPostBySlugQueryResult,
  RelatedBlogPostsQueryResult,
  SiteSettings,
} from "../../../../sanity.types";

// ΓöÇΓöÇΓöÇ Static Generation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export async function generateStaticParams() {
  const posts = await sanityFetch<Array<{ slug: { current: string } }>>({
    query: allBlogPostsQuery,
    tags: ["blogPost"],
  });
  return posts.filter((post) => post.slug?.current).map((post) => ({ slug: post.slug.current }));
}

// ΓöÇΓöÇΓöÇ Metadata ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

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

  const title = post?.title ?? "Blog | M├│rocz Medical";
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

// ΓöÇΓöÇΓöÇ Page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await sanityFetch<BlogPostBySlugQueryResult | null>({
    query: blogPostBySlugQuery,
    params: { slug },
    tags: ["blogPost"],
  });

  if (!post) {
    notFound();
  }

  // Fetch related posts ΓÇö fallback to latest if no category or too few results
  let relatedPosts: RelatedBlogPostsQueryResult = [];
  if (post.category?._id) {
    relatedPosts = await sanityFetch<RelatedBlogPostsQueryResult>({
      query: relatedBlogPostsQuery,
      params: { categoryId: post.category._id, currentPostId: post._id },
      tags: ["blogPost"],
    });
  }
  if (relatedPosts.length < 2) {
    relatedPosts = await sanityFetch<RelatedBlogPostsQueryResult>({
      query: latestBlogPostsQuery,
      tags: ["blogPost"],
    });
  }
  // Limit to 3 and exclude current post
  relatedPosts = relatedPosts.filter((p) => p._id !== post._id).slice(0, 3);

  const hasFeaturedImage = post.featuredImage?.asset != null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Kezd┼ælap",
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

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-primary transition-colors duration-200">
              Kezd┼ælap
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/#blog" className="hover:text-primary transition-colors duration-200">
              Blog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-primary font-medium truncate max-w-[200px]">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Featured image */}
      {hasFeaturedImage && post.featuredImage && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-6">
          <Image
            src={urlFor(post.featuredImage).width(768).height(432).url()}
            alt={post.title ?? "Blog bejegyz├⌐s"}
            width={768}
            height={432}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-6 mb-8">{post.title}</h1>

      {/* Body */}
      <PortableTextRenderer body={post.body ?? []} />

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <>
          <hr className="my-12 border-gray-200" />
          <RelatedPosts posts={relatedPosts} />
        </>
      )}
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={blogPostingJsonLd} />
    </main>
  );
}
