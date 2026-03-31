import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  servicesForBookingQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
import type {
  BlockedDate,
  ServicesForBookingQueryResult,
  WeeklySchedule,
} from "../../../sanity.types";

export const metadata: Metadata = {
  title: "Időpontfoglalás | Mórocz Medical",
  description: "Foglaljon időpontot online nőgyógyászati vizsgálatra vagy várandósgondozásra.",
};

export default async function IdopontfoglalasPage() {
  const [services, weeklySchedule, blockedDatesDoc] = await Promise.all([
    sanityFetch<ServicesForBookingQueryResult>({
      query: servicesForBookingQuery,
      tags: ["service"],
    }),
    sanityFetch<WeeklySchedule | null>({
      query: weeklyScheduleQuery,
      tags: ["weeklySchedule"],
    }),
    sanityFetch<BlockedDate | null>({
      query: blockedDatesQuery,
      tags: ["blockedDate"],
    }),
  ]);

  // Normalize Sanity WeeklySchedule to ScheduleForAvailability:
  // Sanity types have startTime/endTime as string | undefined, but ScheduleForAvailability requires string.
  const normalizedDays = (weeklySchedule?.days ?? []).map((d) => ({
    dayOfWeek: d.dayOfWeek ?? 0,
    isDayOff: d.isDayOff ?? false,
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
  }));

  const scheduleData = {
    schedule: {
      defaultSlotDuration: weeklySchedule?.defaultSlotDuration ?? 20,
      bufferMinutes: weeklySchedule?.bufferMinutes ?? 0,
      days: normalizedDays,
    },
    blockedDates: (blockedDatesDoc?.dates ?? []).map((d) => d.date ?? "").filter(Boolean),
  };

  // Transform services: filter nulls and map fields to ServiceItem format
  const transformedServices = services
    .filter((s): s is typeof services[number] & { name: string } => s.name !== null && s.name !== undefined)
    .map((s) => ({
      _id: s._id,
      name: s.name,
      appointmentDuration: undefined, // duration is null in query, so keep undefined
    }));

  // Collapse matching services into exactly 2 booking options:
  // - First "Nőgyógyász*" service → displayed as "Nőgyógyászati vizsgálat"
  // - "Várandósgondozás" (exact match)
  const gyneService = transformedServices.find((s) => s.name?.startsWith("Nőgyógyász"));
  const prenatalService = transformedServices.find((s) => s.name === "Várandósgondozás");
  const bookingServices = [
    ...(gyneService ? [{ ...gyneService, name: "Nőgyógyászati vizsgálat" }] : []),
    ...(prenatalService ? [prenatalService] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-primary)] mb-8">
        Időpontfoglalás
      </h1>
      <BookingWizard services={bookingServices} scheduleData={scheduleData} />
    </div>
  );
}
