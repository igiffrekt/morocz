import { defineField, defineType } from "sanity";
import {
  bufferMinutesField,
  daysField,
  defaultSlotDurationField,
} from "./_weeklyFields";

const bookingWindowDaysField = defineField({
  name: "bookingWindowDays",
  title: "Foglalási ablak (nap)",
  type: "number",
  description: "Hány nappal előre foglalhatnak a páciensek időpontot.",
  initialValue: 30,
  validation: (rule) => rule.required().integer().min(1).max(365),
});

export const weeklyScheduleType = defineType({
  name: "weeklySchedule",
  title: "Heti beosztás",
  type: "document",
  fields: [
    defaultSlotDurationField,
    bufferMinutesField,
    bookingWindowDaysField,
    daysField,
  ],
  preview: {
    prepare() {
      return {
        title: "Heti beosztás",
      };
    },
  },
});
