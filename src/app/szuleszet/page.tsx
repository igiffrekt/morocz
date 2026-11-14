import type { Metadata } from "next";
import { ServicePage } from "@/components/service/ServicePage";
import { getServicePageData } from "@/sanity/lib/subpage-data";

export const revalidate = 30;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Szülészet Esztergomban",
  description:
    "Szülészeti ellátás, szüléstervezés és szülés utáni gondozás Esztergomban. Dr. Mórocz Angéla szülész-nőgyógyász szakorvos. Foglaljon időpontot.",
  keywords: [
    "szülészet Esztergom",
    "szülész",
    "szülés utáni gondozás",
    "szüléstervezés",
    "szülészeti tanácsadás",
    "gyermekágyi gondozás",
  ],
  openGraph: {
    type: "website",
    title: "Szülészet Esztergomban — Dr. Mórocz Angéla",
    description:
      "Szülészeti ellátás, szüléstervezés és szülés utáni gondozás Esztergomban. Foglaljon időpontot.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/szuleszet",
  },
};

// ─── Structured data (FAQPage + BreadcrumbList come from the shared template) ──

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Szülészet Esztergomban — Dr. Mórocz Angéla",
  description: "Szülészeti ellátás, szüléstervezés és szülés utáni gondozás Esztergomban.",
  url: "https://drmoroczangela.hu/szuleszet",
  inLanguage: "hu",
  specialty: {
    "@type": "MedicalSpecialty",
    name: "Obstetrics",
  },
  about: {
    "@type": "MedicalSpecialty",
    name: "Obstetrics",
  },
  mainEntity: {
    "@type": "MedicalClinic",
    name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
    url: "https://drmoroczangela.hu",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SzuleszetPage() {
  const data = await getServicePageData("szuleszet");
  return <ServicePage slug="szuleszet" data={data} jsonLd={[medicalWebPageJsonLd]} />;
}
