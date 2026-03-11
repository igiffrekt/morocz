import {
  Phone,
  Mail,
  Clock,
  MapPin,
  Car,
  CreditCard,
  type LucideIcon,
  Info,
} from "lucide-react";
import { sanityFetch } from "@/sanity/lib/fetch";
import { KAPCSOLAT_QUERY } from "@/sanity/lib/queries";
import { CTAButton } from "@/components/ui/CTAButton";
import { AccordionWrapper } from "@/components/ui/AccordionWrapper";
import type { AccordionItemProps } from "@/components/ui/AccordionCard";

export const revalidate = 30;

interface PhoneEntry {
  label: string;
  number: string;
}

interface EmailEntry {
  label: string;
  email: string;
}

interface OfficeHoursEntry {
  day: string;
  hours: string;
}

interface GoodToKnowCard {
  iconName: string;
  title: string;
  description: string;
  colorScheme?: "mint" | "blue" | "pink";
}

interface KapcsolatData {
  heroTitle: string;
  heroDescription: string;
  phoneNumbers: PhoneEntry[];
  emailAddresses: EmailEntry[];
  address: string;
  officeHours: OfficeHoursEntry[];
  goodToKnowCards: GoodToKnowCard[];
  ctaTitle: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
}

const iconMap: Record<string, LucideIcon> = {
  Phone,
  Mail,
  Clock,
  MapPin,
  Car,
  CreditCard,
  Info,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Info;
}

const colorSchemes = {
  mint: { bgColor: "#E3F1EE", iconColor: "#2D5F7E" },
  blue: { bgColor: "#E8EDF5", iconColor: "#6B7B8D" },
  pink: { bgColor: "#F8E2EE", iconColor: "#D4567A" },
};

const hasznos_info_items: AccordionItemProps[] = [
  {
    id: "idopontfoglalas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: "Időpontfoglalás",
    body: "Rendelésre bejelentkezni vagy időpontot egyeztetni kizárólag online lehetséges, az oldal alján található gombra kattintva.\n\nKérjük vegyék figyelembe, hogy lemondani a foglalt időpontot maximum 1 nappal a rendelés előtt lehetséges, az 1 napon belüli lemondásért ügyeleti díjat számolunk fel, melynek összege 10.000,- Ft / alkalom.",
    highlight: "1 napon belüli lemondás: 10.000 Ft",
  },
  {
    id: "surgossegi-ellatas",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
    title: "Sürgősségi ellátás",
    body: "Telefonon csak a rendelési időben vagyunk elérhetőek. Sürgős esetben rendelési időben telefonon, rendelési időn kívül pedig a drmoroczangela@gmail.com email címen vegyék fel velünk a kapcsolatot.",
  },
  {
    id: "gyogyszer-igenyeles",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>,
    title: "Gyógyszer igénylés",
    body: "Rendszeresen szedett fogamzásgátló gyógyszerek igényét az alábbi email címre jelezzék, figyelembe véve, hogy gyógyszert felírni csak a rendelési napokon tudunk.",
    highlight: "gyogyszer@drmoroczangela.hu",
  },
  {
    id: "leletek-beadasa",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    title: "Leletek beadása",
    body: "Leleteket, eredményeket továbbra is a drmoroczangela@gmail.com email címre várjuk.",
    highlight: "drmoroczangela@gmail.com",
  },
  {
    id: "egyeb-kerdesek",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    title: "Egyéb kérdések",
    body: "Időpontfoglalással kapcsolatos, illetve egyéb technikai kérdéseket az alábbi email címre legyenek kedvesek írni.",
    highlight: "recepcio@drmoroczangela.hu",
  },
  {
    id: "telefonszamunk",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
    title: "Telefonszámunk",
    body: "Rendelési időben elérhető telefonszámunk:\n+36 70 639 5239",
    highlight: "Rendelési időben",
  },
  {
    id: "cimunk",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    title: "Címünk",
    body: "2500 Esztergom, Martsa Alajos utca 6/c",
  },
  {
    id: "rendelesi-ido",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    title: "Rendelési idő",
    body: "Hétfő: 12:00 – 15:00\nKedd: 12:00 – 15:00\nCsütörtök: 13:00 – 17:00",
  },
  {
    id: "hasznos-email-cimek",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
    title: "Hasznos email címek",
    body: "Általános kérdések, recepció: recepcio@drmoroczangela.hu\n\nGyógyszer igények: gyogyszer@drmoroczangela.hu\n\nVérvétel: labordiagnosztika@drmoroczangela.hu\n\nSürgősségi: drmoroczangela@gmail.com",
  },
];

