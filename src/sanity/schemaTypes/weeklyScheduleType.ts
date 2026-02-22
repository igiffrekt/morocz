import { defineField, defineType } from "sanity";

export const weeklyScheduleType = defineType({
  name: "weeklySchedule",
  title: "Heti beosztás",
  type: "document",
  fields: [
    defineField({
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
    }),
    defineField({
      name: "bufferMinutes",
      title: "Szünet időpontok között (perc)",
      type: "number",
      description: "Perc szünet két időpont között (0 = nincs szünet)",
      initialValue: 0,
      validation: (rule) => rule.min(0),
    }),
    defineField({
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
          ],
          preview: {
            select: {
              dayOfWeek: "dayOfWeek",
              isDayOff: "isDayOff",
              startTime: "startTime",
              endTime: "endTime",
            },
            prepare({ dayOfWeek, isDayOff, startTime, endTime }) {
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
                  ? `${startTime} – ${endTime}`
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
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Heti beosztás",
      };
    },
  },
});
