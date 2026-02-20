import type { PortableTextReactComponents } from "@portabletext/react";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPostBodyImage, PortableTextBlock } from "../../../sanity.types";

interface PortableTextRendererProps {
  body: Array<PortableTextBlock | BlogPostBodyImage>;
}

const components: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => <h2 className="text-2xl font-bold text-primary mt-8 mb-4">{children}</h2>,
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-primary mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold text-primary mt-4 mb-2">{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-gray-600 my-4">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="text-base text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        className="text-primary underline hover:text-primary/80"
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
            className="w-full rounded-xl object-cover"
          />
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
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
