---
phase: 05-testimonials-blog
plan: 01
subsystem: database
tags: [sanity, groq, typescript, queries, schema]

# Dependency graph
requires:
  - phase: 02-content-architecture
    provides: GROQ query patterns, sanity.types.ts hand-authored types, defineQuery() usage
  - phase: 04-services-lab-tests
    provides: homepageType.ts structure with labTestsSubtitle as insertion anchor

provides:
  - testimonialsHeadline and blogHeadline fields in homepageType schema
  - homepageQuery updated to project new heading fields
  - latestBlogPostsQuery (3 most recent posts, no category, no publishedAt)
  - relatedBlogPostsQuery (same category, excludes current post, max 3)
  - TestimonialQueryResult type matching allTestimonialsQuery projection
  - BlogPostQueryResult type matching latestBlogPostsQuery projection
  - BlogPostDetailResult type matching blogPostBySlugQuery projection
  - Homepage type updated with testimonialsHeadline and blogHeadline fields

affects:
  - 05-02 (TestimonialsSection component needs TestimonialQueryResult)
  - 05-03 (BlogSection component needs BlogPostQueryResult)
  - 05-04 (blog post detail page needs BlogPostDetailResult and relatedBlogPostsQuery)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "latestBlogPostsQuery uses [0...3] slice syntax (not limit()) for top-N GROQ queries"
    - "relatedBlogPostsQuery accepts $categoryId and $currentPostId params; caller falls back to latestBlogPostsQuery if category is null"
    - "Query result types kept separate from document types — BlogPostQueryResult vs BlogPost document type"

key-files:
  created: []
  modified:
    - src/sanity/schemaTypes/homepageType.ts
    - src/sanity/lib/queries.ts
    - sanity.types.ts

key-decisions:
  - "latestBlogPostsQuery projects only _id, title, slug, featuredImage, excerpt — no category field per CONTEXT.md (no category tags on cards)"
  - "relatedBlogPostsQuery caller is responsible for fallback to latestBlogPostsQuery when category is null (documented in code comment)"
  - "BlogPostDetailResult is a separate type from BlogPost document type to reflect the dereferenced category shape in the GROQ projection"

patterns-established:
  - "Top-N GROQ pattern: *[...] | order(field desc)[0...N]{projection}"
  - "Parameterized exclusion query: _id != $currentPostId used alongside category._ref == $categoryId"

requirements-completed: [TEST-05, BLOG-07]

# Metrics
duration: 8min
completed: 2026-02-20
---

# Phase 5 Plan 01: Testimonials + Blog Data Layer Summary

**Sanity schema + GROQ queries + TypeScript types for testimonial carousel and blog post display — ready for Phase 5 UI components**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-20T00:00:00Z
- **Completed:** 2026-02-20T00:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `testimonialsHeadline` and `blogHeadline` fields to homepage Sanity schema and their corresponding projection in `homepageQuery`
- Added `latestBlogPostsQuery` (3 most recent posts, no category field per CONTEXT.md) and `relatedBlogPostsQuery` (same category, excludes current post)
- Added `TestimonialQueryResult`, `BlogPostQueryResult`, `BlogPostDetailResult` types to `sanity.types.ts` and updated `Homepage` document type

## Task Commits

Each task was committed atomically:

1. **Task 1: Add homepage section fields and new blog GROQ queries** - `d3e7f80` (feat)
2. **Task 2: Add query result types for testimonials and blog posts** - `d3d5d29` (feat)

## Files Created/Modified

- `src/sanity/schemaTypes/homepageType.ts` - Added testimonialsHeadline and blogHeadline fields after labTestsSubtitle
- `src/sanity/lib/queries.ts` - Updated homepageQuery projection; added latestBlogPostsQuery and relatedBlogPostsQuery
- `sanity.types.ts` - Updated Homepage type; added TestimonialQueryResult, BlogPostQueryResult, BlogPostDetailResult

## Decisions Made

- `latestBlogPostsQuery` does not include `category` field — per CONTEXT.md, no category tags shown on homepage blog cards
- `relatedBlogPostsQuery` accepts `$categoryId` and `$currentPostId` params; caller falls back to `latestBlogPostsQuery` if category is null (documented in code comment)
- `BlogPostDetailResult` is typed separately from the `BlogPost` document type to reflect the dereferenced category object shape (`{ _id, name, slug }` vs `SanityReference<BlogCategory>`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data layer complete — all Phase 5 UI component plans can consume typed query results
- `TestimonialQueryResult[]` ready for TestimonialsSection carousel
- `BlogPostQueryResult[]` ready for BlogSection homepage component
- `BlogPostDetailResult` ready for `/blog/[slug]` detail page
- `relatedBlogPostsQuery` ready for related posts at bottom of blog detail page

---
*Phase: 05-testimonials-blog*
*Completed: 2026-02-20*
