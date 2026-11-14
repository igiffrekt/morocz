"use client";

import { useId } from "react";
import {
  ContactAside,
  InfoAccordion,
  InfoCard,
  type InfoCardTone,
  type WeekHours,
} from "@/components/home/ImportantInfo";
import {
  buildInfoGroups,
  PRICE_PAGE_INFO_TITLES,
  pickInfoItems,
} from "@/components/home/info-content";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Card colours of the four notes (Arak mockup). */
const TONES: InfoCardTone[] = [
  { surface: "bg-[#e1efee]", icon: "bg-teal-ink text-white", highlight: "bg-white" },
  { surface: "bg-sun-soft", icon: "bg-sun text-navy", highlight: "bg-white" },
  { surface: "bg-lavender", icon: "bg-navy text-white", highlight: "bg-white" },
  { surface: "bg-blush-soft", icon: "bg-blush text-navy", highlight: "bg-white" },
];

/**
 * Tudnivalók of the prices page (E-recept, Vizsgálati díjak, Eredmények, Magzati genetikai
 * ultrahang — same copy as the homepage info tabs) next to the opening hours card.
 */
export function PriceNotes({ week }: { week: WeekHours[] }) {
  const idBase = useId().replace(/:/g, "");
  const items = pickInfoItems(buildInfoGroups({}), PRICE_PAGE_INFO_TITLES);

  return (
    <section
      id="tudnivalok"
      aria-labelledby="tudnivalok-cim"
      className="flex scroll-mt-28 flex-wrap items-start gap-3.5 md:gap-6"
    >
      <div className="flex min-w-0 flex-[3_1_620px] flex-col gap-3.5 md:gap-8">
        <SectionHeading
          id="tudnivalok-cim"
          eyebrow="Tudnivalók"
          title="Fontos információk"
          lead="Kérjük, olvassa el figyelmesen"
          className="px-1.5 md:px-0"
        />
        <div className="hidden gap-3 md:grid md:[grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {items.map((item, index) => (
            <InfoCard key={item.title} item={item} index={index} tone={TONES[index]} />
          ))}
        </div>
        <div className="md:hidden">
          <InfoAccordion items={items} idBase={idBase} />
        </div>
      </div>
      <ContactAside week={week} className="flex-[1_1_320px]" />
    </section>
  );
}
