import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Várandósgondozás Esztergomban",
  description:
    "Teljes körű várandósgondozás és terhesgondozás Esztergomban. Ultrahangvizsgálat, szűrések, trimeszterenkénti kontroll. Dr. Mórocz Angéla nőgyógyász.",
  keywords: [
    "várandósgondozás Esztergom",
    "terhesgondozás",
    "terhesség ultrahang",
    "magzati ultrahang",
    "genetikai szűrés terhesség",
    "várandós gondozás",
  ],
  openGraph: {
    type: "website",
    title: "Várandósgondozás Esztergomban — Dr. Mórocz Angéla",
    description:
      "Teljes körű várandósgondozás: ultrahang, szűrések, trimeszterenkénti kontroll. Foglaljon időpontot.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/varandosgondozas",
  },
};

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Milyen gyakran kell kontrollra járni terhesség alatt?",
    answer:
      "Az első trimeszterben általában havonta egyszer, a második trimeszterben 3-4 hetente, a harmadik trimeszterben pedig 2 hetente, a 36. héttől hetente javasolt a kontrollvizsgálat. Ha a terhesség kockázati besorolása magasabb, az orvos sűrűbb ellenőrzést javasolhat.",
  },
  {
    question: "Mikor lehet először ultrahangon látni a babát?",
    answer:
      "Az első ultrahangvizsgálatot általában a 6–8. héten végezzük. Ekkor már látható a magzati szívműködés, és megállapítható a terhesség pontos kora. A legtöbb várandós erre a vizsgálatra emlékezik a legérzelmesebben — az első találkozás a babával.",
  },
  {
    question: "Kötelező-e a genetikai szűrés?",
    answer:
      "A genetikai szűrővizsgálat nem kötelező, de erősen ajánlott. Az első trimeszteri kombinált szűrés (ultrahangos nyakiredő-mérés és vérvétel) a Down-kór és más kromoszóma-rendellenességek kockázatát becsüli meg. Az eredmény nem diagnózis, hanem kockázatbecslés — emelkedett kockázat esetén további vizsgálatok (NIPT, amniocentézis) jönnek szóba.",
  },
  {
    question: "Milyen tünetekkel forduljak azonnal orvoshoz terhesség alatt?",
    answer:
      "Hüvelyi vérzés, erős alhasi fájdalom vagy görcs, magzatvíz-szivárgás, a magzatmozgás csökkenése, erős fejfájás vagy látászavar, illetve 38°C feletti láz esetén azonnal keresse orvosát vagy a legközelebbi sürgősségi osztályt. Ezek a tünetek nem feltétlenül jelentenek komoly problémát, de kivizsgálásuk nem halogatható.",
  },
  {
    question: "Szükséges-e vitamint szedni a várandósság alatt?",
    answer:
      "A folsav szedése már a terhesség tervezésétől javasolt, és az első trimeszter végéig kifejezetten fontos az idegcső-záródási rendellenességek megelőzése érdekében. D-vitamin, vas és jód pótlása a laboreredmények és az egyéni szükséglet alapján kerül meghatározásra. Az étrendkiegészítőkről a kontrollvizsgálaton személyre szabott tanácsot adok.",
  },
  {
    question: "Mi az a cukorterhelés, és mikor kell elvégezni?",
    answer:
      "Az orális glükóz-tolerancia teszt (OGTT) a terhességi cukorbetegség szűrővizsgálata. A 24–28. hét között végezzük: éhgyomorra vércukrot mérünk, majd 75 gramm glükózoldat elfogyasztása után 1 és 2 óra múlva ismét. A vizsgálat tünetmentes cukorbetegségre is rávilágíthat, amelynek kezelése a terhesség kimenetelét jelentősen befolyásolja.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VarandosgondozasPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Kezdőlap",
        item: "https://drmoroczangela.hu",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Várandósgondozás",
        item: "https://drmoroczangela.hu/varandosgondozas",
      },
    ],
  };

  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Várandósgondozás Esztergomban — Dr. Mórocz Angéla",
    description:
      "Teljes körű várandósgondozás: ultrahangvizsgálat, szűrések, trimeszterenkénti kontroll.",
    url: "https://drmoroczangela.hu/varandosgondozas",
    inLanguage: "hu",
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Obstetrics",
    },
    about: {
      "@type": "MedicalCondition",
      name: "Pregnancy",
    },
    mainEntity: {
      "@type": "MedicalClinic",
      name: "Dr. Mórocz Angéla Nőgyógyászati Rendelő",
      url: "https://drmoroczangela.hu",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="bg-white rounded-3xl px-6 py-12 md:px-10 md:py-16">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="max-w-3xl mx-auto mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-primary transition-colors duration-200">
              Kezdőlap
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-primary font-medium">
            Várandósgondozás
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto">
        {/* Hero */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-6">
          Várandósgondozás — Orvosi kísérés a terhesség teljes ideje alatt
        </h1>

        <div className="text-gray-700 leading-relaxed space-y-4 mb-12">
          <p>
            A pozitív terhességi teszt öröme után jogosan merül fel a kérdés: mit kell tenni
            először, és kire bízhatom magam a következő hónapokban? A várandósgondozás célja, hogy a
            terhesség elejétől a szülésig nyomon kövessük az anya és a magzat állapotát, és a lehető
            legkorábban felismerjünk minden olyan eltérést, amely beavatkozást igényel.
          </p>
          <p>
            Rendelőmben a várandósgondozás az irányelveknek megfelelő protokoll szerint zajlik, de
            mindig figyelembe veszem az egyéni körülményeket is. A kontrollvizsgálatok rendszere, az
            ultrahangok ütemezése és a szűrővizsgálatok kiválasztása az Ön terhességének
            sajátosságaihoz igazodik.
          </p>
        </div>

        {/* Első trimeszter */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Az első trimeszter — 1–12. hét</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              Az első nőgyógyászati vizsgálatot a pozitív terhességi tesztet követően, lehetőleg a
              6–8. héten érdemes elvégezni. Ezen a vizsgálaton ultrahangos megerősítést kap a
              terhesség fennállásáról, ellenőrizzük a magzati szívműködést, és meghatározzuk a
              terhesség korát — ez az úgynevezett dátumozó ultrahang.
            </p>
            <p>Az első trimeszter fontos vizsgálatai:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Dátumozó ultrahang</strong> — a terhesség korának és a várható szülés
                  időpontjának pontos meghatározása
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Első trimeszteri kombinált szűrés</strong> (11–13. hét) — a magzat nyaki
                  redőjének mérése (nuchal translucency) és vérvétel alapján a
                  kromoszóma-rendellenességek kockázatbecslése
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Laborvizsgálatok</strong> — vércsoport, Rh-faktor, vérkép, vércukor,
                  pajzsmirigy-funkció, fertőzésszűrés (toxoplazma, rubeola, hepatitis B, HIV,
                  szifilisz)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>NIPT (nem-invazív prenatális teszt)</strong> — igény és indikáció szerint
                  végezhető, a magzati DNS vizsgálata az anyai vérmintából
                </span>
              </li>
            </ul>
            <p>
              Ebben az időszakban a folsavpótlás különösen fontos, és megbeszéljük az életmódbeli
              tennivalókat is: táplálkozás, fizikai aktivitás, kerülendő szerek.
            </p>
          </div>
        </section>

        {/* Második trimeszter */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">
            A második trimeszter — 13–27. hét
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A második trimeszter a várandósság legstabilabb időszaka. A rosszullétek jellemzően
              ekkorra elmúlnak, az energia visszatér, és a baba mozgása is egyre határozottabban
              érezhető — az első magzatmozgást az elsőszülők jellemzően a 18–22. héten veszik észre.
            </p>
            <p>A fő vizsgálatok ebben az időszakban:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Részletes magzati ultrahang</strong> (18–22. hét) — az úgynevezett „nagy
                  ultrahang&quot;, amelyen a magzat szerveit, végtagjait, gerincét és
                  arcstruktúráját vizsgáljuk. Ekkor állapítható meg a placenta elhelyezkedése és a
                  magzatvíz mennyisége is.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Cukorterhelés (OGTT)</strong> (24–28. hét) — a terhességi cukorbetegség
                  kiszűrésére szolgáló vizsgálat. Éhgyomri vércukor, majd glükóz-oldat bevétele után
                  ismételt vérvétel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Vérkép és vasszint ellenőrzés</strong> — a vashiányos anémia a terhesség
                  második felében gyakori, és a szülésre való felkészülés szempontjából kezelést
                  igényel
                </span>
              </li>
            </ul>
            <p>
              A rendszeres kontrollok mellett a második trimeszterben beszélünk a szülésfelkészítés
              lehetőségeiről is — a harmadik trimeszterre már érdemes tájékozódni a
              kórházválasztásról és a szülési tervről.
            </p>
          </div>
        </section>

        {/* Harmadik trimeszter */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">
            A harmadik trimeszter — 28–40. hét
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A harmadik trimeszterben a kontrollvizsgálatok gyakorisága nő. A 28–36. hét között
              kéthetente, a 36. héttől hetente javasolt a megjelenés. Ekkor a hangsúly a magzat
              növekedésének és elhelyezkedésének nyomon követésén, valamint a szülésre való
              felkészülésen van.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Növekedési ultrahang</strong> — a magzat becsült súlya, a
                  magzatvíz-mennyiség és a placenta állapota
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>CTG (magzati szívhang-vizsgálat)</strong> — a 36. héttől rendszeresen
                  végzett vizsgálat, amely a magzat szívfrekvenciáját és a méhtevékenységet
                  regisztrálja
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>GBS-szűrés</strong> (35–37. hét) — a B-csoportú Streptococcus-hordozás
                  vizsgálata hüvelyi-végbél mintavétellel. Pozitív eredmény esetén a szülés során
                  antibiotikum-profilaxis szükséges.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Magzati fekvés ellenőrzése</strong> — a 36. héten a magzat ideális esetben
                  már fejvégű fekvésbe fordul. Farfekvés esetén megbeszéljük a lehetőségeket
                  (fordítás, tervezett császármetszés).
                </span>
              </li>
            </ul>
            <p>
              A terhesség utolsó heteiben különösen fontos a magzatmozgás figyelése. Ha a
              szokásoshoz képest kevesebbet mozog a baba, haladéktalanul keresse orvosát.
            </p>
          </div>
        </section>

        {/* Ultrahangvizsgálatok */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Ultrahangvizsgálatok a várandósság során
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              Az ultrahang a várandósgondozás egyik legfontosabb eszköze. A terhesség során három fő
              ultrahangvizsgálat javasolt — ezek mindegyike más-más információt nyújt:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-primary">Dátumozó ultrahang (6–8. hét)</h3>
                <p className="text-gray-600 text-sm mt-1">
                  A terhesség igazolása, a magzati szívműködés ellenőrzése és a várható szülési
                  időpont meghatározása. Ikerterhesség is ekkor ismerhető fel.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Genetikai ultrahang (11–13. hét)</h3>
                <p className="text-gray-600 text-sm mt-1">
                  A nyaki redő (NT) mérése a kromoszóma-rendellenességek szűrésének része. Ezzel
                  párhuzamosan vérvétellel kombinált kockázatbecslés is készül.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Részletes magzati ultrahang (18–22. hét)
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  A magzat anatómiájának részletes felmérése: szív, agy, gerinc, vesék, végtagok. A
                  placenta helyzete és a magzatvíz mennyisége is értékelésre kerül.
                </p>
              </div>
            </div>
            <p>
              Emellett a harmadik trimeszterben növekedési ultrahangot végzünk, amely a magzat
              fejlődését és a szülés várható körülményeit segít felmérni. Kiegészítő
              ultrahangvizsgálatra bármikor sor kerülhet, ha a klinikai kép indokolja.
            </p>
          </div>
        </section>

        {/* Laborvizsgálatok */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Laborvizsgálatok és szűrések</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A vérvizsgálatok a várandósgondozás nélkülözhetetlen részét képezik. Az első
              vérvétellel általában a terhesség 8–10. hetében találkozik, ezt követően
              trimeszterenként — szükség esetén gyakrabban — ismétlődnek.
            </p>
            <p>A legfontosabb laborvizsgálatok:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Vérkép — a vérszegénység felismeréséhez és a vérlemezkeszám ellenőrzéséhez
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Vércsoport és Rh-faktor — Rh-negatív anya esetén anti-D profilaxis szükséges
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Fertőzésszűrés — toxoplazma, rubeola, hepatitis B, HIV, szifilisz
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Pajzsmirigy-funkció (TSH) — a pajzsmirigy alulműködése a magzat idegrendszeri
                fejlődését befolyásolja
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Vizeletvizsgálat — fehérjeürítés, cukorszint, húgyúti fertőzés szűrése
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Cukorterhelés (24–28. hét) — a terhességi diabétesz kiszűrése
              </li>
            </ul>
            <p>
              A laboreredményeket minden kontrollvizsgálaton értékeljük, és szükség esetén azonnali
              terápiás döntést hozunk. Ha bármelyik érték eltér a normáltól, részletesen
              megbeszéljük a további lépéseket.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Gyakran ismételt kérdések</h2>
          <FaqAccordion items={faqItems} />
        </section>

        {/* CTA */}
        <section className="bg-secondary/30 rounded-2xl p-8 md:p-10 text-center mb-12">
          <h2 className="text-2xl font-bold text-primary mb-3">Foglaljon időpontot</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Várandósgondozásra, ultrahangvizsgálatra vagy terhesgondozási konzultációra online is
            foglalhat időpontot.
          </p>
          <Link
            href="/idopontfoglalas"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Időpontfoglalás
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

        {/* Related services */}
        <section className="pt-8 border-t border-gray-100">
          <h2 className="text-xl font-bold text-primary mb-4">Kapcsolódó szolgáltatások</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/nogyogyaszat"
              className="group rounded-xl border border-gray-100 p-5 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Nőgyógyászat
              </h3>
              <p className="text-sm text-gray-500 mt-1">Nőgyógyászati vizsgálat és szűrés</p>
            </Link>
            <Link
              href="/szuleszet"
              className="group rounded-xl border border-gray-100 p-5 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Szülészet
              </h3>
              <p className="text-sm text-gray-500 mt-1">Szülészeti ellátás és tanácsadás</p>
            </Link>
            <Link
              href="/gyogyszerfeliras"
              className="group rounded-xl border border-gray-100 p-5 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Gyógyszerfelírás
              </h3>
              <p className="text-sm text-gray-500 mt-1">Receptírás és gyógyszeres kezelés</p>
            </Link>
          </div>
        </section>
      </article>

      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={medicalWebPageJsonLd} />
      <JsonLd data={faqJsonLd} />
    </div>
  );
}
