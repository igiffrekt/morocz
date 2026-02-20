import { defineField, defineType } from "sanity";

export const serviceCategoryType = defineType({
  name: "serviceCategory",
  title: "Szolgáltatás kategória",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Kategória neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "emoji",
      title: "Emoji/ikon",
      type: "string",
      description: 'Emoji karakter a szűrő gombhoz, pl. "🏥"',
    }),
    defineField({
      name: "order",
      title: "Sorrend",
      type: "number",
      description: "Kisebb szám = előbb jelenik meg",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "emoji",
    },
    prepare({ title, subtitle }) {
      return {
        title: subtitle ? `${subtitle} ${title}` : title,
      };
    },
  },
});
