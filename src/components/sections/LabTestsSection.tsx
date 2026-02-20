"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";

interface LabTestData {
  _id: string;
  name?: string;
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
  const totalPages = Math.ceil(labTests.length / PER_PAGE);

  function goToPage(index: number) {
    setPage(Math.max(0, Math.min(index, totalPages - 1)));
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -50) goToPage(page + 1);
    else if (info.offset.x > 50) goToPage(page - 1);
  }

  const visibleTests = labTests.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section className="bg-[#0d112f] rounded-3xl px-6 py-12 md:px-10 md:py-16">
      {heading && (
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8">{heading}</h2>
      )}

      <motion.div
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

            return (
              <motion.div
                key={test._id}
                className={`${colorClass} rounded-2xl p-6 flex flex-col gap-3 min-h-[160px] relative overflow-hidden`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
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
              </motion.div>
            );
          })}
        </div>
      </motion.div>

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
    </section>
  );
}
