---
phase: 07-animation-polish-performance
plan: 03
subsystem: ui
tags: [motion, animation, circle-wipe, page-transition, intro-overlay, ssr, performance, blog, navigation]

# Dependency graph
requires:
  - phase: 07-02
    provides: CircleWipeLink and IntroOverlay components ready for integration
  - phase: 07-01
    provides: Scroll-triggered section entrance animations

provides:
  - CircleWipeLink wired into BlogSection and RelatedPosts for all blog card navigation
  - IntroOverlay enlarged icon/text and repeat-visit fully skipped (instant null return)
  - CircleWipeLink triggers on ALL internal homepage navigation (not just /blog/ prefix)
  - SSR bailout error resolved — IntroOverlay imported directly, no dynamic() wrapper
  - HeroSection hero image with priority prop for LCP optimization
  - Full Phase 7 animation stack verified by user (7 visual tests passed)

affects:
  - Phase 08 (launch readiness) — animation and performance baselines established

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CircleWipeLink homepage mode: trigger on all internal paths when pathname === '/'"
    - "IntroOverlay SSR safety: return null during SSR by checking phase === null — no dynamic() ssr:false needed"
    - "Direct import pattern: dynamic(ssr:false) unnecessary when component already SSR-safeguards itself with null check"

key-files:
  created: []
  modified:
    - src/components/sections/BlogSection.tsx
    - src/components/blog/RelatedPosts.tsx
    - src/components/motion/CircleWipeLink.tsx
    - src/components/motion/IntroOverlay.tsx
    - src/app/layout.tsx
    - src/components/sections/HeroSection.tsx
  deleted:
    - src/components/motion/IntroOverlayLoader.tsx

key-decisions:
  - "CircleWipeLink triggers on ALL internal paths when on homepage (pathname === '/') — user prefers full-page animation navigation vs only /blog/ and /laborvizsgalatok/ prefixes"
  - "Repeat visits return null immediately — no overlay rendered at all, not even a fade"
  - "Intro icon enlarged to 80-100px, text to text-4xl/text-5xl — initial sizing was too small"
  - "IntroOverlayLoader (dynamic ssr:false wrapper) deleted — IntroOverlay already returns null during SSR, making the wrapper redundant and causing SSR bailout errors"
  - "HeroSection hero image gets priority prop — ensures LCP candidate loads eagerly"

patterns-established:
  - "SSR-safe animation components: return null during server render (phase === null check), no need for dynamic(ssr:false) wrapper"
  - "Homepage-aware CircleWipeLink: pathname === '/' mode triggers on all internal links for consistent homepage navigation feel"

requirements-completed: [ANIM-05, ANIM-07, RESP-02]

# Metrics
duration: 45min
completed: 2026-02-21
---

# Phase 07 Plan 03: CircleWipeLink Integration + Animation Stack Verification Summary

**CircleWipeLink wired into all blog card navigation, intro overlay sized and skip-logic refined, SSR bailout error resolved, and full 7-test animation visual verification approved by user**

## Performance

- **Duration:** ~45 min (including checkpoint iteration with user feedback)
- **Started:** 2026-02-21T16:47:12Z
- **Completed:** 2026-02-21T17:28:19Z
- **Tasks:** 3 (Task 1 + Task 1b feedback iteration + Task 1c SSR fix) + checkpoint approval
- **Files modified:** 7 (including 1 deleted)

## Accomplishments