const fontos_tudnivalok_items: AccordionItemProps[] = [
  {
    id: "leletek-kuldese",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>,
    title: "Leletek küldése",
    body: "Leletek elektronikus úton történő megküldése és kiértékelése kizárólag előzetes kérésem után történhet. Minden egyéb esetben személyes konzultáció szükséges az eredményekkel.\n\nVárandósgondozást elektronikus úton nem végzek, személyes megjelenés szükséges.",
  },
  {
    id: "diagnozis",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    title: "Diagnózis felállítása",
    body: "Elektronikus úton részletezett panaszok és tünetek, fotók alapján diagnózis felállítani nem tudok. Ilyen esetekben vizsgálat szükséges, kérem jelentkezzen be online vagy a megadott elérhetőségeken egyeztessen velünk időpontot.",
  },
  {
    id: "igazolasok",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" /><polyline points="14 2 14 8 20 8" /><path d="M5 12h9" /><path d="m9 8-4 4 4 4" /></svg>,
    title: "Igazolások kiállítása",
    body: "Elektronikus úton igazolást nem tudunk kiállítani. Időpontfoglalás nélkül, rendelési idő alatt személyes megjelenést követően állítjuk ki a kért igazolásokat.\n\nSzakorvosi igazolás kiállításának díja 10.000 Ft, melyet a recepción tud rendezni.",
    highlight: "10.000 Ft",
  },
  {
    id: "egeszsegpenztar",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
    title: "Egészségpénztár",
    body: "Egészségpénztárakkal nem állok szerződésben, ezért számlát nem tudok kiállítani.",
  },
  {
    id: "intimtorna",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" /><path d="M2 20h20" /><path d="M14 12v.01" /></svg>,
    title: "Intimtorna tanfolyam",
    body: "Csoportos hétvégi tanfolyamok egyéni tornaterv átadásával és 1 hónapig online konzultációs lehetőséggel.",
    highlight: "40.000 Ft",
  },
  {
    id: "magzati-ultrahang",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l1 1 1-1c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z" /><path d="M9 12c-2.8 1-5 4-5 7.5 0 1.4 1.1 2.5 2.5 2.5h11c1.4 0 2.5-1.1 2.5-2.5 0-3.5-2.2-6.5-5-7.5" /><path d="M12 10v4" /></svg>,
    title: "Magzati genetikai ultrahang",
    body: "Magzati genetikai ultrahangot nem végzek.",
    highlight: "Ajánlott: Czeikel Intézet, Budapest",
  },
];

const fallbackData: KapcsolatData = {
  heroTitle: "Kapcsolat",
  heroDescription: "Kérdése van? Keressen minket bizalommal az alábbi elérhetőségek valamelyikén.",
  phoneNumbers: [{ label: "Rendelési időben", number: "+36 70 639 5239" }],
  emailAddresses: [
    { label: "Általános / Recepció", email: "recepcio@drmoroczangela.hu" },
    { label: "Gyógyszer igények", email: "gyogyszer@drmoroczangela.hu" },
    { label: "Vérvétel / Labor", email: "labordiagnosztika@drmoroczangela.hu" },
    { label: "Sürgős eset", email: "drmoroczangela@gmail.com" },
  ],
  address: "2500 Esztergom, Martsa Alajos utca 6/c",
  officeHours: [
    { day: "Hétfő", hours: "12:00 – 15:00" },
    { day: "Kedd", hours: "12:00 – 15:00" },
    { day: "Csütörtök", hours: "13:00 – 17:00" },
  ],
  goodToKnowCards: [
    {
      iconName: "Car",
      title: "Parkolás",
      description: "A klinika előtt és a környező utcákban díjmentes parkolási lehetőség biztosított.",
      colorScheme: "mint",
    },
    {
      iconName: "Clock",
      title: "Érkezés",
      description: "Kérjük, érkezzen 10 perccel az előre egyeztetett időpont előtt az adminisztráció miatt.",
      colorScheme: "blue",
    },
    {
      iconName: "CreditCard",
      title: "Fizetési módok",
      description: "Készpénzes és bankkártyás fizetésre egyaránt van lehetőség, valamint egészségpénztári kártyát is elfogadunk.",
      colorScheme: "pink",
    },
  ],
  ctaTitle: "Foglaljon időpontot még ma",
  ctaButtonText: "Foglaljon időpontot",
  ctaButtonUrl: "/idopontfoglalas",
};

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: "48px" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8B98B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)", fontWeight: 800, color: "#1e2952", lineHeight: 1.2, margin: 0 }}>
          {title}
        </h2>
        <div style={{ width: "40px", height: "4px", background: "#a8d5ba", borderRadius: "9999px", marginTop: "4px" }} />
      </div>
      <p style={{ fontSize: "0.875rem", color: "#8B98B8", maxWidth: "600px", lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  );
}

