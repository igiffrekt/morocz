# Configurable Booking Window — Design Spec

## Goal

Let the admin set how far in the future patients can book a slot. The current limit is hardcoded at 30 days in four places; make it configurable from a single field in Sanity Studio.

## Decisions

- **Scope:** global (one value for the whole site, all services).
- **Location:** a new field on the existing `weeklySchedule` document, alongside `defaultSlotDuration` and `bufferMinutes`. Seasonal schedules do NOT override it — `seasonalSchedule` is about *which hours are open*, not *booking policy*.
- **Default:** `30` (preserves current behavior).
- **Bounds:** integer in `[1, 365]`.

## Schema

Add to `src/sanity/schemaTypes/weeklyScheduleType.ts` (not to `_weeklyFields.ts` since it isn't shared with `seasonalSchedule`):

```ts
defineField({
  name: "bookingWindowDays",
  title: "Foglalási ablak (nap)",
  type: "number",
  description: "Hány nappal előre foglalhatnak a páciensek időpontot.",
  initialValue: 30,
  validation: (rule) => rule.required().integer().min(1).max(365),
})
```

Placed between `bufferMinutes` and `days`.

## Query

`weeklyScheduleQuery` in `src/sanity/lib/queries.ts` projection currently returns `defaultSlotDuration`, `bufferMinutes`, `days[]`. Add `bookingWindowDays` to the projection.

## Resolver / propagation

`generateAvailableSlots` already accepts `maxDaysAhead`. The change is purely at the callsites — replace `maxDaysAhead: 30` with `maxDaysAhead: schedule?.bookingWindowDays ?? 30`:

- `src/app/api/slots/route.ts:216`
- `src/app/api/slots/availability/route.ts:230` and `:243`
- `src/app/api/booking/route.ts:307`

Update the inline `schedule` type in each route to include `bookingWindowDays`.

`getAvailableDatesInRange` (used by `src/app/api/slots/calendar/route.ts`) doesn't take a `maxDaysAhead` parameter — the calendar route currently walks every day in the requested month range with no horizon enforcement. Add the same cap there: compute "today's Budapest local date", skip iteration when `daysAhead > bookingWindowDays`.

`isDayBookable` / `getAvailableDatesInRange` already implements a *lower* bound (no past dates); only the *upper* bound is missing.

## Frontend

No required changes. Dates beyond the window naturally have zero slots:

- `/api/slots/availability` returns `{ available: 0, total: 0 }` for those dates (the day-stripe disappears).
- `/api/slots/calendar` will no longer include them in `availableDates` after the cap is added (so they won't get the green dot).

Visually greying out the entire date cell in `Step2DateTime` is an optional follow-up; out of scope here.

## Touch points summary

**Modified files:**
- `src/sanity/schemaTypes/weeklyScheduleType.ts` — add field.
- `src/sanity/lib/queries.ts` — add to projection.
- `src/app/api/slots/route.ts` — widen `schedule` type + use `bookingWindowDays`.
- `src/app/api/slots/availability/route.ts` — same; both `maxDaysAhead` callsites.
- `src/app/api/slots/calendar/route.ts` — widen `schedule` type + add daysAhead cap in day loop.
- `src/app/api/booking/route.ts` — widen `schedule` type in `getAlternativeSlots` + use `bookingWindowDays`.
- `sanity.types.ts` — regenerated via `npm run typegen`.

**No new files.**

## Backfill

Existing `weeklySchedule` documents won't have `bookingWindowDays` until edited. The `?? 30` fallback at the callsite preserves current behavior. After deploy, the admin should open Heti beosztás and save once so the field gets populated (`initialValue` only applies on document creation; for an existing doc the field stays `undefined` until manually saved).

## Testing

The resolver isn't affected, so existing tests stay green. No new unit tests are required (the change is a single number being passed through). The manual smoke test gains one check: set `bookingWindowDays = 7`, confirm the 8th day onward has no slots / no calendar highlight.

## Edge cases

- **Field is null/undefined on the doc:** fallback to `30`. Same behavior as today.
- **Field is `0`:** validation min(1) prevents this in Studio; if it slipped through, `daysAhead > 0` would block everything except today. Acceptable.
- **Time zone:** `daysAhead` is computed in Budapest local time (consistent with the existing `formatBudapestLocal` / `isDayBookable` machinery).
- **Seasonal schedule active:** the seasonal `bufferMinutes` / `defaultSlotDuration` / `days` are used for that date; `bookingWindowDays` always comes from `weeklySchedule`.
- **No `weeklySchedule` document:** `?? 30` covers this. Pre-existing fallback path in all four routes.

## Out of scope

- Per-service booking-window overrides.
- Minimum lead time (e.g., "must book at least 2h in advance" — different feature).
- Holiday-aware countdown (e.g., "30 *working* days").
- Visually disabling far-future date cells in `Step2DateTime`.
