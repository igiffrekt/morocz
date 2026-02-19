---
phase: 03-shell-static-sections
plan: 01
subsystem: ui
tags: [next.js, react, tailwind, sanity, header, navigation, mobile-menu, responsive]

# Dependency graph
requires:
  - phase: 02-content-architecture
    provides: SanityImageObject type, urlFor helper, SiteSettings type with navigationLinks/phone/logo
provides:
  - Sticky Header component with scroll-shrink behavior and desktop navigation
  - MobileMenu dropdown component with expand/collapse animation
  - Props-driven pattern — components receive siteSettings data as props, no Sanity calls inside
affects:
  - 03-04 (layout.tsx will wire siteSettings props into Header)
  - All phases building page shells (header is visible on every route)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client components use CSS transitions not Motion library for simple scroll/toggle effects"
    - "Header receives CMS data via props; layout.tsx owns the Sanity fetch"
    - "MobileMenu rendered inside Header so dropdown is in document flow below the nav bar"
    - "Spacer div below fixed header dynamically matches header height to prevent content jump"

key-files:
  created:
    - src/components/layout/Header.tsx
    - src/components/layout/MobileMenu.tsx
  modified: []

key-decisions:
  - "Used CSS transitions (transition-all duration-300) for scroll-shrink — not Motion library (simpler, no overhead)"
  - "MobileMenu rendered inside Header element so dropdown pushes page content rather than overlaying it"
  - "Spacer div height switches dynamically with scroll state to maintain layout continuity under fixed header"
  - "Hamburger animates to X using translate-y + rotate CSS transforms to avoid external icon dependency"

patterns-established:
  - "Layout shell components: 'use client' only when scroll/toggle state needed; data always via props"
  - "Touch targets: min-h-[44px] on all mobile interactive elements per RESP-03"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04, RESP-01, RESP-03]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 3 Plan 01: Header + MobileMenu Summary

**Sticky header with CSS scroll-shrink, Sanity-driven nav links, and mobile hamburger dropdown — props-ready for layout.tsx wiring in Plan 03-04**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T13:57:45Z
- **Completed:** 2026-02-19T13:59:48Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Header sticks to top (z-50 fixed), shrinks py-5 → py-3 with shadow-md on scroll
- Desktop nav renders Sanity navigationLinks as flat horizontal list with hover:text-primary
- CTA "Foglaljon időpontot" links to tel: when phone prop present, button fallback otherwise
- MobileMenu uses max-height CSS transition (0 → 500px) for smooth dropdown expand/collapse
- Hamburger button animates to X via CSS transforms, 44x44px touch target
- Both components pass `npx tsc --noEmit` and `npx biome check` with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Header component with sticky scroll-shrink behavior and desktop navigation** - `72cd737` (feat)
2. **Task 2: Create MobileMenu dropdown component** - `679aad7` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified
- `src/components/layout/Header.tsx` - Sticky header with scroll listener, desktop nav, CTA, hamburger toggle, MobileMenu import
- `src/components/layout/MobileMenu.tsx` - Dropdown with max-height transition, nav links, full-width CTA, onClose callback

## Decisions Made
- CSS transitions chosen over Motion library for scroll-shrink and hamburger animation — simpler and appropriate for non-motion-system interactions
- MobileMenu placed inside the `<header>` element (not as a sibling) so it naturally appears in document flow below the nav bar, pushing page content down as specified
- Dynamic spacer `<div>` renders below the header fragment to keep content visible under the fixed header without hardcoding a fixed margin
- Hamburger-to-X animation uses three `<span>` bars with conditional translate-y and rotate classes — no SVG swap needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome import sort order in Header.tsx**
- **Found during:** Task 1 verification
- **Issue:** `import type { SanityImageObject }` was ordered before `import { urlFor }` — Biome's organizeImports rule requires type-only imports sorted after value imports from the same scope group
- **Fix:** Swapped the two import lines so `urlFor` precedes `SanityImageObject`
- **Files modified:** src/components/layout/Header.tsx
- **Verification:** `npx biome check` exited 0 after fix
- **Committed in:** 72cd737 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 import-sort lint fix)
**Impact on plan:** Trivial lint-only fix; no logic or behavior change. No scope creep.

## Issues Encountered
None beyond the auto-fixed import ordering.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Header.tsx and MobileMenu.tsx are complete and typed; ready to receive siteSettings props from layout.tsx (Plan 03-04)
- No Sanity fetching inside components — data pipeline wiring deferred to Plan 03-04 as planned
- Components compile clean; no outstanding type or lint errors

## Self-Check: PASSED

- FOUND: src/components/layout/Header.tsx
- FOUND: src/components/layout/MobileMenu.tsx
- FOUND: .planning/phases/03-shell-static-sections/03-01-SUMMARY.md
- FOUND commit: 72cd737 (Header)
- FOUND commit: 679aad7 (MobileMenu)

---
*Phase: 03-shell-static-sections*
*Completed: 2026-02-19*
