---
phase: 04-services-lab-tests
plan: "01"
subsystem: ui
tags: [motion, animation, react, tailwind, sanity, nextjs, framer-motion]

# Dependency graph
requires:
  - phase: 02-content-architecture
    provides: ServiceCategory and Service Sanity schemas + GROQ queries returning flat category-dereferenced data
  - phase: 03-shell-static-sections
    provides: Tailwind v4 design tokens (bg-primary, bg-background-light, etc.) and component patterns
provides:
  - ServicesSection client component with interactive category filter tabs and animated card grid
affects:
  - 04-02-lab-tests-section
  - homepage page.tsx (will receive ServicesSection props)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AnimatePresence mode="popLayout" wrapping motion.div children for enter/exit on filter switch
    - layout="position" on motion.div cards (not layout=true) to prevent CLS during shuffle
    - Horizontal scrollable pill tabs using [&::-webkit-scrollbar]:hidden Tailwind arbitrary selectors

key-files:
  created:
    - src/components/sections/ServicesSection.tsx
  modified: []

key-decisions:
  - "layout='position' used (not layout=true) to animate transforms only, preventing CLS during category filter switches"
  - "AnimatePresence mode='popLayout' chosen to allow exit animations before new cards enter"
  - "Active tab shows emoji prefix inline in button text; inactive tabs omit emoji"

patterns-established:
  - "Filter UI pattern: useState for activeCategoryId, derive filteredServices inline, AnimatePresence + layout='position' on cards"
  - "Section receives all data as props — never calls Sanity directly (Server Component data pattern)"

requirements-completed:
  - SERV-01
  - SERV-02
  - SERV-03
  - SERV-04
  - SERV-05
  - SERV-06

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 4 Plan 01: ServicesSection Summary

**`"use client"` ServicesSection with horizontal scrollable category filter pills and AnimatePresence + layout="position" animated card grid — 2-col mobile / 4-col desktop, flat no-shadow cards from Sanity props**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T22:55:10Z
- **Completed:** 2026-02-19T22:57:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Built `ServicesSection.tsx` as a fully autonomous `"use client"` component
- Category filter pills with active state (dark navy + emoji) and inactive state (outlined) using Tailwind
- Animated service card grid with `AnimatePresence mode="popLayout"` and `layout="position"` on each card
- Cards display Sanity icon (via `next/image` + `urlFor`), name, and description with `line-clamp-2`
- Biome-compliant: organized imports, `type="button"`, `aria-pressed`, `next/image` only — no lint warnings
- TypeScript clean, production build passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ServicesSection client component with filter tabs and animated card grid** - `23907c2` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/components/sections/ServicesSection.tsx` - "use client" component with category filter tabs and animated service card grid

## Decisions Made
- `layout="position"` used (not `layout={true}`) to animate card transforms only, preventing CLS during category filter switches
- `AnimatePresence mode="popLayout"` chosen so exiting cards animate out before entering cards animate in, preventing grid overlap
- Active tab shows `{emoji} {name}` format inline in button text; inactive tabs omit emoji (matches design spec)
- Emoji shown only on active tab (not inline on all tabs) — keeps inactive pills clean and scannable

## Deviations from Plan

None — plan executed exactly as written. Biome import-order and formatting auto-fixed by `biome check --write` (style fix, not a deviation from spec).

## Issues Encountered

- Biome `organizeImports` required `AnimatePresence` before `motion` alphabetically, and `useState` to come after `next/image` (third-party sorted before internal). Resolved by running `biome check --write` which applied the fix automatically.
- First `npm run build` attempt hit a transient Windows ENOENT error on `.next/export` rename (Windows filesystem race condition unrelated to our code). Clean build (`rm -rf .next && npm run build`) passed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `ServicesSection` component is ready to be imported into `src/app/page.tsx` and wired with `allServicesQuery` and `allServiceCategoriesQuery` data
- Phase 04-02 (LabTestsSection) can proceed in parallel — no dependency on ServicesSection

---
*Phase: 04-services-lab-tests*
*Completed: 2026-02-19*
