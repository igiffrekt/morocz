import { formatFt } from "@/lib/service-menu";
import { ICON_PATHS } from "./PathIcon";

export interface InfoItem {
  title: string;
  body: string;
  highlight?: string;
  icon: string;
}

export interface InfoGroup {
  value: string;
  label: string;
  /** Tab label on phones. */
  short: string;
  items: InfoItem[];
}

interface InfoContentInput {
  /** Reception phone / e-mail (Sanity site settings). */
  phone?: string;
  email?: string;
  /** "12 000 Ft" — Sanity price of "Szakorvosi dokumentáció (igazolás) kiállítása". */
  certificatePrice?: string | null;
}

/**
 * Fontos tudnivalók copy (kept in code, see PLAN.md): the former ImportantInfoSection
 * items plus the price-page notes, corrected — 48 h cancellation rule, Sanity
 * certificate fee, "Czeizel".
 */
export function buildInfoGroups({ phone, email, certificatePrice }: InfoContentInput): InfoGroup[] {
  // Two lines so the long address never breaks mid-word in a 300px card.
  const reception = [email, phone].filter(Boolean).join("\n");
  return [
    {
      value: "foglalas",
      label: "Foglalás és elérhetőség",
      short: "Foglalás",
      items: [
        {
          title: "Időpontfoglalás",
          body: "Rendelésre bejelentkezni vagy időpontot egyeztetni kizárólag online lehetséges. A foglalt időpont a visszaigazoló e-mailben kapott linken keresztül bármikor lemondható.",
          highlight: `48 órán belüli lemondásnál a ${formatFt(10_000)} foglalási díj nem jár vissza`,
          icon: ICON_PATHS.cal,
        },
        {
          title: "Sürgősségi ellátás",
          body: "Telefonon csak a rendelési időben vagyunk elérhetőek. Sürgős esetben rendelési időben telefonon, rendelési időn kívül pedig e-mailben vegyék fel velünk a kapcsolatot.",
          highlight: "drmoroczangela@gmail.com",
          icon: ICON_PATHS.alert,
        },
        {
          title: "Egyéb kérdések",
          body: "Időpontfoglalással kapcsolatos, illetve egyéb technikai kérdéseiket az alábbi e-mail címre legyenek kedvesek írni.",
          highlight: reception || undefined,
          icon: ICON_PATHS.help,
        },
        {
          title: "Diagnózis felállítása",
          body: "Elektronikus úton részletezett panaszok, tünetek és fotók alapján diagnózist felállítani nem tudok. Ilyen esetekben vizsgálat szükséges, kérem jelentkezzen be online időpontra.",
          icon: ICON_PATHS.search,
        },
      ],
    },
    {
      value: "leletek",
      label: "Leletek és recept",
      short: "Leletek, recept",
      items: [
        {
          title: "Gyógyszer igénylés",
          body: "Rendszeresen szedett fogamzásgátló gyógyszerek igényét az alábbi e-mail címre jelezzék. Gyógyszert felírni csak a rendelési napokon tudunk.",
          highlight: "gyogyszer@drmoroczangela.hu",
          icon: ICON_PATHS.pill,
        },
        {
          title: "E-recept",
          body: "Rendszeresen szedett fogamzásgátló gyógyszer felírása E-recept formájában ingyenes, amennyiben 1 éven belüli méhnyakszűrés történt rendelőnkben. Recept felírása vizsgálat alkalmával díjtalan.",
          icon: ICON_PATHS.rx,
        },
        {
          title: "Leletek beadása",
          body: "Leleteket, eredményeket az alábbi e-mail címre várjuk.",
          highlight: "drmoroczangela@gmail.com",
          icon: ICON_PATHS.upload,
        },
        {
          title: "Leletek küldése",
          body: "Leletek elektronikus úton történő megküldése és kiértékelése kizárólag előzetes kérésem után történhet. Minden egyéb esetben személyes konzultáció szükséges az eredményekkel.",
          highlight: "Várandósgondozást elektronikus úton nem végzek",
          icon: ICON_PATHS.mail,
        },
        {
          title: "Eredmények",
          body: "Eredményeik az EESZT rendszerbe kerülnek feltöltésre, melyet lakossági portáljukon belépve tekinthetnek meg.",
          icon: ICON_PATHS.check,
        },
      ],
    },
    {
      value: "dijak",
      label: "Díjak és egyebek",
      short: "Díjak, egyéb",
      items: [
        {
          title: "Vizsgálati díjak",
          body: "A vizsgálati díjak tartalmazzák a mintakezelési, leletkezelési és adminisztrációs költséget is.",
          icon: ICON_PATHS.coin,
        },
        {
          title: "Igazolások kiállítása",
          body: "Elektronikus úton igazolást nem tudunk kiállítani. Időpontfoglalás nélkül, rendelési idő alatt személyes megjelenést követően állítjuk ki a kért igazolásokat.",
          highlight: certificatePrice ? `Szakorvosi igazolás díja: ${certificatePrice}` : undefined,
          icon: ICON_PATHS.cert,
        },
        {
          title: "Egészségpénztár",
          body: "Egészségpénztárakkal nem állok szerződésben, ezért számlát nem tudok kiállítani.",
          icon: ICON_PATHS.card,
        },
        {
          title: "Intimtorna tanfolyam",
          body: "Csoportos hétvégi tanfolyamok egyéni tornaterv átadásával és 1 hónapig online konzultációs lehetőséggel.",
          highlight: formatFt(40_000),
          icon: ICON_PATHS.heart,
        },
        {
          title: "Magzati genetikai ultrahang",
          body: "Magzati genetikai ultrahangot nem végzek.",
          highlight: "Ajánlott intézmény: Czeizel Intézet, Budapest",
          icon: ICON_PATHS.baby,
        },
      ],
    },
  ];
}

/** The four notes of the "Szolgáltatások és Árak" page, in its order. */
export const PRICE_PAGE_INFO_TITLES = [
  "E-recept",
  "Vizsgálati díjak",
  "Eredmények",
  "Magzati genetikai ultrahang",
] as const;

/** Info items by title (same copy as the homepage tabs), in the requested order. */
export function pickInfoItems(groups: InfoGroup[], titles: readonly string[]): InfoItem[] {
  const all = groups.flatMap((g) => g.items);
  return titles
    .map((title) => all.find((item) => item.title === title))
    .filter((item): item is InfoItem => Boolean(item));
}
