---
phase: 05-testimonials-blog
plan: 03
subsystem: ui-components
tags: [react, nextjs, sanity, portabletext, blog, ssg, tailwind, motion]

# Dependency graph
requires:
  - phase: 05-01
    provides: BlogPostQueryResult, BlogPostDetailResult, latestBlogPostsQuery, relatedBlogPostsQuery, allBlogPostsQuery, blogPostBySlugQuery

provides:
  - BlogSection.tsx: homepage blog section with 3 cards, whileInView animations, scroll anchor link
  - PortableTextRenderer.tsx: full Portable Text rendering with styled headings, lists, blockquotes, marks, inline images
  - RelatedPosts.tsx: card grid matching BlogSection style, Hungarian heading
  - src/app/blog/[slug]/page.tsx: SSG blog detail route with breadcrumbs, featured image, body, related posts, metadata

affects:
  - src/app/page.tsx (homepage needs BlogSection + latestBlogPostsQuery wired up)

# Tech tracking
tech-stack:
  added:
    - "@portabletext/react@^6.0.2 (confirmed already installed as Sanity peer dep)"
  patterns:
    - "PortableTextReactComponents partial map — only override needed block/list/mark types"
    - "relatedBlogPostsQuery fallback: if < 2 results, fall back to latestBlogPostsQuery, then filter out current post"
    - "Next.js 15 async params: await params before accessing slug"
    - "SSG via generateStaticParams using allBlogPostsQuery slug projection"

key-files:
  created:
    - src/components/sections/BlogSection.tsx
    - src/components/blog/PortableTextRenderer.tsx
    - src/components/blog/RelatedPosts.tsx
    - src/app/blog/[slug]/page.tsx
  modified:
    - package.json (CRLF line ending fix after npm install on Windows)

key-decisions:
  - "BlogSection uses scroll anchor href='#blog' for 'Read All Blogs' link — no separate blog listing page (CONTEXT.md locked)"
  - "No category tags on blog cards (CONTEXT.md locked)"
  - "No author/date on blog detail page (CONTEXT.md deferred)"
  - "RelatedPosts fallback: fetch latestBlogPostsQuery when category is null or fewer than 2 related posts found"
  - "PortableTextRenderer is a server component (no 'use client') — pure rendering, no interactivity needed"

# Metrics
duration: 7min
completed: 2026-02-20T11:40:56Z
---

# Phase 5 Plan 03: Blog UI Components Summary

**BlogSection (3-card homepage grid with whileInView animations) + PortableTextRenderer (full block type coverage) + blog detail route (/blog/[slug]) with breadcrumbs, related posts, and SSG via generateStaticParams**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-20T11:33:43Z
- **Completed:** 2026-02-20T11:40:56Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Built `BlogSection.tsx`: homepage blog section with a `grid-cols-1 md:grid-cols-3` card layout, featured images (aspect-video), title linked to detail page, excerpt with line-clamp-3, `whileInView` fade-in + slide-up Motion animations, and "Összes blog bejegyzés" scroll anchor link styled consistently with LabTestsSection
- Built `PortableTextRenderer.tsx`: server component rendering full Portable Text with styled h2/h3/h4/blockquote/normal blocks, bullet/number lists, strong/em/link marks, and inline image blocks with captions
- Built `RelatedPosts.tsx`: card grid reusing the BlogSection card pattern with "Kapcsolódó bejegyzések" heading
- Built `src/app/blog/[slug]/page.tsx`: async server component with `generateStaticParams` (SSG), `generateMetadata`, breadcrumb trail (Kezdőlap > Blog > Post Title), featured image with `priority`, PortableText body, and related posts with fallback logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Build BlogSection and PortableTextRenderer** - `ad6377c` (feat)
2. **Task 2: Build blog detail page with breadcrumbs, related posts, static generation** - `0847673` (feat)

## Files Created/Modified

- `src/components/sections/BlogSection.tsx` - Homepage blog section component (3 cards + scroll anchor)
- `src/components/blog/PortableTextRenderer.tsx` - Portable Text renderer with full block type coverage
- `src/components/blog/RelatedPosts.tsx` - Related posts grid for blog detail page bottom
- `src/app/blog/[slug]/page.tsx` - SSG blog post detail route (breadcrumbs, featured image, body, related posts, metadata)
- `package.json` - CRLF line ending fix after npm install on Windows

## Decisions Made

- `BlogSection` uses `href="#blog"` for the "Read All Blogs" link — no separate blog listing page per CONTEXT.md
- No category tags on blog cards per CONTEXT.md locked decision
- No author or publish date on blog detail page per CONTEXT.md (deferred)
- `RelatedPosts` fallback: if `relatedBlogPostsQuery` returns fewer than 2 results, fall back to `latestBlogPostsQuery`, then filter out the current post
- `PortableTextRenderer` is a server component — no "use client" needed as it's pure rendering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome CRLF line endings in package.json**
- **Found during:** Task 2 full Biome check
- **Issue:** `npm install` on Windows modified package.json to use CRLF line endings, failing Biome formatting check
- **Fix:** Ran `npx biome check --write package.json` to normalize line endings
- **Files modified:** package.json
- **Commit:** ad6377c (included in Task 1 commit)

## Issues Encountered

None beyond the CRLF package.json fix.

## User Setup Required

None — all changes are code-only, no external service configuration required.

## Next Phase Readiness

- Blog UI complete — BlogSection and blog detail route ready to use
- `src/app/page.tsx` still needs BlogSection wired up with `latestBlogPostsQuery` data fetch (will be done in plan 05-04 or as part of final homepage wiring)
- `TestimonialsSection` also needs to be wired into `page.tsx` (plan 05-02 component + plan 05-04 wiring)

## Self-Check: PASSED

All created files found on disk. All task commits verified in git log.

- FOUND: src/components/sections/BlogSection.tsx
- FOUND: src/components/blog/PortableTextRenderer.tsx
- FOUND: src/components/blog/RelatedPosts.tsx
- FOUND: src/app/blog/[slug]/page.tsx
- FOUND commit: ad6377c (feat(05-03): build BlogSection and PortableTextRenderer components)
- FOUND commit: 0847673 (feat(05-03): build blog detail page with breadcrumbs, related posts, static generation)

---
*Phase: 05-testimonials-blog*
*Completed: 2026-02-20*
