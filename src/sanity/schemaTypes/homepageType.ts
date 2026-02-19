import { defineField, defineType } from "sanity";

export const homepageType = defineType({
  name: "homepage",
  title: "Kezdolap",
  type: "document",
  fields: [
    // Hero section
    defineField({
      name: "heroHeadline",
      title: "Fo cim",
      type: "string",
      description: "A hero resz nagy cimsora",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "heroSubtitle",
      title: "Alcim",
      type: "text",
      description: "A fo cim alatti leiro szoveg",
      rows: 3,
    }),
    defineField({
      name: "heroDoctorImage",
      title: "Orvos kep",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "heroCards",
      title: "Szolgaltatas kartyak",
      type: "array",
      description: "Maximum 4 karta a hero reszben (szinek a kodban rogzitettek)",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Cim",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "subtitle",
              title: "Alcim",
              type: "string",
            }),
            defineField({
              name: "icon",
              title: "Ikon",
              type: "image",
            }),
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "subtitle",
              media: "icon",
            },
          },
        },
      ],
      validation: (rule) => rule.max(4),
    }),

    // Services highlight section
    defineField({
      name: "servicesHeadline",
      title: "Szolgaltatasok cim",
      type: "string",
    }),
    defineField({
      name: "servicesSubtitle",
      title: "Szolgaltatasok leiras",
      type: "text",
      rows: 3,
    }),

    // Lab tests highlight section
    defineField({
      name: "labTestsHeadline",
      title: "Laborvizsgalatok cim",
      type: "string",
    }),
    defineField({
      name: "labTestsSubtitle",
      title: "Laborvizsgalatok leiras",
      type: "text",
      rows: 3,
    }),

    // CTA section
    defineField({
      name: "ctaHeadline",
      title: "CTA cim",
      type: "string",
    }),
    defineField({
      name: "ctaDescription",
      title: "CTA leiras",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Kezdolap",
      };
    },
  },
});
