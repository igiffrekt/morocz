import type { Metadata } from "next";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { sanityFetch } from "@/sanity/lib/fetch";
import { privacyPolicyQuery } from "@/sanity/lib/queries";
import type { PrivacyPolicy } from "../../../sanity.types";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const policy = await sanityFetch<PrivacyPolicy | null>({
    query: privacyPolicyQuery,
    tags: ["privacyPolicy"],
  });
  return {
    title: policy?.title ?? "Adatkezelési tájékoztató",
    description: "Adatkezelési tájékoztató — Mórocz Medical",
    robots: { index: true, follow: true },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdatkezelesiTajekoztatoPage() {
  const policy = await sanityFetch<PrivacyPolicy | null>({
    query: privacyPolicyQuery,
    tags: ["privacyPolicy"],
  });

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-6 mb-4">
        {policy?.title ?? "Adatkezelési tájékoztató"}
      </h1>

      {policy?.lastUpdated && (
        <p className="text-sm text-gray-500 mb-8">
          Utolsó frissítés:{" "}
          {new Date(policy.lastUpdated).toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {policy?.body ? (
        <PortableTextRenderer body={policy.body} />
      ) : (
        <p className="text-base text-gray-700 leading-relaxed">
          Az adatkezelési tájékoztató hamarosan elérhető lesz.
        </p>
      )}
    </main>
  );
}
