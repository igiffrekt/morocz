# Configurable Booking Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin set a global `bookingWindowDays` value on `weeklySchedule` to control how far in the future a patient can book. Replaces four hardcoded `maxDaysAhead: 30` callsites and adds the same cap to `/api/slots/calendar`.

**Architecture:** Single new field on `weeklyScheduleType`. Add to `weeklyScheduleQuery` projection. Each API route reads `schedule?.bookingWindowDays ?? 30` and either passes it to `generateAvailableSlots` (slots / availability / booking) or enforces the day cap directly in its own day loop (calendar).

**Tech Stack:** Next.js 15, Sanity v4, TypeScript, GROQ.

**Spec:** `docs/superpowers/specs/2026-05-15-booking-window-design.md`

---

## File Structure

**Modified files (no new files):**
- `src/sanity/schemaTypes/weeklyScheduleType.ts` — add `bookingWindowDays` field.
- `src/sanity/lib/queries.ts` — extend `weeklyScheduleQuery` projection.
- `src/app/api/slots/route.ts` — widen `schedule` inline type; use `bookingWindowDays`.
- `src/app/api/slots/availability/route.ts` — same; two `maxDaysAhead` callsites.
- `src/app/api/slots/calendar/route.ts` — widen `schedule` inline type; add daysAhead cap in day loop.
- `src/app/api/booking/route.ts` — widen `schedule` inline type in `getAlternativeSlots`; use `bookingWindowDays`.
- `sanity.types.ts` — regenerated.

---

## Task 1: Add `bookingWindowDays` field to `weeklyScheduleType`

**Files:**
- Modify: `src/sanity/schemaTypes/weeklyScheduleType.ts`

- [ ] **Step 1: Add the field**

In `src/sanity/schemaTypes/weeklyScheduleType.ts`, the file currently reads:

```ts
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
```

Change it to:

```ts
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
```

Field placement is intentional: between `bufferMinutes` and `days`, so the booking-meta fields cluster at the top.

The field is NOT exported and NOT added to `_weeklyFields.ts` because `seasonalSchedule` does not need a per-schedule window override (per spec).

- [ ] **Step 2: Regenerate Sanity types**

```bash
npm run typegen
```

If `typegen` alone doesn't pick up the new field (because `schema.json` is sourced from the deployed dataset), regenerate `schema.json` from local sources first. The earlier Task 5 of the seasonal-schedule plan used the same workaround:

```bash
SANITY_AUTH_TOKEN_PATH=/Users/igiffrekt-m4/projects/morocz/.env.local npx sanity schema extract --enforce-required-fields
npm run typegen
```

Use whichever approach worked on the seasonal-schedule branch.

Verify:

```bash
grep -n "bookingWindowDays" sanity.types.ts | head
```

Expected: at least one match showing `bookingWindowDays: number | null` in the `WeeklySchedule` type.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/weeklyScheduleType.ts sanity.types.ts schema.json
git commit -m "Add bookingWindowDays field to weeklySchedule"
```

(Include `schema.json` only if `sanity schema extract` was run and modified it; otherwise omit it from the `git add`.)

---

## Task 2: Add `bookingWindowDays` to `weeklyScheduleQuery` projection

**Files:**
- Modify: `src/sanity/lib/queries.ts`

- [ ] **Step 1: Extend the projection**

In `src/sanity/lib/queries.ts`, the current query at line 228 reads:

```ts
export const weeklyScheduleQuery = defineQuery(`*[_type == "weeklySchedule" && _id == "weeklySchedule"][0]{
  defaultSlotDuration,
  bufferMinutes,
  days[]{
    _key,
    dayOfWeek,
    isDayOff,
    startTime,
    endTime
  }
}`);
```

Replace it with:

```ts
export const weeklyScheduleQuery = defineQuery(`*[_type == "weeklySchedule" && _id == "weeklySchedule"][0]{
  defaultSlotDuration,
  bufferMinutes,
  bookingWindowDays,
  days[]{
    _key,
    dayOfWeek,
    isDayOff,
    startTime,
    endTime
  }
}`);
```

- [ ] **Step 2: Regenerate types**

```bash
npm run typegen
```

Verify:

```bash
grep -n "bookingWindowDays" sanity.types.ts
```

Expected: matches in the `WeeklySchedule` type AND in the `WeeklyScheduleQueryResult` type.

- [ ] **Step 3: Verify TS**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/lib/queries.ts sanity.types.ts
git commit -m "Project bookingWindowDays in weeklyScheduleQuery"
```

