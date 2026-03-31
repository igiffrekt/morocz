import { defineField, defineType } from "sanity";

export const yogaScheduleType = defineType({
  name: "yogaSchedule",
  title: "Jóga órarend",
  type: "document",
  fields: [
    defineField({
      name: "yogaClass",
      title: "Jóga típus",
      type: "reference",
      to: [{ type: "yogaClass" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "instructor",
      title: "Oktató",
      type: "reference",
      to: [{ type: "yogaInstructor" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dayOfWeek",
      title: "Nap",
      type: "string",
      options: {
        list: [
          { title: "Hétfő", value: "monday" },
          { title: "Kedd", value: "tuesday" },
          { title: "Szerda", value: "wednesday" },
          { title: "Csütörtök", value: "thursday" },
          { title: "Péntek", value: "friday" },
          { title: "Szombat", value: "saturday" },
          { title: "Vasárnap", value: "sunday" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Kezdés",
      type: "string",
      description: "Pl. 09:00",
      validation: (Rule) =>
        Rule.required().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
          name: "time format",
        }),
    }),
    defineField({
      name: "endTime",
      title: "Befejezés",
      type: "string",
      description: "Pl. 10:30",
      validation: (Rule) =>
        Rule.required().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
          name: "time format",
        }),
    }),
    defineField({
      name: "recurrence",
      title: "Ismétlődés",
      type: "string",
      options: {
        list: [
          { title: "Minden héten", value: "weekly" },
          { title: "Kéthetente (páros hét)", value: "biweekly-even" },
          { title: "Kéthetente (páratlan hét)", value: "biweekly-odd" },
        ],
        layout: "radio",
      },
      initialValue: "weekly",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "location",
      title: "Helyszín",
      type: "string",
      description: "Opcionális: ha több terem van",
    }),
    defineField({
      name: "maxParticipants",
      title: "Max létszám",
      type: "number",
    }),
    defineField({
      name: "isActive",
      title: "Aktív",
      type: "boolean",
      initialValue: true,
      description: "Megjelenik-e az órarendben",
    }),
    defineField({
      name: "notes",
      title: "Megjegyzés",
      type: "string",
      description: "Opcionális megjegyzés az órához",
    }),
  ],
  orderings: [
    {
      title: "Nap és időpont",
      name: "dayAndTime",
      by: [
        { field: "dayOfWeek", direction: "asc" },
        { field: "startTime", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      yogaClassName: "yogaClass.name",
      instructorName: "instructor.name",
      day: "dayOfWeek",
      start: "startTime",
      end: "endTime",
    },
    prepare({ yogaClassName, instructorName, day, start, end }) {
      const days: Record<string, string> = {
        monday: "Hétfő",
        tuesday: "Kedd",
        wednesday: "Szerda",
        thursday: "Csütörtök",
        friday: "Péntek",
        saturday: "Szombat",
        sunday: "Vasárnap",
      };
      return {
        title: `${yogaClassName || "?"} - ${instructorName || "?"}`,
        subtitle: `${days[day] || day} ${start}-${end}`,
      };
    },
  },
});
