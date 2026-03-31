import { sanityFetch } from "@/sanity/lib/fetch";
import { KAPCSOLAT_QUERY } from "@/sanity/lib/queries";
import Image from "next/image";

import { Metadata } from "next";
import { AccordionWrapper } from "@/components/ui/AccordionWrapper";

import { SectionHeader } from "@/components/ui/SectionHeader";


export const revalidate = 30;

interface PhoneNumber {
  label: string;
  number: string;
  iconName?: string;
}

interface Email {
  label: string;
  email: string;
  iconName?: string;
  _key?: string;
}

interface OfficeHour {
  day: string;
  hours: string;
}

interface AccordionItem {
  _key?: string;
  title: string;
  body: string;
  iconName?: string;
}

interface GoodToKnowCard {
  _key?: string;
  iconName: string;
  title: string;
  description: string;
  url?: string;
}

interface KapcsolatData {
  // Hero
  heroTitle: string;
  heroDescription: string;
  heroImage?: { asset?: { url: string; alt?: string } };
  phoneNumbers: PhoneNumber[];
  heroEmailAddresses: Email[];
  emailAddresses: Email[];
  address: string;

  // Details
  officeHoursTitle: string;
  officeHoursIconName?: string;
  officeHours: OfficeHour[];
  locationTitle: string;
  locationIconName?: string;
  locationImage?: { asset?: { url: string; alt?: string } };
  locationLat?: number;
  locationLng?: number;

  // Good to know
  goodToKnowLabel: string;
  goodToKnowTitle: string;
  goodToKnowSubtitle: string;
  goodToKnowCards: GoodToKnowCard[];

  // Accordions
  hasznos_label: string;
  hasznos_title: string;
  hasznos_subtitle: string;
  hasznos_items: AccordionItem[];
  fontos_label: string;
  fontos_title: string;
  fontos_subtitle: string;
  fontos_items: AccordionItem[];


}

export const metadata: Metadata = {
  title: "Kapcsolat | Mórocz Medical",
  description: "Lépjen kapcsolatba velünk. Rendelési idő, elérhetőségek, helyszín és további információ.",
};

// Custom SVG icon loader with size option
function getSvgIcon(iconName?: string, size: "sm" | "md" | "lg" = "md", isHero: boolean = false): React.ReactNode {
  if (!iconName) return null;

  const sizes = {
    sm: "w-4 h-4", // 16px
    md: "w-5 h-5 sm:w-6 sm:h-6", // 20-24px
    lg: "w-8 h-8 sm:w-10 sm:h-10", // 32-40px
  };

  // Only apply white filter in hero section, navy blue elsewhere
  const filter = isHero ? `brightness(0) invert(1)` : `brightness(0) saturate(100%) invert(11%) sepia(53%) saturate(1459%) hue-rotate(224deg) brightness(95%)`;

  return (
    <img
      src={`/icons/${iconName}.svg`}
      alt={iconName}
      className={sizes[size]}
      style={{ 
        width: "1em", 
        height: "1em", 
        display: "inline",
        filter
      }}
    />
  );
}

// Smart icon fallback based on title keywords
function getSmartIcon(title: string, iconName?: string, size: "sm" | "md" | "lg" = "md"): React.ReactNode {
  // If custom icon is set, use it
  if (iconName) {
    return getSvgIcon(iconName, size);
  }

  const lowerTitle = title.toLowerCase();

  // Time-related
  if (lowerTitle.includes("idő") || lowerTitle.includes("rendelés")) return getSvgIcon("clock", size);

  // Contact-related
  if (lowerTitle.includes("telefon")) return getSvgIcon("phone", size);
  if (lowerTitle.includes("email") || lowerTitle.includes("cím")) return getSvgIcon("mail", size);
  if (lowerTitle.includes("lakcím") || lowerTitle.includes("címünk")) return getSvgIcon("map-pin", size);

  // Alert/Important
  if (
    lowerTitle.includes("sürgős") ||
    lowerTitle.includes("fontos") ||
    lowerTitle.includes("nem végzek") ||
    lowerTitle.includes("diagnózis")
  ) {
    return getSvgIcon("alert-circle", size);
  }

  // Help/Questions
  if (lowerTitle.includes("kérdés") || lowerTitle.includes("egyéb")) return getSvgIcon("help-circle", size);

  // Default to Info
  return getSvgIcon("info", size);
}

