import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponentProps,
  type PortableTextReactComponents,
} from "@portabletext/react";
import type { ReactNode } from "react";
import { components as baseComponents } from "@/components/blog/PortableTextRenderer";
import { PathIcon } from "@/components/home/PathIcon";
import { cn } from "@/lib/cn";
import type { LegalBlockLike, LegalHeading } from "@/lib/legal-docs";

const TICK = "M20 6 9 17l-5-5";

/** Clears the sticky app bar + chip row on phones, the desktop header from lg. */
const SCROLL_MARGIN = "scroll-mt-[150px] lg:scroll-mt-28";

interface StyledTable {
  _type: "styledTable";
  _key: string;
  headerRow?: boolean;
  zebraStripes?: boolean;
  table?: { rows?: Array<{ _key: string; cells?: string[] }> };
}

function NumberPill({ heading }: { heading: LegalHeading }) {
  const base =
    "inline-flex h-8 min-w-10 shrink-0 items-center justify-center rounded-full px-2.5 text-[13px] font-extrabold tracking-normal tabular-nums transition-colors duration-300 md:h-[34px] md:min-w-11 md:px-3 md:text-[15px]";
  const tone =
    "bg-sage text-teal-ink group-data-[active=true]:bg-navy group-data-[active=true]:text-white";
  if (heading.num === null) {
    return (
      <span aria-hidden="true" className={cn(base, tone)}>
        <PathIcon d={TICK} size={14} strokeWidth={2.6} />
      </span>
    );
  }
  if (heading.generated) {
    // Template numbering (the source heading has no number) – decoration only.
    return (
      <span aria-hidden="true" className={cn(base, tone)}>
        {heading.num}
      </span>
    );
  }
  // The number comes from the heading text: keep its separator for assistive tech and copy.
  return (
    <span className={cn(base, tone)}>
      {heading.num}
      <span className="sr-only">{`${heading.numDot} `}</span>
    </span>
  );
}

function Heading({
  heading,
  children,
}: {
  heading: LegalHeading | undefined;
  children: ReactNode;
}) {
  if (!heading) return <p className="m-0 mb-[18px] font-extrabold text-navy">{children}</p>;

  if (heading.rank === 2) {
    return (
      <h2
        id={heading.id}
        tabIndex={-1}
        className={cn(
          "group m-0 mt-10 mb-[18px] flex items-start gap-2.5 border-t border-line-soft pt-8 text-[22px] leading-[1.3] font-extrabold tracking-[-0.02em] text-navy outline-none first:mt-0 first:border-t-0 first:pt-0 md:mt-12 md:gap-3.5 md:pt-10 md:text-[27px] md:leading-[1.28]",
          SCROLL_MARGIN,
        )}
      >
        <NumberPill heading={heading} />
        <span className="min-w-0 pt-0.5 md:pt-0">{children}</span>
      </h2>
    );
  }
  if (heading.rank === 3) {
    return (
      <h3
        id={heading.id}
        tabIndex={-1}
        className={cn(
          "m-0 mt-8 mb-3 text-[19px] leading-[1.35] font-extrabold tracking-[-0.01em] text-navy outline-none first:mt-0 md:mt-9 md:text-[21px]",
          SCROLL_MARGIN,
        )}
      >
        {children}
      </h3>
    );
  }
  return (
    <h4
      id={heading.id}
      tabIndex={-1}
      className={cn(
        "m-0 mt-7 mb-2.5 text-[17px] leading-[1.4] font-extrabold text-teal-ink outline-none first:mt-0",
        SCROLL_MARGIN,
      )}
    >
      {children}
    </h4>
  );
}

