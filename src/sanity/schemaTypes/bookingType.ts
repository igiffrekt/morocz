import { defineField, defineType } from "sanity";

export const bookingType = defineType({
  name: "booking",
  title: "Foglalás",
  type: "document",
  fields: [
    defineField({
      name: "service",
      title: "Szolgáltatás",
      type: "reference",
      to: [{ type: "service" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slotDate",
      title: "Dátum",
      type: "date",
      options: {
        dateFormat: "YYYY-MM-DD",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slotTime",
      title: "Időpont",
      type: "string",
      description: "Formátum: HH:MM (pl. 09:20)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "patientName",
      title: "Páciens neve",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "patientEmail",
      title: "E-mail cím",
      type: "string",
      description: "Páciens e-mail címe",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return "Kötelező mező";
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return "Érvénytelen e-mail cím";
          return true;
        }),
    }),
    defineField({
      name: "patientPhone",
      title: "Telefonszám",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "reservationNumber",
      title: "Foglalási szám",
      type: "string",
      description: "Egyedi azonosító a páciens számára (pl. M-A3K7X2)",
      readOnly: true,
    }),
    defineField({
      name: "managementToken",
      title: "Kezelési token",
      type: "string",
      description: "Egyedi azonosító az időpont kezelési linkjéhez (/foglalas/:token)",
      readOnly: true,
    }),
    defineField({
      name: "userId",
      title: "Felhasználó ID",
      type: "string",
      description: "Better Auth felhasználó azonosítója (opcionális)",
    }),
    defineField({
      name: "status",
      title: "Státusz",
      type: "string",
      options: {
        list: [
          { title: "Visszaigazolt", value: "confirmed" },
          { title: "Lemondva", value: "cancelled" },
          { title: "Átütemezve", value: "rescheduled" },
        ],
      },
      initialValue: "confirmed",
    }),
    defineField({
      name: "createdAt",
      title: "Létrehozva",
      type: "datetime",
    }),
    defineField({
      name: "reminderSent",
      title: "Emlékeztető elküldve",
      type: "boolean",
      description: "Igaz, ha a 24 órás emlékeztető e-mail már ki lett küldve",
      initialValue: false,
    }),
    defineField({
      name: "googleCalendarEventId",
      title: "Google Naptár esemény ID",
      type: "string",
      description: "A Google Calendar esemény azonosítója — automatikusan töltődik ki",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "patientName",
      date: "slotDate",
      time: "slotTime",
      reservationNumber: "reservationNumber",
    },
    prepare({ title, date, time, reservationNumber }) {
      const sub = [reservationNumber, date && time ? `${date} ${time}` : date].filter(Boolean).join(" — ");
      return {
        title: title ?? "Ismeretlen páciens",
        subtitle: sub || "Dátum nincs beállítva",
      };
    },
  },
});
