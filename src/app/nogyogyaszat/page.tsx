import type { Metadata } from "next";
import { ServicePage } from "@/components/service/ServicePage";
import { getServicePageData } from "@/sanity/lib/subpage-data";

export const revalidate = 30;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Nőgyógyászat Esztergomban",
  description:
    "Nőgyógyászati vizsgálat, szűrés és szakellátás Esztergomban. Dr. Mórocz Angéla nőgyógyász szakorvos rendelője. Időpontfoglalás online.",
  keywords: [
    "nőgyógyász Esztergom",
    "nőgyógyászati vizsgálat",
    "nőgyógyászati szűrés",
    "PAP-teszt",
    "HPV-szűrés",
    "kolposzkópia",
    "nőgyógyász",
  ],
  openGraph: {
    type: "website",
    title: "Nőgyógyászat Esztergomban — Dr. Mórocz Angéla",
    description:
      "Nőgyógyászati vizsgálat, szűrés és szakellátás Esztergomban. Foglaljon időpontot online.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/nogyogyaszat",
  },
};

// ─── Structured data (FAQPage + BreadcrumbList come from the shared template) ──

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Nőgyógyászat Esztergomban — Dr. Mórocz Angéla",
  description:
    "Nőgyógyászati vizsgálat, szűrés és szakellátás Esztergomban. Dr. Mórocz Angéla nőgyógyász szakorvos.",
  url: "https://drmoroczangela.hu/nogyogyaszat",
  inLanguage: "hu",
  specialty: {
    "@type": "MedicalSpecialty",
    name: "Gynecology",
  },
  about: {
    "@type": "MedicalSpecialty",
    name: "Gynecology",
  },
  mainEntity: {
    "@type": "MedicalClinic",
    name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
    url: "https://drmoroczangela.hu",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NogyogyaszatPage() {
  const data = await getServicePageData("nogyogyaszat");
  return <ServicePage slug="nogyogyaszat" data={data} jsonLd={[medicalWebPageJsonLd]} />;
}
