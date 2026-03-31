import { defineField, defineType } from "sanity";

export const yogaInstructorType = defineType({
  name: "yogaInstructor",
  title: "Jóga oktató",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Név",
      type: "string",
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
      name: "photo",
      title: "Fotó",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "bio",
      title: "Bemutatkozás",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "phone",
      title: "Telefonszám",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "color",
      title: "Szín (órarenden)",
      type: "string",
      description: "Hex kód, pl. #99CEB7",
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/, { name: "hex color" }),
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "photo",
    },
  },
});
