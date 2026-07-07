import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sanityFetch } from "@/sanity/lib/fetch";
import { pricingPageQuery } from "@/sanity/lib/queries";
import type { PricingPageQueryResult } from "../../../sanity.types";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Szolgáltatások és Árak | Mórocz Medical",
  description:
    "Nőgyógyászati szolgáltatások és árak. Vizsgálatok, várandósgondozás, laborvizsgálatok - teljes árlista 2026.",
};

// Card gradient styles matching homepage
const cardStyles = {
  navy: {
    bg: "bg-gradient-to-br from-[#2B3674] to-[#1a2550]",
  },
  mint: {
    bg: "bg-gradient-to-br from-[#76c8b6] to-[#5eb8a3]",
  },
  pink: {
    bg: "bg-gradient-to-br from-[#E8D5E0] to-[#d4bfcc]",
  },
  blue: {
    bg: "bg-gradient-to-br from-[#D4E5ED] to-[#b8d1de]",
  },
  coral: {
    bg: "bg-gradient-to-br from-[#f0a88c] to-[#e8927a]",
  },
};

const importantInfo = [
  {
    title: "E-recept",
    content:
      "Rendszeresen szedett fogamzásgátló gyógyszer felírása E-recept formájában ingyenes, amennyiben 1 éven belüli méhnyakszűrés történt rendelőnkben. Recept felírása vizsgálat alkalmával díjtalan.",
  },
  {
    title: "Vizsgálati díjak",
    content:
      "A vizsgálati díjak tartalmazzák a mintakezelési, leletkezelési és adminisztrációs költséget is.",
  },
  {
    title: "Eredmények",
    content:
      "Eredményeik az EESZT rendszerbe kerülnek feltöltésre, melyet lakossági portáljukon belépve tekinthetnek meg.",
  },
  {
    title: "Magzati genetikai ultrahang",
    content:
      "Magzati genetikai ultrahangot nem végzek. Ajánlott intézmény: Czeizel Intézet Budapest.",
  },
];

const officeHours = [
  { day: "Hétfő", hours: "12:00-15:00" },
  { day: "Kedd", hours: "12:00-15:00" },
  { day: "Csütörtök", hours: "13:00-17:00" },
];

