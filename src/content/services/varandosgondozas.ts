import type { ServiceContent } from "./types";

/** Doctor-approved copy from docs/redesign/content.json → service.varandosgondozas (verbatim). */
export const VARANDOSGONDOZAS: ServiceContent = {
  slug: "varandosgondozas",
  title: "Várandósgondozás — Orvosi kísérés a terhesség teljes ideje alatt",
  intro: [
    "A pozitív terhességi teszt öröme után jogosan merül fel a kérdés: mit kell tenni először, és kire bízhatom magam a következő hónapokban? A várandósgondozás célja, hogy a terhesség elejétől a szülésig nyomon kövessük az anya és a magzat állapotát, és a lehető legkorábban felismerjünk minden olyan eltérést, amely beavatkozást igényel.",
    "Rendelőmben a várandósgondozás az irányelveknek megfelelő protokoll szerint zajlik, de mindig figyelembe veszem az egyéni körülményeket is. A kontrollvizsgálatok rendszere, az ultrahangok ütemezése és a szűrővizsgálatok kiválasztása az Ön terhességének sajátosságaihoz igazodik.",
  ],
  sections: [
    {
      h: "Az első trimeszter — 1–12. hét",
      nav: "1. trimeszter",
      blocks: [
        {
          t: "p",
          x: "Az első nőgyógyászati vizsgálatot a pozitív terhességi tesztet követően, lehetőleg a 6–8. héten érdemes elvégezni. Ezen a vizsgálaton ultrahangos megerősítést kap a terhesség fennállásáról, ellenőrizzük a magzati szívműködést, és meghatározzuk a terhesség korát — ez az úgynevezett dátumozó ultrahang.",
        },
        { t: "p", x: "Az első trimeszter fontos vizsgálatai:" },
        {
          t: "ul",
          items: [
            "Dátumozó ultrahang — a terhesség korának és a várható szülés időpontjának pontos meghatározása",
            "Első trimeszteri kombinált szűrés (11–13. hét) — a magzat nyaki redőjének mérése (nuchal translucency) és vérvétel alapján a kromoszóma-rendellenességek kockázatbecslése",
            "Laborvizsgálatok — vércsoport, Rh-faktor, vérkép, vércukor, pajzsmirigy-funkció, fertőzésszűrés (toxoplazma, rubeola, hepatitis B, HIV, szifilisz)",
            "NIPT (nem-invazív prenatális teszt) — igény és indikáció szerint végezhető, a magzati DNS vizsgálata az anyai vérmintából",
          ],
        },
        {
          t: "p",
          x: "Ebben az időszakban a folsavpótlás különösen fontos, és megbeszéljük az életmódbeli tennivalókat is: táplálkozás, fizikai aktivitás, kerülendő szerek.",
        },
      ],
    },
    {
      h: "A második trimeszter — 13–27. hét",
      nav: "2. trimeszter",
      blocks: [
        {
          t: "p",
          x: "A második trimeszter a várandósság legstabilabb időszaka. A rosszullétek jellemzően ekkorra elmúlnak, az energia visszatér, és a baba mozgása is egyre határozottabban érezhető — az első magzatmozgást az elsőszülők jellemzően a 18–22. héten veszik észre.",
        },
        { t: "p", x: "A fő vizsgálatok ebben az időszakban:" },
        {
          t: "ul",
          items: [
            'Részletes magzati ultrahang (18–22. hét) — az úgynevezett „nagy ultrahang", amelyen a magzat szerveit, végtagjait, gerincét és arcstruktúráját vizsgáljuk. Ekkor állapítható meg a placenta elhelyezkedése és a magzatvíz mennyisége is.',
            "Cukorterhelés (OGTT) (24–28. hét) — a terhességi cukorbetegség kiszűrésére szolgáló vizsgálat. Éhgyomri vércukor, majd glükóz-oldat bevétele után ismételt vérvétel.",
            "Vérkép és vasszint ellenőrzés — a vashiányos anémia a terhesség második felében gyakori, és a szülésre való felkészülés szempontjából kezelést igényel",
          ],
        },
        {
          t: "p",
          x: "A rendszeres kontrollok mellett a második trimeszterben beszélünk a szülésfelkészítés lehetőségeiről is — a harmadik trimeszterre már érdemes tájékozódni a kórházválasztásról és a szülési tervről.",
        },
      ],
    },
    {
      h: "A harmadik trimeszter — 28–40. hét",
      nav: "3. trimeszter",
      blocks: [
        {
          t: "p",
          x: "A harmadik trimeszterben a 28–32. hét között ultrahangvizsgálattal ellenőrizzük a magzat növekedési ütemét, a 36. héttől pedig hetente keresse fel a szülésre választott kórházat. Ekkor a hangsúly a magzat növekedésének és elhelyezkedésének nyomon követésén, valamint a szülésre való felkészülésen van.",
        },
        {
          t: "ul",
          items: [
            "Növekedési ultrahang — a magzat becsült súlya, a magzatvíz-mennyiség és a placenta állapota",
            "CTG (magzati szívhang-vizsgálat) — a 36. héttől rendszeresen végzett vizsgálat, amely a magzat szívfrekvenciáját és a méhtevékenységet regisztrálja",
            "GBS-szűrés (35–37. hét) — a B-csoportú Streptococcus-hordozás vizsgálata hüvelyi mintavétellel. Pozitív eredmény esetén a szülés során antibiotikum-profilaxis szükséges.",
            "Magzati fekvés ellenőrzése — a 36. héten a magzat ideális esetben már fejvégű fekvésbe fordul. Farfekvés esetén megbeszéljük a lehetőségeket (fordítás, tervezett császármetszés).",
          ],
        },
        {
          t: "p",
          x: "A terhesség utolsó heteiben különösen fontos a magzatmozgás figyelése. Ha a szokásoshoz képest kevesebbet mozog a baba, haladéktalanul keresse orvosát.",
        },
      ],
    },
    {
      h: "Ultrahangvizsgálatok a várandósság során",
      nav: "Ultrahang",
      blocks: [
        {
          t: "p",
          x: "Az ultrahang a várandósgondozás egyik legfontosabb eszköze. A terhesség során három fő ultrahangvizsgálat javasolt — ezek mindegyike más-más információt nyújt:",
        },
        {
          t: "cards",
          items: [
            {
              h: "Dátumozó ultrahang (6–8. hét)",
              p: "A terhesség igazolása, a magzati szívműködés ellenőrzése és a várható szülési időpont meghatározása. Ikerterhesség is ekkor ismerhető fel.",
            },
            {
              h: "Genetikai ultrahang (11–13. hét)",
              p: "A nyaki redő (NT) mérése a kromoszóma-rendellenességek szűrésének része. Ezzel párhuzamosan vérvétellel további genetikai vizsgálatok is kérhetők.",
            },
            {
              h: "Részletes magzati ultrahang (18–22. hét)",
              p: "A magzat anatómiájának részletes felmérése: szív, agy, gerinc, vesék, végtagok. A placenta helyzete és a magzatvíz mennyisége is értékelésre kerül.",
            },
          ],
        },
        {
          t: "p",
          x: "Emellett a harmadik trimeszterben növekedési ultrahangot végzünk, amely a magzat fejlődését és a szülés várható körülményeit segít felmérni. Kiegészítő ultrahangvizsgálatra bármikor sor kerülhet, ha a klinikai kép indokolja.",
        },
      ],
    },
    {
      h: "Laborvizsgálatok és szűrések",
      nav: "Labor, szűrések",
      blocks: [
        {
          t: "p",
          x: "A vérvizsgálatok a várandósgondozás nélkülözhetetlen részét képezik. Az első vérvétellel általában a terhesség 8–10. hetében találkozik, ezt követően trimeszterenként — szükség esetén gyakrabban — ismétlődnek.",
        },
        { t: "p", x: "A legfontosabb laborvizsgálatok:" },
        {
          t: "ul",
          items: [
            "Vérkép — a vérszegénység felismeréséhez és a vérlemezkeszám ellenőrzéséhez",
            "Vércsoport és Rh-faktor — Rh-negatív anya esetén anti-D profilaxis szükséges",
            "Fertőzésszűrés — toxoplazma, rubeola, hepatitis B, HIV, szifilisz",
            "Pajzsmirigy-funkció (TSH) — a pajzsmirigy alulműködése a magzat idegrendszeri fejlődését befolyásolja",
            "Vizeletvizsgálat — fehérjeürítés, cukorszint, húgyúti fertőzés szűrése",
            "Cukorterhelés (24–28. hét) — a terhességi diabétesz kiszűrése",
          ],
        },
        {
          t: "p",
          x: "A laboreredményeket minden kontrollvizsgálaton értékeljük, és szükség esetén azonnali terápiás döntést hozunk. Ha bármelyik érték eltér a normáltól, részletesen megbeszéljük a további lépéseket.",
        },
      ],
    },
  ],
  faq: [
    {
      q: "Milyen gyakran kell kontrollra járni terhesség alatt?",
      a: "Az első trimeszterben általában havonta egyszer, a második trimeszterben 3-4 hetente, a harmadik trimeszterben pedig 2 hetente, a 36. héttől hetente javasolt a kontrollvizsgálat. Ha a terhesség kockázati besorolása magasabb, az orvos sűrűbb ellenőrzést javasolhat.",
    },
    {
      q: "Mikor lehet először ultrahangon látni a babát?",
      a: "Az első ultrahangvizsgálatot általában a 6–8. héten végezzük. Ekkor már látható a magzati szívműködés, és megállapítható a terhesség pontos kora. A legtöbb várandós erre a vizsgálatra emlékezik a legérzelmesebben — az első találkozás a babával.",
    },
    {
      q: "Kötelező-e a genetikai szűrés?",
      a: "A genetikai szűrővizsgálat nem kötelező, de erősen ajánlott. Az első trimeszteri kombinált szűrés (ultrahangos nyakiredő-mérés és vérvétel) a Down-kór és más kromoszóma-rendellenességek kockázatát becsüli meg. Az eredmény nem diagnózis, hanem kockázatbecslés — emelkedett kockázat esetén további vizsgálatok (NIPT, amniocentézis) jönnek szóba.",
    },
    {
      q: "Milyen tünetekkel forduljak azonnal orvoshoz terhesség alatt?",
      a: "Hüvelyi vérzés, erős alhasi fájdalom vagy görcs, magzatvíz-szivárgás, a magzatmozgás csökkenése, erős fejfájás vagy látászavar, illetve 38°C feletti láz esetén azonnal keresse orvosát vagy a legközelebbi sürgősségi osztályt. Ezek a tünetek nem feltétlenül jelentenek komoly problémát, de kivizsgálásuk nem halogatható.",
    },
    {
      q: "Szükséges-e vitamint szedni a várandósság alatt?",
      a: "A folsav szedése már a terhesség tervezésétől javasolt, és az első trimeszter végéig kifejezetten fontos az idegcső-záródási rendellenességek megelőzése érdekében. D-vitamin, vas és jód pótlása a laboreredmények és az egyéni szükséglet alapján kerül meghatározásra. Az étrendkiegészítőkről a kontrollvizsgálaton személyre szabott tanácsot adok.",
    },
    {
      q: "Mi az a cukorterhelés, és mikor kell elvégezni?",
      a: "Az orális glükóz-tolerancia teszt (OGTT) a terhességi cukorbetegség szűrővizsgálata. A 24–28. hét között végezzük: éhgyomorra vércukrot mérünk, majd 75 gramm glükózoldat elfogyasztása után 1 és 2 óra múlva ismét. A vizsgálat tünetmentes cukorbetegségre is rávilágíthat, amelynek kezelése a terhesség kimenetelét jelentősen befolyásolja.",
    },
  ],
  cta: "Várandósgondozásra, ultrahangvizsgálatra vagy terhesgondozási konzultációra online is foglalhat időpontot.",
  related: [
    { slug: "nogyogyaszat", h: "Nőgyógyászat", s: "Nőgyógyászati vizsgálat és szűrés" },
    { slug: "szuleszet", h: "Szülészet", s: "Szülészeti ellátás és tanácsadás" },
    { slug: "gyogyszerfeliras", h: "Gyógyszerfelírás", s: "Receptírás és gyógyszeres kezelés" },
  ],
};
