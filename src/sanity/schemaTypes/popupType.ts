import { defineField, defineType } from "sanity";

export const popupType = defineType({
  name: "popup",
  title: "Felugró ablak",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Belső azonosító",
      type: "string",
      description: "Csak adminisztrációs célokra, nem jelenik meg a felhasználóknak",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Aktív",
      type: "boolean",
      description: "Ha be van kapcsolva, a popup megjelenik az oldalon",
      initialValue: false,
    }),
    defineField({
      name: "headline",
      title: "Címsor",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Tartalom",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
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
      name: "image",
      title: "Kép",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alt szöveg",
          description: "Akadálymentesítéshez fontos",
        },
      ],
    }),
    defineField({
      name: "ctaButton",
      title: "CTA gomb (opcionális)",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Gomb szöveg",
          type: "string",
        }),
        defineField({
          name: "href",
          title: "Gomb link",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "showOnPages",
      title: "Megjelenítés oldalain",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Főoldal", value: "/" },
          { title: "Szolgáltatások", value: "/szolgaltatasok" },
          { title: "Időpontfoglalás", value: "/idopontfoglalas" },
          { title: "Kapcsolat", value: "/kapcsolat" },
          { title: "Blog", value: "/blog" },
          { title: "Yoga", value: "/yoga" },
          { title: "Minden oldal", value: "*" },
        ],
      },
      description: "Válaszd ki, mely oldalakon jelenjen meg a popup",
      initialValue: ["*"],
    }),
    defineField({
      name: "displayDelay",
      title: "Megjelenési késleltetés (mp)",
      type: "number",
      description: "Hány másodperc után jelenjen meg a popup",
      initialValue: 2,
      validation: (rule) => rule.min(0).max(30),
    }),
    defineField({
      name: "showOncePerSession",
      title: "Csak egyszer jelenjen meg munkamenetenként",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      headline: "headline",
      isActive: "isActive",
      media: "image",
    },
    prepare({ title, headline, isActive, media }) {
      return {
        title: title || headline,
        subtitle: isActive ? "✅ Aktív" : "❌ Inaktív",
        media,
      };
    },
  },
});
