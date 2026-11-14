import { type BudapestClock, toMinutes } from "@/lib/clinic-status";

/** Monday-first weekday numbers used by the yoga timetable (1 = hétfő … 7 = vasárnap). */
export const YOGA_DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type YogaDayKey = (typeof YOGA_DAY_KEYS)[number];

export const YOGA_DAY_NAMES = [
  "",
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
  "Vasárnap",
] as const;

export const YOGA_DAY_SHORT = ["", "H", "K", "Sze", "Cs", "P", "Szo", "V"] as const;

const DAY_SLUGS = ["", "hetfo", "kedd", "szerda", "csutortok", "pentek", "szombat", "vasarnap"];

/**
 * Fallback class colours of the live /joga page, assigned to the class names in
 * alphabetical order when the Sanity yogaClass has no colour of its own.
 */
export const DEFAULT_CLASS_COLORS = [
  "#76c8b6",
  "#e1bbcd",
  "#c4dfe6",
  "#f9e4b7",
  "#d4c4fb",
  "#ffd6cc",
  "#fdf8eb",
  "#e8f3ee",
  "#ffebe4",
  "#e7c1d3",
  "#b8d4e3",
  "#c9e4ca",
] as const;

export const DEFAULT_INSTRUCTOR_COLOR = "#76c8b6";

