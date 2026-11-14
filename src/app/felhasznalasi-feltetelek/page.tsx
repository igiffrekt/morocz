import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { formatLegalDate } from "@/lib/legal-docs";
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
    <LegalPage
      docKey="felhasznalasi-feltetelek"
      title={terms?.title ?? "Felhasználási Feltételek"}
      dateLabel="Hatályos:"
      date={formatLegalDate(terms?.lastUpdated)}
      body={terms?.body}
      emptyText="A felhasználási feltételek hamarosan elérhetők lesznek."
    />
  );
}
