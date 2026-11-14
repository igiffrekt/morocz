import type { Metadata } from "next";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { PriceMenu } from "@/components/home/PriceMenu";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { PriceNotes } from "@/components/prices/PriceNotes";
import { PriceOverviewCard } from "@/components/prices/PriceOverviewCard";
import { ScreeningCompare } from "@/components/prices/ScreeningCompare";
import { JsonLd } from "@/components/seo/JsonLd";
import { CtaBand } from "@/components/subpage/CtaBand";
import { PageHero } from "@/components/subpage/PageHero";
import { PillLink } from "@/components/ui/PillButton";
import { bookingHref } from "@/lib/booking-services";
import { comparePackages, priceMenuOffers } from "@/lib/price-menu";
import { breadcrumbJsonLd } from "@/lib/service-page";
import { getOpeningWeek, getPriceListData, getServicesIntro } from "@/sanity/lib/subpage-data";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Szolgáltatások és Árak | Mórocz Medical",
  description:
    "Nőgyógyászati szolgáltatások és árak. Vizsgálatok, várandósgondozás, laborvizsgálatok - teljes árlista 2026.",
};

const PAGE_PATH = "/szolgaltatasok-es-arak";
const PAGE_URL = `https://drmoroczangela.hu${PAGE_PATH}`;
const CLINIC_NAME = "Dr. Mórocz Angéla Nőgyógyászati Rendelő";
const DEFAULT_LEAD =
  "Átfogó egészségügyi ellátás modern környezetben. Minden, amire szüksége van, egy helyen.";

export default async function SzolgaltatasokEsArakPage() {
  const [prices, week, intro] = await Promise.all([
    getPriceListData(),
    getOpeningWeek(),
    getServicesIntro(),
  ]);
  const { categories, validityNote } = prices;
  const screening = categories.find((c) => c.theme === "screening");
  const packages = comparePackages(screening?.items ?? []);
  const lead = intro?.servicesSubtitle || DEFAULT_LEAD;

  const offerCatalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `Szolgáltatások és árak — ${CLINIC_NAME}`,
    url: PAGE_URL,
    inLanguage: "hu",
    description: validityNote,
    provider: { "@type": "MedicalClinic", name: CLINIC_NAME, url: "https://drmoroczangela.hu" },
    itemListElement: priceMenuOffers(categories, PAGE_URL),
  };

  return (
    <div className="flex flex-col gap-12 pb-4 lg:gap-28 lg:pb-0">
      <PageHero
        titleId="arak-cim"
        crumbs={[{ label: "Szolgáltatások és Árak" }]}
        eyebrow="Árlista"
        eyebrowIcon={ICON_PATHS.coin}
        accentClassName="bg-sun"
        title={
          <>
            Szolgáltatások és <span className="text-sun">Árak</span>
          </>
        }
        lead={lead}
        leadClassName="max-md:hidden"
        aside={<PriceOverviewCard categories={categories} />}
        actions={
          <>
            <PillLink
              href={bookingHref("nogyogyaszat")}
              variant="pink"
              size="lg"
              arrow
              className="max-sm:w-full"
            >
              Foglaljon időpontot
            </PillLink>
            <PillLink
              href="#tudnivalok"
              variant="ghost"
              size="lg"
              className="border-[1.5px] border-white/28 font-bold text-white hover:bg-white/10 hover:text-white max-sm:hidden"
            >
              Tudnivalók
            </PillLink>
          </>
        }
      >
        <div className="fade-up flex flex-wrap gap-1.5 [--i:2] md:gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint-light py-[7px] pr-3.5 pl-3 text-xs font-extrabold whitespace-nowrap text-navy md:bg-white md:py-2.5 md:pr-5 md:text-sm">
            <PathIcon d={ICON_PATHS.cal} size={16} strokeWidth={2} />
            {validityNote}
          </span>
          <span className="inline-flex items-center rounded-full border border-white/20 px-3.5 py-[7px] text-xs font-semibold whitespace-nowrap text-[#d6d9ec] md:px-5 md:py-2.5 md:text-sm">
            Az árváltoztatás jogát fenntartjuk.
          </span>
        </div>
        <div className="fade-up flex max-w-[620px] items-start gap-3.5 rounded-tile border border-sun/35 bg-sun/12 px-4 py-3.5 [--i:3] md:px-5 md:py-4">
          <span className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-sun px-3 text-xs font-extrabold whitespace-nowrap text-navy">
            + Felár
          </span>
          <span className="text-[13px] leading-[1.6] text-[#e4e6f2] md:text-[15px]">
            A vizsgálat során szakmailag indokolttá válhatnak további vizsgálatok, mintavételek,
            amelyek többletköltséggel járhatnak. Ezek elvégzése a páciens előzetes tájékoztatásával
            és beleegyezésével történnek.
          </span>
        </div>
      </PageHero>

      <PriceMenu
        id="arlista"
        anchors
        heading={intro?.servicesHeadline}
        lead={lead}
        validityNote={validityNote}
        categories={categories}
        surchargeExample={prices.surchargeExample}
      />

      <ScreeningCompare packages={packages} />

      <PriceNotes week={week} />

      <CtaBand
        eyebrow="Időpontfoglalás"
        title="Foglaljon időpontot!"
        text="Online időpontfoglalás pár kattintással."
        href={bookingHref("nogyogyaszat")}
        label="Időpontfoglalás"
      />

      <MobileActionBar bookingHref={bookingHref("nogyogyaszat")} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Kezdőlap", path: "/" },
          { name: "Szolgáltatások és Árak", path: PAGE_PATH },
        ])}
      />
      <JsonLd data={offerCatalogJsonLd} />
    </div>
  );
}
