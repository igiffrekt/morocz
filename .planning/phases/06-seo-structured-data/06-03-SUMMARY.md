---
phase: 06-seo-structured-data
plan: 03
subsystem: seo
tags: [json-ld, structured-data, schema-org, next-js, sanity]

# Dependency graph
requires:
  - phase: 06-01-seo-cms-data-layer
    provides: siteSettings SEO fields (phone, email, defaultOgImage, metaDescription)
provides:
  - Reusable JsonLd Server Component for inline JSON-LD script injection
  - MedicalClinic + LocalBusiness + Physician @graph JSON-LD on homepage
  - BreadcrumbList JSON-LD on each blog post page
  - BlogPosting JSON-LD on each blog post page
affects: [phase-07-animation-performance, google-rich-results-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JsonLd Server Component pattern for reusable structured data injection
    - @graph pattern combining multiple schema types in a single script tag
    - PLACEHOLDER comments for user-supplied clinic details (address, hours, credentials)

key-files:
  created:
    - src/components/seo/JsonLd.tsx
  modified:
    - src/app/page.tsx
    - src/app/blog/[slug]/page.tsx

key-decisions:
  - "JsonLd is a Server Component (no 'use client') — dangerouslySetInnerHTML safe because data is server-controlled JSON"
  - "MedicalClinic and LocalBusiness combined in @graph array with single @id for homepage"
  - "Physician schema linked to clinic via worksFor/@id cross-reference"
  - "Clinic details (address, hours, physician name) hardcoded with PLACEHOLDER comments — matches CONTEXT.md decision"
  - "BreadcrumbList breadcrumb: Kezdőlap > Blog > Post Title (Hungarian throughout)"
  - "BlogPosting author/publisher set to Organization (Morocz Medical) — solo practice, clinic is the publisher"

patterns-established:
  - "Pattern: JsonLd component accepts Record<string, unknown> | Record<string, unknown>[] for single or @graph payloads"
  - "Pattern: PLACEHOLDER comments mark user-supplied values in hardcoded JSON-LD data"

requirements-completed: [SEO-03, SEO-04, SEO-05, SEO-09]

# Metrics
duration: 8min
completed: 2026-02-20
---

# Phase 6 Plan 03: JSON-LD Structured Data Summary

**Reusable JsonLd Server Component with MedicalClinic/LocalBusiness/Physician @graph on homepage and BreadcrumbList/BlogPosting on blog post pages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-20T21:32:56Z
- **Completed:** 2026-02-20T21:40:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `JsonLd` Server Component that renders `<script type="application/ld+json">` with controlled JSON — Biome suppression applied correctly inline
- Added `@graph` JSON-LD to homepage with combined MedicalClinic + LocalBusiness + Physician schemas, pulling phone/email/image from SiteSettings
- Added BreadcrumbList and BlogPosting JSON-LD to every blog post page, using post data (title, featuredImage, metaDescription, publishedAt, slug)
- All structured data text in Hungarian (Kezdőlap, Blog, Esztergom, inLanguage: "hu")
- Clinic address, hours, and physician credentials marked with PLACEHOLDER comments for user to fill in

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JsonLd component and add structured data to homepage** - `b889fd0` (feat)
2. **Task 2: Add BreadcrumbList and BlogPosting JSON-LD to blog post pages** - `b889fd0` (feat)

Note: Both tasks were committed together in a single atomic commit by the preceding plan agent that included this work alongside plan 06-02 changes.

## Files Created/Modified

- `src/components/seo/JsonLd.tsx` - Server Component that renders `<script type="application/ld+json">` with dangerouslySetInnerHTML (biome-ignore with justification)
- `src/app/page.tsx` - Added JsonLd import, urlFor import, clinicJsonLd @graph data, and `<JsonLd data={clinicJsonLd} />` render
- `src/app/blog/[slug]/page.tsx` - Added JsonLd import, breadcrumbJsonLd and blogPostingJsonLd construction, both rendered before `</main>`

## Decisions Made

- `JsonLd` uses `dangerouslySetInnerHTML` with a biome-ignore comment — data is entirely server-controlled (no user input path), so XSS risk is zero
- Clinic address, GPS coordinates, opening hours, and physician credentials are hardcoded with `// PLACEHOLDER:` comments per CONTEXT.md decision (rarely changes, not in CMS)
- BreadcrumbList uses Hungarian labels throughout (Kezdőlap, Blog) — SEO-09 compliance
- `author` and `publisher` in BlogPosting set to Organization (Morocz Medical) — solo practice, no individual physician authorship claim on posts

## Deviations from Plan

None — plan executed exactly as written. All must-have artifacts, schemas, and Hungarian content requirements fulfilled.

## Issues Encountered

- Pre-existing Windows filesystem race condition in `npm run build` (`ENOENT: .next/export` rename error on `/500` static page) confirmed as pre-existing in baseline, not introduced by these changes. TypeScript (`npx tsc --noEmit`) and Biome (`npx biome check .`) both pass cleanly.
- Initial Biome `noDangerouslySetInnerHtml` suppression comment was on the wrong line (before `<script>` tag rather than inline on the same line as `dangerouslySetInnerHTML`) — corrected to single-line format that Biome's suppression system accepts.

## User Setup Required

Clinic details in `src/app/page.tsx` are marked with `// PLACEHOLDER:` comments and need to be filled in:
- `streetAddress` — exact street address of Morocz Medical clinic
- `postalCode` — Hungarian postal code for the clinic
- `latitude` / `longitude` — verify or correct the GPS coordinates (currently 47.7933, 18.7404)
- `openingHoursSpecification` — actual opening hours per day (currently Mon-Fri 08:00-16:00)
- `name` in Physician schema — Dr. Morocz's full name
- `jobTitle` in Physician schema — full Hungarian title (e.g., "Belgyógyász szakorvos")

## Next Phase Readiness

- JSON-LD structured data ready for Google Rich Results Test validation
- Homepage and blog post pages have all required schema types for SEO-03, SEO-04, SEO-05, SEO-09
- Phase 7 (Animation Polish + Performance) can proceed without dependencies on this plan

---
*Phase: 06-seo-structured-data*
*Completed: 2026-02-20*