---

## Task 3: Use `bookingWindowDays` in `/api/slots/route.ts`

**Files:**
- Modify: `src/app/api/slots/route.ts`

- [ ] **Step 1: Widen the `schedule` inline type**

In `src/app/api/slots/route.ts`, find the `Promise.all` block (the one with `weeklyScheduleQuery`). The `sanityFetch` for `weeklyScheduleQuery` currently has an inline type like:

```ts
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{
          _key: string;
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      } | null>({
        query: weeklyScheduleQuery,
        tags: ["weeklySchedule"],
      }),
```

Add `bookingWindowDays: number | null;` between `bufferMinutes` and `days`. (Use `number | null` because Sanity's generated type marks the field nullable for documents that haven't been saved with it yet.)

```ts
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        bookingWindowDays: number | null;
        days: Array<{
          _key: string;
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      } | null>({
        query: weeklyScheduleQuery,
        tags: ["weeklySchedule"],
      }),
```

- [ ] **Step 2: Use `bookingWindowDays` at the `generateAvailableSlots` callsite**

Find the call to `generateAvailableSlots(...)` at around line 184. It currently passes `maxDaysAhead: 30`. Replace that line with:

```ts
      maxDaysAhead: schedule?.bookingWindowDays ?? 30,
```

(Keep all other arguments to `generateAvailableSlots` exactly as they are.)

- [ ] **Step 3: Verify TS**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/slots/route.ts
git commit -m "Apply bookingWindowDays in /api/slots"
```

---

## Task 4: Use `bookingWindowDays` in `/api/slots/availability/route.ts`

**Files:**
- Modify: `src/app/api/slots/availability/route.ts`

This file has TWO `generateAvailableSlots` callsites (one for `total`, one for `available`), and one `Promise.all` `weeklyScheduleQuery` fetch.

- [ ] **Step 1: Widen the `schedule` inline type**

Find the `sanityFetch` for `weeklyScheduleQuery` in the `Promise.all`. Add `bookingWindowDays: number | null;` to the inline type between `bufferMinutes` and `days`, identical to Task 3 Step 1.

- [ ] **Step 2: Update both `generateAvailableSlots` callsites**

Find the line `maxDaysAhead: 30,` near line 230 (`total = generateAvailableSlots({...})`). Replace with:

```ts
      maxDaysAhead: schedule?.bookingWindowDays ?? 30,
```

Find the SECOND `maxDaysAhead: 30,` near line 243 (`available = generateAvailableSlots({...})`). Replace with the SAME line.

Both callsites read `bookingWindowDays` from the same `schedule` variable that was fetched once at the top, so no extra logic is needed.

- [ ] **Step 3: Verify TS**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/slots/availability/route.ts
git commit -m "Apply bookingWindowDays in /api/slots/availability"
```

---

## Task 5: Use `bookingWindowDays` in `/api/slots/calendar/route.ts`

**Files:**
- Modify: `src/app/api/slots/calendar/route.ts`

The calendar route does NOT call `generateAvailableSlots`. It walks every day of the requested month directly and pushes dates that have any availability. Today it has no upper-bound horizon — we need to add one.

- [ ] **Step 1: Widen the `schedule` inline type**

In `src/app/api/slots/calendar/route.ts`, the `weeklyScheduleQuery` fetch currently has the inline type:

```ts
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      } | null>({
        query: weeklyScheduleQuery,
        tags: ["weeklySchedule"],
      }),
```

Add `bookingWindowDays: number | null;` between `bufferMinutes` and `days`:

```ts
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        bookingWindowDays: number | null;
        days: Array<{
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      } | null>({
        query: weeklyScheduleQuery,
        tags: ["weeklySchedule"],
      }),
```

- [ ] **Step 2: Compute the horizon date before the day loop**

After the `Promise.all` block and before `const availableDates: string[] = [];`, add:

```ts
    const bookingWindowDays = schedule?.bookingWindowDays ?? 30;
    // Budapest-local "today" + window = last bookable date (inclusive)
    const todayBudapest = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Budapest",
    }).format(new Date()); // "YYYY-MM-DD"
    const horizon = new Date(todayBudapest);
    horizon.setUTCDate(horizon.getUTCDate() + bookingWindowDays);
    const horizonStr = horizon.toISOString().slice(0, 10);
```

