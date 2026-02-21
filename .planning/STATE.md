# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** Phase 8 context gathered — ready for planning

## Current Position

Phase: 8 of 8 (CMS Revalidation + Launch)
Plan: 1 of 4 complete (08-01: webhook revalidation + phone CTA dialog done)
Status: Phase 8 in progress — Plan 01 complete
Last activity: 2026-02-21 — Phase 8 Plan 01 complete (webhook revalidation endpoint + PhoneCallDialog)

Progress: [██████████] ~87% (Phase 8 in progress — 1/4 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 23 (01-01, 01-02, 02-01..02-05, 03-01..03-04, 04-01..04-03, 05-01, 05-02, 05-03, 05-04, 06-01, 06-02, 06-03, 06-04, 06-05)
- Average duration: 8 min
- Total execution time: ~2.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 35 min | 17 min |
| 02-content-architecture | 5 | 38 min | 8 min |
| 03-shell-static-sections | 4 | 19 min | 5 min |
| 04-services-lab-tests | 3 | 22 min | 7 min |
| 05-testimonials-blog | 4 | ~49 min | ~12 min |
| 06-seo-structured-data | 5 | ~55 min | ~11 min |

**Recent Trend:**
- Last 5 plans: 06-01 (3min), 06-02 (11min), 06-03 (8min), 06-04 (8min), 06-05 (~25min)
- Trend: Steady — 8-11min per pure build plan; ~25min when visual checkpoint + post-checkpoint refinements included

*Updated after each plan completion*
| Phase 05 P04 | ~30min | 2 tasks | 7 files |
| Phase 06 P01 | 3min | 2 tasks | 7 files |
| Phase 06 P04 | 8 | 2 tasks | 3 files |
| Phase 06 P03 | 8 | 2 tasks | 3 files |
| Phase 06-seo-structured-data P02 | 11 | 2 tasks | 3 files |
| Phase 06-seo-structured-data P05 | ~25min | 2 tasks | 9 files |
| Phase 07-animation-polish-performance P02 | 4 | 2 tasks | 3 files |
| Phase 07-animation-polish-performance P01 | 8 | 2 tasks | 8 files |
| Phase 07-animation-polish-performance P03 | 45 | 3 tasks | 7 files |
| Phase 08-cms-revalidation-launch P01 | 5 | 2 tasks | 6 files |
| Phase 08-cms-revalidation-launch P02 | 9 | 2 tasks | 7 files |

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
- [Phase 06]: JsonLd is a Server Component using dangerouslySetInnerHTML with biome-ignore — data is server-controlled JSON, no XSS risk
- [Phase 06]: Clinic details (address, hours, physician name) hardcoded with PLACEHOLDER comments — per CONTEXT.md, not stored in CMS
- [Phase 06]: BlogPosting author/publisher set to Organization (Morocz Medical) — solo practice clinic is the publisher
- [Phase 06-seo-structured-data]: layout.tsx generateMetadata fetches siteSettings independently (Next.js deduplicates); homepage uses title.absolute; blog og:type article with publishedTime; OG image cascade: ogImage > featuredImage > defaultOgImage; og:locale hu_HU on all pages
- [Phase 06-seo-structured-data]: Three-state NavState enum (default/hidden/compact) replaces scrolled boolean — enables hide-on-scroll-down, show-compact-glassmorphism-on-scroll-up pattern
- [Phase 06-seo-structured-data]: Compact header rendered as separate fixed <header> pill element (backdrop-blur-xl, bg-white/60) toggled via opacity/pointer-events — avoids single-element morphing complexity
- [Phase 06-seo-structured-data]: CTA label changed to "Időpontfoglalás" with arrow icon (shorter for compact nav, consistent across both header states)
- [Phase 06-seo-structured-data]: AnimatePresence mode='wait' with direction useRef for LabTests slide animation — direction updated synchronously before page setState to prevent stale reads
- [Phase 06-seo-structured-data]: aria-labelledby used on all section elements pointing to section h2 id — preferred over aria-label when visible heading exists (WCAG best practice)
- [Phase 07-animation-polish-performance]: IntroOverlay uses phase state machine driven by onAnimationComplete callbacks (not setTimeout) for animation sequencing
- [Phase 07-animation-polish-performance]: CircleWipeLink shouldWipe() heuristic: only /blog/ and /laborvizsgalatok/ prefixes trigger circle wipe animation
- [Phase 07-animation-polish-performance]: CHARACTERS pre-indexed as {pos,char}[] to avoid noArrayIndexKey Biome lint without suppression comments
- [Phase 07-01]: FadeIn uses Omit<HTMLMotionProps<div>, viewport> to avoid type conflict with motion built-in viewport prop
- [Phase 07-01]: HeroServiceCards stagger reduced 0.1->0.08s, delayChildren removed for scroll-triggered animation
- [Phase 07-01]: Footer converted from Server Component to Client Component to support FadeIn animation wrapper
- [Phase 07-animation-polish-performance]: CircleWipeLink triggers on ALL internal paths when pathname === '/' — homepage navigation uses circle wipe for all internal links, not just /blog/ and /laborvizsgalatok/ prefixes
- [Phase 07-animation-polish-performance]: IntroOverlay SSR-safe via null return during server render — direct import is correct, no next/dynamic ssr:false wrapper needed
- [Phase 07-animation-polish-performance]: Repeat-visit overlay returns null immediately — no fade animation, no overlay rendered at all on subsequent visits
- [Phase 08-cms-revalidation-launch]: SANITY_REVALIDATE_SECRET is server-only (no NEXT_PUBLIC_ prefix) — webhook secret must not be exposed to client
- [Phase 08-cms-revalidation-launch]: timingSafeEqual used for HMAC comparison to prevent timing attacks — both Buffers validated to equal length before comparison
- [Phase 08-cms-revalidation-launch]: Unrecognized Sanity _types return 200 (not 4xx) — Sanity sends internal document types; don't fail on unknown types
- [Phase 08-cms-revalidation-launch]: Backdrop in PhoneCallDialog implemented as <button> to satisfy Biome noStaticElementInteractions a11y rule
- [Phase 08-cms-revalidation-launch]: MobileMenu onPhoneClick callback from Header — dialog state lives in Header, shared across both header variants
- [Phase 08-cms-revalidation-launch]: draftMode() in sanityFetch wrapped in try-catch — Next.js throws outside request scope during generateStaticParams at build time; fallback isDraft=false is correct behavior
- [Phase 08-cms-revalidation-launch]: DraftModeIndicator placed outside MotionProvider in layout — fixed-position overlay independent of motion/animation context

### Pending Todos

None yet.

### Blockers/Concerns

- Google Maps embed GDPR status unresolved: iframe sets cookies; safe default is a static map image with a link to Google Maps (resolved in Phase 3 CONTEXT.md — no map at all, just text address)
- Motion v12 import path RESOLVED: confirmed 'motion/react' is correct (motion@12.34.2 installed)
- Contact form email provider unselected (Resend is community standard for Next.js — decide in Phase 7 planning)

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed Phase 8 Plan 01 — webhook revalidation + phone CTA dialog
Resume file: .planning/phases/08-cms-revalidation-launch/08-02-PLAN.md
