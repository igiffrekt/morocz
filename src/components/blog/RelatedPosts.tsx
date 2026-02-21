import Image from "next/image";
import { CircleWipeLink } from "@/components/motion/CircleWipeLink";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPostQueryResult } from "../../../sanity.types";

interface RelatedPostsProps {
  posts: BlogPostQueryResult[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-primary mb-6">Kapcsolódó bejegyzések</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => {
          const hasFeaturedImage = post.featuredImage?.asset != null;

          return (
            <div
              key={post._id}
              className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
            >
              <div className="aspect-video overflow-hidden">
                {hasFeaturedImage && post.featuredImage ? (
                  <Image
                    src={urlFor(post.featuredImage).width(600).height(340).url()}
                    alt={post.title ?? "Blog bejegyzés"}
                    width={600}
                    height={340}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>

              <div className="flex flex-col gap-2 p-5 flex-1">
                <CircleWipeLink href={`/blog/${post.slug?.current}`}>
                  <h3 className="text-base font-bold text-primary hover:text-primary/80 transition-colors duration-200">
                    {post.title}
                  </h3>
                </CircleWipeLink>

                {post.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
