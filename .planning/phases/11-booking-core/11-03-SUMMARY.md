---
phase: 11-booking-core
plan: 03
subsystem: ui
tags: [react, nextjs, motion, animation, calendar, booking, hungarian, tailwind]

# Dependency graph
requires:
  - phase: 11-booking-core
    plan: 01
    provides: generateAvailableSlots, getAvailableDatesInRange, servicesForBookingQuery, GROQ queries, Sanity schemas
  - phase: 10-authentication
    provides: AuthStep component (used as wizard step 3)

provides:
  - Booking page Server Component at /idopontfoglalas that fetches services, schedule, blocked dates
  - BookingWizard client component with AnimatePresence direction-aware slide transitions (4 steps)
  - StepIndicator with Hungarian step labels, desktop horizontal + mobile progress bar
  - Step1Service grid service card selector with selection state persistence
  - Step2DateTime custom monthly calendar + time slot grid with /api/slots fetch

affects:
  - 11-04-emails (wizard confirms booking via Step 4 which will call POST /api/booking)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AnimatePresence mode=wait with direction-aware custom prop (string step keys to avoid key=0 pitfall)
    - Server Component fetches all schedule data; passes normalized props to client wizard
    - Client-side getAvailableDatesInRange for calendar highlighting (no extra API call)
    - On-demand /api/slots fetch triggered by date click in Step2DateTime

key-files:
  created:
    - src/app/idopontfoglalas/page.tsx
    - src/components/booking/BookingWizard.tsx
    - src/components/booking/StepIndicator.tsx
    - src/components/booking/Step1Service.tsx
    - src/components/booking/Step2DateTime.tsx

key-decisions:
  - "String step keys used in AnimatePresence (service/datetime/auth/confirm) to avoid key=0 bug documented in RESEARCH.md pitfall 6"
  - "Schedule data (weekly schedule + blocked dates) fetched in Server Component page.tsx and passed to BookingWizard as scheduleData prop — avoids extra client-side API call"
  - "Sanity WeeklyScheduleDay types (startTime/endTime: string | undefined) normalized inline in page.tsx before passing to BookingWizard to satisfy ScheduleForAvailability interface"
  - "Step2DateTime uses manual string keys for loading skeleton items instead of array index to satisfy Biome lint rules"
  - "Step 4 (Megerosites) is a placeholder div in this plan — full confirmation form implemented in Plan 04"

patterns-established:
  - "Booking wizard step components receive selections and onNext/onBack callbacks; state lives exclusively in BookingWizard"
  - "Calendar uses UTC date math (Date.UTC) to avoid timezone shift in getDayOfWeek calculation"
  - "All Hungarian UI text uses proper accented characters throughout (Vissza, Tovabb, Valasszon, stb.)"

requirements-completed: [BOOK-01, BOOK-02, BOOK-03, BOOK-07, UX-01, UX-02, UX-03]

# Metrics
duration: 8min
completed: 2026-02-22
---

# Phase 11 Plan 03: Booking UI Summary

**Four-step booking wizard with Motion v12 AnimatePresence transitions, custom Hungarian calendar grid, and /api/slots-powered time slot picker**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-22T14:23:34Z
- **Completed:** 2026-02-22T14:31:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built the /idopontfoglalas Server Component page that fetches services, weekly schedule, and blocked dates in parallel and passes normalized data to the client wizard
- Implemented BookingWizard with direction-aware AnimatePresence slide transitions using string step keys (matching LabTestsSection.tsx pattern from RESEARCH.md), preserving selections when navigating back
- Created StepIndicator with 4 Hungarian-labeled steps, desktop horizontal circles with connecting lines, mobile progress bar
- Built Step1Service service card selector grid (1/2 col) with selection indicators and disabled Tovabb button until selection made
- Built Step2DateTime with a fully custom monthly calendar grid (Hungarian weekday abbreviations, Monday-first), month navigation bounded to today..today+30, available date highlighting via getAvailableDatesInRange(), and /api/slots fetch on date click with loading skeleton, error state, and time slot button grid

## Task Commits

Each task was committed atomically:

1. **Task 1: Create booking page, BookingWizard, StepIndicator, and Step1Service** - `04d44ac` (feat)
2. **Task 2: Build Step2DateTime with calendar and time slot picker** - `934b9a8` (feat)

