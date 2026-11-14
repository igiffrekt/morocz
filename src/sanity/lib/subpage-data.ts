import type { ServiceSlug } from "@/content/services/types";
import { computeOpeningHours, type WeekdayHours, weekdayHours } from "@/lib/opening-hours";
import { buildPriceMenu, type PriceMenuCategory, surchargeExample } from "@/lib/price-menu";
import { commonSurcharges, servicePriceRows } from "@/lib/service-page";
import { type SeasonalScheduleSummary, todayInBudapest } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  allServiceCategoriesQuery,
  allServicesQuery,
  pricingPageQuery,
  seasonalSchedulesForRangeQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
import { doctorPortraitQuery, servicesIntroQuery } from "@/sanity/lib/subpage-queries";
import type {
  AllServiceCategoriesQueryResult,
  AllServicesQueryResult,
  HomepageQueryResult,
  PricingPageQueryResult,
  WeeklyScheduleQueryResult,
} from "../../../sanity.types";

/** Used until the pricingPage singleton has a validity note. */
const FALLBACK_VALIDITY = "Érvényes 2026. július 1-től.";

export interface PriceListData {
  categories: PriceMenuCategory[];
  services: AllServicesQueryResult;
  validityNote: string;
  surchargeExample: string | null;
}

/** The Sanity price list (service + serviceCategory) exactly as the homepage menu shows it. */
export async function getPriceListData(): Promise<PriceListData> {
  const [categories, services, pricing] = await Promise.all([
    sanityFetch<AllServiceCategoriesQueryResult | null>({
      query: allServiceCategoriesQuery,
      tags: ["serviceCategory"],
    }),
    sanityFetch<AllServicesQueryResult | null>({ query: allServicesQuery, tags: ["service"] }),
    sanityFetch<PricingPageQueryResult | null>({ query: pricingPageQuery, tags: ["pricingPage"] }),
  ]);
  return {
    categories: buildPriceMenu(categories ?? [], services ?? []),
    services: services ?? [],
    validityNote: (pricing?.validityNote || FALLBACK_VALIDITY).trim(),
    surchargeExample: surchargeExample(services ?? []),
  };
}

type ScheduleDay = Partial<
  Omit<NonNullable<NonNullable<WeeklyScheduleQueryResult>["days"]>[number], "_key">
>;

/** Sanity returns nullable fields; the schedule resolver expects plain values. */
function normalizeDay(d: ScheduleDay) {
  return {
    dayOfWeek: d.dayOfWeek ?? -1,
    isDayOff: d.isDayOff ?? false,
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
    breakStart: d.breakStart ?? null,
    breakEnd: d.breakEnd ?? null,
  };
}

interface SeasonalDoc {
  startDate: string | null;
  endDate: string | null;
  defaultSlotDuration: number | null;
  bufferMinutes: number | null;
  days: ScheduleDay[] | null;
}

/**
 * Monday–Friday opening hours in force today: weekly schedule overridden by the seasonal
 * schedule covering today (same resolution as the slot generator). The season's name is
 * deliberately not exposed.
 */
export async function getOpeningWeek(): Promise<WeekdayHours[]> {
  const today = todayInBudapest();
  const [weekly, seasonalDocs] = await Promise.all([
    sanityFetch<WeeklyScheduleQueryResult | null>({
      query: weeklyScheduleQuery,
      tags: ["weeklySchedule"],
    }),
    sanityFetch<SeasonalDoc[] | null>({
      query: seasonalSchedulesForRangeQuery,
      params: { startDate: today, endDate: today },
      tags: ["seasonalSchedule"],
    }),
  ]);
  const seasonals: SeasonalScheduleSummary[] = (seasonalDocs ?? [])
    .filter((s): s is SeasonalDoc & { startDate: string; endDate: string } =>
      Boolean(s.startDate && s.endDate),
    )
    .map((s) => ({
      startDate: s.startDate,
      endDate: s.endDate,
      defaultSlotDuration: s.defaultSlotDuration ?? 20,
      bufferMinutes: s.bufferMinutes ?? 0,
      days: (s.days ?? []).map(normalizeDay),
    }));
  const hours = computeOpeningHours(
    today,
    { days: (weekly?.days ?? []).map(normalizeDay) },
    seasonals,
  );
  return weekdayHours(hours);
}

export interface ServicesIntro {
  servicesHeadline: string | null;
  servicesSubtitle: string | null;
}

/** "Szolgáltatásaink" heading + lead from the homepage document. */
export async function getServicesIntro(): Promise<ServicesIntro | null> {
  return sanityFetch<ServicesIntro | null>({ query: servicesIntroQuery, tags: ["homepage"] });
}

/** Everything the shared service template needs from Sanity for one service. */
export async function getServicePageData(slug: ServiceSlug) {
  const [prices, week, portrait] = await Promise.all([
    getPriceListData(),
    getOpeningWeek(),
    getDoctorPortrait(),
  ]);
  return {
    rows: servicePriceRows(slug, prices.categories),
    surcharges: slug === "nogyogyaszat" ? commonSurcharges(prices.categories) : [],
    validityNote: prices.validityNote,
    week,
    portrait,
  };
}

export type DoctorPortrait = NonNullable<NonNullable<HomepageQueryResult>["heroDoctorImage"]>;

/** The doctor's portrait from the homepage document (service page intro avatar). */
export async function getDoctorPortrait(): Promise<DoctorPortrait | null> {
  return sanityFetch<DoctorPortrait | null>({ query: doctorPortraitQuery, tags: ["homepage"] });
}
