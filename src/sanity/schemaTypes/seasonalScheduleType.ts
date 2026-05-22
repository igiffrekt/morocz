import { defineField, defineType } from "sanity";
import {
  bufferMinutesField,
  daysField,
  defaultSlotDurationField,
} from "./_weeklyFields";

export const seasonalScheduleType = defineType({
  name: "seasonalSchedule",
  title: "Szezonális beosztás",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Név",
      type: "string",
      description: `Pl. „Nyári beosztás", „Karácsony"`,
      validation: (rule) => rule.required().min(2),
    }),
    defineField({
      name: "startDate",
      title: "Kezdő dátum (bezárólag)",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "Befejező dátum (bezárólag)",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          const parent = context.document as
            | { _id?: string; startDate?: string }
            | undefined;
          if (!value || !parent?.startDate) return true;
          if (value < parent.startDate) {
            return "A befejező dátum nem lehet korábbi, mint a kezdő dátum.";
          }

          // Strip "drafts." prefix so we don't compare a doc against its own draft/published twin.
          const rawId = parent._id ?? "";
          const baseId = rawId.replace(/^drafts\./, "");
          const draftId = `drafts.${baseId}`;

          const client = context.getClient({ apiVersion: "2023-01-01" });
          const overlapping = await client.fetch<
            { name: string; startDate: string; endDate: string } | null
          >(
            `*[
              _type == "seasonalSchedule" &&
              _id != $baseId &&
              _id != $draftId &&
              startDate <= $endDate &&
              endDate >= $startDate
            ][0]{ name, startDate, endDate }`,
            {
              baseId,
              draftId,
              startDate: parent.startDate,
              endDate: value,
            },
          );

          if (overlapping) {
            return `Ez az időszak átfedi a(z) „${overlapping.name}" szezonális beosztást (${overlapping.startDate} – ${overlapping.endDate}).`;
          }
          return true;
        }),
    }),
    defaultSlotDurationField,
    bufferMinutesField,
    daysField,
  ],
  preview: {
    select: {
      name: "name",
      startDate: "startDate",
      endDate: "endDate",
    },
    prepare({ name, startDate, endDate }) {
      const subtitle =
        startDate && endDate ? `${startDate} – ${endDate}` : "Nincs időszak";
      return { title: name || "Névtelen szezonális beosztás", subtitle };
    },
  },
  orderings: [
    {
      title: "Kezdő dátum szerint",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
});
