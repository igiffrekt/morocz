import type { PortableTextReactComponents } from "@portabletext/react";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { SanityImageCrop, SanityImageHotspot } from "../../../sanity.types";

// Type definitions for Portable Text blocks
type PortableTextBlock = {
  children?: Array<{
    marks?: string[];
    text?: string;
    _type: "span";
    _key: string;
  }>;
  style?: "normal" | "h2" | "h3" | "h4" | "blockquote";
  listItem?: "bullet" | "number";
  markDefs?: Array<{
    href?: string;
    _type: "link";
    _key: string;
  }>;
  level?: number;
  _type: "block";
  _key: string;
};

type BlogPostBodyImage = {
  asset?: {
    _ref: string;
    _type: "reference";
  };
  media?: unknown;
  hotspot?: SanityImageHotspot;
  crop?: SanityImageCrop;
  _type: "image";
  alt?: string;
  caption?: string;
};

type PortableTextStyledTable = {
  _type: "styledTable";
  _key: string;
  headerRow?: boolean;
  zebraStripes?: boolean;
  align?: "left" | "center" | "right";
  table?: {
    rows?: Array<{
      _type: "tableRow";
      _key: string;
      cells?: string[];
    }>;
  };
};

interface PortableTextRendererProps {
  body: Array<PortableTextBlock | BlogPostBodyImage | PortableTextStyledTable>;
}

/** Also reused by the blog article layout (image + styledTable renderers). */
export const components: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-8 mb-4 text-2xl leading-tight font-extrabold tracking-[-0.02em] text-navy">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-3 text-xl font-extrabold text-navy">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mt-4 mb-2 text-lg font-extrabold text-teal-ink">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-5 rounded-tile bg-sage px-5 py-4 font-semibold text-navy">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="mb-4 text-base leading-relaxed text-muted-strong">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-4 list-disc space-y-1 pl-6 text-muted-strong marker:text-mint">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mb-4 list-decimal space-y-1 pl-6 text-muted-strong marker:font-extrabold marker:text-teal-ink">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-extrabold text-navy">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="font-bold text-navy underline decoration-mint decoration-2 underline-offset-4 hover:decoration-navy"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: BlogPostBodyImage }) => {
      if (!value?.asset) return null;
      return (
        <figure className="my-6">
          <Image
            src={urlFor(value).width(720).url()}
            alt={value.alt ?? "Blog kép"}
            width={720}
            height={405}
            className="w-full rounded-tile object-cover"
          />
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-muted">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
    styledTable: ({ value }: { value: PortableTextStyledTable }) => {
      const rows = value?.table?.rows ?? [];
      if (rows.length === 0) return null;
      const alignClass =
        value.align === "center"
          ? "text-center"
          : value.align === "right"
            ? "text-right"
            : "text-left";
      return (
        <div className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm text-muted-strong">
            <tbody>
              {rows.map((row, rowIndex) => {
                const isHeaderRow = value.headerRow && rowIndex === 0;
                const isStriped =
                  value.zebraStripes &&
                  !isHeaderRow &&
                  (rowIndex - (value.headerRow ? 1 : 0)) % 2 === 1;
                return (
                  <tr
                    key={row._key}
                    className={
                      isHeaderRow
                        ? "bg-lavender font-extrabold text-navy"
                        : isStriped
                          ? "bg-field"
                          : undefined
                    }
                  >
                    {(row.cells ?? []).map((cell, i) => (
                      <td
                        // biome-ignore lint/suspicious/noArrayIndexKey: table cells have no stable id
                        key={i}
                        className={`border border-line px-3 py-2 align-top ${alignClass}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    },
  },
};

export function PortableTextRenderer({ body }: PortableTextRendererProps) {
  return (
    <div className="max-w-none leading-relaxed">
      <PortableText value={body} components={components} />
    </div>
  );
}
