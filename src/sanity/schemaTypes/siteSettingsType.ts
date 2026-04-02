import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Beállítások",
  type: "document",
  fields: [
    defineField({
      name: "logo",
      title: "Logó",
      type: "image",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "clinicName",
      title: "Rendelő neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Telefonszám",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email cím",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Cím",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "navigationLinks",
      title: "Navigációs linkek",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Felirat",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              title: "URL",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "href",
            },
          },
        },
      ],
    }),
    defineField({
      name: "socialLinks",
      title: "Közösségi média linkek",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "Facebook", value: "facebook" },
                  { title: "Instagram", value: "instagram" },
                  { title: "LinkedIn", value: "linkedin" },
                  { title: "YouTube", value: "youtube" },
                  { title: "TikTok", value: "tiktok" },
                ],
              },
            }),
            defineField({
              name: "url",
              title: "Link",
              type: "url",
            }),
          ],
          preview: {
            select: {
              title: "platform",
              subtitle: "url",
            },
          },
        },
      ],
    }),
    defineField({
      name: "footerColumns",
      title: "Lábléc oszlopok",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "heading",
              title: "Oszlop cím",
              type: "string",
            }),
            defineField({
              name: "links",
              title: "Linkek",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({
                      name: "label",
                      title: "Felirat",
                      type: "string",
                    }),
                    defineField({
                      name: "href",
                      title: "URL",
                      type: "string",
                    }),
                  ],
                  preview: {
                    select: {
                      title: "label",
                      subtitle: "href",
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: {
              title: "heading",
            },
          },
        },
      ],
    }),
    defineField({
      name: "privacyPolicyUrl",
      title: "Adatvédelmi irányelv URL",
      type: "string",
    }),
    defineField({
      name: "cookiePolicyUrl",
      title: "Cookie szabályzat URL",
      type: "string",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta leírás",
      type: "text",
      description: "Alapértelmezett meta leírás az oldalhoz",
      rows: 3,
    }),
    defineField({
      name: "siteName",
      title: "Weboldal neve",
      type: "string",
      description: "Megjelenik az Open Graph címkékben",
    }),
    defineField({
      name: "defaultOgImage",
      title: "Alapértelmezett OG kép",
      type: "image",
      description: "Közösségi média megosztáshoz használt alapértelmezett kép",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Weboldal beállítások",
      };
    },
  },
});
