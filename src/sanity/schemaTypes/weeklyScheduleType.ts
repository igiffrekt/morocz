import { defineType } from "sanity";
import {
  bufferMinutesField,
  daysField,
  defaultSlotDurationField,
} from "./_weeklyFields";

export const weeklyScheduleType = defineType({
  name: "weeklySchedule",
  title: "Heti beosztás",
  type: "document",
  fields: [defaultSlotDurationField, bufferMinutesField, daysField],
  preview: {
    prepare() {
      return {
        title: "Heti beosztás",
      };
    },
  },
});
