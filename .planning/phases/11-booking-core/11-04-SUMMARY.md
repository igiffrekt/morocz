---
phase: 11-booking-core
plan: 04
subsystem: ui
tags: [react, nextjs, motion, animation, booking, hungarian, zod, sessionStorage, oauth]

# Dependency graph
requires:
  - phase: 11-booking-core
    plan: 02
    provides: POST /api/booking with 409 conflict + alternatives, 201 bookingId response
  - phase: 11-booking-core
    plan: 03
    provides: BookingWizard shell, Step1Service, Step2DateTime, StepIndicator
  - phase: 10-authentication
    provides: AuthStep component (used as Step3Auth inner component)

provides:
  - Step3Auth wrapping AuthStep with onSuccess/onBack callbacks
  - Step4Confirm with Zod validation, session pre-fill, POST /api/booking, 409 conflict handler
  - BookingSuccess with summary card, email confirmation note, next steps, Hungarian text
  - BookingWizard fully wired: all 4 steps + success state (step 5)
  - sessionStorage persistence of wizard state (30-min TTL) for Google OAuth redirect survival
  - 5-minute hold timer banner with expiry warning and back-to-slots action
  - Conflict panel showing alternative time buttons on 409 response
  - resetWizard() for "Új időpont foglalása" flow

affects:
  - 11-05-admin (admin booking list UI will see confirmed bookings created here)
  - 12-patient-portal (patient can see their bookings created via this wizard)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Step4Confirm receives patientName/Email via onSuccess callback so BookingSuccess doesn't need useSession
    - Conflict panel inline (not modal) — alternative slots render as buttons in wizard container
    - sessionStorage save runs on every [currentStep, selections] change; restore only on mount
    - Hold timer useEffect returns cleanup function to clearTimeout on step change

key-files:
  created:
    - src/components/booking/Step3Auth.tsx
    - src/components/booking/Step4Confirm.tsx
    - src/components/booking/BookingSuccess.tsx
  modified:
    - src/components/booking/BookingWizard.tsx

key-decisions:
  - "Step4Confirm passes patientName and patientEmail to onSuccess so BookingWizard can forward them to BookingSuccess without a second useSession call"
  - "Conflict panel is inline (not a modal) — renders in the wizard container above the animated step area so it persists while patient reviews alternatives"
  - "resetWizard() clears both React state and sessionStorage and cancels the hold timer atomically"
  - "Hold timer is per-step-entry: useEffect re-runs whenever currentStep or selectedTime changes, clearing the previous timer first via cleanup return"

patterns-established:
  - "Booking step components pass name/email up via onSuccess(bookingId, patientName, patientEmail) — parent wizard owns all state"
  - "sessionStorage key morocz-booking-wizard stores {currentStep, selections, timestamp} — timestamp gate prevents stale state restoration"
  - "Biome formatter applied after each Write to fix line-length and JSX formatting issues"

requirements-completed: [BOOK-04, BOOK-07, UX-01, UX-02, UX-03]

# Metrics
duration: 5min
completed: 2026-02-22
---

# Phase 11 Plan 04: Booking Core Summary

**Complete 4-step booking wizard with Zod form validation, POST /api/booking submission, sessionStorage OAuth persistence, 5-minute hold timer, and inline 409 conflict alternative slots**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-22T14:38:02Z
- **Completed:** 2026-02-22T14:42:25Z
- **Tasks:** 2 auto + 1 checkpoint (human-verify)
- **Files modified:** 4

## Accomplishments

- Built Step3Auth wrapping the existing Phase 10 AuthStep component with onSuccess/onBack callbacks — auto-advances for logged-in users via AuthStep's built-in session check
- Built Step4Confirm: Zod validation matching server BookingSchema, session pre-fill for name/email, POST /api/booking with 201/409/401 handling, Hungarian field errors, loading spinner
- Built BookingSuccess: green checkmark, booking summary card, email confirmation note, next steps bullet list, "Vissza a főoldalra" and "Új időpont foglalása" buttons
- Wired BookingWizard with all 4 steps and step 5 (success): imports Step3Auth/Step4Confirm/BookingSuccess, routes handleBookingSuccess and handleConflict callbacks
- SessionStorage persistence: saves on every [currentStep, selections] change, restores on mount with 30-minute TTL gate, cleared on successful booking
- 5-minute hold timer banner: starts when entering step 3 or 4, shows amber warning with "Vissza az időpontokhoz" button that returns to step 2
- Inline conflict panel: on 409, shows red banner with alternative time buttons; clicking an alternative updates selectedTime and closes panel

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Step3Auth, Step4Confirm, and BookingSuccess components** - `25ad93d` (feat)
2. **Task 2: Wire wizard integration — sessionStorage, conflict handling, step routing** - `90322b7` (feat)

