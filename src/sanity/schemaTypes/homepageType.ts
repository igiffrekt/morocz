import { defineField, defineType } from "sanity";

export const homepageType = defineType({
  name: "homepage",
  title: "Kezdőlap",
  type: "document",
  fields: [
    // Hero section
    defineField({
      name: "heroHeadline",
      title: "Fő cím",
      type: "string",
      description: "A hero rész nagy címsora",
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: "heroSubtitle",
      title: "Alcím",
      type: "text",
      description: "A fő cím alatti leíró szöveg",
      rows: 3,
    }),
    defineField({
      name: "heroBadges",
      title: "Hero jelvények",
      type: "array",
      description: "Statisztikák és elismerések a hero részben (max 3)",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "emoji",
              title: "Emoji",
              type: "string",
              description: "Ikon emoji (pl. ✅, 🏥, 👨‍⚕️)",
            }),
            defineField({
              name: "text",
              title: "Szöveg",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "text",
              subtitle: "emoji",
            },
          },
        },
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "heroDoctorImage",
      title: "Orvos kép",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "heroCards",
      title: "Szolgáltatás kártyák",
      type: "array",
      description: "Maximum 4 kártya a hero részben (színek a kódban rögzítettek)",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Cím",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "subtitle",
              title: "Alcím",
              type: "string",
            }),
            defineField({
              name: "icon",
              title: "Ikon",
              type: "image",
            }),
            defineField({
              name: "href",
              title: "Link",
              type: "string",
              description: "Belső hivatkozás, pl. /nogyogyaszat",
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
      title: "Szolgáltatások cím",
      type: "string",
    }),
    defineField({
      name: "servicesSubtitle",
      title: "Szolgáltatások leírás",
      type: "text",
      rows: 3,
    }),

    // Lab tests highlight section
    defineField({
      name: "labTestsHeadline",
      title: "Laborvizsgálatok cím",
      type: "string",
    }),
    defineField({
      name: "labTestsSubtitle",
      title: "Laborvizsgálatok leírás",
      type: "text",
      rows: 3,
    }),

    // Testimonials section
    defineField({
      name: "testimonialsHeadline",
      title: "Vélemények cím",
      type: "string",
    }),

    // Blog section
    defineField({
      name: "blogHeadline",
      title: "Blog cím",
      type: "string",
    }),

    // CTA section
    defineField({
      name: "ctaHeadline",
      title: "CTA cím",
      type: "string",
    }),
    defineField({
      name: "ctaDescription",
      title: "CTA leírás",
      type: "text",
      rows: 3,
    }),

    // SEO fields
    defineField({
      name: "metaDescription",
      title: "Meta leírás",
      type: "text",
      rows: 2,
      description: "Kezdőlap SEO leírása keresőmotorokhoz",
    }),
    defineField({
      name: "ogImage",
      title: "OG kép",
      type: "image",
      description: "Közösségi média megosztáshoz használt kép a kezdőlapon",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Kezdőlap",
      };
    },
  },
});
