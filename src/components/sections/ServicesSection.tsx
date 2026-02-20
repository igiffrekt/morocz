"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageObject } from "../../../sanity.types";

interface ServiceCategoryData {
  _id: string;
  name?: string;
  emoji?: string;
  order?: number;
}

interface ServiceData {
  _id: string;
  name?: string;
  description?: string;
  icon?: SanityImageObject;
  category?: { _id: string; name?: string; emoji?: string };
  order?: number;
}

interface ServicesSectionProps {
  heading?: string;
  categories: ServiceCategoryData[];
  services: ServiceData[];
}

export function ServicesSection({ heading, categories, services }: ServicesSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?._id ?? "");

  const filteredServices = services.filter((service) => service.category?._id === activeCategoryId);

  return (
    <section aria-labelledby="szolgaltatasok-cim" className="py-12 md:py-16">
      <div className="max-w-8xl mx-auto px-4 md:px-8">
        {heading && (
          <h2
            id="szolgaltatasok-cim"
            className="text-3xl md:text-4xl font-extrabold text-primary mb-6"
          >
            {heading}
          </h2>
        )}

        {/* Filter tabs — horizontal scrollable pill row */}
        <div className="overflow-x-auto mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex flex-row gap-2 w-max">
            {categories.map((cat) => {
              const isActive = cat._id === activeCategoryId;
              return (
                <button
                  key={cat._id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCategoryId(cat._id)}
                  className={[
                    "rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-white text-primary border border-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {isActive && cat.emoji ? `${cat.emoji} ` : ""}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Service cards container */}
        <div className="bg-white rounded-3xl p-6 md:p-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service) => (
                <motion.div
                  key={service._id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-background-light rounded-2xl p-5 flex flex-col gap-3 min-h-[140px]"
                >
                  {service.icon?.asset && (
                    <Image
                      src={urlFor(service.icon).width(80).height(80).url()}
                      alt={service.name ?? ""}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  {service.name && (
                    <h3 className="text-base font-bold text-primary">{service.name}</h3>
                  )}
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
