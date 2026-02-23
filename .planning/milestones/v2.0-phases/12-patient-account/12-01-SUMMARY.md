---
phase: 12-patient-account
plan: 01
subsystem: api
tags: [sanity, email, resend, uuid, booking, typescript]

# Dependency graph
requires:
  - phase: 11-booking-core
    provides: booking Sanity schema, booking API route, buildConfirmationEmail function

provides:
  - managementToken (UUID) stored on every new booking Sanity document
  - reminderSent boolean on booking schema for Phase 14 cron idempotency
  - /foglalas/:token manage URL pattern in confirmation email
  - buildCancellationEmail function (Hungarian, full design system)
  - buildRescheduleEmail function (old → new time, Hungarian)
  - buildReminderEmail function (24h reminder, no action links, Hungarian)

affects: [12-patient-account (plans 02+), 14-reminders]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "crypto.randomUUID() for token generation (global Web Crypto API, no import needed)"
    - "Single manage URL pattern: /foglalas/:token replaces separate cancel/reschedule URLs"
    - "Email builders as pure functions accepting formatted date strings (pre-formatted by caller)"

key-files:
  created: []
  modified:
    - src/sanity/schemaTypes/bookingType.ts
    - sanity.types.ts
    - src/app/api/booking/route.ts
    - src/lib/booking-email.ts

key-decisions:
  - "12-01: managementToken placed after reservationNumber field in schema (logical grouping of identifiers)"
  - "12-01: reminderSent placed after createdAt field in schema (temporal/audit fields grouped together)"
  - "12-01: Single 'Időpont kezelése' button in confirmation email (replaces two separate cancel/reschedule buttons) — management page handles both actions"
  - "12-01: buildReminderEmail has no action buttons — 24h cutoff aligns with reminder send time per CONTEXT.md"
  - "12-01: buildCancellationEmail uses line-through styling on cancelled service/time for visual clarity"
  - "12-01: buildRescheduleEmail shows old time (struck through, grey) and new time (green border, full card) side by side"

patterns-established:
  - "Email builders: all accept pre-formatted Hungarian date strings from caller"
  - "Email builders: all use shared colour constants (navy/pink/green/lightGrey/textDark/textMuted)"
  - "Token URL pattern: /foglalas/:token — used throughout Phase 12 plans"

requirements-completed: [ACCT-01, NOTIF-03]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 12 Plan 01: Booking Schema Token Fields and Email Infrastructure Summary

**managementToken (UUID) and reminderSent fields added to booking schema; confirmation email updated to /foglalas/:token; three new Hungarian email builders (cancellation, reschedule, reminder) created**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-22T19:09:29Z
- **Completed:** 2026-02-22T19:13:36Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `managementToken` (readOnly string) and `reminderSent` (boolean, default false) fields to booking Sanity schema
- Updated `sanity.types.ts` Booking type with both new fields
- Booking route now generates `crypto.randomUUID()` token on every new booking creation and sends `/foglalas/:token` manage URL in confirmation email
- Replaced two-button (cancel + reschedule) pattern with single "Időpont kezelése" button in confirmation email
- Created `buildCancellationEmail` — Hungarian cancellation confirmation with line-through styling and "Új időpont foglalása" CTA
- Created `buildRescheduleEmail` — Hungarian reschedule email showing old (struck-through) and new (highlighted) appointment times
- Created `buildReminderEmail` — Hungarian 24h reminder email with no action links (24h cutoff aligns with reminder timing)
- Removed all `/fiokom?cancel=` and `/fiokom?reschedule=` references from codebase

## Task Commits

Each task was committed atomically:

1. **Task 1: Add managementToken and reminderSent fields to booking schema** - `9517861` (feat)
2. **Task 2: Update booking route and add 3 new email builders** - `8da4c48` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `src/sanity/schemaTypes/bookingType.ts` - Added managementToken and reminderSent fields
- `sanity.types.ts` - Added managementToken?: string and reminderSent?: boolean to Booking type
- `src/app/api/booking/route.ts` - Token generation on booking create, manageUrl in confirmation email
- `src/lib/booking-email.ts` - Updated buildConfirmationEmail (manageUrl), added buildCancellationEmail, buildRescheduleEmail, buildReminderEmail

## Decisions Made

- Single "Időpont kezelése" button in confirmation email replaces two separate cancel/reschedule buttons — the management page at /foglalas/:token handles both actions, so one URL is sufficient and cleaner
- `buildReminderEmail` has no action buttons by design — the 24-hour cancellation/reschedule cutoff aligns with when the reminder is sent, making action links misleading
- Used `crypto.randomUUID()` (Web Crypto API, globally available in Next.js 15 / Node 18+) — no import needed, produces standard UUID format suitable for URL tokens
- All email builders extracted shared colour constants to module-level variables (not per-function) to DRY up the file

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- All downstream Phase 12 plans can now use `managementToken` from booking documents
- `/foglalas/:token` URL pattern established — Plan 02 builds the management page at this route
- Three email builders ready for use by Plans 03 (cancellation), 04 (reschedule), and Phase 14 (reminder)
- `reminderSent` field in place for Phase 14 cron idempotency

---
*Phase: 12-patient-account*
*Completed: 2026-02-22*
