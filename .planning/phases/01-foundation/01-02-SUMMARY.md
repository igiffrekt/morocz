---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [motion, animation, biome, linting, nextjs, typescript]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: Next.js 15 App Router, Tailwind v4 design tokens, Plus Jakarta Sans font
provides:
  - Motion v12 (motion@12.34.2) installed with motion/react import path confirmed
  - MotionProvider client component with reducedMotion='user' at root layout
  - FadeIn reusable animation wrapper (direction, delay, duration props)
  - StaggerChildren reusable stagger container component
  - Server/Client component boundary: layout.tsx is Server, MotionProvider is Client
  - Biome v2.4.2 configured with recommended rules, zero errors on codebase
  - npm scripts: lint:biome, lint:biome:fix, format
  - VS Code format-on-save with Biome integration
  - .env.example with Phase 2 Sanity placeholder variables
  - Production build passes clean, project deployment-ready for Vercel
affects: [02-header, 03-homepage, 04-services, 05-lab-tests, 06-testimonials, 07-blog, 08-footer]

# Tech tracking
tech-stack:
  added:
    - motion@12.34.2 (import from motion/react — confirmed via package.json exports)
    - "@biomejs/biome@2.4.2 (linting and formatting)"
  patterns:
    - "Animation: All animated components use 'use client' directive"
    - "Animation: MotionProvider wraps <body> in layout.tsx — single MotionConfig at root"
    - "Animation: FadeIn wraps content with opacity+translate initial, animates to opacity:1 x:0 y:0"
    - "Animation: StaggerChildren uses variants pattern (hidden/visible) for orchestrated staggering"
    - "AnimatePresence: NOT used for page transitions (App Router incompatibility)"
    - "Biome v2: CSS files excluded from linting (Tailwind @theme/@apply syntax not supported)"
    - "Biome v2: organizeImports via assist.actions.source.organizeImports (not top-level organizeImports)"
    - "Biome v2: folder exclusions use !folder pattern (not !folder/** as in v1)"

key-files:
  created:
    - src/components/motion/MotionProvider.tsx
    - src/components/motion/FadeIn.tsx
    - src/components/motion/StaggerChildren.tsx
    - biome.json
    - .vscode/settings.json
    - .env.example
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - package.json

key-decisions:
  - "Motion v12 import path is 'motion/react' — confirmed via node_modules/motion/package.json exports field"
  - "Biome CSS linting disabled — Biome v2 does not support Tailwind @theme/@apply syntax; CSS formatting handled by Biome formatter disabled too"
  - "Biome v2.4.2 used (not v2.0 as planned) — v2.4.2 has breaking config changes vs v1: organizeImports moved to assist block, ignore key renamed to includes with negation patterns"
  - "AnimatePresence explicitly NOT wired for page transitions — will use template.js enter-only pattern in Phase 3+"

patterns-established:
  - "Motion components: Always 'use client', always import from motion/react"
  - "Biome check: Run npx biome check . for zero-error verification"
  - "Build verification: npm run build must pass before any commit"

requirements-completed:
  - FOUND-02
  - FOUND-03
  - FOUND-06
  - FOUND-07

# Metrics
duration: 20min
completed: 2026-02-19
---

# Phase 1 Plan 2: Motion v12 Animation Architecture + Biome Linting Summary

**Motion v12 animation wrappers (MotionProvider, FadeIn, StaggerChildren) with reducedMotion='user' at root, plus Biome v2 configured for zero-error linting across the codebase**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-02-19T00:20:00Z
- **Completed:** 2026-02-19T00:40:00Z
- **Tasks:** 2 auto (+ 1 checkpoint pending human verification)
- **Files modified:** 9

## Accomplishments