- BlogSection.tsx and RelatedPosts.tsx: all blog card Links replaced with CircleWipeLink — circle wipe plays on every blog navigation
- IntroOverlay enlarged icon (80-100px) and text (text-4xl/text-5xl) after user found initial sizing too small
- Repeat-visit overlay completely eliminated — sessionStorage check returns null immediately, no overlay flash at all
- CircleWipeLink expanded to trigger on ALL internal homepage links (pathname === '/'), not just blog/lab prefixes
- IntroOverlayLoader dynamic wrapper deleted — direct IntroOverlay import fixes SSR bailout error in dev mode
- HeroSection hero image given priority prop for LCP optimization
- All 7 visual tests passed and approved: intro sequence, repeat-visit skip, scroll animations, circle wipe, reduced motion, mobile viewport, Lighthouse performance

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire CircleWipeLink into blog card and related post navigation** - `90b1f38` (feat)
2. **Task 1b: Fix checkpoint feedback — bigger intro, no repeat overlay, homepage circle wipe, perf fixes** - `38a674e` (fix)
3. **Task 1c: Remove IntroOverlayLoader dynamic import causing SSR bailout error** - `46aca9c` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/sections/BlogSection.tsx` - Link replaced with CircleWipeLink on both blog card links
- `src/components/blog/RelatedPosts.tsx` - Link replaced with CircleWipeLink on related post title links
- `src/components/motion/CircleWipeLink.tsx` - Added homepage mode (triggers on all internal paths when pathname === '/')
- `src/components/motion/IntroOverlay.tsx` - Icon enlarged (80-100px), text enlarged (text-4xl/5xl), repeat-visit returns null immediately
- `src/app/layout.tsx` - Reverted to direct IntroOverlay import (removed IntroOverlayLoader)
- `src/components/sections/HeroSection.tsx` - Added priority prop to hero image for LCP optimization
- `src/components/motion/IntroOverlayLoader.tsx` - DELETED (dynamic ssr:false wrapper was causing SSR bailout errors; component's own null check is sufficient)

## Decisions Made

- **Homepage-wide circle wipe:** User feedback during checkpoint revealed the navigation should feel animated across all homepage links, not just blog/lab routes. CircleWipeLink now checks `pathname === '/'` and triggers on all internal hrefs in that mode.
- **Repeat-visit null return:** Rather than a short fade (0.5s), repeat visits now return null immediately — no overlay is rendered, no animation plays. This is simpler and eliminates any possible flash.
- **Delete IntroOverlayLoader:** The dynamic(ssr:false) wrapper was redundant — IntroOverlay's phase state machine already initializes to null server-side (no sessionStorage access during SSR) and returns null during SSR. The wrapper caused an "internal server error" in dev mode (SSR bailout). Direct import is the correct pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SSR bailout error from IntroOverlayLoader dynamic import**
- **Found during:** Task 1b post-checkpoint (user testing exposed dev-mode SSR error)
- **Issue:** IntroOverlayLoader used `next/dynamic` with `ssr: false`, but IntroOverlay already returns null during SSR via its phase state machine. The unnecessary dynamic wrapper caused a dev-mode "internal server error" (Next.js SSR bailout).
- **Fix:** Deleted IntroOverlayLoader.tsx, reverted layout.tsx to import IntroOverlay directly. No behavior change — component already guards SSR with null return.
- **Files modified:** src/app/layout.tsx, src/components/motion/IntroOverlayLoader.tsx (deleted)
- **Verification:** Dev server started without SSR errors; build passes; Biome clean
- **Committed in:** 46aca9c (Task 1c commit)

### User Feedback Iterations (checkpoint-driven)

**2. Intro overlay sizing enlarged (user feedback)**
- **Found during:** Task 2 checkpoint — user reported icon and text were too small
- **Fix:** Icon size 48px → 80-100px; text class text-2xl → text-4xl/text-5xl (responsive)
- **Files modified:** src/components/motion/IntroOverlay.tsx
- **Committed in:** 38a674e

**3. Repeat-visit overlay removed entirely (user feedback)**
- **Found during:** Task 2 checkpoint — user preferred no overlay at all on repeat visits
- **Fix:** sessionStorage check returns null immediately instead of rendering a quick fade overlay
- **Files modified:** src/components/motion/IntroOverlay.tsx
- **Committed in:** 38a674e

**4. CircleWipeLink expanded to all homepage navigation (user feedback)**
- **Found during:** Task 2 checkpoint — user preferred circle wipe on all homepage nav links
- **Fix:** Added pathname === '/' mode to shouldWipe() so all internal links trigger the wipe when browsing from homepage
- **Files modified:** src/components/motion/CircleWipeLink.tsx
- **Committed in:** 38a674e

---

**Total deviations:** 1 auto-fixed (Rule 1 - SSR bug) + 3 user-requested refinements during checkpoint iteration
**Impact on plan:** SSR fix essential for correctness. User feedback refinements improved visual quality and UX. No unplanned scope creep.

## Issues Encountered

- Pre-existing Biome errors in unrelated files remain deferred (out of scope for this plan)
- IntroOverlayLoader pattern initially created to defer animation bundle but conflicted with Next.js SSR — resolved by removing the wrapper

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Full Phase 7 animation stack complete and user-approved: intro overlay, scroll-triggered entrances, circle wipe transitions, button hovers, reduced motion, mobile behavior, Core Web Vitals
- All ANIM requirements (ANIM-01 through ANIM-07) verified working
- Phase 8 (launch readiness) can proceed — animation and performance foundation is solid

---
*Phase: 07-animation-polish-performance*
*Completed: 2026-02-21*
