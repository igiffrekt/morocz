import { defineField, defineType } from "sanity";

export const serviceType = defineType({
  name: "service",
  title: "Szolgaltatas",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Szolgaltatas neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Leiras",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "icon",
      title: "Ikon/kep",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "category",
      title: "Kategoria",
      type: "reference",
      to: [{ type: "serviceCategory" }],
    }),
    defineField({
      name: "order",
      title: "Sorrend",
      type: "number",
      description: "Kisebb szam = elobb jelenik meg",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category.name",
      media: "icon",
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `Kategoria: ${subtitle}` : "Kategoria nincs beallitva",
        media,
      };
    },
  },
});
