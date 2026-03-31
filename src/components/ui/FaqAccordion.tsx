"use client";

import { useState } from "react";
import AccordionCard, { type AccordionItemProps } from "./AccordionCard";

interface SimpleFaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: AccordionItemProps[] | SimpleFaqItem[];
}

function FaqAccordionComponent({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertedItems = (items as Array<any>).map((item, idx): AccordionItemProps => {
    if ('id' in item && 'icon' in item && 'title' in item && 'body' in item) {
      return item as AccordionItemProps;
    }
    return {
      id: `faq-${idx}`,
      icon: null,
      title: item.question || item.title || '',
      body: item.answer || item.body || '',
    };
  });

  return (
    <div className="flex flex-col gap-3">
      {convertedItems.map((item, idx) => (
        <AccordionCard
          key={item.id}
          card={item}
          index={idx}
          isOpen={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}
    </div>
  );
}

export { FaqAccordionComponent as FaqAccordion };
export default FaqAccordionComponent;
