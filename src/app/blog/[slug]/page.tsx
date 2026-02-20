import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  allBlogPostsQuery,
  blogPostBySlugQuery,
  latestBlogPostsQuery,
  relatedBlogPostsQuery,
} from "@/sanity/lib/queries";
import type { BlogPostDetailResult, BlogPostQueryResult } from "../../../../sanity.types";

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
  const post = await sanityFetch<BlogPostDetailResult | null>({
    query: blogPostBySlugQuery,
    params: { slug },
    tags: ["blogPost"],
  });
  return {
    title: post?.title ? `${post.title} | Morocz Medical Blog` : "Blog | Morocz Medical",
    description: post?.metaDescription || post?.excerpt || undefined,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await sanityFetch<BlogPostDetailResult | null>({
    query: blogPostBySlugQuery,
    params: { slug },
    tags: ["blogPost"],
  });

  if (!post) {
    notFound();
  }

  // Fetch related posts — fallback to latest if no category or too few results
  let relatedPosts: BlogPostQueryResult[] = [];
  if (post.category?._id) {
    relatedPosts = await sanityFetch<BlogPostQueryResult[]>({
      query: relatedBlogPostsQuery,
      params: { categoryId: post.category._id, currentPostId: post._id },
      tags: ["blogPost"],
    });
  }
  if (relatedPosts.length < 2) {
    relatedPosts = await sanityFetch<BlogPostQueryResult[]>({
      query: latestBlogPostsQuery,
      tags: ["blogPost"],
    });
  }
  // Limit to 3 and exclude current post
  relatedPosts = relatedPosts.filter((p) => p._id !== post._id).slice(0, 3);

  const hasFeaturedImage = post.featuredImage?.asset != null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-primary transition-colors duration-200">
              Kezdőlap
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
            alt={post.title ?? "Blog bejegyzés"}
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
    </main>
  );
}
