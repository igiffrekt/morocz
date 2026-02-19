# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** Phase 2 — Content Architecture

## Current Position

Phase: 3 of 8 (Shell + Static Sections)
Plan: 0 of TBD in current phase (Phase 2 fully complete)
Status: Ready — Phase 2 complete, Phase 3 planning not yet started
Last activity: 2026-02-19 — Plan 02-05 complete (Studio navigation verified, sanity-test page confirmed working end-to-end)

Progress: [█████░░░░░] ~50%

## Performance Metrics

**Velocity:**
- Total plans completed: 6 (01-01, 01-02, 02-01, 02-02, 02-03, 02-04)
- Average duration: 11 min
- Total execution time: 0.97 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 35 min | 17 min |
| 02-content-architecture | 5 | 38 min | 8 min |

**Recent Trend:**
- Last 5 plans: 02-01 (9min), 02-02 (3min), 02-03 (4min), 02-04 (12min), 02-05 (10min)
- Trend: Very fast — well-specified plans execute quickly

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- Google Maps embed GDPR status unresolved: iframe sets cookies; safe default is a static map image with a link to Google Maps (resolve in Phase 3 planning)
- Motion v12 import path RESOLVED: confirmed 'motion/react' is correct (motion@12.34.2 installed)
- Contact form email provider unselected (Resend is community standard for Next.js — decide in Phase 8 planning)

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 02-05-PLAN.md — Phase 2 content-architecture fully complete
Resume file: Begin Phase 3 (Shell + Static Sections) planning