- Motion v12 installed and working — import path `motion/react` confirmed via package exports
- MotionProvider wraps `<body>` in root layout with `reducedMotion="user"` — OS prefers-reduced-motion fully respected
- FadeIn and StaggerChildren reusable client components created with proper TypeScript types
- Animation test on page.tsx verifies Server/Client boundary is clean (no hydration errors)
- Biome v2.4.2 configured with recommended rules — zero errors, 2 warnings (acceptable) on all source files
- Production build passes clean — project is Vercel deployment-ready

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Motion v12 and create animation architecture** - `f8391a0` (feat)
2. **Task 2: Configure Biome linting and verify deployment readiness** - `b5519cc` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/components/motion/MotionProvider.tsx` - Client component wrapping MotionConfig with reducedMotion='user'
- `src/components/motion/FadeIn.tsx` - Reusable fade-in animation wrapper (direction/delay/duration props)
- `src/components/motion/StaggerChildren.tsx` - Reusable stagger container using variants pattern
- `src/app/layout.tsx` - Updated to wrap body children in MotionProvider
- `src/app/page.tsx` - Added animation test section using FadeIn component
- `biome.json` - Biome v2.4.2 config with recommended rules, space indents, 100 char line width
- `package.json` - Added motion dependency, @biomejs/biome devDependency, lint:biome scripts
- `.vscode/settings.json` - Biome as default formatter with format-on-save
- `.env.example` - Phase 2 Sanity CMS placeholder variables

## Decisions Made

- **Motion import path:** `motion/react` confirmed correct via `node_modules/motion/package.json` exports field inspection. `motion/react-client` does exist as a separate export but `motion/react` is the standard React integration.
- **Biome CSS disabled:** Biome v2 parses CSS but does not understand Tailwind's `@theme {}` and `@apply` directives. Disabling CSS in Biome avoids false parse errors with no downside (CSS is Tailwind-managed).
- **Biome v2 config format:** Several breaking changes from v1: `organizeImports` moved to `assist.actions.source.organizeImports`, `files.ignore` renamed to `files.includes` with negation patterns, folder exclusions drop trailing `/**`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome v2 config format incompatibility**
- **Found during:** Task 2 (Configure Biome)
- **Issue:** Plan specified `files.ignore` key and top-level `organizeImports` block — both removed in Biome v2. Config failed to parse.
- **Fix:** Updated to v2 format: `files.includes` with negation patterns, `assist.actions.source.organizeImports` for import organization
- **Files modified:** biome.json
- **Verification:** `npx biome check .` passes with zero errors
- **Committed in:** b5519cc (Task 2 commit)

**2. [Rule 3 - Blocking] Biome CSS parse errors on Tailwind syntax**
- **Found during:** Task 2 (running biome check)
- **Issue:** Biome v2 parses CSS files but rejects `@theme {}` and `@apply` as unknown Tailwind directives
- **Fix:** Disabled Biome CSS formatter and linter (`"css": { "formatter": { "enabled": false }, "linter": { "enabled": false } }`) and excluded CSS from file includes
- **Files modified:** biome.json
- **Verification:** `npx biome check .` passes with zero errors
- **Committed in:** b5519cc (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking config issues)
**Impact on plan:** Both fixes required because Biome v2 was installed (v2.4.2 is current stable) while plan was written expecting v1 API. No scope creep — outcome matches plan intent.

## Issues Encountered

- Biome v2 breaking API changes vs plan's expected v1 config structure. Resolved by inspecting the generated `biome init` output and Biome error messages to determine correct v2 format.

## User Setup Required

None — no external service configuration required for this plan. Phase 2 Sanity connection will require setting environment variables documented in `.env.example`.

## Next Phase Readiness

- Motion v12 animation infrastructure ready for Phases 3-7 (homepage, services, etc.)
- FadeIn and StaggerChildren can be imported directly in any future page/section component
- Biome linting enforced project-wide — future code must pass `npx biome check .`
- Build passes clean — can deploy to Vercel immediately
- Task 3 checkpoint awaiting human visual verification (animation behavior + reduced motion)

## Self-Check: PASSED

All required files confirmed present:
- FOUND: src/components/motion/MotionProvider.tsx
- FOUND: src/components/motion/FadeIn.tsx
- FOUND: src/components/motion/StaggerChildren.tsx
- FOUND: biome.json
- FOUND: .vscode/settings.json
- FOUND: .env.example
- FOUND: .planning/phases/01-foundation/01-02-SUMMARY.md

Commits confirmed:
- FOUND: f8391a0 (Task 1 — Motion v12 architecture)
- FOUND: b5519cc (Task 2 — Biome linting)

---
*Phase: 01-foundation*
*Completed: 2026-02-19*
