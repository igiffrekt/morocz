"use client";

import { useState } from "react";
import AccordionCard, { type AccordionItemProps } from "./AccordionCard";
import { SectionHeader } from "./SectionHeader";

interface AccordionWrapperProps {
  leftTitle: string;
  leftSubtitle: string;
  leftLabel: string;
  leftItems: AccordionItemProps[];
  rightTitle: string;
  rightSubtitle: string;
  rightLabel: string;
  rightItems: AccordionItemProps[];
}

interface ColumnSectionProps {
  title: string;
  subtitle: string;
  label: string;
  items: AccordionItemProps[];
}

function ColumnSection({
  title,
  subtitle,
  label,
  items,
}: ColumnSectionProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const handleToggle = (cardId: string) => {
    setOpenCardId(openCardId === cardId ? null : cardId);
  };

  // Split into 2 columns
  const itemsPerColumn = Math.ceil(items.length / 2);
  const column1 = items.slice(0, itemsPerColumn);
  const column2 = items.slice(itemsPerColumn);

  return (
    <>
      <SectionHeader label={label} title={title} subtitle={subtitle} />

      {/* Mobile: single column */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((item, idx) => (
          <AccordionCard
            key={item.id}
            card={item}
            index={idx}
            isOpen={openCardId === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </div>

      {/* Desktop: 2 columns */}
      <div className="hidden md:flex gap-4">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {column1.map((item, idx) => (
            <AccordionCard
              key={item.id}
              card={item}
              index={idx}
              isOpen={openCardId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {column2.map((item, idx) => (
            <AccordionCard
              key={item.id}
              card={item}
              index={itemsPerColumn + idx}
              isOpen={openCardId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export function AccordionWrapper({
  leftTitle,
  leftSubtitle,
  leftLabel,
  leftItems,
  rightTitle,
  rightSubtitle,
  rightLabel,
  rightItems,
}: AccordionWrapperProps) {
  return (
    <section className="w-full px-4 sm:px-6 mb-16 sm:mb-20 md:mb-24 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
      {/* Left: Hasznos - Mint background */}
      <div className="bg-green-100 rounded-2xl sm:rounded-3xl lg:rounded-4xl p-5 sm:p-6 md:p-8">
        <ColumnSection
          label={leftLabel}
          title={leftTitle}
          subtitle={leftSubtitle}
          items={leftItems}
        />
      </div>

      {/* Right: Fontos - White card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-4xl p-5 sm:p-6 md:p-8 shadow-md md:shadow-lg">
        <ColumnSection
          label={rightLabel}
          title={rightTitle}
          subtitle={rightSubtitle}
          items={rightItems}
        />
      </div>
    </section>
  );
}
