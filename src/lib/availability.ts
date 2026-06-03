import { defineQuery } from "next-sanity";
import { generateAvailableSlots, resolveScheduleForDate } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  bookingsForDateQuery,
  customAvailabilityForDateQuery,
  seasonalScheduleForDateQuery,
  slotLocksForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";

const serviceByIdQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

export interface DayAvailability {
  slots: string[];
  serviceName: string;
  durationMinutes: number;
}

/**
 * Returns the free slot times for a single date + service, applying the weekly
 * schedule, seasonal overrides, custom availability, blocked dates, existing
 * bookings and slot locks. Returns null if the service does not exist.
 *
 * @param nowMs optional clock override forwarded to generateAvailableSlots (tests).
 */
export async function getAvailableSlotsForDate(
  date: string,
  serviceId: string,
  nowMs?: number,
): Promise<DayAvailability | null> {
  const [schedule, seasonal, blockedDatesDoc, customAvail, bookings, slotLocks, service] =
    await Promise.all([
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        bookingWindowDays: number | null;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
      sanityFetch<{
        _id: string;
        startDate: string;
        endDate: string;
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({ query: seasonalScheduleForDateQuery, params: { date }, tags: ["seasonalSchedule"] }),
      sanityFetch<{ dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
      }),
      sanityFetch<{
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        services: Array<{ _id: string }> | null;
      } | null>({ query: customAvailabilityForDateQuery, params: { date }, tags: ["customAvailability"] }),
      sanityFetch<Array<{ _id: string; slotDate: string; slotTime: string; service: { _id: string } | null }>>({
        query: bookingsForDateQuery,
        params: { date },
        tags: ["booking"],
      }),
      sanityFetch<Array<{ _id: string; slotDate: string; slotTime: string; status: string; heldUntil: string | null }>>({
        query: slotLocksForDateQuery,
        params: { date },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceByIdQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

  if (!service) return null;

  const customApplies =
    !!customAvail &&
    (!customAvail.services ||
      customAvail.services.length === 0 ||
      customAvail.services.some((s) => s._id === serviceId));

  const bookedSlots = bookings.map((b) => b.slotTime).filter(Boolean);

  const now = new Date().toISOString();
  const heldSlots = slotLocks
    .filter(
      (lock) =>
        lock.status === "booked" ||
        (lock.status === "held" && lock.heldUntil != null && lock.heldUntil > now),
    )
    .map((lock) => lock.slotTime)
    .filter(Boolean);

  const defaultSchedule = schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] };
  let scheduleForSlots = resolveScheduleForDate(date, defaultSchedule, seasonal ? [seasonal] : []);

  if (customApplies && customAvail) {
    const dayOfWeek = new Date(date).getDay();
    scheduleForSlots = {
      ...scheduleForSlots,
      days: scheduleForSlots.days.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, isDayOff: false, startTime: customAvail.startTime, endTime: customAvail.endTime }
          : day,
      ),
    };
    if (!scheduleForSlots.days.find((d) => d.dayOfWeek === dayOfWeek)) {
      scheduleForSlots.days.push({
        dayOfWeek,
        isDayOff: false,
        startTime: customAvail.startTime,
        endTime: customAvail.endTime,
      });
    }
  }

  let blockedDates = (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean);
  if (customApplies) blockedDates = blockedDates.filter((d) => d !== date);

  const serviceDurationMinutes = service.appointmentDuration ?? 20;

  const slots = generateAvailableSlots({
    schedule: scheduleForSlots,
    blockedDates,
    bookedSlots,
    heldSlots,
    date,
    serviceDurationMinutes,
    maxDaysAhead: schedule?.bookingWindowDays ?? 30,
    nowMs,
  });

  return { slots, serviceName: service.name, durationMinutes: serviceDurationMinutes };
}
