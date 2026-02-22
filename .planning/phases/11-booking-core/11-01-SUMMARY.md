---
phase: 11-booking-core
plan: 01
subsystem: database
tags: [sanity, groq, typescript, booking, slots]

# Dependency graph
requires:
  - phase: 09-data-foundation-and-gdpr
    provides: weeklyScheduleType, blockedDateType, serviceType schemas and desk structure
  - phase: 10-authentication
    provides: lazy initialization pattern for build-safe clients (db/index.ts, auth.ts)

provides:
  - bookingType Sanity schema (booking documents with patient info, service ref, slot date/time)
  - slotLockType Sanity schema (optimistic locking with slotId, status, heldUntil)
  - getWriteClient() lazily initialized Sanity write client with SANITY_WRITE_TOKEN
  - generateAvailableSlots() pure slot generation algorithm (20-min granularity, sub-slot conflict detection)
  - getAvailableDatesInRange() calendar availability helper
  - GROQ queries: bookingsForDateQuery, slotLocksForDateQuery, slotLockByIdQuery, servicesForBookingQuery

affects:
  - 11-02-api-routes (uses queries and write client for booking creation and slot locking)
  - 11-03-booking-ui (uses generateAvailableSlots, getAvailableDatesInRange for calendar and slot display)
  - 11-04-emails (uses Booking type for confirmation email data)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy Sanity write client initialization with null-guarded module-level singleton
    - Pure slot generation with 20-minute base granularity and sub-slot conflict checking
    - HH:MM local time strings (no timezone) for all slot times to avoid TZ confusion

key-files:
  created:
    - src/sanity/schemaTypes/bookingType.ts
    - src/sanity/schemaTypes/slotLockType.ts
    - src/lib/sanity-write-client.ts
    - src/lib/slots.ts
  modified:
    - src/sanity/schemaTypes/index.ts
    - src/sanity/desk/structure.ts
    - src/sanity/lib/queries.ts
    - sanity.types.ts

key-decisions:
  - "Slot generation uses 20-min base granularity stepping with sub-slot conflict checking for multi-slot services (e.g., 60-min service checks all 20-min windows within)"
  - "HH:MM local time strings used throughout (not ISO datetime) to avoid timezone confusion documented in RESEARCH.md"
  - "Write client lazily initialized (null singleton) to prevent build-time crash when SANITY_WRITE_TOKEN not set"
  - "patientEmail uses string type with regex validation (not Sanity email type) for schema version compatibility"

patterns-established:
  - "Lazy write client: null singleton initialized on first call to getWriteClient()"
  - "Sub-slot conflict: for services longer than 20 min, check every 20-min window within the service duration against bookedSlots+heldSlots"
  - "Desk structure: document type lists (not singletons) for booking and slotLock since there will be many documents"

requirements-completed: [BOOK-05, BOOK-06]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 11 Plan 01: Booking Data Foundation Summary

**Sanity schemas for booking/slotLock documents, lazy write client, pure 20-min slot generation algorithm, and GROQ queries for the booking API layer**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-22T14:15:52Z
- **Completed:** 2026-02-22T14:19:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created bookingType and slotLockType Sanity schemas with Hungarian field titles, registered in Studio under Időpontfoglalás group
- Built pure slot generation algorithm (`generateAvailableSlots`) handling blocked dates, day-off checks, service duration sub-slot conflicts, and 30-day window enforcement
- Added calendar availability helper (`getAvailableDatesInRange`) for highlighting bookable days
- Created lazy-initialized write client (`getWriteClient`) safe for Next.js build-time evaluation
- Added 4 GROQ queries (bookingsForDate, slotLocksForDate, slotLockById, servicesForBooking) ready for API routes

## Task Commits

Each task was committed atomically:

1. **Task 1: bookingType and slotLockType Sanity schemas** - `3eaea20` (feat)
2. **Task 2: write client, slot generation algorithm, and booking queries** - `fd048b3` (feat)

## Files Created/Modified

- `src/sanity/schemaTypes/bookingType.ts` - Booking document schema with service ref, date, time, patient info, status
- `src/sanity/schemaTypes/slotLockType.ts` - Slot lock document with slotId, status, heldUntil, bookingRef
- `src/sanity/schemaTypes/index.ts` - Added bookingType and slotLockType imports and registrations
- `src/sanity/desk/structure.ts` - Added Foglalások and Időpont zárak list items under Időpontfoglalás group
- `src/lib/sanity-write-client.ts` - Lazy singleton write client using SANITY_WRITE_TOKEN
- `src/lib/slots.ts` - Pure slot generation: generateAvailableSlots + getAvailableDatesInRange
- `src/sanity/lib/queries.ts` - Added 4 booking-related GROQ queries
- `sanity.types.ts` - Added Booking, SlotLock types and booking query result types

## Decisions Made

- Slot generation uses 20-min base granularity stepping with sub-slot conflict checking. For a 60-min service starting at 09:00, checks sub-slots at 09:00, 09:20, 09:40, 10:00 — if any are booked/held, that start time is skipped.
- HH:MM local time strings used throughout (not ISO datetime with timezone) to avoid the timezone confusion pitfall documented in RESEARCH.md.
- `patientEmail` uses `string` type with regex validation rather than Sanity's `email` type for broader schema version compatibility.
- Write client follows the same lazy null-singleton pattern as `db/index.ts` and `auth.ts`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Minor Biome formatting auto-fixes applied to new files:
- Long destructuring line in `generateAvailableSlots` expanded to multi-line format
- Long `for` loop headers split to multi-line format
- Ternary expression in `bookingType.ts` preview wrapped in parentheses

All resolved immediately before committing.

## User Setup Required

**External service requires manual configuration:**

- `SANITY_WRITE_TOKEN`: Create an API token in Sanity Dashboard -> Project -> API -> Tokens with "Editor" role. Add to `.env.local`.

Without this token, the write client will throw at runtime when booking creation is attempted. The lazy initialization means the build will still succeed without it.

## Next Phase Readiness

- Data foundation complete for Phase 11 plans 02-04
- bookingsForDateQuery and slotLocksForDateQuery ready for the availability API route (Plan 02)
- generateAvailableSlots ready for slot display logic in UI (Plan 03)
- Schemas will appear in Sanity Studio under Időpontfoglalás once SANITY_WRITE_TOKEN is set and bookings exist

---
*Phase: 11-booking-core*
*Completed: 2026-02-22*
