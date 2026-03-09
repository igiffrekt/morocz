"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
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
  price?: number;
  icon?: SanityImageObject;
  category?: { _id: string; name?: string; emoji?: string };
  order?: number;
}

interface ServicesSectionProps {
  heading?: string;
  categories: ServiceCategoryData[];
  services: ServiceData[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Nőgyógyászati vizsgálat": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  Konzultáció: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Várandósgondozás: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l1 1 1-1c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z" />
      <path d="M9 12c-2.8 1-5 4-5 7.5 0 1.4 1.1 2.5 2.5 2.5h11c1.4 0 2.5-1.1 2.5-2.5 0-3.5-2.2-6.5-5-7.5" />
      <path d="M12 10v4" />
    </svg>
  ),
  "Speciális eljárások": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M6 18h8" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" />
      <path d="M8 6h4" />
      <path d="M13 6V2H9v4" />
    </svg>
  ),
  "Kiegészítő szolgáltatások": (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </svg>
  ),
};

export function ServicesSection({ heading, categories, services }: ServicesSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?._id ?? "");

  const filteredServices = services.filter((service) => service.category?._id === activeCategoryId);

  return (
    <section aria-labelledby="szolgaltatasok-cim">
      <div className="bg-white rounded-3xl p-6 md:p-10">
        <FadeIn viewport>
          <div>
            {heading && (
              <h2
                id="szolgaltatasok-cim"
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary mb-6"
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
                        "rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300 inline-flex items-center gap-2",
                        isActive
                          ? "bg-[#2a4388] text-white"
                          : "bg-white text-primary border border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {cat.name && categoryIcons[cat.name]}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Service cards */}
        <FadeIn viewport delay={0.15}>
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
                    <h3 className="text-lg md:text-xl font-bold text-primary leading-snug">{service.name}</h3>
                  )}
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                  )}
                  {service.price != null && (
                    <p className="text-lg font-extrabold text-primary mt-auto">
                      {service.price.toLocaleString("hu-HU")} Ft
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
