import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Gyógyszerfelírás — Nőgyógyászati receptírás",
  description:
    "Nőgyógyászati gyógyszerfelírás Esztergomban. Fogamzásgátló, hormonpótló kezelés, hüvelyi fertőzések gyógyszeres ellátása. Dr. Mórocz Angéla nőgyógyász.",
  keywords: [
    "gyógyszerfelírás nőgyógyász",
    "recept nőgyógyász",
    "fogamzásgátló felírás",
    "hormonpótló kezelés",
    "nőgyógyászati gyógyszer",
    "recept Esztergom",
  ],
  openGraph: {
    type: "website",
    title: "Gyógyszerfelírás — Dr. Mórocz Angéla nőgyógyász",
    description:
      "Nőgyógyászati gyógyszerfelírás: fogamzásgátlók, hormonkezelés, fertőzések kezelése. Foglaljon időpontot.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/gyogyszerfeliras",
  },
};

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Szükséges-e személyes vizsgálat minden receptfelíráshoz?",
    answer:
      "Új gyógyszer felírásához szinte mindig személyes konzultáció szükséges, mert az orvos csak a vizsgálat és az anamnézis alapján tud felelős döntést hozni. Már bevált, folyamatosan szedett gyógyszer (például fogamzásgátló) ismételt receptje bizonyos esetekben kontrollvizsgálat keretében is kiállítható, ha a legutóbbi vizsgálat óta nem telt el túl hosszú idő és panasz nem merült fel.",
  },
  {
    question: "Mennyi időre kapok receptet fogamzásgátlóra?",
    answer:
      "Az első felírás általában 3 hónapra szól, ezalatt felmérjük, hogyan tolerálja a készítményt. Ha a szer jól beválik, a következő kontrollvizsgálat alkalmával akár 6 hónapra is kiállíthatom a receptet. Évente legalább egyszer nőgyógyászati vizsgálat szükséges a recept megújításához.",
  },
  {
    question: "Milyen mellékhatásai lehetnek a fogamzásgátlóknak?",
    answer:
      "A leggyakoribb mellékhatások az első 2-3 hónapban fordulnak elő: enyhe hányinger, érzékeny mellek, pecsételő vérzés vagy hangulatingadozás. Ezek jellemzően maguktól megszűnnek. Komolyabb mellékhatások — mint a mélyvénás trombózis — ritkák, de a kockázati tényezőket (dohányzás, túlsúly, családi előzmény) a felírás előtt minden esetben felmérjük.",
  },
  {
    question: "Terhesség alatt milyen gyógyszereket lehet szedni?",
    answer:
      "A terhesség alatt szedett gyógyszereket mindig az anya és a magzat biztonságának mérlegelésével választjuk ki. Bizonyos készítmények (például folsav, vas, egyes antibiotikumok) biztonságosan alkalmazhatók, míg más gyógyszerek kontraindikáltak. Soha ne kezdjen el vagy hagyjon abba gyógyszert a terhesség alatt orvosi konzultáció nélkül.",
  },
  {
    question: "Hogyan válthatok fogamzásgátlót?",
    answer:
      "Fogamzásgátló váltásához személyes konzultáció szükséges. A váltás okai lehetnek mellékhatások, életmódváltozás, terhességtervezés vagy egyszerűen a módszer lecserélése. A vizsgálaton megbeszéljük az elérhető alternatívákat, és a legmegfelelőbb megoldást közösen választjuk ki. A váltás ütemezése a készítmény típusától függ.",
  },
  {
    question: "Felírható-e gyógyszer hüvelyi gombásodásra vizsgálat nélkül?",
    answer:
      "A visszatérő, jól ismert tünetek esetén előfordulhat, hogy a kezelés telefonos egyeztetés alapján is elindítható, de az első alkalommal vagy bizonytalan esetben mindig szükséges a vizsgálat. A hüvelyi gombásodás és a bakteriális vaginózis tünetei nagyon hasonlóak lehetnek, viszont a kezelésük eltér — ezért a pontos diagnózis fontos a helyes terápia kiválasztásához.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GyogyszerfelirasPage() {
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
        name: "Gyógyszerfelírás",
        item: "https://drmoroczangela.hu/gyogyszerfeliras",
      },
    ],
  };

  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Gyógyszerfelírás — Dr. Mórocz Angéla nőgyógyász",
    description:
      "Nőgyógyászati gyógyszerfelírás: fogamzásgátlók, hormonpótló kezelés, hüvelyi fertőzések kezelése.",
    url: "https://drmoroczangela.hu/gyogyszerfeliras",
    inLanguage: "hu",
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Gynecology",
    },
    about: {
      "@type": "MedicalProcedure",
      name: "Prescription",
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
            Gyógyszerfelírás
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto">
        {/* Hero */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-6">
          Nőgyógyászati gyógyszerfelírás és receptírás
        </h1>

        <div className="text-gray-700 leading-relaxed space-y-4 mb-12">
          <p>
            A nőgyógyászati ellátás nem csupán vizsgálatokat jelent — a panaszok kezelése gyakran
            gyógyszeres terápiával egészül ki. Legyen szó fogamzásgátlásról, hormonpótlásról,
            hüvelyi fertőzések kezeléséről vagy menstruációs panaszok enyhítéséről, a
            gyógyszerfelírás mindig a diagnózison és az egyéni mérlegelésen alapul.
          </p>
          <p>
            Rendelőmben a receptfelírás a konzultáció és — szükség esetén — a vizsgálat szerves
            része. Nem írok fel gyógyszert „vakon&quot;: a cél, hogy a páciens pontosan értse, miért
            kapja az adott készítményt, milyen hatást várhat, és mire figyeljen a szedés során.
          </p>
        </div>

        {/* Fogamzásgátlók */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Fogamzásgátlók felírása</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A fogamzásgátlás megválasztása személyre szabott döntés. A helyes módszer
              kiválasztásához figyelembe veszem az életkort, az egészségi állapotot, a dohányzási
              szokásokat, a korábbi tapasztalatokat és az élethelyzetet. A konzultáción áttekintjük
              a lehetőségeket, hogy a páciens megalapozott döntést hozhasson.
            </p>
            <p>
              A rendelőben az alábbi fogamzásgátló módszerekhez nyújtok tanácsadást és receptet:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Kombinált orális fogamzásgátló</strong> — a hagyományos „tabletta&quot;,
                  amely ösztrogént és progesztint tartalmaz. Hatékonysága megfelelő szedés mellett
                  kiemelkedő.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Progesztinbázisú (minipill) fogamzásgátló</strong> — ösztrogénmentes
                  alternatíva, amely szoptató kismamák és ösztrogénre érzékeny nők számára is
                  alkalmazható.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Méhen belüli eszközök (IUD)</strong> — a hormonspirál (pl. Mirena) és a
                  réz-spirál hosszú távú, megbízható védelmet nyújt. A behelyezést a rendelőben
                  végzem.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                <span>
                  <strong>Hüvelyi gyűrű és tapasz</strong> — havi vagy heti ciklusú hormonális
                  módszerek, amelyek alternatívát kínálnak a napi tablettaszedés helyett.
                </span>
              </li>
            </ul>
            <p>
              Az első felírás előtt rövid konzultáció és nőgyógyászati vizsgálat szükséges. A
              vizsgálat kiterjedhet vérnyomásmérésre, a családi kórelőzmény felmérésére és szükség
              esetén véralvadási vizsgálatra is.
            </p>
          </div>
        </section>

        {/* Hormonpótló kezelés */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Hormonpótló kezelés</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A menopauza időszakában az ösztrogénszint csökkenése kellemetlen tüneteket okozhat:
              hőhullámok, éjszakai izzadás, alvászavar, hüvelyi szárazság, hangulatingadozás. A
              hormonpótló terápia (HRT) ezeket a tüneteket hatékonyan enyhíti, és hosszú távon a
              csontritkulás megelőzésében is szerepet játszik.
            </p>
            <p>
              A hormonpótlás nem mindenkinek javasolt, és nem is mindenkinek szükséges. Az indikáció
              felállításához részletes anamnézis, nőgyógyászati vizsgálat és laborvizsgálat
              szükséges. A terápia típusát, dózisát és alkalmazási módját (tabletta, tapasz, hüvelyi
              krém) egyénileg határozzuk meg — a legkisebb hatékony dózis elvét követve.
            </p>
            <p>
              A hormonpótló kezelés mellett rendszeres kontroll — évente legalább egy nőgyógyászati
              vizsgálat és mammográfia — elengedhetetlen. A terápia időtartamát és a leállítás
              ütemezését az aktuális tünetekhez és a kockázati profilhoz igazítom.
            </p>
          </div>
        </section>

        {/* Hüvelyi fertőzések */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Hüvelyi fertőzések gyógyszeres kezelése
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A hüvelyi fertőzések a nők egyik leggyakoribb panasza. A tünetek — viszketés, égő
              érzés, megváltozott folyás — kellemetlenek, de a legtöbb esetben rövid gyógyszeres
              kezeléssel jól kontrollálhatók.
            </p>
            <div>
              <h3 className="font-semibold text-primary">Hüvelyi gombásodás (candidiasis)</h3>
              <p>
                A Candida-fertőzés a legismertebb hüvelyi fertőzés. Kezelése gombaellenes
                (antimikotikus) készítménnyel történik — hüvelyi kúp, krém vagy szükség esetén
                szájon át szedhető tabletta formájában. A recidiváló gombásodás esetén hosszabb
                kezelési protokollt alkalmazunk.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Bakteriális vaginózis</h3>
              <p>
                A bakteriális egyensúly felbomlása okozza, jellemző tünete a kellemetlen szagú,
                szürkésfehér folyás. A kezelés antibiotikummal (metronidazol vagy klindamicin)
                történik, hüvelyi vagy szájon át alkalmazott formában. A probiotikumok szerepe a
                visszaesés megelőzésében is felmerül.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Nemi úton terjedő fertőzések</h3>
              <p>
                Klamídia, gonorrhoea és egyéb szexuális úton terjedő kórokozók célzott
                antibiotikum-kezeléssel gyógyíthatók. A diagnózis laboratóriumi vizsgálattal
                történik, és a kezelés a partner kezelésével együtt a leghatékonyabb.
              </p>
            </div>
          </div>
        </section>

        {/* A receptfelírás menete */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">A receptfelírás menete</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>A rendelőben a gyógyszerfelírás az alábbi lépések szerint történik:</p>
            <ol className="space-y-3 list-decimal list-inside">
              <li>
                <strong>Konzultáció és anamnézis</strong> — rövid beszélgetés a panaszokról, korábbi
                gyógyszerekről, allergiákról és egyéb releváns egészségügyi adatokról
              </li>
              <li>
                <strong>Vizsgálat</strong> (ha szükséges) — a diagnózis megalapozásához és a kezelés
                biztonságos indításához
              </li>
              <li>
                <strong>Gyógyszerválasztás és tájékoztatás</strong> — a készítmény hatásáról,
                mellékhatásairól, szedési módjáról és az ellenőrzés ütemezéséről
              </li>
              <li>
                <strong>Receptkiállítás</strong> — papíralapú vagy e-recept formájában, amelyet
                bármelyik gyógyszertárban kiválthat
              </li>
            </ol>
            <p>
              Folyamatosan szedett gyógyszer (pl. fogamzásgátló) receptjének megújításához a
              rendszeres nőgyógyászati kontrollvizsgálat szükséges — ez évente legalább egyszer
              esedékes. A kontroll során nemcsak a receptet újítjuk meg, hanem az általános
              nőgyógyászati állapotot is ellenőrizzük.
            </p>
          </div>
        </section>

        {/* Gyógyszerszedési tanácsok */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Tudnivalók a gyógyszerszedéshez</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A gyógyszerek hatékonysága nagyban függ a helyes szedéstől. Néhány általános szempont,
              amelyet érdemes szem előtt tartani:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A fogamzásgátló
                tablettát naponta ugyanabban az időpontban vegye be — ez biztosítja a megbízható
                védelmet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Ha gyógyszert felejt, a betegtájékoztatóban olvasható pótlási útmutatót kövesse,
                vagy kérjen telefonon tanácsot
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Antibiotikum-kezelés során a tablettás fogamzásgátló hatékonysága csökkenhet —
                ilyenkor kiegészítő védekezés javasolt
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Bármilyen szokatlan tünet (erős fejfájás, lábduzzanat, mellkasi fájdalom) esetén
                haladéktalanul keresse orvosát
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Terhesség gyanúja esetén a gyógyszerszedést egyeztesse orvosával, mielőtt bármit
                leállít vagy megváltoztat
              </li>
            </ul>
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
            Gyógyszerfelíráshoz, fogamzásgátlás-tanácsadáshoz vagy receptmegújításhoz foglaljon
            időpontot online.
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
              href="/varandosgondozas"
              className="group rounded-xl border border-gray-100 p-5 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Várandósgondozás
              </h3>
              <p className="text-sm text-gray-500 mt-1">Teljes körű terhesgondozás</p>
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
