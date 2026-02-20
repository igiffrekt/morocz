import { defineField, defineType } from "sanity";

export const blogPostType = defineType({
  name: "blogPost",
  title: "Blog bejegyzés",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Cím",
      type: "string",
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "URL címke",
      type: "slug",
      options: {
        source: "title",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Kategória",
      type: "reference",
      to: [{ type: "blogCategory" }],
    }),
    defineField({
      name: "featuredImage",
      title: "Kiemelt kép",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "excerpt",
      title: "Rövid kivonat",
      type: "text",
      rows: 3,
      description: "A bejegyzés rövid összefoglalója a listázáshoz",
    }),
    defineField({
      name: "body",
      title: "Tartalom",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normál", value: "normal" },
            { title: "Címsor 2", value: "h2" },
            { title: "Címsor 3", value: "h3" },
            { title: "Címsor 4", value: "h4" },
            { title: "Idézet", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Félkövér", value: "strong" },
              { title: "Dőlt", value: "em" },
              { title: "Aláhúzott", value: "underline" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Hivatkozás",
                fields: [{ name: "href", type: "url", title: "URL" }],
              },
            ],
          },
          lists: [
            { title: "Felsorolás", value: "bullet" },
            { title: "Számozott lista", value: "number" },
          ],
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", type: "string", title: "Alternatív szöveg" },
            { name: "caption", type: "string", title: "Képaláírás" },
          ],
        },
      ],
    }),
    defineField({
      name: "metaDescription",
      title: "Meta leírás",
      type: "text",
      rows: 2,
      description: "SEO leírás keresőmotorokhoz",
    }),
    defineField({
      name: "ogImage",
      title: "OG kép",
      type: "image",
      description: "Open Graph kép közösségi média megosztáshoz",
    }),
    defineField({
      name: "publishedAt",
      title: "Közzététel dátuma",
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
