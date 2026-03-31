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

interface ServicesSectionAccordionProps {
  heading?: string;
  categories: ServiceCategoryData[];
  services: ServiceData[];
}

// Modern gradient cards with glassmorphism feel
const CARD_GRADIENTS = [
  {
    gradient: "from-[#2B3674] to-[#1a2550]",
    text: "text-white",
    subtext: "text-white/60",
    accent: "bg-white/10",
    accentHover: "hover:bg-white/20",
    border: "border-white/10",
    listBg: "bg-white/5",
  },
  {
    gradient: "from-[#76c8b6] to-[#7db89e]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/60",
    accent: "bg-white/40",
    accentHover: "hover:bg-white/60",
    border: "border-[#1e2952]/10",
    listBg: "bg-white/30",
  },
  {
    gradient: "from-[#E8D5E0] to-[#d4bfcc]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/60",
    accent: "bg-white/50",
    accentHover: "hover:bg-white/70",
    border: "border-[#1e2952]/10",
    listBg: "bg-white/40",
  },
  {
    gradient: "from-[#D4E5ED] to-[#b8d1de]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/60",
    accent: "bg-white/50",
    accentHover: "hover:bg-white/70",
    border: "border-[#1e2952]/10",
    listBg: "bg-white/40",
  },
  {
    gradient: "from-[#fdf3e4] to-[#e8dfc5]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/60",
    accent: "bg-[#1e2952]/5",
    accentHover: "hover:bg-[#1e2952]/10",
    border: "border-[#1e2952]/10",
    listBg: "bg-white/50",
  },
  {
    gradient: "from-[#c4dfe6] to-[#a8c9d4]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/60",
    accent: "bg-white/50",
    accentHover: "hover:bg-white/70",
    border: "border-[#1e2952]/10",
    listBg: "bg-white/40",
  },
];

export function ServicesSectionAccordion({ heading, categories, services }: ServicesSectionAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getServicesForCategory = (categoryId: string) => {
    return services.filter((service) => service.category?._id === categoryId);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section aria-labelledby="szolgaltatasok-cim" className="px-4 py-12 md:py-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-10 lg:p-12">
          <FadeIn viewport>
            {heading && (
              <h2
                id="szolgaltatasok-cim"
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary mb-10 md:mb-14"
              >
                {heading}
              </h2>
            )}
          </FadeIn>

          {/* 2-Column Accordion Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {categories.map((category, index) => {
              const style = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
              const categoryServices = getServicesForCategory(category._id);
              const isExpanded = expandedId === category._id;

              return (
                <FadeIn key={category._id} viewport delay={index * 0.08}>
                  <motion.div
                    layout
                    transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
                    className={`rounded-3xl overflow-hidden bg-gradient-to-br ${style.gradient} shadow-lg hover:shadow-xl transition-shadow duration-300`}
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleExpand(category._id)}
                      className="w-full p-5 md:p-6 flex items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset"
                    >
                      {/* Emoji Circle */}
                      <div
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl ${style.accent} backdrop-blur-sm transition-colors duration-200 ${style.accentHover}`}
                      >
                        {category.emoji || "🏥"}
                      </div>

                      {/* Title & Count */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg md:text-xl font-bold ${style.text} truncate`}>
                          {category.name}
                        </h3>
                        <p className={`text-sm ${style.subtext} mt-0.5`}>
                          {categoryServices.length} szolgáltatás
                        </p>
                      </div>

                      {/* Expand/Collapse Icon */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.accent} transition-colors duration-200 ${style.accentHover}`}
                      >
                        <svg
                          className={`w-5 h-5 ${style.text}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.25, delay: isExpanded ? 0.1 : 0 }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 md:px-6 pb-5 md:pb-6">
                            {/* Services List */}
                            <div className={`rounded-2xl overflow-hidden ${style.listBg} backdrop-blur-sm`}>
                              {categoryServices.map((service, serviceIndex) => (
                                <motion.div
                                  key={service._id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: serviceIndex * 0.05 }}
                                  className={`flex items-center justify-between p-4 ${
                                    serviceIndex !== categoryServices.length - 1
                                      ? `border-b ${style.border}`
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {service.icon?.asset && (
                                      <div className={`w-8 h-8 rounded-lg ${style.accent} flex items-center justify-center flex-shrink-0`}>
                                        <Image
                                          src={urlFor(service.icon).width(48).height(48).url()}
                                          alt=""
                                          width={20}
                                          height={20}
                                          className="w-5 h-5 object-contain"
                                        />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className={`font-medium ${style.text} block truncate`}>
                                        {service.name}
                                      </span>
                                      {service.description && (
                                        <span className={`text-xs ${style.subtext} block truncate mt-0.5`}>
                                          {service.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {service.price != null && (
                                    <span className={`font-bold whitespace-nowrap ml-4 text-sm md:text-base ${style.text}`}>
                                      {service.price.toLocaleString("hu-HU")} Ft
                                    </span>
                                  )}
                                </motion.div>
                              ))}

                              {categoryServices.length === 0 && (
                                <div className={`p-6 text-center ${style.subtext}`}>
                                  Nincs elérhető szolgáltatás ebben a kategóriában.
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>

          {/* Optional: "View all services" link */}
          <div className="mt-10 text-center">
            <a
              href="/szolgaltatasok-es-arak"
              className="inline-flex items-center gap-2 text-primary/60 hover:text-primary font-medium transition-colors"
            >
              Összes szolgáltatás és árlista
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
