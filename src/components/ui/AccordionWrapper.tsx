"use client";

import { useState } from "react";
import AccordionCard, { type AccordionItemProps } from "./AccordionCard";

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

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(139,152,184,1)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "clamp(1.25rem, 5vw, 2.75rem)", fontWeight: 800, color: "#1e2952", lineHeight: 1.2, margin: 0 }}>
          {title}
        </h2>
        <div style={{ width: "32px", height: "3px", background: "#a8d5ba", borderRadius: "9999px" }} />
      </div>
      <p style={{ fontSize: "0.8rem", color: "rgba(139,152,184,1)", lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </div>
  );
}

interface ColumnSectionProps {
  title: string;
  subtitle: string;
  label: string;
  items: AccordionItemProps[];
  isMobile?: boolean;
}

function ColumnSection({
  title,
  subtitle,
  label,
  items,
  isMobile = false,
}: ColumnSectionProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [expandedCol, setExpandedCol] = useState(-1);
  const [animateFlex, setAnimateFlex] = useState(false);
  const [busyRef] = useState({ current: false });

  const handleToggle = (cardId: string, cardIndex: number) => {
    if (busyRef.current) return;

    if (openCardId === cardId) {
      busyRef.current = true;
      setOpenCardId(null);
      
      if (!isMobile) {
        setTimeout(() => {
          setAnimateFlex(true);
          setExpandedCol(-1);
          
          setTimeout(() => {
            setAnimateFlex(false);
            busyRef.current = false;
          }, 350);
        }, 350);
      } else {
        busyRef.current = false;
      }
      return;
    }

    if (!isMobile) {
      // Desktop: expand column
      const itemsPerColumn = Math.ceil(items.length / 2);
      const newCol = cardIndex < itemsPerColumn ? 0 : 1;
      
      if (openCardId !== null) {
        const oldIndex = items.findIndex(item => item.id === openCardId);
        const oldCol = oldIndex < itemsPerColumn ? 0 : 1;

        if (newCol === oldCol) {
          busyRef.current = true;
          setOpenCardId(null);
          setTimeout(() => {
            setOpenCardId(cardId);
            busyRef.current = false;
          }, 300);
        } else {
          busyRef.current = true;
          setOpenCardId(null);
          
          setTimeout(() => {
            setAnimateFlex(true);
            setExpandedCol(-1);
            
            setTimeout(() => {
              setAnimateFlex(false);
              setExpandedCol(newCol);
              setOpenCardId(cardId);
              busyRef.current = false;
            }, 350);
          }, 300);
        }
      } else {
        busyRef.current = true;
        setExpandedCol(newCol);
        
        setTimeout(() => {
          setOpenCardId(cardId);
          busyRef.current = false;
        }, 150);
      }
    } else {
      // Mobile: just open/close without column expansion
      busyRef.current = true;
      setOpenCardId(cardId);
      setTimeout(() => {
        busyRef.current = false;
      }, 350);
    }
  };

  // Split into 2 columns within this section (desktop only)
  const itemsPerColumn = Math.ceil(items.length / 2);
  const column1 = items.slice(0, itemsPerColumn);
  const column2 = items.slice(itemsPerColumn);

  const getColFlex = (colIndex: number) => {
    if (expandedCol === -1) return 1;
    return colIndex === expandedCol ? 1.5 : 0.5;
  };

  return (
    <>
      <SectionHeader label={label} title={title} subtitle={subtitle} />

      {/* Mobile: single column */}
      {isMobile && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item, idx) => (
            <AccordionCard
              key={item.id}
              card={item}
              index={idx}
              isOpen={openCardId === item.id}
              onToggle={() => handleToggle(item.id, idx)}
            />
          ))}
        </div>
      )}

      {/* Desktop: 2-column with flex expansion */}
      {!isMobile && (
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              flex: getColFlex(0),
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minWidth: 0,
              transition: animateFlex ? "flex 0.35s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
            }}
          >
            {column1.map((item, idx) => (
              <AccordionCard
                key={item.id}
                card={item}
                index={idx}
                isOpen={openCardId === item.id}
                onToggle={() => handleToggle(item.id, idx)}
              />
            ))}
          </div>

          <div
            style={{
              flex: getColFlex(1),
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minWidth: 0,
              transition: animateFlex ? "flex 0.35s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
            }}
          >
            {column2.map((item, idx) => (
              <AccordionCard
                key={item.id}
                card={item}
                index={itemsPerColumn + idx}
                isOpen={openCardId === item.id}
                onToggle={() => handleToggle(item.id, itemsPerColumn + idx)}
              />
            ))}
          </div>
        </div>
      )}
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
    <section
      className="w-full px-4 sm:px-6 mb-16 sm:mb-20 md:mb-24 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6"
    >
      {/* Left: Hasznos - Mint background */}
      <div className="bg-green-100 rounded-2xl sm:rounded-3xl lg:rounded-4xl p-5 sm:p-6 md:p-8">
        <ColumnSection
          label={leftLabel}
          title={leftTitle}
          subtitle={leftSubtitle}
          items={leftItems}
          isMobile={true}
        />
      </div>

      {/* Right: Fontos - White card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl lg:rounded-4xl p-5 sm:p-6 md:p-8 shadow-md md:shadow-lg">
        <ColumnSection
          label={rightLabel}
          title={rightTitle}
          subtitle={rightSubtitle}
          items={rightItems}
          isMobile={true}
        />
      </div>
    </section>
  );
}
