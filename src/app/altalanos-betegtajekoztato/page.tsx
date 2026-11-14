import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { formatLegalDate } from "@/lib/legal-docs";
import { sanityFetch } from "@/sanity/lib/fetch";
import { generalPatientInfoQuery } from "@/sanity/lib/queries";
import type { GeneralPatientInfo } from "../../../sanity.types";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const info = await sanityFetch<GeneralPatientInfo | null>({
    query: generalPatientInfoQuery,
    tags: ["generalPatientInfo"],
  });
  return {
    title: info?.title ?? "Általános Betegtájékoztató",
    description: "Általános Betegtájékoztató — Mórocz Medical",
    robots: { index: true, follow: true },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AltalanosBetegtajekoztatoPage() {
  const info = await sanityFetch<GeneralPatientInfo | null>({
    query: generalPatientInfoQuery,
    tags: ["generalPatientInfo"],
  });

  return (
    <LegalPage
      docKey="altalanos-betegtajekoztato"
      title={info?.title ?? "Általános Betegtájékoztató"}
      dateLabel="Hatályos:"
      date={formatLegalDate(info?.lastUpdated)}
      body={info?.body}
      emptyText="Az általános betegtájékoztató hamarosan elérhető lesz."
    />
  );
}
