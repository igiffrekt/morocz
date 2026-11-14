"use client";

import { type CSSProperties, useState } from "react";
import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";
import { pillClassName } from "@/components/ui/PillButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/cn";

export interface ContactInfoLink {
  text: string;
  href: string;
}

export interface ContactInfoItem {
  title: string;
  body: string;
  /** Yellow note (fees, warnings). */
  highlight?: string;
  links: ContactInfoLink[];
}

export interface ContactInfoGroup {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  /** Segmented-control label on phones. */
  short: string;
  items: ContactInfoItem[];
}

function ItemBody({ item }: { item: ContactInfoItem }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="m-0 text-[15px] leading-[1.65] text-muted-strong">{item.body}</p>
      {item.highlight && (
        <span className="self-start rounded-[22px] bg-sun-soft px-5 py-2.5 text-sm leading-[1.4] font-extrabold text-navy">
          {item.highlight}
        </span>
      )}
      {item.links.length > 0 && (
        <span className="flex flex-wrap gap-2">
          {item.links.map((link) => {
            const external = link.href.startsWith("http");
            return (
              <a
                key={link.href}
                href={link.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={pillClassName({
                  variant: "ghost",
                  size: "sm",
                  className: "h-11 bg-canvas px-[18px] text-sm hover:bg-sage",
                })}
              >
                {link.text}
              </a>
            );
          })}
        </span>
      )}
    </div>
  );
}

function toAccordionItems(group: ContactInfoGroup): AccordionItemData[] {
  return group.items.map((item, index) => ({
    id: `${group.id}-${index}`,
    title: item.title,
    icon: (
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-[13px] font-extrabold text-teal-ink tabular-nums transition-colors duration-300 group-aria-expanded:bg-navy group-aria-expanded:text-white"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    ),
    content: <ItemBody item={item} />,
  }));
}

function GroupAccordion({
  group,
  open,
  onOpenChange,
}: {
  group: ContactInfoGroup;
  open: string[];
  onOpenChange: (open: string[]) => void;
}) {
  return (
    <Accordion
      items={toAccordionItems(group)}
      open={open}
      onOpenChange={onOpenChange}
      className="gap-2.5"
      itemClassName="fade-up rounded-[28px] shadow-[inset_0_0_0_1px_#eceef4] has-[[aria-expanded=true]]:shadow-[0_24px_48px_-32px_rgba(36,42,95,.5),inset_0_0_0_2px_var(--color-mint-light)]"
      triggerClassName="group min-h-16 gap-3 rounded-[28px] px-3.5 py-3 hover:bg-navy/[.04] md:gap-4 md:py-4 md:pr-4 md:pl-5"
      titleClassName="text-[15px] leading-[1.3] md:text-[17px]"
      plusClassName="h-[30px] w-[30px] bg-canvas group-aria-expanded:bg-navy md:h-10 md:w-10"
      contentClassName="pt-0 pr-4 pb-4 pl-16 md:pr-6 md:pb-[22px] md:pl-[76px]"
    />
  );
}

/**
 * "Hasznos információk" + "Fontos tudnivalók": two columns on desktop, a segmented
 * switch on phones. One shared single-open state — everything starts closed.
 */
export function ContactInfo({ groups }: { groups: ContactInfoGroup[] }) {
  const [open, setOpen] = useState<string[]>([]);
  const [tab, setTab] = useState(groups[0]?.id ?? "");
  const active = groups.find((g) => g.id === tab) ?? groups[0];

  return (
    <section aria-label="Tudnivalók" className="mt-12 md:mt-28">
      {/* Desktop / tablet: side by side */}
      <div className="hidden flex-wrap items-start gap-x-6 gap-y-10 md:flex">
        {groups.map((group, index) => (
          <div
            key={group.id}
            className={cn(
              "flex min-w-0 flex-col gap-7",
              index === 0 ? "flex-[3_1_560px]" : "flex-[2_1_420px]",
            )}
          >
            <SectionHeading
              eyebrow={group.eyebrow}
              title={group.title}
              lead={group.lead}
              className="lg:[&_h2]:text-[44px]"
            />
            <GroupAccordion group={group} open={open} onOpenChange={setOpen} />
          </div>
        ))}
      </div>

      {/* Phone: segmented switch between the two groups */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-col gap-1 px-1.5">
          <span className="text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase">
            {groups[0]?.eyebrow}
          </span>
          <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-navy">
            {groups[0]?.title}
          </h2>
          <p className="m-0 text-sm text-muted">{groups[0]?.lead}</p>
        </div>
        {groups.length > 1 && (
          <SegmentedControl
            label="Témák"
            tone="white"
            value={active?.id ?? ""}
            onChange={setTab}
            options={groups.map((g) => ({ value: g.id, label: g.short }))}
            className="h-[54px]"
          />
        )}
        {active && (
          <div key={active.id} style={{ "--i": 0 } as CSSProperties}>
            <GroupAccordion group={active} open={open} onOpenChange={setOpen} />
          </div>
        )}
      </div>
    </section>
  );
}
