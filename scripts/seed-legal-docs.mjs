/**
 * Seeds the legal documents into Sanity:
 *   1. termsOfService  — Felhasználási Feltételek (new singleton)
 *   2. bookingPolicy   — Foglalási és Lemondási Szabályzat (new singleton)
 *   3. privacyPolicy   — appends the Stripe data-processor section to the existing body
 *
 * Idempotent: (1) and (2) are createOrReplace'd, (3) strips any previously seeded
 * Stripe blocks (they carry a `stripe-` _key prefix) before re-appending them, so
 * re-running never duplicates the section and never touches hand-edited blocks.
 *
 * Usage:  node --env-file=.env.local scripts/seed-legal-docs.mjs [--dry]
 */

import { createClient } from "@sanity/client";

const EFFECTIVE_DATE = "2026-07-21";
const DRY = process.argv.includes("--dry");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// ─── Portable Text builders ───────────────────────────────────────────────────
// A "segment" is either a plain string, {b: "bold"} or {a: "text", href: "..."}.

let counter = 0;
const nextKey = (prefix) => `${prefix}${(counter++).toString(36).padStart(3, "0")}`;

function block(style, segments, opts = {}) {
  const prefix = opts.keyPrefix ?? "b";
  const markDefs = [];
  const children = segments.map((seg) => {
    if (typeof seg === "string") {
      return { _type: "span", _key: nextKey(prefix), text: seg, marks: [] };
    }
    if (seg.href) {
      const markKey = nextKey(`${prefix}l`);
      markDefs.push({ _type: "link", _key: markKey, href: seg.href });
      return {
        _type: "span",
        _key: nextKey(prefix),
        text: seg.a,
        marks: seg.b ? [markKey, "strong"] : [markKey],
      };
    }
    return { _type: "span", _key: nextKey(prefix), text: seg.b, marks: ["strong"] };
  });
  return {
    _type: "block",
    _key: nextKey(prefix),
    style,
    markDefs,
    children,
    ...(opts.listItem ? { listItem: opts.listItem, level: 1 } : {}),
  };
}

const makeBuilders = (keyPrefix) => ({
  h2: (...s) => block("h2", s, { keyPrefix }),
  h3: (...s) => block("h3", s, { keyPrefix }),
  p: (...s) => block("normal", s, { keyPrefix }),
  li: (...s) => block("normal", s, { keyPrefix, listItem: "bullet" }),
});

// ─── 1. Felhasználási Feltételek ──────────────────────────────────────────────

