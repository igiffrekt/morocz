import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { IntroOverlay } from "@/components/motion/IntroOverlay";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CookieNotice } from "@/components/ui/CookieNotice";
import { DraftModeIndicator } from "@/components/ui/DraftModeIndicator";
import { GoogleAnalytics } from "@/components/ui/GoogleAnalytics";
import { plusJakartaSans } from "@/lib/fonts";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import type { SiteSettings } from "../../sanity.types";
import "./globals.css";

// ─── Dynamic Root Metadata ────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings | null>({
    query: siteSettingsQuery,
    tags: ["siteSettings"],
  });

  const siteName = settings?.siteName ?? settings?.clinicName ?? "Mórocz Medical";
  const description =
    settings?.metaDescription ??
    "Mórocz Medical — Egészségügyi szolgáltatások Esztergomban. Foglaljon időpontot online.";

  const ogImages =
    settings?.defaultOgImage?.asset != null
      ? [{ url: urlFor(settings.defaultOgImage).width(1200).height(630).url() }]
      : undefined;

  return {
    metadataBase: new URL("https://drmoroczangela.hu"),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "hu_HU",
      siteName,
      title: siteName,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

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
          <IntroOverlay />
          <div className="max-w-[88rem] mx-auto px-2 sm:px-3 lg:px-4 py-3 space-y-3">
            <Header
              clinicName={settings?.clinicName}
              navigationLinks={settings?.navigationLinks}
              phone={settings?.phone}
              address={settings?.address}
            />
            <main className="space-y-3">{children}</main>
            <Footer
              clinicName={settings?.clinicName}
              phone={settings?.phone}
              email={settings?.email}
              address={settings?.address}
              footerColumns={settings?.footerColumns}
              socialLinks={settings?.socialLinks}
              privacyPolicyUrl={settings?.privacyPolicyUrl}
            />
          </div>
          <CookieNotice />
        </MotionProvider>
        <DraftModeIndicator />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
