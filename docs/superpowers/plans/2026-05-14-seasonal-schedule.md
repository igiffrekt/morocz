# Seasonal Booking Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins define one or more named seasonal schedules (date-range-bound weekly patterns) that override the default `weeklySchedule` when a booking falls inside their range.

**Architecture:** New `seasonalSchedule` document type (clone of `weeklySchedule` + `name` + `startDate` + `endDate`). A pure `resolveScheduleForDate` helper in `src/lib/slots.ts` picks the active schedule per date. Every API path that today fetches `weeklyScheduleQuery` is updated to also fetch seasonal data and route it through the resolver. Precedence: `blockedDate` → `customAvailability` → seasonal → default.

**Tech Stack:** Next.js 15, Sanity v4, TypeScript, vitest (new), GROQ.

**Spec:** `docs/superpowers/specs/2026-05-14-seasonal-schedule-design.md`

---

## File Structure

**New files:**
- `src/sanity/schemaTypes/_weeklyFields.ts` — shared field defs reused by `weeklySchedule` + `seasonalSchedule`.
- `src/sanity/schemaTypes/seasonalScheduleType.ts` — new document type.
- `src/lib/slots.test.ts` — vitest tests for `resolveScheduleForDate`.
- `vitest.config.ts` — minimal vitest config.

**Modified files:**
- `package.json` — add vitest devDep + `test` script.
- `src/sanity/schemaTypes/weeklyScheduleType.ts` — consume shared fields from `_weeklyFields.ts`.
- `src/sanity/schemaTypes/index.ts` — register `seasonalScheduleType`.
- `src/sanity/desk/structure.ts` — add "Szezonális beosztások" list item.
- `src/sanity/lib/queries.ts` — add `seasonalScheduleForDateQuery` + `seasonalSchedulesForRangeQuery`.
- `src/lib/slots.ts` — add `resolveScheduleForDate` + supporting types.
- `src/app/api/slots/route.ts` — call resolver before customAvailability override.
- `src/app/api/slots/availability/route.ts` — same.
- `src/app/api/slots/calendar/route.ts` — same.
- `src/app/api/booking/route.ts` — `getAlternativeSlots` helper.
- `src/app/api/checkout/route.ts` — `getAlternativeSlots` helper.
- `src/app/api/revalidate/route.ts` — add `seasonalSchedule` → `["seasonalSchedule"]` mapping.
- `sanity.types.ts` — regenerated via `npm run typegen`.

**Not touched (deliberate):**
- `src/app/idopontfoglalas/page.tsx`, `src/app/foglalas/[token]/page.tsx` — they pass `scheduleData` to the client only as an offline fallback for `/api/slots/calendar`; the API is authoritative.
- `src/app/api/admin/booking-create/route.ts` — admin freeform booking, no schedule validation today.

---

## Task 1: Add vitest to the project

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

```bash
npm install --save-dev vitest
```

Expected: vitest appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Add a `test` script to `package.json`**

In `package.json`, inside the `"scripts"` object, add `"test": "vitest run"` (and `"test:watch": "vitest"`). Final scripts block should look like:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:biome": "biome check .",
  "lint:biome:fix": "biome check --write .",
  "format": "biome format --write .",
  "typegen": "sanity typegen generate",
  "deploy": "bash scripts/deploy.sh",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create minimal `vitest.config.ts`**

Create `vitest.config.ts` in the repo root:

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 4: Sanity-check vitest runs**

```bash
npm test
```

Expected: vitest runs, reports "No test files found" (exit code 0 or "no tests"). That's fine — the test file comes in Task 6.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "Add vitest test runner"
```

---

## Task 2: Extract shared weekly-fields module

**Files:**
- Create: `src/sanity/schemaTypes/_weeklyFields.ts`
- Modify: `src/sanity/schemaTypes/weeklyScheduleType.ts`

- [ ] **Step 1: Create the shared field module**

Create `src/sanity/schemaTypes/_weeklyFields.ts` with the three field definitions currently inlined in `weeklyScheduleType.ts`:

```ts
import { defineField } from "sanity";

export const defaultSlotDurationField = defineField({
  name: "defaultSlotDuration",
  title: "Alapértelmezett időpont hossz (perc)",
  type: "number",
  options: {
    list: [
      { title: "10 perc", value: 10 },
      { title: "15 perc", value: 15 },
      { title: "20 perc", value: 20 },
      { title: "30 perc", value: 30 },
      { title: "45 perc", value: 45 },
      { title: "60 perc", value: 60 },
    ],
  },
  initialValue: 20,
  validation: (rule) => rule.required(),
});

