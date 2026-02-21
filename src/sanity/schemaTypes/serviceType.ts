import { defineField, defineType } from "sanity";

export const serviceType = defineType({
  name: "service",
  title: "Szolgáltatás",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Szolgáltatás neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Leírás",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "price",
      title: "Ár (Ft)",
      type: "number",
      description: "Szolgáltatás ára forintban",
    }),
    defineField({
      name: "icon",
      title: "Ikon/kép",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "category",
      title: "Kategória",
      type: "reference",
      to: [{ type: "serviceCategory" }],
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
      subtitle: "category.name",
      media: "icon",
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `Kategória: ${subtitle}` : "Kategória nincs beállítva",
        media,
      };
    },
  },
});
