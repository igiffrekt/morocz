import type { Metadata } from "next";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { sanityFetch } from "@/sanity/lib/fetch";
import { termsOfServiceQuery } from "@/sanity/lib/queries";
import type { TermsOfService } from "../../../sanity.types";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const terms = await sanityFetch<TermsOfService | null>({
    query: termsOfServiceQuery,
    tags: ["termsOfService"],
  });
  return {
    title: terms?.title ?? "Felhasználási Feltételek",
    description: "Felhasználási Feltételek — Mórocz Medical",
    robots: { index: true, follow: true },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FelhasznalasiFeltetelekPage() {
  const terms = await sanityFetch<TermsOfService | null>({
    query: termsOfServiceQuery,
    tags: ["termsOfService"],
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-6 mb-4">
        {terms?.title ?? "Felhasználási Feltételek"}
      </h1>

      {terms?.lastUpdated && (
        <p className="text-sm text-gray-500 mb-8">
          Hatályos:{" "}
          {new Date(terms.lastUpdated).toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {terms?.body ? (
        <PortableTextRenderer body={terms.body} />
      ) : (
        <p className="text-base text-gray-700 leading-relaxed">
          A felhasználási feltételek hamarosan elérhetők lesznek.
        </p>
      )}
    </main>
  );
}
