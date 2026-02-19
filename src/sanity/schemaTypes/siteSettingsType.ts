import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Beallitasok",
  type: "document",
  fields: [
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "clinicName",
      title: "Rendelo neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Telefonszam",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email cim",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Cim",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "navigationLinks",
      title: "Navigacios linkek",
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
      title: "Kozossegi media linkek",
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
      title: "Lablec oszlopok",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "heading",
              title: "Oszlop cim",
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
      title: "Adatvedelmi iranyelv URL",
      type: "string",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta leiras",
      type: "text",
      description: "Alapertelmezett meta leiras az oldalhoz",
      rows: 3,
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Weboldal beallitasok",
      };
    },
  },
});