function LegalTable({ value }: { value: StyledTable }) {
  const rows = value?.table?.rows ?? [];
  if (rows.length === 0) return null;
  const [head, ...rest] = rows;
  const bodyRows = value.headerRow ? rest : rows;
  const zebra = value.zebraStripes !== false;
  return (
    <div className="my-2.5 mb-[30px] overflow-hidden rounded-[24px] border border-line-soft">
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard users must be able to scroll the table sideways */}
      <section className="overflow-x-auto" tabIndex={0} aria-label="Táblázat">
        <table className="w-full min-w-[540px] border-collapse text-left">
          {value.headerRow && head && (
            <thead>
              <tr className="bg-sage">
                {(head.cells ?? []).map((cell, i) => (
                  <th
                    // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no stable id
                    key={i}
                    scope="col"
                    className="px-5 py-4 align-bottom text-sm leading-[1.4] font-extrabold tracking-[.01em] text-navy"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr
                key={row._key}
                className={cn(
                  (value.headerRow || ri > 0) && "border-t border-line-soft",
                  zebra && ri % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white",
                )}
              >
                {(row.cells ?? []).map((cell, ci) =>
                  ci === 0 && (row.cells?.length ?? 0) > 1 ? (
                    <th
                      // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no stable id
                      key={ci}
                      scope="row"
                      className="w-[26%] px-5 py-[18px] align-top text-[15px] leading-[1.6] font-extrabold text-navy"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no stable id
                      key={ci}
                      className="px-5 py-[18px] align-top text-[15px] leading-[1.6] text-muted-strong"
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function legalComponents(
  headings: Record<string, LegalHeading>,
): Partial<PortableTextReactComponents> {
  const heading = ({ value, children }: PortableTextComponentProps<PortableTextBlock>) => (
    <Heading heading={headings[value._key ?? ""]}>{children}</Heading>
  );
  return {
    ...baseComponents,
    block: {
      normal: ({ children }) => <p className="m-0 mb-[18px]">{children}</p>,
      h2: heading,
      h3: heading,
      h4: heading,
      blockquote: ({ children }) => (
        <blockquote className="m-0 my-6 rounded-[24px] border-l-4 border-mint bg-sage/60 px-6 py-5 text-navy">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="m-0 mt-1.5 mb-[26px] flex list-none flex-col gap-3 rounded-[24px] bg-canvas px-4 py-4 md:rounded-tile md:px-[26px] md:py-[22px]">
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className="m-0 mt-1.5 mb-[26px] flex list-none flex-col gap-3.5 p-0">{children}</ol>
      ),
    },
    listItem: {
      bullet: ({ children }) => (
        <li className="flex gap-3.5 leading-[1.7]">
          <span
            aria-hidden="true"
            className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-mint shadow-[0_0_0_4px_rgba(118,200,182,.22)]"
          />
          <span className="min-w-0">{children}</span>
        </li>
      ),
      number: ({ children, index }) => (
        <li className="flex gap-3.5 text-base leading-[1.65]">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender text-[13px] font-extrabold text-navy tabular-nums"
          >
            {index + 1}
          </span>
          <span className="min-w-0 pt-[3px]">{children}</span>
        </li>
      ),
    },
    marks: {
      ...baseComponents.marks,
      strong: ({ children }) => <strong className="font-bold text-navy">{children}</strong>,
      link: ({ children, value }) => {
        const href: string | undefined = value?.href;
        const external = !!href && /^https?:\/\//i.test(href);
        return (
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-bold break-words text-navy underline decoration-mint decoration-2 underline-offset-4 transition-colors duration-300 hover:decoration-navy"
          >
            {children}
          </a>
        );
      },
    },
    types: {
      ...baseComponents.types,
      styledTable: ({ value }: { value: StyledTable }) => <LegalTable value={value} />,
    },
  };
}

/** Legal document body inside the white card (Jogi.dc.html centre column). */
export function LegalBody({
  body,
  headings,
}: {
  body: LegalBlockLike[];
  headings: Record<string, LegalHeading>;
}) {
  return (
    <PortableText
      value={body as unknown as PortableTextBlock[]}
      components={legalComponents(headings)}
    />
  );
}
