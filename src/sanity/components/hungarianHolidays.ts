export interface HungarianHoliday {
  date: string;
  name: string;
}

/**
 * Anonymous Gregorian algorithm (Computus) for Easter Sunday.
 * Pure function — no external dependencies.
 */
function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getHungarianHolidays(year: number): HungarianHoliday[] {
  const easter = computeEasterSunday(year);

  return [
    { date: `${year}-01-01`, name: "Újév" },
    { date: `${year}-03-15`, name: "Nemzeti ünnep" },
    { date: formatDate(addDays(easter, -2)), name: "Nagypéntek" },
    { date: formatDate(addDays(easter, 1)), name: "Húsvéthétfő" },
    { date: `${year}-05-01`, name: "A munka ünnepe" },
    { date: formatDate(addDays(easter, 50)), name: "Pünkösdhétfő" },
    { date: `${year}-08-20`, name: "Az államalapítás ünnepe" },
    { date: `${year}-10-23`, name: "Az 1956-os forradalom ünnepe" },
    { date: `${year}-11-01`, name: "Mindenszentek" },
    { date: `${year}-12-25`, name: "Karácsony első napja" },
    { date: `${year}-12-26`, name: "Karácsony második napja" },
  ];
}
