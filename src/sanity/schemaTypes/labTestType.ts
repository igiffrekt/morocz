import { defineArrayMember, defineField, defineType } from "sanity";

export const labTestType = defineType({
  name: "labTest",
  title: "Laborvizsgálat",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Vizsgálat neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
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
      title: "Kedvezményes ár (Ft)",
      type: "number",
      description: "Az aktuális ár forintban",
    }),
    defineField({
      name: "originalPrice",
      title: "Eredeti ár (Ft)",
      type: "number",
      description: "A kedvezmény előtti ár — áthúzva jelenik meg",
    }),
    defineField({
      name: "discount",
      title: "Kedvezmény (%)",
      type: "number",
      description: "Kedvezmény százalékban, pl. 80",
    }),
    defineField({
      name: "illustration",
      title: "Illusztráció",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "body",
      title: "Részletes leírás",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Number", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [{ name: "href", type: "url", title: "URL" }],
              },
            ],
          },
        }),
      ],
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
        subtitle: price != null ? `${price} Ft` : "Ár nincs beállítva",
        media,
      };
    },
  },
});
