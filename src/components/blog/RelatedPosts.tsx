import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowIcon } from "@/components/ui/PillButton";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  /** "≈ 2 perc olvasás" or the excerpt. */
  meta: string | null;
  current?: boolean;
}

/** "Cikkek" (BlogCikk): the post being read first, then related / latest posts. */
export function RelatedPosts({ posts }: { posts: ArticleCard[] }) {
  if (posts.length === 0) return null;
  const onlyCurrent = posts.every((p) => p.current);

  return (
    <section aria-labelledby="cikkek-cim" className="mt-14 flex flex-col gap-6 md:mt-28 md:gap-8">
      <SectionHeading
        id="cikkek-cim"
        eyebrow="Blog"
        title="Cikkek"
        lead="Hírek és újdonságok a női egészség témakörben"
        className="px-1.5 md:px-0"
      />
      <ul className="m-0 grid list-none gap-4 p-0 [grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr))]">
        {posts.map((post, index) => (
          <li key={post.id} className="fade-up" style={{ "--i": index } as CSSProperties}>
            <Link
              href={`/blog/${post.slug}`}
              aria-current={post.current ? "page" : undefined}
              className="card-lift zoom-frame flex h-full flex-col overflow-hidden rounded-[32px] bg-white text-navy no-underline md:rounded-hero"
            >
              <span className="relative block h-[220px] overflow-hidden bg-sage md:h-[240px]">
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 440px, 100vw"
                    className="object-cover"
                  />
                )}
                {post.current && (
                  <span className="absolute top-[18px] left-[18px] rounded-full bg-navy px-3.5 py-2 text-xs font-extrabold whitespace-nowrap text-white">
                    Most olvassa
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-2.5 px-7 pt-6 pb-7">
                {post.category && (
                  <span className="text-xs font-bold tracking-[.1em] text-teal-ink uppercase">
                    {post.category}
                  </span>
                )}
                <span className="text-[21px] leading-[1.3] font-extrabold">{post.title}</span>
                <span className="mt-auto flex items-center justify-between gap-3 pt-1.5">
                  <span className="line-clamp-2 text-sm font-semibold text-muted">{post.meta}</span>
                  <span className="card-go inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage">
                    <ArrowIcon size={18} />
                  </span>
                </span>
              </span>
            </Link>
          </li>
        ))}
        {onlyCurrent && (
          <li className="flex min-h-[240px] flex-col items-center justify-center gap-3.5 rounded-[32px] border-2 border-dashed border-line p-8 text-center md:min-h-[380px] md:rounded-hero">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#9aa0b4]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
            <span className="text-lg font-extrabold text-muted">Hamarosan újabb cikkek</span>
          </li>
        )}
      </ul>
    </section>
  );
}