export const bufferMinutesField = defineField({
  name: "bufferMinutes",
  title: "Szünet időpontok között (perc)",
  type: "number",
  description: "Perc szünet két időpont között (0 = nincs szünet)",
  initialValue: 0,
  validation: (rule) => rule.min(0),
});

export const daysField = defineField({
  name: "days",
  title: "Munkanapok",
  type: "array",
  of: [
    {
      type: "object",
      fields: [
        defineField({
          name: "dayOfWeek",
          title: "Nap",
          type: "number",
          options: {
            list: [
              { title: "Hétfő", value: 1 },
              { title: "Kedd", value: 2 },
              { title: "Szerda", value: 3 },
              { title: "Csütörtök", value: 4 },
              { title: "Péntek", value: 5 },
              { title: "Szombat", value: 6 },
              { title: "Vasárnap", value: 0 },
            ],
          },
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "isDayOff",
          title: "Szabadnap",
          type: "boolean",
          description: "Jelölje be, ha ezen a napon nincs rendelés",
          initialValue: false,
        }),
        defineField({
          name: "startTime",
          title: "Kezdés",
          type: "string",
          description: "Formátum: HH:MM (pl. 08:00)",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { isDayOff?: boolean };
              if (!parent?.isDayOff && !value) return "Kötelező, ha nem szabadnap";
              return true;
            }),
        }),
        defineField({
          name: "endTime",
          title: "Befejezés",
          type: "string",
          description: "Formátum: HH:MM (pl. 16:00)",
          validation: (rule) =>
            rule.custom((value, context) => {
              const parent = context.parent as { isDayOff?: boolean };
              if (!parent?.isDayOff && !value) return "Kötelező, ha nem szabadnap";
              return true;
            }),
        }),
      ],
      preview: {
        select: {
          dayOfWeek: "dayOfWeek",
          isDayOff: "isDayOff",
          startTime: "startTime",
          endTime: "endTime",
        },
        prepare({ dayOfWeek, isDayOff, startTime, endTime }) {
          const dayNames: Record<number, string> = {
            0: "Vasárnap",
            1: "Hétfő",
            2: "Kedd",
            3: "Szerda",
            4: "Csütörtök",
            5: "Péntek",
            6: "Szombat",
          };
          const dayName = dayNames[dayOfWeek as number] ?? "Ismeretlen nap";
          const subtitle = isDayOff
            ? "Szabadnap"
            : startTime && endTime
              ? `${startTime} – ${endTime}`
              : "Nincs beállítva";
          return { title: dayName, subtitle };
        },
      },
    },
  ],
  initialValue: [
    { _key: "mon", dayOfWeek: 1, isDayOff: false, startTime: "", endTime: "" },
    { _key: "tue", dayOfWeek: 2, isDayOff: false, startTime: "", endTime: "" },
    { _key: "wed", dayOfWeek: 3, isDayOff: false, startTime: "", endTime: "" },
    { _key: "thu", dayOfWeek: 4, isDayOff: false, startTime: "", endTime: "" },
    { _key: "fri", dayOfWeek: 5, isDayOff: false, startTime: "", endTime: "" },
    { _key: "sat", dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
    { _key: "sun", dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
  ],
  validation: (rule) => rule.length(7).error("Pontosan 7 napnak kell lennie"),
});
```

- [ ] **Step 2: Refactor `weeklyScheduleType.ts` to consume the shared fields**

Replace the contents of `src/sanity/schemaTypes/weeklyScheduleType.ts` with:

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

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors related to schemas.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/_weeklyFields.ts src/sanity/schemaTypes/weeklyScheduleType.ts
git commit -m "Extract shared weekly-schedule field defs"
```

---

## Task 3: Create `seasonalScheduleType` schema (without overlap validation)

**Files:**
- Create: `src/sanity/schemaTypes/seasonalScheduleType.ts`

Overlap validation is added in Task 4; this task gets the basic schema in place first so it can be registered and tested.

- [ ] **Step 1: Create the file with `name`, date range, and reused weekly fields**

Create `src/sanity/schemaTypes/seasonalScheduleType.ts`:

```ts
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
      description: "Pl. „Nyári beosztás\", „Karácsony\"",
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
        rule.required().custom((value, context) => {
          const parent = context.document as
            | { startDate?: string }
            | undefined;
          if (!value || !parent?.startDate) return true;
          if (value < parent.startDate) {
            return "A befejező dátum nem lehet korábbi, mint a kezdő dátum.";
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
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemaTypes/seasonalScheduleType.ts
git commit -m "Add seasonalSchedule document type"
```

