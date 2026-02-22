---
phase: 09-data-foundation-and-gdpr
plan: 01
subsystem: database
tags: [sanity, groq, typescript, schema, cms]

# Dependency graph
requires: []
provides:
  - weeklySchedule Sanity singleton schema with per-weekday config (start/end time, day-off checkbox, slot duration, buffer)
  - blockedDate Sanity singleton schema with date array and isHoliday flag
  - appointmentDuration field on service documents (10/15/20/30/45/60 min preset dropdown, default 20)
  - Időpontfoglalás sidebar group in Sanity Studio with two schedule singletons
  - weeklyScheduleQuery and blockedDatesQuery GROQ queries
  - WeeklySchedule, WeeklyScheduleDay, BlockedDate, BlockedDateEntry TypeScript types
affects: [10-auth-admin, 11-slot-generation, 12-booking-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sanity singleton pattern: defineType document + schemaType().documentId() in desk structure"
    - "Conditional validation with rule.custom() accessing context.parent for cross-field rules"
    - "Typed GROQ queries with defineQuery() from next-sanity"

key-files:
  created:
    - src/sanity/schemaTypes/weeklyScheduleType.ts
    - src/sanity/schemaTypes/blockedDateType.ts
  modified:
    - src/sanity/schemaTypes/index.ts
    - src/sanity/schemaTypes/serviceType.ts
    - src/sanity/desk/structure.ts
    - src/sanity/lib/queries.ts
    - sanity.types.ts

key-decisions:
  - "weeklySchedule uses array of 7 day objects pre-populated with Mon-Fri as working days and Sat/Sun as isDayOff: true"
  - "startTime/endTime validation uses rule.custom() with context.parent to conditionally require values only when isDayOff is false"
  - "blockedDate isHoliday field is readOnly: true — only set programmatically (Phase 09-03)"
  - "No labels or reasons on blocked dates — blocked is blocked (per CONTEXT.md locked decision)"
  - "appointmentDuration defaults to 20 min, matching the weeklySchedule defaultSlotDuration default"

patterns-established:
  - "Singleton schema registration: import in index.ts + S.document().schemaType().documentId() in structure.ts"
  - "Preset number dropdowns: options.list array with {title, value} objects"

requirements-completed: [SCHED-01, SCHED-02, SCHED-03, SCHED-04]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 09 Plan 01: Sanity Scheduling Schema Summary

**Sanity singleton schemas for weekly schedule (per-weekday start/end times with day-off toggle) and blocked dates, plus appointmentDuration preset dropdown on service documents, GROQ queries, and TypeScript types**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T00:10:27Z
- **Completed:** 2026-02-22T00:13:08Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- weeklySchedule singleton schema with per-weekday configuration: start/end time strings, isDayOff boolean, defaultSlotDuration preset, and bufferMinutes — all fields labeled in Hungarian
- blockedDate singleton schema with date array entries (date field + readOnly isHoliday flag for programmatic holiday population)
- appointmentDuration preset dropdown (10/15/20/30/45/60 min, default 20) added to service documents
- Időpontfoglalás sidebar group added to Sanity Studio between Szolgáltatások and Vélemények, containing both singletons
- weeklyScheduleQuery and blockedDatesQuery added; allServicesQuery updated to include appointmentDuration
- TypeScript types WeeklySchedule, WeeklyScheduleDay, BlockedDate, BlockedDateEntry added; Service and ServiceQueryResult updated

## Task Commits

Each task was committed atomically:

1. **Task 1: Create weeklySchedule and blockedDate Sanity schemas** - `010cbfe` (feat)
2. **Task 2: Add duration field to services, update desk structure, queries, and types** - `fc8f179` (feat)

## Files Created/Modified
- `src/sanity/schemaTypes/weeklyScheduleType.ts` - Weekly schedule singleton with 7-day array, conditional time validation, pre-populated initialValue
- `src/sanity/schemaTypes/blockedDateType.ts` - Blocked dates singleton with date + isHoliday (readOnly) fields
- `src/sanity/schemaTypes/index.ts` - Registered weeklyScheduleType and blockedDateType
- `src/sanity/schemaTypes/serviceType.ts` - Added appointmentDuration preset dropdown field
- `src/sanity/desk/structure.ts` - Added Időpontfoglalás group with weeklySchedule and blockedDate singletons
- `src/sanity/lib/queries.ts` - Added weeklyScheduleQuery and blockedDatesQuery; updated allServicesQuery
- `sanity.types.ts` - Added WeeklySchedule, WeeklyScheduleDay, BlockedDate, BlockedDateEntry types; updated Service and ServiceQueryResult

## Decisions Made
- startTime/endTime use conditional validation via `rule.custom()` reading `context.parent.isDayOff` — required only when the day is not a day off
- weeklySchedule days array is pre-populated via initialValue (Mon-Fri working, Sat/Sun off) with empty time strings to guide the doctor
- blockedDate.isHoliday is readOnly at schema level — Phase 09-03 will populate holidays programmatically
- No labels or reasons on blocked dates per CONTEXT.md decision ("blocked is blocked")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 SCHED requirements have schema-level data contracts in place
- Doctor can open Studio and configure weekly schedule and blocked dates immediately
- Phase 09-02 (GDPR/privacy policy) can proceed independently
- Phase 09-03 (custom date picker component) depends on this plan's blockedDate schema
- Phase 11 (slot generation) can read weeklyScheduleQuery and blockedDatesQuery when ready

---
*Phase: 09-data-foundation-and-gdpr*
*Completed: 2026-02-22*
