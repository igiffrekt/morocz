import Image from "next/image";
import Link from "next/link";
import { cleanServiceName } from "@/lib/price-menu";
import { urlFor } from "@/sanity/lib/image";
import type { LatestBlogPostsQueryResult } from "../../../sanity.types";

type Post = LatestBlogPostsQueryResult[number];

interface BlogTeaserProps {
  heading?: string | null;
  post: Post | undefined;
}

/** Blog column next to the reviews: navy header card + the latest Sanity post. */
export function BlogTeaser({ heading, post }: BlogTeaserProps) {
  const slug = post?.slug?.current;
  if (!post || !slug) return null;
  const title = cleanServiceName(post.title);
  const category = post.category?.name ?? null;
  const image = post.featuredImage?.asset
    ? urlFor(post.featuredImage).width(900).height(450).url()
    : null;

  return (
    <section
      id="blog"
      aria-labelledby="blog-cim"
      className="flex scroll-mt-28 flex-col gap-4 lg:flex-[2_1_380px]"
    >
      <div className="hidden flex-col gap-1.5 rounded-hero bg-navy px-9 py-8 text-white lg:flex">
        <span className="text-[13px] font-bold tracking-[.14em] text-mint-light uppercase">
          Blog
        </span>
        <h2 id="blog-cim" className="m-0 text-[32px] font-extrabold">
          {heading || "Cikkek"}
        </h2>
        <span className="text-[15px] text-navy-soft">
          Hírek és újdonságok a női egészség témakörben
        </span>
      </div>
      <h2 className="sr-only lg:hidden">{heading || "Cikkek"}</h2>
      <Link
        href={`/blog/${slug}`}
        className="card-lift zoom-frame flex flex-1 flex-col overflow-hidden rounded-tile bg-white text-navy no-underline lg:rounded-hero"
      >
        {image && (
          <Image
            src={image}
            alt={title}
            width={900}
            height={450}
            sizes="(min-width: 1024px) 520px, 100vw"
            className="h-[190px] w-full object-cover lg:h-[200px]"
          />
        )}
        <span className="flex flex-col gap-1.5 px-5 py-[18px] lg:gap-2 lg:px-7 lg:py-6">
          {category && (
            <span className="text-[11px] font-extrabold tracking-[.12em] text-teal-ink uppercase lg:text-xs lg:font-bold lg:tracking-[.1em]">
              <span className="lg:hidden">Blog · </span>
              {category}
            </span>
          )}
          <strong className="text-lg leading-[1.3] font-extrabold lg:text-xl">{title}</strong>
        </span>
      </Link>
    </section>
  );
}
