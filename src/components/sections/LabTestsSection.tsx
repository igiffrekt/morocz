"use client";

import { motion } from "motion/react";
import Image from "next/image";
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

function formatPrice(price: number): string {
  return `${price.toLocaleString("hu-HU")} Ft`;
}

export function LabTestsSection({ heading, labTests }: LabTestsSectionProps) {
  return (
    <section className="bg-primary rounded-3xl px-6 py-12 md:px-10 md:py-16">
      {heading && (
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8">{heading}</h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {labTests.map((test, index) => {
          const colorClass = pastelColors[index % pastelColors.length];
          const delay = Math.min(index * 0.1, 0.4);
          const hasIllustration = test.illustration?.asset != null;

          return (
            <motion.div
              key={test._id}
              className={`${colorClass} rounded-2xl p-6 flex flex-col gap-3 min-h-[160px] relative overflow-hidden`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay }}
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

      <div className="mt-8 text-center">
        <a
          href="/laborvizsgalatok"
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-6 py-3 transition-colors duration-300"
        >
          További vizsgálatok
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
