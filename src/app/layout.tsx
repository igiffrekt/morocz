import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { plusJakartaSans } from "@/lib/fonts";
import { sanityFetch } from "@/sanity/lib/fetch";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import type { SiteSettings } from "../../sanity.types";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morocz Medical",
  description:
    "Morocz Medical — Egészségügyi szolgáltatások Esztergomban. Foglaljon időpontot online.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await sanityFetch<SiteSettings | null>({
    query: siteSettingsQuery,
    tags: ["siteSettings"],
  });

  return (
    <html lang="hu" className={plusJakartaSans.variable}>
      <body>
        <MotionProvider>
          <Header
            logo={settings?.logo}
            clinicName={settings?.clinicName}
            navigationLinks={settings?.navigationLinks}
            phone={settings?.phone}
          />
          <main>{children}</main>
          <Footer
            logo={settings?.logo}
            clinicName={settings?.clinicName}
            phone={settings?.phone}
            email={settings?.email}
            address={settings?.address}
            footerColumns={settings?.footerColumns}
            socialLinks={settings?.socialLinks}
            privacyPolicyUrl={settings?.privacyPolicyUrl}
          />
        </MotionProvider>
      </body>
    </html>
  );
}
