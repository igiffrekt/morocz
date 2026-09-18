import { defineField, defineType } from "sanity";
import { breakEndField, breakStartField } from "./_weeklyFields";

export const customAvailabilityType = defineType({
  name: "customAvailability",
  title: "Egyedi elérhetőség",
  type: "document",
  fields: [
    defineField({
      name: "date",
      title: "Dátum",
      type: "date",
      description:
        'Válassza ki a dátumot, amikor egyedi időpontokat szeretne biztosítani. Ez a nap teljesen felülírja a heti és a szezonális beosztást: ami itt szerepel, az érvényes — amit üresen hagy (pl. a szünetet), az ezen a napon nincs.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Kezdés",
      type: "string",
      description: "Formátum: HH:MM (pl. 08:00)",
      validation: (rule) =>
        rule.required().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
          name: "time",
          invert: false,
        }),
    }),
    defineField({
      name: "endTime",
      title: "Befejezés",
      type: "string",
      description: "Formátum: HH:MM (pl. 16:00)",
      validation: (rule) =>
        rule.required().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
          name: "time",
          invert: false,
        }),
    }),
    breakStartField,
    breakEndField,
    defineField({
      name: "services",
      title: "Elérhető szolgáltatások",
      type: "array",
      description: "Válassza ki, mely szolgáltatások elérhetőek ebben az időszakban (ha nincs kiválasztva, minden szolgáltatás elérhető)",
      of: [{ type: "reference", to: [{ type: "service" }] }],
    }),
    defineField({
      name: "note",
      title: "Megjegyzés",
      type: "text",
      description: "Belső megjegyzés (nem látható a pácienseknek)",
      rows: 2,
    }),
  ],
  preview: {
    select: {
      date: "date",
      startTime: "startTime",
      endTime: "endTime",
      breakStart: "breakStart",
      breakEnd: "breakEnd",
      services: "services",
    },
    prepare({ date, startTime, endTime, breakStart, breakEnd, services }) {
      const serviceCount = services?.length || 0;
      const breakPart = breakStart && breakEnd ? ` · szünet ${breakStart}–${breakEnd}` : "";
      const subtitle = `${startTime} – ${endTime}${breakPart}${serviceCount > 0 ? ` · ${serviceCount} szolgáltatás` : " · Minden szolgáltatás"}`;
      return {
        title: date || "Nincs dátum",
        subtitle,
      };
    },
  },
});
