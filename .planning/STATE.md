# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** Phase 5 in progress — data layer complete, building UI components

## Current Position

Phase: 6 of 8 (SEO + Structured Data) — IN PROGRESS
Plan: 4 of 4 in current phase (4 complete)
Status: In progress — Plans 01-04 done; privacy policy page, cookie notice, SEO metadata, JSON-LD structured data complete
Last activity: 2026-02-20 — Phase 6 Plan 04 complete (privacy policy page + cookie notice)

Progress: [█████████░] ~92%

## Performance Metrics

**Velocity:**
- Total plans completed: 18 (01-01, 01-02, 02-01..02-05, 03-01..03-04, 04-01..04-03, 05-01, 05-02, 05-03, 05-04)
- Average duration: 7 min
- Total execution time: ~2.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 35 min | 17 min |
| 02-content-architecture | 5 | 38 min | 8 min |
| 03-shell-static-sections | 4 | 19 min | 5 min |
| 04-services-lab-tests | 3 | 22 min | 7 min |
| 05-testimonials-blog | 4 | ~49 min | ~12 min |

**Recent Trend:**
- Last 5 plans: 04-03 (12min), 05-01 (8min), 05-02 (4min), 05-03 (7min), 05-04 (~30min)
- Trend: Steady — 7-8min per pure build plan; ~30min when visual refinement is included

