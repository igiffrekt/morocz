# Seasonal booking schedule — design spec

**Date:** 2026-05-14
**Status:** Approved for planning
**Owner:** Tom

## Problem

The current booking system has a single `weeklySchedule` singleton ("Heti beosztás") that defines opening hours for every weekday. Per-day exceptions are possible via `customAvailability` (a single date) and `blockedDate`. There is no way to express a *seasonal* weekly pattern — e.g., shorter summer hours from 1 June to 30 August — without manually editing the singleton or creating dozens of `customAvailability` entries.

## Goal

Allow the admin to define one or more named seasonal schedules, each scoped to a date range, that override the default weekly schedule while the user is booking a date inside the range.

Concrete example: if a "Nyári beosztás" seasonal is configured for 2026-06-01 → 2026-06-30, a customer browsing in May who selects 2026-06-02 sees the summer-pattern slots, not the default ones.

## Non-goals

- An active/inactive toggle on seasonals — delete the document to disable.
- Per-service filtering on seasonal schedules — `customAvailability` already covers that for one-off needs.
- A timezone setting — Europe/Budapest is assumed everywhere in `src/lib/slots.ts`.
- A customer-facing "Summer hours" badge or banner — customers see only the resulting slots.
- Multi-tenant or multi-location scheduling.

## Precedence (top wins)

For any target booking date:

