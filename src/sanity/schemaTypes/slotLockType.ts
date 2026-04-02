import { defineField, defineType } from "sanity";

export const slotLockType = defineType({
  name: "slotLock",
  title: "Időpont zár",
  type: "document",
  fields: [
    defineField({
      name: "slotDate",
      title: "Dátum",
      type: "string",
      description: "Formátum: YYYY-MM-DD (pl. 2026-04-02)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slotTime",
      title: "Időpont",
      type: "string",
      description: "Formátum: HH:MM (pl. 14:20)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Státusz",
      type: "string",
      options: {
        list: [
          { title: "Szabad", value: "available" },
          { title: "Foglalt (függőben)", value: "held" },
          { title: "Lefoglalva", value: "booked" },
        ],
      },
      initialValue: "available",
    }),
    defineField({
      name: "expiresAt",
      title: "Lejár",
      type: "datetime",
      description: "A soft-hold lejárati ideje (ha held státuszban van)",
    }),
    defineField({
      name: "bookingRef",
      title: "Foglalás",
      type: "reference",
      to: [{ type: "booking" }],
      description: "A kapcsolódó foglalás dokumentum (ha booked státuszban van)",
    }),
  ],
  preview: {
    select: {
      slotDate: "slotDate",
      slotTime: "slotTime",
      status: "status",
    },
    prepare({ slotDate, slotTime, status }) {
      const statusLabels: Record<string, string> = {
        available: "Szabad",
        held: "Foglalt (függőben)",
        booked: "Lefoglalva",
      };
      return {
        title: `${slotDate} ${slotTime}`,
        subtitle: statusLabels[status as string] ?? status ?? "Státusz ismeretlen",
      };
    },
  },
});
