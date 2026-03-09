import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Szülészet Esztergomban",
  description:
    "Szülészeti ellátás, szüléstervezés és szülés utáni gondozás Esztergomban. Dr. Mórocz Angéla szülész-nőgyógyász szakorvos. Foglaljon időpontot.",
  keywords: [
    "szülészet Esztergom",
    "szülész",
    "szülés utáni gondozás",
    "szüléstervezés",
    "szülészeti tanácsadás",
    "gyermekágyi gondozás",
  ],
  openGraph: {
    type: "website",
    title: "Szülészet Esztergomban — Dr. Mórocz Angéla",
    description:
      "Szülészeti ellátás, szüléstervezés és szülés utáni gondozás Esztergomban. Foglaljon időpontot.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/szuleszet",
  },
};

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Mikor kezdjem el a szülészeti konzultációkat?",
    answer:
      "A szülészeti tanácsadást érdemes a harmadik trimeszter elején, a 28–30. héten megkezdeni. Ekkor már időszerű a szülés módjáról, a kórházválasztásról és a szülési tervről beszélgetni. Természetesen ha korábban felmerülnek kérdések vagy aggodalmak, bármikor kereshet.",
  },
  {
    question: "Természetes szülés vagy császármetszés — hogyan döntünk?",
    answer:
      "A döntés mindig egyéni mérlegelés eredménye. Elsősorban az anya és a magzat egészségi állapota, a magzat mérete és elhelyezkedése, valamint az anya korábbi szülészeti előzményei határozzák meg. Ahol orvosi szempontból mindkét út járható, a várandós kívánságát maximálisan figyelembe veszem.",
  },
  {
    question: "Mi történik a szülés utáni kontrollvizsgálaton?",
    answer:
      "A szülés utáni vizsgálat során ellenőrzöm a méh visszahúzódását, a gátseb vagy császármetszés-heg gyógyulását, és felmérjük az általános állapotát. Beszélünk a szoptatásról, a fogamzásgátlásról és a lelki közérzetéről is. Ez a vizsgálat jellemzően a szülés utáni 6. héten esedékes.",
  },
  {
    question: "Mikor menjek kórházba szülés közben?",
    answer:
      "Ha a fájások rendszeressé válnak (5 percenként ismétlődnek és legalább 1 percig tartanak), elfolyt a magzatvíz, vagy vérzést tapasztal — azonnal induljon a kórházba. Bizonytalan esetben telefonon is egyeztethet a szülészettel vagy a rendelővel.",
  },
  {
    question: "Milyen tünetekre figyeljek a gyermekágyi időszakban?",
    answer:
      "A mélytrombózis jelei (lábduzzanat, fájdalom), a 38°C feletti láz, a bőséges vagy bűzös folyás, illetve a tartós lehangoltság és szorongás orvosi figyelmet igényel. Ezek a tünetek ritkák, de korai felismerésük és kezelésük rendkívül fontos. Ha bármi aggasztja, ne habozzon felkeresni engem vagy a sürgősségi osztályt.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SzuleszetPage() {
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
        name: "Szülészet",
        item: "https://drmoroczangela.hu/szuleszet",
      },
    ],
  };

  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Szülészet Esztergomban — Dr. Mórocz Angéla",
    description: "Szülészeti ellátás, szüléstervezés és szülés utáni gondozás Esztergomban.",
    url: "https://drmoroczangela.hu/szuleszet",
    inLanguage: "hu",
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Obstetrics",
    },
    about: {
      "@type": "MedicalSpecialty",
      name: "Obstetrics",
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
            Szülészet
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto">
        {/* Hero */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-6">
          Szülészeti ellátás és tanácsadás Esztergomban
        </h1>

        <div className="text-gray-700 leading-relaxed space-y-4 mb-12">
          <p>
            A gyermek születése az élet egyik legmeghatározóbb pillanata. A szülészeti ellátás
            feladata, hogy ez a folyamat biztonságos, kiszámítható és — amennyire lehetséges — a
            szülő nő elképzeléseinek megfelelő legyen. A felkészülés nem az utolsó hetekben
            kezdődik: a terhesség harmadik trimeszterétől érdemes tudatosan gondolkodni a szülés
            körülményeiről.
          </p>
          <p>
            Rendelőmben a szülészeti tanácsadás a várandósgondozás szerves kiegészítője. A szülésre
            való felkészítéstől a szülés utáni kontrollvizsgálatig végigkísérem az utat — a
            döntésekben pedig mindig a szakmai szempontok és a páciens kívánságainak egyensúlyát
            keresem.
          </p>
        </div>

        {/* Szülésre való felkészülés */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Szülésre való felkészülés</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A szülés megtervezése nem azt jelenti, hogy minden mozzanatot előre le lehet fektetni
              — de a felkészülés jelentősen csökkenti a bizonytalanságot és segít abban, hogy a
              szülő nő aktívan részt vegyen a döntésekben.
            </p>
            <p>A konzultáción az alábbi kérdésköröket beszéljük át:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A szülés várható módja —
                természetes szülés, császármetszés, vagy nyitott terv
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Fájdalomcsillapítási lehetőségek — epidurális érzéstelenítés, alternatív módszerek
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Kórházválasztás — mire érdemes figyelni, hogyan lehet előzetesen egyeztetni
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Szülési terv összeállítása — a kívánságok írásba foglalása az ellátó csapat számára
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A partner szerepe a
                szülés során
              </li>
            </ul>
            <p>
              A szüléstervezés különösen azoknak hasznos, akik először szülnek, de korábbi
              szülészeti tapasztalattal rendelkező kismamák számára is hozhat új szempontokat —
              főleg, ha az előző szülés nem úgy alakult, ahogyan szerették volna.
            </p>
          </div>
        </section>

        {/* A szülés módjai */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">A szülés módjai</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <div>
              <h3 className="font-semibold text-primary">Természetes (hüvelyi) szülés</h3>
              <p>
                Amennyiben a magzat fejvégű fekvésben van, a mérete arányban áll az anya
                szülőcsatornájával, és semmilyen orvosi kontraindikáció nem áll fenn, a természetes
                szülés az elsődlegesen ajánlott út. A hüvelyi szülés gyorsabb felépüléssel jár, és
                az anya-gyermek korai kötődést is elősegíti.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Császármetszés</h3>
              <p>
                A császármetszés műtéti úton történő szülés, amelyre tervezett és sürgősségi
                formában egyaránt sor kerülhet. Tervezett császármetszésre jellemzően a következő
                esetekben van szükség: medencefekvésű magzat, előző császármetszés utáni ismétlés,
                placenta praevia, ikerterhesség bizonyos esetei, vagy az anya kérésére — orvosi
                mérlegelés után.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Vajúdás és fájdalomcsillapítás</h3>
              <p>
                A szülési fájdalom kezelésére ma már többféle módszer áll rendelkezésre. Az
                epidurális érzéstelenítés a leggyakrabban alkalmazott eljárás, amely a fájdalmat
                hatékonyan csökkenti, miközben az anya ébren marad és aktívan részt vehet a
                szülésben. A nem gyógyszeres módszerek — légzéstechnikák, vízben vajúdás, mozgás —
                szintén hatékonyak lehetnek, különösen a vajúdás korai szakaszában.
              </p>
            </div>
          </div>
        </section>

        {/* Mikor forduljunk szülészhez */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Mikor forduljunk szülészhez sürgősen?
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A terhesség utolsó heteiben bizonyos tünetek azonnali orvosi figyelmet igényelnek.
              Ilyen helyzetek:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Rendszeres, 5 percenkénti méhösszehúzódások
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Magzatvíz elfolyása — akár csepegés formájában is
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Hüvelyi vérzés
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A magzatmozgás hirtelen
                csökkenése vagy megszűnése
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
                Erős fejfájás, látászavar vagy felső hasi fájdalom (preeklampszia gyanúja)
              </li>
            </ul>
            <p>
              Ha ezek közül bármelyiket tapasztalja, ne várjon a következő kontrollig — vegye fel a
              kapcsolatot a szülészettel vagy keresse fel a legközelebbi sürgősségi osztályt.
            </p>
          </div>
        </section>

        {/* Szülés utáni gondozás */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Szülés utáni gondozás</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A gyermekágyi időszak — a szülés utáni első 6-8 hét — az anya testének
              regenerálódásáról szól. Ebben az időszakban a méh visszahúzódik, a sebek gyógyulnak,
              és a hormonháztartás fokozatosan áll vissza.
            </p>
            <p>
              A szülés utáni első nőgyógyászati vizsgálatot általában a 6. hétre javaslom. Ezen a
              vizsgálaton ellenőrzöm:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A méh visszahúzódását és
                a méhnyak záródását
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A gátseb vagy a
                császármetszés-heg gyógyulását
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A szoptatás menetét — ha
                szoptatási nehézségek merülnek fel, tanácsot adok vagy szoptatási tanácsadóhoz
                irányítom
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0">&#9679;</span>A fogamzásgátlás
                kérdését — szoptatás alatti és szoptatás utáni lehetőségek
              </li>
            </ul>
            <p>
              A gyermekágy nem csupán fizikai felépülés. A szülés utáni hangulati változások — a
              „baby blues"-tól a szülés utáni depresszióig — gyakoriak és kezelhetők. Ha tartós
              szomorúság, szorongás vagy az újszülöttel kapcsolatos érzelmi nehézségek merülnek fel,
              erről is nyíltan beszélhetünk a vizsgálat során.
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
            Szülészeti tanácsadásra, szüléstervezésre vagy szülés utáni kontrollvizsgálatra online
            is foglalhat időpontot.
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
              href="/varandosgondozas"
              className="group rounded-xl border border-gray-100 p-5 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                Várandósgondozás
              </h3>
              <p className="text-sm text-gray-500 mt-1">Teljes körű terhesgondozás</p>
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