---

## Task 4: Add overlap validation to seasonalSchedule

**Files:**
- Modify: `src/sanity/schemaTypes/seasonalScheduleType.ts`

Validates that `[startDate, endDate]` does not overlap any other `seasonalSchedule` document. Applied on the `endDate` field (so it triggers once both dates are filled in).

- [ ] **Step 1: Update the `endDate` validation to chain overlap check after date-order check**

In `src/sanity/schemaTypes/seasonalScheduleType.ts`, replace the `endDate` field with:

```ts
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
            return `Ez az időszak átfedi a(z) „${overlapping.name}\" szezonális beosztást (${overlapping.startDate} – ${overlapping.endDate}).`;
          }
          return true;
        }),
    }),
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemaTypes/seasonalScheduleType.ts
git commit -m "Validate seasonal schedules do not overlap"
```

---

## Task 5: Register seasonalSchedule in schema index and desk structure

**Files:**
- Modify: `src/sanity/schemaTypes/index.ts`
- Modify: `src/sanity/desk/structure.ts`

- [ ] **Step 1: Add import + entry in `schemaTypes/index.ts`**

In `src/sanity/schemaTypes/index.ts`:

1. Add the import alphabetically after `popupType`:

```ts
import { seasonalScheduleType } from "./seasonalScheduleType";
```

2. Insert `seasonalScheduleType` into the `schemaTypes` array right after `weeklyScheduleType`. The booking-related cluster should read:

```ts
  weeklyScheduleType,
  seasonalScheduleType,
  blockedDateType,
  customAvailabilityType,
```

- [ ] **Step 2: Add desk-structure list item**

In `src/sanity/desk/structure.ts`, inside the "Időpontfoglalás" group (the `items([...])` array on or near line 54), insert this list item directly after "Heti beosztás":

```ts
              S.listItem()
                .title("Szezonális beosztások")
                .schemaType("seasonalSchedule")
                .child(
                  S.documentTypeList("seasonalSchedule")
                    .title("Szezonális beosztások")
                    .defaultOrdering([{ field: "startDate", direction: "asc" }]),
                ),
```

- [ ] **Step 3: Regenerate Sanity types**

```bash
npm run typegen
```

Expected: `sanity.types.ts` is updated; it should now contain a `SeasonalSchedule` type. Quickly verify:

```bash
grep -n "SeasonalSchedule\|seasonalSchedule" sanity.types.ts | head
```

- [ ] **Step 4: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/sanity/schemaTypes/index.ts src/sanity/desk/structure.ts sanity.types.ts
git commit -m "Register seasonalSchedule in schema index and Studio desk"
```

---

## Task 6: Write `resolveScheduleForDate` tests (failing)

**Files:**
- Create: `src/lib/slots.test.ts`

TDD step — these tests fail until Task 7 ships the implementation.

- [ ] **Step 1: Create the test file**

