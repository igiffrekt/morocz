import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { formatLegalDate } from "@/lib/legal-docs";
import { sanityFetch } from "@/sanity/lib/fetch";
import { bookingPolicyQuery } from "@/sanity/lib/queries";
import type { BookingPolicy } from "../../../sanity.types";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const policy = await sanityFetch<BookingPolicy | null>({
    query: bookingPolicyQuery,
    tags: ["bookingPolicy"],
  });
  return {
    title: policy?.title ?? "Foglalási és Lemondási Szabályzat",
    description: "Foglalási és Lemondási Szabályzat — Mórocz Medical",
    robots: { index: true, follow: true },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FoglalasiEsLemondasiSzabalyzatPage() {
  const policy = await sanityFetch<BookingPolicy | null>({
    query: bookingPolicyQuery,
    tags: ["bookingPolicy"],
  });

  return (
    <LegalPage
      docKey="foglalasi-es-lemondasi-szabalyzat"
      title={policy?.title ?? "Foglalási és Lemondási Szabályzat"}
      dateLabel="Hatályos:"
      date={formatLegalDate(policy?.lastUpdated)}
      body={policy?.body}
      emptyText="A foglalási és lemondási szabályzat hamarosan elérhető lesz."
    />
  );
}
