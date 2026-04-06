import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { IntroOverlay } from "@/components/motion/IntroOverlay";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CookieNotice } from "@/components/ui/CookieNotice";
import { DraftModeIndicator } from "@/components/ui/DraftModeIndicator";
import { GoogleAnalytics } from "@/components/ui/GoogleAnalytics";
import { PopupModal } from "@/components/ui/PopupModal";
import { plusJakartaSans } from "@/lib/fonts";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { siteSettingsQuery, activePopupQuery } from "@/sanity/lib/queries";
import type { SiteSettingsQueryResult, ActivePopupQueryResult } from "../../sanity.types";
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
  const [settings, popup] = await Promise.all([
    sanityFetch<SiteSettingsQueryResult | null>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
    sanityFetch<ActivePopupQueryResult | null>({
      query: activePopupQuery,
      tags: ["popup"],
    }),
  ]);

  return (
    <html lang="hu" className={plusJakartaSans.variable}>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WGPDK69W');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WGPDK69W"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
          <PopupModal popup={popup as any} />
        </MotionProvider>
        <DraftModeIndicator />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
