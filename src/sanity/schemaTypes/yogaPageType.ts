import { defineField, defineType } from "sanity";

export const yogaPageType = defineType({
  name: "yogaPage",
  title: "Jóga oldal",
  type: "document",
  fields: [
    defineField({
      name: "heroHeadline",
      title: "Hero címsor",
      type: "string",
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: "heroSubtitle",
      title: "Hero alcím",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hero kép",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroBadges",
      title: "Hero badge-ek",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "emoji", title: "Emoji", type: "string" },
            { name: "text", title: "Szöveg", type: "string" },
          ],
        },
      ],
      validation: (Rule) => Rule.max(2),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta leírás (SEO)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "ogImage",
      title: "OG kép (közösségi megosztás)",
      type: "image",
    }),
  ],
  preview: {
    select: {
      title: "heroHeadline",
    },
    prepare({ title }) {
      return {
        title: title || "Jóga oldal",
        subtitle: "Oldal beállítások",
      };
    },
  },
});