// Fallback data (restored from old version)
const fallbackData: KapcsolatData = {
  heroTitle: "Kapcsolat",
  heroDescription: "Kérdése van? Keressen minket bizalommal az alábbi elérhetőségek valamelyikén.",
  phoneNumbers: [{ label: "Rendelési időben", number: "+36 70 639 5239", iconName: "telefon" }],
  heroEmailAddresses: [
    { label: "Általános", email: "recepcio@drmoroczangela.hu", iconName: "email" },
  ],
  emailAddresses: [
    { label: "Általános / Recepció", email: "recepcio@drmoroczangela.hu", iconName: "email" },
    { label: "Gyógyszer igények", email: "gyogyszer@drmoroczangela.hu", iconName: "email" },
    { label: "Vérvétel / Labor", email: "labordiagnosztika@drmoroczangela.hu", iconName: "email" },
    { label: "Sürgős eset", email: "drmoroczangela@gmail.com", iconName: "surgos" },
  ],
  address: "2500 Esztergom, Martsa Alajos utca 6/c",
  officeHoursTitle: "Rendelési idő",
  officeHoursIconName: "ora",
  officeHours: [
    { day: "Hétfő", hours: "12:00 – 15:00" },
    { day: "Kedd", hours: "12:00 – 15:00" },
    { day: "Csütörtök", hours: "13:00 – 17:00" },
  ],
  locationTitle: "Rendelő",
  locationIconName: "terkep",
  locationLat: 47.787,
  locationLng: 18.7344,
  goodToKnowLabel: "Hasznos",
  goodToKnowTitle: "Jó tudni érkezés előtt",
  goodToKnowSubtitle: "Segítünk, hogy stresszmentes legyen a vizit",
  goodToKnowCards: [
    {
      iconName: "Car",
      title: "Parkolás",
      description: "A klinika előtt és a környező utcákban díjmentes parkolási lehetőség biztosított.",
    },
    {
      iconName: "Clock",
      title: "Érkezés",
      description: "Kérjük, érkezzen 10 perccel az előre egyeztetett időpont előtt az adminisztráció miatt.",
    },
    {
      iconName: "CreditCard",
      title: "Fizetési módok",
      description: "Készpénzes és bankkártyás fizetésre egyaránt van lehetőség.",
    },
  ],
  hasznos_label: "Tudnivalók",
  hasznos_title: "Hasznos információk",
  hasznos_subtitle: "Válaszok az Ön legfontosabb kérdéseire",
  hasznos_items: [
    {
      _key: "hasznos-1",
      title: "Időpontfoglalás",
      body: "Rendelésre bejelentkezni vagy időpontot egyeztetni kizárólag online lehetséges, az oldal alján található gombra kattintva.\n\nKérjük vegyék figyelembe, hogy lemondani a foglalt időpontot maximum 1 nappal a rendelés előtt lehetséges.",
      iconName: "Clock",
    },
    {
      _key: "hasznos-2",
      title: "Sürgősségi ellátás",
      body: "Telefonon csak a rendelési időben vagyunk elérhetőek. Sürgős esetben rendelési időben telefonon, rendelési időn kívül pedig email-en vegyék fel velünk a kapcsolatot.",
      iconName: "AlertCircle",
    },
    {
      _key: "hasznos-3",
      title: "Gyógyszer igénylés",
      body: "Rendszeresen szedett fogamzásgátló gyógyszerek igényét az alábbi email címre jelezzék.",
      iconName: "Info",
    },
    {
      _key: "hasznos-4",
      title: "Leletek beadása",
      body: "Leleteket, eredményeket a drmoroczangela@gmail.com email címre várjuk.",
      iconName: "Info",
    },
    {
      _key: "hasznos-5",
      title: "Egyéb kérdések",
      body: "Időpontfoglalással kapcsolatos kérdéseket az alábbi email címre legyenek kedvesek írni.",
      iconName: "HelpCircle",
    },
    {
      _key: "hasznos-6",
      title: "Telefonszámunk",
      body: "Rendelési időben elérhető telefonszámunk:\n+36 70 639 5239",
      iconName: "Phone",
    },
    {
      _key: "hasznos-7",
      title: "Címünk",
      body: "2500 Esztergom, Martsa Alajos utca 6/c",
      iconName: "MapPin",
    },
    {
      _key: "hasznos-8",
      title: "Rendelési idő",
      body: "Hétfő: 12:00 – 15:00\nKedd: 12:00 – 15:00\nCsütörtök: 13:00 – 17:00",
      iconName: "Clock",
    },
    {
      _key: "hasznos-9",
      title: "Hasznos email címek",
      body: "Általános: recepcio@drmoroczangela.hu\nGyógyszer: gyogyszer@drmoroczangela.hu\nVérvétel: labordiagnosztika@drmoroczangela.hu\nSürgős: drmoroczangela@gmail.com",
      iconName: "Mail",
    },
  ],
  fontos_label: "Fontos",
  fontos_title: "Fontos tudnivalók",
  fontos_subtitle: "Biztonság és komfort az ellátás során",
  fontos_items: [
    {
      _key: "fontos-1",
      title: "Leletek küldése",
      body: "Leletek elektronikus úton történő megküldése kizárólag előzetes kérésem után történhet. Személyes konzultáció szükséges.",
      iconName: "AlertCircle",
    },
    {
      _key: "fontos-2",
      title: "Diagnózis felállítása",
      body: "Elektronikus úton diagnózis felállítani nem tudok. Vizsgálat szükséges.",
      iconName: "Info",
    },
    {
      _key: "fontos-3",
      title: "Igazolások kiállítása",
      body: "Szakorvosi igazolás kiállításának díja 10.000 Ft.",
      iconName: "Info",
    },
    {
      _key: "fontos-4",
      title: "Egészségpénztár",
      body: "Egészségpénztárakkal nem állok szerződésben.",
      iconName: "AlertCircle",
    },
    {
      _key: "fontos-5",
      title: "Intimtorna tanfolyam",
      body: "Csoportos hétvégi tanfolyamok. Díj: 40.000 Ft",
      iconName: "Info",
    },
    {
      _key: "fontos-6",
      title: "Magzati genetikai ultrahang",
      body: "Magzati genetikai ultrahangot nem végzek.",
      iconName: "AlertCircle",
    },
  ],
};

