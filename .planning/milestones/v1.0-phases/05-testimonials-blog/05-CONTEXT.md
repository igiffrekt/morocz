# Phase 5: Testimonials + Blog - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

A visitor can read patient testimonials by sliding through a carousel and can browse blog posts on the homepage — blog post detail pages render full Portable Text content at `/blog/[slug]` and are statically generated. No separate blog listing page; the homepage blog section shows the latest 3 posts with a scroll anchor link.

</domain>

<decisions>
## Implementation Decisions

### Carousel behavior
- Manual navigation only — no auto-play
- Swipe gestures + dot indicators on mobile
- One testimonial visible at a time (full-width)
- Fade crossfade transition between entries
- Keyboard accessible (arrow keys or equivalent controls)

### Blog listing layout (homepage section)
- Show 3 most recent blog posts — no category filter tabs
- Each card displays: featured image, title, and excerpt
- "Read All Blogs" link is a scroll anchor to the blog section on the homepage, not a separate page
- No category tags shown on cards

### Blog post detail page
- Single centered column layout (like Medium) — no sidebar
- Breadcrumb trail at top: Home > Blog > Post Title
- No author attribution or publish date displayed
- 2-3 related posts from the same category shown at bottom of the article
- Full Portable Text rendering for body content
- Statically generated at build time via `generateStaticParams`

### Testimonial presentation
- Teal/green background section matching the design reference
- No stat counters — just testimonials
- Each testimonial shows: patient photo (avatar), name, and quote text
- Placeholder shown if no photo is uploaded (photo is optional in Sanity schema)
- Section heading only (no subtext), matching the design reference
- Dot navigation at bottom of carousel

### Claude's Discretion
- Exact teal/green color value for testimonial background
- Quote formatting (quotation marks, italic styling)
- Blog card grid arrangement and responsive breakpoints
- Related posts selection logic (same category, fallback to recent)
- Placeholder avatar design when no photo uploaded
- Portable Text component styling (headings, lists, images, code blocks)
- Breadcrumb visual styling

</decisions>

<specifics>
## Specific Ideas

- Testimonial section background matches the teal/green from the design reference screenshot
- Blog cards should show large featured images — visual-heavy, not text-heavy
- Keep the blog post page minimal: title + content + related posts, nothing else

</specifics>

<deferred>
## Deferred Ideas

- Blog category filtering — could be added to a dedicated /blog listing page in a future phase
- Blog post author/date display — schema supports it, not shown for now

</deferred>

---

*Phase: 05-testimonials-blog*
*Context gathered: 2026-02-20*
