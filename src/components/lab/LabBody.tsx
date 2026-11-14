import type { CSSProperties, ReactNode } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { cn } from "@/lib/cn";
import type { LabBlock, LabSection, LabSpan } from "@/lib/lab-test";

/** Parameter group tints, cycled (Bento Pro palette). */
const GROUP_TONES = [
  "bg-mint-pale",
  "bg-lavender",
  "bg-sun-soft",
  "bg-blush-soft",
  "bg-[#e1efee]",
  "bg-coral-soft",
];

/** Longer parameters (≈ wider than a 300px card) are not rendered as pills. */
const LONG_PARAM = 34;

function Spans({ spans }: { spans: LabSpan[] }) {
  return (
    <>
      {spans.map((span, i) =>
        span.strong ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: spans are positional
          <strong key={i} className="font-extrabold text-navy">
            {span.text}
          </strong>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: spans are positional
          <span key={i}>{span.text}</span>
        ),
      )}
    </>
  );
}

function Groups({ groups }: { groups: Extract<LabBlock, { kind: "group" }>[] }) {
  return (
    <div className="grid gap-3 md:[grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
      {groups.map((group, i) => (
        <div
          key={group.title}
          className={cn(
            "fade-up flex min-w-0 flex-col gap-3 rounded-tile p-5 md:p-6",
            GROUP_TONES[i % GROUP_TONES.length],
          )}
          style={{ "--i": Math.min(i, 6) } as CSSProperties}
        >
          <h3 className="m-0 text-base font-extrabold text-navy md:text-lg">{group.title}</h3>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {group.params.map((param) => (
              <li
                key={param}
                className={cn(
                  "bg-white px-3 py-1.5 text-[13px] font-bold text-navy",
                  // Short parameters are single-line pills; long descriptive ones become a
                  // full-width row that may wrap instead of overflowing a phone screen.
                  param.length > LONG_PARAM
                    ? "basis-full rounded-[18px] leading-snug"
                    : "rounded-full whitespace-nowrap",
                )}
              >
                {param}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Blocks({ blocks }: { blocks: LabBlock[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block) continue;
    if (block.kind === "group") {
      const groups: Extract<LabBlock, { kind: "group" }>[] = [];
      while (blocks[i]?.kind === "group") {
        groups.push(blocks[i] as Extract<LabBlock, { kind: "group" }>);
        i++;
      }
      i--;
      out.push(<Groups key={`g${i}`} groups={groups} />);
    } else if (block.kind === "list") {
      out.push(
        <ul
          key={`l${i}`}
          className="m-0 flex list-none flex-col gap-3 rounded-tile bg-mint-pale p-5 md:p-6"
        >
          {block.items.map((spans, k) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: list items are positional
              key={k}
              className="flex items-start gap-3 text-[15px] leading-[1.6] text-muted-strong md:text-base"
            >
              <span className="mt-px inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-teal-ink text-white">
                <PathIcon d={ICON_PATHS.tick} size={14} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <Spans spans={spans} />
              </span>
            </li>
          ))}
        </ul>,
      );
    } else {
      out.push(
        <p
          key={`p${i}`}
          className="m-0 max-w-[780px] text-[15px] leading-[1.7] text-muted-strong md:text-[17px] md:leading-[1.75]"
        >
          <Spans spans={block.spans} />
        </p>,
      );
    }
  }
  return <>{out}</>;
}

/** Lab package body laid out as numbered white section cards. */
export function LabBody({ sections }: { sections: LabSection[] }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {sections.map((section, i) => (
        <section
          key={section.title || i}
          aria-labelledby={section.title ? `labor-${i}` : undefined}
          className="flex flex-col gap-4 rounded-panel bg-white p-5 md:gap-5 md:rounded-hero md:p-[clamp(24px,4vw,48px)]"
        >
          {section.title && (
            <div className="flex items-center gap-3 md:gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-ink text-sm font-extrabold text-white md:h-12 md:w-12 md:text-[15px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2
                id={`labor-${i}`}
                className="m-0 text-[22px] leading-[1.15] font-extrabold tracking-[-0.02em] text-navy md:text-[clamp(26px,2.6vw,34px)]"
              >
                {section.title}
              </h2>
            </div>
          )}
          <Blocks blocks={section.blocks} />
        </section>
      ))}
    </div>
  );
}
