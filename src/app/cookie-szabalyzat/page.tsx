import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { formatLegalDate } from "@/lib/legal-docs";
import { sanityFetch } from "@/sanity/lib/fetch";
import { cookiePolicyQuery } from "@/sanity/lib/queries";
import type { CookiePolicy } from "../../../sanity.types";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const policy = await sanityFetch<CookiePolicy | null>({
    query: cookiePolicyQuery,
    tags: ["cookiePolicy"],
  });
  return {
    title: policy?.title ?? "Cookie Szabályzat",
    description: "Cookie Szabályzat — Mórocz Medical",
    robots: { index: true, follow: true },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CookieSzabalyzatPage() {
  const policy = await sanityFetch<CookiePolicy | null>({
    query: cookiePolicyQuery,
    tags: ["cookiePolicy"],
  });

  return (
    <LegalPage
      docKey="cookie-szabalyzat"
      title={policy?.title ?? "Cookie Szabályzat"}
      dateLabel="Utolsó frissítés:"
      date={formatLegalDate(policy?.lastUpdated)}
      body={policy?.body}
      emptyText="A cookie szabályzat hamarosan elérhető lesz."
    />
  );
}
