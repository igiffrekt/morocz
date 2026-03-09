import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Nőgyógyászat Esztergomban",
  description:
    "Nőgyógyászati vizsgálat, szűrés és szakellátás Esztergomban. Dr. Mórocz Angéla nőgyógyász szakorvos rendelője. Időpontfoglalás online.",
  keywords: [
    "nőgyógyász Esztergom",
    "nőgyógyászati vizsgálat",
    "nőgyógyászati szűrés",
    "PAP-teszt",
    "HPV-szűrés",
    "kolposzkópia",
    "nőgyógyász",
  ],
  openGraph: {
    type: "website",
    title: "Nőgyógyászat Esztergomban — Dr. Mórocz Angéla",
    description:
      "Nőgyógyászati vizsgálat, szűrés és szakellátás Esztergomban. Foglaljon időpontot online.",
    locale: "hu_HU",
  },
  alternates: {
    canonical: "/nogyogyaszat",
  },
};

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const faqItems = [
  {
    question: "Milyen gyakran ajánlott nőgyógyászati szűrésre járni?",
    answer:
      "Panaszmentesség esetén is legalább évente egyszer javasolt a nőgyógyászati kontrollvizsgálat. A rendszeres szűrés révén a méhnyakrák és más elváltozások már korai, jól kezelhető stádiumban felismerhetők. Bizonyos kockázati tényezők — például HPV-fertőzés vagy korábbi kóros citológiai lelet — esetén az orvos gyakoribb kontrollt javasolhat.",
  },
  {
    question: "Szükséges-e előjegyzés a vizsgálathoz?",
    answer:
      "Igen, a rendelőben előjegyzés alapján fogadom a pácienseket. Időpontot a weboldalon keresztül, online is foglalhat, a nap 24 órájában. Így elkerülhető a várakozás, és a vizsgálatra elegendő időt tudok biztosítani.",
  },
  {
    question: "Fájdalmas-e a nőgyógyászati vizsgálat?",
    answer:
      "A vizsgálat általában nem fájdalmas, legfeljebb enyhe kellemetlenséget okozhat. A hüvelytükrös vizsgálat és a citológiai kenet vétele néhány másodpercig tart. Ha korábban kellemetlen tapasztalata volt, jelezze nyugodtan — a vizsgálatot az Ön tempójához igazítom.",
  },
  {
    question: "Mit vigyek magammal a vizsgálatra?",
    answer:
      "Hozza magával a TAJ-kártyáját, a személyi igazolványát, valamint az esetleges korábbi leleteit (citológia, ultrahang, laboreredmények). Ha gyógyszert szed, a gyógyszereinek listája is hasznos lehet. Az első vizsgálat előtt érdemes átgondolni, hogy mikor volt az utolsó menstruációja.",
  },
  {
    question: "Vizsgálat előtt mire kell figyelnem?",
    answer:
      "A vizsgálatot lehetőleg ne a menstruáció idejére időzítse, mert a vérzés megnehezíti a citológiai mintavételt. A vizsgálat előtti 24 órában kerülje a hüvelyi irrigálást és a hüvelyi gyógyszerek használatát. Egyéb speciális előkészületre nincs szükség.",
  },
  {
    question: "Szűrővizsgálatra is kell menni, ha nincs panaszom?",
    answer:
      "Feltétlenül. A nőgyógyászati szűrés lényege éppen az, hogy a tünetmentes elváltozásokat is kiszűrje. A méhnyakrák például hosszú évekig tünetmentesen fejlődik, és kizárólag a rendszeres citológiai szűréssel előzhető meg hatékonyan.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NogyogyaszatPage() {
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
        name: "Nőgyógyászat",
        item: "https://drmoroczangela.hu/nogyogyaszat",
      },
    ],
  };

  const medicalWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Nőgyógyászat Esztergomban — Dr. Mórocz Angéla",
    description:
      "Nőgyógyászati vizsgálat, szűrés és szakellátás Esztergomban. Dr. Mórocz Angéla nőgyógyász szakorvos.",
    url: "https://drmoroczangela.hu/nogyogyaszat",
    inLanguage: "hu",
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Gynecology",
    },
    about: {
      "@type": "MedicalSpecialty",
      name: "Gynecology",
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
            Nőgyógyászat
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto">
        {/* Hero */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-6">
          Nőgyógyászati vizsgálat és szűrés Esztergomban
        </h1>

        <div className="text-gray-700 leading-relaxed space-y-4 mb-12">
          <p>
            A nőgyógyászati gondozás a női egészségmegőrzés alapja. A rendszeres vizsgálat nem
            kizárólag a meglévő panaszok feltárására szolgál — a szűrés elsődleges célja, hogy az
            elváltozásokat még azelőtt felismerjük, mielőtt tüneteket okoznának. A méhnyakrák, a
            petefészek-elváltozások és számos hormonális zavar korai stádiumban kiválóan kezelhető,
            ha időben diagnosztizálják.
          </p>
          <p>
            Esztergomi rendelőmben nyugodt, diszkrét körülmények között végzem a nőgyógyászati
            vizsgálatokat és szűréseket. Akár éves kontrollra érkezik, akár konkrét panasszal keres
            fel, a célom minden esetben ugyanaz: érthető tájékoztatás, alapos vizsgálat és személyre
            szabott ellátás.
          </p>
        </div>

        {/* Mikor keresse fel */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Mikor keresse fel nőgyógyászát?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Az éves szűrővizsgálat mindenkinek ajánlott, aki betöltötte a 18. életévét vagy már él
            szexuális életet. Ezen túl az alábbi helyzetekben is érdemes soron kívül időpontot
            kérni:
          </p>
          <ul className="space-y-2 text-gray-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Szokatlan hüvelyi vérzés vagy váladékozás
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Alhasi fájdalom, nyomásérzet vagy görcsök
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Menstruációs zavarok — túl erős, túl ritka vagy elmaradó vérzés
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Vizelési panaszok, hólyaggyulladásos tünetek
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Fogamzásgátlás megkezdése, váltása vagy leállítása
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Terhességtervezés előtti konzultáció
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Klimaktériumi tünetek — hőhullámok, alvászavar, hangulatingadozás
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1.5 shrink-0">&#9679;</span>
              Nemi úton terjedő fertőzés gyanúja
            </li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Az éves kontroll panaszmentesség esetén is indokolt. A méhnyakrák jellemzően hosszú
            éveken át tünetmentesen fejlődik — kizárólag rendszeres szűréssel ismerhető fel
            idejében.
          </p>
        </section>

        {/* Vizsgálatok */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Milyen vizsgálatokat végzünk?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            A rendelőben elérhető vizsgálatok lefedik a nőgyógyászati ellátás teljes spektrumát, a
            szűréstől a diagnosztikáig:
          </p>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-primary">Citológiai kenet (PAP-teszt)</h3>
              <p>
                A méhnyakról vett sejtkenet a méhnyakrák-szűrés alapvizsgálata. A mintavétel
                fájdalmatlan, néhány másodperc alatt elvégezhető. Az eredmény általában 1-2 héten
                belül készül el.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">HPV-szűrés</h3>
              <p>
                A humán papillomavírus (HPV) bizonyos típusai a méhnyakrák kialakulásának fő
                kockázati tényezői. A HPV-teszt a citológiai kenettel párhuzamosan végezhető, és
                segít a kockázat pontosabb felmérésében.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Kolposzkópia</h3>
              <p>
                Ha a citológiai lelet kóros elváltozást mutat, kolposzkópos vizsgálattal a méhnyak
                felszínét nagyított képen, részletesen megvizsgálom. Szükség esetén célzott
                szövetminta (biopszia) is vehető.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Kismedencei ultrahangvizsgálat</h3>
              <p>
                A transvaginális ultrahang a méh, a petefészkek és a kismedencei szervek állapotáról
                ad részletes képet. Alkalmas ciszták, miómák, endometriózis és egyéb elváltozások
                kimutatására.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Emlővizsgálat</h3>
              <p>
                A nőgyógyászati vizsgálat részeként fizikális emlővizsgálatot is végzek. Ha
                tapintási eltérés merül fel, a szükséges képalkotó vizsgálatot (mammográfia,
                emlő-ultrahang) haladéktalanul elindítom.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">STI-szűrés</h3>
              <p>
                Nemi úton terjedő fertőzések — klamídia, gonorrhoea, szifilisz, herpesz — célzott
                laboratóriumi vizsgálattal szűrhetők. Partnervédelemmel és terhességtervezéssel
                összefüggésben is javasolt lehet.
              </p>
            </div>
          </div>
        </section>

        {/* A vizsgálat menete */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">A nőgyógyászati vizsgálat menete</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A vizsgálat egy rövid beszélgetéssel kezdődik: rákérdezek a panaszaira, korábbi
              kórtörténetére, szedett gyógyszereire és az utolsó menstruáció időpontjára. Ez a
              tájékozódás nélkülözhetetlen ahhoz, hogy a vizsgálatot célzottan végezzem.
            </p>
            <p>
              Ezután következik a fizikális vizsgálat. A hüvelytükrös vizsgálat során megtekinthető
              a méhnyak felszíne, és lehetőség van citológiai kenet vételére. A bimanuális
              tapintással a méh és a petefészkek méretéről, helyzetéről kapok információt. Ha
              szükséges, kiegészítő ultrahangvizsgálatot is végzek.
            </p>
            <p>
              A vizsgálat általában 15-20 percet vesz igénybe. Az eredményeket és a további
              teendőket azonnal megbeszéljük — a laboreredmények érkezését követően pedig telefonon
              vagy személyesen egyeztetjük a leleteket.
            </p>
          </div>
        </section>

        {/* Gyakori panaszok */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Gyakori nőgyógyászati panaszok és kezelésük
          </h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>A rendelőben az alábbi panaszokkal és kórképekkel fordulnak hozzám leggyakrabban:</p>
            <div>
              <h3 className="font-semibold text-primary">Menstruációs zavarok</h3>
              <p>
                Az irregurális, túl erős vagy fájdalmas menstruáció hátterében hormonális
                egyensúlyzavar, méhmiómák, endometriózis vagy pajzsmirigy-eltérés állhat. A
                kivizsgálás után a kezelés az okhoz igazodik — a gyógyszeres terápiától az
                életmódváltásig.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Hüvelyi fertőzések</h3>
              <p>
                A hüvelyi gombásodás és a bakteriális vaginózis a leggyakoribb ok, amiért a nők
                nőgyógyászt keresnek. A pontos diagnózishoz mikroszkópos és tenyésztéses vizsgálat
                szükséges, mert a tünetek hasonlóak lehetnek, de a kezelés eltér.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Endometriózis</h3>
              <p>
                A méhnyálkahártya-szövet méhen kívüli megjelenése krónikus kismedencei fájdalmat,
                fájdalmas menstruációt és meddőséget okozhat. A korai felismerés és a megfelelő
                kezelés jelentősen javítja az életminőséget.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Fogamzásgátlás-tanácsadás</h3>
              <p>
                A fogamzásgátlás ma már nem csupán a tablettáról szól. A hormonális és nem
                hormonális módszerek — tabletta, hormonspirál, réz-spirál, implantátum — közül az Ön
                élethelyzetéhez és egészségi állapotához leginkább illőt közösen választjuk ki.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">Klimax és hormonális változások</h3>
              <p>
                A menopauza körüli időszak testi és lelki tüneteit — hőhullámok, alvászavar, hüvelyi
                szárazság, hangulatingadozás — hormonpótló kezeléssel vagy alternatív terápiával
                hatékonyan enyhíteni lehet. Az első lépés mindig a gondos állapotfelmérés.
              </p>
            </div>
          </div>
        </section>

        {/* Megelőzés */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-4">Megelőzés és rendszeres kontroll</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>
              A nőgyógyászati megelőzés három pillérre épül: a rendszeres szűrővizsgálatra, az
              oltásokra és az egészségtudatos életmódra. A méhnyakrák megelőzésében a HPV elleni
              védőoltás és a rendszeres citológiai szűrés együttesen nyújtja a leghatékonyabb
              védelmet.
            </p>
            <p>
              Az emlőrák korai felismeréséhez az önvizsgálat és a 40 éves kor feletti rendszeres
              mammográfia javasolt. A nőgyógyászati kontrollvizsgálat ennek is részét képezi — a
              tapintásos emlővizsgálat során az esetleges eltéréseket azonnal észlelni tudom.
            </p>
            <p>
              Ha családjában előfordult emlő- vagy petefészekrák, érdemes ezt a konzultáción
              jelezni, mert ilyen esetben a szűrés ütemezése és módja eltérhet az általános
              ajánlásoktól.
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
            Nőgyógyászati vizsgálatra, szűrésre vagy konzultációra online is foglalhat időpontot. A
            rendelőben személyre szabott ellátást biztosítok, nyugodt körülmények között.
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
