"use client";

import Link from "next/link";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { PathIcon } from "@/components/home/PathIcon";
import { useSiteContact } from "@/components/layout/SiteContext";
import { Collapse } from "@/components/ui/Accordion";
import { Sheet } from "@/components/ui/Modal";
import { pillClassName } from "@/components/ui/PillButton";
import { scrollToId, useScrollSpy } from "@/hooks/useScrollSpy";
import { cn } from "@/lib/cn";
import { LEGAL_DOCS, type LegalDocKey, type LegalTocItem, nextLegalDoc } from "@/lib/legal-docs";
import { telHref } from "@/lib/site-nav";

const ICON = {
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  up: "M12 19V5M6 11l6-6 6 6",
  chevron: "m6 9 6 6 6-6",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  arrow: "M5 12h14M13 6l6 6-6 6",
} as const;

export const LEGAL_TOP_ID = "jogi-dokumentum-teteje";

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
  const top = document.getElementById(LEGAL_TOP_ID);
  if (top) {
    if (!top.hasAttribute("tabindex")) top.setAttribute("tabindex", "-1");
    top.focus({ preventScroll: true });
  }
}

// ─── Scroll tracking (one listener for every TOC on the page) ─────────────────

interface TocState {
  toc: readonly LegalTocItem[];
  /** Index of the current section (0 before the first heading is reached). */
  current: number;
  /** Index of the section passed most recently; -1 above the first heading. */
  active: number;
  progress: number;
}

const TocContext = createContext<TocState>({ toc: [], current: 0, active: -1, progress: 0 });

export function LegalTocProvider({
  toc,
  children,
}: {
  toc: readonly LegalTocItem[];
  children: ReactNode;
}) {
  const { active, progress } = useScrollSpy(
    toc.map((t) => t.id),
    160,
    { activateLastAtBottom: true },
  );
  const current = Math.max(active, 0);

  // The number pill of the current h2 inside the document turns navy.
  useEffect(() => {
    toc.forEach((t, i) => {
      document.getElementById(t.id)?.setAttribute("data-active", String(i === current));
    });
  }, [toc, current]);

  return (
    <TocContext.Provider value={{ toc, current, active, progress }}>{children}</TocContext.Provider>
  );
}

function useToc() {
  return useContext(TocContext);
}

// ─── TOC rows (16px-radius rows, max two lines – long items are never pills) ──

function TocBadge({ item, on }: { item: LegalTocItem; on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-extrabold whitespace-nowrap tabular-nums transition-colors duration-300",
        item.num
          ? "mt-px h-[22px] min-w-7 px-[7px] text-[11px]"
          : "mx-[9px] mt-1.5 h-2.5 w-2.5 min-w-2.5",
        on ? "bg-navy text-white" : "bg-canvas text-teal-ink",
      )}
    >
      {item.num}
    </span>
  );
}

