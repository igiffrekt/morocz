---
phase: 05-testimonials-blog
plan: 02
subsystem: ui
tags: [react, motion, accessibility, carousel, testimonials, tailwind]

# Dependency graph
requires:
  - phase: 05-01
    provides: TestimonialQueryResult type from sanity.types.ts

provides:
  - TestimonialsSection carousel component ready to receive testimonial data as props

affects:
  - page.tsx (homepage) — will import and wire TestimonialsSection with data from Sanity

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AnimatePresence mode='wait' for crossfade: initial/animate/exit opacity only, key=_id"
    - "motion drag='x' with dragConstraints left/right 0 and onDragEnd offset threshold for swipe"
    - "fieldset used as keyboard-focusable carousel container (semantic role='group' alternative)"
    - "Dot navigation uses <nav> + <button> elements with aria-label per patient name"

key-files:
  created:
    - src/components/sections/TestimonialsSection.tsx
  modified: []

key-decisions:
  - "fieldset used instead of div for carousel keyboard container — Biome useSemanticElements rule requires semantic element for role='group'"
  - "bg-accent (#99CEB7 teal/green from globals.css @theme) used for section background — matches design reference soft teal"
  - "PlaceholderAvatar renders an SVG person silhouette with aria-hidden and aria-label for accessibility"
  - "biome-ignore noNoninteractiveTabindex used on fieldset — tabIndex required for WCAG keyboard carousel pattern"

# Metrics
duration: 4min
completed: 2026-02-20
---

# Phase 5 Plan 02: TestimonialsSection Carousel Summary

**Testimonial carousel with AnimatePresence crossfade, dot navigation, swipe gestures (motion drag), and keyboard arrow key accessibility on teal/green background**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-20T11:33:30Z
- **Completed:** 2026-02-20T11:37:10Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `TestimonialsSection.tsx` as a `"use client"` component consuming `TestimonialQueryResult[]` props
- Implemented AnimatePresence `mode="wait"` crossfade transitions (opacity 0.4s) keyed by `_id`
- Added dot navigation with active/inactive states, `aria-label` per patient name, and click handlers
- Added swipe gesture support via `motion drag="x"` with 50px threshold and wrap-around navigation
- Added keyboard navigation (ArrowLeft/ArrowRight) on focusable `<fieldset>` container
- Added `PlaceholderAvatar` SVG component for testimonials with no photo uploaded
- Returns `null` on empty array; hides dots and disables drag for single testimonial
- Section uses `bg-accent` (teal/green `#99CEB7`) with `rounded-3xl` on inner container

## Task Commits

1. **Task 1: Build TestimonialsSection carousel component** — `cc5237e` (feat)

## Files Created/Modified

- `src/components/sections/TestimonialsSection.tsx` — 147 lines, fully functional carousel

## Decisions Made

- `<fieldset>` used as carousel keyboard wrapper — Biome's `useSemanticElements` rule requires the semantic HTML element for `role="group"`; `<fieldset>` also natively accepts `tabIndex` and keyboard handlers
- `bg-accent` (`#99CEB7`) used for section background — the existing design token for teal/green in `globals.css @theme` matches the design reference
- `PlaceholderAvatar` renders a simple SVG person silhouette (gray circle body + head) with `aria-hidden` and `aria-label` attributes
- One `biome-ignore` suppression used for `noNoninteractiveTabindex` on fieldset — tabIndex is required for keyboard carousel accessibility per WCAG pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome a11y violations in initial component draft**
- **Found during:** Task 1 verification (npx biome check)
- **Issue:** SVG missing title/aria-label; `div` with `role="region"` should be `<section>`; `tabIndex` on non-interactive element; `aria-label` on plain `div`
- **Fix:** Used `<fieldset>` as semantic group container (Biome-approved), `<nav>` for dot navigation, `role="img"` + `aria-label` on SVG, removed `role="region"` div; added single `biome-ignore` for unavoidable tabIndex on fieldset
- **Files modified:** `src/components/sections/TestimonialsSection.tsx`
- **Commit:** `cc5237e`

**2. [Rule 1 - Bug] TypeScript type mismatch on KeyboardEvent handler**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** `handleKeyDown` typed as `React.KeyboardEvent<HTMLDivElement>` but attached to `<fieldset>`
- **Fix:** Changed type parameter to `React.KeyboardEvent<HTMLFieldSetElement>`
- **Files modified:** `src/components/sections/TestimonialsSection.tsx`
- **Commit:** `cc5237e`

## Self-Check: PASSED

- `src/components/sections/TestimonialsSection.tsx` exists: FOUND
- Commit `cc5237e` exists: FOUND
- Component is `"use client"`: YES
- Uses `AnimatePresence` for crossfade: YES
- Has keyboard navigation (ArrowLeft/ArrowRight): YES
- Has dot navigation with aria-labels: YES
- Has `drag="x"` for swipe: YES
- Renders placeholder when no photo: YES
- `npx biome check .` exits 0: YES
- `npx tsc --noEmit` exits 0: YES
- `npm run build` succeeds: YES

---
*Phase: 05-testimonials-blog*
*Completed: 2026-02-20*
