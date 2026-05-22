import { isDayBookable } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import { weeklyScheduleQuery } from "@/sanity/lib/queries";

type WeeklySchedule = {
  days: Array<{
    _key: string;
    dayOfWeek: number;
    isDayOff: boolean;
    startTime: string;
    endTime: string;
  }>;
};

/**
 * Returns a 410 Response if the requested date is within the pre-start lock
 * window (see DAY_LOCK_MINUTES_BEFORE_START in slots.ts). Otherwise null.
 *
 * Keeps server-side enforcement in sync with the availability UI so a stale
 * client cannot book into a day whose consulting hours have effectively begun.
 */
export async function assertDayStillOpen(date: string): Promise<Response | null> {
  const schedule = await sanityFetch<WeeklySchedule | null>({
    query: weeklyScheduleQuery,
    tags: ["weeklySchedule"],
  });
  if (!schedule) return null;

  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  const dayConfig = schedule.days.find((day) => day.dayOfWeek === dow);
  if (!dayConfig || dayConfig.isDayOff || !dayConfig.startTime) return null;

  if (!isDayBookable(date, dayConfig.startTime, Date.now())) {
    return Response.json(
      {
        error:
          "Erre a napra már nem lehet online időpontot foglalni. Kérjük, hívjon minket: +36 70 639 5239",
      },
      { status: 410 },
    );
  }
  return null;
}