function TocList({
  onPick,
  className,
}: {
  onPick?: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
  className?: string;
}) {
  const { toc, current } = useToc();
  return (
    <ol className={cn("m-0 flex list-none flex-col gap-0.5 p-0", className)}>
      {toc.map((item, i) => {
        const on = i === current;
        return (
          <li key={item.id} data-toc-index={i}>
            <a
              href={`#${item.id}`}
              aria-current={on ? "true" : undefined}
              onClick={(e) => {
                if (onPick) onPick(e, item.id);
                else if (document.getElementById(item.id)) {
                  e.preventDefault();
                  scrollToId(item.id);
                }
              }}
              className={cn(
                "flex items-start gap-2.5 rounded-2xl px-3 py-[9px] text-sm leading-[1.4] no-underline transition-colors duration-300",
                on
                  ? "bg-sage font-extrabold text-navy hover:bg-sage hover:text-navy"
                  : "font-semibold text-muted hover:bg-canvas hover:text-navy",
              )}
            >
              <TocBadge item={item} on={on} />
              <span title={item.text} className="line-clamp-2 min-w-0">
                {item.text}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/** Wide screens (xl+): sticky "Ezen az oldalon" list that follows the reading position. */
export function LegalTocSide() {
  const { toc, current } = useToc();
  const navRef = useRef<HTMLElement>(null);

  // Keep the current row visible when the list itself scrolls.
  useEffect(() => {
    const nav = navRef.current;
    const row = nav?.querySelector<HTMLElement>(`[data-toc-index="${current}"]`);
    if (!nav || !row || nav.scrollHeight <= nav.clientHeight) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < nav.scrollTop + 48 || bottom > nav.scrollTop + nav.clientHeight - 16) {
      nav.scrollTo({
        top: Math.max(0, top - nav.clientHeight / 3),
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    }
  }, [current]);

  if (toc.length === 0) return null;
  return (
    <nav
      ref={navRef}
      aria-label="Ezen az oldalon"
      className="scrollbar-none relative hidden max-h-[calc(100vh-470px)] min-h-40 overflow-y-auto rounded-panel bg-white px-3 pt-[22px] pb-3 xl:block"
    >
      <span className="block px-3 pb-2.5 text-xs font-bold tracking-[.12em] text-muted uppercase">
        Ezen az oldalon
      </span>
      <TocList />
    </nav>
  );
}

/** Tablets / small laptops (md – xl): collapsible TOC above the document. */
export function LegalTocAccordion({ sectionLabel }: { sectionLabel: string }) {
  const { toc } = useToc();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const innerRef = useRef<HTMLDivElement>(null);
  if (toc.length === 0) return null;

  const pick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    // The panel sits above the target and collapses while we scroll: aim for the final layout.
    const panelHeight = innerRef.current?.offsetHeight ?? 0;
    const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - panelHeight - margin;
    setOpen(false);
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? "auto" : "smooth" });
    window.history.replaceState(null, "", `#${id}`);
    target.focus({ preventScroll: true });
  };

  return (
    <div className="hidden rounded-panel bg-white md:block xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-16 w-full items-center gap-3.5 rounded-panel border-0 bg-transparent py-2.5 pr-3 pl-[22px] text-left text-navy transition-colors duration-300 hover:bg-canvas/60"
      >
        <PathIcon d={ICON.list} size={20} strokeWidth={2.2} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-extrabold">Ezen az oldalon</span>
          <span className="text-[13px] font-semibold text-muted">{sectionLabel}</span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-500 ease-bento",
            open ? "rotate-180 bg-navy text-white" : "bg-canvas text-navy",
          )}
        >
          <PathIcon d={ICON.chevron} size={18} strokeWidth={2.6} />
        </span>
      </button>
      <Collapse open={open} id={panelId}>
        <div ref={innerRef} className="px-3 pb-3.5">
          <TocList onPick={pick} />
        </div>
      </Collapse>
    </div>
  );
}

/** Phones (< md): floating "Tartalom" pill → bottom sheet TOC, and a back-to-top pill. */
export function LegalMobileToc({ title }: { title: string }) {
  const { toc, active } = useToc();
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setShowTop(window.scrollY > 600);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Let the footer grow a bottom padding so the floating pills never cover its links.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const sync = () => {
      if (mq.matches) document.body.setAttribute("data-mobile-action-bar", "");
      else document.body.removeAttribute("data-mobile-action-bar");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      document.body.removeAttribute("data-mobile-action-bar");
    };
  }, []);

  const pick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setOpen(false);
    // Wait for the sheet to release the scroll lock and restore focus, then jump.
    window.setTimeout(() => scrollToId(id), 60);
  };

  const badge = active >= 0 ? (toc[active]?.num ?? "•") : String(toc.length);

  return (
    <>
      <div className="pointer-events-none fixed right-0 bottom-[max(16px,env(safe-area-inset-bottom))] left-0 z-30 flex justify-center gap-2 md:hidden">
        {toc.length > 0 && (
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="tap-press pointer-events-auto inline-flex h-[52px] items-center gap-2.5 rounded-full border-0 bg-navy pr-2.5 pl-5 text-[15px] font-extrabold whitespace-nowrap text-white shadow-[0_18px_36px_-16px_rgba(36,42,95,.7)]"
          >
            <PathIcon d={ICON.list} size={18} strokeWidth={2.2} />
            Tartalom
            <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-mint-light px-2 text-xs font-extrabold text-navy tabular-nums">
              {badge}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={scrollToTop}
          aria-hidden={!showTop}
          tabIndex={showTop ? 0 : -1}
          className={cn(
            "tap-press inline-flex h-[52px] items-center gap-2 overflow-hidden rounded-full border-0 bg-white/90 text-sm font-extrabold whitespace-nowrap text-navy shadow-[0_18px_36px_-18px_rgba(36,42,95,.55)] backdrop-blur-[16px]",
            "transition-[opacity,transform,max-width,padding] duration-500 ease-bento",
            showTop
              ? "pointer-events-auto max-w-[220px] translate-y-0 scale-100 px-[18px] opacity-100"
              : "pointer-events-none max-w-0 translate-y-4 scale-90 px-0 opacity-0",
          )}
        >
          <PathIcon d={ICON.up} size={16} strokeWidth={2.4} />
          Vissza a tetejére
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={title} description="Tartalom">
        <nav aria-label="Tartalomjegyzék" className="-mx-3">
          <TocList onPick={pick} className="gap-1" />
        </nav>
      </Sheet>
    </>
  );
}

// ─── Document switcher ────────────────────────────────────────────────────────

/**
 * The five legal documents. xl+: vertical pill list (labels never wrap – the column is
 * 360px wide); md – xl: one horizontally scrolling row in a white pill; phones: sticky chip
 * row under the app bar with the reading-progress line (MobilJogi).
 */
export function LegalSwitcher({ current }: { current: LegalDocKey }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const { progress } = useToc();

  // Bring the current document's pill into view inside the scrolling row (never the page).
  useEffect(() => {
    const row = rowRef.current;
    const item = row?.querySelector<HTMLElement>('[aria-current="page"]')?.parentElement;
    if (!row || !item || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = Math.max(0, item.offsetLeft - 12);
  }, []);

  return (
    <nav
      aria-label="Jogi dokumentumok"
      className="max-md:-mx-3 max-md:bg-canvas/90 max-md:backdrop-blur-[16px]"
    >
      <div className="md:rounded-full md:bg-white md:p-1.5 xl:rounded-panel xl:px-3 xl:pt-5 xl:pb-3">
        <span className="hidden px-3 pb-2.5 text-xs font-bold tracking-[.12em] text-muted uppercase xl:block">
          Dokumentumok
        </span>
        <ul
          ref={rowRef}
          className="scrollbar-none relative m-0 flex list-none snap-x snap-proximity scroll-px-3 gap-1.5 overflow-x-auto p-0 max-md:px-3 max-md:pt-1.5 max-md:pb-2.5 md:gap-1 xl:snap-none xl:flex-col xl:overflow-visible"
        >
          {LEGAL_DOCS.map((doc) => {
            const on = doc.key === current;
            return (
              <li key={doc.key} className="shrink-0 snap-start">
                <Link
                  href={doc.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex items-center font-extrabold whitespace-nowrap no-underline transition-[background-color,color,box-shadow,transform,border-color] duration-300 ease-bento active:scale-[.98]",
                    // phones: bordered chips
                    "max-md:min-h-11 max-md:gap-2 max-md:rounded-full max-md:border-[1.5px] max-md:pr-4 max-md:pl-3.5 max-md:text-[13px]",
                    // md+: icon pills
                    "md:min-h-[52px] md:gap-3 md:rounded-full md:py-1.5 md:pr-5 md:pl-1.5 md:text-sm md:leading-[1.3]",
                    on
                      ? "border-navy bg-navy text-white shadow-[0_12px_24px_-14px_rgba(36,42,95,.7)] hover:bg-navy-deep hover:text-white"
                      : "border-[#e3e7ef] bg-white text-navy hover:text-navy md:font-bold md:hover:bg-canvas",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-300 md:h-10 md:w-10",
                      on ? "md:bg-mint md:text-navy" : "md:bg-sage md:text-teal-ink",
                    )}
                  >
                    <PathIcon
                      d={doc.icon}
                      size={18}
                      strokeWidth={2}
                      className="max-md:h-[15px] max-md:w-[15px]"
                    />
                  </span>
                  <span className="md:hidden">{doc.short}</span>
                  <span className="max-md:hidden">{doc.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div aria-hidden="true" className="h-[3px] bg-[#e3e7ef] md:hidden">
        <div
          className="h-[3px] rounded-r-full bg-mint transition-[width] duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </nav>
  );
}

// ─── Right column extras ──────────────────────────────────────────────────────

export function LegalBackToTop({ className }: { className?: string }) {
  return (
    <a
      href={`#${LEGAL_TOP_ID}`}
      onClick={(e) => {
        e.preventDefault();
        scrollToTop();
      }}
      className={pillClassName({
        variant: "outline",
        size: "md",
        className: cn("h-[52px] border-0", className),
      })}
    >
      <PathIcon d={ICON.up} size={16} strokeWidth={2.4} />
      Vissza a tetejére
    </a>
  );
}

/** "Kérdése van?" navy card with the Sanity contact details. */
export function LegalHelpCard({ className }: { className?: string }) {
  const contact = useSiteContact();
  const email = contact?.email;
  const phone = contact?.phone;
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-panel bg-navy p-6 text-white",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -top-[60px] -right-[50px] h-[150px] w-[150px] rounded-full bg-mint opacity-[.18]"
      />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mint text-navy">
          <PathIcon d={ICON.help} size={20} strokeWidth={2} />
        </span>
        <strong className="text-xl font-extrabold">Kérdése van?</strong>
      </div>
      <span className="relative text-sm leading-[1.55] text-navy-soft">
        Telefonon csak a rendelési időben vagyunk elérhetőek.
      </span>
      {email && (
        <a
          href={`mailto:${email}`}
          className="link-grow tap-area self-start text-[13px] font-bold break-all text-mint-light hover:text-white"
        >
          {email}
        </a>
      )}
      <div className="relative flex flex-col gap-2 pt-1 md:max-xl:flex-row md:max-xl:flex-wrap [&>a]:md:max-xl:w-auto [&>a]:md:max-xl:px-6">
        {email && (
          <a
            href={`mailto:${email}`}
            className={pillClassName({
              variant: "mint",
              size: "md",
              fullWidth: true,
              className: "h-12",
            })}
          >
            <PathIcon d={ICON.mail} size={16} strokeWidth={2.2} />
            E-mail küldése
          </a>
        )}
        {phone && (
          <a
            href={telHref(phone)}
            className={pillClassName({
              size: "md",
              fullWidth: true,
              className:
                "h-12 border-[1.5px] border-white/28 bg-transparent font-bold text-white hover:border-white hover:bg-white/8 hover:text-white",
            })}
          >
            <PathIcon d={ICON.phone} size={15} strokeWidth={2} />
            {phone}
          </a>
        )}
      </div>
    </div>
  );
}

/** Phones: "Következő dokumentum" row under the document (MobilJogi). */
export function LegalNextDoc({ current, className }: { current: LegalDocKey; className?: string }) {
  const next = nextLegalDoc(current);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="px-2 text-xs font-extrabold tracking-[.14em] text-teal-ink uppercase">
        Következő dokumentum
      </span>
      <Link
        href={next.href}
        className="tap-press flex min-h-[72px] items-center gap-3 rounded-tile bg-navy py-3 pr-3 pl-[18px] text-white no-underline hover:text-white"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="text-base font-extrabold">{next.label}</strong>
          <span className="text-xs text-navy-soft">Jogi dokumentum</span>
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush text-navy"
        >
          <PathIcon d={ICON.arrow} size={16} strokeWidth={2.4} />
        </span>
      </Link>
    </div>
  );
}