// Fallback data used until the pricingPage singleton is published in Studio.
// Mirrors the initialValue in src/sanity/schemaTypes/pricingPageType.ts so
// the page renders sensibly on first deploy before any editor publish.
const DEFAULT_DATA: NonNullable<PricingPageQueryResult> = {
  validityNote: "Érvényes 2026. július 1-től",
  gynBaseExam: {
    items: [
      {
        _key: "d1",
        label: "Vizsgálat / tanácsadás",
        subtitle: "ultrahang nélkül",
        badge: null,
        badgeStyle: null,
        note: null,
        price: 30000,
      },
      {
        _key: "d2",
        label: "Vizsgálat ultrahanggal",
        subtitle: null,
        badge: "+ UH",
        badgeStyle: "mint",
        note: null,
        price: 43000,
      },
      {
        _key: "d3",
        label: "Vizsgálat ultrahanggal és méhnyakszűréssel",
        subtitle: null,
        badge: "+ UH + LBC",
        badgeStyle: "pink",
        note: null,
        price: 52000,
      },
      {
        _key: "d4",
        label: "Kontroll vizsgálat",
        subtitle: null,
        badge: "-17%",
        badgeStyle: "white",
        note: "(3 hónapon belül)",
        price: 25000,
      },
    ],
  },
  spiralServices: {
    items: [
      {
        _key: "d5",
        label: "Spirál felhelyezés / csere",
        subtitle: "ultrahanggal",
        badge: null,
        badgeStyle: null,
        note: null,
        price: 45000,
      },
      {
        _key: "d6",
        label: "Spirál eltávolítás",
        subtitle: null,
        badge: null,
        badgeStyle: null,
        note: null,
        price: 30000,
      },
    ],
    footnote: "Az eszköz árát nem tartalmazza",
  },
  pregnancyCare: {
    label: "Várandósgondozás",
    subtitle: "Tájékozódó ultrahanggal (nem genetikai)",
    price: 45000,
  },
  screeningPackages: {
    tiers: [
      {
        _key: "t1",
        name: "Komplex",
        price: 52000,
        highlighted: false,
        features: [
          {
            _key: "f1",
            text: "Nőgyógyászati vizsgálat",
            subtext: null,
            included: true,
            emphasized: false,
          },
          { _key: "f2", text: "Ultrahang", subtext: null, included: true, emphasized: false },
          {
            _key: "f3",
            text: "LBC méhnyakszűrés",
            subtext: "(vizsgálat+mintavétel+ultrahang)",
            included: true,
            emphasized: false,
          },
          {
            _key: "f4",
            text: "HPV DNS tipizálás",
            subtext: null,
            included: false,
            emphasized: false,
          },
        ],
      },
      {
        _key: "t2",
        name: "Kiterjesztett komplex",
        price: 68000,
        highlighted: true,
        features: [
          {
            _key: "f5",
            text: "Nőgyógyászati vizsgálat",
            subtext: null,
            included: true,
            emphasized: false,
          },
          { _key: "f6", text: "Ultrahang", subtext: null, included: true, emphasized: false },
          {
            _key: "f7",
            text: "LBC méhnyakszűrés",
            subtext: "(vizsgálat+mintavétel+ultrahang)",
            included: true,
            emphasized: false,
          },
        ],
      },
    ],
  },
  samplingServices: {
    items: [
      { _key: "s1", label: "Folyadékalapú méhnyakszűrés (LBC) mintavétel", price: 9000 },
      { _key: "s3", label: "Hagyományos citológia mintavétel", price: 6500 },
      { _key: "s2", label: "Endometrium (méhnyálkahártya) szövettani mintavétel", price: 20000 },
    ],
  },
  microbiologyServices: {
    items: [
      {
        _key: "m1",
        label: "Hüvelyváladék tenyésztés (aerob baktérium + gomba + kenet)",
        suffix: null,
        price: 8500,
      },
      { _key: "m2", label: "STD vizsgálat", suffix: "/kórokozó", price: 7500 },
      { _key: "m3", label: "GBS szűrés", suffix: null, price: 7500 },
    ],
  },
  hpvTests: {
    intro:
      "A különböző HPV-vizsgálatok eltérő módszerrel és eltérő klinikai céllal történnek. A megfelelő vizsgálat kiválasztása orvosi javaslat alapján történik.",
    items: [
      {
        _key: "h1",
        name: "HPV DNS alapú, 28 genotípus meghatározás (HPV28)",
        description: "HPV jelenlétét vizsgálja",
        price: 18000,
      },
      {
        _key: "h2",
        name: "Aptima mRNS alapú HPV vizsgálat",
        description: "Magas kockázatú típusok aktivitásának kimutatására szolgál",
        price: 16000,
      },
    ],
  },
  otherServices: {
    items: [
      { _key: "o1", label: "Injekció beadása", price: 6000 },
      { _key: "o2", label: "Szakorvosi dokumentáció", price: 12000 },
      { _key: "o3", label: "Sürgősségi fogamzásgátlás", price: 10000 },
      { _key: "o4", label: "Receptírás", price: 4900 },
    ],
    footnote: "Receptírás vizsgálat alkalmával díjtalan.",
  },
};

const formatPrice = (price: number | null | undefined) =>
  typeof price === "number" ? `${price.toLocaleString("hu-HU")} Ft` : "";

type BadgeStyle = "mint" | "pink" | "white" | null | undefined;

const badgeClass = (style: BadgeStyle) => {
  switch (style) {
    case "mint":
      return "bg-[#a8d5ba] text-[#1e2952]";
    case "pink":
      return "bg-[#E8D5E0] text-[#1e2952]";
    default:
      return "bg-white/20 text-white";
  }
};

