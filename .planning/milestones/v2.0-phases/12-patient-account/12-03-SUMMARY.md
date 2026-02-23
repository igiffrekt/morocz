---
phase: 12-patient-account
plan: 03
subsystem: ui
tags: [nextjs, typescript, sanity, zod, groq, booking-management, reschedule, atomic-swap]

# Dependency graph
requires:
  - phase: 12-patient-account
    plan: 02
    provides: BookingManagementCard with Reschedule button placeholder, scheduleData prop, CancelDialog pattern

provides:
  - ReschedulePanel client component with inline date/time picker (calendar + time slot grid)
  - POST /api/booking-reschedule with atomic slot swap (ifRevisionId on new slot, then release old)
  - Reschedule success state in BookingManagementCard (shows new date/time before page refresh)
  - Reschedule email via buildRescheduleEmail (old → new time, Hungarian)

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomic slot swap: lock new slot with ifRevisionId BEFORE releasing old — patient never has zero bookings"
    - "Reschedule success state: card shows confirmation with new date/time instead of immediately refreshing (prevents 24h restriction flash)"
    - "onRescheduled callback passes (newDate, newTime) to parent for success state display"

key-files:
  created:
    - src/components/management/ReschedulePanel.tsx
    - src/app/api/booking-reschedule/route.ts
  modified:
    - src/components/management/BookingManagementCard.tsx

key-decisions:
  - "12-03: Atomic swap ordering — lock new slot (ifRevisionId) first, release old slot second. Partial failure (new locked, old not released) is acceptable degraded state"
  - "12-03: ReschedulePanel reuses calendar patterns from Step2DateTime but fetches slots from GET /api/slots (same existing endpoint)"
  - "12-03: Reschedule success state added to CardState ('rescheduled') — shows new date/time in success card, user clicks 'Foglalás megtekintése' to refresh"
  - "12-03: Service name mapping in reschedule email — startsWith('Nőgyógyász') maps to 'Nőgyógyászati vizsgálat'"

patterns-established:
  - "Success-then-refresh pattern: show success state first, let user trigger refresh (avoids 24h restriction flash)"
  - "Atomic swap with optimistic locking: ifRevisionId on new slot prevents double-booking during reschedule"

requirements-completed: [ACCT-03, NOTIF-03]

# Metrics
duration: ~15min
completed: 2026-02-22
---

# Phase 12 Plan 03: Reschedule Flow with Atomic Slot Swap Summary

**Inline date/time picker component, reschedule API with atomic slot swap (new slot locked before old released), reschedule email, and success state UX**

## Performance

- **Duration:** ~15 min (including checkpoint verification and UX fix)
- **Started:** 2026-02-22
- **Completed:** 2026-02-22
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files created/modified:** 3

## Accomplishments

- Created `ReschedulePanel.tsx` (use client) with inline calendar and time slot picker, reusing patterns from Step2DateTime — month navigation, Hungarian weekday headers, available date highlighting via `getAvailableDatesInRange`, time slot fetch from `GET /api/slots`
- Created `POST /api/booking-reschedule` with Zod validation, server-side 24h enforcement, same-slot detection, and atomic slot swap: new slot locked with `ifRevisionId` before old slot released — patient never has zero bookings mid-swap
- Wired ReschedulePanel into BookingManagementCard via "Átütemezés" toggle button, passing scheduleData from Server Component
- Added `"rescheduled"` state to BookingManagementCard — shows success confirmation with new date/time before page refresh, preventing the 24h restriction flash that confused patients
- Reschedule email fire-and-forget via `buildRescheduleEmail` with old → new time display

## Task Commits

1. **Task 1: ReschedulePanel component and wire into BookingManagementCard** - `2cd7a4d` (feat)
2. **Task 2: Reschedule API route with atomic slot swap and reschedule email** - `0c48b7b` (feat)
3. **Task 3: Checkpoint verification + reschedule success state UX fix** - `8879feb` (fix)

## Files Created/Modified

- `src/components/management/ReschedulePanel.tsx` - Client component, inline date/time picker, slot fetching, reschedule submission
- `src/app/api/booking-reschedule/route.ts` - Reschedule API, atomic swap, 24h enforcement, slot conflict handling, email
- `src/components/management/BookingManagementCard.tsx` - Added rescheduled success state, updated onRescheduled callback to receive (newDate, newTime)

## Decisions Made

- Atomic swap critical ordering: lock new slot first (ifRevisionId), release old slot second. If old slot release fails, degraded state logged but reschedule is accepted — admin can resolve.
- `onRescheduled` callback changed from `() => void` to `(newDate: string, newTime: string) => void` to support success state display.
- Reschedule success card shows "Időpont sikeresen áthelyezve" with new date/time, "Foglalás megtekintése" button triggers `router.refresh()` when patient is ready.

## Deviations from Plan

### UX Fix (discovered during checkpoint)

**Reschedule success state missing**
- **Found during:** Checkpoint verification (Task 3)
- **Issue:** After successful reschedule, `router.refresh()` fired immediately. If new appointment was within 24h, page showed 24h restriction message — looked like the reschedule failed.
- **Fix:** Added `"rescheduled"` CardState with success view showing new date/time. Patient clicks "Foglalás megtekintése" to refresh when ready.
- **File:** BookingManagementCard.tsx
- **Committed in:** 8879feb

---

**Total deviations:** 1 UX fix (discovered during user testing)
**Impact on plan:** Improved UX, no scope creep.

## Issues Encountered

- Reschedule success state missing: After reschedule to a date within 24h, page showed 24h restriction instead of success — fixed by adding rescheduled state to CardState machine.

## User Setup Required

None.

## Next Phase Readiness

- Phase 12 fully complete: management page, cancel flow, reschedule flow all working
- Phase 13 (Admin Dashboard) can begin
- Phase 14 (Reminder Emails) can also begin independently (buildReminderEmail already created in Plan 01)

---
*Phase: 12-patient-account*
*Completed: 2026-02-22*
