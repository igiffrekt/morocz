import { defineField, defineType } from "sanity";

export const testimonialType = defineType({
  name: "testimonial",
  title: "Vélemények",
  type: "document",
  fields: [
    defineField({
      name: "patientName",
      title: "Páciens neve",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "photo",
      title: "Fénykép",
      type: "image",
      description: "A páciens fotója (opcionális)",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "text",
      title: "Véleménye",
      type: "text",
      rows: 4,
      description: "A páciens véleménye, tapasztalata",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "condition",
      title: "Kontextus/állapot",
      type: "string",
      description: 'Milyen problémában segítettünk, pl. "Cukorbetegség kezelés"',
    }),
    defineField({
      name: "order",
      title: "Sorrend",
      type: "number",
    }),
  ],
  preview: {
    select: {
      title: "patientName",
      subtitle: "condition",
      media: "photo",
    },
  },
});
