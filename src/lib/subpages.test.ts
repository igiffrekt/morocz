import { describe, expect, it } from "vitest";
import { assetDimensions, portraitFaceRect, readingMinutes, segmentArticle } from "./blog";
import { budapestClock, type ClinicSchedule, clinicStatus, hoursOnDate } from "./clinic-status";
import {
  buildYogaTimetable,
  DEFAULT_CLASS_COLORS,
  durationLabel,
  hourRange,
  isDarkColor,
  nextSession,
  type YogaInstructorInput,
  type YogaScheduleInput,
} from "./yoga";

// Budapest is UTC+1 in November. 2026-11-16 is a Monday.
const at = (day: number, hour: number, minute = 0) => Date.UTC(2026, 10, day, hour - 1, minute);

const schedule: ClinicSchedule = {
  weeklyDays: [
    { dayOfWeek: 1, isDayOff: false, startTime: "12:00", endTime: "15:20" },
    { dayOfWeek: 2, isDayOff: false, startTime: "12:00", endTime: "15:20" },
    { dayOfWeek: 3, isDayOff: true, startTime: "", endTime: "" },
    { dayOfWeek: 4, isDayOff: false, startTime: "13:00", endTime: "16:40" },
  ],
  seasonals: [
    {
      startDate: "2026-11-01",
      endDate: "2026-12-31",
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [
        { dayOfWeek: 1, isDayOff: true, startTime: "", endTime: "" },
        { dayOfWeek: 2, isDayOff: false, startTime: "13:20", endTime: "16:40" },
        { dayOfWeek: 3, isDayOff: false, startTime: "11:00", endTime: "14:20" },
        { dayOfWeek: 4, isDayOff: false, startTime: "13:20", endTime: "16:40" },
      ],
    },
  ],
  blockedDates: [],
  customAvailability: [],
};

describe("budapestClock", () => {
  it("reads the Budapest wall clock", () => {
    expect(budapestClock(at(17, 13, 30))).toEqual({
      date: "2026-11-17",
      dayOfWeek: 2,
      minutes: 13 * 60 + 30,
    });
  });

  it("rolls over to the next Budapest day before UTC does", () => {
    expect(budapestClock(Date.UTC(2026, 10, 16, 23, 30)).date).toBe("2026-11-17");
  });
});

describe("clinicStatus", () => {
  it("is open during today's seasonal hours", () => {
    expect(clinicStatus(schedule, at(17, 13, 30))).toEqual({
      state: "open",
      title: "Most rendelünk",
      nextLabel: "Mai rendelési idő",
      nextValue: "13:20 – 16:40",
    });
  });

  it("announces a later session today", () => {
    const status = clinicStatus(schedule, at(17, 9));
    expect(status.state).toBe("later");
    expect(status.title).toBe("Ma rendelünk");
  });

  it("points to the next consulting day once today is over", () => {
    expect(clinicStatus(schedule, at(17, 17))).toEqual({
      state: "closed",
      title: "Ma már nem rendelünk",
      nextLabel: "Következő rendelési nap",
      nextValue: "Szerda, november 18. · 11:00 – 14:20",
    });
  });

  it("skips blocked dates and says 'Ma nincs rendelés' on a day off", () => {
    const status = clinicStatus({ ...schedule, blockedDates: ["2026-11-17"] }, at(16, 10));
    expect(status.title).toBe("Ma nincs rendelés");
    expect(status.nextValue).toBe("Szerda, november 18. · 11:00 – 14:20");
  });

  it("honours custom availability (and it unblocks the date)", () => {
    const custom: ClinicSchedule = {
      ...schedule,
      blockedDates: ["2026-11-16"],
      customAvailability: [
        { date: "2026-11-16", startTime: "09:00", endTime: "12:00", serviceIds: null },
      ],
    };
    expect(hoursOnDate(custom, "2026-11-16")).toEqual({ start: "09:00", end: "12:00" });
    expect(clinicStatus(custom, at(16, 10)).state).toBe("open");
  });
});

const row = (
  over: Partial<YogaScheduleInput> & Pick<YogaScheduleInput, "_id">,
): YogaScheduleInput => ({
  className: "Hatha Jóga",
  classColor: null,
  description: null,
  instructorName: "Rinyu Bea",
  dayOfWeek: "tuesday",
  startTime: "17:00",
  endTime: "18:30",
  recurrence: "weekly",
  location: null,
  notes: null,
  ...over,
});

const yoga = [
  row({
    _id: "a",
    className: "Yin jóga",
    dayOfWeek: "friday",
    startTime: "19:00",
    endTime: "20:30",
  }),
  row({ _id: "b" }),
  row({
    _id: "c",
    className: "Kismama jóga",
    dayOfWeek: "wednesday",
    startTime: "08:30",
    endTime: "09:40",
  }),
  row({
    _id: "d",
    className: "Tánc",
    dayOfWeek: "wednesday",
    startTime: "19:00",
    endTime: "20:00",
    classColor: "#242a5f",
  }),
  row({
    _id: "e",
    dayOfWeek: "tuesday",
    startTime: "19:00",
    endTime: "20:30",
    recurrence: "biweekly-odd",
  }),
  row({ _id: "x", className: null }),
];

