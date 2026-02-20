"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPostQueryResult } from "../../../sanity.types";

interface BlogSectionProps {
  heading?: string;
  posts: BlogPostQueryResult[];
}

export function BlogSection({ heading, posts }: BlogSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section id="blog" className="px-4 py-12 md:py-20">
      {heading && (
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-8">{heading}</h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post, index) => {
          const delay = Math.min(index * 0.1, 0.3);
          const hasFeaturedImage = post.featuredImage?.asset != null;

          return (
            <motion.div
              key={post._id}
              className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut", delay }}
            >
              <div className="aspect-video rounded-2xl overflow-hidden">
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
                <Link href={`/blog/${post.slug?.current}`}>
                  <h3 className="text-lg font-bold text-primary hover:text-primary/80 transition-colors duration-200">
                    {post.title}
                  </h3>
                </Link>

                {post.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <a
          href="#blog"
          className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-full px-6 py-3 transition-colors duration-300"
        >
          Összes blog bejegyzés
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Nyíl jobbra</title>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
