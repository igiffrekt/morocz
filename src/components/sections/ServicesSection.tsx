"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";

type SanityImageObject = {
  _type: "image";
  asset?: { _ref: string; _type: "reference"; _weak?: boolean; [key: string]: unknown };
  media?: unknown;
  hotspot?: unknown;
  crop?: unknown;
} | null;

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

// Colors for the stacked cards
const CARD_COLORS = [
  "#2B3674", // primary dark blue
  "#76c8b6", // sage green
  "#e1bbcd", // dusty rose
  "#c4dfe6", // light blue
  "#f9e4b7", // light gold
];

const CARD_HEIGHT = 80; // collapsed card header height
const STACK_OFFSET = 16; // visible portion of stacked cards

export function ServicesSection({ heading, categories, services }: ServicesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Get services for a category
  const getServicesForCategory = (categoryId: string) => {
    return services.filter((service) => service.category?._id === categoryId);
  };

  const expandedIndex = expandedId ? categories.findIndex((c) => c._id === expandedId) : -1;

  // Calculate total height needed for the stacked container when collapsed
  const collapsedHeight = CARD_HEIGHT + (categories.length - 1) * STACK_OFFSET;

  return (
    <section aria-labelledby="szolgaltatasok-cim">
      <div className="bg-white rounded-3xl p-6 md:p-10">
        <FadeIn viewport>
          {heading && (
            <h2
              id="szolgaltatasok-cim"
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary mb-8"
            >
              {heading}
            </h2>
          )}
        </FadeIn>

        {/* Stacked Cards Container */}
        <FadeIn viewport delay={0.15}>
          <div
            className="relative"
            style={{
              minHeight: expandedId ? "auto" : `${collapsedHeight}px`,
            }}
          >
            {categories.map((category, index) => {
              const isExpanded = expandedId === category._id;
              const categoryServices = getServicesForCategory(category._id);
              const cardColor = CARD_COLORS[index % CARD_COLORS.length];
              const isLightCard = index > 0; // First card is dark, rest are light

              // Calculate position
              let topOffset = index * STACK_OFFSET;
              let zIndex = categories.length - index;

              // When a card is expanded, cards below it should move down
              if (expandedId !== null) {
                if (index === expandedIndex) {
                  zIndex = categories.length + 1;
                } else if (index > expandedIndex) {
                  // These cards will be pushed down by the expanded content
                  // They become part of normal flow
                }
              }

              return (
                <motion.div
                  key={category._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    layout: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
                    opacity: { duration: 0.3 },
                    y: { duration: 0.3, delay: index * 0.05 },
                  }}
                  className="rounded-3xl overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: cardColor,
                    position: expandedId === null ? "absolute" : "relative",
                    top: expandedId === null ? `${topOffset}px` : "auto",
                    left: expandedId === null ? 0 : "auto",
                    right: expandedId === null ? 0 : "auto",
                    zIndex,
                    marginBottom: expandedId !== null ? "12px" : 0,
                  }}
                >
                  {/* Card Header - Always visible */}
                  <button
                    onClick={() => toggleExpand(category._id)}
                    className="w-full p-5 md:p-6 flex items-center justify-between text-left cursor-pointer"
                    style={{ minHeight: `${CARD_HEIGHT}px` }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Emoji/Icon circle */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          isLightCard ? "bg-white/50" : "bg-white/20"
                        }`}
                      >
                        {category.emoji || "🏥"}
                      </div>
                      <span
                        className={`text-lg md:text-xl font-bold ${
                          isLightCard ? "text-primary" : "text-white"
                        }`}
                      >
                        {category.name}
                      </span>
                    </div>

                    {/* Arrow button */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 45 : 0 }}
                      transition={{ duration: 0.3 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isLightCard ? "bg-white" : "bg-white/20"
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${isLightCard ? "text-primary" : "text-white"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M7 17L17 7M17 7H7M17 7V17"
                        />
                      </svg>
                    </motion.div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 md:px-6 pb-5 md:pb-6">
                          {/* Services list */}
                          <div
                            className={`rounded-2xl overflow-hidden ${
                              isLightCard ? "bg-white/70" : "bg-white/10"
                            }`}
                          >
                            {categoryServices.map((service, serviceIndex) => (
                              <div
                                key={service._id}
                                className={`flex items-center justify-between p-4 ${
                                  serviceIndex !== categoryServices.length - 1
                                    ? isLightCard
                                      ? "border-b border-gray-200/50"
                                      : "border-b border-white/10"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {service.icon?.asset && (
                                    <Image
                                      src={urlFor(service.icon).width(48).height(48).url()}
                                      alt={service.name ?? ""}
                                      width={24}
                                      height={24}
                                      className="w-6 h-6 object-contain flex-shrink-0"
                                    />
                                  )}
                                  <span
                                    className={`font-medium ${
                                      isLightCard ? "text-primary" : "text-white"
                                    }`}
                                  >
                                    {service.name}
                                  </span>
                                </div>
                                {service.price != null && (
                                  <span
                                    className={`font-bold whitespace-nowrap ml-4 ${
                                      isLightCard ? "text-primary" : "text-white"
                                    }`}
                                  >
                                    {service.price.toLocaleString("hu-HU")} Ft
                                  </span>
                                )}
                              </div>
                            ))}

                            {categoryServices.length === 0 && (
                              <div
                                className={`p-4 text-center ${
                                  isLightCard ? "text-gray-500" : "text-white/60"
                                }`}
                              >
                                Nincs elérhető szolgáltatás ebben a kategóriában.
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
