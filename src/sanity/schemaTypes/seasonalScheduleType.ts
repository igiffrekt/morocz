import { defineField, defineType } from "sanity";
import {
  bufferMinutesField,
  daysField,
  defaultSlotDurationField,
} from "./_weeklyFields";

export const seasonalScheduleType = defineType({
  name: "seasonalSchedule",
  title: "Szezonális beosztás",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Név",
      type: "string",
      description: `Pl. „Nyári beosztás", „Karácsony"`,
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: "startDate",
      title: "Kezdő dátum (bezárólag)",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "Befejező dátum (bezárólag)",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const parent = context.document as
            | { startDate?: string }
            | undefined;
          if (!value || !parent?.startDate) return true;
          if (value < parent.startDate) {
            return "A befejező dátum nem lehet korábbi, mint a kezdő dátum.";
          }
          return true;
        }),
    }),
    defaultSlotDurationField,
    bufferMinutesField,
    daysField,
  ],
  preview: {
    select: {
      name: "name",
      startDate: "startDate",
      endDate: "endDate",
    },
    prepare({ name, startDate, endDate }) {
      const subtitle =
        startDate && endDate ? `${startDate} – ${endDate}` : "Nincs időszak";
      return { title: name || "Névtelen szezonális beosztás", subtitle };
    },
  },
  orderings: [
    {
      title: "Kezdő dátum szerint",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
});
