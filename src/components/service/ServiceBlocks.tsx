import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { SwipeRow } from "@/components/subpage/SwipeRow";
import type { ServiceBlock, ServiceCard } from "@/content/services/types";
import { cn } from "@/lib/cn";
import { capitalize, splitLead, twoDigit } from "@/lib/service-page";
import type { ServiceMeta } from "./service-meta";

function CheckList({ items, meta }: { items: string[]; meta: ServiceMeta }) {
  return (
    <ul
      className={cn(
        "m-0 mt-1 flex list-none flex-col gap-0.5 rounded-tile bg-white p-1.5",
        "md:gap-3.5 md:p-[clamp(20px,3vw,30px)]",
        meta.listSurfaceMd,
      )}
    >
      {items.map((item) => {
        const { lead, rest } = splitLead(item);
        return (
          <li
            key={item}
            className="flex items-start gap-3 px-3 py-2.5 text-sm leading-normal text-muted-strong md:gap-3.5 md:p-0 md:text-base md:leading-[1.6]"
          >
            <span
              className={cn(
                "mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full md:h-[26px] md:w-[26px]",
                "bg-mint-light text-navy",
                meta.checkMd,
              )}
            >
              <PathIcon d={ICON_PATHS.tick} size={14} strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              {lead && <strong className="font-extrabold text-navy">{lead} — </strong>}
              {rest}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Timeline({ items, meta }: { items: string[]; meta: ServiceMeta }) {
  return (
    <ol className="m-0 mt-1 flex list-none flex-col p-0">
      {items.map((item, k) => {
        const { lead, rest } = splitLead(item);
        const title = lead || rest;
        const desc = lead ? capitalize(rest) : "";
        const last = k === items.length - 1;
        return (
          <li key={item} className="flex items-stretch gap-3.5 md:gap-5">
            <div className="flex w-9 shrink-0 flex-col items-center md:w-12">
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold md:h-12 md:w-12 md:text-base",
                  meta.accent,
                  meta.ring,
                )}
              >
                {twoDigit(k)}
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn("mt-2 min-h-5 w-0.5 flex-1 rounded-full opacity-35", meta.line)}
                />
              )}
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col gap-1.5 pt-1.5 md:pt-2.5",
                last ? "pb-0" : "pb-6 md:pb-7",
              )}
            >
              <strong className="text-base leading-[1.35] font-extrabold text-navy md:text-lg">
                {title}
              </strong>
              {desc && (
                <span className="text-sm leading-[1.65] text-muted-strong md:text-base">
                  {desc}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Cards({ items, meta, label }: { items: ServiceCard[]; meta: ServiceMeta; label: string }) {
  return (
    <SwipeRow label={label} className="mt-1">
      {items.map((card, k) => {
        const tone = meta.cards[k % meta.cards.length] ?? meta.cards[0];
        return (
          <article
            key={card.h}
            className={cn(
              "card-lift flex w-full flex-col gap-2.5 rounded-tile p-5 md:gap-3 md:p-[26px]",
              tone?.surface,
            )}
          >
            <span
              className={cn(
                "inline-flex h-10 min-w-10 items-center justify-center self-start rounded-full px-3 text-[13px] font-extrabold md:h-8 md:min-w-8",
                tone?.badge,
              )}
            >
              {twoDigit(k)}
            </span>
            <h3 className="m-0 text-lg leading-[1.25] font-extrabold text-navy md:text-[19px] md:leading-[1.3]">
              {card.h}
            </h3>
            <p className="m-0 text-sm leading-[1.6] text-muted-strong md:text-[15px] md:leading-[1.65]">
              {card.p}
            </p>
          </article>
        );
      })}
    </SwipeRow>
  );
}

/** Renders one content.json block: p / h3 / check-list ul / numbered ol / card grid. */
export function ServiceBlockView({
  block,
  meta,
  sectionTitle,
}: {
  block: ServiceBlock;
  meta: ServiceMeta;
  sectionTitle: string;
}) {
  switch (block.t) {
    case "p":
      return (
        <p className="m-0 max-w-[780px] text-[15px] leading-[1.65] text-muted-strong md:text-[17px] md:leading-[1.75]">
          {block.x}
        </p>
      );
    case "h3":
      return (
        <h3 className="m-0 mt-1.5 text-lg font-extrabold text-navy md:mt-2 md:text-[21px]">
          {block.x}
        </h3>
      );
    case "ul":
      return <CheckList items={block.items} meta={meta} />;
    case "ol":
      return <Timeline items={block.items} meta={meta} />;
    case "cards":
      return <Cards items={block.items} meta={meta} label={sectionTitle} />;
  }
}
