import { sanityFetch } from "@/sanity/lib/fetch";
import { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Szolgáltatások és Árak | Mórocz Medical",
  description: "Nőgyógyászati szolgáltatások és árak. Vizsgálatok, várandósgondozás, laborvizsgálatok - teljes árlista 2026.",
};

interface ServiceCategory {
  _id: string;
  name: string;
  emoji: string;
  order: number;
}

interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: ServiceCategory;
  order: number;
}

interface BundleService {
  name: string;
  price: number;
  note?: string;
}

interface ServiceBundle {
  title: string;
  services: BundleService[];
  totalNote?: string;
  note?: string;
  icon: string;
}

const SERVICES_QUERY = `{
  "categories": *[_type == "serviceCategory"] | order(order asc) {
    _id,
    name,
    emoji,
    order
  },
  "services": *[_type == "service"] | order(order asc) {
    _id,
    name,
    description,
    price,
    category->{
      _id,
      name,
      emoji,
      order
    },
    order
  }
}`;

// Service bundles - related services shown together
const serviceBundles: ServiceBundle[] = [
  {
    title: "Nőgyógyászati vizsgálat",
    services: [
      { name: "Vizsgálat/tanácsadás ultrahang nélkül", price: 30000 },
      { name: "Ultrahang felár", price: 13000, note: "opcionális" },
    ],
    totalNote: "Vizsgálat + UH: 43.000 Ft",
    icon: "🩺",
  },
  {
    title: "Kontroll vizsgálat",
    services: [
      { name: "Kontroll 3 hónapon belül", price: 22000 },
    ],
    note: "Kedvezményes ár visszatérő pácienseknek",
    icon: "🔄",
  },
  {
    title: "Várandósgondozás",
    services: [
      { name: "Várandósgondozás", price: 45000 },
    ],
    note: "Teljes körű gondozás ultrahangos vizsgálattal",
    icon: "🤰",
  },
  {
    title: "Spirál szolgáltatások",
    services: [
      { name: "Spirál felhelyezés/csere + UH", price: 43000 },
      { name: "Spirál levétel ultrahang nélkül", price: 30000 },
    ],
    note: "Az eszköz árát nem tartalmazza",
    icon: "💊",
  },
  {
    title: "Méhnyakszűrés",
    services: [
      { name: "Folyadék alapú mintavétel", price: 11500 },
      { name: "Hagyományos citológia", price: 6500 },
    ],
    icon: "🔬",
  },
  {
    title: "HPV vizsgálatok",
    services: [
      { name: "HPV21 tipizálás (21 genotípus)", price: 18000 },
      { name: "HPV15 tipizálás", price: 14000 },
      { name: "Aptima mRNS alapú tipizálás", price: 16000 },
    ],
    icon: "🧬",
  },
  {
    title: "Laborvizsgálatok",
    services: [
      { name: "Hüvelyváladék tenyésztés + kenet", price: 8500 },
      { name: "STD vizsgálat", price: 7500, note: "/kórokozó" },
      { name: "Vérvételi díj", price: 3500 },
    ],
    icon: "🧪",
  },
  {
    title: "Egyéb szolgáltatások",
    services: [
      { name: "Szövettani mintavétel", price: 20000 },
      { name: "Injekció beadása", price: 6000 },
      { name: "Sürgősségi fogamzásgátlás", price: 15000 },
    ],
    icon: "💉",
  },
  {
    title: "Adminisztráció",
    services: [
      { name: "Szakorvosi dokumentáció kiállítása vizsgálaton kívül", price: 10000 },
    ],
    note: "Recept felírása vizsgálat alkalmával díjtalan",
    icon: "📋",
  },
];

// Important information from the price list
const importantInfo = [
  {
    title: "E-recept",
    content: "Rendszeresen szedett fogamzásgátló gyógyszer felírása E-recept formájában ingyenes, amennyiben 1 éven belüli méhnyakszűrés történt rendelőnkben. Recept felírása vizsgálat alkalmával díjtalan.",
  },
  {
    title: "Vizsgálati díjak",
    content: "A vizsgálati díjak tartalmazzák a mintakezelési, leletkezelési és adminisztrációs költséget is.",
  },
  {
    title: "Eredmények",
    content: "Eredményeik az EESZT rendszerbe kerülnek feltöltésre, melyet lakossági portáljukon belépve tekinthetnek meg. Bejelentkezéskor megadott elérhetőségein CSAK abban az esetben keressük Önt, ha további teendő merül fel az eredménye birtokában.",
  },
  {
    title: "Magzati genetikai ultrahang",
    content: "Magzati genetikai ultrahangot nem végzek. Ajánlott intézmény: Czeizel Intézet Budapest.",
  },
  {
    title: "Ultrahang vizsgálatok",
    content: "Rendelésemen végzett ultrahangos vizsgálatok tájékozódó, kiegészítő ultrahangos vizsgálatnak minősülnek és nem diagnosztikus értékűek, továbbá licencvizsgával rendelkező szakember vizsgálatát nem helyettesítik. Célja az általános állapot felmérése és annak eldöntése, hogy indokolt-e további, részletes ultrahangvizsgálat.",
  },
];

