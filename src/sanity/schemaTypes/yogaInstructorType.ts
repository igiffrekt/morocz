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
      name: "links",
      title: "Linkek",
      description:
        "Pl. Facebook-oldal vagy saját weboldal — a bemutatkozó ablak Kapcsolat részében jelenik meg.",
      type: "array",
      of: [
        {
          type: "object",
          name: "instructorLink",
          fields: [
            defineField({
              name: "label",
              title: "Felirat",
              type: "string",
              description: "Üresen hagyva a cím alapján (pl. Facebook)",
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "color",
      title: "Szín (órarenden)",
      type: "string",
      description: "Hex kód, pl. #99CEB7",
      validation: (Rule) => Rule.regex(/^#[0-9A-Fa-f]{6}$/, { name: "hex color" }),
    }),
    defineField({
      name: "isActive",
      title: "Aktív",
      type: "boolean",
      description: "Csak az aktív oktatók jelennek meg a weboldalon",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "photo",
      isActive: "isActive",
    },
    prepare({ title, media, isActive }) {
      return {
        title: isActive === false ? `${title} (Inaktív)` : title,
        media,
      };
    },
  },
});
