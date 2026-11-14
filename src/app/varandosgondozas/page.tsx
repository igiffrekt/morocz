import type { Metadata } from "next";
import { ServicePage } from "@/components/service/ServicePage";
import { getServicePageData } from "@/sanity/lib/subpage-data";

export const revalidate = 30;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Várandósgondozás Esztergomban",
  description:
    "Teljes körű várandósgondozás és terhesgondozás Esztergomban. Ultrahangvizsgálat, szűrések, trimeszterenkénti kontroll. Dr. Mórocz Angéla nőgyógyász.",
  keywords: [
    "várandósgondozás Esztergom",
    "terhesgondozás",
    "terhesség ultrahang",
    "magzati ultrahang",
    "genetikai szűrés terhesség",
    "várandós gondozás",
  ],
  openGraph: {
    type: "website",
    title: "Várandósgondozás Esztergomban — Dr. Mórocz Angéla",
    description:
      "Teljes körű várandósgondozás: ultrahang, szűrések, trimeszterenkénti kontroll. Foglaljon időpontot.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/varandosgondozas",
  },
};

// ─── Structured data (FAQPage + BreadcrumbList come from the shared template) ──

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Várandósgondozás Esztergomban — Dr. Mórocz Angéla",
  description:
    "Teljes körű várandósgondozás: ultrahangvizsgálat, szűrések, trimeszterenkénti kontroll.",
  url: "https://drmoroczangela.hu/varandosgondozas",
  inLanguage: "hu",
  specialty: {
    "@type": "MedicalSpecialty",
    name: "Obstetrics",
  },
  about: {
    "@type": "MedicalCondition",
    name: "Pregnancy",
  },
  mainEntity: {
    "@type": "MedicalClinic",
    name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
    url: "https://drmoroczangela.hu",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VarandosgondozasPage() {
  const data = await getServicePageData("varandosgondozas");
  return <ServicePage slug="varandosgondozas" data={data} jsonLd={[medicalWebPageJsonLd]} />;
}
