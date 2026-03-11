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
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(139,152,184,1)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)", fontWeight: 800, color: "#1e2952", lineHeight: 1.2, margin: 0 }}>
          {title}
        </h2>
        <div style={{ width: "40px", height: "4px", background: "#a8d5ba", borderRadius: "9999px", marginTop: "4px" }} />
      </div>
      <p style={{ fontSize: "0.875rem", color: "rgba(139,152,184,1)", maxWidth: "600px", lineHeight: 1.6 }}>
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
}

function ColumnSection({
  title,
  subtitle,
  label,
  items,
}: ColumnSectionProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [expandedCol, setExpandedCol] = useState(-1);
  const [animateFlex, setAnimateFlex] = useState(false);
  const [busyRef] = useState({ current: false });

  const handleToggle = (cardId: string, cardIndex: number) => {
    if (busyRef.current) return;

    if (openCardId === cardId) {
      // Closing: content collapses first, THEN column shrinks
      busyRef.current = true;
      setOpenCardId(null);
      
      // Wait for accordion content to collapse (350ms from homepage)
      setTimeout(() => {
        setAnimateFlex(true);
        setExpandedCol(-1);
        
        // Wait for flex animation
        setTimeout(() => {
          setAnimateFlex(false);
          busyRef.current = false;
        }, 350);
      }, 350);
      return;
    }

    // Opening: column expands FIRST, THEN content opens
    const itemsPerColumn = Math.ceil(items.length / 2);
    const newCol = cardIndex < itemsPerColumn ? 0 : 1;
    
    if (openCardId !== null) {
      const oldIndex = items.findIndex(item => item.id === openCardId);
      const oldCol = oldIndex < itemsPerColumn ? 0 : 1;

      if (newCol === oldCol) {
        // Same column: just swap content (no flex change)
        busyRef.current = true;
        setOpenCardId(null);
        setTimeout(() => {
          setOpenCardId(cardId);
          busyRef.current = false;
        }, 300);
      } else {
        // Different column: column shrinks → flex expands → content opens
        busyRef.current = true;
        setOpenCardId(null);
        
        // Content collapses
        setTimeout(() => {
          setAnimateFlex(true);
          setExpandedCol(-1);
          
          // Flex animation completes, then open new
          setTimeout(() => {
            setAnimateFlex(false);
            setExpandedCol(newCol);
            setOpenCardId(cardId);
            busyRef.current = false;
          }, 350);
        }, 300);
      }
      return;
    }

    // Fresh open: column expands, THEN content opens
    busyRef.current = true;
    setExpandedCol(newCol);
    
    // Let flex animation start, then open accordion
    setTimeout(() => {
      setOpenCardId(cardId);
      busyRef.current = false;
    }, 150);
  };

  // Split into 2 columns within this section
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

      {/* 2-column accordion grid with SEQUENTIAL flex animation */}
      <div style={{ display: "flex", gap: "16px" }}>
        {/* Column 1 */}
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

        {/* Column 2 */}
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
      style={{
        maxWidth: "100%",
        paddingLeft: "16px",
        paddingRight: "16px",
        marginBottom: "96px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "32px",
      }}
      className="md:gap-6 lg:grid-cols-2 md:grid-cols-1 grid-cols-1"
    >
      {/* Left: Hasznos - Mint background */}
      <div
        style={{
          background: "#d3e8e0",
          borderRadius: "32px",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}
      >
        <div style={{ maxWidth: "80rem", marginLeft: "auto", marginRight: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
          <ColumnSection
            label={leftLabel}
            title={leftTitle}
            subtitle={leftSubtitle}
            items={leftItems}
          />
        </div>
      </div>

      {/* Right: Fontos - White card */}
      <div
        style={{
          background: "white",
          borderRadius: "32px",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingLeft: "16px",
          paddingRight: "16px",
          boxShadow: "0 10px 40px -5px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ maxWidth: "80rem", marginLeft: "auto", marginRight: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
          <ColumnSection
            label={rightLabel}
            title={rightTitle}
            subtitle={rightSubtitle}
            items={rightItems}
          />
        </div>
      </div>
    </section>
  );
}
