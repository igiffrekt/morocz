---
phase: 07-animation-polish-performance
plan: 01
subsystem: ui
tags: [motion, animation, scroll, whileInView, react, nextjs]

# Dependency graph
requires:
  - phase: 06-seo-structured-data
    provides: Final homepage section components (ServicesSection, LabTestsSection, TestimonialsSection, BlogSection, Footer) with semantic HTML
provides:
  - FadeIn component with dual-mode support: mount (viewport=false) and scroll-triggered (viewport=true)
  - StaggerChildren component with dual-mode support: mount and scroll-triggered
  - All 6 below-fold sections with whileInView entrance animations
  - Hero section retains mount-based animation (above the fold)
affects: [07-02-intro-overlay, 07-03-circle-wipe, any future phases touching section components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FadeIn viewport=true for scroll-triggered section headings and content blocks"
    - "StaggerChildren viewport=true for scroll-triggered card grids"
    - "whileInView with viewport={{ once: true, amount: 0.2 }} — plays once, triggers at 20% visibility"
    - "motion.section with whileInView variants for HeroServiceCards stagger"
    - "Footer converted from Server Component to Client Component for animation support"

key-files:
  created: []
  modified:
    - src/components/motion/FadeIn.tsx
    - src/components/motion/StaggerChildren.tsx
    - src/components/sections/HeroServiceCards.tsx
    - src/components/sections/ServicesSection.tsx
    - src/components/sections/LabTestsSection.tsx
    - src/components/sections/TestimonialsSection.tsx
    - src/components/sections/BlogSection.tsx
    - src/components/layout/Footer.tsx

key-decisions:
  - "FadeIn uses Omit<HTMLMotionProps<div>, viewport> to avoid type conflict with motion's built-in viewport prop (boolean vs ViewportOptions)"
  - "FadeIn transition typed as motion/react Transition to satisfy TypeScript strict mode with ease string literal"
  - "HeroServiceCards stagger reduced from 0.1s to 0.08s per CONTEXT.md max stagger guidance"
  - "HeroServiceCards delayChildren:0.6 removed — no delay needed for scroll-triggered animation"
  - "FadeIn children wrapped in <div> (not fragment) when wrapping multiple elements to satisfy Biome noUselessFragments rule"
  - "Footer converted to Client Component ('use client') to enable FadeIn animation wrapper"
  - "Pre-existing Biome issues in ServicesSection (noSvgWithoutTitle) and LabTestsSection (useJsxKeyInIterable) out-of-scope per SCOPE BOUNDARY rule"

patterns-established:
  - "Section heading: <FadeIn viewport><h2 .../></FadeIn>"
  - "Card grid: <FadeIn viewport delay={0.15}><div className='grid ...'>{cards}</div></FadeIn>"
  - "HeroServiceCards: motion.section with whileInView='visible' variants directly (no FadeIn wrapper)"

requirements-completed: [ANIM-03, ANIM-04, RESP-02]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 7 Plan 01: Scroll-Triggered Section Entrance Animations Summary

**All 6 below-fold sections now animate in on scroll using whileInView with once:true; hero retains mount animation; FadeIn/StaggerChildren components extended with viewport prop while preserving backward compatibility**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-21T15:32:44Z
- **Completed:** 2026-02-21T15:41:01Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- FadeIn and StaggerChildren both support `viewport` boolean prop — when true uses `whileInView` with `once: true, amount: 0.2`; when false (default) retains existing mount animation
- All 6 below-fold sections animate in on scroll: HeroServiceCards, ServicesSection, LabTestsSection, TestimonialsSection, BlogSection, Footer
- HeroSection explicitly untouched — above-fold, mount-based animations preserved
- Card groups stagger at 0.08s per card (per CONTEXT.md max stagger recommendation)
- MotionConfig reducedMotion="user" at root automatically handles reduced motion for all whileInView animations — no per-component handling needed
- Build passes, type errors resolved, formatting auto-fixed

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor FadeIn and StaggerChildren for scroll-triggered animations** - `e527aaf` (feat)
2. **Task 2: Add scroll-triggered animations to all section components** - `ff3bd04` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `src/components/motion/FadeIn.tsx` - Added `viewport` boolean prop; when true uses whileInView+viewport={once,amount}; Omit<HTMLMotionProps<div>,"viewport"> prevents type conflict
- `src/components/motion/StaggerChildren.tsx` - Added `viewport` boolean prop; when true uses whileInView="visible"+viewport={once,amount}
- `src/components/sections/HeroServiceCards.tsx` - Converted animate to whileInView, stagger 0.1→0.08s, removed delayChildren
- `src/components/sections/ServicesSection.tsx` - Added FadeIn viewport for heading+filters; FadeIn viewport delay=0.15 for card grid
- `src/components/sections/LabTestsSection.tsx` - Added FadeIn viewport for heading; FadeIn viewport delay=0.15 wrapping slide carousel+dots
- `src/components/sections/TestimonialsSection.tsx` - Added FadeIn viewport for heading; FadeIn viewport delay=0.15 wrapping carousel+dots
- `src/components/sections/BlogSection.tsx` - Added FadeIn viewport for header row; updated card viewports to include amount:0.2
- `src/components/layout/Footer.tsx` - Added 'use client' directive; wrapped all footer content in FadeIn viewport

## Decisions Made

- Used `Omit<HTMLMotionProps<"div">, "viewport">` on FadeIn's interface — motion/react already has a `viewport` prop typed as `ViewportOptions`, and our boolean `viewport` prop conflicts. Omit prevents the type error.
- Typed the `transition` variable as `Transition` from motion/react to resolve TypeScript's `ease: string` not assignable issue.
- Reduced HeroServiceCards stagger from 0.1s to 0.08s per CONTEXT.md max guidance for mobile performance.
- Removed `delayChildren: 0.6` from HeroServiceCards — the 0.6s delay was appropriate when the section animated on mount (needed to wait for hero to load), but scroll-triggered animation starts exactly when the section enters the viewport.
- FooterSection wrapped children in `<div>` rather than `<>` fragment to satisfy Biome's `noUselessFragments` rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type conflict in FadeIn viewport prop**
- **Found during:** Task 1 (FadeIn component refactor)
- **Issue:** `interface FadeInProps extends HTMLMotionProps<"div">` caused type error — motion's `viewport` prop is typed as `ViewportOptions`, not `boolean`
- **Fix:** Changed to `Omit<HTMLMotionProps<"div">, "viewport">` and added `Transition` type annotation to resolve `ease` string literal mismatch
- **Files modified:** `src/components/motion/FadeIn.tsx`
- **Verification:** `npm run build` passes with zero type errors
- **Committed in:** `e527aaf` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed unnecessary fragment pattern causing Biome lint errors**
- **Found during:** Task 2 (section component updates)
- **Issue:** `<FadeIn viewport><>...</></FadeIn>` pattern caused `noUselessFragments` Biome error
- **Fix:** Replaced `<>` fragments with `<div>` wrappers in Footer and ServicesSection
- **Files modified:** `src/components/layout/Footer.tsx`, `src/components/sections/ServicesSection.tsx`
- **Verification:** `npx biome check --write` on those files succeeds
- **Committed in:** `ff3bd04` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for type safety and lint compliance. No scope creep.

## Issues Encountered

- Pre-existing Biome errors in `ServicesSection.tsx` (5x `noSvgWithoutTitle` for category icon SVGs) and `LabTestsSection.tsx` (`useJsxKeyInIterable` for const card pattern) were present in the committed codebase before this plan. Per SCOPE BOUNDARY rule, these were logged as deferred items and not fixed.

## Next Phase Readiness

- Scroll-triggered animation infrastructure complete — FadeIn and StaggerChildren now support both mount and scroll-triggered modes
- All homepage sections now reveal on scroll with consistent timing (0.5s duration, 0.08s stagger, easeOut, 20% threshold)
- Ready for Phase 7 Plan 02/03 (IntroOverlay typewriter sequence and CircleWipe transition)

---
*Phase: 07-animation-polish-performance*
*Completed: 2026-02-21*
