---
phase: 10-authentication
plan: 03
subsystem: auth
tags: [better-auth, next.js, role-based-access, admin, resend, drizzle, neon]

# Dependency graph
requires:
  - phase: 10-01
    provides: Better Auth server config, Drizzle schema, auth API route, middleware
  - phase: 10-02
    provides: AuthStep patient auth components (referenced for pattern consistency)
provides:
  - Admin login page at /admin with role-gated conditional rendering (no session / wrong role / admin dashboard)
  - AdminLogin client component with dark utilitarian design, email/password only, no OAuth
  - AdminSignOut client component for dashboard sign-out
  - Admin layout wrapper with distinct dark styling
  - Admin seed script (scripts/create-admin.ts) for first admin setup via env vars
  - Admin invite API endpoint (POST /api/admin/invite) with session-gated user creation and Resend email
affects:
  - 11-booking-flow (uses auth session to identify patient user at booking time)
  - 13-admin-dashboard (replaces placeholder admin page built here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component role check via auth.api.getSession() (not middleware cookie alone)
    - Conditional rendering based on session + role (three-state: no session / wrong role / authorized)
    - Client Component sign-out with router.refresh() to trigger Server Component re-render
    - Lazy Resend initialization inside API handler (build compatibility — no module-level side effects)
    - Temporary password via crypto.randomUUID().slice(0, 12) for admin invite flow

key-files:
  created:
    - src/app/admin/page.tsx
    - src/app/admin/layout.tsx
    - src/components/admin/AdminLogin.tsx
    - src/components/admin/AdminSignOut.tsx
    - scripts/create-admin.ts
    - src/app/api/admin/invite/route.ts
  modified: []

key-decisions:
  - "Admin page role check happens in Server Component via auth.api.getSession(), not just middleware — middleware only checks cookie existence"
  - "Admin login is email/password only (no Google OAuth) — per CONTEXT.md, admin accounts are created by invite"
  - "Admin invite uses temporary password via crypto.randomUUID().slice(0, 12) — no complex token system for a 2-admin setup"
  - "AdminSignOut extracted as separate client component to allow sign-out button inside a Server Component page"

patterns-established:
  - "Three-state admin gate: no session → login form, non-admin role → access denied (Hungarian), admin role → dashboard"
  - "Admin layout uses dark slate-900 background to visually distinguish from patient-facing UI"

requirements-completed: [AUTH-04, AUTH-05]

# Metrics
duration: ~15min
completed: 2026-02-22
---

# Phase 10 Plan 03: Admin Authentication Summary

**Role-gated /admin page with dark utilitarian login (email/password only), admin seed script, and invite endpoint sending Hungarian Resend email with temporary password**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-22
- **Completed:** 2026-02-22
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 6

## Accomplishments
- Admin page at /admin conditionally renders login form, access-denied screen, or placeholder dashboard based on Better Auth session and role
- AdminLogin component has distinct dark utilitarian design (slate-800 card, no Google OAuth, no registration, no forgot password) as required by CONTEXT.md
- Admin seed script creates first admin via ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD env vars using auth.api.createUser with role: "admin"
- Admin invite endpoint gates behind admin session check, creates user, and sends Hungarian Resend email with temporary password
- Full auth flow verified by user: admin login works, role separation confirmed, build and lint pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Build admin page with inline login, role-gated dashboard, and admin login component** - `ff47203` (feat)
2. **Task 2: Create admin seed script and admin invite API endpoint** - `7df54e8` (feat)
3. **Task 3: Verify complete auth flow** - checkpoint approved by user (no code commit)

## Files Created/Modified
- `src/app/admin/page.tsx` - Server Component with three-state conditional rendering (no session / wrong role / admin dashboard)
- `src/app/admin/layout.tsx` - Minimal admin layout with dark slate-900 background to distinguish from patient UI
- `src/components/admin/AdminLogin.tsx` - Dark utilitarian email/password login form with Hungarian error messages
- `src/components/admin/AdminSignOut.tsx` - Client component for sign-out with router.refresh()
- `scripts/create-admin.ts` - Standalone seed script for first admin creation via env vars
- `src/app/api/admin/invite/route.ts` - POST endpoint: session-gated admin creation + Resend invite email in Hungarian

## Decisions Made
- Role check in admin/page.tsx uses `auth.api.getSession()` — middleware only checks cookie presence, not role; Server Component handles actual authorization
- AdminSignOut extracted as a separate client component so the sign-out button can live inside the Server Component page
- Temporary password generated via `crypto.randomUUID().slice(0, 12)` — simple and sufficient for a 2-admin invite flow where the recipient changes their password immediately

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

No new external service configuration introduced in this plan. See `10-01-SUMMARY.md` for the Neon, Better Auth, Google OAuth, and Resend environment variable requirements already documented there.

## Next Phase Readiness
- Phase 10 authentication is now complete: Better Auth infrastructure (10-01), patient auth UI (10-02), and admin auth UI (10-03) are all done
- Phase 11 booking flow can use auth sessions to identify logged-in patients at booking time
- Phase 13 admin dashboard will replace the placeholder admin page built here (current placeholder shows "Az admin felület a 13. fázisban kerül megvalósításra.")
- Remaining blocker: runtime auth will not function until user completes Neon + Google OAuth + Resend setup (documented in 10-01-SUMMARY.md)

---
*Phase: 10-authentication*
*Completed: 2026-02-22*
