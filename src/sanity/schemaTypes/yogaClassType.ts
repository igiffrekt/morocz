import { defineField, defineType } from "sanity";

export const yogaClassType = defineType({
  name: "yogaClass",
  title: "Jóga típus",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Név",
      type: "string",
      description: "Pl. Hatha jóga, Vinyasa, Yin jóga",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Leírás",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
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
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: "icon",
      title: "Ikon",
      type: "string",
      description: "Emoji vagy Lucide ikon neve",
    }),
    defineField({
      name: "color",
      title: "Szín",
      type: "string",
      description: "Hex kód a megjelenítéshez, pl. #e1bbcd",
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/, { name: "hex color" }),
    }),
    defineField({
      name: "instructors",
      title: "Oktatók",
      type: "array",
      of: [{ type: "reference", to: [{ type: "yogaInstructor" }] }],
      description: "Kik tartják ezt a jóga típust",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "description",
    },
  },
});
