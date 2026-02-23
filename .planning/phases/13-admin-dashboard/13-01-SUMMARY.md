---
phase: 13-admin-dashboard
plan: 01
subsystem: api
tags: [sanity, better-auth, groq, email, booking, admin]

# Dependency graph
requires:
  - phase: 12-patient-account
    provides: booking model with status/slotLock/managementToken, Gmail email infrastructure, booking-cancel pattern

provides:
  - GET /api/admin/bookings — date-range booking query with admin session auth
  - POST /api/admin/booking-cancel — admin-initiated cancel by _id, 24h enforcement, slot release, admin email
  - buildAdminCancellationEmail — clinic-cancelled email template with optional reason field

affects: [13-admin-dashboard plans 02, 03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Admin session check pattern via auth.api.getSession() with role !== "admin" guard
    - Admin API uses getWriteClient() (not CDN) for real-time accurate data
    - $bookingId param name (not $token which is reserved in @sanity/client)

key-files:
  created:
    - src/app/api/admin/bookings/route.ts
    - src/app/api/admin/booking-cancel/route.ts
  modified:
    - src/lib/booking-email.ts

key-decisions:
  - "Admin bookings API uses getWriteClient() not CDN client — admin data must be real-time accurate (RESEARCH.md pitfall 2)"
  - "Admin cancel uses _id directly (not managementToken) — admin has direct DB access, no token auth needed"
  - "24h rule enforced for admin cancellation same as patient self-cancel per locked CONTEXT.md decision"
  - "buildAdminCancellationEmail has distinct header A rendelő lemondta vs patient self-cancel Időpont lemondva"
  - "Admin cancellation email uses softer CTA (outlined button) vs patient cancel (filled green button) — clinic cancelled, not patient's choice"

patterns-established:
  - "Admin routes: session check first, then role !== 'admin' check, then business logic"
  - "Fire-and-forget email pattern: void sendEmailAsync({...}) in an isolated async function with try/catch"
  - "SlotLock release wrapped in try/catch — cancellation succeeds even if slotLock document is missing"

requirements-completed: [ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04]

# Metrics
duration: 11min
completed: 2026-02-23
---

# Phase 13 Plan 01: Admin API Layer Summary

**Admin REST API layer: GET bookings by date range + POST admin-cancel by _id with session auth, 24h enforcement, slot release, and clinic-branded cancellation email with optional reason field**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-23T00:03:50Z
- **Completed:** 2026-02-23T00:14:40Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- GET /api/admin/bookings returns all bookings (confirmed + cancelled) for a date range, sorted by slotDate/slotTime, with full patient details including service, reservationNumber, and managementToken
- POST /api/admin/booking-cancel cancels a booking by _id with admin session authentication, enforces 24h rule, patches Sanity booking status, releases slotLock document, sends admin cancellation email fire-and-forget
- buildAdminCancellationEmail function added to booking-email.ts with distinct clinic-cancelled header ("A rendelő lemondta az Ön időpontját"), optional reason block with light-grey background, and softer outlined CTA button

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Admin routes and email template** - `49a060a` (feat)
   - Tasks committed together since buildAdminCancellationEmail is required for TypeScript to compile the cancel route

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `src/app/api/admin/bookings/route.ts` - GET endpoint for admin booking queries by date range, admin session auth required
- `src/app/api/admin/booking-cancel/route.ts` - POST endpoint for admin-initiated cancellation by _id, 24h enforcement, slot release, admin email
- `src/lib/booking-email.ts` - Added buildAdminCancellationEmail function with clinic-cancelled messaging and optional reason field

## Decisions Made

- Admin bookings API uses `getWriteClient()` (not CDN) for real-time accurate data — admin dashboard must not show stale booking states
- Admin cancel uses `_id` directly rather than `managementToken` — admin has direct DB access, no patient-facing token auth needed
- 24h rule enforced for admin cancellation same as patient self-cancel per locked CONTEXT.md decision
- `buildAdminCancellationEmail` has a distinct header "A rendelő lemondta az Ön időpontját" vs patient self-cancel "Időpont lemondva" to clearly communicate who initiated the cancellation
- Admin cancellation email uses softer outlined CTA button vs filled green button in patient cancel email — clinic cancelled, not patient's choice, so less prominent

## Deviations from Plan

None — plan executed exactly as written. Tasks 1 and 2 were committed in a single atomic commit since the email function (Task 2) is a TypeScript dependency of the cancel route (Task 1).

## Issues Encountered

- Biome formatting: Three minor formatting issues auto-fixed with `biome format --write` (destructuring style and Response.json argument formatting)

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- GET /api/admin/bookings ready for Plan 02 (calendar UI) to fetch bookings for calendar dot indicators and day panel
- POST /api/admin/booking-cancel ready for Plan 03 (day panel UI) to trigger admin cancellation with optional reason
- Both routes reject non-admin sessions with 401/403 — ready for production use

---
*Phase: 13-admin-dashboard*
*Completed: 2026-02-23*
