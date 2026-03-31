import { defineField, defineType } from "sanity";

export const kapcsolatType = defineType({
  name: "kapcsolat",
  title: "Kapcsolat oldal",
  type: "document",
  groups: [
    { name: "hero", title: "Hero szekció" },
    { name: "details", title: "Részletek" },
    { name: "goodToKnow", title: "Jó tudni" },
    { name: "accordions", title: "Összefoglalók" },
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
            defineField({ name: "iconName", title: "Ikon neve (opcionális)", type: "string", description: "Pl: telefon, email, ora, stb. (a /public/icons/ mappából)" }),
          ],
          preview: {
            select: { title: "label", subtitle: "number" },
          },
        },
      ],
    }),
    defineField({
      name: "heroEmailAddresses",
      title: "Email címek a HERO szekciókban (tetejére)",
      description: "Ezek az email címek jelennek meg a hero szekció tetején, telefonszám mellett",
      type: "array",
      group: "hero",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Megnevezés", type: "string" }),
            defineField({ name: "email", title: "Email cím", type: "string" }),
            defineField({ name: "iconName", title: "Ikon neve (opcionális)", type: "string", description: "Pl: email, telefon, ora, stb. (a /public/icons/ mappából)" }),
          ],
          preview: {
            select: { title: "label", subtitle: "email" },
          },
        },
      ],
    }),
    defineField({
      name: "emailAddresses",
      title: "Email címek a RENDELŐ kártyán (lent)",
      description: "Ezek az email címek jelennek meg a Rendelő kártyá az alatta",
      type: "array",
      group: "hero",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Megnevezés", type: "string" }),
            defineField({ name: "email", title: "Email cím", type: "string" }),
            defineField({ name: "iconName", title: "Ikon neve (opcionális)", type: "string", description: "Pl: email, surgos, stb. (a /public/icons/ mappából)" }),
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
      name: "officeHoursTitle",
      title: "Rendelési idő - Cím",
      type: "string",
      group: "details",
      initialValue: "Rendelési idő",
    }),
    defineField({
      name: "officeHoursIconName",
      title: "Rendelési idő - Ikon neve (opcionális)",
      type: "string",
      group: "details",
      description: "Pl: ora, surgos, stb. (a /public/icons/ mappából)",
    }),
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
      name: "locationTitle",
      title: "Helyszín - Cím",
      type: "string",
      group: "details",
      initialValue: "Rendelő",
    }),
    defineField({
      name: "locationIconName",
      title: "Helyszín - Ikon neve (opcionális)",
      type: "string",
      group: "details",
      description: "Pl: terkep, surgos, stb. (a /public/icons/ mappából)",
    }),
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
      name: "goodToKnowLabel",
      title: "Jó tudni - Label",
      type: "string",
      group: "goodToKnow",
      initialValue: "Hasznos",
    }),
    defineField({
      name: "goodToKnowTitle",
      title: "Jó tudni - Főcím",
      type: "string",
      group: "goodToKnow",
      initialValue: "Jó tudni érkezés előtt",
    }),
    defineField({
      name: "goodToKnowSubtitle",
      title: "Jó tudni - Alcím",
      type: "string",
      group: "goodToKnow",
      initialValue: "Segítünk, hogy stresszmentes legyen a vizit",
    }),
    defineField({
      name: "goodToKnowCards",
      title: "Jó tudni kártyák",
      type: "array",
      group: "goodToKnow",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "iconName", title: "Ikon neve (opcionális)", type: "string", description: "Pl: auto, terkep, kartya, info, stb. (a /public/icons/ mappából)" }),
            defineField({ name: "title", title: "Cím", type: "string" }),
            defineField({ name: "description", title: "Leírás", type: "text", rows: 3 }),
            defineField({ name: "url", title: "Link (opcionális)", type: "url", description: "Ha van URL, a kártya linkké válik" }),
          ],
          preview: {
            select: { title: "title", subtitle: "iconName" },
          },
        },
      ],
      validation: (rule) => rule.max(6),
    }),

    // ── Accordions ─────────────────────────────────────────
    defineField({
      name: "hasznos_label",
      title: "Hasznos információk - Label",
      type: "string",
      group: "accordions",
      initialValue: "Tudnivalók",
    }),
    defineField({
      name: "hasznos_title",
      title: "Hasznos információk - Főcím",
      type: "string",
      group: "accordions",
      initialValue: "Hasznos információk",
    }),
    defineField({
      name: "hasznos_subtitle",
      title: "Hasznos információk - Alcím",
      type: "string",
      group: "accordions",
      initialValue: "Válaszok az Ön legfontosabb kérdéseire",
    }),
    defineField({
      name: "hasznos_items",
      title: "Hasznos információk - Elemek",
      type: "array",
      group: "accordions",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Kérdés/Cím", type: "string" }),
            defineField({ name: "body", title: "Válasz/Leírás", type: "text", rows: 5 }),
            defineField({ name: "iconName", title: "Ikon (opcionális)", type: "string", description: "Pl: info, kerdes, surgos, stb. (a /public/icons/ mappából)" }),
          ],
          preview: {
            select: { title: "title" },
          },
        },
      ],
    }),

    defineField({
      name: "fontos_label",
      title: "Fontos tudnivalók - Label",
      type: "string",
      group: "accordions",
      initialValue: "Fontos",
    }),
    defineField({
      name: "fontos_title",
      title: "Fontos tudnivalók - Főcím",
      type: "string",
      group: "accordions",
      initialValue: "Fontos tudnivalók",
    }),
    defineField({
      name: "fontos_subtitle",
      title: "Fontos tudnivalók - Alcím",
      type: "string",
      group: "accordions",
      initialValue: "Biztonság és komfort az ellátás során",
    }),
    defineField({
      name: "fontos_items",
      title: "Fontos tudnivalók - Elemek",
      type: "array",
      group: "accordions",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Kérdés/Cím", type: "string" }),
            defineField({ name: "body", title: "Válasz/Leírás", type: "text", rows: 5 }),
            defineField({ name: "iconName", title: "Ikon (opcionális)", type: "string" }),
          ],
          preview: {
            select: { title: "title" },
          },
        },
      ],
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
      name: "ctaSubtitle",
      title: "CTA alcím",
      type: "text",
      rows: 2,
      group: "cta",
      initialValue: "Válassza az önnek legmegfelelőbb időpontot",
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
      initialValue: "/idopontfoglalas",
    }),
  ],
  preview: {
    select: { title: "heroTitle" },
  },
});
