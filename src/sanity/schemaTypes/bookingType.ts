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
          { title: "Teljesítve", value: "completed" },
          { title: "Nem jelent meg", value: "no-show" },
        ],
      },
      initialValue: "confirmed",
    }),
    defineField({
      name: "stripeSessionId",
      title: "Stripe Session ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "stripePaymentIntentId",
      title: "Stripe Payment Intent ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "paymentStatus",
      title: "Fizetési státusz",
      type: "string",
      options: {
        list: [
          { title: "Fizetésre vár", value: "pending" },
          { title: "Fizetve", value: "paid" },
          { title: "Sikertelen", value: "failed" },
        ],
      },
      initialValue: "pending",
    }),
    defineField({
      name: "paymentAmount",
      title: "Foglalási díj (Ft)",
      type: "number",
      description: "A Stripe-on keresztül befizetett foglalási díj",
    }),
    defineField({
      name: "refundStatus",
      title: "Visszatérítés státusza",
      type: "string",
      options: {
        list: [
          { title: "Nincs", value: "none" },
          { title: "Visszatérítve", value: "refunded" },
          { title: "Nincs visszatérítés", value: "no_refund" },
          { title: "Számla hiba", value: "invoice_failed" },
        ],
      },
      description: "A Stripe charge.refunded webhook tölti ki — ne módosítsd manuálisan.",
      initialValue: "none",
      readOnly: true,
    }),
    defineField({
      name: "stripeRefundId",
      title: "Stripe Refund ID",
      type: "string",
      description: "A visszatérítés Stripe azonosítója — idempotencia kulcsként is szolgál a webhookban.",
      readOnly: true,
    }),
    defineField({
      name: "creditInvoiceNumber",
      title: "Helyesbítő számla száma",
      type: "string",
      description: "A −10.000 Ft-os helyesbítő számla száma (Számlázz.hu).",
      readOnly: true,
    }),
    defineField({
      name: "creditInvoiceIssuedAt",
      title: "Helyesbítő számla kiállítva",
      type: "datetime",
      description: "Mikor állt ki a helyesbítő számla — automatikusan töltődik.",
      readOnly: true,
    }),
    defineField({
      name: "businessInvoiceRequested",
      title: "Céges számlát kért",
      type: "boolean",
      description: "Igaz, ha a páciens céges számlát kért (adószámmal).",
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: "businessTaxNumber",
      title: "Adószám",
      type: "string",
      description: "A céges számlához megadott adószám (12345678-1-23).",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerName",
      title: "Számlázási név (céges)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerZip",
      title: "Számlázási irányítószám (céges)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerCity",
      title: "Számlázási település (céges)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerAddress",
      title: "Számlázási cím (céges)",
      type: "string",
      readOnly: true,
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
      name: "completedServices",
      title: "Elvégzett szolgáltatások",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "serviceId", title: "Szolgáltatás ID", type: "string" },
            { name: "serviceName", title: "Szolgáltatás neve", type: "string" },
            { name: "price", title: "Ár (Ft)", type: "number" },
          ],
        },
      ],
      description: "Az admin által rögzített, ténylegesen elvégzett szolgáltatások",
    }),
    defineField({
      name: "completedAt",
      title: "Teljesítés dátuma",
      type: "datetime",
      description: "Mikor lett a foglalás teljesítettként megjelölve",
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
      const sub = [reservationNumber, date && time ? `${date} ${time}` : date]
        .filter(Boolean)
        .join(" — ");
      return {
        title: title ?? "Ismeretlen páciens",
        subtitle: sub || "Dátum nincs beállítva",
      };
    },
  },
});
