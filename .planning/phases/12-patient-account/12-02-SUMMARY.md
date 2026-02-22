---
phase: 12-patient-account
plan: 02
subsystem: ui
tags: [sanity, nextjs, typescript, resend, zod, groq, booking-management]

# Dependency graph
requires:
  - phase: 12-patient-account
    plan: 01
    provides: managementToken UUID on booking documents, buildCancellationEmail function, /foglalas/:token URL pattern

provides:
  - /foglalas/:token Server Component page with token lookup and 4 state handlers (invalid, cancelled, past, active)
  - BookingManagementCard client component with appointment summary, 24h detection, Cancel/Reschedule buttons
  - CancelDialog client component with inline confirmation panel and POST /api/booking-cancel call
  - POST /api/booking-cancel route with server-side 24h enforcement, slot release, and cancellation email

affects: [12-patient-account (plan 03 — reschedule flow uses scheduleData prop already in place)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "$token is a reserved key in @sanity/client QueryParams — must use $manageToken or another name for managementToken GROQ queries"
    - "Self-contained management page: no site header/nav, centered card layout, min-h-screen bg-[#F0F2F5]"
    - "4-state token page pattern: invalid token -> cancelled -> past -> active (ordered for correct precedence)"
    - "scheduleData prop passed from Server Component to BookingManagementCard (avoids client-side fetch in Plan 03)"

key-files:
  created:
    - src/app/foglalas/[token]/page.tsx
    - src/components/management/BookingManagementCard.tsx
    - src/components/management/CancelDialog.tsx
    - src/app/api/booking-cancel/route.ts
  modified: []

key-decisions:
  - "12-02: $token is reserved in @sanity/client QueryParams (typed as never) — renamed to $manageToken in all GROQ queries for managementToken lookups"
  - "12-02: Reschedule button rendered disabled in Plan 02 — Plan 03 will activate it; scheduleData prop already threaded through"
  - "12-02: slotLock release wrapped in try/catch — cancellation succeeds even if slotLock document is missing"
  - "12-02: CardState machine (idle / cancel-confirm / cancelled) in BookingManagementCard keeps cancel flow in-place without navigation"

patterns-established:
  - "Management page: self-contained card layout, no site nav, Mórocz Medical branding at top"
  - "Cancel flow: inline CancelDialog panel replaces button area — no modal, no navigation"
  - "Server-side 24h enforcement in API route is authoritative; client-side check is for UX only (hides buttons)"
  - "Fire-and-forget email pattern: void sendEmailAsync() wrapped in if (RESEND_API_KEY), with try/catch inside async function"

requirements-completed: [ACCT-01, ACCT-02, NOTIF-03]

# Metrics
duration: 7min
completed: 2026-02-22
---

# Phase 12 Plan 02: Booking Management Page and Cancellation Flow Summary

**Token-based management page at /foglalas/:token with 4 state handlers, inline cancel confirmation dialog, and POST /api/booking-cancel with server-side 24h enforcement, slot release, and Hungarian cancellation email**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-02-22T19:16:35Z
- **Completed:** 2026-02-22T19:23:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `/foglalas/[token]/page.tsx` Server Component with `force-dynamic`, managementToken lookup, and 4 booking state handlers (invalid token, cancelled, past appointment, active booking) — each with appropriate Hungarian UI and self-contained card layout
- Created `BookingManagementCard.tsx` (use client) displaying appointment summary, client-side 24h detection for button visibility, Cancel button opening CancelDialog, Reschedule button (disabled placeholder for Plan 03)
- Created `CancelDialog.tsx` (use client) with inline confirmation panel, `POST /api/booking-cancel` call, loading state, error display, and `onCancelled` callback
- Created `POST /api/booking-cancel` route with Zod validation, server-side 24h enforcement (403 with clinic phone), booking status patch, slotLock release (status: available, bookingRef unset), and Hungarian cancellation email fire-and-forget
- Discovered and resolved: `$token` is a reserved key in `@sanity/client` `QueryParams` (typed as `never`) — renamed to `$manageToken` in all GROQ queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Management page Server Component and BookingManagementCard with CancelDialog** - `e67c482` (feat)
2. **Task 2: Cancel API route with 24h enforcement, slot release, and cancellation email** - `e10d3a2` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `src/app/foglalas/[token]/page.tsx` - Server Component, force-dynamic, 4-state token page, scheduleData fetch for Plan 03
- `src/components/management/BookingManagementCard.tsx` - Client component, appointment summary, 24h check, cancel/reschedule buttons
- `src/components/management/CancelDialog.tsx` - Client component, inline cancel confirmation, API call, error handling
- `src/app/api/booking-cancel/route.ts` - Cancel API, Zod validation, 24h enforcement, booking patch, slot release, email

## Decisions Made

- `$token` is a reserved key in `@sanity/client` `QueryParams` (typed as `token?: never` in the interface) — passing `{ token: string }` to `.fetch()` causes a TypeScript overload mismatch. Renamed to `$manageToken` / `{ manageToken: token }` in both the page and the cancel API route.
- Reschedule button rendered in Plan 02 as `disabled` — Plan 03 will activate it. The `scheduleData` prop is already passed from the Server Component so Plan 03 only needs to add the picker UI.
- `slotLock` release is wrapped in a separate try/catch — if the slotLock document is missing (data inconsistency), the cancellation still succeeds and a warning is logged.
- CardState machine (`idle` | `cancel-confirm` | `cancelled`) keeps the cancel flow inline without navigation — matches the self-contained page design from CONTEXT.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed $token to $manageToken in GROQ queries**
- **Found during:** Task 1 (Management page Server Component)
- **Issue:** `@sanity/client` `QueryParams` interface has `token?: never` — passing `{ token: string }` to `.fetch()` causes TypeScript overload error: "Type 'string' is not assignable to type 'never'"
- **Fix:** Renamed GROQ parameter from `$token` to `$manageToken` and params object from `{ token }` to `{ manageToken: token }` in both page.tsx and booking-cancel/route.ts
- **Files modified:** src/app/foglalas/[token]/page.tsx, src/app/api/booking-cancel/route.ts
- **Verification:** `npx tsc --noEmit` — zero TypeScript errors
- **Committed in:** e67c482 (Task 1 commit), e10d3a2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: reserved QueryParams key)
**Impact on plan:** Fix required for TypeScript compilation. Functionally identical — GROQ parameter name is internal. No scope creep.

## Issues Encountered

- `$token` reserved in `@sanity/client` `QueryParams` — identified during first build attempt (TypeScript error), fixed by renaming to `$manageToken`. Both page and API route affected, both fixed in their respective task commits.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- `/foglalas/:token` management page live with all 4 booking states handled
- `BookingManagementCard` renders Reschedule button as `disabled` placeholder — Plan 03 activates it
- `scheduleData` prop (weeklySchedule + blockedDates) already threaded into `BookingManagementCard` — Plan 03 reschedule picker can use it immediately
- Cancel flow end-to-end: patient cancels → booking patched → slot released → cancellation email sent
- Plan 03 (reschedule) and Plan 04 (reminder cron) can proceed independently

---
*Phase: 12-patient-account*
*Completed: 2026-02-22*
