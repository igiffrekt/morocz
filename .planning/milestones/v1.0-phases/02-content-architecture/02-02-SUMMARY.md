---
phase: 02-content-architecture
plan: "02"
subsystem: cms
tags: [sanity, typescript, schema, studio, hungarian]

# Dependency graph
requires:
  - phase: 02-01
    provides: Sanity client, sanityFetch wrapper, Studio route at /studio, schemaTypes registry
provides:
  - homepageType singleton schema (hero, services highlight, lab tests highlight, CTA sections)
  - siteSettingsType singleton schema (logo, contact, navigation, social, footer, meta)
  - serviceCategoryType document schema (name, emoji, order)
  - serviceType document schema (name, description, icon, category reference, order)
  - labTestType document schema (name, description, price, originalPrice, discount, illustration, order)
  - Custom Studio desk structure with Hungarian sidebar groups (Kezdolap, Szolgaltatasok, Beallitasok)
affects:
  - 02-03 (blog schemas register in same index.ts)
  - 02-04 (TypeGen generates types from these schemas)
  - 02-05 (GROQ queries target these document types)
  - Phase 3 (front-end components consume these schema shapes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sanity singleton pattern via fixed documentId in desk structure (no __experimental_actions needed)
    - All Studio labels and descriptions in Hungarian for non-technical editor
    - Rich list previews with select+prepare to dereference references (category.name in service preview)
    - Desk structure co-located in src/sanity/desk/structure.ts, imported into sanity.config.ts

key-files:
  created:
    - src/sanity/schemaTypes/homepageType.ts
    - src/sanity/schemaTypes/siteSettingsType.ts
    - src/sanity/schemaTypes/serviceCategoryType.ts
    - src/sanity/schemaTypes/serviceType.ts
    - src/sanity/schemaTypes/labTestType.ts
    - src/sanity/desk/structure.ts
  modified:
    - src/sanity/schemaTypes/index.ts
    - sanity.config.ts

key-decisions:
  - "Singleton pattern via fixed documentId in desk structure (homepage -> 'homepage', siteSettings -> 'siteSettings') — no __experimental_actions needed in Sanity v4"
  - "Hero card colors hardcoded in front-end code, not in Sanity schema (per locked decision)"
  - "serviceType references serviceCategoryType via reference field — dereferenced in preview via select+prepare"
  - "Desk structure has 3 groups: Kezdolap (singleton), Szolgaltatasok (service+category+labTest), Beallitasok (singleton) — blog group deferred to 02-03"

patterns-established:
  - "Singleton pattern: S.document().schemaType('x').documentId('x') in desk structure"
  - "Reference preview: preview.select with dotted path (category.name) + prepare() to format subtitle"
  - "Hungarian-first studio: every title, description, group label in Hungarian"

requirements-completed: [CMS-02, CMS-03, CMS-04, CMS-05, CMS-09, CMS-13]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 02 Plan 02: Content Schemas and Studio Structure Summary

**5 Sanity document schemas (homepage/siteSettings singletons + serviceCategory/service/labTest) with Hungarian labels, plus custom Studio desk structure grouping content by page section**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T12:29:20Z
- **Completed:** 2026-02-19T12:32:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created homepage singleton schema with hero (headline, subtitle, doctor image, 4 service cards), services highlight, lab tests highlight, and CTA sections — all Hungarian-labeled
- Created siteSettings singleton with logo, contact info, navigation links, social media links, footer columns, and meta description
- Created serviceCategoryType (name, emoji, order), serviceType (with reference to serviceCategory), and labTestType (with price, originalPrice, discount, illustration)
- Built custom Studio desk structure with 3 Hungarian-labeled sidebar groups: Kezdolap, Szolgaltatasok (services+categories+labTests), Beallitasok — wired into sanity.config.ts
- All 5 schema types registered in schemaTypes/index.ts alongside the 3 types from parallel plan 02-03

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Homepage, SiteSettings, and ServiceCategory schemas** - `47e1ff9` (feat)
2. **Task 2: Create Service and LabTest schemas, configure Studio desk structure** - `f5268da` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/sanity/schemaTypes/homepageType.ts` - Homepage singleton with 4 sections, hero cards array (max 4)
- `src/sanity/schemaTypes/siteSettingsType.ts` - Site settings singleton with nested arrays for nav/social/footer
- `src/sanity/schemaTypes/serviceCategoryType.ts` - Category doc with emoji prefix in preview
- `src/sanity/schemaTypes/serviceType.ts` - Service doc with reference to serviceCategory, dereferenced preview
- `src/sanity/schemaTypes/labTestType.ts` - Lab test doc with price/originalPrice/discount and Ft-formatted preview
- `src/sanity/desk/structure.ts` - Custom StructureResolver with 3 Hungarian sidebar groups and singleton pattern
- `src/sanity/schemaTypes/index.ts` - All 8 schema types registered (5 from this plan + 3 from plan 02-03)
- `sanity.config.ts` - structureTool now receives custom structure

## Decisions Made
- Singleton pattern via `documentId('homepage')` / `documentId('siteSettings')` in desk structure — modern Sanity v4 approach, no deprecated `__experimental_actions`
- Service card colors (yellow/green/pink/blue) hardcoded in front-end code per locked architectural decision
- serviceType references serviceCategoryType; category name dereferenced in preview via `select: { subtitle: 'category.name' }` + `prepare()`
- Blog sidebar group deferred to plan 02-03 where blog schemas are defined

## Deviations from Plan

None - plan executed exactly as written.

Note: Plan 02-03 ran in parallel and merged its 3 types (testimonialType, blogCategoryType, blogPostType) into index.ts before Task 2 committed. My Task 2 commit preserved all 8 types in index.ts.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 schema types are registered and the Studio will display them in the custom Hungarian sidebar
- TypeGen (plan 02-04) can now generate TypeScript types from these schemas
- GROQ queries (plan 02-05) have concrete document types to target
- Front-end (Phase 3) has clear field shapes for all CMS-driven sections

---
*Phase: 02-content-architecture*
*Completed: 2026-02-19*
