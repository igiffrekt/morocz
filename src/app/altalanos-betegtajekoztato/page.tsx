import type { Metadata } from "next";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-6 mb-4">
        {info?.title ?? "Általános Betegtájékoztató"}
      </h1>

      {info?.lastUpdated && (
        <p className="text-sm text-gray-500 mb-8">
          Hatályos:{" "}
          {new Date(info.lastUpdated).toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {info?.body ? (
        <PortableTextRenderer body={info.body} />
      ) : (
        <p className="text-base text-gray-700 leading-relaxed">
          Az általános betegtájékoztató hamarosan elérhető lesz.
        </p>
      )}
    </main>
  );
}
