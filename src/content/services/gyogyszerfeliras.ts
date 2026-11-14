import type { ServiceContent } from "./types";

/** Doctor-approved copy from docs/redesign/content.json → service.gyogyszerfeliras (verbatim). */
export const GYOGYSZERFELIRAS: ServiceContent = {
  slug: "gyogyszerfeliras",
  title: "Nőgyógyászati gyógyszerfelírás és receptírás",
  intro: [
    "A nőgyógyászati ellátás nem csupán vizsgálatokat jelent — a panaszok kezelése gyakran gyógyszeres terápiával egészül ki. Legyen szó fogamzásgátlásról, hormonpótlásról, hüvelyi fertőzések kezeléséről vagy menstruációs panaszok enyhítéséről, a gyógyszerfelírás mindig a diagnózison és az egyéni mérlegelésen alapul.",
    'Rendelőmben a receptfelírás a konzultáció és — szükség esetén — a vizsgálat szerves része. Nem írok fel gyógyszert „vakon": a cél, hogy a páciens pontosan értse, miért kapja az adott készítményt, milyen hatást várhat, és mire figyeljen a szedés során.',
  ],
  sections: [
    {
      h: "Fogamzásgátlók felírása",
      nav: "Fogamzásgátlók",
      blocks: [
        {
          t: "p",
          x: "A fogamzásgátlás megválasztása személyre szabott döntés. A helyes módszer kiválasztásához figyelembe veszem az életkort, az egészségi állapotot, a dohányzási szokásokat, a korábbi tapasztalatokat és az élethelyzetet. A konzultáción áttekintjük a lehetőségeket, hogy a páciens megalapozott döntést hozhasson.",
        },
        {
          t: "p",
          x: "A rendelőben az alábbi fogamzásgátló módszerekhez nyújtok tanácsadást és receptet:",
        },
        {
          t: "ul",
          items: [
            'Kombinált orális fogamzásgátló — a hagyományos „tabletta", amely ösztrogént és progesztint tartalmaz. Hatékonysága megfelelő szedés mellett kiemelkedő.',
            "Progesztinbázisú (minipill) fogamzásgátló — ösztrogénmentes alternatíva, amely szoptató kismamák és ösztrogént nem szedhető nők számára is alkalmazható.",
            "Méhen belüli eszközök (IUD) — a hormonspirál (pl. Mirena) és a réz-spirál hosszú távú, megbízható védelmet nyújt. A behelyezést a rendelőben végzem.",
            "Hüvelyi gyűrű és tapasz — havi vagy heti ciklusú hormonális módszerek, amelyek alternatívát kínálnak a napi tablettaszedés helyett.",
          ],
        },
        {
          t: "p",
          x: "Az első felírás előtt rövid konzultáció és nőgyógyászati vizsgálat szükséges. A vizsgálat kiterjedhet vérnyomásmérésre, a családi kórelőzmény felmérésére és szükség esetén véralvadási vizsgálatra is.",
        },
      ],
    },
    {
      h: "Hormonpótló kezelés",
      nav: "Hormonpótlás",
      blocks: [
        {
          t: "p",
          x: "A menopauza időszakában az ösztrogénszint csökkenése kellemetlen tüneteket okozhat: hőhullámok, éjszakai izzadás, alvászavar, hüvelyi szárazság, hangulatingadozás. A hormonpótló terápia (HRT) ezeket a tüneteket hatékonyan enyhíti, és hosszú távon a csontritkulás megelőzésében is szerepet játszik.",
        },
        {
          t: "p",
          x: "A hormonpótlás nem mindenkinek javasolt, és nem is mindenkinek szükséges. Az indikáció felállításához részletes anamnézis, nőgyógyászati vizsgálat és laborvizsgálat szükséges. A terápia típusát, dózisát és alkalmazási módját (tabletta, tapasz, hüvelyi krém) egyénileg határozzuk meg — a legkisebb hatékony dózis elvét követve.",
        },
        {
          t: "p",
          x: "A hormonpótló kezelés mellett rendszeres kontroll — évente legalább egy nőgyógyászati vizsgálat és mammográfia — elengedhetetlen. A terápia időtartamát és a leállítás ütemezését az aktuális tünetekhez és a kockázati profilhoz igazítom.",
        },
      ],
    },
    {
      h: "Hüvelyi fertőzések gyógyszeres kezelése",
      nav: "Fertőzések",
      blocks: [
        {
          t: "p",
          x: "A hüvelyi fertőzések a nők egyik leggyakoribb panasza. A tünetek — viszketés, égő érzés, megváltozott folyás — kellemetlenek, de a legtöbb esetben rövid gyógyszeres kezeléssel jól kontrollálhatók.",
        },
        {
          t: "cards",
          items: [
            {
              h: "Hüvelyi gombásodás (candidiasis)",
              p: "A Candida-fertőzés a legismertebb hüvelyi fertőzés. Kezelése gombaellenes (antimikotikus) készítménnyel történik — hüvelyi kúp, krém vagy szükség esetén szájon át szedhető tabletta formájában. A recidiváló gombásodás esetén hosszabb kezelési protokollt alkalmazunk.",
            },
            {
              h: "Bakteriális vaginózis",
              p: "A bakteriális egyensúly felbomlása okozza, jellemző tünete a kellemetlen szagú, szürkésfehér folyás. A kezelés antibiotikummal (metronidazol vagy klindamicin) történik, hüvelyi vagy szájon át alkalmazott formában. A probiotikumok szerepe a visszaesés megelőzésében is felmerül.",
            },
            {
              h: "Nemi úton terjedő fertőzések",
              p: "Klamídia, gonorrhoea és egyéb szexuális úton terjedő kórokozók célzott antibiotikum-kezeléssel gyógyíthatók. A diagnózis laboratóriumi vizsgálattal történik, és a kezelés a partner kezelésével együtt a leghatékonyabb.",
            },
          ],
        },
      ],
    },
    {
      h: "A receptfelírás menete",
      nav: "A recept menete",
      blocks: [
        { t: "p", x: "A rendelőben a gyógyszerfelírás az alábbi lépések szerint történik:" },
        {
          t: "ol",
          items: [
            "Konzultáció és anamnézis — rövid beszélgetés a panaszokról, korábbi gyógyszerekről, allergiákról és egyéb releváns egészségügyi adatokról",
            "Vizsgálat (ha szükséges) — a diagnózis megalapozásához és a kezelés biztonságos indításához",
            "Gyógyszerválasztás és tájékoztatás — a készítmény hatásáról, mellékhatásairól, szedési módjáról és az ellenőrzés ütemezéséről",
            "Receptkiállítás — papíralapú vagy e-recept formájában, amelyet bármelyik gyógyszertárban kiválthat",
          ],
        },
        {
          t: "p",
          x: "Folyamatosan szedett gyógyszer (pl. fogamzásgátló) receptjének megújításához a rendszeres nőgyógyászati kontrollvizsgálat szükséges — ez évente legalább egyszer esedékes. A kontroll során nemcsak a receptet újítjuk meg, hanem az általános nőgyógyászati állapotot is ellenőrizzük.",
        },
      ],
    },
    {
      h: "Tudnivalók a gyógyszerszedéshez",
      nav: "Gyógyszerszedés",
      blocks: [
        {
          t: "p",
          x: "A gyógyszerek hatékonysága nagyban függ a helyes szedéstől. Néhány általános szempont, amelyet érdemes szem előtt tartani:",
        },
        {
          t: "ul",
          items: [
            "A fogamzásgátló tablettát naponta ugyanabban az időpontban vegye be — ez biztosítja a megbízható védelmet",
            "Ha gyógyszert felejt, a betegtájékoztatóban olvasható pótlási útmutatót kövesse, vagy kérjen telefonon tanácsot",
            "Antibiotikum-kezelés során a tablettás fogamzásgátló hatékonysága csökkenhet — ilyenkor kiegészítő védekezés javasolt",
            "Bármilyen szokatlan tünet (erős fejfájás, lábduzzanat, mellkasi fájdalom) esetén haladéktalanul keresse orvosát",
            "Terhesség gyanúja esetén a gyógyszerszedést egyeztesse orvosával, mielőtt bármit leállít vagy megváltoztat",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      q: "Szükséges-e személyes vizsgálat minden receptfelíráshoz?",
      a: "Új gyógyszer felírásához szinte mindig személyes konzultáció szükséges, mert az orvos csak a vizsgálat és az anamnézis alapján tud felelős döntést hozni. Már bevált, folyamatosan szedett gyógyszer (például fogamzásgátló) ismételt receptje bizonyos esetekben kontrollvizsgálat keretében is kiállítható, ha a legutóbbi vizsgálat óta nem telt el túl hosszú idő és panasz nem merült fel.",
    },
    {
      q: "Mennyi időre kapok receptet fogamzásgátlóra?",
      a: "Az első felírás általában 3 hónapra szól, ezalatt felmérjük, hogyan tolerálja a készítményt. Ha a szer jól beválik, a következő kontrollvizsgálat alkalmával akár 6 hónapra is kiállíthatom a receptet. Évente legalább egyszer nőgyógyászati vizsgálat szükséges a recept megújításához.",
    },
    {
      q: "Milyen mellékhatásai lehetnek a fogamzásgátlóknak?",
      a: "A leggyakoribb mellékhatások az első 2-3 hónapban fordulnak elő: enyhe hányinger, érzékeny mellek, pecsételő vérzés vagy hangulatingadozás. Ezek jellemzően maguktól megszűnnek. Komolyabb mellékhatások — mint a mélyvénás trombózis — ritkák, de a kockázati tényezőket (dohányzás, túlsúly, családi előzmény) a felírás előtt minden esetben felmérjük.",
    },
    {
      q: "Terhesség alatt milyen gyógyszereket lehet szedni?",
      a: "A terhesség alatt szedett gyógyszereket mindig az anya és a magzat biztonságának mérlegelésével választjuk ki. Bizonyos készítmények (például folsav, vas, egyes antibiotikumok) biztonságosan alkalmazhatók, míg más gyógyszerek kontraindikáltak. Soha ne kezdjen el vagy hagyjon abba gyógyszert a terhesség alatt orvosi konzultáció nélkül.",
    },
    {
      q: "Hogyan válthatok fogamzásgátlót?",
      a: "Fogamzásgátló váltásához személyes konzultáció szükséges. A váltás okai lehetnek mellékhatások, életmódváltozás, terhességtervezés vagy egyszerűen a módszer lecserélése. A vizsgálaton megbeszéljük az elérhető alternatívákat, és a legmegfelelőbb megoldást közösen választjuk ki. A váltás ütemezése a készítmény típusától függ.",
    },
    {
      q: "Felírható-e gyógyszer hüvelyi gombásodásra vizsgálat nélkül?",
      a: "A visszatérő, jól ismert tünetek esetén előfordulhat, hogy a kezelés telefonos egyeztetés alapján is elindítható, de az első alkalommal vagy bizonytalan esetben mindig szükséges a vizsgálat. A hüvelyi gombásodás és a bakteriális vaginózis tünetei nagyon hasonlóak lehetnek, viszont a kezelésük eltér — ezért a pontos diagnózis fontos a helyes terápia kiválasztásához.",
    },
  ],
  cta: "Gyógyszerfelíráshoz, fogamzásgátlás-tanácsadáshoz vagy receptmegújításhoz foglaljon időpontot online.",
  related: [
    { slug: "nogyogyaszat", h: "Nőgyógyászat", s: "Nőgyógyászati vizsgálat és szűrés" },
    { slug: "varandosgondozas", h: "Várandósgondozás", s: "Teljes körű terhesgondozás" },
  ],
};