Create `src/lib/slots.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  type ResolvedSchedule,
  type SeasonalScheduleSummary,
  resolveScheduleForDate,
} from "./slots";

const defaultSchedule: ResolvedSchedule = {
  defaultSlotDuration: 20,
  bufferMinutes: 0,
  days: [
    { dayOfWeek: 1, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 2, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 3, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 4, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 5, isDayOff: false, startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
    { dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
  ],
};

function makeSeasonal(
  startDate: string,
  endDate: string,
  overrides: Partial<SeasonalScheduleSummary> = {},
): SeasonalScheduleSummary {
  return {
    startDate,
    endDate,
    defaultSlotDuration: 15,
    bufferMinutes: 5,
    days: [
      { dayOfWeek: 1, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 2, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 3, isDayOff: true, startTime: "", endTime: "" },
      { dayOfWeek: 4, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 5, isDayOff: false, startTime: "09:00", endTime: "13:00" },
      { dayOfWeek: 6, isDayOff: true, startTime: "", endTime: "" },
      { dayOfWeek: 0, isDayOff: true, startTime: "", endTime: "" },
    ],
    ...overrides,
  };
}

describe("resolveScheduleForDate", () => {
  it("returns the default schedule when no seasonals are provided", () => {
    const result = resolveScheduleForDate("2026-05-14", defaultSchedule, []);
    expect(result).toBe(defaultSchedule);
  });

  it("returns the default schedule when no seasonal covers the date", () => {
    const seasonals = [makeSeasonal("2026-06-01", "2026-08-31")];
    const result = resolveScheduleForDate("2026-05-14", defaultSchedule, seasonals);
    expect(result).toBe(defaultSchedule);
  });

  it("returns the seasonal schedule when the date is inside its range", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31");
    const result = resolveScheduleForDate("2026-07-15", defaultSchedule, [seasonal]);
    expect(result.defaultSlotDuration).toBe(15);
    expect(result.bufferMinutes).toBe(5);
    expect(result.days).toBe(seasonal.days);
  });

  it("treats startDate as inclusive", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31");
    const result = resolveScheduleForDate("2026-06-01", defaultSchedule, [seasonal]);
    expect(result.defaultSlotDuration).toBe(15);
  });

  it("treats endDate as inclusive", () => {
    const seasonal = makeSeasonal("2026-06-01", "2026-08-31");
    const result = resolveScheduleForDate("2026-08-31", defaultSchedule, [seasonal]);
    expect(result.defaultSlotDuration).toBe(15);
  });

  it("picks the seasonal with the earliest startDate when ranges overlap", () => {
    // Validator should prevent this at save time; resolver picks deterministically as a safety net.
    const earlier = makeSeasonal("2026-06-01", "2026-08-31", {
      defaultSlotDuration: 15,
    });
    const later = makeSeasonal("2026-07-15", "2026-09-15", {
      defaultSlotDuration: 30,
    });
    const result = resolveScheduleForDate("2026-08-01", defaultSchedule, [
      later, // intentionally out of order
      earlier,
    ]);
    expect(result.defaultSlotDuration).toBe(15);
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: vitest fails because `resolveScheduleForDate`, `ResolvedSchedule`, `SeasonalScheduleSummary` are not yet exported from `./slots`.

- [ ] **Step 3: Commit (failing tests)**

```bash
git add src/lib/slots.test.ts
git commit -m "Add failing tests for resolveScheduleForDate"
```

---

## Task 7: Implement `resolveScheduleForDate`

**Files:**
- Modify: `src/lib/slots.ts`

- [ ] **Step 1: Add types and the resolver function**

At the bottom of `src/lib/slots.ts` (after `getAvailableDatesInRange`), append:

```ts
export interface ResolvedSchedule {
  defaultSlotDuration: number;
  bufferMinutes: number;
  days: ScheduleForAvailability["days"];
}

export interface SeasonalScheduleSummary {
  startDate: string;        // "YYYY-MM-DD"
  endDate: string;          // "YYYY-MM-DD"
  defaultSlotDuration: number;
  bufferMinutes: number;
  days: ScheduleForAvailability["days"];
}

/**
 * Pick the schedule that applies for a target date.
 *
 * Returns the first seasonal whose [startDate, endDate] (inclusive) contains
 * `date`, preferring the one with the earliest startDate as a deterministic
 * tie-breaker if multiple overlap. Falls back to `defaultSchedule` when none match.
 *
 * Overlap is prevented at save time in Sanity; the earliest-startDate pick is a
 * safety net for race conditions or bypassed validation.
 */
export function resolveScheduleForDate(
  date: string,
  defaultSchedule: ResolvedSchedule,
  seasonalSchedules: SeasonalScheduleSummary[],
): ResolvedSchedule {
  const matches = seasonalSchedules.filter(
    (s) => s.startDate <= date && date <= s.endDate,
  );
  if (matches.length === 0) return defaultSchedule;

  if (matches.length > 1) {
    console.warn(
      `[resolveScheduleForDate] ${matches.length} seasonal schedules overlap for ${date}; using earliest startDate.`,
    );
  }

  const pick = matches.reduce((earliest, s) =>
    s.startDate < earliest.startDate ? s : earliest,
  );
  return {
    defaultSlotDuration: pick.defaultSlotDuration,
    bufferMinutes: pick.bufferMinutes,
    days: pick.days,
  };
}
```

- [ ] **Step 2: Run tests — expect pass**

```bash
npm test
```

Expected: all 6 `resolveScheduleForDate` tests pass.

- [ ] **Step 3: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/slots.ts
git commit -m "Implement resolveScheduleForDate"
```

---

## Task 8: Add seasonal Sanity queries

**Files:**
- Modify: `src/sanity/lib/queries.ts`

- [ ] **Step 1: Append two new queries to the "Scheduling & Booking Queries" section**

At the end of `src/sanity/lib/queries.ts` (after `servicesForBookingQuery`), append:

