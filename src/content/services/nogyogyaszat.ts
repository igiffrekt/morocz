import type { ServiceContent } from "./types";

/** Doctor-approved copy from docs/redesign/content.json → service.nogyogyaszat (verbatim). */
export const NOGYOGYASZAT: ServiceContent = {
  slug: "nogyogyaszat",
  title: "Nőgyógyászati vizsgálat és szűrés Esztergomban",
  intro: [
    "A nőgyógyászati gondozás a női egészségmegőrzés alapja. A rendszeres vizsgálat nem kizárólag a meglévő panaszok feltárására szolgál — a szűrés elsődleges célja, hogy az elváltozásokat még azelőtt felismerjük, mielőtt tüneteket okoznának. A méhnyakrák, a petefészek-elváltozások és számos hormonális zavar korai stádiumban kiválóan kezelhető, ha időben diagnosztizálják.",
    "Esztergomi rendelőmben nyugodt, diszkrét körülmények között végzem a nőgyógyászati vizsgálatokat és szűréseket. Akár éves kontrollra érkezik, akár konkrét panasszal keres fel, a célom minden esetben ugyanaz: érthető tájékoztatás, alapos vizsgálat és személyre szabott ellátás.",
  ],
  sections: [
    {
      h: "Mikor keresse fel nőgyógyászát?",
      nav: "Mikor?",
      blocks: [
        {
          t: "p",
          x: "Az éves szűrővizsgálat mindenkinek ajánlott, aki betöltötte a 18. életévét vagy már él szexuális életet. Ezen túl az alábbi helyzetekben is érdemes soron kívül időpontot kérni:",
        },
        {
          t: "ul",
          items: [
            "Szokatlan hüvelyi vérzés vagy váladékozás",
            "Alhasi fájdalom, nyomásérzet vagy görcsök",
            "Menstruációs zavarok — túl erős, túl ritka vagy elmaradó vérzés",
            "Vizelési panaszok, hólyaggyulladásos tünetek",
            "Fogamzásgátlás megkezdése, váltása vagy leállítása",
            "Terhességtervezés előtti konzultáció",
            "Klimaktériumi tünetek — hőhullámok, alvászavar, hangulatingadozás",
            "Nemi úton terjedő fertőzés gyanúja",
          ],
        },
        {
          t: "p",
          x: "Az éves kontroll panaszmentesség esetén is indokolt. A méhnyakrák jellemzően hosszú éveken át tünetmentesen fejlődik — kizárólag rendszeres szűréssel ismerhető fel idejében.",
        },
      ],
    },
    {
      h: "Milyen vizsgálatokat végzünk?",
      nav: "Vizsgálatok",
      blocks: [
        {
          t: "p",
          x: "A rendelőben elérhető vizsgálatok lefedik a nőgyógyászati ellátás teljes spektrumát, a szűréstől a diagnosztikáig:",
        },
        {
          t: "cards",
          items: [
            {
              h: "Citológiai kenet (PAP-teszt)",
              p: "A méhnyakról vett sejtkenet a méhnyakrák-szűrés alapvizsgálata. A mintavétel fájdalmatlan, néhány másodperc alatt elvégezhető. Az eredmény általában 1-2 héten belül készül el.",
            },
            {
              h: "HPV-szűrés",
              p: "A humán papillomavírus (HPV) bizonyos típusai a méhnyakrák kialakulásának fő kockázati tényezői. A HPV-teszt a citológiai kenettel párhuzamosan végezhető, és segít a kockázat pontosabb felmérésében.",
            },
            {
              h: "Kolposzkópia",
              p: "Ha a citológiai lelet kóros elváltozást mutat, indokolt esetben kolposzkópos szakemberhez irányítom a pácienst további kivizsgálás céljából.",
            },
            {
              h: "Kismedencei ultrahangvizsgálat",
              p: "A rendelőben tájékozódó ultrahangvizsgálatot végzek a méh, a petefészkek és a kismedencei szervek állapotának felmérésére. Indokolt esetben további kivizsgálás céljából ultrahang-specialistához irányítom.",
            },
            {
              h: "Emlővizsgálat",
              p: "Emlővizsgálatot nem rutinszerűen, hanem indokolt, problémás esetben, illetve a páciens külön kérésére végzek. Ha tapintási eltérés merül fel, a szükséges képalkotó vizsgálatot (mammográfia, emlő-ultrahang) haladéktalanul elindítom.",
            },
            {
              h: "STI-szűrés",
              p: "Nemi úton terjedő fertőzések — klamídia, gonorrhoea, szifilisz, herpesz — célzott laboratóriumi vizsgálattal szűrhetők. Partnervédelemmel és terhességtervezéssel összefüggésben is javasolt lehet.",
            },
          ],
        },
      ],
    },
    {
      h: "A nőgyógyászati vizsgálat menete",
      nav: "A vizsgálat menete",
      blocks: [
        {
          t: "p",
          x: "A vizsgálat egy rövid beszélgetéssel kezdődik: rákérdezek a panaszaira, korábbi kórtörténetére, szedett gyógyszereire és az utolsó menstruáció időpontjára. Ez a tájékozódás nélkülözhetetlen ahhoz, hogy a vizsgálatot célzottan végezzem.",
        },
        {
          t: "p",
          x: "Ezután következik a fizikális vizsgálat. A hüvelytükrös vizsgálat során megtekinthető a méhnyak felszíne, és lehetőség van citológiai kenet vételére. A bimanuális tapintással a méh és a petefészkek méretéről, helyzetéről kapok információt. Ha szükséges, kiegészítő ultrahangvizsgálatot is végzek.",
        },
        {
          t: "p",
          x: "A vizsgálat általában 15-20 percet vesz igénybe. Az eredményeket és a további teendőket azonnal megbeszéljük — a laboreredmények érkezését követően pedig telefonon, e-mailes konzultáció keretében vagy személyesen egyeztetjük a leleteket.",
        },
      ],
    },
    {
      h: "Gyakori nőgyógyászati panaszok és kezelésük",
      nav: "Panaszok",
      blocks: [
        {
          t: "p",
          x: "A rendelőben az alábbi panaszokkal és kórképekkel fordulnak hozzám leggyakrabban:",
        },
        {
          t: "cards",
          items: [
            {
              h: "Menstruációs zavarok",
              p: "Az irregurális, túl erős vagy fájdalmas menstruáció hátterében hormonális egyensúlyzavar, méhmiómák, endometriózis vagy pajzsmirigy-eltérés állhat. A kivizsgálás után a kezelés az okhoz igazodik — a gyógyszeres terápiától az életmódváltásig.",
            },
            {
              h: "Hüvelyi fertőzések",
              p: "A hüvelyi gombásodás és a bakteriális vaginózis a leggyakoribb ok, amiért a nők nőgyógyászt keresnek. A pontos diagnózishoz mikroszkópos és tenyésztéses vizsgálat szükséges, mert a tünetek hasonlóak lehetnek, de a kezelés eltér.",
            },
            {
              h: "Endometriózis",
              p: "A méhnyálkahártya-szövet méhen kívüli megjelenése krónikus kismedencei fájdalmat, fájdalmas menstruációt és meddőséget okozhat. A korai felismerés és a megfelelő kezelés jelentősen javítja az életminőséget.",
            },
            {
              h: "Fogamzásgátlás-tanácsadás",
              p: "A fogamzásgátlás ma már nem csupán a tablettáról szól. A hormonális és nem hormonális módszerek — tabletta, hormonspirál, réz-spirál, implantátum — közül az Ön élethelyzetéhez és egészségi állapotához leginkább illőt közösen választjuk ki.",
            },
            {
              h: "Klimax és hormonális változások",
              p: "A menopauza körüli időszak testi és lelki tüneteit — hőhullámok, alvászavar, hüvelyi szárazság, hangulatingadozás — hormonpótló kezeléssel vagy alternatív terápiával hatékonyan enyhíteni lehet. Az első lépés mindig a gondos állapotfelmérés.",
            },
          ],
        },
      ],
    },
    {
      h: "Megelőzés és rendszeres kontroll",
      nav: "Megelőzés",
      blocks: [
        {
          t: "p",
          x: "A nőgyógyászati megelőzés három pillérre épül: a rendszeres szűrővizsgálatra, az oltásokra és az egészségtudatos életmódra. A méhnyakrák megelőzésében a HPV elleni védőoltás és a rendszeres citológiai szűrés együttesen nyújtja a leghatékonyabb védelmet.",
        },
        {
          t: "p",
          x: "Az emlőrák korai felismeréséhez az önvizsgálat és a 40 éves kor feletti rendszeres mammográfia javasolt.",
        },
        {
          t: "p",
          x: "Ha családjában előfordult emlő- vagy petefészekrák, érdemes ezt a konzultáción jelezni, mert ilyen esetben a szűrés ütemezése és módja eltérhet az általános ajánlásoktól.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Milyen gyakran ajánlott nőgyógyászati szűrésre járni?",
      a: "Panaszmentesség esetén is legalább évente egyszer javasolt a nőgyógyászati kontrollvizsgálat. A rendszeres szűrés révén a méhnyakrák és más elváltozások már korai, jól kezelhető stádiumban felismerhetők. Bizonyos kockázati tényezők — például HPV-fertőzés vagy korábbi kóros citológiai lelet — esetén az orvos gyakoribb kontrollt javasolhat.",
    },
    {
      q: "Szükséges-e előjegyzés a vizsgálathoz?",
      a: "Igen, a rendelőben előjegyzés alapján fogadom a pácienseket. Időpontot a weboldalon keresztül, online is foglalhat, a nap 24 órájában. Így elkerülhető a várakozás, és a vizsgálatra elegendő időt tudok biztosítani.",
    },
    {
      q: "Fájdalmas-e a nőgyógyászati vizsgálat?",
      a: "A vizsgálat általában nem fájdalmas, legfeljebb enyhe kellemetlenséget okozhat. A hüvelytükrös vizsgálat és a citológiai kenet vétele néhány másodpercig tart. Ha korábban kellemetlen tapasztalata volt, jelezze nyugodtan — a vizsgálatot az Ön tempójához igazítom.",
    },
    {
      q: "Mit vigyek magammal a vizsgálatra?",
      a: "Hozza magával a TAJ-kártyáját, a személyi igazolványát, valamint az esetleges korábbi leleteit (citológia, ultrahang, laboreredmények). Ha gyógyszert szed, a gyógyszereinek listája is hasznos lehet. Az első vizsgálat előtt érdemes átgondolni, hogy mikor volt az utolsó menstruációja.",
    },
    {
      q: "Vizsgálat előtt mire kell figyelnem?",
      a: "A vizsgálatot lehetőleg ne a menstruáció idejére időzítse, mert a vérzés megnehezíti a citológiai mintavételt. A vizsgálat előtti 24 órában kerülje a hüvelyi irrigálást és a hüvelyi gyógyszerek használatát. Egyéb speciális előkészületre nincs szükség.",
    },
    {
      q: "Szűrővizsgálatra is kell menni, ha nincs panaszom?",
      a: "Feltétlenül. A nőgyógyászati szűrés lényege éppen az, hogy a tünetmentes elváltozásokat is kiszűrje. A méhnyakrák például hosszú évekig tünetmentesen fejlődik, és kizárólag a rendszeres citológiai szűréssel előzhető meg hatékonyan.",
    },
  ],
  cta: "Nőgyógyászati vizsgálatra, szűrésre vagy konzultációra online is foglalhat időpontot. A rendelőben személyre szabott ellátást biztosítok, nyugodt körülmények között.",
  related: [
    { slug: "szuleszet", h: "Szülészet", s: "Szülészeti ellátás és tanácsadás" },
    { slug: "varandosgondozas", h: "Várandósgondozás", s: "Teljes körű terhesgondozás" },
    { slug: "gyogyszerfeliras", h: "Gyógyszerfelírás", s: "Receptírás és gyógyszeres kezelés" },
  ],
};
