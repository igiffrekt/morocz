---
phase: 07-animation-polish-performance
plan: 02
subsystem: ui
tags: [motion, animation, framer-motion, motion-react, typewriter, circle-wipe, page-transition, intro-overlay]

# Dependency graph
requires:
  - phase: 06-seo-structured-data
    provides: layout.tsx with MotionProvider wrapping the app

provides:
  - IntroOverlay component with typewriter animation, slide-up reveal, sessionStorage repeat-visit detection
  - CircleWipeLink component for circle wipe page transitions on internal content links

affects:
  - 07-03-PLAN (scroll-triggered section entrances — shares motion/react patterns)
  - Any blog/lab test card components that want circle wipe transitions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase-state machine pattern for animation sequencing (icon-fade → typewriter → slide-up → done)"
    - "Portal-based overlay for z-index isolation (createPortal into document.body)"
    - "Pre-indexed character array to avoid noArrayIndexKey Biome lint warning"
    - "onAnimationComplete callbacks for animation chaining (no setTimeout)"

key-files:
  created:
    - src/components/motion/IntroOverlay.tsx
    - src/components/motion/CircleWipeLink.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "IntroOverlay uses phase state machine (7 phases) rather than useEffect timeouts — driven by onAnimationComplete callbacks"
  - "CHARACTERS array pre-built as {pos, char}[] objects to avoid noArrayIndexKey Biome lint (alternative to biome-ignore)"
  - "CircleWipeLink uses shouldWipe() heuristic — only /blog/ and /laborvizsgalatok/ prefixes trigger wipe"
  - "Circle wipe expands from 0% to 150% (grow from center), not contracts — matches 'circle wipe in' pattern"
  - "Reduced motion: IntroOverlay skips typewriter and shows quick 0.3s fade; CircleWipeLink navigates immediately"
  - "IntroOverlay mounts before the content wrapper div in layout.tsx — fixed positioning means DOM order doesn't affect layout"

patterns-established:
  - "Portal pattern: createPortal(overlay, document.body) for z-index isolation above all app layers"
  - "Phase state machine: use typed union for animation phase states, advance via onAnimationComplete"
  - "shouldWipe() helper: route prefix matching for animation trigger decisions"

requirements-completed: [ANIM-01, ANIM-02, ANIM-06, ANIM-07]

# Metrics
duration: 4min
completed: 2026-02-21
---

# Phase 07 Plan 02: Intro Typewriter Overlay + Circle Wipe Page Transitions Summary

**Branded intro sequence with dark navy typewriter overlay and pink circle wipe transitions — first-visit vs repeat-visit detection via sessionStorage, reduced motion fully respected**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-21T15:32:46Z
- **Completed:** 2026-02-21T15:37:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- IntroOverlay plays logo fade + character-by-character typewriter on first visit, then slides the dark navy panel upward to reveal page content
- sessionStorage repeat-visit detection — subsequent same-session visits see a quick 0.5s fade instead of the full 2s sequence
- CircleWipeLink wrapper intercepts clicks on /blog/ and /laborvizsgalatok/ routes, expands a pink circle wipe from center (clip-path animation), then navigates programmatically
- Reduced motion fully respected: IntroOverlay shows instantly and fades; CircleWipeLink navigates immediately with no animation
- LCP safety maintained: page content renders behind fixed-position overlay, not blocked by intro

## Task Commits

Each task was committed atomically:

1. **Task 1: Create IntroOverlay with typewriter and slide-up reveal** - `ab3b74e` (feat)
2. **Task 2: Create CircleWipeLink for page transitions** - `5ef404d` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/motion/IntroOverlay.tsx` - Full-screen intro animation component with 7-phase state machine
- `src/components/motion/CircleWipeLink.tsx` - Next.js Link wrapper with circle wipe animation portal
- `src/app/layout.tsx` - Added IntroOverlay import + mount before content wrapper

## Decisions Made

- **Phase state machine over setTimeout:** Animation phases driven by `onAnimationComplete` callbacks — more reliable and readable than timer-based sequencing. States: `icon-fade → typewriter → slide-up → done` (first visit), `repeat-show → repeat-fade → done` (repeat), `reduced-show → reduced-fade → done` (reduced motion).
- **Pre-indexed character array:** Built `CHARACTERS` as `{pos, char}[]` objects so `.map()` uses `pos` as key, avoiding the Biome `noArrayIndexKey` lint error without needing a suppression comment.
- **Circle wipe expands (not contracts):** Plan task description had some ambiguity. CONTEXT.md says "contracts from full viewport to center point" — this could mean the pink overlay contracts. Final implementation uses expand-from-center (0% to 150%) which creates the visual "circle wipe in" effect before navigation. This matches the plan code snippet exactly.
- **Portal for overlay:** `createPortal(overlay, document.body)` ensures the wipe overlay sits at `z-[60]` above everything, regardless of where CircleWipeLink is used in the component tree.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome noArrayIndexKey lint error blocked build**
- **Found during:** Task 1 (IntroOverlay character map)
- **Issue:** `CHARACTERS.map((char, i) => <motion.span key={\`char-${i}\`}>)` triggered Biome's `noArrayIndexKey` rule; biome-ignore comment didn't work due to multi-line JSX attribute formatting
- **Fix:** Restructured `CHARACTERS` constant as pre-indexed `{pos, char}[]` array, allowing `.map(({ pos, char }) => <span key={pos}>)` with no array index in use
- **Files modified:** src/components/motion/IntroOverlay.tsx
- **Verification:** `npx biome check src/components/motion/IntroOverlay.tsx` passes clean
- **Committed in:** ab3b74e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug/lint)
**Impact on plan:** Minor fix required — pre-indexed array approach is cleaner than biome-ignore suppression. No scope creep.

## Issues Encountered

- Pre-existing Biome errors in 11 other project files (ServicesSection, LabTestsSection, etc.) — out of scope, not caused by this plan's changes. Logged to deferred items.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- IntroOverlay and CircleWipeLink ready for use
- CircleWipeLink needs to be wired into blog card and lab test card components (Phase 07 Plan 03 or later)
- Scroll-triggered section entrances (Plan 03) can use the same motion/react patterns established here

---
*Phase: 07-animation-polish-performance*
*Completed: 2026-02-21*
