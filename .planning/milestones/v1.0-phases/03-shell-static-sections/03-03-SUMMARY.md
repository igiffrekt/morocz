---
phase: 03-shell-static-sections
plan: 03
subsystem: ui
tags: [motion, framer-motion, sanity, next-image, hero, animation, tailwind]

# Dependency graph
requires:
  - phase: 02-content-architecture
    provides: Homepage Sanity schema (heroHeadline, heroSubtitle, heroDoctorImage, heroCards) and TypeScript types in sanity.types.ts

provides:
  - heroBadges field in homepage Sanity schema, GROQ query, and TypeScript types
  - HeroHeadline component with letter-by-letter stagger animation via motion/react
  - HeroServiceCards component with 4 hardcoded colored cards and staggered bottom entrance
  - HeroSection main layout with doctor image, floating badges, CTA button with arrow animation

affects: [03-04-page-assembly, 04-services-filter]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "motion/react motion.h1 + motion.span with container/child variants for letter-by-letter stagger"
    - "Hardcoded color arrays indexed by card position (locked decision pattern)"
    - "next/image used for all Sanity image renders (performance/LCP optimization)"
    - "biome-ignore lint suppression comment with justification for array index keys in animation contexts"

key-files:
  created:
    - src/components/sections/HeroHeadline.tsx
    - src/components/sections/HeroServiceCards.tsx
    - src/components/sections/HeroSection.tsx
  modified:
    - src/sanity/schemaTypes/homepageType.ts
    - src/sanity/lib/queries.ts
    - sanity.types.ts

key-decisions:
  - "Array index key accepted for HeroHeadline letter-by-letter animation — text is static and characters never reorder; biome-ignore suppression with justification added"
  - "next/image used instead of <img> for doctor image and card icons to satisfy biome noImgElement lint rule and improve LCP"

patterns-established:
  - "Letter-by-letter animation: split text to chars array, render each as motion.span with stagger variants, spaces as &nbsp;"
  - "All Sanity image renders use next/image via urlFor().url() as src prop"

requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06, HERO-07]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 3 Plan 03: Hero Components Summary

**Letter-by-letter animated headline, 4-color service cards, and full hero layout with doctor image, badges, and CTA — all built with motion/react and driven by Sanity CMS props**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T13:57:54Z
- **Completed:** 2026-02-19T14:01:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added heroBadges field to homepage Sanity schema (max 3 badges with emoji + text subfields), projected in GROQ query, and typed in sanity.types.ts
- Created HeroHeadline with motion/react letter-by-letter stagger animation (staggerChildren: 0.03, each char as motion.span with opacity/y entrance)
- Created HeroServiceCards with hardcoded [yellow, green, purple, blue] color array, 2x2 mobile / 4-col desktop grid, and staggered bottom entrance
- Created HeroSection assembling headline, subtitle, floating badges with spring bounce, CTA button with arrow hover, and doctor image (hidden on mobile)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add heroBadges field to homepage schema, query, and types** - `7078082` (feat)
2. **Task 2: Create HeroHeadline, HeroServiceCards, and HeroSection components** - `a49a47c` (feat)

**Plan metadata:** (docs commit — see final_commit below)

## Files Created/Modified

- `src/sanity/schemaTypes/homepageType.ts` — Added heroBadges array field with emoji/text subfields, max(3) validation
- `src/sanity/lib/queries.ts` — Added heroBadges[]{_key, emoji, text} projection to homepageQuery
- `sanity.types.ts` — Added heroBadges?: Array<{_key, emoji?, text?}> to Homepage type
- `src/components/sections/HeroHeadline.tsx` — Letter-by-letter stagger animation component using motion.h1 + motion.span
- `src/components/sections/HeroServiceCards.tsx` — 4 colored cards with stagger entrance, 2x2/4-col responsive grid
- `src/components/sections/HeroSection.tsx` — Main hero layout composing all sub-components with responsive grid

## Decisions Made

- Array index key used in HeroHeadline for character animation — the text prop is static content from Sanity (not reordered at runtime), so the React reconciler concern doesn't apply; biome-ignore suppression added with justification
- next/image used for all image renders (doctor photo and card icons) to satisfy biome noImgElement lint rule and improve LCP performance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Replaced `<img>` with `next/image` Image component**
- **Found during:** Task 2 (HeroSection and HeroServiceCards)
- **Issue:** Plan specified `<img>` element, but biome noImgElement lint rule requires `next/image` for LCP/performance correctness in Next.js projects
- **Fix:** Imported `Image` from `next/image` and used as drop-in replacement with same src/alt/width/height props; urlFor().url() as the src string
- **Files modified:** src/components/sections/HeroSection.tsx, src/components/sections/HeroServiceCards.tsx
- **Verification:** biome check passes cleanly on both files
- **Committed in:** a49a47c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical performance/lint compliance)
**Impact on plan:** Required deviation for correctness. `next/image` is the correct pattern for Next.js projects. No scope creep.

## Issues Encountered

- biome `noArrayIndexKey` warning on HeroHeadline character map — resolved with `biome-ignore` suppression comment and justification (array index key is semantically correct for positional character animation)
- Import order violations auto-fixed by `npx biome check --write` in two passes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Hero components ready for page assembly in Plan 03-04
- HeroSection accepts: headline, subtitle, badges, doctorImage, cards, phone props — all available from homepage Sanity query
- Doctor image hidden on mobile (md:hidden — locked decision), badges below headline on mobile
- Service cards: 2x2 mobile, 4-col desktop (locked decision)
- Animations will trigger on page load (no scroll-triggered yet — deferred to Phase 7)

## Self-Check: PASSED

- FOUND: src/components/sections/HeroHeadline.tsx
- FOUND: src/components/sections/HeroServiceCards.tsx
- FOUND: src/components/sections/HeroSection.tsx
- FOUND: .planning/phases/03-shell-static-sections/03-03-SUMMARY.md
- FOUND: commit 7078082 (Task 1 - heroBadges schema/query/types)
- FOUND: commit a49a47c (Task 2 - hero components)

---
*Phase: 03-shell-static-sections*
*Completed: 2026-02-19*
