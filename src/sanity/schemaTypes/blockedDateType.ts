import { defineField, defineType } from "sanity";

export const blockedDateType = defineType({
  name: "blockedDate",
  title: "Blokkolt napok",
  type: "document",
  fields: [
    defineField({
      name: "dates",
      title: "Blokkolt dátumok",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "date",
              title: "Dátum",
              type: "date",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "isHoliday",
              title: "Ünnepnap",
              type: "boolean",
              description: "Automatikusan hozzáadott magyar ünnepnap",
              initialValue: false,
              readOnly: true,
            }),
          ],
          preview: {
            select: {
              date: "date",
              isHoliday: "isHoliday",
            },
            prepare({ date, isHoliday }) {
              return {
                title: date ?? "Nincs dátum",
                subtitle: isHoliday ? "Ünnepnap" : "Blokkolt nap",
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Blokkolt napok",
      };
    },
  },
});
