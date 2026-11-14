import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SiteContactProvider } from "@/components/layout/SiteContext";
import { IntroOverlay } from "@/components/motion/IntroOverlay";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CookieNotice } from "@/components/ui/CookieNotice";
import { DraftModeIndicator } from "@/components/ui/DraftModeIndicator";
import { GoogleAnalytics } from "@/components/ui/GoogleAnalytics";
import { PopupModal } from "@/components/ui/PopupModal";
import { StaleDeploymentReloader } from "@/components/ui/StaleDeploymentReloader";
import { plusJakartaSans } from "@/lib/fonts";
import { computeOpeningHours, type SeasonalScheduleWithName } from "@/lib/opening-hours";
import { buildServiceMenu } from "@/lib/service-menu";
import { todayInBudapest } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  activePopupQuery,
  allServicesQuery,
  seasonalSchedulesForRangeQuery,
  siteSettingsQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
import type {
  ActivePopupQueryResult,
  AllServicesQueryResult,
  SiteSettingsQueryResult,
  WeeklyScheduleQueryResult,
} from "../../sanity.types";
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

/** The reception address shown in the menu / footer: Sanity footer "mailto:" link first. */
function pickEmail(settings: SiteSettingsQueryResult | null): string | undefined {
  for (const col of settings?.footerColumns ?? []) {
    for (const link of col.links ?? []) {
      if (link.href?.startsWith("mailto:")) return link.href.slice("mailto:".length);
    }
  }
  return settings?.email ?? undefined;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = todayInBudapest();
  const [settings, popup, weekly, seasonals, services] = await Promise.all([
    sanityFetch<SiteSettingsQueryResult | null>({
      query: siteSettingsQuery,
      tags: ["siteSettings"],
    }),
    sanityFetch<ActivePopupQueryResult | null>({
      query: activePopupQuery,
      tags: ["popup"],
    }),
    sanityFetch<WeeklyScheduleQueryResult | null>({
      query: weeklyScheduleQuery,
      tags: ["weeklySchedule"],
    }),
    sanityFetch<SeasonalScheduleWithName[] | null>({
      query: seasonalSchedulesForRangeQuery,
      params: { startDate: today, endDate: today },
      tags: ["seasonalSchedule"],
    }),
    sanityFetch<AllServicesQueryResult | null>({
      query: allServicesQuery,
      tags: ["service"],
    }),
  ]);

  const phone = settings?.phone ?? undefined;
  const email = pickEmail(settings);
  const address = settings?.address ?? undefined;
  const openingHours = computeOpeningHours(
    today,
    weekly ? { days: (weekly.days ?? []).map(normalizeDay) } : null,
    seasonals,
  );
  const serviceMenu = buildServiceMenu(services ?? []);

  return (
    <html lang="hu" className={plusJakartaSans.variable}>
      <body>
        <MotionProvider>
          <SiteContactProvider
            value={{ phone: phone ?? "", email: email ?? "", address: address ?? "" }}
          >
            <IntroOverlay />
            <Header
              clinicName={settings?.clinicName ?? undefined}
              navigationLinks={settings?.navigationLinks}
              phone={phone}
              email={email}
              address={address}
              openingHours={openingHours}
              serviceMenu={serviceMenu}
            />
            <div className="mx-auto w-full max-w-[calc(var(--container-site)+2rem)] space-y-3 px-3 pt-1 lg:px-4 lg:pt-4">
              <main className="space-y-3">{children}</main>
            </div>
            <Footer
              clinicName={settings?.clinicName ?? undefined}
              phone={phone}
              email={email}
              address={address}
              socialLinks={settings?.socialLinks}
              privacyPolicyUrl={settings?.privacyPolicyUrl ?? undefined}
              cookiePolicyUrl={settings?.cookiePolicyUrl ?? undefined}
              termsOfServiceUrl={settings?.termsOfServiceUrl ?? undefined}
              bookingPolicyUrl={settings?.bookingPolicyUrl ?? undefined}
              generalPatientInfoUrl={settings?.generalPatientInfoUrl ?? undefined}
            />
            <CookieNotice />
            <PopupModal popup={popup as any} />
          </SiteContactProvider>
        </MotionProvider>
        <DraftModeIndicator />
        <StaleDeploymentReloader />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}

type WeeklyDay = NonNullable<NonNullable<WeeklyScheduleQueryResult>["days"]>[number];

/** Sanity returns nullable fields; the schedule resolver expects plain values. */
function normalizeDay(d: WeeklyDay) {
  return {
    dayOfWeek: d.dayOfWeek ?? -1,
    isDayOff: d.isDayOff ?? false,
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
    breakStart: d.breakStart,
    breakEnd: d.breakEnd,
  };
}
