import { defineField, defineType } from "sanity";

export const serviceType = defineType({
  name: "service",
  title: "Szolgáltatás",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Szolgáltatás neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Leírás",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "price",
      title: "Ár (Ft)",
      type: "number",
      description: "Szolgáltatás ára forintban",
    }),
    defineField({
      name: "icon",
      title: "Ikon/kép",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "category",
      title: "Kategória",
      type: "reference",
      to: [{ type: "serviceCategory" }],
    }),
    defineField({
      name: "order",
      title: "Sorrend",
      type: "number",
      description: "Kisebb szám = előbb jelenik meg",
    }),
    defineField({
      name: "appointmentDuration",
      title: "Időpont hossza (perc)",
      type: "number",
      description:
        "Szolgáltatás időtartama percben. Ha hosszabb, mint az alap időpont, több egymást követő slotot foglal le.",
      options: {
        list: [
          { title: "10 perc", value: 10 },
          { title: "15 perc", value: 15 },
          { title: "20 perc", value: 20 },
          { title: "30 perc", value: 30 },
          { title: "45 perc", value: 45 },
          { title: "60 perc", value: 60 },
        ],
      },
      initialValue: 20,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category.name",
      media: "icon",
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `Kategória: ${subtitle}` : "Kategória nincs beállítva",
        media,
      };
    },
  },
});