*Updated after each plan completion*
| Phase 05 P04 | ~30min | 2 tasks | 7 files |
| Phase 06 P01 | 3min | 2 tasks | 7 files |
| Phase 06 P04 | 8 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack is non-negotiable: Next.js 16 App Router + Tailwind v4 + Sanity v5 + Motion v12 + Vercel
- AnimatePresence must NOT be used for inter-page transitions (App Router incompatibility — use enter-only animations via template.js)
- All Sanity data fetching stays in Server Components (page.tsx / layout.tsx) — section components never call Sanity directly
- Phase 4 (Services animated filter) needs careful CLS validation — use `layout="position"` only, not `layout={true}`
- Next.js 15.5.12 used (Next.js 16 not yet released; App Router architecture is equivalent)
- Tailwind v4 CSS-first: all tokens in @theme block in globals.css — no tailwind.config.ts needed
- Font via next/font/google exported from src/lib/fonts.ts, applied as CSS variable on html element
- home_design/, animations/, home.zip, *.mp4 added to .gitignore (reference-only, not deployed)
- Motion v12 import path is 'motion/react' (confirmed via package.json exports inspection)
- Biome v2.4.2 CSS linting disabled — Tailwind @theme/@apply not supported by Biome CSS parser
- Biome v2 config: organizeImports in assist block, files.includes with negation (not files.ignore)
- Used sanity@4.22.0 + next-sanity@11.6.12 (not sanity v5 + next-sanity v12) — next-sanity@12 requires Next.js 16 which isn't used yet
- @sanity/vision@4.22.0 used (not v5.x) — vision@5 requires react@^19.2.2; project uses react@19.0.x
- sanityFetch<T>() is the single data-fetching interface: tags present = on-demand revalidation; no tags = 60s ISR fallback
- SanityImageSource imported from "@sanity/image-url" directly (no sub-path exports for types in this version)
- Singleton pattern via fixed documentId in desk structure (no __experimental_actions needed in Sanity v4)
- Service card colors hardcoded in code, not in schema (locked decision)
- Desk structure co-located at src/sanity/desk/structure.ts, imported into sanity.config.ts
- serviceType references serviceCategoryType; category.name dereferenced in list preview via select+prepare
- [Phase 02-content-architecture]: Biome formatting applied globally to satisfy npx biome check verification; Plan 02-02 tab indentation corrected to 2-space
- [Phase 02-content-architecture]: index.ts merge handled by Plan 02-02 parallel execution — all 8 types present when 02-03 Task 2 ran
- [Phase 02-content-architecture]: sanity schema extract fails in Sanity v4 (React not defined in Node.js context due to styled-components) — types authored manually from schema definitions; functionally equivalent to TypeGen output
- [Phase 02-content-architecture]: defineQuery() imported from next-sanity (re-exported from groq package) — standard pattern for sanity@4 + next-sanity@11
- [Phase 02-content-architecture]: All GROQ queries dereference references inline (category->{...}) so UI components receive flat data without client-side joins
- [Phase 02-content-architecture]: sanityFetch<T>() requires explicit generic type parameters when TypeGen overloads absent (hand-authored types) — use SiteSettings | null, ServiceCategory[] etc.
- [Phase 02-content-architecture]: CORS origin for localhost:3000 must be added to Sanity project settings for dev server data fetching to work
- [Phase 03-shell-static-sections]: CSS transitions used for scroll-shrink and hamburger animation — not Motion library (simpler, no overhead for non-motion-system interactions)
- [Phase 03-shell-static-sections]: MobileMenu rendered inside Header element so dropdown is in document flow, pushing page content down (not an overlay)
- [Phase 03-shell-static-sections]: Dynamic spacer div below fixed header switches height with scroll state to maintain layout continuity
- [Phase 03-shell-static-sections]: Social icons use type-narrowing predicate filter (not non-null assertions) — satisfies Biome lint while preserving CMS-driven rendering pattern
- [Phase 03-shell-static-sections]: Footer logo-on-pink uses min-h-[160px] contained block within the 4-column grid (not a full-width band)
- [Phase 03-shell-static-sections]: Array index key accepted for HeroHeadline letter-by-letter animation — text is static CMS content, chars never reorder; biome-ignore suppression with justification used
- [Phase 03-shell-static-sections]: next/image required (not <img>) in all section components — biome noImgElement rule enforced project-wide for LCP optimization
- [Phase 03-shell-static-sections]: Header logo link: bare <a href="/"> replaced with next/link <Link> to satisfy Next.js ESLint no-html-link-for-pages rule
- [Phase 04-services-lab-tests]: Used /laborvizsgalatok as href placeholder instead of href='#' — Biome useValidAnchor rule requires real URL path
- [Phase 04-services-lab-tests]: Lab test cards show fixed price only — no discount, no originalPrice, no 'from' prefix (locked CONTEXT.md decision)
- [Phase 04-services-lab-tests]: layout='position' used (not layout=true) to animate card transforms only, preventing CLS during category filter switches
- [Phase 04-services-lab-tests]: AnimatePresence mode='popLayout' used so exiting cards animate out before entering cards animate in
- [Phase 04-services-lab-tests]: LabTestsSection background changed to #0d112f per user request (overrides CONTEXT.md #242a5f)
- [Phase 04-services-lab-tests]: Card pastel colors randomized using hashId() on _id for deterministic SSR-safe randomization
- [Phase 04-services-lab-tests]: Promise.all used for 5 parallel Sanity queries in page.tsx (homepage, settings, categories, services, labTests)
- [Phase 04-services-lab-tests]: Design token primary color tuned to #242a5f; card palette adjusted for better visual contrast
- [Phase 04-services-lab-tests]: Hungarian diacriticals added to all Sanity schema titles/descriptions (Kezdolap → Kezdőlap, etc.)
- [Phase 05-testimonials-blog]: latestBlogPostsQuery projects no category field — per CONTEXT.md, no category tags on homepage blog cards
- [Phase 05-testimonials-blog]: relatedBlogPostsQuery caller falls back to latestBlogPostsQuery when category is null (documented in code comment)
- [Phase 05-testimonials-blog]: BlogPostDetailResult typed separately from BlogPost document type to reflect dereferenced category object shape
- [Phase 05-testimonials-blog]: fieldset used as carousel keyboard container — Biome useSemanticElements requires semantic element for role='group'
- [Phase 05-testimonials-blog]: bg-accent (#99CEB7 teal/green) used for TestimonialsSection background — matches existing design token
- [Phase 05-testimonials-blog]: BlogSection uses href='#blog' for scroll anchor (no separate /blog listing page — CONTEXT.md locked)
- [Phase 05-testimonials-blog]: relatedBlogPostsQuery fallback: if < 2 results, fall back to latestBlogPostsQuery, filter out current post
- [Phase 05-testimonials-blog]: PortableTextRenderer is a server component — no 'use client' needed for pure Portable Text rendering
- [Phase 05-testimonials-blog]: Promise.all expanded from 5 to 7 queries; testimonials and latestPosts added as parallel fetches in page.tsx
- [Phase 05-testimonials-blog]: latestBlogPostsQuery updated to include category field — needed for redesigned BlogSection category tags
- [Phase 05-testimonials-blog]: BlogSection redesigned to 40/60 two-card layout with accent right card (bg-accent) — user-approved during visual verification
- [Phase 05-testimonials-blog]: TestimonialsSection redesigned to horizontal card (photo+name | separator | quote) with pill dot navigation
- [Phase 05-testimonials-blog]: LabTestsSection converted to paginated 3x3 grid with dot navigation and drag/swipe — replaces animated category-filter
- [Phase 05-testimonials-blog]: Page background changed to white in globals.css
- [Phase 06-seo-structured-data]: privacyPolicy body field uses identical Portable Text config as blogPostType — consistent content editing experience
- [Phase 06-seo-structured-data]: defaultOgImage in siteSettings is site-level fallback; ogImage in homepage allows page-specific override
- [Phase 06-seo-structured-data]: SEO fields pattern for page schemas: metaDescription (text, rows:2) + ogImage (image) — reuse for future page types
- [Phase 06]: CookieNotice initialized dismissed=true with useEffect localStorage check — prevents SSR hydration flash of cookie notice

### Pending Todos

None yet.

### Blockers/Concerns

- Google Maps embed GDPR status unresolved: iframe sets cookies; safe default is a static map image with a link to Google Maps (resolved in Phase 3 CONTEXT.md — no map at all, just text address)
- Motion v12 import path RESOLVED: confirmed 'motion/react' is correct (motion@12.34.2 installed)
- Contact form email provider unselected (Resend is community standard for Next.js — decide in Phase 8 planning)

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 06-04-PLAN.md — Privacy policy page and cookie notice complete; Phase 6 all plans done
Resume file: .planning/phases/07-contact-form/07-01-PLAN.md
