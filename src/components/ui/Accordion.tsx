"use client";

import { type ElementType, type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/cn";

interface CollapseProps {
  open: boolean;
  id?: string;
  /** Labelling element (the trigger) for role="region". */
  labelledBy?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}

/**
 * Height animation via grid-template-rows 0fr → 1fr (no measuring). Closed content
 * is `inert` so it can't be tabbed into or read out while collapsed.
 */
export function Collapse({
  open,
  id,
  labelledBy,
  className,
  innerClassName,
  children,
}: CollapseProps) {
  return (
    <div
      id={id}
      {...(labelledBy ? { role: "region", "aria-labelledby": labelledBy } : {})}
      data-open={open}
      inert={!open}
      className={cn("grid-collapse", className)}
    >
      <div className={innerClassName}>{children}</div>
    </div>
  );
}

export function PlusIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full",
        "transition-[transform,background-color,color] duration-500 ease-bento",
        open ? "rotate-[135deg] bg-navy text-white" : "bg-white text-navy",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </span>
  );
}

export interface AccordionItemData {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Leading round icon (already styled). */
  icon?: ReactNode;
  /** Trailing badge before the plus icon. */
  badge?: ReactNode;
  content: ReactNode;
  /** Per-item surface, e.g. "bg-lavender". */
  className?: string;
}

interface AccordionProps {
  items: readonly AccordionItemData[];
  /** Allow several panels open at once (default: single-open). */
  multiple?: boolean;
  /** Initially open ids (default: everything closed). */
  defaultOpen?: readonly string[];
  /** Heading element wrapping each trigger. */
  headingAs?: ElementType;
  className?: string;
  itemClassName?: string;
  contentClassName?: string;
  /** Overrides for the trigger row (padding, gap, radius) — e.g. a compact mobile variant. */
  triggerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  plusClassName?: string;
  /**
   * Controlled open ids — lets several accordions share one single-open state
   * (pair with `onOpenChange`). Uncontrolled when omitted.
   */
  open?: readonly string[];
  onOpenChange?: (open: string[]) => void;
}

export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  headingAs: Heading = "h3",
  className,
  itemClassName,
  contentClassName,
  triggerClassName,
  titleClassName,
  subtitleClassName,
  plusClassName,
  open: controlledOpen,
  onOpenChange,
}: AccordionProps) {
  const base = useId().replace(/:/g, "");
  const [uncontrolledOpen, setOpen] = useState<string[]>(() =>
    multiple ? [...defaultOpen] : defaultOpen.slice(0, 1),
  );
  const open = controlledOpen ?? uncontrolledOpen;

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    const next = isOpen ? open.filter((x) => x !== id) : multiple ? [...open, id] : [id];
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const triggerId = `${base}-trigger-${item.id}`;
        const panelId = `${base}-panel-${item.id}`;
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-panel bg-white transition-shadow duration-[400ms] ease-bento",
              isOpen && "shadow-[0_24px_48px_-32px_rgba(36,42,95,.5)]",
              itemClassName,
              item.className,
            )}
          >
            <Heading className="m-0">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full items-center gap-[18px] rounded-panel border-0 bg-transparent px-6 py-[22px] text-left text-navy transition-colors duration-300 hover:bg-white/35",
                  triggerClassName,
                )}
              >
                {item.icon}
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={cn("text-xl font-extrabold leading-tight", titleClassName)}>
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className={cn("text-sm font-semibold text-muted", subtitleClassName)}>
                      {item.subtitle}
                    </span>
                  )}
                </span>
                {item.badge}
                <PlusIcon open={isOpen} className={plusClassName} />
              </button>
            </Heading>
            <Collapse id={panelId} labelledBy={triggerId} open={isOpen}>
              <div className={cn("px-4 pb-5", contentClassName)}>{item.content}</div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}
