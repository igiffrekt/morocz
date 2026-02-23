---
phase: 11-booking-core
plan: 02
subsystem: api
tags: [sanity, groq, zod, resend, typescript, booking, email, optimistic-locking]

# Dependency graph
requires:
  - phase: 11-booking-core/11-01
    provides: bookingType/slotLockType schemas, getWriteClient, generateAvailableSlots, GROQ queries
  - phase: 10-authentication
    provides: auth.api.getSession for request auth check

provides:
  - GET /api/slots — returns available HH:MM time strings for a date+serviceId
  - POST /api/booking — creates booking doc with ifRevisionId optimistic locking and fire-and-forget email
  - buildConfirmationEmail() — inline-styled Hungarian HTML email builder

affects:
  - 11-03-booking-ui (Step2DateTime calls GET /api/slots; confirm step will call POST /api/booking)
  - 11-04-emails (email template pattern established here)
  - 12-patient-dashboard (cancel/reschedule links in email point to /fiokom?cancel= and /fiokom?reschedule=)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ifRevisionId chain method on Sanity patch (not commit option) for optimistic locking
    - Conflict response returns up to 5 nearest alternative time slots sorted by time distance
    - Fire-and-forget email via void async function that catches and logs, never throws
    - force-dynamic on API routes to prevent Next.js caching of time-sensitive data

key-files:
  created:
    - src/app/api/slots/route.ts
    - src/app/api/booking/route.ts
    - src/lib/booking-email.ts
  modified: []

key-decisions:
  - "ifRevisionId is a patch chain method (.ifRevisionId(rev).set().commit()), not a commit option — commit({ ifRevisionID }) does not exist in Sanity client types"
  - "Alternative slots sorted by absolute time distance from requested slot, not just ascending order — nearest options first"
  - "Email fire-and-forget uses a separate async function with try/catch that never re-throws — booking response never blocked by email failure"
  - "Clinic phone and address hardcoded in booking route for now — Phase 12 can read from siteSettings Sanity document"

patterns-established:
  - "Optimistic lock sequence: fetch existing lock OR create with createIfNotExists -> re-fetch for _rev -> ifRevisionId patch -> catch 409"
  - "Conflict response shape: { error: string, alternatives: string[] } with HTTP 409"
  - "API route validation: parse body with Zod safeParse, return first issue message on failure"

requirements-completed: [BOOK-02, BOOK-03, BOOK-05, BOOK-06, NOTIF-01]

# Metrics
duration: 15min
completed: 2026-02-22
---

# Phase 11 Plan 02: API Routes Summary

**GET /api/slots with parallel Sanity fetches + POST /api/booking with ifRevisionId optimistic locking, Zod validation, and Hungarian fire-and-forget confirmation email**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-22T14:23:28Z
- **Completed:** 2026-02-22T14:40:00Z
- **Tasks:** 2
- **Files modified:** 3 created, 0 modified

## Accomplishments

- GET /api/slots fetches weeklySchedule, blockedDates, bookings, slotLocks, and service data in parallel — calls generateAvailableSlots() and returns `{ slots, date, serviceName, durationMinutes }`
- POST /api/booking enforces auth, validates with Zod, uses ifRevisionId chain for optimistic locking, creates booking document, updates slotLock with bookingRef, sends confirmation email fire-and-forget
- Double-booking conflict (from pre-check, status check, or ifRevisionId race) returns HTTP 409 with up to 5 nearest alternative slot times
- buildConfirmationEmail() produces branded inline-CSS table-based HTML with navy/pink/green design system, proper Hungarian accented text, next steps section, cancel/reschedule buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: GET /api/slots endpoint and confirmation email builder** - `aa9c8df` (feat)
2. **Task 2: POST /api/booking with ifRevisionId locking** - `93caf9f` (feat)

## Files Created/Modified

- `src/app/api/slots/route.ts` - Public GET endpoint; parallel Sanity fetches, generates available slots via generateAvailableSlots()
- `src/app/api/booking/route.ts` - Authenticated POST endpoint; Zod validation, slotLock creation, ifRevisionId optimistic locking, booking doc creation, fire-and-forget email
- `src/lib/booking-email.ts` - buildConfirmationEmail() producing inline-styled HTML with Hungarian text, cancel/reschedule links, clinic contact info

## Decisions Made

