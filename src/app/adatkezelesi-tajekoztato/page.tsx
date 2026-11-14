import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { formatLegalDate } from "@/lib/legal-docs";
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
    <LegalPage
      docKey="adatkezelesi-tajekoztato"
      title={policy?.title ?? "Adatkezelési tájékoztató"}
      dateLabel="Utolsó frissítés:"
      date={formatLegalDate(policy?.lastUpdated)}
      body={policy?.body}
      emptyText="Az adatkezelési tájékoztató hamarosan elérhető lesz."
    />
  );
}