const officeHours = [
  { day: "Hétfő", hours: "12:00-15:00" },
  { day: "Kedd", hours: "12:00-15:00" },
  { day: "Csütörtök", hours: "13:00-17:00" },
];

export default async function SzolgaltatasokEsArakPage() {
  const data = await sanityFetch<{
    categories: ServiceCategory[];
    services: Service[];
  }>({ query: SERVICES_QUERY });

  const { categories, services } = data;

  // Group services by category
  const servicesByCategory = categories.map((cat) => ({
    ...cat,
    services: services.filter((s) => s.category?._id === cat._id),
  }));

  return (
    <main className="min-h-screen bg-white text-primary">
      {/* Hero Section */}
      <section
        style={{
          background: "#1e2952",
          borderBottomLeftRadius: "40px",
          borderBottomRightRadius: "40px",
          position: "relative",
          overflow: "hidden",
          paddingTop: "120px",
          paddingBottom: "80px",
          marginTop: "-40px",
          color: "white",
        }}
      >
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

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          <p className="text-sm font-bold text-[#a8d5ba] uppercase tracking-wider mb-4">
            Árlista 2026.04.01.
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            Szolgáltatások és Árak
          </h1>
          <div className="text-base md:text-lg text-blue-200 max-w-3xl leading-relaxed space-y-4">
            <p>A vizsgálati díjak tartalmazzák a mintakezelési, leletkezelési és adminisztrációs költséget is. Eredményeik az EESZT rendszerbe kerülnek feltöltésre, melyet lakossági portáljukon belépve tekinthetnek meg.</p>
            <p>Bejelentkezéskor megadott elérhetőségein CSAK abban az esetben keressük Önt, ha további teendő merül fel az eredménye birtokában.</p>
            <p>Kérdés esetén írjon nekünk elérhetőségeink egyikén.</p>
          </div>
        </div>
      </section>

      {/* Services as Cards - 2 Column Layout */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceBundles.map((bundle, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{bundle.icon}</span>
                <h2 className="text-xl font-bold text-[#1e2952]">{bundle.title}</h2>
              </div>

              <div className="space-y-3">
                {bundle.services.map((service, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{service.name}</span>
                      {service.note && (
                        <span className="text-xs text-gray-400">({service.note})</span>
                      )}
                    </div>
                    <span className="font-bold text-[#1e2952] whitespace-nowrap">
                      {service.price.toLocaleString("hu-HU")} Ft
                    </span>
                  </div>
                ))}
              </div>

              {(bundle.totalNote || bundle.note) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {bundle.totalNote && (
                    <p className="text-sm font-bold text-[#a8d5ba]">{bundle.totalNote}</p>
                  )}
                  {bundle.note && (
                    <p className="text-sm text-gray-500">{bundle.note}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Important Information */}
      <section
        className="py-16"
        style={{ background: "#FAF8F3" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <SectionHeader
            label="Tudnivalók"
            title="Fontos információk"
            subtitle="Kérjük, olvassa el figyelmesen"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {importantInfo.map((info, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold text-[#1e2952] mb-3">{info.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{info.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Hours & CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Office Hours */}
          <div className="bg-[#1e2952] text-white p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6">Rendelési idő - dr. Mórocz Angéla</h3>
            <div className="space-y-3">
              {officeHours.map((hour, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-white/20 last:border-0">
                  <span className="text-blue-200">{hour.day}</span>
                  <span className="font-bold">{hour.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-[#a8d5ba] p-8 rounded-3xl flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-[#1e2952] mb-4">
              Foglaljon időpontot online!
            </h3>
            <p className="text-[#1e2952]/80 mb-6">
              Rendelésre bejelentkezni kizárólag online lehetséges.
            </p>
            <Link
              href="/idopontfoglalas"
              className="inline-flex items-center justify-center bg-[#1e2952] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#1e2952]/90 transition-colors"
            >
              Időpontfoglalás
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