## Files Created/Modified

- `src/components/booking/Step3Auth.tsx` - Auth gate wrapper around AuthStep; adds heading, subtitle, Vissza button
- `src/components/booking/Step4Confirm.tsx` - Confirmation form: Zod validation, session pre-fill, POST /api/booking, 409/401 error handling
- `src/components/booking/BookingSuccess.tsx` - Post-booking success: green checkmark, summary card, email note, next steps, action buttons
- `src/components/booking/BookingWizard.tsx` - Full wizard integration: all 4 steps wired, step 5 success state, sessionStorage, hold timer, conflict panel, resetWizard

## Decisions Made

- **Step4Confirm onSuccess signature:** `onSuccess(bookingId, patientName, patientEmail)` — passes patient details up so BookingSuccess can display them without a redundant `useSession()` call in a component rendered after auth.
- **Conflict panel inline vs modal:** Chose inline panel above the animated step div so it persists during the step animation and the patient can see alternatives without dismissing a modal first.
- **Hold timer cleanup:** The `useEffect` for the timer returns a cleanup function that calls `clearTimeout`. This means the timer resets whenever `currentStep` or `selectedTime` changes — correct behavior if patient navigates back and selects a different slot.
- **SessionStorage gate:** 30-minute TTL prevents stale state from a previous session being restored unexpectedly. On restore, only `currentStep >= 3` is restored (not step 1/2 which don't need OAuth redirect recovery).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome format fixes in BookingSuccess.tsx and Step4Confirm.tsx**
- **Found during:** Task 1 verification (biome check)
- **Issue:** JSX whitespace `{"·"}` in BookingSuccess (Biome collapses to direct text node), single-line `<span>` attrs too long, multi-line conditional `{err && (<p>)}` needs flattening
- **Fix:** Ran `npx biome format --write` on all three files — Biome reformatted to its preferred style
- **Files modified:** src/components/booking/BookingSuccess.tsx, src/components/booking/Step4Confirm.tsx
- **Verification:** `npx biome check` passes with 0 errors on all 3 files
- **Committed in:** `25ad93d` (Task 1 commit)

**2. [Rule 1 - Bug] Biome format fixes in BookingWizard.tsx**
- **Found during:** Task 2 verification (biome check)
- **Issue:** Long `setConflictMessage(...)` string exceeded line length, `<Step3Auth>` JSX preferred inline by Biome
- **Fix:** Ran `npx biome format --write` on BookingWizard.tsx
- **Files modified:** src/components/booking/BookingWizard.tsx
- **Verification:** `npx biome check` passes with 0 errors
- **Committed in:** `90322b7` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (formatting issues)
**Impact on plan:** Both fixes were formatting-only — no logic changes. Required for biome check to pass.

## Issues Encountered

None — plan executed without blocking issues. TypeScript passed zero-error on first check both times.

## User Setup Required

None — all components are UI-only and call the existing `/api/booking` route. Runtime requires the environment variables documented in 10-01-SUMMARY.md (Neon, Google OAuth, Resend) and 11-01-SUMMARY.md (SANITY_WRITE_TOKEN).

## Next Phase Readiness

- Full booking wizard operational end-to-end: service → date/time → auth → confirm → success
- /idopontfoglalas page size grew from 8.92 kB to 24 kB (all new components bundled)
- Human verification checkpoint (Task 3) pending — wizard must be tested in browser before Phase 12
- Sanity booking documents will be created when the patient completes the flow at runtime

## Self-Check: PASSED

- FOUND: src/components/booking/Step3Auth.tsx
- FOUND: src/components/booking/Step4Confirm.tsx
- FOUND: src/components/booking/BookingSuccess.tsx
- FOUND: src/components/booking/BookingWizard.tsx (modified)
- FOUND: .planning/phases/11-booking-core/11-04-SUMMARY.md
- Commit 25ad93d verified (Task 1: Step3Auth, Step4Confirm, BookingSuccess)
- Commit 90322b7 verified (Task 2: BookingWizard integration)
- Build passes: /idopontfoglalas 24 kB (grew from 8.92 kB — new components bundled)

---
*Phase: 11-booking-core*
*Completed: 2026-02-22*
