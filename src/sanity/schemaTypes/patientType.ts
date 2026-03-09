import type { SchemaTypeDefinition } from "sanity";

export const patientType: SchemaTypeDefinition = {
  name: "patient",
  title: "Páciens",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Teljes név",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "email",
      title: "Email cím",
      type: "string",
    },
    {
      name: "phone",
      title: "Telefonszám",
      type: "string",
    },
    {
      name: "lastVisitDate",
      title: "Utolsó látogatás",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
    },
    {
      name: "source",
      title: "Forrás",
      type: "string",
      options: {
        list: [
          { title: "Importált", value: "imported" },
          { title: "Online foglalás", value: "online" },
        ],
      },
      initialValue: "imported",
    },
    {
      name: "importedAt",
      title: "Importálva",
      type: "datetime",
    },
    {
      name: "notes",
      title: "Megjegyzés",
      type: "text",
      rows: 3,
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "email",
    },
  },
  orderings: [
    {
      title: "Utolsó látogatás (legújabb elöl)",
      name: "lastVisitDesc",
      by: [{ field: "lastVisitDate", direction: "desc" }],
    },
    {
      title: "Név (A-Z)",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
};