export default async function KapcsolatPage() {
  let data: KapcsolatData = fallbackData;

  try {
    const result = await sanityFetch<KapcsolatData>({ query: KAPCSOLAT_QUERY });
    if (result) data = result;
  } catch {
    // use fallback
  }

  return (
    <main className="min-h-screen bg-white text-primary">
      {/* Hero */}
      <section
        style={{
          background: "#1e2952",
          borderBottomLeftRadius: "40px",
          borderBottomRightRadius: "40px",
          position: "relative",
          overflow: "hidden",
          paddingTop: "56px",
          paddingBottom: "64px",
          marginTop: "-40px",
          color: "white",
        }}
        className="sm:pb-96 md:pb-32 lg:pb-40 sm:pt-16 md:pt-20"
      >
        <div style={{ position: "absolute", right: "-80px", top: "-80px", width: "384px", height: "384px", background: "#a8d5ba", opacity: 0.05, borderRadius: "9999px", filter: "blur(48px)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "80rem", marginLeft: "auto", marginRight: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 items-center">
            {/* Contact Info */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6">
                {data.heroTitle}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-blue-200 mb-6 md:mb-8 max-w-lg leading-relaxed">
                {data.heroDescription}
              </p>
              <div className="flex flex-col gap-4">
                {data.phoneNumbers.map((p, i) => (
                  <a
                    key={i}
                    href={`tel:${p.number.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 hover:opacity-80 active:bg-white/10 p-2 -ml-2 rounded-lg transition-all"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/10 flex-shrink-0">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                        {p.label}
                      </p>
                      <p className="font-semibold text-sm sm:text-base truncate">{p.number}</p>
                    </div>
                  </a>
                ))}

                {data.emailAddresses.length > 0 && (
                  <a
                    href={`mailto:${data.emailAddresses[0].email}`}
                    className="flex items-center gap-3 hover:opacity-80 active:bg-white/10 p-2 -ml-2 rounded-lg transition-all"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/10 flex-shrink-0">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                        {data.emailAddresses[0].label}
                      </p>
                      <p className="font-semibold text-sm sm:text-base truncate">
                        {data.emailAddresses[0].email}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Image */}
            <div className="hidden md:block">
              <img
                alt="Mórocz Medical klinika"
                className="rounded-3xl sm:rounded-4xl shadow-2xl border-4 border-white/10 w-full h-auto object-cover"
                src="/morocz-medical-kulter.webp"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 sm:-mt-48 md:-mt-20 mb-12 md:mb-24 relative z-20">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {/* Hours Card */}
          <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-3xl sm:rounded-4xl p-6 sm:p-8 shadow-lg flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">Nyitvatartás</h2>
            </div>
            <div className="flex-1">
              {data.officeHours.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600 font-medium text-sm sm:text-base">{h.day}</span>
                  <span className="font-bold text-navy text-sm sm:text-base">{h.hours}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-100">
              <CTAButton text={data.ctaButtonText} href={data.ctaButtonUrl} />
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-3xl sm:rounded-4xl p-6 sm:p-8 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold">Rendelő</h2>
                <p className="text-gray-600 text-sm sm:text-base truncate">{data.address}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Email elérhetőségek</p>
              {data.emailAddresses.map((e, i) => (
                <div key={i} className="text-xs sm:text-sm">
                  <p className="text-gray-600 text-xs uppercase tracking-wide">{e.label}</p>
                  <a href={`mailto:${e.email}`} className="text-primary font-semibold hover:underline break-all">
                    {e.email}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Good to Know */}
      <section className="bg-gradient-to-b from-orange-50 to-white rounded-2xl sm:rounded-3xl lg:rounded-4xl px-4 sm:px-6 py-12 sm:py-16 md:py-24 mx-4 sm:mx-6 mb-12 md:mb-24">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            label="ELŐKÉSZÜLETEK"
            title="Jó tudni érkezés előtt"
            subtitle="Az alábbi információk segítségével megfelelően felkészülhetsz a rendelésre."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.goodToKnowCards.map((card, i) => {
              const Icon = getIcon(card.iconName);
              const scheme = colorSchemes[card.colorScheme || "mint"];
              return (
                <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div style={{ backgroundColor: scheme.bgColor, color: scheme.iconColor }} className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-3 text-navy">{card.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Accordions - Controlled by wrapper for dynamic width */}
      <AccordionWrapper
        leftTitle="Hasznos információk"
        leftSubtitle="Kérjük, az időpontfoglalás előtt olvassa el az alábbi információkat."
        leftLabel="FONTOS TUDNIVALÓ"
        leftItems={hasznos_info_items}
        rightTitle="Fontos tudnivalók"
        rightSubtitle="Válaszok az időpontfoglalás előtt felmerülő gyakori kérdésekre."
        rightLabel="KÉRDÉSEK"
        rightItems={fontos_tudnivalok_items}
      />

      {/* CTA */}
      <section className="bg-navy relative overflow-hidden py-12 sm:py-20 md:py-24">
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "256px", height: "256px", background: "#a8d5ba", opacity: 0.1, borderRadius: "9999px", transform: "translate(-50%, 50%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-6 text-white">
            {data.ctaTitle}
          </h2>
          <p style={{ color: "#1e2952" }} className="text-sm sm:text-base md:text-lg mb-6 md:mb-8 font-medium">
            Foglaljon időpontot az elérhető időpontok közül.
          </p>
          <CTAButton text={data.ctaButtonText} href={data.ctaButtonUrl} />
        </div>
      </section>
    </main>
  );
}
