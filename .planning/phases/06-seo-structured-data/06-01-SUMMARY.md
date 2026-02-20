---
phase: 06-seo-structured-data
plan: 01
subsystem: database
tags: [sanity, groq, typescript, seo, open-graph, portable-text]

# Dependency graph
requires:
  - phase: 05-testimonials-blog
    provides: blogPostType Portable Text schema pattern reused for privacyPolicy body field
provides:
  - SiteSettings Sanity schema with siteName and defaultOgImage fields
  - Homepage Sanity schema with metaDescription and ogImage fields
  - privacyPolicy singleton document schema with Portable Text body
  - GROQ queries projecting all new SEO fields
  - TypeScript types for PrivacyPolicy and updated SiteSettings/Homepage
affects:
  - 06-02 (meta tags implementation will consume these queries and types)
  - 06-03 (structured data will use siteSettings for siteName)
  - 06-04 (privacy policy page will use privacyPolicyQuery and PrivacyPolicy type)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Portable Text body pattern from blogPostType reused in privacyPolicyType (h2/h3/h4/blockquote/bullet/number/link)"
    - "Singleton document pattern: fixed documentId in desk structure + S.document().schemaType().documentId()"

key-files:
  created:
    - src/sanity/schemaTypes/privacyPolicyType.ts
  modified:
    - src/sanity/schemaTypes/siteSettingsType.ts
    - src/sanity/schemaTypes/homepageType.ts
    - src/sanity/schemaTypes/index.ts
    - src/sanity/desk/structure.ts
    - src/sanity/lib/queries.ts
    - sanity.types.ts

key-decisions:
  - "privacyPolicy body field uses identical Portable Text config as blogPostType — consistent content editing experience"
  - "defaultOgImage placed in siteSettings (not homepage) as site-level fallback for all pages without custom OG images"
  - "privacyPolicyQuery filters by _id == 'privacyPolicy' matching the singleton documentId in desk structure"

patterns-established:
  - "SEO fields in page-level schemas: metaDescription (text, rows:2) + ogImage (image) — use this pattern for future page types"
  - "Site-level defaults in siteSettings: siteName + defaultOgImage for fallback OG meta"

requirements-completed: [SEO-02, SEO-06, SEO-09]

# Metrics
duration: 3min
completed: 2026-02-20
---

# Phase 6 Plan 01: SEO CMS Data Layer Summary

**Sanity data layer for SEO: siteName + defaultOgImage in SiteSettings, metaDescription + ogImage in Homepage, new privacyPolicy singleton with Portable Text body, all GROQ queries updated**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-20T10:46:22Z
- **Completed:** 2026-02-20T10:49:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added siteName and defaultOgImage to SiteSettings schema for site-level OG meta fallback
- Added metaDescription and ogImage to Homepage schema for page-specific SEO control
- Created privacyPolicy singleton schema with full Portable Text body (matching blogPostType pattern)
- Registered privacyPolicy in schemaTypes array and desk structure as singleton
- Updated GROQ queries to project all new SEO fields; added privacyPolicyQuery
- Updated TypeScript types with PrivacyPolicy type and expanded SiteSettings/Homepage types

## Task Commits

Each task was committed atomically:

1. **Task 1: Add SEO fields to schemas and create privacyPolicy singleton** - `05b5373` (feat)
2. **Task 2: Update GROQ queries and TypeScript types for SEO fields** - `683d554` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/sanity/schemaTypes/privacyPolicyType.ts` - New singleton schema: title, Portable Text body, lastUpdated date
- `src/sanity/schemaTypes/siteSettingsType.ts` - Added siteName (string) and defaultOgImage (image) fields
- `src/sanity/schemaTypes/homepageType.ts` - Added metaDescription (text) and ogImage (image) fields
- `src/sanity/schemaTypes/index.ts` - Imported and registered privacyPolicyType
- `src/sanity/desk/structure.ts` - Added privacyPolicy singleton before Beállítások divider
- `src/sanity/lib/queries.ts` - Updated homepageQuery and siteSettingsQuery; added privacyPolicyQuery
- `sanity.types.ts` - Added PrivacyPolicy type; expanded Homepage and SiteSettings types

## Decisions Made
- privacyPolicy body field reuses identical Portable Text configuration from blogPostType — consistent editing experience across content types
- defaultOgImage lives in siteSettings as a site-wide fallback, while ogImage in homepage allows override for the home page specifically
- privacyPolicyQuery uses `_id == "privacyPolicy"` matching the singleton documentId set in desk structure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing biome formatter error in BlogSection.tsx**
- **Found during:** Task 1 verification (biome check)
- **Issue:** Two SVG elements with attributes on single lines exceeded biome's line length limit — formatter would reformat them
- **Fix:** Ran `npx biome format --write` on BlogSection.tsx to auto-format
- **Files modified:** src/components/sections/BlogSection.tsx
- **Verification:** `npx biome check .` reports 0 errors after fix
- **Committed in:** 05b5373 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 pre-existing format issue in unrelated file)
**Impact on plan:** Fix was necessary for `npx biome check .` to pass (the Task 1 verify step requires it). No scope creep — pure formatting only.

## Issues Encountered
None — plan executed smoothly within 3 minutes.

## Next Phase Readiness
- Sanity data layer is complete for SEO phase
- siteSettingsQuery now projects siteName and defaultOgImage for meta tag fallback logic
- homepageQuery now projects metaDescription and ogImage for homepage-specific meta tags
- privacyPolicyQuery ready for the /adatkezeles page implementation
- All TypeScript types updated — next plan can use them without type errors

---
*Phase: 06-seo-structured-data*
*Completed: 2026-02-20*
