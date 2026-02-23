---
phase: 13-admin-dashboard
plan: 02
subsystem: ui
tags: [react, next.js, sanity, admin, calendar, dashboard]

# Dependency graph
requires:
  - phase: 13-admin-dashboard plan 01
    provides: GET /api/admin/bookings date-range API, AdminBooking type structure, getWriteClient pattern

provides:
  - src/app/admin/page.tsx — Server Component fetching today + month bookings, rendering AdminDashboard
  - src/components/admin/AdminDashboard.tsx — client shell with selectedDate/viewMode/bookings state
  - src/components/admin/AdminCalendar.tsx — month grid with booking dots + month/week toggle
  - src/components/admin/AdminWeekView.tsx — vertical timeline 07:00-18:00 with positioned appointment blocks
  - src/components/admin/AdminDayPanel.tsx — day appointment list with status badges

affects: [13-admin-dashboard plan 03 — patient detail modal and cancel flow wire into AdminDashboard.handleBookingClick]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AdminDashboard as client shell pattern — server fetches initial data, client manages state + refetches
    - Booking dot map computed client-side from monthBookings array (Map<string, number>)
    - AdminBooking type exported from AdminDashboard.tsx and imported by all child components
    - Week range calculation: Monday-first using getDay() === 0 ? -6 : 1 - dow offset pattern

key-files:
  created:
    - src/components/admin/AdminDashboard.tsx
    - src/components/admin/AdminCalendar.tsx
    - src/components/admin/AdminWeekView.tsx
    - src/components/admin/AdminDayPanel.tsx
  modified:
    - src/app/admin/page.tsx

key-decisions:
  - "AdminWeekView imported by AdminCalendar (not AdminDashboard) since AdminCalendar renders it directly in week mode"
  - "handleBookingClick is a no-op stub in AdminDashboard — Plan 03 wires the modal via this callback"
  - "Server Component fetches today + current month bookings in parallel via Promise.all for zero-latency initial render"
  - "try/catch around initial Sanity fetch — renders empty dashboard gracefully if SANITY_WRITE_TOKEN missing in dev"
  - "isDayLoading state skips the initial render (initialDayBookings already present) — useEffect only fires on date changes"
  - "Week view bookings fetched separately from month bookings (different date range scope)"

patterns-established:
  - "AdminBooking type in AdminDashboard.tsx is single source of truth — all admin components import from there"
  - "Dark admin palette constants: #0f172a bg, #1e293b card, #334155 border, #99CEB7 accent, #94a3b8 muted, #64748b secondary"
  - "All day picker logic (month grid, Monday-first) uses same helper functions as Step2DateTime for consistency"

requirements-completed: [ADMIN-01, ADMIN-02, ADMIN-03]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 13 Plan 02: Admin Dashboard UI Summary

**Two-panel admin dashboard with month/week calendar toggle, booking dot indicators, and chronological day appointment list with status badges — fetching from Plan 01's API with server-side initial hydration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T00:17:20Z
- **Completed:** 2026-02-23T00:22:08Z
- **Tasks:** 2 (committed together as atomic unit)
- **Files modified:** 5

## Accomplishments

- Two-panel layout replaces /admin placeholder: 60% calendar left, 40% day appointment panel right
- AdminCalendar renders month grid with green booking dots, Monday-first Hungarian weekdays (H/K/Sze/Cs/P/Szo/V), month navigation, and pill-shaped month/week toggle
- AdminWeekView renders vertical 07:00-18:00 timeline with 7 day columns; appointment blocks positioned by time using percentage math, color-coded (#99CEB7 confirmed, #475569 cancelled), clickable
- AdminDayPanel shows chronological appointments with time, patient name, service, phone, and status badges (Visszaigazolva green / Lemondva muted)
- Server Component pre-fetches today's bookings and current month bookings via getWriteClient() in parallel — zero loading flash on initial render

## Task Commits

Tasks 1 and 2 committed as one atomic unit since AdminCalendar imports AdminWeekView (TypeScript compile dependency):

1. **Task 1 + Task 2: Full admin dashboard UI** - `b20b53d` (feat)
   - src/app/admin/page.tsx, AdminDashboard.tsx, AdminCalendar.tsx, AdminDayPanel.tsx, AdminWeekView.tsx

**Plan metadata:** TBD (docs commit)

## Files Created/Modified

- `src/app/admin/page.tsx` — Updated: replaces placeholder dashboard with AdminDashboard server-rendered shell; fetches today + month bookings via getWriteClient(); wraps in try/catch for graceful dev-mode degradation
- `src/components/admin/AdminDashboard.tsx` — Created: client shell with selectedDate/viewMode/dayBookings/monthBookings/weekBookings state; fetches day bookings on date change, week bookings on week mode; exports AdminBooking type
- `src/components/admin/AdminCalendar.tsx` — Created: month grid with booking dots (confirmed only), month navigation, Monday-first Hungarian day names, month/week toggle; renders AdminWeekView in week mode
- `src/components/admin/AdminDayPanel.tsx` — Created: chronological appointment list with time/name/service/phone and Visszaigazolva/Lemondva status badges; empty state "Ezen a napon nincs foglalás."; loading state "Betöltés..."
- `src/components/admin/AdminWeekView.tsx` — Created: CSS Grid vertical timeline, hour labels 07:00-18:00, 7 day columns with today highlighting, absolutely positioned appointment blocks using timeToTopPercent / durationToHeightPercent helpers

## Decisions Made

- AdminWeekView imported by AdminCalendar (not AdminDashboard) — AdminCalendar renders it directly in week mode, cleaner component tree
- handleBookingClick is a no-op stub — Plan 03 wires the patient detail modal into this callback without requiring refactoring
- Server Component fetches today + current month bookings in parallel via `Promise.all` for zero-delay initial render
- try/catch around initial Sanity fetch allows the dashboard to render empty in dev when SANITY_WRITE_TOKEN is absent
- isDayLoading starts false — initial dayBookings come from server; loading state only shows on subsequent date changes

## Deviations from Plan

None — plan executed exactly as written. Tasks 1 and 2 committed together because AdminCalendar imports AdminWeekView, making them a TypeScript compile dependency (same pattern as Plan 01).

## Issues Encountered

- Biome: unused import warning (AdminWeekView imported in AdminDashboard, but it's used in AdminCalendar). Fixed by removing the import from AdminDashboard and letting AdminCalendar own it.
- Biome: import order auto-fixed with `biome check --write` for two files.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- AdminDashboard.handleBookingClick stub ready for Plan 03 to wire the patient detail modal
- AdminDayPanel rows are clickable buttons calling onBookingClick(booking) — Plan 03 connects the modal here
- AdminWeekView appointment blocks also call onBookingClick — Plan 03 gets week view clicks for free
- POST /api/admin/booking-cancel (Plan 01) ready for Plan 03's cancel flow

---
*Phase: 13-admin-dashboard*
*Completed: 2026-02-23*
