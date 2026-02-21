"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject, Slug } from "../../../sanity.types";

interface LabTestData {
  _id: string;
  name?: string;
  slug?: Slug;
  description?: string;
  price?: number;
  illustration?: SanityImageObject;
  order?: number;
}

interface LabTestsSectionProps {
  heading?: string;
  labTests: LabTestData[];
}

const pastelColors = ["bg-[#ffebe4]", "bg-[#edf8f3]", "bg-[#fdf8eb]"];

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("hu-HU")} Ft`;
}

const PER_PAGE = 9; // 3 columns × 3 rows

export function LabTestsSection({ heading, labTests }: LabTestsSectionProps) {
  const [page, setPage] = useState(0);
  const direction = useRef(0);
  const totalPages = Math.ceil(labTests.length / PER_PAGE);

  function goToPage(index: number) {
    const clamped = Math.max(0, Math.min(index, totalPages - 1));
    direction.current = clamped > page ? 1 : -1;
    setPage(clamped);
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -50) goToPage(page + 1);
    else if (info.offset.x > 50) goToPage(page - 1);
  }

  const visibleTests = labTests.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <section
      aria-labelledby="laborvizsgalatok-cim"
      className="bg-[#0d112f] rounded-3xl px-6 py-12 md:px-10 md:py-16"
    >
      {heading && (
        <FadeIn viewport>
          <h2
            id="laborvizsgalatok-cim"
            className="text-3xl md:text-4xl font-extrabold text-white mb-8"
          >
            {heading}
          </h2>
        </FadeIn>
      )}

      <FadeIn viewport delay={0.15}>
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction.current}>
            <motion.div
              key={page}
              custom={direction.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              drag={totalPages > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={totalPages > 1 ? handleDragEnd : undefined}
              className="cursor-grab select-none active:cursor-grabbing"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleTests.map((test) => {
                  const colorClass = pastelColors[hashId(test._id) % pastelColors.length];
                  const hasIllustration = test.illustration?.asset != null;
                  const href = test.slug?.current
                    ? `/laborvizsgalatok/${test.slug.current}`
                    : undefined;

                  const card = (
                    <div
                      className={`${colorClass} rounded-2xl p-6 flex flex-col gap-3 min-h-[160px] relative overflow-hidden transition-shadow duration-200 ${href ? "hover:shadow-lg" : ""}`}
                    >
                      {hasIllustration && test.illustration && (
                        <div className="absolute top-4 right-4 opacity-60">
                          <Image
                            src={urlFor(test.illustration).width(48).height(48).url()}
                            alt={test.name ?? "Labor illusztráció"}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-primary">{test.name}</h3>

                      {test.description && (
                        <p className="text-sm text-gray-700 line-clamp-3">{test.description}</p>
                      )}

                      {test.price != null && (
                        <p className="text-xl font-extrabold text-primary mt-auto">
                          {formatPrice(test.price)}
                        </p>
                      )}
                    </div>
                  );

                  return href ? (
                    <Link key={test._id} href={href}>
                      {card}
                    </Link>
                  ) : (
                    <div key={test._id}>{card}</div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot navigation */}
        {totalPages > 1 && (
          <nav aria-label="Laborvizsgálatok navigáció" className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={`lab-page-${i.toString()}`}
                  type="button"
                  aria-label={`${i + 1}. oldal`}
                  onClick={() => goToPage(i)}
                  className={[
                    "rounded-full transition-all duration-300",
                    i === page ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/30 hover:bg-white/50",
                  ].join(" ")}
                />
              ))}
            </div>
          </nav>
        )}
      </FadeIn>
    </section>
  );
}
