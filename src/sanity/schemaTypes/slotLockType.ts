import { defineField, defineType } from "sanity";

export const slotLockType = defineType({
  name: "slotLock",
  title: "Időpont zár",
  type: "document",
  fields: [
    defineField({
      name: "slotId",
      title: "Időpont azonosító",
      type: "string",
      description: "Formátum: 2026-03-15T09:20:00 (dátum + időpont)",
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
      name: "heldUntil",
      title: "Foglalva eddig",
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
      title: "slotId",
      subtitle: "status",
    },
    prepare({ title, subtitle }) {
      const statusLabels: Record<string, string> = {
        available: "Szabad",
        held: "Foglalt (függőben)",
        booked: "Lefoglalva",
      };
      return {
        title: title ?? "Ismeretlen időpont",
        subtitle: statusLabels[subtitle as string] ?? subtitle ?? "Státusz ismeretlen",
      };
    },
  },
});
