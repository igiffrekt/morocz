import { defineField, defineType } from "sanity";

export const styledTableType = defineType({
  name: "styledTable",
  title: "Táblázat",
  type: "object",
  fields: [
    defineField({
      name: "headerRow",
      title: "Első sor kiemelése fejlécként",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "zebraStripes",
      title: "Csíkozott sorok",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "align",
      title: "Szöveg igazítása",
      type: "string",
      options: {
        list: [
          { title: "Balra", value: "left" },
          { title: "Középre", value: "center" },
          { title: "Jobbra", value: "right" },
        ],
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({
      name: "table",
      title: "Táblázat tartalma",
      type: "table",
    }),
  ],
  preview: {
    select: {
      rows: "table.rows",
    },
    prepare({ rows }: { rows?: Array<{ cells?: Array<string> }> }) {
      const first = rows?.[0]?.cells?.join(" | ");
      return {
        title: "Táblázat",
        subtitle: first || "Üres táblázat",
      };
    },
  },
});
