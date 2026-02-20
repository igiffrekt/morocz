import { defineField, defineType } from "sanity";

export const privacyPolicyType = defineType({
  name: "privacyPolicy",
  title: "Adatkezelési tájékoztató",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Oldal cím",
      type: "string",
      validation: (rule) => rule.required(),
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
      name: "lastUpdated",
      title: "Utolsó frissítés dátuma",
      type: "date",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Adatkezelési tájékoztató",
      };
    },
  },
});
