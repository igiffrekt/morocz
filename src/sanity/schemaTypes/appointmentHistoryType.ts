import { defineField, defineType } from "sanity";

export const appointmentHistoryType = defineType({
  name: "appointmentHistory",
  title: "Foglalási történet",
  type: "document",
  fields: [
    defineField({
      name: "patientEmail",
      title: "Páciens email (kulcs)",
      type: "string",
      description: "Email-alapú egyedi azonosítás",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "appointments",
      title: "Előzmények",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "id", type: "string", title: "ID" },
            { name: "date", type: "string", title: "Dátum (YYYY-MM-DD)" },
            { name: "time", type: "string", title: "Idő (HH:MM)" },
            { name: "service", type: "string", title: "Szolgáltatás" },
            { name: "duration", type: "number", title: "Időtartam (perc)" },
            { name: "staff", type: "string", title: "Szakemberr" },
            { name: "payment", type: "number", title: "Fizetés (Ft)" },
            { name: "createdAt", type: "string", title: "Rögzítés időpontja" },
            { name: "source", type: "string", title: "Forrás (live/import)" },
          ],
        },
      ],
    }),
    defineField({
      name: "matchedAt",
      title: "Illeszkedés időpontja",
      type: "datetime",
      description: "Mikor lett a pácienssel összekapcsolva",
    }),
    defineField({
      name: "matchConfidence",
      title: "Egyezés bizalmassága",
      type: "string",
      options: {
        list: [
          { title: "Email egyezés ✅", value: "email_match" },
          { title: "Kézi rögzítés", value: "manual" },
        ],
      },
      description: "Zöld = email alapján automatikusan illesztett",
    }),
  ],
  preview: {
    select: {
      title: "patientEmail",
      appointments: "appointments",
    },
    prepare(selection) {
      const count = selection.appointments?.length ?? 0;
      return {
        title: selection.title,
        subtitle: `${count} előzmény`,
      };
    },
  },
});