function termsBody() {
  const { h2, p, li } = makeBuilders("t");
  return [
    h2("1. Üzemeltető adatai"),
    p(
      "A jelen Felhasználási Feltételek a Mórocz Medical Kft. (a továbbiakban: „Szolgáltató”) által üzemeltetett ",
      { b: "drmoroczangela.hu" },
      " weboldal használatára, valamint az azon keresztül igénybe vehető egészségügyi szolgáltatások online időpontfoglalására vonatkoznak.",
    ),
    p({ b: "Szolgáltató neve:" }, " Mórocz Medical Kft."),
    p({ b: "Székhely:" }, " 2500 Esztergom, Martsa Alajos utca 6/C."),
    p({ b: "E-mail:" }, " ", {
      a: "recepcio@drmoroczangela.hu",
      href: "mailto:recepcio@drmoroczangela.hu",
    }),
    p({ b: "Telefon:" }, " +36 70 639 5239"),
    p(
      "A weboldal használatával a Felhasználó elfogadja a jelen Felhasználási Feltételek rendelkezéseit.",
    ),

    h2("2. A szolgáltatás tárgya"),
    p(
      "A weboldal célja, hogy a Felhasználók tájékozódhassanak a Szolgáltató által nyújtott egészségügyi szolgáltatásokról, valamint online időpontot foglaljanak azok igénybevételére.",
    ),
    p(
      "A weboldalon történő időpontfoglalás kizárólag előzetes regisztráció és a szükséges személyes adatok megadásával lehetséges.",
    ),

    h2("3. Időpontfoglalás"),
    p("Az időpontfoglalás online foglalási rendszeren keresztül történik."),
    p("A foglalás során a Felhasználó köteles:"),
    li("valós és pontos adatokat megadni,"),
    li("saját elérhetőségeit használni,"),
    li("a foglalási feltételeket elfogadni,"),
    li("a foglalási díjat megfizetni."),
    p("A Szolgáltató jogosult a hibás vagy valótlan adatokkal létrehozott foglalásokat törölni."),

    h2("4. Foglalási díj"),
    p(
      "Az időpont véglegesítésének feltétele ",
      { b: "10.000 Ft összegű foglalási díj" },
      " megfizetése.",
    ),
    p("A fizetés a Stripe biztonságos online fizetési rendszerén keresztül történik."),
    p("A bankkártyaadatokat a Szolgáltató nem kezeli és nem tárolja."),
    p("A foglalási díj a vizsgálat vagy konzultáció díjába beszámításra kerül."),

    h2("5. Lemondási feltételek"),
    p(
      "A lefoglalt időpont a visszaigazoló e-mailben szereplő foglaláskezelő hivatkozáson keresztül ",
      { b: "bármikor lemondható" },
      " – a foglalt időpontot megelőző 48 órán belül is. A lemondás lehetősége tehát nincs határidőhöz kötve; a lemondás időpontja kizárólag azt határozza meg, hogy a foglalási díj visszajár-e.",
    ),
    p(
      "A megfizetett foglalási díj akkor kerül visszatérítésre, ha a lemondás a foglalt időpontot megelőzően ",
      { b: "legalább 48 órával" },
      " megtörténik. Ebben az esetben a Szolgáltató a ",
      { b: "teljes 10.000 Ft foglalási díjat visszatéríti" },
      " arra a bankkártyára, amellyel a fizetés eredetileg történt.",
    ),
    p("Amennyiben a lemondás:"),
    li("48 órán belül történik,"),
    li("a Páciens nem jelenik meg,"),
    li("vagy nem jelzi távolmaradását,"),
    p("a megfizetett ", { b: "10.000 Ft foglalási díj nem kerül visszatérítésre." }),
    p(
      "A lefoglalt időpont ezen felül díjmentesen áthelyezhető egy másik szabad időpontra, legkésőbb a foglalt időpontot megelőző ",
      { b: "24 óráig" },
      "; ilyenkor a megfizetett foglalási díj az új időpontra kerül átvezetésre, újabb foglalási díj megfizetése nem szükséges.",
    ),
    p(
      "A lemondás és a visszatérítés részletes szabályait – ideértve a méltányossági és a rendkívüli eseteket is – a ",
      {
        a: "Foglalási és Lemondási Szabályzat",
        href: "https://drmoroczangela.hu/foglalasi-es-lemondasi-szabalyzat",
      },
      " tartalmazza.",
    ),

    h2("6. Fizetés"),
    p("Az online fizetés Stripe rendszerén keresztül történik."),
    p(
      "A Stripe saját biztonsági és adatkezelési szabályai szerint dolgozza fel a fizetési tranzakciókat.",
    ),
    p("A Szolgáltató bankkártyaadatokat nem kezel."),

    h2("7. Egészségügyi szolgáltatások"),
    p("A weboldalon található információk kizárólag tájékoztató jellegűek."),
    p("A weboldalon megjelenő tartalom:"),
    li("nem minősül orvosi diagnózisnak,"),
    li("nem helyettesíti a személyes szakorvosi vizsgálatot,"),
    li("nem alapoz meg orvos-beteg jogviszonyt."),
    p("Orvosi diagnózis kizárólag személyes vizsgálat alapján állítható fel."),

    h2("8. A Felhasználó kötelezettségei"),
    p("A Felhasználó köteles:"),
    li("valós adatokat megadni;"),
    li("az időpontján pontosan megjelenni;"),
    li("a vizsgálathoz szükséges dokumentumokat magával hozni;"),
    li("az egészségügyi személyzet utasításait betartani."),

    h2("9. Személyes adatok kezelése"),
    p(
      "A személyes adatok kezelésére az ",
      {
        a: "Adatkezelési Tájékoztató",
        href: "https://drmoroczangela.hu/adatkezelesi-tajekoztato",
      },
      " rendelkezései irányadók.",
    ),
    p("Az adatkezelési tájékoztató a weboldalon külön dokumentumban érhető el."),

    h2("10. Szellemi tulajdon"),
    p("A weboldalon található:"),
    li("szövegek,"),
    li("képek,"),
    li("grafikai elemek,"),
    li("logók,"),
    li("videók,"),
    li("dokumentumok,"),
    li("arculati elemek"),
    p("a Szolgáltató tulajdonát képezik vagy jogszerű felhasználás alatt állnak."),
    p(
      "Ezek előzetes írásbeli engedély nélkül nem másolhatók, nem terjeszthetők és nem használhatók fel.",
    ),

    h2("11. Felelősség kizárása"),
    p(
      "A Szolgáltató minden tőle elvárható intézkedést megtesz annak érdekében, hogy a weboldal folyamatosan elérhető legyen.",
    ),
    p("Nem vállal azonban felelősséget:"),
    li("internetes szolgáltatás kieséséért,"),
    li("technikai hibákért,"),
    li(
      "harmadik fél rendszereinek (például Stripe vagy időpontfoglaló rendszer) működéséből eredő hibákért,",
    ),
    li("vis maior eseményekért."),

    h2("12. Harmadik felek szolgáltatásai"),
    p("A weboldal harmadik felek szolgáltatásait használhatja, különösen:"),
    li("Stripe (online fizetés)"),
    li("online időpontfoglaló rendszer"),
    li("Google szolgáltatások"),
    li("sütik (cookie-k)"),
    p("Ezek működésére saját felhasználási és adatkezelési feltételeik irányadók."),

    h2("13. Panaszkezelés"),
    p(
      "A Felhasználó panaszát írásban a ",
      { a: "recepcio@drmoroczangela.hu", href: "mailto:recepcio@drmoroczangela.hu" },
      " e-mail címen vagy postai úton nyújthatja be.",
    ),
    p("A Szolgáltató a panaszokat a vonatkozó jogszabályok szerint vizsgálja ki."),

    h2("14. Irányadó jog"),
    p("A jelen Felhasználási Feltételekre Magyarország joga irányadó."),
    p("A jelen dokumentumban nem szabályozott kérdésekben különösen:"),
    li("a Polgári Törvénykönyv,"),
    li("az elektronikus kereskedelmi szolgáltatásokról szóló jogszabályok,"),
    li("a fogyasztóvédelmi rendelkezések,"),
    li("az egészségügyi jogszabályok,"),
    li("valamint a GDPR rendelkezései alkalmazandók."),

    h2("15. A Felhasználási Feltételek módosítása"),
    p("A Szolgáltató jogosult a jelen Felhasználási Feltételeket egyoldalúan módosítani."),
    p("Az aktuális változat mindig a drmoroczangela.hu weboldalon érhető el."),
    p("A módosítás a közzététel napján lép hatályba."),
  ];
}

