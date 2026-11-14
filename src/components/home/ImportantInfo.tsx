"use client";

import Image from "next/image";
import { type CSSProperties, useId, useState } from "react";
import { useSiteContact } from "@/components/layout/SiteContext";
import { Collapse } from "@/components/ui/Accordion";
import { pillClassName } from "@/components/ui/PillButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TabList, TabPanel } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { telHref } from "@/lib/site-nav";
import { buildInfoGroups, type InfoItem } from "./info-content";
import { ICON_PATHS, PathIcon } from "./PathIcon";

export interface WeekHours {
  name: string;
  /** "13:20 – 16:40", null = closed. */
  hours: string | null;
}

interface ImportantInfoProps {
  /** Mon–Fri hours for today's resolved (weekly or seasonal) schedule. */
  week: WeekHours[];
  certificatePrice: string | null;
}

function Highlight({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "max-w-full self-start rounded-[22px] bg-sun-soft px-3.5 py-2 text-[13px] leading-[1.4] font-extrabold whitespace-pre-line break-words text-navy md:px-4 md:py-2.5",
        className,
      )}
    >
      {children}
    </span>
  );
}

function InfoCard({ item, index }: { item: InfoItem; index: number }) {
  return (
    <div
      className="card-lift fade-up flex flex-col gap-3 rounded-tile bg-white p-[26px]"
      style={{ "--i": index } as CSSProperties}
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-sage text-teal-ink">
          <PathIcon d={item.icon} size={20} />
        </span>
        <h3 className="m-0 text-lg font-extrabold text-navy">{item.title}</h3>
      </span>
      <p className="m-0 text-[15px] leading-[1.65] text-muted-strong">{item.body}</p>
      {item.highlight && <Highlight>{item.highlight}</Highlight>}
    </div>
  );
}

function InfoAccordion({ items, idBase }: { items: InfoItem[]; idBase: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        const isOpen = open === index;
        const trigger = `${idBase}-q-${index}`;
        const panel = `${idBase}-a-${index}`;
        return (
          <div
            key={item.title}
            className="fade-up rounded-[24px] bg-white"
            style={{ "--i": index } as CSSProperties}
          >
            <h3 className="m-0">
              <button
                id={trigger}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : index)}
                className="tap-press flex w-full items-center gap-3 rounded-[24px] border-0 bg-transparent px-3.5 py-3 text-left text-navy"
              >
                <span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-sage text-teal-ink">
                  <PathIcon d={item.icon} size={18} />
                </span>
                <span className="flex-1 text-[15px] font-extrabold">{item.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-[450ms] ease-bento",
                    isOpen ? "rotate-180 bg-navy text-white" : "bg-canvas text-navy",
                  )}
                >
                  <PathIcon d={ICON_PATHS.chevronDown} size={14} strokeWidth={2.8} />
                </span>
              </button>
            </h3>
            <Collapse id={panel} labelledBy={trigger} open={isOpen}>
              <div className="flex flex-col gap-2.5 pr-4 pb-4 pl-16">
                <p className="m-0 text-sm leading-relaxed text-muted-strong">{item.body}</p>
                {item.highlight && <Highlight>{item.highlight}</Highlight>}
              </div>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}

/** Fontos tudnivalók (A2 layout): tabs, card grid (accordions on phones), hours aside. */
export function ImportantInfo({ week, certificatePrice }: ImportantInfoProps) {
  const idBase = useId().replace(/:/g, "");
  const contact = useSiteContact();
  const groups = buildInfoGroups({
    phone: contact?.phone,
    email: contact?.email,
    certificatePrice,
  });
  const [tab, setTab] = useState(groups[0]?.value ?? "");
  const active = groups.find((g) => g.value === tab) ?? groups[0];

  const tabs = (
    <TabList
      idBase={idBase}
      label="Témák"
      value={active?.value ?? ""}
      onChange={setTab}
      items={groups.map((g) => ({
        value: g.value,
        label: (
          <>
            <span className="text-[13px] md:hidden">{g.short}</span>
            <span className="hidden md:inline">{g.label}</span>
          </>
        ),
      }))}
      className="w-full md:w-auto md:flex-[0_1_600px]"
    />
  );

  return (
    <section
      id="info"
      aria-labelledby="info-cim"
      className="flex scroll-mt-28 flex-col gap-3.5 md:gap-9"
    >
      <SectionHeading
        id="info-cim"
        eyebrow="Információk"
        title="Fontos tudnivalók"
        lead="Kérjük, az időpontfoglalás előtt olvassa el az alábbi információkat."
        className="px-1.5 md:px-0"
        aside={tabs}
      />

      <div className="flex flex-wrap items-start gap-3.5 md:gap-6">
        <div className="min-w-0 flex-[3_1_600px]">
          {active && (
            <TabPanel key={active.value} idBase={idBase} value={active.value}>
              <div className="hidden gap-3 md:grid md:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                {active.items.map((item, index) => (
                  <InfoCard key={item.title} item={item} index={index} />
                ))}
              </div>
              <div className="md:hidden">
                <InfoAccordion items={active.items} idBase={`${idBase}-${active.value}`} />
              </div>
            </TabPanel>
          )}
        </div>

        <aside
          aria-label="Rendelési idő és elérhetőség"
          className="flex flex-[1_1_300px] flex-col gap-3"
        >
          <div className="flex flex-col gap-2 rounded-[28px] bg-navy px-5 py-[18px] text-white md:gap-3 md:rounded-panel md:p-7">
            <span className="text-xs font-extrabold tracking-[.12em] text-mint-light uppercase md:text-[13px]">
              Rendelési idő
            </span>
            <div>
              {week.map((day) => (
                <div
                  key={day.name}
                  className="flex justify-between gap-4 py-1 text-sm md:border-b md:border-white/10 md:py-2 md:text-[15px]"
                >
                  <span className="text-navy-soft md:text-white">{day.name}</span>
                  <span
                    className={cn(
                      "whitespace-nowrap tabular-nums",
                      day.hours ? "font-extrabold text-mint-light" : "opacity-50",
                    )}
                  >
                    {day.hours ?? "zárva"}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[13px] text-navy-soft">
              Telefonon csak a rendelési időben vagyunk elérhetőek.
            </span>
          </div>
          <div className="relative hidden h-[220px] overflow-hidden rounded-panel md:block">
            <Image
              src="/morocz-medical-kulter.webp"
              alt="A rendelő épülete"
              fill
              sizes="(min-width: 1024px) 340px, 100vw"
              className="object-cover"
            />
          </div>
          {contact?.phone && (
            <a
              href={telHref(contact.phone)}
              className={pillClassName({
                variant: "mint",
                className: "hidden h-[54px] w-full bg-mint hover:bg-mint md:flex",
              })}
            >
              {contact.phone}
            </a>
          )}
          {contact?.email && (
            <a
              href={`mailto:${contact.email}`}
              className={pillClassName({
                variant: "outline",
                className: "hidden h-[54px] w-full border-0 font-bold md:flex",
              })}
            >
              {contact.email}
            </a>
          )}
        </aside>
      </div>
    </section>
  );
}