## Files Created/Modified

- `src/app/idopontfoglalas/page.tsx` - Server Component; fetches services, weeklySchedule, blockedDates; normalizes schedule types; renders BookingWizard
- `src/components/booking/BookingWizard.tsx` - "use client" wizard with AnimatePresence, goToStep, selections state, string step keys
- `src/components/booking/StepIndicator.tsx` - Visual progress: 4-step desktop circles + mobile progress bar, Hungarian labels
- `src/components/booking/Step1Service.tsx` - Service card grid with selection state, Tovabb button enabled only when service chosen
- `src/components/booking/Step2DateTime.tsx` - Custom calendar + time slot picker; uses getAvailableDatesInRange for calendar highlighting, fetches /api/slots on date click

## Decisions Made

- String step keys used in AnimatePresence (`"service"`, `"datetime"`, `"auth"`, `"confirm"`) to avoid the key=0 animation bug documented in RESEARCH.md pitfall 6.
- Schedule data fetched entirely in the Server Component (`page.tsx`) and passed down as `scheduleData` prop to the wizard. This avoids an extra API call for calendar highlighting — `getAvailableDatesInRange()` runs client-side using the pre-fetched schedule data.
- Sanity `WeeklyScheduleDay` has `startTime?: string | undefined` but `ScheduleForAvailability` requires `string`. Normalized in `page.tsx` with `?? ""` fallback — linter auto-fixed this during initial write.
- Step 4 is a placeholder showing selected service/date/time. The full confirmation form (name, email, phone, POST /api/booking) is Plan 04's scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Biome lint fixes for skeleton loader**
- **Found during:** Task 2 (Step2DateTime)
- **Issue:** Used `aria-busy` + `aria-label` on a plain `div` (useAriaPropsSupportedByRole error), index-based skeleton keys (noArrayIndexKey error), unused biome-ignore comment
- **Fix:** Removed `aria-label`, changed skeleton keys to stable string literals `["s0".."s7"]`
- **Files modified:** src/components/booking/Step2DateTime.tsx
- **Verification:** `npx biome check src/components/booking/` passes with 0 errors
- **Committed in:** `934b9a8` (Task 2 commit)

**2. [Rule 1 - Bug] Removed unused `_isUpcoming` variable from StepIndicator**
- **Found during:** Task 1 verification (build lint warning)
- **Issue:** Biome auto-prefixed `isUpcoming` to `_isUpcoming`, Next.js ESLint still warned on unused assignment
- **Fix:** Removed the variable entirely (not used in rendering)
- **Files modified:** src/components/booking/StepIndicator.tsx
- **Verification:** `npm run build` passes with 0 warnings
- **Committed in:** `04d44ac` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes required for build and lint compliance. No scope creep.

## Issues Encountered

- First `npm run build` attempt after clean `.next` deletion produced a transient `ENOENT: pages-manifest.json` error on Windows. A second build run succeeded immediately — this is a known Next.js Windows file-system race condition during cache initialization, not a code issue.

## User Setup Required

None — no external service configuration required for this plan. The /api/slots endpoint (built in 11-02) must exist at runtime for time slot fetching to work in Step2DateTime; at build time the component renders correctly.

## Next Phase Readiness

- All 5 booking UI files complete and passing build/TypeScript/Biome
- Wizard steps 1 and 2 fully functional: service selection and calendar+slot picking
- Step 3 uses the existing AuthStep component (auto-advances if session exists)
- Step 4 placeholder ready to be replaced by Plan 04's confirmation form + POST /api/booking call
- /idopontfoglalas route statically prerendered (8.92 kB)

## Self-Check: PASSED

- FOUND: src/app/idopontfoglalas/page.tsx
- FOUND: src/components/booking/BookingWizard.tsx
- FOUND: src/components/booking/StepIndicator.tsx
- FOUND: src/components/booking/Step1Service.tsx
- FOUND: src/components/booking/Step2DateTime.tsx
- FOUND: .planning/phases/11-booking-core/11-03-SUMMARY.md
- Commit 04d44ac verified (Task 1: booking page, wizard, step indicator, step 1)
- Commit 934b9a8 verified (Task 2: Step2DateTime calendar and slots)

---
*Phase: 11-booking-core*
*Completed: 2026-02-22*
