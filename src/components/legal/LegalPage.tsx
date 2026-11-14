import type { CSSProperties, ReactNode } from "react";
import { PathIcon } from "@/components/home/PathIcon";
import { HeroBreadcrumb } from "@/components/subpage/PageHero";
import {
  type LegalBlockLike,
  type LegalDocKey,
  legalDoc,
  prepareLegalBody,
} from "@/lib/legal-docs";
import { LegalBody } from "./LegalBody";
import {
  LEGAL_TOP_ID,
  LegalBackToTop,
  LegalHelpCard,
  LegalMobileToc,
  LegalNextDoc,
  LegalSwitcher,
  LegalTocAccordion,
  LegalTocProvider,
  LegalTocSide,
} from "./LegalNav";

const ICON = {
  cal: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
} as const;

export interface LegalPageProps {
  docKey: LegalDocKey;
  title: string;
  /** e.g. "Hatályos:" / "Utolsó frissítés:" – as the page labelled its date before. */
  dateLabel: string;
  /** Already formatted date, or null when the document has none. */
  date: string | null;
  body: LegalBlockLike[] | null | undefined;
  /** Shown in the card while the Sanity document has no body yet. */
  emptyText: string;
}

function MetaPill({
  icon,
  tone,
  index,
  children,
}: {
  icon: string;
  tone: "mint" | "outline";
  index: number;
  children: ReactNode;
}) {
  return (
    <span
      className={
        tone === "mint"
          ? "fade-up inline-flex h-[34px] items-center gap-2 rounded-full bg-mint-light pr-3.5 pl-3 text-xs font-extrabold whitespace-nowrap text-navy md:h-10 md:pr-[18px] md:pl-3.5 md:text-sm"
          : "fade-up inline-flex h-[34px] items-center gap-2 rounded-full border-[1.5px] border-white/28 pr-3.5 pl-3 text-xs font-bold whitespace-nowrap text-white md:h-10 md:pr-[18px] md:pl-3.5 md:text-sm"
      }
      style={{ "--i": index } as CSSProperties}
    >
      <PathIcon d={icon} size={16} strokeWidth={2.2} className="max-md:h-[13px] max-md:w-[13px]" />
      {children}
    </span>
  );
}

function HeroArt() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[220px] flex-[0_0_260px] items-center justify-center lg:flex"
    >
      <div className="absolute h-[250px] w-[250px] rounded-full border-[1.5px] border-mint-light/35" />
      <div className="absolute h-[190px] w-[190px] rounded-full bg-mint" />
      <div className="relative flex h-32 w-[104px] -rotate-6 flex-col gap-[9px] rounded-[24px] bg-white px-[18px] py-[22px] shadow-[0_24px_40px_-20px_rgba(16,20,60,.6)]">
        <span className="h-2 w-[44%] rounded-full bg-navy" />
        <span className="h-1.5 w-full rounded-full bg-line" />
        <span className="h-1.5 w-[86%] rounded-full bg-line" />
        <span className="h-1.5 w-[94%] rounded-full bg-line" />
        <span className="h-1.5 w-[62%] rounded-full bg-line" />
      </div>
      <span className="absolute right-[26px] bottom-[26px] inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-blush text-navy shadow-[0_14px_26px_-14px_rgba(16,20,60,.7)]">
        <PathIcon d={ICON.shield} size={24} strokeWidth={2.2} />
      </span>
    </div>
  );
}

/**
 * Shared LEGAL template (Jogi.dc.html / MobilJogi.dc.html): compact navy hero, document
 * switcher, white document card with numbered chapters, "Ezen az oldalon" TOC that tracks
 * the reading position, contact card and back-to-top. Content stays Portable Text from Sanity.
 */
