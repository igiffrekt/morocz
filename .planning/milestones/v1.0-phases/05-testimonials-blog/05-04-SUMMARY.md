---
phase: 05-testimonials-blog
plan: 04
subsystem: ui
tags: [react, nextjs, sanity, tailwind, motion, testimonials, blog, homepage-wiring]

# Dependency graph
requires:
  - phase: 05-02
    provides: TestimonialsSection carousel component
  - phase: 05-03
    provides: BlogSection, blog detail route, PortableTextRenderer
  - phase: 05-01
    provides: allTestimonialsQuery, latestBlogPostsQuery, query result types

provides:
  - src/app/page.tsx: homepage with all 6 sections wired to Sanity data (Hero, HeroServiceCards, Services, LabTests, Testimonials, Blog)
  - Redesigned BlogSection: 40/60 two-card layout with category tags, accent card, hero-style CTA
  - Redesigned TestimonialsSection: horizontal card layout with separator, pill dot navigation
  - Redesigned LabTestsSection: paginated 3x3 grid with dot navigation and drag/swipe

affects:
  - Phase 6+ (full homepage now complete — all above-the-fold and below-the-fold sections live)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.all expanded from 5 to 7 parallel Sanity queries in page.tsx"
    - "Design refinement via visual verification checkpoint — iterative polish after initial wiring"
    - "Paginated grid pattern: LabTestsSection uses page state + dot navigation for 3x3 pages"
    - "40/60 split card layout: BlogSection accent card uses bg-accent for visual emphasis"

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/components/sections/BlogSection.tsx
    - src/components/sections/TestimonialsSection.tsx
    - src/components/sections/LabTestsSection.tsx
    - src/app/globals.css
    - src/sanity/lib/queries.ts
    - sanity.types.ts

key-decisions:
  - "latestBlogPostsQuery updated to include category field — needed for category tag display in redesigned BlogSection"
  - "BlogSection redesigned to 40/60 two-card layout with category tags and accent right card (departed from original 3-card grid)"
  - "TestimonialsSection redesigned to horizontal card layout with photo+name left, separator, quote right"
  - "LabTestsSection converted to paginated 3x3 grid with dot navigation replacing animated category-filter layout"
  - "Page background changed to white"

patterns-established:
  - "Paginated section pattern: track currentPage state, derive visible slice, render dot nav"
  - "40/60 blog layout: first card is standard, second card accent (bg-accent) — visual hierarchy without size difference"

requirements-completed: [TEST-01, TEST-05, BLOG-01, BLOG-07]

# Metrics
duration: ~30min
completed: 2026-02-20
---

# Phase 5 Plan 04: Homepage Wiring and Design Refinement Summary

**TestimonialsSection and BlogSection wired into homepage via 7-query Promise.all; sections redesigned through interactive visual verification to 40/60 blog layout, horizontal testimonial cards, and paginated 3x3 lab tests grid**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-02-20T12:40:00Z
- **Completed:** 2026-02-20T21:27:17Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Wired `TestimonialsSection` and `BlogSection` into `src/app/page.tsx` by expanding the `Promise.all` from 5 to 7 parallel Sanity queries, adding `allTestimonialsQuery` and `latestBlogPostsQuery` with typed destructuring
- Redesigned `BlogSection` to a 40/60 two-card layout: left card standard, right card uses `bg-accent` teal as accent background; each card shows category tag, title, excerpt, and CTA; hero-style button with hover animation
- Redesigned `TestimonialsSection` to horizontal card layout with photo + name on the left, vertical separator, and quote text on the right; pill dot navigation below
- Converted `LabTestsSection` from animated category-filter to paginated 3x3 grid with dot navigation and drag/swipe gesture support
- Updated `latestBlogPostsQuery` to project the `category` field needed by the redesigned BlogSection cards
- Changed page background to white in `globals.css`

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire TestimonialsSection and BlogSection into homepage page.tsx** - `9ecfa7a` (feat)
2. **Task 2: Visual verification + design refinements** - `98ad9c9` (feat)

## Files Created/Modified