const priceColorClass = (style: BadgeStyle) => {
  switch (style) {
    case "mint":
      return "text-[#a8d5ba]";
    case "pink":
      return "text-[#E8D5E0]";
    default:
      return "text-white";
  }
};

type PriceRowItem = {
  _key: string;
  label: string | null;
  subtitle: string | null;
  badge: string | null;
  badgeStyle: BadgeStyle;
  note: string | null;
  price: number | null;
};

function PriceRow({ item, isLast }: { item: PriceRowItem; isLast: boolean }) {
  const highlight = item.badgeStyle === "mint";
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between py-3 ${
        isLast ? "" : "border-b border-white/10"
      } ${highlight ? "bg-white/5 -mx-4 px-4 md:-mx-0 md:px-0 md:bg-transparent" : ""}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {item.badge ? (
          <span className={`px-2 py-1 rounded-lg ${badgeClass(item.badgeStyle)} text-xs font-bold`}>
            {item.badge}
          </span>
        ) : null}
        <span className="text-white font-medium">{item.label}</span>
        {item.subtitle ? (
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
            {item.subtitle}
          </span>
        ) : null}
        {item.note ? <span className="text-white/50 text-sm">{item.note}</span> : null}
      </div>
      <span className={`text-xl font-bold ${priceColorClass(item.badgeStyle)} mt-2 md:mt-0`}>
        {formatPrice(item.price)}
      </span>
    </div>
  );
}

// Tier card styling is determined by position (not editor-configurable)
const TIER_STYLES = [
  {
    bg: cardStyles.blue.bg,
    checkColor: "text-[#76c8b6]",
    emphColor: "text-[#1e2952]",
    shadow: "shadow-lg",
  },
  {
    bg: cardStyles.mint.bg,
    checkColor: "text-[#1e2952]",
    emphColor: "text-[#1e2952]",
    shadow: "shadow-xl",
  },
  {
    bg: cardStyles.pink.bg,
    checkColor: "text-[#76c8b6]",
    emphColor: "text-[#1e2952]",
    shadow: "shadow-lg",
  },
];