1. **`blockedDate`** — returns no slots.
2. **`customAvailability` for that exact date** — overrides `startTime`/`endTime` for the day. `defaultSlotDuration` and `bufferMinutes` come from the *resolved* schedule below (so a custom-availability day inside a Summer seasonal uses Summer's slot duration).
3. **`seasonalSchedule` whose `[startDate, endDate]` (inclusive) contains the date** — supplies `defaultSlotDuration`, `bufferMinutes`, and the 7-day pattern.
4. **`weeklySchedule`** (default singleton) — fallback.

Overlapping seasonal ranges are prevented at save time (validation error). If two ever do overlap at read time (race condition / bypassed validator), the resolver picks the one with the earliest `startDate` deterministically and logs a warning.

## Schema — `seasonalSchedule`

New Sanity document type. Fields:

| Field | Type | Notes |
|---|---|---|
| `name` | string, required | User-facing label (e.g., "Nyári beosztás"). |
| `startDate` | date, required | `YYYY-MM-DD`, inclusive. |
| `endDate` | date, required | `YYYY-MM-DD`, inclusive. Validation: `endDate >= startDate`. |
| `defaultSlotDuration` | number | Same option list as `weeklySchedule` (10/15/20/30/45/60). |
| `bufferMinutes` | number, ≥ 0 | Same as `weeklySchedule`. |
| `days` | array, length 7 | Same shape as `weeklySchedule.days` (dayOfWeek, isDayOff, startTime, endTime). Same `initialValue` so the 7 weekday rows prepopulate. |

**Field reuse:** Extract the `defaultSlotDuration`, `bufferMinutes`, and `days` field definitions into a shared module (`src/sanity/schemaTypes/_weeklyFields.ts`) used by both `weeklyScheduleType` and `seasonalScheduleType` to avoid drift.

**Validation:**
- Required: `name`, `startDate`, `endDate`, `days`.
- `endDate >= startDate` → "A befejező dátum nem lehet korábbi, mint a kezdő dátum."
- Range overlap with any other `seasonalSchedule` (custom async rule querying GROQ, excluding self by `_id != $id`) → "Ez az időszak átfedi a(z) '<name>' szezonális beosztást (<startDate> – <endDate>)."

**Preview:** Title = `name`. Subtitle = `${startDate} – ${endDate}`.

**Desk structure:** In `src/sanity/desk/structure.ts`, add a list "Szezonális beosztások" next to "Heti beosztás", ordered by `startDate` asc.

## Slot resolution

New pure helper in `src/lib/slots.ts`:

```ts
export interface SeasonalScheduleSummary {
  startDate: string;       // "YYYY-MM-DD"
  endDate: string;         // "YYYY-MM-DD"
  defaultSlotDuration: number;
  bufferMinutes: number;
  days: ScheduleForAvailability["days"];
}

export interface ResolvedSchedule {
  defaultSlotDuration: number;
  bufferMinutes: number;
  days: ScheduleForAvailability["days"];
}

export function resolveScheduleForDate(
  date: string,
  defaultSchedule: ResolvedSchedule,
  seasonalSchedules: SeasonalScheduleSummary[],
): ResolvedSchedule;
```

Algorithm:
1. From `seasonalSchedules`, find those where `startDate <= date <= endDate`.
2. If any matched, pick the one with the earliest `startDate` (deterministic in case of a race).
3. Return its `{defaultSlotDuration, bufferMinutes, days}`, or `defaultSchedule` if none matched.

The resolver returns the same shape that `generateAvailableSlots` already consumes — no changes to `generateAvailableSlots` itself.

## Queries — `src/sanity/lib/queries.ts`

```groq
seasonalScheduleForDateQuery:
  *[_type == "seasonalSchedule" && startDate <= $date && endDate >= $date]
    | order(startDate asc) [0]{
      _id, name, startDate, endDate,
      defaultSlotDuration, bufferMinutes,
      days[]{ _key, dayOfWeek, isDayOff, startTime, endTime }
    }

seasonalSchedulesForRangeQuery:
  *[_type == "seasonalSchedule" && startDate <= $endDate && endDate >= $startDate]
    | order(startDate asc){
      _id, name, startDate, endDate,
      defaultSlotDuration, bufferMinutes,
      days[]{ _key, dayOfWeek, isDayOff, startTime, endTime }
    }
```

All seasonal fetches tagged `["seasonalSchedule"]`.

## Touch points

Every callsite that currently fetches `weeklyScheduleQuery` also fetches seasonal data and routes it through `resolveScheduleForDate`:

- `src/app/api/slots/route.ts` — single-date slot listing → use `seasonalScheduleForDateQuery`.
- `src/app/api/slots/availability/route.ts` — month range for calendar → use `seasonalSchedulesForRangeQuery`.
- `src/app/api/slots/calendar/route.ts` — same.
- `src/app/api/booking/route.ts` — slot validation on confirm → `seasonalScheduleForDateQuery`.
- `src/app/api/checkout/route.ts` — same.
- `src/app/idopontfoglalas/page.tsx` — public booking SSR → range query.
- `src/app/foglalas/[token]/page.tsx` — per-token booking SSR → range query.

Not a touch point: `src/app/api/admin/booking-create/route.ts` accepts any `slotDate` + `slotTime` the admin types — no schedule validation today, and adding one is out of scope for this feature.

## Revalidation — `src/app/api/revalidate/route.ts`

Add `seasonalSchedule: ["seasonalSchedule"]` to the tag map.

## Edge cases

- **Boundary dates:** Inclusive on both ends — date == startDate or date == endDate is inside.
- **All days off in seasonal:** Resolver returns the schedule as-is; `generateAvailableSlots` already returns `[]` for an all-off pattern. No special handling.
- **Mid-booking schedule change:** Existing `slotLock` flow protects in-flight bookings (the lock holds the specific time); slot listings refresh after revalidation.
- **Validator race / overlap at read time:** Deterministic earliest-`startDate` pick + `console.warn` in the resolver.

## Testing

- **Unit tests for `resolveScheduleForDate`** (new tests in `src/lib/slots.test.ts` or sibling):
  - Date inside one seasonal range → returns seasonal.
  - Date on `startDate` boundary → returns seasonal.
  - Date on `endDate` boundary → returns seasonal.
  - Date outside any range → returns default.
  - Empty `seasonalSchedules[]` → returns default.
  - Two overlapping seasonals (regression for the race-safety net) → returns earliest `startDate`.
- **Existing `generateAvailableSlots` tests:** unchanged.
- **Manual smoke test:**
  1. Create "Nyári beosztás" for the upcoming month with reduced hours and one day-off shifted.
  2. Open `/idopontfoglalas`, navigate to a date in that range, confirm the displayed slots match the seasonal pattern (not the default).
  3. Add a `blockedDate` inside the range → that day shows no slots.
  4. Add a `customAvailability` inside the range with different hours → that day shows the custom hours but seasonal's slot duration/buffer.
  5. Book a slot end-to-end (slot-hold → booking confirm) and verify validation passes.
  6. Repeat from the admin manual-booking modal.

## Out of scope

- Active/inactive toggle on seasonals.
- Service-level filtering on seasonals.
- Timezone field.
- Customer-facing seasonal indicator/banner.
- Anything not listed in "Touch points".