export default async function KapcsolatPage() {
  let data: KapcsolatData = fallbackData;

  try {
    const result = await sanityFetch<KapcsolatData>({
      query: KAPCSOLAT_QUERY,
    });
    if (result) {
      data = result;
      console.log("✓ Sanity data fetched:", {
        heroImageUrl: data.heroImage?.asset?.url,
        heroImageAlt: data.heroImage?.asset?.alt,
      });
    }
  } catch (_err) {
    console.error("✗ Sanity fetch error:", _err);
  }

  // Convert accordion items to AccordionCard format with smart icon fallback
  const hasznos_converted = data.hasznos_items.map((item, idx) => ({
    id: `hasznos-${idx}`,
    icon: getSmartIcon(item.title, item.iconName),
    title: item.title,
    body: item.body,
  }));

  const fontos_converted = data.fontos_items.map((item, idx) => ({
    id: `fontos-${idx}`,
    icon: getSmartIcon(item.title, item.iconName),
    title: item.title,
    body: item.body,
  }));

  return (
    <main className="min-h-screen bg-white text-primary">
      {/* ──────────────────────────────────── HERO ──────────────────────────────────── */}
      <section
        style={{
          background: "#1e2952",
          borderBottomLeftRadius: "40px",
          borderBottomRightRadius: "40px",
          position: "relative",
          overflow: "hidden",
          paddingTop: "80px",
          paddingBottom: "100px",
          marginTop: "-40px",
          color: "white",
        }}
        className="sm:pb-96 md:pb-32 lg:pb-40"
      >
        {/* Decorative blob (restored) */}
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "-80px",
            width: "384px",
            height: "384px",
            background: "#a8d5ba",
            opacity: 0.05,
            borderRadius: "9999px",
            filter: "blur(48px)",
          }}
        />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "95rem", marginLeft: "auto", marginRight: "auto", paddingLeft: "3rem", paddingRight: "3rem" }}>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 items-center">
            {/* Contact Info */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6">
                {data.heroTitle}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-blue-200 mb-6 md:mb-8 max-w-lg leading-relaxed">
                {data.heroDescription}
              </p>

              {/* All Phone Numbers */}
              {data.phoneNumbers?.map((phone, idx) => (
                <a
                  key={idx}
                  href={`tel:${phone.number.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 hover:opacity-80 active:bg-white/10 p-2 -ml-2 rounded-lg transition-all mb-4"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/10 flex-shrink-0">
                    {getSvgIcon(phone.iconName || "telefon", "md", true)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wide">{phone.label}</p>
                    <p className="font-semibold text-sm sm:text-base truncate text-white">{phone.number}</p>
                  </div>
                </a>
              ))}

              {/* Hero Email Addresses */}
              {data.heroEmailAddresses?.map((email, idx) => (
                <a
                  key={idx}
                  href={`mailto:${email.email}`}
                  className="flex items-center gap-3 hover:opacity-80 active:bg-white/10 p-2 -ml-2 rounded-lg transition-all mb-4"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/10 flex-shrink-0">
                    {getSvgIcon(email.iconName || "email", "md", true)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-200 uppercase tracking-wide">{email.label}</p>
                    <p className="font-semibold text-sm sm:text-base truncate text-white">{email.email}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Hero Image */}
            {data.heroImage?.asset?.url && (
              <div className="hidden md:block relative h-[300px] sm:h-[400px] md:h-[500px] rounded-[40px] shadow-2xl border-4 border-white/10 overflow-hidden">
                <Image
                  src={data.heroImage.asset.url}
                  alt={data.heroImage.asset.alt || "Rendelő"}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────── DETAILS (GLASS CARDS) ──────────────────────────────────── */}
      <section style={{ maxWidth: "95rem", paddingLeft: "3rem", paddingRight: "3rem" }} className="mx-auto -mt-16 relative z-10 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Office Hours Card */}
          <div
            className="p-6 sm:p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow flex flex-col"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold text-[#1e2952] mb-6 flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">{getSvgIcon(data.officeHoursIconName || "ora", "md", false)}</div>
              {data.officeHoursTitle}
            </h3>
            <div className="mb-auto">
              {data.officeHours?.map((hour, idx) => (
                <div key={idx}>
                  <div className="flex justify-between py-3 text-gray-700">
                    <span className="font-medium">{hour.day}</span>
                    <span className="font-bold text-[#1e2952]">{hour.hours}</span>
                  </div>
                  {idx < (data.officeHours?.length || 0) - 1 && (
                    <div className="border-b border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location Card */}
          <div
            className="p-6 sm:p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold text-[#1e2952] mb-6 flex items-center gap-3 relative z-10">
              <div className="w-6 h-6 flex items-center justify-center">{getSvgIcon(data.locationIconName || "terkep", "md", false)}</div>
              {data.locationTitle}
            </h3>

            {data.locationImage?.asset?.url && (
              <Image
                src={data.locationImage.asset.url}
                alt={data.locationImage.asset.alt || "Helyszín"}
                width={400}
                height={300}
                className="w-full h-48 object-cover rounded-2xl mb-4"
              />
            )}

            <p className="text-gray-700 font-medium relative z-10 mb-4">{data.address}</p>

            {/* Email Addresses */}
            {data.emailAddresses?.length > 0 && (
              <div className="space-y-3 relative z-10">
                {data.emailAddresses.map((email, idx) => (
                  <a
                    key={idx}
                    href={`mailto:${email.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/50 to-white/30 hover:from-white hover:to-white/80 border border-gray-200 hover:border-[#a8d5ba] transition-all group"
                  >
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 transition-colors">
                      {getSvgIcon(email.iconName || "email", "sm", false)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide group-hover:text-[#1e2952] transition-colors">{email.label}</p>
                      <p className="text-sm font-medium text-gray-700 truncate group-hover:text-[#1e2952] transition-colors">{email.email}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────── JÓ TUDNI ──────────────────────────────────── */}
      <section className="mb-32" style={{ background: "#FAF8F3", borderRadius: "24px", paddingTop: "64px", paddingBottom: "64px", marginTop: "32px", paddingLeft: "3rem", paddingRight: "3rem" }}>
        <div style={{ maxWidth: "95rem" }} className="mx-auto">
          <SectionHeader
            label={data.goodToKnowLabel}
            title={data.goodToKnowTitle}
            subtitle={data.goodToKnowSubtitle}
          />

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.goodToKnowCards?.map((card, idx) => {
              const CardComponent = card.url ? "a" : "div";
              const cardProps = card.url
                ? {
                    href: card.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : {};

              return (
                <CardComponent
                  key={idx}
                  className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
                  {...cardProps}
                >
                  <div className="text-[#a8d5ba] mb-4 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    {getSmartIcon(card.title, card.iconName, "lg")}
                  </div>
                  <h3 className="text-lg font-bold text-[#1e2952] mb-3">{card.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
                </CardComponent>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────── ACCORDIONS (TWIN 50-50) ──────────────────────────────────── */}
      <AccordionWrapper
        leftLabel={data.hasznos_label}
        leftTitle={data.hasznos_title}
        leftSubtitle={data.hasznos_subtitle}
        leftItems={hasznos_converted}
        rightLabel={data.fontos_label}
        rightTitle={data.fontos_title}
        rightSubtitle={data.fontos_subtitle}
        rightItems={fontos_converted}
      />

    </main>
  );
}
