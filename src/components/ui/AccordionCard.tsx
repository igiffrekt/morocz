"use client";

import { useState } from "react";

export interface AccordionItemProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  highlight?: string;
}

interface AccordionCardProps {
  card: AccordionItemProps;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function AccordionCard({
  card,
  index,
  isOpen,
  onToggle,
}: AccordionCardProps) {
  const [hasOpened, setHasOpened] = useState(false);

  // Track if content has ever been rendered (for initial mount)
  if (isOpen && !hasOpened) {
    setHasOpened(true);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
      {/* Decorative number */}
      <span className="absolute -top-2 -right-1 text-[4.5rem] font-black text-primary/[0.04] leading-none select-none pointer-events-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Trigger */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full text-left relative z-10 flex items-center gap-2.5 p-4 md:px-5"
      >
        <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center ${isOpen ? "text-primary" : "text-primary/40"}`}>
          {card.icon}
        </span>

        <span className={`flex-1 text-[0.85rem] font-bold leading-snug ${isOpen ? "text-primary" : "text-primary/60"}`}>
          {card.title}
        </span>

        <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transform ${isOpen ? "rotate-45" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1V15M1 8H15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className={isOpen ? "text-primary/80" : "text-primary/20"}
            />
          </svg>
        </span>
      </button>

      {/* Content - uses grid for smooth height animation */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-5 pb-4 md:pb-5 pl-[3rem] md:pl-[3.25rem]">
            <p className="text-sm text-primary/70 leading-relaxed whitespace-pre-wrap">
              {card.body}
            </p>

            {card.highlight && (
              <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/[0.06] border border-primary/[0.1] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {card.highlight}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