const instructor: YogaInstructorInput = {
  _id: "i1",
  name: "Rinyu Bea",
  slug: "rinyu-bea-joga",
  photoUrl: null,
  avatarUrl: null,
  bio: "Első bekezdés.\n\nMásodik bekezdés.\n\nhttps://www.facebook.com/share/abc/",
  phone: "+36 20 911 9228",
  email: null,
  color: null,
  links: [],
};

describe("buildYogaTimetable", () => {
  const timetable = buildYogaTimetable(yoga, [instructor]);

  it("sorts Monday-first by start time and drops incomplete rows", () => {
    expect(timetable.sessions.map((s) => s.id)).toEqual(["b", "e", "c", "d", "a"]);
  });

  it("assigns default colours alphabetically unless Sanity has one", () => {
    expect(timetable.classes).toEqual([
      { name: "Hatha Jóga", color: DEFAULT_CLASS_COLORS[0] },
      { name: "Kismama jóga", color: DEFAULT_CLASS_COLORS[1] },
      { name: "Tánc", color: "#242a5f" },
      { name: "Yin jóga", color: DEFAULT_CLASS_COLORS[3] },
    ]);
    expect(timetable.sessions.find((s) => s.id === "d")?.ink).toBe("#ffffff");
  });

  it("keeps the live deep-link slugs and recurrence labels", () => {
    const tuesday = timetable.sessions.find((s) => s.id === "e");
    expect(tuesday?.slug).toBe("hatha-joga-kedd-1900");
    expect(tuesday?.recurrence).toBe("Páratlan hét");
  });

  it("splits bios into paragraphs, lifts bare URLs into links, defaults the colour", () => {
    expect(timetable.instructors[0]?.bio).toEqual(["Első bekezdés.", "Második bekezdés."]);
    expect(timetable.instructors[0]?.color).toBe("#76c8b6");
    expect(timetable.instructors[0]?.links).toEqual([
      { label: "Facebook", url: "https://www.facebook.com/share/abc/" },
    ]);
  });

  it("derives the grid range from the data", () => {
    expect(hourRange(timetable.sessions)).toEqual({ from: 8, to: 21 });
  });

  it("finds the next class (today, tomorrow, later, next week)", () => {
    const tuesdayNoon = budapestClock(at(17, 12));
    expect(nextSession(timetable.sessions, tuesdayNoon)).toMatchObject({
      when: "ma",
      session: { id: "b" },
    });
    const tuesdayNight = budapestClock(at(17, 21));
    expect(nextSession(timetable.sessions, tuesdayNight)).toMatchObject({
      when: "holnap",
      session: { id: "c" },
    });
    const wednesdayNight = budapestClock(at(18, 21));
    expect(nextSession(timetable.sessions, wednesdayNight)).toMatchObject({
      when: "péntek",
      session: { id: "a" },
    });
    const saturday = budapestClock(at(21, 9));
    expect(nextSession(timetable.sessions, saturday)).toMatchObject({
      when: "kedd",
      session: { id: "b" },
    });
  });

  it("labels durations and colour contrast", () => {
    expect(durationLabel("17:00", "18:30")).toBe("90 perc");
    expect(durationLabel("19:00", "20:00")).toBe("1 óra");
    expect(durationLabel("08:30", "09:40")).toBe("1 óra 10 perc");
    expect(isDarkColor("#474466")).toBe(true);
    expect(isDarkColor("#76c8b6")).toBe(false);
  });
});

describe("blog helpers", () => {
  const p = (key: string, text: string, listItem?: string) => ({
    _type: "block",
    _key: key,
    style: "normal",
    ...(listItem ? { listItem } : {}),
    children: [{ text }],
  });

  it("reads asset dimensions and crops the portrait around the face", () => {
    expect(assetDimensions("image-f08dced2-624x842-webp")).toEqual({ width: 624, height: 842 });
    expect(assetDimensions("nope")).toBeNull();
    expect(portraitFaceRect(624, 842)).toEqual({ left: 103, top: 11, size: 324 });
    const rect = portraitFaceRect(400, 300);
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.top + rect.size).toBeLessThanOrEqual(300);
  });

  it("estimates reading time", () => {
    expect(readingMinutes([p("a", "szó ".repeat(450))])).toBe(2);
    expect(readingMinutes([])).toBe(1);
  });

  it("builds lead, callouts and plain runs, dropping empty spacers", () => {
    const segments = segmentArticle([
      p("1", "Bevezető."),
      p("2", "A megelőzés része:"),
      p("3", "önvizsgálat,", "bullet"),
      p("4", "szűrés.", "bullet"),
      p("5", ""),
      p("6", "Sima bekezdés."),
      p("7", "Mire figyeljünk?"),
      p("8", "csomó", "number"),
    ]);
    expect(segments.map((s) => s.kind)).toEqual(["lead", "callout", "blocks", "callout"]);
    const first = segments[1];
    expect(first?.kind === "callout" && first.items.length).toBe(2);
    const last = segments[3];
    expect(last?.kind === "callout" && last.ordered && last.index).toBe(1);
  });
});
