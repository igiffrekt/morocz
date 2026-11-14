import {
  PortableText,
  type PortableTextBlock,
  type PortableTextReactComponents,
} from "@portabletext/react";
import type { CSSProperties } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { type PtBlockLike, segmentArticle } from "@/lib/blog";
import { cn } from "@/lib/cn";
import { components as baseComponents } from "./PortableTextRenderer";

type Block = PtBlockLike & PortableTextBlock;

const QUOTE_PATH =
  "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z";
const EYE_PATH =
  "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";

/** Editorial Portable Text (BlogCikk): 18px body, styled lists, pull quotes. */
const article: Partial<PortableTextReactComponents> = {
  ...baseComponents,
  block: {
    normal: ({ children }) => <p className="m-0 mb-5">{children}</p>,
    h2: ({ children }) => (
      <h2 className="m-0 mt-10 mb-4 text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] text-navy">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="m-0 mt-8 mb-3 text-[22px] leading-[1.3] font-extrabold text-navy">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="m-0 mt-6 mb-2 text-lg font-extrabold text-teal-ink">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <figure className="fade-up relative m-0 my-10 flex flex-col gap-4 overflow-hidden rounded-panel bg-sage px-6 py-7 md:px-11 md:py-10">
        <span
          aria-hidden="true"
          className="absolute -right-[50px] -bottom-[70px] h-[180px] w-[180px] rounded-full border-[1.5px] border-teal-ink/20"
        />
        <span className="text-mint">
          <PathIcon d={QUOTE_PATH} size={32} strokeWidth={1.6} />
        </span>
        <blockquote className="relative m-0 text-2xl leading-[1.3] font-extrabold tracking-[-0.02em] text-navy md:text-[30px]">
          {children}
        </blockquote>
      </figure>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="m-0 mb-5 flex list-none flex-col gap-2 p-0">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="m-0 mb-5 flex list-none flex-col gap-2 p-0 [counter-reset:item]">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-mint" />
        <span className="min-w-0">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="flex items-start gap-3 [counter-increment:item] before:mt-0.5 before:inline-flex before:h-7 before:w-7 before:shrink-0 before:items-center before:justify-center before:rounded-full before:bg-sage before:text-[13px] before:font-extrabold before:text-teal-ink before:content-[counter(item)]">
        <span className="min-w-0">{children}</span>
      </li>
    ),
  },
  marks: {
    ...baseComponents.marks,
    strong: ({ children }) => <strong className="font-extrabold text-navy">{children}</strong>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-navy underline decoration-mint decoration-2 underline-offset-4 hover:decoration-navy"
      >
        {children}
      </a>
    ),
  },
};

/** Inline content of a block (no wrapping <p>) — callout headings and items. */
const inline: Partial<PortableTextReactComponents> = {
  ...article,
  block: { normal: ({ children }) => <>{children}</> },
  marks: {
    ...article.marks,
    strong: ({ children }) => <>{children}</>,
  },
};

const CALLOUTS = [
  { box: "bg-sage", badge: "bg-mint", mark: "bg-sage text-teal-ink", icon: ICON_PATHS.shield },
  { box: "bg-blush-soft", badge: "bg-blush", mark: "bg-blush-soft text-navy", icon: EYE_PATH },
] as const;

export function ArticleBody({ body }: { body: Block[] }) {
  const segments = segmentArticle(body);

  return (
    <div className="mx-auto max-w-[680px] text-[17px] leading-[1.78] text-muted-strong md:text-lg">
      {segments.map((segment) => {
        if (segment.kind === "lead") {
          return (
            <div
              key={segment.key}
              className="fade-up mb-7 text-[19px] leading-[1.6] font-semibold tracking-[-0.01em] text-navy md:text-[22px]"
            >
              <PortableText value={segment.blocks} components={inline} />
            </div>
          );
        }
        if (segment.kind === "callout") {
          const v = CALLOUTS[segment.index % CALLOUTS.length] ?? CALLOUTS[0];
          const ListTag = segment.ordered ? "ol" : "ul";
          return (
            <section
              key={segment.key}
              className={cn("fade-up my-8 rounded-panel p-[22px] md:p-7", v.box)}
              style={{ "--i": segment.index } as CSSProperties}
            >
              <h2 className="m-0 mb-4 flex items-center gap-3.5 text-lg leading-[1.35] font-extrabold text-navy md:text-[21px]">
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-navy",
                    v.badge,
                  )}
                >
                  <PathIcon d={v.icon} size={22} />
                </span>
                <span>
                  <PortableText value={[segment.heading]} components={inline} />
                </span>
              </h2>
              <ListTag className="m-0 flex list-none flex-col gap-2 p-0">
                {segment.items.map((item, k) => (
                  <li
                    key={item._key ?? k}
                    className="flex items-start gap-3.5 rounded-[22px] bg-white px-[18px] py-3.5 text-base leading-[1.55] font-semibold text-navy transition-[transform,box-shadow] duration-300 ease-bento hover:translate-x-1 hover:shadow-[0_12px_24px_-18px_rgba(36,42,95,.45)] md:text-[17px]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                        v.mark,
                      )}
                    >
                      {ListTag === "ol" ? (
                        k + 1
                      ) : (
                        <PathIcon d={ICON_PATHS.tick} size={14} strokeWidth={3} />
                      )}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <PortableText
                        value={[{ ...item, listItem: undefined, level: undefined }]}
                        components={inline}
                      />
                    </span>
                  </li>
                ))}
              </ListTag>
            </section>
          );
        }
        return <PortableText key={segment.key} value={segment.blocks} components={article} />;
      })}
    </div>
  );
}
