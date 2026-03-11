"use client";

import { useState } from "react";
import AccordionCard, { type AccordionItemProps } from "./AccordionCard";
import { motion } from "motion/react";

interface FaqSectionProps {
  title?: string;
  description?: string;
  items: AccordionItemProps[];
  isLeftColumn?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function FaqSection({ 
  title, 
  description, 
  items,
  isLeftColumn = false,
  onOpenChange
}: FaqSectionProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const handleToggle = (cardId: string) => {
    const newOpenId = openCardId === cardId ? null : cardId;
    setOpenCardId(newOpenId);
    onOpenChange?.(newOpenId !== null);
  };

  // Split items into 2 columns for the accordion grid inside this section
  const itemsPerColumn = Math.ceil(items.length / 2);
  const column1Items = items.slice(0, itemsPerColumn);
  const column2Items = items.slice(itemsPerColumn);

  return (
    <div>
      {title && (
        <h2 className="text-2xl md:text-3xl font-black mb-4 text-navy">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-sm md:text-base text-gray-500 mb-8 leading-relaxed">
          {description}
        </p>
      )}

      {/* 2-column accordion grid INSIDE each section */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
        }}
      >
        {/* Column 1 */}
        <div className="flex flex-col gap-3 md:gap-4">
          {column1Items.map((item, index) => (
            <AccordionCard
              key={item.id}
              item={item}
              index={index}
              isOpen={openCardId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-3 md:gap-4">
          {column2Items.map((item, index) => (
            <AccordionCard
              key={item.id}
              item={item}
              index={itemsPerColumn + index}
              isOpen={openCardId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