// ─── 2. Foglalási és Lemondási Szabályzat ─────────────────────────────────────

function bookingPolicyBody() {
  const { h2, p, li } = makeBuilders("f");
  return [
    h2("1. A Szabályzat célja és hatálya"),
    p(
      "A jelen Foglalási és Lemondási Szabályzat (a továbbiakban: „Szabályzat”) a Mórocz Medical Kft. (székhely: 2500 Esztergom, Martsa Alajos utca 6/C.; a továbbiakban: „Szolgáltató”) által a ",
      { b: "drmoroczangela.hu" },
      " weboldalon üzemeltetett online időpontfoglaló rendszeren keresztül létrejövő időpontfoglalásokra vonatkozik.",
    ),
    p(
      "A Szabályzat a ",
      { a: "Felhasználási Feltételek", href: "https://drmoroczangela.hu/felhasznalasi-feltetelek" },
      " elválaszthatatlan részét képezi. A Páciens a foglalás során a Szabályzatot külön jelölőnégyzet bejelölésével, kifejezetten elfogadja; a Szabályzat elfogadása a foglalás létrejöttének feltétele.",
    ),
    p(
      "A személyes adatok kezelésére az ",
      {
        a: "Adatkezelési Tájékoztató",
        href: "https://drmoroczangela.hu/adatkezelesi-tajekoztato",
      },
      " rendelkezései irányadók.",
    ),

    h2("2. Az időpontfoglalás menete és létrejötte"),
    p("Az online időpontfoglalás lépései:"),
    li("regisztráció, illetve bejelentkezés a foglalói fiókba;"),
    li("a kívánt szolgáltatás, valamint a szabad időpont kiválasztása;"),
    li("a foglaláshoz szükséges adatok (név, e-mail cím, telefonszám) megadása;"),
    li("a jelen Szabályzat és az adatkezelési tájékoztató elfogadása;"),
    li("a foglalási díj online megfizetése."),
    p(
      "A foglalás akkor jön létre és az időpont akkor válik véglegessé, amikor a foglalási díj megfizetése sikeresen megtörtént. A sikeres fizetést követően a Páciens e-mailben visszaigazolást kap, amely tartalmazza a foglalási azonosítót, valamint a foglalás kezelésére (módosítás, lemondás) szolgáló egyedi hivatkozást. Ezt a hivatkozást kérjük megőrizni.",
    ),
    p(
      "A kiválasztott időpontot a rendszer a fizetési folyamat elindításától kezdve csak korlátozott ideig tartja fenn. Amennyiben a fizetés ezen az időn belül nem zárul le sikeresen, az időpont automatikusan felszabadul, és azt más Páciens lefoglalhatja.",
    ),

    h2("3. A foglalási díj"),
    p(
      "Az időpont lefoglalásának és véglegesítésének feltétele ",
      { b: "10.000 Ft összegű foglalási díj" },
      " megfizetése. A foglalási díj minden szolgáltatás esetén azonos összegű, és nem függ a kiválasztott vizsgálat vagy konzultáció árától.",
    ),
    p(
      "A foglalási díj a megjelenéskor a vizsgálat vagy konzultáció díjába teljes egészében beszámításra kerül, azaz a helyszínen a szolgáltatás árából a már megfizetett 10.000 Ft levonásra kerül.",
    ),
    p(
      "A foglalási díj célja az időpont fenntartása és a meg nem jelenésből eredő kapacitásvesztés mérséklése; a foglalási díj nem előleg a szolgáltatás teljes ellenértékére, és nem minősül foglalónak a Polgári Törvénykönyv szerinti értelemben.",
    ),
    p(
      "A fizetés a Stripe biztonságos online fizetési rendszerén keresztül történik. A Szolgáltató bankkártyaadatokat nem kezel és nem tárol. A foglalási díjról a Szolgáltató elektronikus számlát állít ki, amelyet e-mailben küld meg a Páciens részére.",
    ),

    h2("4. Az időpont módosítása (áthelyezése)"),
    p(
      "A lefoglalt időpont ",
      { b: "díjmentesen áthelyezhető" },
      " egy másik szabad időpontra, legkésőbb a foglalt időpontot megelőző ",
      { b: "24 óráig" },
      ". Az áthelyezés a visszaigazoló e-mailben szereplő foglaláskezelő hivatkozáson keresztül, önállóan elvégezhető.",
    ),
    p(
      "Áthelyezés esetén a már megfizetett foglalási díj automatikusan átvezetésre kerül az új időpontra; újabb foglalási díj megfizetése nem szükséges. Az új időpontra a jelen Szabályzat rendelkezései változatlanul irányadók, a lemondási határidőket az új időponthoz kell számítani.",
    ),
    p(
      "A foglalt időpontot megelőző 24 órán belül az online áthelyezés már nem lehetséges. Ebben az esetben kérjük, hívja a rendelőt a +36 70 639 5239 telefonszámon.",
    ),

    h2("5. Lemondás és a foglalási díj visszatérítése"),
    p(
      "A lefoglalt időpont a foglaláskezelő hivatkozáson keresztül ",
      { b: "bármikor, határidő nélkül lemondható" },
      " – a foglalt időpontot megelőző 48 órán belül is. A lemondás lehetőségét a Szolgáltató nem korlátozza; a lemondás időpontja kizárólag a megfizetett foglalási díj sorsát befolyásolja:",
    ),
    li(
      "Ha a lemondás a foglalt időpontot megelőzően ",
      { b: "legalább 48 órával" },
      " megtörténik, a Szolgáltató a teljes 10.000 Ft foglalási díjat visszatéríti.",
    ),
    li(
      "Ha a lemondás a foglalt időpontot megelőző ",
      { b: "48 órán belül" },
      " történik, a foglalási díj nem kerül visszatérítésre.",
    ),
    p(
      "A 48 órás határidő számítása minden esetben a foglalt időpont magyarországi (Europe/Budapest) helyi ideje szerint történik. A rendszer a lemondás során egyértelműen jelzi, ha a lemondás a díj elvesztésével jár, és a lemondás ilyenkor csak a Páciens külön megerősítése után hajtódik végre.",
    ),
    p(
      "A visszatérítés minden esetben a Stripe rendszerén keresztül, arra a bankkártyára történik, amellyel a fizetés eredetileg történt; készpénzes vagy más fizetési módra történő visszatérítésre nincs mód. A visszatérítés a Szolgáltató oldalán haladéktalanul elindul, azonban az összeg jóváírásának ideje a kártyakibocsátó banktól függ, és jellemzően 5–10 munkanapot vesz igénybe.",
    ),
    p(
      "A visszatérített foglalási díjról a Szolgáltató jóváíró (helyesbítő) számlát állít ki, amelyet e-mailben küld meg a Páciens részére.",
    ),

    h2("6. Meg nem jelenés (no-show) és késés"),
    p(
      "Amennyiben a Páciens a lefoglalt időpontban nem jelenik meg, és távolmaradását előzetesen nem jelezte, a foglalás meg nem jelenésnek minősül. Ebben az esetben a megfizetett ",
      { b: "10.000 Ft foglalási díj nem kerül visszatérítésre" },
      ", és az új időpontra nem vezethető át.",
    ),
    p(
      "Amennyiben a Páciens a lefoglalt időponthoz képest késve érkezik, a vizsgálat elvégzése nem garantált, mert az a további Pácienseket is érintő csúszást okozna. A rendelő törekszik arra, hogy a késve érkező Pácienst is fogadja, erre azonban kizárólag az aznapi beosztás függvényében van lehetőség. Ha a vizsgálat a késés miatt nem végezhető el, az meg nem jelenésnek minősül.",
    ),
    p(
      "Az ismételt, előzetes jelzés nélküli meg nem jelenés esetén a Szolgáltató fenntartja a jogot, hogy a Páciens további online foglalási lehetőségét korlátozza, és a további időpontokat kizárólag telefonos egyeztetés alapján biztosítsa.",
    ),

    h2("7. Részleges visszatérítés és méltányossági elbírálás"),
    p(
      "A Szolgáltató a 48 órás határidőn belüli lemondás, illetve meg nem jelenés esetén is méltányosságot gyakorolhat, és a foglalási díjat egészben vagy részben visszatérítheti, illetve azt – a Páciens kérésére – új időpontra átvezetheti. Ilyen, méltányosságot megalapozó eset lehet különösen:",
    ),
    li("a Páciens vagy közeli hozzátartozója hirtelen fellépő betegsége, kórházi felvétele;"),
    li("közeli hozzátartozó halála;"),
    li(
      "a Páciensen kívül álló, elháríthatatlan akadály (például igazolt közlekedési üzemzavar, természeti katasztrófa, hatósági intézkedés);",
    ),
    li(
      "olyan technikai hiba, amely a Pácienst a határidőn belüli lemondásban bizonyíthatóan megakadályozta.",
    ),
    p(
      "A méltányossági kérelmet a lemondást vagy az elmaradt időpontot követő 8 napon belül, írásban, a ",
      { a: "recepcio@drmoroczangela.hu", href: "mailto:recepcio@drmoroczangela.hu" },
      " e-mail címre kell benyújtani, a foglalási azonosító megadásával és a körülmények rövid ismertetésével. A Szolgáltató a kérelmet egyedileg bírálja el, és döntéséről a kérelem beérkezésétől számított 15 napon belül írásban tájékoztatja a Pácienst. A méltányosság gyakorlása a Szolgáltató mérlegelési jogkörébe tartozik, arra a Páciens alanyi jogosultsággal nem rendelkezik.",
    ),

    h2("8. Rendkívüli esetek – a Szolgáltató oldalán felmerülő akadály"),
    p(
      "Amennyiben a lefoglalt időpont a Szolgáltató érdekkörében felmerülő okból (például az orvos betegsége, sürgős szülészeti ellátás, a rendelő működését akadályozó műszaki hiba, hatósági intézkedés vagy vis maior esemény miatt) marad el, a Szolgáltató erről a Pácienst a rendelkezésre álló elérhetőségén haladéktalanul értesíti, és a Páciens választása szerint:",
    ),
    li("díjmentesen új időpontot biztosít, amelyre a foglalási díj átvezetésre kerül; vagy"),
    li("a teljes 10.000 Ft foglalási díjat visszatéríti."),
    p(
      "Vis maior eseménynek minősül minden olyan, a felek érdekkörén kívül eső, előre nem látható és elháríthatatlan körülmény, amely a szolgáltatás nyújtását akadályozza (így különösen természeti katasztrófa, járvány, hatósági korlátozás, tartós áramkimaradás vagy távközlési üzemzavar).",
    ),

    h2("9. A foglalás Szolgáltató általi törlése"),
    p("A Szolgáltató jogosult a foglalást egyoldalúan törölni, ha:"),
    li("a foglalás nyilvánvalóan valótlan vagy hiányos adatokkal jött létre;"),
    li("a foglalási díj megfizetése nem történt meg, vagy a fizetés sikertelen volt;"),
    li(
      "a foglalás visszaélésszerű (például ugyanarra az időpontra több, párhuzamos foglalás jött létre);",
    ),
    li(
      "a Páciens az egészségügyi személyzettel szemben tanúsított magatartásával a rendelő működését akadályozza.",
    ),
    p(
      "Ha a törlésre nem a Páciensnek felróható okból kerül sor, a Szolgáltató a megfizetett foglalási díjat teljes egészében visszatéríti.",
    ),

    h2("10. Kapcsolat és panaszkezelés"),
    p(
      "A foglalással, lemondással vagy visszatérítéssel kapcsolatos kérdéseit és panaszait az alábbi elérhetőségeken jelezheti:",
    ),
    li({ b: "E-mail:" }, " ", {
      a: "recepcio@drmoroczangela.hu",
      href: "mailto:recepcio@drmoroczangela.hu",
    }),
    li({ b: "Telefon:" }, " +36 70 639 5239"),
    li({ b: "Postai cím:" }, " Mórocz Medical Kft., 2500 Esztergom, Martsa Alajos utca 6/C."),
    p(
      "A Szolgáltató a panaszt a beérkezéstől számított 30 napon belül kivizsgálja, és álláspontjáról írásban tájékoztatja a Pácienst.",
    ),

    h2("11. A Szabályzat módosítása"),
    p(
      "A Szolgáltató jogosult a jelen Szabályzatot egyoldalúan módosítani. A mindenkor hatályos változat a drmoroczangela.hu weboldalon érhető el. A már létrejött foglalásokra minden esetben a foglalás időpontjában hatályos Szabályzat rendelkezései irányadók.",
    ),
  ];
}