```ts
// Active seasonal schedule for a single date (used by /api/slots, /api/booking, /api/checkout).
// `order(startDate asc)[0]` is a deterministic safety net if two seasonals ever overlap;
// the Sanity validator prevents overlap at save time.
export const seasonalScheduleForDateQuery =
  defineQuery(`*[_type == "seasonalSchedule" && startDate <= $date && endDate >= $date]
    | order(startDate asc)[0]{
    _id,
    name,
    startDate,
    endDate,
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

// All seasonal schedules whose range intersects [$startDate, $endDate].
// Used by month-range endpoints (/api/slots/availability, /api/slots/calendar).
export const seasonalSchedulesForRangeQuery =
  defineQuery(`*[_type == "seasonalSchedule" && startDate <= $endDate && endDate >= $startDate]
    | order(startDate asc){
    _id,
    name,
    startDate,
    endDate,
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

- [ ] **Step 2: Regenerate types (queries are typed via `defineQuery`)**

```bash
npm run typegen
```

Expected: `sanity.types.ts` updates with `SeasonalScheduleForDateQueryResult` and `SeasonalSchedulesForRangeQueryResult`. Quick verify:

```bash
grep -n "SeasonalScheduleForDateQueryResult\|SeasonalSchedulesForRangeQueryResult" sanity.types.ts | head
```

- [ ] **Step 3: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/lib/queries.ts sanity.types.ts
git commit -m "Add GROQ queries for seasonal schedules"
```

---

## Task 9: Wire seasonal into `/api/slots/route.ts` (single date)

**Files:**
- Modify: `src/app/api/slots/route.ts`

The resolver picks the schedule (seasonal or default); the existing customAvailability override then layers on top.

- [ ] **Step 1: Update imports**

In `src/app/api/slots/route.ts`, replace the existing import block at the top:

```ts
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
```

- [ ] **Step 2: Add a seasonal fetch to the `Promise.all`**

Inside the `Promise.all` (currently destructuring `[schedule, blockedDatesDoc, customAvail, bookings, slotLocks, service]`), add `seasonal` as the second element. Resulting block:

```ts
    const [schedule, seasonal, blockedDatesDoc, customAvail, bookings, slotLocks, service] = await Promise.all([
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
      sanityFetch<{
        _id: string;
        startDate: string;
        endDate: string;
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
        query: seasonalScheduleForDateQuery,
        params: { date },
        tags: ["seasonalSchedule"],
      }),
      sanityFetch<{
        dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null;
      } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
      }),
      sanityFetch<{
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        services: Array<{ _id: string }> | null;
      } | null>({
        query: customAvailabilityForDateQuery,
        params: { date },
        tags: ["customAvailability"],
      }),
      sanityFetch<
        Array<{
          _id: string;
          slotDate: string;
          slotTime: string;
          service: { _id: string } | null;
        }>
      >({
        query: bookingsForDateQuery,
        params: { date },
        tags: ["booking"],
      }),
      sanityFetch<
        Array<{
          _id: string;
          slotDate: string;
          slotTime: string;
          status: string;
          heldUntil: string | null;
        }>
      >({
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
```

- [ ] **Step 3: Replace the `scheduleForSlots` initialization with the resolver**

In the section currently starting `// 6. Check if custom availability exists for this date and service`, replace:

```ts
    let scheduleForSlots = schedule ?? {
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [],
    };
```

with:

```ts
    const defaultSchedule = schedule ?? {
      defaultSlotDuration: 20,
      bufferMinutes: 0,
      days: [],
    };
    // Seasonal schedule (if any) overrides the default for this date.
    // customAvailability override below still applies on top.
    let scheduleForSlots = resolveScheduleForDate(
      date,
      defaultSchedule,
      seasonal ? [seasonal] : [],
    );
```

Leave the rest of the function unchanged — the customAvailability override that mutates `scheduleForSlots.days` continues to work because it operates on whatever `scheduleForSlots` is now.

- [ ] **Step 4: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/slots/route.ts
git commit -m "Apply seasonal schedule in /api/slots"
```

---

## Task 10: Wire seasonal into `/api/slots/availability/route.ts` (month range)

**Files:**
- Modify: `src/app/api/slots/availability/route.ts`

- [ ] **Step 1: Update imports**

In `src/app/api/slots/availability/route.ts`, replace the existing imports:

```ts
import { defineQuery } from "next-sanity";
import { generateAvailableSlots, resolveScheduleForDate } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  seasonalSchedulesForRangeQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
```

- [ ] **Step 2: Add seasonal fetch to the `Promise.all`**

After the existing `weeklySchedule` fetch and before `blockedDatesQuery`, insert a seasonal fetch. Modify the destructuring to include `seasonals`:

```ts
  const [schedule, seasonals, blockedDatesDoc, bookings, slotLocks, customAvails, service] = await Promise.all([
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
    sanityFetch<
      Array<{
        _id: string;
        startDate: string;
        endDate: string;
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{
          _key: string;
          dayOfWeek: number;
          isDayOff: boolean;
          startTime: string;
          endTime: string;
        }>;
      }>
    >({
      query: seasonalSchedulesForRangeQuery,
      params: { startDate, endDate },
      tags: ["seasonalSchedule"],
    }),
    sanityFetch<{
      dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null;
    } | null>({
      query: blockedDatesQuery,
      tags: ["blockedDate"],
    }),
    sanityFetch<Array<{ slotDate: string; slotTime: string }>>({
      query: bookingsForRangeQuery,
      params: { startDate, endDate },
      tags: ["booking"],
    }),
    sanityFetch<Array<{ slotDate: string; slotTime: string; status: string; heldUntil: string | null }>>({
      query: slotLocksForRangeQuery,
      params: { startDate, endDate },
      tags: ["slotLock"],
    }),
    sanityFetch<
      Array<{
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        services: Array<{ _id: string }> | null;
      }>
    >({
      query: customAvailabilityForMonthQuery,
      params: { startDate, endDate },
      tags: ["customAvailability"],
    }),
    sanityFetch<{ appointmentDuration: number } | null>({
      query: serviceByIdQuery,
      params: { serviceId },
      tags: ["service"],
    }),
  ]);
```

- [ ] **Step 3: Resolve per-day inside the day loop**

Inside the `for (let day = 1; day <= daysInMonth; day++) {` loop, replace the line:

```ts
    let scheduleToUse = { ...scheduleForSlots };
```

with:

```ts
    // Resolve seasonal-or-default schedule for this date, then layer customAvailability on top.
    const resolved = resolveScheduleForDate(dateStr, scheduleForSlots, seasonals);
    let scheduleToUse = { ...resolved };
```

The rest of the loop (customAvailability override that splices into `scheduleToUse.days`) continues unchanged.

- [ ] **Step 4: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/slots/availability/route.ts
git commit -m "Apply seasonal schedule in /api/slots/availability"
```

---

## Task 11: Wire seasonal into `/api/slots/calendar/route.ts` (calendar dot highlights)

**Files:**
- Modify: `src/app/api/slots/calendar/route.ts`

This endpoint walks each day to decide whether it has *any* working hours; needs to use the resolver per date.

- [ ] **Step 1: Update imports**

In `src/app/api/slots/calendar/route.ts`, replace the imports at the top:

```ts
import { defineQuery } from "next-sanity";
import { resolveScheduleForDate, type SeasonalScheduleSummary } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  seasonalSchedulesForRangeQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
```

- [ ] **Step 2: Fetch seasonals alongside schedule + blocked**

Replace the existing `Promise.all` (currently `[schedule, blockedDatesDoc, customAvails]`) with:

```ts
    const [schedule, seasonals, blockedDatesDoc, customAvails] = await Promise.all([
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
      sanityFetch<SeasonalScheduleSummary[]>({
        query: seasonalSchedulesForRangeQuery,
        params: { startDate, endDate },
        tags: ["seasonalSchedule"],
      }),
      sanityFetch<{
        dates: Array<{ date: string }> | null;
      } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
      }),
      sanityFetch<
        Array<{
          _id: string;
          date: string;
          startTime: string;
          endTime: string;
          services: Array<{ _id: string }> | null;
        }>
      >({
        query: customAvailabilityForMonthQuery,
        params: { startDate, endDate },
        tags: ["customAvailability"],
      }),
    ]);
```

(Note: `SeasonalScheduleSummary` from `@/lib/slots` is the structural superset needed for `resolveScheduleForDate`; the query result aligns.)

- [ ] **Step 3: Use resolver to pick the day config inside the day loop**

Replace the existing tail block — the section that begins with `// Otherwise check weekly schedule` — with:

```ts
      // Otherwise check seasonal-or-default schedule
      const defaultForDate = schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] };
      const resolved = resolveScheduleForDate(dateStr, defaultForDate, seasonals);
      const dayConfig = resolved.days.find((d) => d.dayOfWeek === dow);
      if (dayConfig && !dayConfig.isDayOff && dayConfig.startTime && dayConfig.endTime) {
        availableDates.push(dateStr);
      }
```

- [ ] **Step 4: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/slots/calendar/route.ts
git commit -m "Apply seasonal schedule in /api/slots/calendar"
```

---

## Task 12: Wire seasonal into `/api/booking/route.ts` (alternative slots)

**Files:**
- Modify: `src/app/api/booking/route.ts`

Only the `getAlternativeSlots` helper consults the schedule (around line 232). It generates a list of nearby slots to suggest after a slot collision; needs seasonal-awareness so the suggestions reflect the actual hours that day.

- [ ] **Step 1: Update imports**

In `src/app/api/booking/route.ts`, ensure these imports are present (add `resolveScheduleForDate` and `seasonalScheduleForDateQuery`):

```ts
import { generateAvailableSlots, resolveScheduleForDate } from "@/lib/slots";
```

```ts
import {
  // …existing imports…
  seasonalScheduleForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
```

(Keep all other existing imports in this file; only add the two above.)

- [ ] **Step 2: Add seasonal fetch + resolver call in `getAlternativeSlots`**

In the `getAlternativeSlots` helper, replace the existing `Promise.all` and the subsequent `generateAvailableSlots(...)` call with:

```ts
    const [schedule, seasonal, blockedDatesDoc, bookings, slotLocks, service] = await Promise.all([
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
      } | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
      sanityFetch<{
        _id: string;
        startDate: string;
        endDate: string;
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
        query: seasonalScheduleForDateQuery,
        params: { date: slotDate },
        tags: ["seasonalSchedule"],
      }),
      sanityFetch<{
        dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null;
      } | null>({ query: blockedDatesQuery, tags: ["blockedDate"] }),
      sanityFetch<Array<{ _id: string; slotTime: string }>>({
        query: bookingsForDateQuery,
        params: { date: slotDate },
        tags: ["booking"],
      }),
      sanityFetch<Array<{ _id: string; slotTime: string; status: string; heldUntil: string | null }>>({
        query: slotLocksForDateQuery,
        params: { date: slotDate },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceForEmailQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

    const bookedSlots = bookings.map((b) => b.slotTime);
    const now = new Date().toISOString();
    const heldSlots = slotLocks
      .filter((lock) =>
        lock.status === "booked" ||
        (lock.status === "held" && lock.heldUntil != null && lock.heldUntil > now),
      )
      .map((lock) => lock.slotTime)
      .filter(Boolean);

    const resolvedSchedule = resolveScheduleForDate(
      slotDate,
      schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] },
      seasonal ? [seasonal] : [],
    );

    const available = generateAvailableSlots({
      schedule: resolvedSchedule,
      blockedDates: (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean),
      bookedSlots,
      heldSlots,
      date: slotDate,
      serviceDurationMinutes: service?.appointmentDuration ?? 20,
      maxDaysAhead: 30,
    });
```

Leave the rest of `getAlternativeSlots` unchanged.

- [ ] **Step 3: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/booking/route.ts
git commit -m "Apply seasonal schedule in booking alternative-slot suggestions"
```

---

## Task 13: Wire seasonal into `/api/checkout/route.ts` (alternative slots)

**Files:**
- Modify: `src/app/api/checkout/route.ts`

Same pattern as Task 12 — checkout's `getAlternativeSlots` helper (line 241).

- [ ] **Step 1: Update imports**

In `src/app/api/checkout/route.ts`:

```ts
import { generateAvailableSlots, resolveScheduleForDate } from "@/lib/slots";
```

```ts
import {
  // …existing imports…
  seasonalScheduleForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";
```

- [ ] **Step 2: Add seasonal fetch + resolver call in `getAlternativeSlots`**

Replace the existing `Promise.all` and `generateAvailableSlots` block in `getAlternativeSlots` with:

```ts
    const [schedule, seasonal, blockedDatesDoc, bookings, slotLocks, service] = await Promise.all([
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
      sanityFetch<{
        _id: string;
        startDate: string;
        endDate: string;
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({
        query: seasonalScheduleForDateQuery,
        params: { date: slotDate },
        tags: ["seasonalSchedule"],
      }),
      sanityFetch<{ dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
      }),
      sanityFetch<Array<{ _id: string; slotTime: string }>>({
        query: bookingsForDateQuery,
        params: { date: slotDate },
        tags: ["booking"],
      }),
      sanityFetch<Array<{ _id: string; slotTime: string; status: string; heldUntil: string | null }>>({
        query: slotLocksForDateQuery,
        params: { date: slotDate },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceForCheckoutQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

    const bookedSlots = bookings.map((b) => b.slotTime);
    const now = new Date().toISOString();
    const heldSlots = slotLocks
      .filter((lock) =>
        lock.status === "booked" ||
        (lock.status === "held" && lock.heldUntil != null && lock.heldUntil > now),
      )
      .map((lock) => lock.slotTime)
      .filter(Boolean);

    const resolvedSchedule = resolveScheduleForDate(
      slotDate,
      schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] },
      seasonal ? [seasonal] : [],
    );

    const available = generateAvailableSlots({
      schedule: resolvedSchedule,
      blockedDates: (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean),
      bookedSlots,
      heldSlots,
      date: slotDate,
      serviceDurationMinutes: service?.appointmentDuration ?? 20,
      maxDaysAhead: 30,
    });
```

- [ ] **Step 3: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "Apply seasonal schedule in checkout alternative-slot suggestions"
```

---

## Task 14: Add `seasonalSchedule` to revalidation tag map

**Files:**
- Modify: `src/app/api/revalidate/route.ts`

- [ ] **Step 1: Insert mapping in `typeToTags`**

In `src/app/api/revalidate/route.ts`, add one entry to the `typeToTags` object so the cluster around `weeklySchedule` reads:

```ts
  customAvailability: ["customAvailability"],
  weeklySchedule: ["weeklySchedule"],
  seasonalSchedule: ["seasonalSchedule"],
  blockedDate: ["blockedDate"],
```

- [ ] **Step 2: TS compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/revalidate/route.ts
git commit -m "Revalidate seasonalSchedule tag on Sanity webhook"
```

---

## Task 15: Full verification

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all `resolveScheduleForDate` tests pass.

- [ ] **Step 2: Type-check the whole project**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Lint with biome**

```bash
npm run lint:biome
```

Expected: no new violations introduced by this change. If pre-existing issues surface elsewhere, leave them alone — not in scope.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: successful build.

---

## Task 16: Manual smoke test

This is a checklist for the implementer to run by hand against a local dev server (`npm run dev`). The data setup uses Sanity Studio (`/studio`).

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Create a seasonal schedule in Studio**

In `/studio` → Időpontfoglalás → Szezonális beosztások → Create new:
- `Név`: "Nyári beosztás"
- `Kezdő dátum`: a date 7 days from today
- `Befejező dátum`: a date 21 days from today
- Slot duration: 30 min
- One weekday set as `Szabadnap` (different from default) — e.g., make Wednesday a day off
- Other weekdays: shorter hours, e.g. 10:00 – 14:00

Save and verify no validation errors.

- [ ] **Step 3: Verify overlap validation**

Create a second seasonal whose range overlaps the first. Verify the `Befejező dátum` field shows the overlap error and prevents save.

- [ ] **Step 4: Verify public booking page reflects seasonal**

Open `/idopontfoglalas`, advance the wizard to date selection, navigate to a date inside the seasonal range:

- The "Szabadnap" weekday inside the range should NOT be selectable.
- A weekday inside the range should show slots from 10:00 to 14:00 in 30-min increments.
- A date outside the range should show default hours.

- [ ] **Step 5: Verify blockedDate still wins**

In Studio → Blokkolt napok, add a single date inside the seasonal range. Reload `/idopontfoglalas`. That date should now show no slots (blocked takes precedence).

- [ ] **Step 6: Verify customAvailability still overrides one day**

In Studio → Egyedi elérhetőség, create an entry for a different date inside the seasonal range with hours 18:00 – 20:00. Reload `/idopontfoglalas`. That date should show slots in 18:00–20:00 using the seasonal's 30-min duration (custom availability overrides hours; duration comes from seasonal).

- [ ] **Step 7: Book a slot end-to-end**

Book a slot inside the seasonal range from `/idopontfoglalas`. Verify the confirmation page shows the correct date/time.

- [ ] **Step 8: Final commit (clean any test docs created in Studio)**

(Nothing to commit code-wise; just confirm the smoke test passes. The Studio data is content, not source.)

---

## Self-review notes

Verified before publishing this plan:

- Every spec section ("Schema", "Slot resolution", "Queries", "Touch points", "Revalidation", "Edge cases", "Testing") maps to a numbered task.
- Resolver function name (`resolveScheduleForDate`) and type names (`ResolvedSchedule`, `SeasonalScheduleSummary`) used consistently in Task 6 (tests), Task 7 (implementation), Tasks 9–13 (callsites).
- Query names (`seasonalScheduleForDateQuery`, `seasonalSchedulesForRangeQuery`) used consistently from Task 8 onward.
- No placeholders, no "TBD", no "add error handling" — every code block is complete.
- Field-reuse decision (`_weeklyFields.ts`) is implemented before the new schema needs it (Task 2 → Task 3).
- `typegen` runs in tasks where new Sanity types are needed (Tasks 5 and 8).
