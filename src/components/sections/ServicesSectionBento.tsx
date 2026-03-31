"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";

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

interface ServicesSectionBentoProps {
  heading?: string;
  categories: ServiceCategoryData[];
  services: ServiceData[];
}

// Bento card color palette - brand colors
const CARD_STYLES = [
  { bg: "bg-[#2B3674]", text: "text-white", subtext: "text-white/60", accent: "bg-white/20", hoverAccent: "group-hover:bg-white/30", border: "border-white/10" },
  { bg: "bg-[#76c8b6]", text: "text-[#1e2952]", subtext: "text-[#1e2952]/60", accent: "bg-white/50", hoverAccent: "group-hover:bg-white/70", border: "border-[#1e2952]/10" },
  { bg: "bg-[#eb8966]", text: "text-white", subtext: "text-white/70", accent: "bg-white/30", hoverAccent: "group-hover:bg-white/40", border: "border-white/10" },
  { bg: "bg-[#469993]", text: "text-white", subtext: "text-white/70", accent: "bg-white/30", hoverAccent: "group-hover:bg-white/40", border: "border-white/10" },
  { bg: "bg-[#efc462]", text: "text-[#1e2952]", subtext: "text-[#1e2952]/60", accent: "bg-white/50", hoverAccent: "group-hover:bg-white/70", border: "border-[#1e2952]/10" },
  { bg: "bg-[#e6f5f2]", text: "text-[#1e2952]", subtext: "text-[#1e2952]/60", accent: "bg-[#469993]/20", hoverAccent: "group-hover:bg-[#469993]/30", border: "border-[#469993]/20" },
];

export function ServicesSectionBento({ heading, categories, services }: ServicesSectionBentoProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getServicesForCategory = (categoryId: string) => {
    return services.filter((service) => service.category?._id === categoryId);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section aria-labelledby="szolgaltatasok-cim" className="px-4 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-10">
          <FadeIn viewport>
            {heading && (
              <h2
                id="szolgaltatasok-cim"
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary mb-8 md:mb-12"
              >
                {heading}
              </h2>
            )}
          </FadeIn>

          {/* Bento Grid - 2 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {categories.map((category, index) => {
              const style = CARD_STYLES[index % CARD_STYLES.length];
              const categoryServices = getServicesForCategory(category._id);
              const isExpanded = expandedId === category._id;
              const serviceCount = categoryServices.length;

              return (
                <FadeIn key={category._id} viewport delay={index * 0.1}>
                  <motion.div
                    layout="position"
                    transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                    className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-300 ${style.bg} hover:shadow-xl hover:shadow-black/10`}
                    onClick={() => toggleExpand(category._id)}
                  >
                    {/* Card Header */}
                    <div className="p-6 md:p-8">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Title + Count */}
                        <div>
                          <h3 className={`text-xl md:text-2xl font-bold ${style.text}`}>
                            {category.name}
                          </h3>
                          <p className={`text-sm mt-1 ${style.subtext}`}>
                            {serviceCount} szolgáltatás
                          </p>
                        </div>

                        {/* Right: Expand indicator */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.accent} ${style.hoverAccent} transition-colors duration-300`}
                        >
                          <svg
                            className={`w-5 h-5 ${style.text}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </motion.div>
                      </div>

                      {/* Preview of services when collapsed */}
                      <AnimatePresence mode="wait">
                        {!isExpanded && categoryServices.length > 0 && (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 flex flex-wrap gap-2">
                              {categoryServices.slice(0, 3).map((service) => (
                                <span
                                  key={service._id}
                                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${style.accent} ${style.text}`}
                                >
                                  {service.name}
                                </span>
                              ))}
                              {categoryServices.length > 3 && (
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${style.accent} ${style.text}`}>
                                  +{categoryServices.length - 3} további
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expanded Services List */}
                    <AnimatePresence mode="wait">
                      {isExpanded && (
                        <motion.div
                          key="expanded"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.2, delay: 0.1 }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-6 md:pb-8">
                            <div className={`rounded-2xl overflow-hidden ${style.accent}`}>
                              {categoryServices.map((service, serviceIndex) => (
                                <div
                                  key={service._id}
                                  className={`flex items-center justify-between p-4 ${
                                    serviceIndex !== categoryServices.length - 1
                                      ? `border-b ${style.border}`
                                      : ""
                                  }`}
                                >
                                  <span className={`font-medium ${style.text}`}>
                                    {service.name}
                                  </span>
                                  {service.price != null && (
                                    <span className={`font-bold whitespace-nowrap ml-4 ${style.text}`}>
                                      {service.price.toLocaleString("hu-HU")} Ft
                                    </span>
                                  )}
                                </div>
                              ))}

                              {categoryServices.length === 0 && (
                                <div className={`p-4 text-center ${style.subtext}`}>
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
        </div>
      </div>
    </section>
  );
}