- `src/app/page.tsx` - Expanded Promise.all to 7 queries; added TestimonialsSection and BlogSection below LabTestsSection
- `src/components/sections/BlogSection.tsx` - Redesigned to 40/60 two-card layout with category tags, accent right card, hero-style CTA button
- `src/components/sections/TestimonialsSection.tsx` - Redesigned to horizontal card (photo+name | separator | quote), pill dot nav
- `src/components/sections/LabTestsSection.tsx` - Converted to paginated 3x3 grid with dot navigation and drag/swipe
- `src/sanity/lib/queries.ts` - `latestBlogPostsQuery` updated to include category field
- `src/app/globals.css` - Page background set to white
- `sanity.types.ts` - Minor type update reflecting query changes

## Decisions Made

- `latestBlogPostsQuery` now projects `category` — the redesigned BlogSection displays category tags on each card, requiring this field
- `BlogSection` 40/60 redesign chosen during visual verification: accent right card creates visual hierarchy without needing a hero-sized card or different aspect ratio
- `LabTestsSection` paginated grid replaces the animated category-filter: simpler interaction model, cleaner look per user review
- `TestimonialsSection` horizontal layout: photo and name on the left create an identifiable person-first presentation; quote on the right has more visual weight

## Deviations from Plan

### User-directed Redesigns (during checkpoint:human-verify)

The original plan called for visual verification of existing components. During the checkpoint the user requested multiple redesign rounds:

**1. [User-directed] BlogSection redesigned from 3-card grid to 40/60 two-card layout**
- **Found during:** Task 2 (visual verification)
- **Issue:** User wanted a design closer to the reference mockup
- **Fix:** Rebuilt BlogSection with 40/60 layout, category tags, accent card, hero CTA
- **Files modified:** src/components/sections/BlogSection.tsx, src/sanity/lib/queries.ts
- **Committed in:** 98ad9c9

**2. [User-directed] TestimonialsSection redesigned to horizontal card layout**
- **Found during:** Task 2 (visual verification)
- **Issue:** Original carousel with single centered card not matching reference design
- **Fix:** Rebuilt with horizontal layout (photo+name | separator | quote), pill dot nav
- **Files modified:** src/components/sections/TestimonialsSection.tsx
- **Committed in:** 98ad9c9

**3. [User-directed] LabTestsSection converted to paginated 3x3 grid**
- **Found during:** Task 2 (visual verification)
- **Issue:** Animated category-filter layout not matching reference; user preferred paginated grid
- **Fix:** Replaced AnimatePresence filter with page-state pagination, dot nav, drag support
- **Files modified:** src/components/sections/LabTestsSection.tsx
- **Committed in:** 98ad9c9

---

**Total deviations:** 3 user-directed redesigns (all completed during planned visual verification task)
**Impact on plan:** All redesigns were approved by the user during the checkpoint. Redesign is the expected outcome of a human-verify checkpoint.

## Issues Encountered

None beyond the iterative design rounds, which are expected at a human-verify checkpoint.

## User Setup Required

None — all changes are code-only. Sanity Studio seeding was done interactively by the user during visual verification.

## Next Phase Readiness

- Phase 5 is fully complete: all homepage sections (Hero, HeroServiceCards, Services, LabTests, Testimonials, Blog) are live and CMS-driven
- Blog detail route (`/blog/[slug]`) is SSG-ready with breadcrumbs, related posts, and PortableText rendering
- Phase 6 (Contact / Appointment Booking) can begin immediately

---

## Self-Check: PASSED

- FOUND: src/app/page.tsx
- FOUND: src/components/sections/BlogSection.tsx
- FOUND: src/components/sections/TestimonialsSection.tsx
- FOUND: src/components/sections/LabTestsSection.tsx
- FOUND: src/sanity/lib/queries.ts
- FOUND commit: 9ecfa7a (feat(05-04): wire TestimonialsSection and BlogSection into homepage)
- FOUND commit: 98ad9c9 (feat(05-04): redesign blog, testimonial, and lab test sections per design reference)

---
*Phase: 05-testimonials-blog*
*Completed: 2026-02-20*
