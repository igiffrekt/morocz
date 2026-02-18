# Phase 2: Content Architecture - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Define all Sanity document types, embed Studio at `/studio`, generate TypeScript types via TypeGen, and centralize all GROQ queries — the complete data layer that editors use and front-end components consume. No front-end rendering beyond a test page confirming the data client works.

</domain>

<decisions>
## Implementation Decisions

### Studio navigation
- Group document types by page section in the sidebar: Homepage, Services, Blog, Settings
- Each group should be clearly labeled so a non-technical editor (doctor/staff) can find content without confusion

### Editor experience
- Primary editor is non-technical — the doctor or clinic staff
- All Studio labels, group names, field descriptions, and help text in Hungarian
- Rich previews in document lists: thumbnails + subtitles (e.g., service cards show icon + category, blog posts show featured image + excerpt)

### Homepage content structure
- Fixed section order matching the design template — no reordering, no page-builder pattern
- Section-level editability: headlines, paragraphs, card content are editable from Sanity
- Small UI labels (button text like "Book Consultation", badge labels like "15+ years") can be hardcoded in code
- Hero card colors (yellow, green, pink, blue) fixed in code — not editable from Sanity

### Image management
- All images served through Sanity CDN — doctor photo, service icons, lab test illustrations, blog images, logo
- No static image assets committed to the repo for content purposes
- Editor can swap any image at any time through the Studio

### Claude's Discretion
- Singleton vs. multi-document pattern for homepage sections (as long as sidebar grouping by page section is maintained)
- Field validation rules and character limits
- Portable Text block configuration for blog posts
- GROQ query structure and tag-based revalidation strategy
- TypeGen configuration details

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint is that the editor is non-technical and Hungarian-speaking, so the Studio must feel intuitive in their language.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-architecture*
*Context gathered: 2026-02-19*
