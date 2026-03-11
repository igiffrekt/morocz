import { defineField, defineType } from "sanity";

export const kapcsolatType = defineType({
  name: "kapcsolat",
  title: "Kapcsolat oldal",
  type: "document",
  groups: [
    { name: "hero", title: "Hero szekció" },
    { name: "details", title: "Részletek" },
    { name: "goodToKnow", title: "Jó tudni" },
    { name: "cta", title: "CTA szekció" },
  ],
  fields: [
    // ── Hero ───────────────────────────────────────────────
    defineField({
      name: "heroTitle",
      title: "Főcím",
      type: "string",
      group: "hero",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroDescription",
      title: "Leírás",
      type: "text",
      rows: 3,
      group: "hero",
    }),
    defineField({
      name: "heroImage",
      title: "Hero kép (jobb oldal)",
      type: "image",
      options: { hotspot: true },
      group: "hero",
    }),
    defineField({
      name: "phoneNumbers",
      title: "Telefonszámok",
      type: "array",
      group: "hero",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Megnevezés", type: "string" }),
            defineField({ name: "number", title: "Telefonszám", type: "string" }),
          ],
          preview: {
            select: { title: "label", subtitle: "number" },
          },
        },
      ],
    }),
    defineField({
      name: "emailAddresses",
      title: "Email címek",
      type: "array",
      group: "hero",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Megnevezés", type: "string" }),
            defineField({ name: "email", title: "Email cím", type: "string" }),
          ],
          preview: {
            select: { title: "label", subtitle: "email" },
          },
        },
      ],
    }),
    defineField({
      name: "address",
      title: "Cím",
      type: "string",
      group: "hero",
    }),

    // ── Opening hours ──────────────────────────────────────
    defineField({
      name: "officeHours",
      title: "Rendelési idő",
      type: "array",
      group: "details",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "day", title: "Nap", type: "string" }),
            defineField({ name: "hours", title: "Időpont", type: "string" }),
          ],
          preview: {
            select: { title: "day", subtitle: "hours" },
          },
        },
      ],
    }),

    // ── Location ───────────────────────────────────────────
    defineField({
      name: "locationImage",
      title: "Helyszín kép",
      type: "image",
      options: { hotspot: true },
      group: "details",
    }),
    defineField({
      name: "locationLat",
      title: "Szélesség (lat)",
      type: "number",
      group: "details",
    }),
    defineField({
      name: "locationLng",
      title: "Hosszúság (lng)",
      type: "number",
      group: "details",
    }),

    // ── Good to know ───────────────────────────────────────
    defineField({
      name: "goodToKnowCards",
      title: "Jó tudni kártyák",
      type: "array",
      group: "goodToKnow",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "iconName", title: "Ikon neve (lucide-react)", type: "string", description: "Pl: Car, MapPin, CreditCard, Info" }),
            defineField({ name: "title", title: "Cím", type: "string" }),
            defineField({ name: "description", title: "Leírás", type: "text", rows: 3 }),
          ],
          preview: {
            select: { title: "title", subtitle: "iconName" },
          },
        },
      ],
      validation: (rule) => rule.max(6),
    }),

    // ── CTA ────────────────────────────────────────────────
    defineField({
      name: "ctaTitle",
      title: "CTA cím",
      type: "string",
      group: "cta",
      initialValue: "Foglaljon időpontot online",
    }),
    defineField({
      name: "ctaButtonText",
      title: "CTA gomb szöveg",
      type: "string",
      group: "cta",
      initialValue: "Időpontfoglalás",
    }),
    defineField({
      name: "ctaButtonUrl",
      title: "CTA gomb URL",
      type: "url",
      group: "cta",
    }),
  ],
  preview: {
    select: { title: "heroTitle" },
  },
});