export default async function SzolgaltatasokEsArakPage() {
  const fetched = await sanityFetch<PricingPageQueryResult | null>({
    query: pricingPageQuery,
    tags: ["pricingPage"],
  });
  const data = fetched ?? DEFAULT_DATA;

  const gynItems = data.gynBaseExam?.items ?? [];
  const spiralItems = data.spiralServices?.items ?? [];
  const tiers = data.screeningPackages?.tiers ?? [];
  const samplingItems = data.samplingServices?.items ?? [];
  const microItems = data.microbiologyServices?.items ?? [];
  const hpvItems = data.hpvTests?.items ?? [];
  const otherItems = data.otherServices?.items ?? [];

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-primary rounded-[40px] overflow-hidden">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e2952] to-[#2B3674] rounded-b-[40px] relative overflow-hidden pt-28 pb-16 -mt-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#a8d5ba] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#E8D5E0] opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          {data.validityNote ? (
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#a8d5ba]/20 text-[#a8d5ba] text-sm font-bold uppercase tracking-wider mb-6">
              {data.validityNote}
            </span>
          ) : null}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Szolgáltatások és Árak
          </h1>
          <p className="text-base text-[#a8d5ba] font-medium mb-4">
            Az árváltoztatás jogát fenntartjuk.
          </p>
          <p className="text-base text-blue-200/80 max-w-3xl leading-relaxed">
            A vizsgálat során szakmailag indokolttá válhatnak további vizsgálatok, mintavételek,
            amelyek többletköltséggel járhatnak. Ezek elvégzése a páciens előzetes tájékoztatásával
            és beleegyezésével történnek.
          </p>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* === GYNECOLOGICAL EXAMS === */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👩‍⚕️</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2952]">
              Nőgyógyászati vizsgálatok
            </h2>
          </div>

          <div className={`${cardStyles.navy.bg} rounded-3xl p-6 md:p-8 shadow-xl`}>
            {/* Base exam group */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#a8d5ba]" />
                <span className="text-sm font-bold text-[#a8d5ba] uppercase tracking-wide">
                  Alapvizsgálat
                </span>
              </div>

              <div className="relative pl-4 border-l-2 border-[#a8d5ba]/30">
                {gynItems.map((item, idx) => (
                  <PriceRow key={item._key} item={item} isLast={idx === gynItems.length - 1} />
                ))}
              </div>
            </div>

            {/* Spiral services group */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#E8D5E0]" />
                <span className="text-sm font-bold text-[#E8D5E0] uppercase tracking-wide">
                  Spirál szolgáltatások
                </span>
              </div>

              <div className="relative pl-4 border-l-2 border-[#E8D5E0]/30">
                {spiralItems.map((item, idx) => (
                  <PriceRow key={item._key} item={item} isLast={idx === spiralItems.length - 1} />
                ))}
                {data.spiralServices?.footnote ? (
                  <p className="text-white/50 text-sm mt-2">{data.spiralServices.footnote}</p>
                ) : null}
              </div>
            </div>

            {/* Pregnancy care */}
            {data.pregnancyCare ? (
              <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🤰</span>
                    <div>
                      <span className="text-white font-bold text-lg">
                        {data.pregnancyCare.label}
                      </span>
                      {data.pregnancyCare.subtitle ? (
                        <p className="text-white/60 text-sm">{data.pregnancyCare.subtitle}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-[#a8d5ba] mt-3 md:mt-0">
                    {formatPrice(data.pregnancyCare.price)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* === SCREENING PACKAGES === */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🩺</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2952]">Éves Szűrőcsomagok</h2>
            <span className="px-3 py-1 rounded-full bg-[#a8d5ba]/20 text-[#1e2952] text-sm font-medium">
              Évente 1x igénybe vehető
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier, idx) => {
              const style = TIER_STYLES[idx] ?? TIER_STYLES[0];
              return (
                <div
                  key={tier._key}
                  className={`${style.bg} rounded-3xl p-6 ${style.shadow} ${
                    tier.highlighted ? "relative transform md:scale-105 z-10" : ""
                  }`}
                >
                  {tier.highlighted ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-[#1e2952] text-white text-xs font-bold uppercase">
                        Ajánlott
                      </span>
                    </div>
                  ) : null}
                  <div className="text-center mb-6">
                    <span className="text-sm font-bold text-[#1e2952]/60 uppercase tracking-wide">
                      {tier.name}
                    </span>
                    <div className="text-4xl font-black text-[#1e2952] mt-2">
                      {typeof tier.price === "number" ? tier.price.toLocaleString("hu-HU") : ""}{" "}
                      <span className="text-lg">Ft</span>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {(tier.features ?? []).map((feature) => {
                      const included = feature.included !== false;
                      const iconColor = included
                        ? feature.emphasized
                          ? style.emphColor
                          : style.checkColor
                        : "";
                      const textClass = included
                        ? `text-[#1e2952] ${feature.emphasized ? "font-medium" : ""}`
                        : "text-[#1e2952]/40";
                      return (
                        <li
                          key={feature._key}
                          className={`flex ${feature.subtext ? "items-start" : "items-center"} gap-2 ${textClass}`}
                        >
                          {included ? (
                            <svg
                              className={`w-5 h-5 ${iconColor} ${feature.subtext ? "flex-shrink-0 mt-0.5" : ""}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {feature.subtext ? (
                            <div>
                              <div>{feature.text}</div>
                              <p className="text-xs text-[#1e2952]/60">{feature.subtext}</p>
                            </div>
                          ) : (
                            <span>{feature.text}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* === ADD-ON SERVICES HEADING === */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">➕</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2952]">
              Nőgyógyászati vizsgálati díjon felüli árak
            </h2>
          </div>
        </div>

        {/* === SURCHARGE GRID: Sampling, Microbiology, HPV === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Sampling */}
          <div className={`${cardStyles.blue.bg} rounded-3xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🧪</span>
              <h3 className="text-xl font-bold text-[#1e2952]">Mintavételek</h3>
            </div>
            <div className="space-y-3">
              {samplingItems.map((item, idx) => (
                <div
                  key={item._key}
                  className={`flex justify-between items-center py-2 ${
                    idx === samplingItems.length - 1 ? "" : "border-b border-[#1e2952]/10"
                  }`}
                >
                  <span className="text-[#1e2952]">{item.label}</span>
                  <span className="font-bold text-[#1e2952] whitespace-nowrap ml-4">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Microbiology */}
          <div className={`${cardStyles.mint.bg} rounded-3xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🔬</span>
              <h3 className="text-xl font-bold text-[#1e2952]">Mikrobiológiai vizsgálatok</h3>
            </div>
            <div className="space-y-3">
              {microItems.map((item, idx) => (
                <div
                  key={item._key}
                  className={`flex justify-between items-center py-2 ${
                    idx === microItems.length - 1 ? "" : "border-b border-[#1e2952]/10"
                  }`}
                >
                  <div>
                    <span className="text-[#1e2952]">{item.label}</span>
                    {item.suffix ? (
                      <span className="text-[#1e2952]/50 text-sm ml-2">{item.suffix}</span>
                    ) : null}
                  </div>
                  <span className="font-bold text-[#1e2952] whitespace-nowrap ml-4">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* HPV Tests */}
          <div className={`${cardStyles.coral.bg} rounded-3xl p-6 shadow-lg lg:col-span-2`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🧬</span>
              <h3 className="text-xl font-bold text-white">HPV vizsgálatok</h3>
            </div>
            {data.hpvTests?.intro ? (
              <p className="text-white/85 text-sm leading-relaxed mb-5">{data.hpvTests.intro}</p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hpvItems.map((item) => (
                <div key={item._key} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-xl font-bold text-white whitespace-nowrap">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="text-white/70 text-sm">{item.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === OTHER SERVICES === */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2952]">Egyéb szolgáltatások</h2>
          </div>
        </div>

        <div className={`${cardStyles.pink.bg} rounded-3xl p-6 md:p-8 shadow-lg mb-12`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {otherItems.map((item) => (
              <div
                key={item._key}
                className="flex justify-between items-center py-2 border-b border-[#1e2952]/10"
              >
                <span className="text-[#1e2952]">{item.label}</span>
                <span className="font-bold text-[#1e2952] whitespace-nowrap ml-4">
                  {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
          {data.otherServices?.footnote ? (
            <p className="text-[#1e2952]/60 text-sm pt-4">{data.otherServices.footnote}</p>
          ) : null}
        </div>
      </section>

      {/* Important Information */}
      <section className="bg-white py-16 rounded-[40px]">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <SectionHeader
            label="Tudnivalók"
            title="Fontos információk"
            subtitle="Kérjük, olvassa el figyelmesen"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {importantInfo.map((info) => (
              <div key={info.title} className="bg-[#FAF8F3] p-5 rounded-2xl">
                <h3 className="text-base font-bold text-[#1e2952] mb-2">{info.title}</h3>
                <p className="text-[#1e2952]/60 text-sm leading-relaxed">{info.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Hours & CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1e2952] text-white p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6">Rendelési idő</h3>
            <div className="space-y-3">
              {officeHours.map((hour) => (
                <div
                  key={hour.day}
                  className="flex justify-between py-2 border-b border-white/10 last:border-0"
                >
                  <span className="text-blue-200">{hour.day}</span>
                  <span className="font-bold">{hour.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#76c8b6] to-[#5eb8a3] p-8 rounded-3xl flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-[#1e2952] mb-4">Foglaljon időpontot!</h3>
            <p className="text-[#1e2952]/70 mb-6">Online időpontfoglalás pár kattintással.</p>
            <Link
              href="/idopontfoglalas"
              className="inline-flex items-center justify-center bg-[#1e2952] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#1e2952]/90 transition-colors"
            >
              Időpontfoglalás
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
