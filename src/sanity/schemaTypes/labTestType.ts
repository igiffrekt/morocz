import { defineField, defineType } from "sanity";

export const labTestType = defineType({
  name: "labTest",
  title: "Laborvizsgalat",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Vizsgalat neve",
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
      name: "price",
      title: "Kedvezmenyes ar (Ft)",
      type: "number",
      description: "Az aktualis ar forintban",
    }),
    defineField({
      name: "originalPrice",
      title: "Eredeti ar (Ft)",
      type: "number",
      description: "A kedvezmeny elotti ar — athuzva jelenik meg",
    }),
    defineField({
      name: "discount",
      title: "Kedvezmeny (%)",
      type: "number",
      description: "Kedvezmeny szazalekban, pl. 80",
    }),
    defineField({
      name: "illustration",
      title: "Illusztracio",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "order",
      title: "Sorrend",
      type: "number",
    }),
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      media: "illustration",
    },
    prepare({ title, price, media }) {
      return {
        title,
        subtitle: price != null ? `${price} Ft` : "Ar nincs beallitva",
        media,
      };
    },
  },
});
