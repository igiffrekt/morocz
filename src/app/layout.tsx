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
import type { SiteSettingsQueryResult } from "../../sanity.types";
import "./globals.css";

// ─── Dynamic Root Metadata ────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettingsQueryResult | null>({
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
  const settings = await sanityFetch<SiteSettingsQueryResult | null>({
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
              clinicName={settings?.clinicName ?? undefined}
              navigationLinks={settings?.navigationLinks as any}
              phone={settings?.phone ?? undefined}
              address={settings?.address ?? undefined}
            />
            <main className="space-y-3">{children}</main>
            <Footer
              clinicName={settings?.clinicName ?? undefined}
              phone={settings?.phone ?? undefined}
              email={settings?.email ?? undefined}
              address={settings?.address ?? undefined}
              footerColumns={settings?.footerColumns as any}
              socialLinks={settings?.socialLinks as any}
              privacyPolicyUrl={settings?.privacyPolicyUrl ?? undefined}
              cookiePolicyUrl={settings?.cookiePolicyUrl ?? undefined}
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
