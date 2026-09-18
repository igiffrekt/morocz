import { defineField } from "sanity";

const TIME_RE = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

type BreakParent = {
  isDayOff?: boolean;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
};

function validateBreak(value: string | undefined, context: { parent?: unknown }, which: "start" | "end") {
  const parent = context.parent as BreakParent;
  if (parent?.isDayOff) return true;

  const other = which === "start" ? parent?.breakEnd : parent?.breakStart;
  if (!value) {
    if (other) {
      return "Mindkét szünet-időpontot meg kell adni (kezdete és vége), vagy hagyja üresen mindkettőt.";
    }
    return true;
  }
  if (!TIME_RE.test(value)) {
    return "Érvénytelen formátum. Használjon HH:MM alakot (pl. 12:00).";
  }

  if (which === "end") {
    const { breakStart: bs, breakEnd: be, startTime: st, endTime: et } = parent;
    if (bs && be && be <= bs) {
      return "A szünet vége későbbi kell legyen, mint a kezdete.";
    }
    if (st && bs && bs < st) {
      return `A szünet nem kezdődhet a rendelés kezdete (${st}) előtt.`;
    }
    if (et && be && be > et) {
      return `A szünet nem tarthat a rendelés vége (${et}) után.`;
    }
    if (st && et && bs && be && bs <= st && be >= et) {
      return 'A szünet a teljes rendelési időt kitölti. Ha ezen a napon nincs rendelés, használja a „Szabadnap" jelölőt.';
    }
  }

  return true;
}

export const defaultSlotDurationField = defineField({
  name: "defaultSlotDuration",
  title: "Alapértelmezett időpont hossz (perc)",
  type: "number",
  options: {
    list: [
      { title: "10 perc", value: 10 },
      { title: "15 perc", value: 15 },
      { title: "20 perc", value: 20 },
      { title: "30 perc", value: 30 },
      { title: "45 perc", value: 45 },
      { title: "60 perc", value: 60 },
    ],
  },
  initialValue: 20,
  validation: (rule) => rule.required(),
});

export const bufferMinutesField = defineField({
  name: "bufferMinutes",
  title: "Szünet időpontok között (perc)",
  type: "number",
  description: "Perc szünet két időpont között (0 = nincs szünet)",
  initialValue: 0,
  validation: (rule) => rule.min(0),
});

export const breakStartField = defineField({
  name: "breakStart",
  title: "Napi szünet kezdete",
  type: "string",
  description:
    "Ebben az idősávban nem lehet időpontot foglalni (pl. ebédszünet). Hagyja üresen, ha nincs szünet. Formátum: HH:MM (pl. 12:00). Kerek időt adjon meg (0/20/40 perc), mert az időpontok 20 perces rácson állnak.",
  hidden: ({ parent }) => !!(parent as BreakParent)?.isDayOff,
  validation: (rule) => rule.custom((value, context) => validateBreak(value, context, "start")),
});

export const breakEndField = defineField({
  name: "breakEnd",
  title: "Napi szünet vége",
  type: "string",
  description: "A szünet vége. Ettől az időponttól újra lehet foglalni. Formátum: HH:MM (pl. 13:00).",
  hidden: ({ parent }) => !!(parent as BreakParent)?.isDayOff,
  validation: (rule) => rule.custom((value, context) => validateBreak(value, context, "end")),
});

export const daysField = defineField({
  name: "days",
  title: "Munkanapok",
  type: "array",
  of: [
    {
      type: "object",
      fields: [
        defineField({
          name: "dayOfWeek",
          title: "Nap",
          type: "number",
          options: {
            list: [
              { title: "Hétfő", value: 1 },
              { title: "Kedd", value: 2 },
              { title: "Szerda", value: 3 },
              { title: "Csütörtök", value: 4 },
              { title: "Péntek", value: 5 },
              { title: "Szombat", value: 6 },
              { title: "Vasárnap", value: 0 },
            ],
          },
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "isDayOff",
          title: "Szabadnap",
          type: "boolean",
          description: "Jelölje be, ha ezen a napon nincs rendelés",
          initialValue: false,
        }),
        defineField({
          name: "startTime",
          title: "Kezdés",
          type: "string",
          description: "Formátum: HH:MM (pl. 08:00)",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { isDayOff?: boolean };
              if (!parent?.isDayOff && !value) return "Kötelező, ha nem szabadnap";
              return true;
            }),
        }),
        defineField({
          name: "endTime",
          title: "Befejezés",
          type: "string",
          description: "Formátum: HH:MM (pl. 16:00)",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { isDayOff?: boolean };
              if (!parent?.isDayOff && !value) return "Kötelező, ha nem szabadnap";
              return true;
            }),
        }),
        breakStartField,
        breakEndField,
      ],
      preview: {
        select: {
          dayOfWeek: "dayOfWeek",
          isDayOff: "isDayOff",
          startTime: "startTime",
          endTime: "endTime",
          breakStart: "breakStart",
          breakEnd: "breakEnd",
        },
        prepare({ dayOfWeek, isDayOff, startTime, endTime, breakStart, breakEnd }) {
          const dayNames: Record<number, string> = {
            0: "Vasárnap",
            1: "Hétfő",
            2: "Kedd",
            3: "Szerda",
            4: "Csütörtök",
            5: "Péntek",
            6: "Szombat",
          };
          const dayName = dayNames[dayOfWeek as number] ?? "Ismeretlen nap";
          const subtitle = isDayOff
            ? "Szabadnap"
            : startTime && endTime
              ? breakStart && breakEnd
                ? `${startTime} – ${endTime} · szünet ${breakStart}–${breakEnd}`
                : `${startTime} – ${endTime}`
              : "Nincs beállítva";
          return { title: dayName, subtitle };
        },
      },
    },
  ],
  initialValue: [
    { _key: "mon", dayOfWeek: 1, isDayOff: false, startTime: "", endTime: "" },
    { _key: "tue", dayOfWeek: 2, isDayOff: false, startTime: "", endTime: "" },
    { _key: "wed", dayOfWeek: 3, isDayOff: false, startTime: "", endTime: "" },
    { _key: "thu", dayOfWeek: 4, isDayOff: false, startTime: "", endTime: "" },
    { _key: "fri", dayOfWeek: 5, isDayOff: false, startTime: "", endTime: "" },
    { _key: "sat", dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
    { _key: "sun", dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
  ],
  validation: (rule) => rule.length(7).error("Pontosan 7 napnak kell lennie"),
});
