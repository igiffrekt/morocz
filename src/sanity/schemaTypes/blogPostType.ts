import { defineField, defineType } from "sanity";

export const blogPostType = defineType({
  name: "blogPost",
  title: "Blog bejegyzes",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Cim",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "URL cimke",
      type: "slug",
      options: {
        source: "title",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategoria",
      type: "reference",
      to: [{ type: "blogCategory" }],
    }),
    defineField({
      name: "featuredImage",
      title: "Kiemelt kep",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "excerpt",
      title: "Rovid kivonat",
      type: "text",
      rows: 3,
      description: "A bejegyzes rovid osszefoglaloja a listazashoz",
    }),
    defineField({
      name: "body",
      title: "Tartalom",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Cimsor 2", value: "h2" },
            { title: "Cimsor 3", value: "h3" },
            { title: "Cimsor 4", value: "h4" },
            { title: "Idezet", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Felkover", value: "strong" },
              { title: "Dolt", value: "em" },
              { title: "Alahuzott", value: "underline" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Hivatkozas",
                fields: [{ name: "href", type: "url", title: "URL" }],
              },
            ],
          },
          lists: [
            { title: "Felsorolas", value: "bullet" },
            { title: "Szamozott lista", value: "number" },
          ],
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", type: "string", title: "Alternativ szoveg" },
            { name: "caption", type: "string", title: "Kepalairas" },
          ],
        },
      ],
    }),
    defineField({
      name: "metaDescription",
      title: "Meta leiras",
      type: "text",
      rows: 2,
      description: "SEO leiras keresomotorokhoz",
    }),
    defineField({
      name: "ogImage",
      title: "OG kep",
      type: "image",
      description: "Open Graph kep kozossegi media megoszatashoz",
    }),
    defineField({
      name: "publishedAt",
      title: "Kozzeteles datuma",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "excerpt",
      media: "featuredImage",
    },
  },
});
