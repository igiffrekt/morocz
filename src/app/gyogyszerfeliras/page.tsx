import type { Metadata } from "next";
import { ServicePage } from "@/components/service/ServicePage";
import { getServicePageData } from "@/sanity/lib/subpage-data";

export const revalidate = 30;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Gyógyszerfelírás — Nőgyógyászati receptírás",
  description:
    "Nőgyógyászati gyógyszerfelírás Esztergomban. Fogamzásgátló, hormonpótló kezelés, hüvelyi fertőzések gyógyszeres ellátása. Dr. Mórocz Angéla nőgyógyász.",
  keywords: [
    "gyógyszerfelírás nőgyógyász",
    "recept nőgyógyász",
    "fogamzásgátló felírás",
    "hormonpótló kezelés",
    "nőgyógyászati gyógyszer",
    "recept Esztergom",
  ],
  openGraph: {
    type: "website",
    title: "Gyógyszerfelírás — Dr. Mórocz Angéla nőgyógyász",
    description:
      "Nőgyógyászati gyógyszerfelírás: fogamzásgátlók, hormonkezelés, fertőzések kezelése. Foglaljon időpontot.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/gyogyszerfeliras",
  },
};

// ─── Structured data (FAQPage + BreadcrumbList come from the shared template) ──

const medicalWebPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Gyógyszerfelírás — Dr. Mórocz Angéla nőgyógyász",
  description:
    "Nőgyógyászati gyógyszerfelírás: fogamzásgátlók, hormonpótló kezelés, hüvelyi fertőzések kezelése.",
  url: "https://drmoroczangela.hu/gyogyszerfeliras",
  inLanguage: "hu",
  specialty: {
    "@type": "MedicalSpecialty",
    name: "Gynecology",
  },
  about: {
    "@type": "MedicalProcedure",
    name: "Prescription",
  },
  mainEntity: {
    "@type": "MedicalClinic",
    name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
    url: "https://drmoroczangela.hu",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GyogyszerfelirasPage() {
  const data = await getServicePageData("gyogyszerfeliras");
  return <ServicePage slug="gyogyszerfeliras" data={data} jsonLd={[medicalWebPageJsonLd]} />;
}