Note: this gives us an inclusive horizon — `dateStr <= horizonStr` matches "today + N days" exactly, consistent with `generateAvailableSlots` which checks `daysAhead > maxDaysAhead` returns nothing (so the largest allowed `daysAhead` is `maxDaysAhead`, i.e. today + N days).

- [ ] **Step 3: Add the horizon cap inside the day loop**

Find the `while (current <= lastDay) { ... }` loop. Inside it, immediately after `const dateStr = current.toISOString().slice(0, 10);`, add a guard that skips dates beyond the horizon:

```ts
      // Cap at booking window — dates beyond this are not bookable.
      if (dateStr > horizonStr) {
        current.setUTCDate(current.getUTCDate() + 1);
        continue;
      }
```

This goes BEFORE the existing `if (customByDate.has(dateStr))` check, so the cap also blocks customAvailability dates that fall beyond the window. This is intentional — `bookingWindowDays` is the system-wide horizon and overrides any custom-availability date set further out.

- [ ] **Step 4: Verify TS**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/slots/calendar/route.ts
git commit -m "Enforce bookingWindowDays in /api/slots/calendar"
```

---

## Task 6: Use `bookingWindowDays` in `/api/booking/route.ts`

**Files:**
- Modify: `src/app/api/booking/route.ts`

The relevant call lives inside `getAlternativeSlots` (around line 307). The `schedule` value comes from the helper's own `Promise.all`.

- [ ] **Step 1: Widen the `schedule` inline type in `getAlternativeSlots`**

In the `getAlternativeSlots` helper, find the `sanityFetch` for `weeklyScheduleQuery` inside its `Promise.all`. The current inline type is the same shape as Task 3. Add `bookingWindowDays: number | null;` between `bufferMinutes` and `days`.

- [ ] **Step 2: Use `bookingWindowDays` at the `generateAvailableSlots` callsite**

Find `maxDaysAhead: 30,` near line 307 (inside `getAlternativeSlots`). Replace with:

```ts
      maxDaysAhead: schedule?.bookingWindowDays ?? 30,
```

- [ ] **Step 3: Verify TS**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/booking/route.ts
git commit -m "Apply bookingWindowDays in booking alternative-slot suggestions"
```

---

## Task 7: Full verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all existing resolver tests still pass (6 tests). No new test is required for this change — it's a single number being threaded through.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Confirm no NEW biome violations**

```bash
npm run lint:biome
```

Expected: same set of pre-existing violations as before this change. No new violations from files modified in Tasks 1–6.

If the calendar route's added block trips an `assist/source/organizeImports` or similar fixable hint, run `npx biome check --write src/app/api/slots/calendar/route.ts` and amend the commit.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: successful build.

- [ ] **Step 5: Confirm no stray `maxDaysAhead: 30` constants remain**

```bash
grep -rn "maxDaysAhead:\s*30" src/app/api/
```

Expected: no matches.

---

## Task 8: Manual smoke test

This is a checklist for the implementer to run against a local dev server.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Set the window to 7 days**

In `/studio` → Időpontfoglalás → Heti beosztás, set `Foglalási ablak (nap)` to `7`. Save.

- [ ] **Step 3: Verify the calendar reflects the window**

Open `/idopontfoglalas`, advance to date selection. The first 7 days from today should have availability dots; day 8 onward should not. Navigating to next month should show every day greyed out (no green dots).

- [ ] **Step 4: Verify the time-slot step respects the window**

For a date within the window (e.g., day 6): time slots load normally.
For a date beyond the window (e.g., day 10 — you may need to navigate via URL or have an existing booking link): no time slots are shown.

- [ ] **Step 5: Reset the window**

Set `Foglalási ablak (nap)` back to `30` (or whatever the original value should be) and save.

- [ ] **Step 6: Confirm full month again shows availability**

Reload `/idopontfoglalas`. The next 30 days behave as before.

---

## Self-review notes

Verified before publishing this plan:

- Every spec section has a corresponding task: schema field (Task 1), query projection (Task 2), each API touch point (Tasks 3–6), verification (Task 7), smoke test (Task 8).
- No placeholders. Every code change is shown in full.
- The Sanity-generated field type is `bookingWindowDays: number | null` (Sanity marks unset fields nullable); the inline types in routes use this nullable form, and `??` falls back to `30`.
- The calendar route adds a horizon cap consistent with `generateAvailableSlots`'s `daysAhead > maxDaysAhead` semantics (inclusive of `today + bookingWindowDays`).
- The cap is enforced BEFORE customAvailability lookup so far-future custom-availability dates are also blocked.
