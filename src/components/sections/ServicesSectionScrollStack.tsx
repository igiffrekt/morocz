"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
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

interface ServicesSectionScrollStackProps {
  heading?: string;
  categories: ServiceCategoryData[];
  services: ServiceData[];
}

// Card styling
const CARD_STYLES = [
  { bg: "#2B3674", text: "text-white", subtext: "text-white/70", accent: "bg-white/15", listBg: "bg-white/10", border: "border-white/10" },
  { bg: "#76c8b6", text: "text-[#1e2952]", subtext: "text-[#1e2952]/70", accent: "bg-white/50", listBg: "bg-white/40", border: "border-[#1e2952]/10" },
  { bg: "#E8D5E0", text: "text-[#1e2952]", subtext: "text-[#1e2952]/70", accent: "bg-white/60", listBg: "bg-white/50", border: "border-[#1e2952]/10" },
  { bg: "#D4E5ED", text: "text-[#1e2952]", subtext: "text-[#1e2952]/70", accent: "bg-white/60", listBg: "bg-white/50", border: "border-[#1e2952]/10" },
  { bg: "#fdf3e4", text: "text-[#1e2952]", subtext: "text-[#1e2952]/70", accent: "bg-[#1e2952]/10", listBg: "bg-white/60", border: "border-[#1e2952]/10" },
  { bg: "#c4dfe6", text: "text-[#1e2952]", subtext: "text-[#1e2952]/70", accent: "bg-white/50", listBg: "bg-white/50", border: "border-[#1e2952]/10" },
];

function StackCard({
  category,
  categoryServices,
  index,
  totalCards,
  progress,
}: {
  category: ServiceCategoryData;
  categoryServices: ServiceData[];
  index: number;
  totalCards: number;
  progress: any;
}) {
  const style = CARD_STYLES[index % CARD_STYLES.length];

  // Each card has its own range within the scroll
  const cardStart = index / totalCards;
  const cardEnd = (index + 1) / totalCards;

  // Scale down as we scroll past this card
  const scale = useTransform(
    progress,
    [cardStart, cardEnd],
    [1, 0.9]
  );

  // Move up slightly as it stacks
  const y = useTransform(
    progress,
    [cardStart, cardEnd],
    [0, -30]
  );

  return (
    <motion.div
      style={{
        scale,
        y,
        backgroundColor: style.bg,
        zIndex: totalCards - index,
      }}
      className="sticky top-24 md:top-32 rounded-3xl shadow-2xl overflow-hidden"
    >
      {/* Card Content */}
      <div className="p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl ${style.accent}`}>
            {category.emoji || "🏥"}
          </div>
          <div>
            <h3 className={`text-2xl md:text-3xl font-bold ${style.text}`}>
              {category.name}
            </h3>
            <p className={`text-sm md:text-base ${style.subtext} mt-1`}>
              {categoryServices.length} szolgáltatás
            </p>
          </div>
        </div>

        {/* Services Grid - 2 columns on larger screens */}
        <div className={`rounded-2xl ${style.listBg} p-4 md:p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {categoryServices.map((service) => (
              <div
                key={service._id}
                className={`flex items-center justify-between p-3 md:p-4 rounded-xl ${style.accent} ${style.border} border`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {service.icon?.asset && (
                    <Image
                      src={urlFor(service.icon).width(48).height(48).url()}
                      alt=""
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain flex-shrink-0"
                    />
                  )}
                  <span className={`font-medium text-sm md:text-base ${style.text} truncate`}>
                    {service.name}
                  </span>
                </div>
                {service.price != null && (
                  <span className={`font-bold text-sm md:text-base whitespace-nowrap ml-3 ${style.text}`}>
                    {service.price.toLocaleString("hu-HU")} Ft
                  </span>
                )}
              </div>
            ))}
          </div>

          {categoryServices.length === 0 && (
            <p className={`text-center py-8 ${style.subtext}`}>
              Nincs elérhető szolgáltatás ebben a kategóriában.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ServicesSectionScrollStack({ heading, categories, services }: ServicesSectionScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const getServicesForCategory = (categoryId: string) => {
    return services.filter((service) => service.category?._id === categoryId);
  };

  // Calculate container height based on number of cards
  // Each card needs enough scroll space to animate
  const containerHeight = `${100 + categories.length * 60}vh`;

  return (
    <section aria-labelledby="szolgaltatasok-cim" className="px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-10 lg:p-12">
          <FadeIn viewport>
            {heading && (
              <h2
                id="szolgaltatasok-cim"
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary mb-6"
              >
                {heading}
              </h2>
            )}
            <p className="text-primary/60 mb-8 md:mb-10">
              Görgessen lefelé a szolgáltatások megtekintéséhez
            </p>
          </FadeIn>

          {/* Scroll-driven stacking container */}
          <div
            ref={containerRef}
            style={{ height: containerHeight }}
            className="relative"
          >
            <div className="sticky top-20 space-y-6">
              {categories.map((category, index) => (
                <StackCard
                  key={category._id}
                  category={category}
                  categoryServices={getServicesForCategory(category._id)}
                  index={index}
                  totalCards={categories.length}
                  progress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