- **ifRevisionId is a chain method, not a commit option:** The Sanity client types only expose `ifRevisionId(rev)` as a method on the PatchBuilder chain (`.patch(id).ifRevisionId(rev).set({}).commit()`), not as a `commit({ ifRevisionID })` option. TypeScript error guided us to the correct API.
- **Alternative slot sorting by time distance:** On conflict, alternatives are sorted by `Math.abs(timeInMinutes - requestedTimeInMinutes)` so the user sees the nearest available slots first, not just the next ones chronologically.
- **Fire-and-forget email never blocks:** Email sending is wrapped in a separate `async function sendConfirmationEmail()` that catches all errors and logs them. The response returns before the email completes.
- **Clinic contact info hardcoded temporarily:** Phone and address are hardcoded strings in the booking route. Phase 12 can fetch from the `siteSettings` Sanity document. RESEARCH.md does not specify a mechanism for this.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created Step2DateTime placeholder to unblock build**
- **Found during:** Task 1 (build verification)
- **Issue:** `BookingWizard.tsx` (committed in 11-03) imports `Step2DateTime` which did not exist, causing a webpack module-not-found build error
- **Fix:** Created placeholder `Step2DateTime.tsx` matching BookingWizard's expected props. A linter then auto-replaced it with a full calendar implementation
- **Files modified:** `src/components/booking/Step2DateTime.tsx`
- **Verification:** Build passes with /idopontfoglalas rendering
- **Committed in:** aa9c8df (Task 1 commit — Step2DateTime.tsx was not staged; it was already auto-committed by the linter tooling as part of the 11-03 context)

**2. [Rule 1 - Bug] Fixed TypeScript type error in idopontfoglalas page**
- **Found during:** Task 1 (build verification)
- **Issue:** `scheduleData.schedule.days` used Sanity's `WeeklyScheduleDay[]` type (startTime: string | undefined) but `ScheduleForAvailability` requires `startTime: string`
- **Fix:** Normalized the schedule data in the page component with explicit `startTime: d.startTime ?? ""` mapping
- **Files modified:** `src/app/idopontfoglalas/page.tsx`
- **Verification:** TypeScript check passes, build passes
- **Committed in:** Part of pre-existing 11-03 commit chain (files were tracked)

**3. [Rule 1 - Bug] Fixed Sanity client ifRevisionID API**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** Plan specified `.commit({ ifRevisionID: rev })` but the Sanity client types don't have `ifRevisionID` in `BaseMutationOptions`; the correct API is the chain method `.ifRevisionId(rev)`
- **Fix:** Changed to `.patch(id).ifRevisionId(rev).set({}).commit()`
- **Files modified:** `src/app/api/booking/route.ts`
- **Verification:** TypeScript passes with zero errors, build passes
- **Committed in:** 93caf9f (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking build issues, 1 Sanity API bug)
**Impact on plan:** All fixes necessary for correctness. The ifRevisionId fix is the critical one — it ensures the optimistic lock actually works. No scope creep.

## Issues Encountered

- Stale `.next/types` cache from a renamed page caused `File not found` TypeScript error during build. Resolved by clearing `.next` directory.
- Biome formatting required several iterations across the scaffolded booking UI files (Step2DateTime, BookingWizard, Step1Service, StepIndicator) that were already committed from 11-03 work but had unresolved lint issues.

## User Setup Required

None beyond what was documented in 11-01-SUMMARY.md (SANITY_WRITE_TOKEN required at runtime). The email will fail silently if RESEND_API_KEY is not set.

## Next Phase Readiness

- GET /api/slots ready for Step2DateTime calendar to call on date selection
- POST /api/booking ready for the booking confirmation step (Step 4 of wizard)
- Email template ready for Phase 11 plan 04 (email reminders)
- Cancel/reschedule URL parameters defined (`/fiokom?cancel=`, `/fiokom?reschedule=`) — Phase 12 implements these routes

## Self-Check: PASSED

- FOUND: src/app/api/slots/route.ts
- FOUND: src/app/api/booking/route.ts
- FOUND: src/lib/booking-email.ts
- FOUND: .planning/phases/11-booking-core/11-02-SUMMARY.md
- Commit aa9c8df verified (Task 1: slots route and email builder)
- Commit 93caf9f verified (Task 2: booking creation route)

---
*Phase: 11-booking-core*
*Completed: 2026-02-22*
