---
phase: 03-shell-static-sections
plan: "04"
subsystem: ui
tags: [next.js, sanity, server-components, data-fetching, layout]

# Dependency graph
requires:
  - phase: 03-shell-static-sections
    provides: Header, Footer, HeroSection, HeroHeadline, HeroServiceCards components built in 03-01 through 03-03
  - phase: 02-content-architecture
    provides: sanityFetch, siteSettingsQuery, homepageQuery, SiteSettings and Homepage types
provides:
  - Working homepage shell with real Sanity data (header, hero, footer)
  - layout.tsx as async Server Component fetching siteSettings
  - page.tsx as async Server Component fetching homepage data
  - Removal of diagnostic sanity-test page
affects: [04-services-filter, 05-lab-tests, all future page assemblies]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "async Server Component layout: root layout fetches shared data (siteSettings), passes props to Header/Footer"
    - "page-level data fetching: each page.tsx fetches its own data, shares cached siteSettings without double-request"
    - "next/link for all internal navigation links (Next.js ESLint compliance)"

key-files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/components/layout/Header.tsx
  deleted:
    - src/app/sanity-test/page.tsx

key-decisions:
  - "page.tsx fetches siteSettings separately from layout.tsx for the phone CTA — Next.js deduplicates the fetch via its fetch cache so no double request occurs"
  - "Footer imported as default export (not named) — matches how it was authored in 03-02"
  - "Header logo link: bare <a href=\"/\"> replaced with next/link <Link> to satisfy Next.js ESLint no-html-link-for-pages rule"

patterns-established:
  - "Assembly pattern: Server Component pages compose pre-built section components, passing Sanity data as props"

requirements-completed: [RESP-01, RESP-03]

# Metrics
duration: 10min
completed: 2026-02-19
---

# Phase 3 Plan 04: Homepage Assembly Summary

**Homepage shell assembled — layout.tsx and page.tsx wired to Sanity CMS, rendering Header, HeroSection, and Footer with real data; diagnostic sanity-test page removed; production build passes**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-19T14:05:59Z
- **Completed:** 2026-02-19T14:16:00Z
- **Tasks:** 1 of 2 complete (Task 2 awaiting human visual verification)
- **Files modified:** 4 (3 modified, 1 deleted)

## Accomplishments
- layout.tsx converted to async Server Component: fetches siteSettings, renders Header and Footer with props
- page.tsx rewritten from design-system test page to real homepage: fetches homepage data, renders HeroSection
- sanity-test diagnostic page removed (src/app/sanity-test/ deleted)
- Production build passes, TypeScript and Biome clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire layout.tsx and page.tsx with Sanity data and all section components** - `e6b38b8` (feat)

**Plan metadata:** pending final commit after human verification

## Files Created/Modified
- `src/app/layout.tsx` - Async Server Component fetching siteSettings, rendering Header + Footer with props
- `src/app/page.tsx` - Async Server Component fetching homepage + siteSettings, rendering HeroSection
- `src/components/layout/Header.tsx` - Logo link changed from `<a href="/">` to `<Link href="/">` (next/link)
- `src/app/sanity-test/page.tsx` - DELETED (diagnostic page no longer needed)

## Decisions Made
- Footer is a default export (authored that way in 03-02), imported without braces in layout.tsx
- page.tsx fetches siteSettings independently for the phone CTA; Next.js request deduplication prevents a real double-fetch
- All internal navigation links should use next/link `<Link>` — the ESLint rule enforcement discovered in this task caught a pre-existing issue in Header.tsx

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed import order to satisfy Biome organizeImports**
- **Found during:** Task 1 (layout.tsx and page.tsx wiring)
- **Issue:** Biome organizeImports rule rejected the import ordering from the plan template (MotionProvider before Footer alphabetically)
- **Fix:** Reordered imports in both layout.tsx and page.tsx to follow Biome's alphabetical grouping
- **Files modified:** src/app/layout.tsx, src/app/page.tsx
- **Verification:** npx biome check . passes with no errors
- **Committed in:** e6b38b8 (Task 1 commit)

**2. [Rule 1 - Bug] Replaced bare `<a href="/">` with next/link `<Link>` in Header**
- **Found during:** Task 1 (production build verification)
- **Issue:** Next.js ESLint rule no-html-link-for-pages blocks production build when a bare `<a>` links to an internal page
- **Fix:** Added `import Link from "next/link"` to Header.tsx; replaced `<a href="/">` with `<Link href="/">`
- **Files modified:** src/components/layout/Header.tsx
- **Verification:** npm run build passes successfully
- **Committed in:** e6b38b8 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- @sanity/image-url default export deprecation warnings appear during build — pre-existing issue (out of scope for this task, logged to deferred-items)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Homepage shell is complete and production-ready
- All Phase 3 components are assembled and render real Sanity data
- Phase 4 (Services animated filter) can begin — page.tsx is ready to add more sections below HeroSection
- Human visual verification at http://localhost:3001 is the only remaining step

---
*Phase: 03-shell-static-sections*
*Completed: 2026-02-19*