export function LegalPage({ docKey, title, dateLabel, date, body, emptyText }: LegalPageProps) {
  const prepared = prepareLegalBody(body);
  const doc = legalDoc(docKey);
  const hasBody = prepared.body.length > 0;
  const sectionLabel = `${prepared.toc.length} fejezet`;

  return (
    <LegalTocProvider toc={prepared.toc}>
      {/* HERO */}
      <section
        id={LEGAL_TOP_ID}
        aria-labelledby="jogi-cim"
        className="relative flex scroll-mt-28 flex-wrap items-center justify-between gap-8 overflow-hidden rounded-panel bg-navy px-[22px] pt-6 pb-7 text-white outline-none md:px-10 md:pt-10 md:pb-11 lg:rounded-hero lg:px-14 lg:pt-11 lg:pb-12"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-[length:26px_26px]"
        />
        <div className="relative flex min-w-0 flex-[1_1_520px] flex-col items-start gap-4 md:gap-5">
          <HeroBreadcrumb
            crumbs={[{ label: "Jogi információk" }, { label: title, shortLabel: doc.short }]}
          />
          <span className="text-xs font-bold tracking-[.14em] text-mint-light uppercase md:text-[13px]">
            Jogi információk
          </span>
          <h1
            id="jogi-cim"
            className="fade-up m-0 max-w-[820px] text-[30px] leading-[1.08] font-extrabold tracking-[-0.025em] text-balance md:text-[clamp(34px,5vw,56px)] md:leading-[1.05] md:tracking-[-0.03em]"
          >
            {title}
          </h1>
          {hasBody && (
            <div className="flex flex-wrap gap-2 md:gap-2.5">
              {date && (
                <MetaPill icon={ICON.cal} tone="mint" index={1}>
                  {dateLabel} {date}
                </MetaPill>
              )}
              <MetaPill icon={ICON.clock} tone="outline" index={2}>
                ≈ {prepared.minutes} perc olvasás
              </MetaPill>
              {prepared.toc.length > 0 && (
                <MetaPill icon={ICON.list} tone="outline" index={3}>
                  {sectionLabel}
                </MetaPill>
              )}
            </div>
          )}
          {!hasBody && date && (
            <div className="flex flex-wrap gap-2">
              <MetaPill icon={ICON.cal} tone="mint" index={1}>
                {dateLabel} {date}
              </MetaPill>
            </div>
          )}
        </div>
        <HeroArt />
      </section>

      {/* BODY: switcher | document | TOC + help */}
      <div className="grid grid-cols-1 gap-3 md:mt-1 md:gap-4 xl:mt-3 xl:grid-cols-[360px_minmax(0,1fr)_260px] xl:items-start xl:gap-6">
        <aside className="min-w-0 max-md:sticky max-md:top-[68px] max-md:z-20 xl:sticky xl:top-6">
          <LegalSwitcher current={docKey} />
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <LegalTocAccordion sectionLabel={sectionLabel} />
          <article
            data-legal-body=""
            aria-labelledby="jogi-cim"
            className="rounded-panel bg-white px-5 pt-7 pb-9 md:px-12 md:pt-12 md:pb-14 lg:rounded-hero lg:px-16 lg:pt-14 lg:pb-16"
          >
            <div className="fade-up mx-auto max-w-[760px] text-base leading-[1.7] break-words text-muted-strong [--i:1] md:text-[17px] md:leading-[1.75]">
              {hasBody ? (
                <LegalBody body={prepared.body} headings={prepared.headings} />
              ) : (
                <p className="m-0">{emptyText}</p>
              )}
            </div>
          </article>
        </div>

        <aside
          aria-label="Segítség"
          className="flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-start xl:sticky xl:top-6 xl:flex-col xl:flex-nowrap xl:items-stretch"
        >
          <LegalTocSide />
          <LegalNextDoc current={docKey} className="w-full md:hidden" />
          <LegalBackToTop className="max-md:hidden md:order-2 xl:order-none" />
          <LegalHelpCard className="md:flex-[1_1_300px] xl:flex-none" />
        </aside>
      </div>

      <LegalMobileToc title={title} />
    </LegalTocProvider>
  );
}