/** Rough perceived lightness check: dark backgrounds get white text. */
export function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(h)) return false;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "Facebook" / "Instagram" / host name for an instructor link without a label. */
export function linkLabel(label: string | null | undefined, url: string): string {
  if (label?.trim()) return label.trim();
  if (/facebook\.com|fb\.me/i.test(url)) return "Facebook";
  if (/instagram\.com/i.test(url)) return "Instagram";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const URL_ONLY = /^https?:\/\/\S+$/i;

// ─── Input shapes (Sanity query results, already stripped of image objects) ─────

export interface YogaScheduleInput {
  _id: string;
  className: string | null;
  classColor: string | null;
  /** Portable Text of the yogaClass (kept opaque here). */
  description: unknown[] | null;
  instructorName: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  recurrence: string | null;
  location: string | null;
  notes: string | null;
}

export interface YogaInstructorInput {
  _id: string;
  name: string | null;
  slug: string | null;
  photoUrl: string | null;
  /** Small square avatar (modal header, chips). */
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  color: string | null;
  links: Array<{ label: string; url: string }>;
}

// ─── Normalised timetable ───────────────────────────────────────────────────────

export interface YogaSession {
  id: string;
  /** Deep-link slug (?ora=…), identical to the previous /joga page. */
  slug: string;
  /** 1 = hétfő … 7 = vasárnap. */
  day: number;
  start: string;
  end: string;
  className: string;
  color: string;
  /** Text colour that reads on `color`. */
  ink: string;
  description: unknown[] | null;
  instructor: string;
  location: string | null;
  notes: string | null;
  /** "Páros hét" / "Páratlan hét" for biweekly classes. */
  recurrence: string | null;
}

export interface YogaInstructor {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  avatarUrl: string | null;
  /** Bio paragraphs (blank lines in Sanity split them). */
  bio: string[];
  phone: string | null;
  email: string | null;
  color: string;
  ink: string;
  links: Array<{ label: string; url: string }>;
}

export interface YogaClassType {
  name: string;
  color: string;
}

export interface YogaTimetable {
  sessions: YogaSession[];
  classes: YogaClassType[];
  instructors: YogaInstructor[];
}

function recurrenceLabel(value: string | null): string | null {
  if (value === "biweekly-even") return "Páros hét";
  if (value === "biweekly-odd") return "Páratlan hét";
  return null;
}

/**
 * Sanity yogaSchedule + yogaInstructor → the /joga timetable. Class colours: the
 * yogaClass colour, else DEFAULT_CLASS_COLORS by alphabetical class order (same
 * rule as the live page). Sessions are sorted Monday-first, then by start time.
 */
export function buildYogaTimetable(
  schedule: readonly YogaScheduleInput[],
  instructors: readonly YogaInstructorInput[],
): YogaTimetable {
  const valid = schedule
    .map((s) => ({ ...s, day: YOGA_DAY_KEYS.indexOf(s.dayOfWeek as YogaDayKey) + 1 }))
    .filter(
      (s): s is typeof s & { className: string; startTime: string; endTime: string } =>
        s.day > 0 && Boolean(s.className && s.startTime && s.endTime),
    );

  const names = [...new Set(valid.map((s) => s.className))].sort();
  const colorOf = new Map<string, string>();
  names.forEach((name, index) => {
    const own = valid.find((s) => s.className === name && s.classColor)?.classColor;
    colorOf.set(
      name,
      own || DEFAULT_CLASS_COLORS[index % DEFAULT_CLASS_COLORS.length] || "#76c8b6",
    );
  });

  const sessions: YogaSession[] = valid
    .map((s) => {
      const color = colorOf.get(s.className) ?? "#76c8b6";
      return {
        id: s._id,
        slug: `${slugify(s.className)}-${DAY_SLUGS[s.day]}-${s.startTime.replace(":", "")}`,
        day: s.day,
        start: s.startTime,
        end: s.endTime,
        className: s.className,
        color,
        ink: isDarkColor(color) ? "#ffffff" : "#242a5f",
        description: s.description?.length ? s.description : null,
        instructor: s.instructorName ?? "",
        location: s.location?.trim() || null,
        notes: s.notes?.trim() || null,
        recurrence: recurrenceLabel(s.recurrence),
      };
    })
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

  const people: YogaInstructor[] = instructors
    .filter((i): i is YogaInstructorInput & { name: string } => Boolean(i.name))
    .map((i) => {
      const color = i.color || DEFAULT_INSTRUCTOR_COLOR;
      const paragraphs = (i.bio ?? "")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      // A paragraph that is only a URL (e.g. a Facebook page) becomes a contact link.
      const bioLinks = paragraphs
        .filter((p) => URL_ONLY.test(p) && !i.links.some((l) => l.url === p))
        .map((url) => ({ label: linkLabel(null, url), url }));
      return {
        id: i._id,
        slug: i.slug || slugify(i.name),
        name: i.name,
        photoUrl: i.photoUrl,
        avatarUrl: i.avatarUrl,
        bio: paragraphs.filter((p) => !URL_ONLY.test(p)),
        phone: i.phone?.trim() || null,
        email: i.email?.trim() || null,
        color,
        ink: isDarkColor(color) ? "#ffffff" : "#242a5f",
        links: [...i.links, ...bioLinks],
      };
    });

  return {
    sessions,
    classes: names.map((name) => ({ name, color: colorOf.get(name) ?? "#76c8b6" })),
    instructors: people,
  };
}

/** Whole-hour range of the calendar grid (earliest start → latest end). */
export function hourRange(sessions: readonly YogaSession[]): { from: number; to: number } {
  if (sessions.length === 0) return { from: 8, to: 20 };
  const from = Math.floor(Math.min(...sessions.map((s) => toMinutes(s.start))) / 60);
  const to = Math.ceil(Math.max(...sessions.map((s) => toMinutes(s.end))) / 60);
  return { from, to: Math.max(to, from + 1) };
}

/** Budapest weekday on the timetable's Monday-first scale. */
export function timetableDay(clock: BudapestClock): number {
  return clock.dayOfWeek === 0 ? 7 : clock.dayOfWeek;
}

export interface NextSession {
  session: YogaSession;
  /** "ma" / "holnap" / "csütörtök". */
  when: string;
}

/** The next class that has not started yet (wraps around to next week). */
export function nextSession(
  sessions: readonly YogaSession[],
  clock: BudapestClock,
): NextSession | null {
  const today = timetableDay(clock);
  let best: { session: YogaSession; delta: number } | null = null;
  for (const session of sessions) {
    let delta = (session.day - today) * 1440 + toMinutes(session.start) - clock.minutes;
    if (delta < 0) delta += 7 * 1440;
    if (!best || delta < best.delta) best = { session, delta };
  }
  if (!best) return null;
  const daysAhead = (best.session.day - today + 7) % 7;
  const when =
    daysAhead === 0 && best.delta < 1440
      ? "ma"
      : daysAhead === 1
        ? "holnap"
        : (YOGA_DAY_NAMES[best.session.day] ?? "").toLowerCase();
  return { session: best.session, when };
}

/** "90 perc" / "1 óra 10 perc" — duration chip on phones. */
export function durationLabel(start: string, end: string): string {
  const minutes = toMinutes(end) - toMinutes(start);
  if (minutes <= 0) return "";
  if (minutes < 60 || minutes % 60 === 30) return `${minutes} perc`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} óra ${rest} perc` : `${hours} óra`;
}