// ─── 3. Stripe data-processor section for the privacy policy ──────────────────

function stripeSection() {
  const { h2, h3, p, li } = makeBuilders("stripe-");
  return [
    h2("Adatfeldolgozó a fizetési folyamatban — Stripe"),
    p(
      "A weboldalon indított időpontfoglalás foglalási díjának online megfizetését a Stripe fizetési rendszere bonyolítja le. A fizetési szolgáltató a ",
      { b: "Stripe Payments Europe, Limited" },
      " (székhely: 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Írország), amely a fizetési tranzakció végrehajtása körében a Társaság ",
      { b: "adatfeldolgozójaként" },
      " jár el, azaz a személyes adatokat a Társaság utasítása szerint, a fizetés teljesítése céljából kezeli.",
    ),
    p(
      "A Stripe ugyanakkor a csalásmegelőzés, a kockázatkezelés, valamint a rá vonatkozó pénzügyi, pénzmosás elleni és számviteli jogszabályi kötelezettségek teljesítése körében önálló adatkezelőnek minősül; ezen adatkezelésekre a Stripe saját adatvédelmi tájékoztatója irányadó.",
    ),

    h3("Milyen adatokat továbbítunk a Stripe részére?"),
    p(
      "A fizetés elindításakor a Társaság a következő adatokat továbbítja a Stripe részére, kizárólag a tranzakció lebonyolításához szükséges mértékben:",
    ),
    li("a foglaló neve;"),
    li(
      "a foglaló e-mail címe (a fizetési oldal kitöltéséhez és a fizetési visszaigazolás megküldéséhez);",
    ),
    li("a foglaló telefonszáma;"),
    li(
      "a foglalás azonosítói: a foglalási szám, a belső foglalásazonosító, valamint a foglalás kezelésére szolgáló egyedi azonosító;",
    ),
    li(
      "az igénybe venni kívánt szolgáltatás megnevezése, továbbá a lefoglalt időpont dátuma és időpontja (a fizetési tétel megnevezéseként);",
    ),
    li("a fizetendő összeg és pénzneme (10.000 Ft foglalási díj);"),
    li(
      "céges (adószámos) számla igénylése esetén a számlázási név, az adószám, valamint a számlázási cím (irányítószám, település, utca és házszám).",
    ),

    h3("Milyen adatokat ad meg Ön közvetlenül a Stripe részére?"),
    p(
      "A fizetés a Stripe saját, biztonságos fizetőoldalán történik. Az alábbi adatokat Ön közvetlenül a Stripe részére adja meg; ezekhez a Társaság nem fér hozzá, azokat nem kezeli és nem tárolja:",
    ),
    li("a bankkártya száma, lejárati dátuma és ellenőrző kódja (CVC);"),
    li("a kártyabirtokos neve;"),
    li("a Stripe által a fizetés során kötelezően bekért számlázási cím."),

    h3("Milyen adatokat kapunk vissza a Stripe-tól?"),
    p(
      "A Stripe a fizetés eredményéről értesíti a Társaságot. Ennek alapján a foglaláshoz kizárólag a következő adatokat rögzítjük: a fizetés státusza (sikeres, függőben lévő vagy sikertelen), a megfizetett összeg, a Stripe fizetési munkamenetének és tranzakciójának azonosítója, valamint — visszatérítés esetén — a visszatérítés azonosítója és státusza. ",
      {
        b: "Bankkártyaadatot a Stripe nem ad át a Társaság részére; ilyen adatot nem kezelünk és nem tárolunk.",
      },
    ),

    h3("Az adatkezelés jogalapja és időtartama"),
    p(
      "A fizetéssel összefüggő adatkezelés jogalapja a szerződés teljesítése (GDPR 6. cikk (1) bekezdés b) pont), a számviteli bizonylatok megőrzése körében pedig a Társaságra vonatkozó jogi kötelezettség teljesítése (GDPR 6. cikk (1) bekezdés c) pont), a számvitelről szóló 2000. évi C. törvény 169. § (2) bekezdése alapján, 8 éves megőrzési idővel. A Stripe csalásmegelőzési célú adatkezelésének jogalapja a Stripe, illetve a Társaság jogos érdeke (GDPR 6. cikk (1) bekezdés f) pont).",
    ),

    h3("Adattovábbítás harmadik országba"),
    p(
      "A Stripe az adatokat az Európai Gazdasági Térségen kívülre — így különösen az Amerikai Egyesült Államokba — is továbbíthatja, az Európai Bizottság által elfogadott általános szerződési feltételeken (SCC) alapuló garanciák mellett. A Stripe adatkezeléséről részletesen a Stripe adatvédelmi tájékoztatójában tájékozódhat: ",
      { a: "https://stripe.com/privacy", href: "https://stripe.com/privacy" },
      ".",
    ),
  ];
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  const terms = {
    _id: "termsOfService",
    _type: "termsOfService",
    title: "Felhasználási Feltételek",
    lastUpdated: EFFECTIVE_DATE,
    body: termsBody(),
  };

  const policy = {
    _id: "bookingPolicy",
    _type: "bookingPolicy",
    title: "Foglalási és Lemondási Szabályzat",
    lastUpdated: EFFECTIVE_DATE,
    body: bookingPolicyBody(),
  };

  const existing = await client.getDocument("privacyPolicy");
  if (!existing) throw new Error("privacyPolicy document not found — aborting.");

  const kept = (existing.body ?? []).filter((b) => !String(b._key ?? "").startsWith("stripe-"));
  const removed = (existing.body ?? []).length - kept.length;
  const newPrivacyBody = [...kept, ...stripeSection()];

  console.log(
    `termsOfService: ${terms.body.length} blocks\n` +
      `bookingPolicy: ${policy.body.length} blocks\n` +
      `privacyPolicy: ${kept.length} kept (${removed} previously-seeded Stripe blocks removed) ` +
      `+ ${newPrivacyBody.length - kept.length} Stripe blocks = ${newPrivacyBody.length}`,
  );

  if (DRY) {
    console.log("--dry: nothing written.");
    return;
  }

  await client.createOrReplace(terms);
  await client.createOrReplace(policy);
  await client
    .patch("privacyPolicy")
    .set({ body: newPrivacyBody, lastUpdated: EFFECTIVE_DATE })
    .commit();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
