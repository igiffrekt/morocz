import type { Metadata } from "next";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-6 mb-4">
        {policy?.title ?? "Foglalási és Lemondási Szabályzat"}
      </h1>

      {policy?.lastUpdated && (
        <p className="text-sm text-gray-500 mb-8">
          Hatályos:{" "}
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
          A foglalási és lemondási szabályzat hamarosan elérhető lesz.
        </p>
      )}
    </main>
  );
}
