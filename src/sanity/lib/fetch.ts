import { draftMode } from "next/headers";
import type { QueryParams } from "next-sanity";
import { client } from "./client";

export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
}): Promise<T> {
  // draftMode() throws outside a request scope (e.g. generateStaticParams at build time)
  // Treat that as draft mode disabled
  let isDraft = false;
  try {
    const draft = await draftMode();
    isDraft = draft.isEnabled;
  } catch {
    isDraft = false;
  }

  if (isDraft) {
    const draftClient = client.withConfig({
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
      perspective: "previewDrafts",
    });

    return draftClient.fetch<T>(query, params, {
      next: { revalidate: 0 },
    });
  }

  return client.fetch<T>(query, params, {
    next: {
      revalidate: tags.length ? false : 60,
      tags,
    },
  });
}
