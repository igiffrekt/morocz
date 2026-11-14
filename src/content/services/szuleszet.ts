import type { ServiceContent } from "./types";

/** Doctor-approved copy from docs/redesign/content.json → service.szuleszet (verbatim). */
export const SZULESZET: ServiceContent = {
  slug: "szuleszet",
  title: "Szülészeti ellátás és tanácsadás Esztergomban",
  intro: [
    "A gyermek születése az élet egyik legmeghatározóbb pillanata. A szülészeti ellátás feladata, hogy ez a folyamat biztonságos, kiszámítható és — amennyire lehetséges — a szülő nő elképzeléseinek megfelelő legyen. A felkészülés nem az utolsó hetekben kezdődik: a terhesség harmadik trimeszterétől érdemes tudatosan gondolkodni a szülés körülményeiről.",
    "Rendelőmben a szülészeti tanácsadás a várandósgondozás szerves kiegészítője. A szülésre való felkészítéstől a szülés utáni kontrollvizsgálatig végigkísérem az utat — a döntésekben pedig mindig a szakmai szempontok és a páciens kívánságainak egyensúlyát keresem.",
  ],
  sections: [
    {
      h: "Szülésre való felkészülés",
      nav: "Felkészülés",
      blocks: [
        {
          t: "p",
          x: "A szülés megtervezése nem azt jelenti, hogy minden mozzanatot előre le lehet fektetni — de a felkészülés jelentősen csökkenti a bizonytalanságot és segít abban, hogy a szülő nő aktívan részt vegyen a döntésekben.",
        },
        { t: "p", x: "A konzultáción az alábbi kérdésköröket beszéljük át:" },
        {
          t: "ul",
          items: [
            "A szülés várható módja — természetes szülés, császármetszés, vagy nyitott terv",
            "Fájdalomcsillapítási lehetőségek — epidurális érzéstelenítés, alternatív módszerek",
            "Kórházválasztás — mire érdemes figyelni, hogyan lehet előzetesen egyeztetni",
            "Szülési terv összeállítása — a kívánságok írásba foglalása az ellátó csapat számára",
            "A partner szerepe a szülés során",
          ],
        },
        {
          t: "p",
          x: "A szüléstervezés különösen azoknak hasznos, akik először szülnek, de korábbi szülészeti tapasztalattal rendelkező kismamák számára is hozhat új szempontokat — főleg, ha az előző szülés nem úgy alakult, ahogyan szerették volna.",
        },
      ],
    },
    {
      h: "A szülés módjai",
      nav: "Szülésmódok",
      blocks: [
        {
          t: "cards",
          items: [
            {
              h: "Természetes (hüvelyi) szülés",
              p: "Amennyiben a magzat fejvégű fekvésben van, a mérete arányban áll az anya szülőcsatornájával, és semmilyen orvosi kontraindikáció nem áll fenn, a természetes szülés az elsődlegesen ajánlott út. A hüvelyi szülés gyorsabb felépüléssel jár, és az anya-gyermek korai kötődést is elősegíti.",
            },
            {
              h: "Császármetszés",
              p: "A császármetszés műtéti úton történő szülés, amelyre tervezett és sürgősségi formában egyaránt sor kerülhet. Tervezett császármetszésre jellemzően a következő esetekben van szükség: medencefekvésű magzat, előző császármetszés utáni ismétlés, placenta praevia, ikerterhesség bizonyos esetei, vagy az anya kérésére — orvosi mérlegelés után.",
            },
            {
              h: "Vajúdás és fájdalomcsillapítás",
              p: "A szülési fájdalom kezelésére ma már többféle módszer áll rendelkezésre. Az epidurális érzéstelenítés a leggyakrabban alkalmazott eljárás, amely a fájdalmat hatékonyan csökkenti, miközben az anya ébren marad és aktívan részt vehet a szülésben. A nem gyógyszeres módszerek — légzéstechnikák, vízben vajúdás, mozgás — szintén hatékonyak lehetnek, különösen a vajúdás korai szakaszában.",
            },
          ],
        },
      ],
    },
    {
      h: "Mikor forduljunk szülészhez sürgősen?",
      nav: "Sürgős esetek",
      blocks: [
        {
          t: "p",
          x: "A terhesség utolsó heteiben bizonyos tünetek azonnali orvosi figyelmet igényelnek. Ilyen helyzetek:",
        },
        {
          t: "ul",
          items: [
            "Rendszeres, 5 percenkénti méhösszehúzódások",
            "Magzatvíz elfolyása — akár csepegés formájában is",
            "Hüvelyi vérzés",
            "A magzatmozgás hirtelen csökkenése vagy megszűnése",
            "Erős fejfájás, látászavar vagy felső hasi fájdalom (preeklampszia gyanúja)",
          ],
        },
        {
          t: "p",
          x: "Ha ezek közül bármelyiket tapasztalja, ne várjon a következő kontrollig — vegye fel a kapcsolatot a szülészettel vagy keresse fel a legközelebbi sürgősségi osztályt.",
        },
      ],
    },
    {
      h: "Szülés utáni gondozás",
      nav: "Szülés után",
      blocks: [
        {
          t: "p",
          x: "A gyermekágyi időszak — a szülés utáni első 6-8 hét — az anya testének regenerálódásáról szól. Ebben az időszakban a méh visszahúzódik, a sebek gyógyulnak, és a hormonháztartás fokozatosan áll vissza.",
        },
        {
          t: "p",
          x: "A szülés utáni első nőgyógyászati vizsgálatot általában a 6. hétre javaslom. Ezen a vizsgálaton ellenőrzöm:",
        },
        {
          t: "ul",
          items: [
            "A méh visszahúzódását és a méhnyak záródását",
            "A gátseb vagy a császármetszés-heg gyógyulását",
            "A szoptatás menetét — ha szoptatási nehézségek merülnek fel, tanácsot adok vagy szoptatási tanácsadóhoz irányítom",
            "A fogamzásgátlás kérdését — szoptatás alatti és szoptatás utáni lehetőségek",
          ],
        },
        {
          t: "p",
          x: 'A gyermekágy nem csupán fizikai felépülés. A szülés utáni hangulati változások — a „baby blues"-tól a szülés utáni depresszióig — gyakoriak és kezelhetők. Ha tartós szomorúság, szorongás vagy az újszülöttel kapcsolatos érzelmi nehézségek merülnek fel, erről is nyíltan beszélhetünk a vizsgálat során.',
        },
      ],
    },
  ],
  faq: [
    {
      q: "Mikor kezdjem el a szülészeti konzultációkat?",
      a: "A szülészeti tanácsadást érdemes a harmadik trimeszter elején, a 28–30. héten megkezdeni. Ekkor már időszerű a szülés módjáról, a kórházválasztásról és a szülési tervről beszélgetni. Természetesen ha korábban felmerülnek kérdések vagy aggodalmak, bármikor kereshet.",
    },
    {
      q: "Természetes szülés vagy császármetszés — hogyan döntünk?",
      a: "A döntés mindig egyéni mérlegelés eredménye. Elsősorban az anya és a magzat egészségi állapota, a magzat mérete és elhelyezkedése, valamint az anya korábbi szülészeti előzményei határozzák meg. Ahol orvosi szempontból mindkét út járható, a várandós kívánságát maximálisan figyelembe veszem.",
    },
    {
      q: "Mi történik a szülés utáni kontrollvizsgálaton?",
      a: "A szülés utáni vizsgálat során ellenőrzöm a méh visszahúzódását, a gátseb vagy császármetszés-heg gyógyulását, és felmérjük az általános állapotát. Beszélünk a szoptatásról, a fogamzásgátlásról és a lelki közérzetéről is. Ez a vizsgálat jellemzően a szülés utáni 6. héten esedékes.",
    },
    {
      q: "Mikor menjek kórházba szülés közben?",
      a: "Ha a fájások rendszeressé válnak (5 percenként ismétlődnek és legalább 1 percig tartanak), elfolyt a magzatvíz, vagy vérzést tapasztal — azonnal induljon a kórházba. Bizonytalan esetben telefonon is egyeztethet a szülészettel vagy a rendelővel.",
    },
    {
      q: "Milyen tünetekre figyeljek a gyermekágyi időszakban?",
      a: "A mélytrombózis jelei (lábduzzanat, fájdalom), a 38°C feletti láz, a bőséges vagy bűzös folyás, illetve a tartós lehangoltság és szorongás orvosi figyelmet igényel. Ezek a tünetek ritkák, de korai felismerésük és kezelésük rendkívül fontos. Ha bármi aggasztja, ne habozzon felkeresni engem vagy a sürgősségi osztályt.",
    },
  ],
  cta: "Szülészeti tanácsadásra, szüléstervezésre vagy szülés utáni kontrollvizsgálatra online is foglalhat időpontot.",
  related: [
    { slug: "nogyogyaszat", h: "Nőgyógyászat", s: "Nőgyógyászati vizsgálat és szűrés" },
    { slug: "varandosgondozas", h: "Várandósgondozás", s: "Teljes körű terhesgondozás" },
    { slug: "gyogyszerfeliras", h: "Gyógyszerfelírás", s: "Receptírás és gyógyszeres kezelés" },
  ],
};
