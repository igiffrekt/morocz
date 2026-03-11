"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { CircleWipeLink } from "@/components/motion/CircleWipeLink";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPostQueryResult } from "../../../sanity.types";

interface BlogSectionProps {
  heading?: string;
  posts: BlogPostQueryResult[];
}

function CategoryPill({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="self-start border border-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
      {name}
    </span>
  );
}

export function BlogSection({ heading, posts }: BlogSectionProps) {
  if (posts.length === 0) return null;

  const leftPost = posts[0];
  const rightPost = posts[1];
  const leftHasImage = leftPost?.featuredImage?.asset != null;
  const rightHasImage = rightPost?.featuredImage?.asset != null;

  return (
    <section id="blog" aria-labelledby="blog-cim" className="px-4 py-12 md:py-20">
      {/* Header: overline, heading, subheading */}
      <div className="mb-12">
        {/* Overline with decorative line */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-primary/40 mb-4"
        >
          <span className="w-8 h-px bg-primary/20" />
          Blog Cikkek
        </motion.span>

        {/* Heading */}
        {heading && (
          <motion.h2
            id="blog-cim"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-3xl md:text-4xl font-extrabold text-primary mb-4"
          >
            {heading}
          </motion.h2>
        )}

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="text-base text-primary/45"
        >
          Read our latest insights about medical care and wellness
        </motion.p>
      </div>

      {/* Cards grid – 30/70 split on desktop */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_3fr]">
        {/* Left card – grey background, compact */}
        {leftPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <CircleWipeLink
              href={`/blog/${leftPost.slug?.current}`}
              className="group flex h-full flex-col rounded-3xl bg-[#edf0f5] p-10 transition-shadow hover:shadow-md"
            >
              <CategoryPill name={leftPost.category?.name} />

              <div className="mt-3 overflow-hidden rounded-2xl">
                {leftHasImage && leftPost.featuredImage ? (
                  <Image
                    src={urlFor(leftPost.featuredImage).width(400).height(260).url()}
                    alt={leftPost.title ?? "Blog bejegyzés"}
                    width={400}
                    height={260}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex aspect-[3/2] w-full items-center justify-center bg-gray-200/60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-primary/15"
                      aria-hidden="true"
                    >
                      <title>Kép helykitöltő</title>
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>

              <h3 className="mt-auto pt-4 text-xl font-extrabold leading-snug text-primary transition-colors group-hover:text-primary/80 md:text-2xl">
                {leftPost.title}
              </h3>
            </CircleWipeLink>
          </motion.div>
        )}

        {/* Right card – featured image background with text overlay */}
        {rightPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          >
            <CircleWipeLink
              href={`/blog/${rightPost.slug?.current}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl transition-shadow hover:shadow-md"
            >
              {/* Featured image as background (80% transparent = 20% opacity) */}
              <div className="absolute inset-0">
                {rightHasImage && rightPost.featuredImage ? (
                  <Image
                    src={urlFor(rightPost.featuredImage).width(800).height(500).url()}
                    alt={rightPost.title ?? "Blog bejegyzés"}
                    width={800}
                    height={500}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-20"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200/60" />
                )}
              </div>

              {/* Text overlay on top of image */}
              <div className="relative flex flex-col p-8 md:p-12">
                <CategoryPill name={rightPost.category?.name} />

                <div className="mt-auto flex flex-col gap-8 pt-6">
                  <h3 className="text-2xl font-extrabold leading-snug text-primary md:text-3xl">
                    {rightPost.title}
                  </h3>

                  <span className="relative inline-flex w-fit items-center">
                    {/* Left circle – hidden, scales in on hover */}
                    <span className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 scale-0 items-center justify-center rounded-full bg-white text-primary transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-100">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Nyíl jobbra</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 12h14m0 0l-5-5m5 5l-5 5"
                        />
                      </svg>
                    </span>
                    {/* Pill – slides right on hover */}
                    <span className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-bold text-primary whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:translate-x-12">
                      Elolvasom
                    </span>
                    {/* Right circle – scales out on hover */}
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-0">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Nyíl jobbra</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 12h14m0 0l-5-5m5 5l-5 5"
                        />
                      </svg>
                    </span>
                  </span>
                </div>
              </div>
            </CircleWipeLink>
          </motion.div>
        )}
      </div>
    </section>
  );
}
