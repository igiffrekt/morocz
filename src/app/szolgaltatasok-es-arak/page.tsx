import { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Szolgáltatások és Árak | Mórocz Medical",
  description: "Nőgyógyászati szolgáltatások és árak. Vizsgálatok, várandósgondozás, laborvizsgálatok - teljes árlista 2026.",
};

// Card gradient styles matching homepage
const cardStyles = {
  navy: {
    bg: "bg-gradient-to-br from-[#2B3674] to-[#1a2550]",
    text: "text-white",
    subtext: "text-white/70",
    price: "text-white",
    badge: "bg-white/20 text-white",
    border: "border-white/10",
  },
  mint: {
    bg: "bg-gradient-to-br from-[#76c8b6] to-[#5eb8a3]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/70",
    price: "text-[#1e2952]",
    badge: "bg-white/50 text-[#1e2952]",
    border: "border-[#1e2952]/10",
  },
  pink: {
    bg: "bg-gradient-to-br from-[#E8D5E0] to-[#d4bfcc]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/70",
    price: "text-[#1e2952]",
    badge: "bg-white/60 text-[#1e2952]",
    border: "border-[#1e2952]/10",
  },
  blue: {
    bg: "bg-gradient-to-br from-[#D4E5ED] to-[#b8d1de]",
    text: "text-[#1e2952]",
    subtext: "text-[#1e2952]/70",
    price: "text-[#1e2952]",
    badge: "bg-white/60 text-[#1e2952]",
    border: "border-[#1e2952]/10",
  },
  coral: {
    bg: "bg-gradient-to-br from-[#f0a88c] to-[#e8927a]",
    text: "text-white",
    subtext: "text-white/80",
    price: "text-white",
    badge: "bg-white/30 text-white",
    border: "border-white/20",
  },
};

// Important information
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
    content: "Eredményeik az EESZT rendszerbe kerülnek feltöltésre, melyet lakossági portáljukon belépve tekinthetnek meg.",
  },
  {
    title: "Magzati genetikai ultrahang",
    content: "Magzati genetikai ultrahangot nem végzek. Ajánlott intézmény: Czeizel Intézet Budapest.",
  },
];

const officeHours = [
  { day: "Hétfő", hours: "12:00-15:00" },
  { day: "Kedd", hours: "12:00-15:00" },
  { day: "Csütörtök", hours: "13:00-17:00" },
];

// Price formatter
const formatPrice = (price: number) => price.toLocaleString("hu-HU") + " Ft";

export default function SzolgaltatasokEsArakPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F3] text-primary">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e2952] to-[#2B3674] rounded-b-[40px] relative overflow-hidden pt-28 pb-16 -mt-10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#a8d5ba] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#E8D5E0] opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#a8d5ba]/20 text-[#a8d5ba] text-sm font-bold uppercase tracking-wider mb-6">
            Érvényes 2026. április 1-től
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Szolgáltatások és Árak
          </h1>
          <p className="text-base text-[#a8d5ba] font-medium mb-4">
            Az árváltoztatás jogát fenntartjuk.
          </p>
          <p className="text-base text-blue-200/80 max-w-3xl leading-relaxed">
            A vizsgálat során szakmailag indokolttá válhatnak további vizsgálatok, mintavételek, amelyek többletköltséggel járhatnak. Ezek elvégzése a páciens előzetes tájékoztatásával és beleegyezésével történnek.
          </p>
        </div>
      </section>

      {/* Main Services Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">

        {/* === GYNECOLOGICAL EXAMS - Tiered Layout === */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👩‍⚕️</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2952]">Nőgyógyászati vizsgálatok</h2>
          </div>

          <div className={`${cardStyles.navy.bg} rounded-3xl p-6 md:p-8 shadow-xl`}>
            {/* Exam Tier Group */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#a8d5ba]" />
                <span className="text-sm font-bold text-[#a8d5ba] uppercase tracking-wide">Alapvizsgálat</span>
              </div>

              {/* Base + Upgrade visual grouping */}
              <div className="relative pl-4 border-l-2 border-[#a8d5ba]/30">
                {/* Base exam */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">Vizsgálat / tanácsadás</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">ultrahang nélkül</span>
                  </div>
                  <span className="text-xl font-bold text-white mt-2 md:mt-0">30.000 Ft</span>
                </div>

                {/* Upgrade indicator */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-white/10 bg-white/5 -mx-4 px-4 md:-mx-0 md:px-0 md:bg-transparent">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-[#a8d5ba] text-[#1e2952] text-xs font-bold">+ UH</span>
                    <span className="text-white font-medium">Vizsgálat ultrahanggal</span>
                  </div>
                  <span className="text-xl font-bold text-[#a8d5ba] mt-2 md:mt-0">43.000 Ft</span>
                </div>

                {/* Follow-up */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-white/20 text-white text-xs font-bold">-27%</span>
                    <span className="text-white font-medium">Kontroll vizsgálat</span>
                    <span className="text-white/50 text-sm">(3 hónapon belül)</span>
                  </div>
                  <span className="text-xl font-bold text-white mt-2 md:mt-0">22.000 Ft</span>
                </div>
              </div>
            </div>

            {/* Spiral Services Group */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#E8D5E0]" />
                <span className="text-sm font-bold text-[#E8D5E0] uppercase tracking-wide">Spirál szolgáltatások</span>
              </div>

              <div className="relative pl-4 border-l-2 border-[#E8D5E0]/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-white font-medium">Spirál felhelyezés / csere</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">ultrahanggal</span>
                  </div>
                  <span className="text-xl font-bold text-white mt-2 md:mt-0">43.000 Ft</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between py-3">
                  <span className="text-white font-medium">Spirál eltávolítás</span>
                  <span className="text-xl font-bold text-white mt-2 md:mt-0">30.000 Ft</span>
                </div>
                <p className="text-white/50 text-sm mt-2">Az eszköz árát nem tartalmazza</p>
              </div>
            </div>

            {/* Pregnancy Care - Highlighted */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🤰</span>
                  <div>
                    <span className="text-white font-bold text-lg">Várandósgondozás</span>
                    <p className="text-white/60 text-sm">Tájékozódó ultrahanggal (nem genetikai)</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[#a8d5ba] mt-3 md:mt-0">42.000 Ft</span>
              </div>
            </div>
          </div>
        </div>

        {/* === SCREENING PACKAGES - Comparison Table === */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🩺</span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2952]">Éves Szűrőcsomagok</h2>
            <span className="px-3 py-1 rounded-full bg-[#a8d5ba]/20 text-[#1e2952] text-sm font-medium">Évente 1x igénybe vehető</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alap */}
            <div className={`${cardStyles.blue.bg} rounded-3xl p-6 shadow-lg`}>
              <div className="text-center mb-6">
                <span className="text-sm font-bold text-[#1e2952]/60 uppercase tracking-wide">Alap</span>
                <div className="text-4xl font-black text-[#1e2952] mt-2">52.000 <span className="text-lg">Ft</span></div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#76c8b6]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Nőgyógyászati vizsgálat
                </li>
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#76c8b6]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Ultrahang
                </li>
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#76c8b6]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  LBC méhnyakszűrés
                </li>
                <li className="flex items-center gap-2 text-[#1e2952]/40">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  HPV DNS tipizálás
                </li>
              </ul>
            </div>

            {/* Komplex - Recommended */}
            <div className={`${cardStyles.mint.bg} rounded-3xl p-6 shadow-xl relative transform md:scale-105 z-10`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-[#1e2952] text-white text-xs font-bold uppercase">Ajánlott</span>
              </div>
              <div className="text-center mb-6">
                <span className="text-sm font-bold text-[#1e2952]/60 uppercase tracking-wide">Komplex</span>
                <div className="text-4xl font-black text-[#1e2952] mt-2">64.000 <span className="text-lg">Ft</span></div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#1e2952]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Nőgyógyászati vizsgálat
                </li>
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#1e2952]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Ultrahang
                </li>
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#1e2952]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  LBC méhnyakszűrés
                </li>
                <li className="flex items-center gap-2 text-[#1e2952] font-medium">
                  <svg className="w-5 h-5 text-[#1e2952]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  HPV DNS tipizálás (21 típus)
                </li>
              </ul>
            </div>

            {/* Prémium */}
            <div className={`${cardStyles.pink.bg} rounded-3xl p-6 shadow-lg`}>
              <div className="text-center mb-6">
                <span className="text-sm font-bold text-[#1e2952]/60 uppercase tracking-wide">Prémium</span>
                <div className="text-4xl font-black text-[#1e2952] mt-2">74.000 <span className="text-lg">Ft</span></div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-[#1e2952]">
                  <svg className="w-5 h-5 text-[#76c8b6]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Minden a Komplexből +
                </li>
                <li className="flex items-center gap-2 text-[#1e2952] font-medium">
                  <svg className="w-5 h-5 text-[#76c8b6]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Aptima mRNS HPV
                </li>
                <li className="flex items-center gap-2 text-[#1e2952] font-medium">
                  <svg className="w-5 h-5 text-[#76c8b6]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Hüvelyváladék tenyésztés
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* === TWO COLUMN GRID for remaining services === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">

          {/* HPV Tests - Side by side comparison */}
          <div className={`${cardStyles.coral.bg} rounded-3xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🧬</span>
              <h3 className="text-xl font-bold text-white">HPV vizsgálatok</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white">DNS alapú vizsgálat</span>
                  <span className="text-xl font-bold text-white">18.000 Ft</span>
                </div>
                <p className="text-white/70 text-sm">21 genotípus - HPV jelenlétét vizsgálja</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white">Aptima mRNS alapú</span>
                  <span className="text-xl font-bold text-white">16.000 Ft</span>
                </div>
                <p className="text-white/70 text-sm">Magas kockázatú típusok aktivitását méri</p>
              </div>
            </div>
          </div>

          {/* Microbiology */}
          <div className={`${cardStyles.mint.bg} rounded-3xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🔬</span>
              <h3 className="text-xl font-bold text-[#1e2952]">Mikrobiológiai vizsgálatok</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#1e2952]/10">
                <span className="text-[#1e2952]">Hüvelyváladék tenyésztés + kenet</span>
                <span className="font-bold text-[#1e2952]">8.500 Ft</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1e2952]/10">
                <div>
                  <span className="text-[#1e2952]">STD vizsgálat</span>
                  <span className="text-[#1e2952]/50 text-sm ml-2">/kórokozó</span>
                </div>
                <span className="font-bold text-[#1e2952]">7.500 Ft</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#1e2952]">GBS szűrés</span>
                <span className="font-bold text-[#1e2952]">7.500 Ft</span>
              </div>
            </div>
          </div>

          {/* Sampling / Add-ons */}
          <div className={`${cardStyles.blue.bg} rounded-3xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🧪</span>
              <h3 className="text-xl font-bold text-[#1e2952]">Mintavételek</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#1e2952]/10 text-[#1e2952]/60 text-xs font-medium">Felárak</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#1e2952]/10">
                <div>
                  <span className="text-[#1e2952]">LBC méhnyakszűrés</span>
                  <p className="text-[#1e2952]/50 text-xs">Korszerűbb módszer</p>
                </div>
                <span className="font-bold text-[#1e2952]">11.500 Ft</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1e2952]/10">
                <span className="text-[#1e2952]">Endometrium szövettani mintavétel</span>
                <span className="font-bold text-[#1e2952]">22.000 Ft</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#1e2952]">Injekció beadása</span>
                <span className="font-bold text-[#1e2952]">6.000 Ft</span>
              </div>
            </div>
          </div>

          {/* Other Services */}
          <div className={`${cardStyles.pink.bg} rounded-3xl p-6 shadow-lg`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">📋</span>
              <h3 className="text-xl font-bold text-[#1e2952]">Egyéb szolgáltatások</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#1e2952]/10">
                <span className="text-[#1e2952]">Szakorvosi dokumentáció</span>
                <span className="font-bold text-[#1e2952]">12.000 Ft</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1e2952]/10">
                <span className="text-[#1e2952]">Sürgősségi fogamzásgátlás</span>
                <span className="font-bold text-[#1e2952]">12.000 Ft</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#1e2952]">Receptírás</span>
                <span className="font-bold text-[#1e2952]">6.000 Ft</span>
              </div>
              <p className="text-[#1e2952]/50 text-sm pt-2">Receptírás vizsgálat alkalmával díjtalan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Information */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <SectionHeader
            label="Tudnivalók"
            title="Fontos információk"
            subtitle="Kérjük, olvassa el figyelmesen"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {importantInfo.map((info, idx) => (
              <div
                key={idx}
                className="bg-[#FAF8F3] p-5 rounded-2xl"
              >
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
              {officeHours.map((hour, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-white/10 last:border-0">
                  <span className="text-blue-200">{hour.day}</span>
                  <span className="font-bold">{hour.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#76c8b6] to-[#5eb8a3] p-8 rounded-3xl flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-[#1e2952] mb-4">
              Foglaljon időpontot!
            </h3>
            <p className="text-[#1e2952]/70 mb-6">
              Online időpontfoglalás pár kattintással.
            </p>
            <Link
              href="/idopontfoglalas"
              className="inline-flex items-center justify-center bg-[#1e2952] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#1e2952]/90 transition-colors"
            >
              Időpontfoglalás
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
