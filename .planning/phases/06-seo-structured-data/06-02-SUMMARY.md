---
phase: 06-seo-structured-data
plan: 02
subsystem: ui
tags: [nextjs, metadata, open-graph, twitter-card, sanity, seo, hungarian]

# Dependency graph
requires:
  - phase: 06-seo-structured-data
    plan: 01
    provides: siteSettings with siteName + defaultOgImage; homepage with metaDescription + ogImage; GROQ queries projecting all SEO fields
provides:
  - layout.tsx dynamic generateMetadata() with OG defaults from SiteSettings
  - page.tsx generateMetadata() with homepage-specific OG override cascade
  - blog/[slug]/page.tsx enhanced generateMetadata() with article OG type and image cascade
affects:
  - 06-03 (structured data plan builds on same page files)
  - 06-04 (privacy policy page can add generateMetadata using same pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js Metadata API: generateMetadata() async function replacing static export const metadata"
    - "OG image cascade pattern: page-specific ogImage > featuredImage > siteSettings defaultOgImage"
    - "metadataBase in root layout sets domain for all relative canonical URLs"
    - "title.absolute on homepage removes template suffix (site name only, no pipe suffix)"
    - "title.template in root layout applies ' | SiteName' suffix to all other page titles"

key-files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/blog/[slug]/page.tsx

key-decisions:
  - "layout.tsx generateMetadata fetches siteSettings independently — Next.js deduplicates the fetch with the RootLayout component's own fetch"
  - "Homepage uses title.absolute to show site name only (no template suffix) — social cards show clean brand name"
  - "Blog post OG type is 'article' with publishedTime — matches Open Graph article specification"
  - "OG image cascade in blog: ogImage > featuredImage > defaultOgImage — allows granular control at each level"
  - "All og:locale set to hu_HU — Hungarian content region code for Facebook/LinkedIn social previews"

patterns-established:
  - "generateMetadata pattern for future page types: fetch page data + siteSettings in Promise.all, build OG with cascade"
  - "urlFor(image).width(1200).height(630).url() for all OG images — standard 1.91:1 ratio for social previews"

requirements-completed: [SEO-02, SEO-09]

# Metrics
duration: 11min
completed: 2026-02-20
---

# Phase 6 Plan 02: Open Graph Meta Tags Summary

**Next.js Metadata API wired to Sanity for all pages: root layout OG defaults from SiteSettings, homepage-specific OG override, blog posts with article type + image cascade (ogImage > featuredImage > defaultOgImage)**

## Performance

- **Duration:** 11 min
- **Started:** 2026-02-20T21:33:00Z
- **Completed:** 2026-02-20T21:44:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- layout.tsx: replaced static `export const metadata` with async `generateMetadata()` fetching SiteSettings — og:title, og:description, og:image, og:locale, twitter:card all set dynamically
- page.tsx: added `generateMetadata()` with homepage-specific OG data fetched in parallel (homepage + siteSettings), with og:image cascade (homepage ogImage > defaultOgImage)
- blog/[slug]/page.tsx: enhanced existing `generateMetadata()` to fetch siteSettings in parallel, added openGraph article type, publishedTime, og:locale, image cascade (ogImage > featuredImage > defaultOgImage), canonical URL, twitter:card

## Task Commits

Each task was committed atomically:

1. **Task 1: Set root metadata defaults from Sanity SiteSettings in layout.tsx** - `088a6d4` (feat)
2. **Task 2: Add homepage-specific metadata and enhance blog post OG tags** - `b889fd0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/app/layout.tsx` - Dynamic generateMetadata() with SiteSettings OG defaults; urlFor import added; title template and metadataBase set
- `src/app/page.tsx` - generateMetadata() function added; fetches homepage + siteSettings in parallel; OG image cascade; title.absolute for clean homepage social card
- `src/app/blog/[slug]/page.tsx` - Enhanced generateMetadata() with siteSettingsQuery + SiteSettings import; openGraph article type; publishedTime; 3-level image cascade; canonical URL

## Decisions Made
- layout.tsx generateMetadata() makes a separate fetch for siteSettings (same query as RootLayout component body); Next.js deduplicates this via request memoization — no extra network calls
- Homepage uses `title.absolute: siteName` to prevent the " | SiteName" suffix (the template from layout) — social preview cards show the site name without duplication
- Blog posts use og:type "article" and publishedTime to match the Open Graph article spec — allows Facebook/LinkedIn to show article metadata
- Image cascade design: post-level ogImage is editorial override; featuredImage is the natural visual; defaultOgImage is the brand fallback — each level serves a distinct purpose
- All og:locale set to "hu_HU" — correct locale code for Hungarian content on all social platforms

## Deviations from Plan

### Pre-existing uncommitted changes incorporated

**1. [Context] Pre-existing uncommitted work from prior sessions staged alongside Task 1**
- **Found during:** Task 1 staging (git add -u staged all modified tracked files)
- **What happened:** Prior agent sessions (06-03, 06-04) had modified page.tsx (JsonLd + structured data) and blog/[slug]/page.tsx (JSON-LD Article schema) but these changes were uncommitted in the working tree. When git add -u was run to stage layout.tsx, these files were staged and committed together.
- **Impact:** Both page.tsx and blog/[slug]/page.tsx in the commits contain the full implementations including JsonLd from 06-03. This is correct final state — no regression, no missing content. The 06-03/06-04 plan work is captured in these commits.
- **Files affected:** src/app/page.tsx, src/app/blog/[slug]/page.tsx
- **Resolution:** Working tree is clean. All three plan deliverables (layout.tsx, page.tsx, blog/[slug]/page.tsx) are committed with correct generateMetadata implementations.

---

**Total deviations:** 1 (pre-existing staged work incorporated — no scope creep, correct outcome)
**Impact on plan:** No functional deviation. All plan requirements met. The prior session's uncommitted work was captured in these commits rather than being lost.

## Issues Encountered
- Windows git autocrlf (core.autocrlf=true) caused line-ending normalization that made `git status` show files as unmodified even after Write tool changes. Resolution: used `git add -u` which correctly detected all modified tracked files for staging.
- Biome format --write reverted two files (layout.tsx, page.tsx) to their previous content when run after Write tool. Root cause: biome was reading from a different buffer state. Resolution: re-wrote files and staged immediately before running biome.

## Next Phase Readiness
- All three pages now have complete OG metadata with hu_HU locale
- layout.tsx provides title template and metadataBase — future page files inherit these automatically
- generateMetadata pattern established: fetch page data + siteSettings in Promise.all, cascade OG images
- Ready for 06-03 (JSON-LD structured data) — already partially implemented in working tree

---
*Phase: 06-seo-structured-data*
*Completed: 2026-02-20*
