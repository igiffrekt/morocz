# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** Phase 2 — Content Architecture

## Current Position

Phase: 2 of 8 (Content Architecture)
Plan: 1 of 5 complete in current phase (02-01 complete)
Status: In progress — Plan 02-01 executed (Sanity CMS foundation)
Last activity: 2026-02-19 — Plan 02-01 executed (Sanity Studio at /studio, sanityFetch wrapper, client, image helper)

Progress: [██░░░░░░░░] ~20%

## Performance Metrics

**Velocity:**
- Total plans completed: 3 (01-01, 01-02, 02-01)
- Average duration: 15 min
- Total execution time: 0.72 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 35 min | 17 min |
| 02-content-architecture | 1 | 9 min | 9 min |

**Recent Trend:**
- Last 5 plans: 01-01 (15min), 01-02 (20min), 02-01 (9min)
- Trend: Fast — CMS setup was quick due to well-specified plan

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

### Pending Todos

None yet.

### Blockers/Concerns

- Google Maps embed GDPR status unresolved: iframe sets cookies; safe default is a static map image with a link to Google Maps (resolve in Phase 3 planning)
- Motion v12 import path RESOLVED: confirmed 'motion/react' is correct (motion@12.34.2 installed)
- Contact form email provider unselected (Resend is community standard for Next.js — decide in Phase 8 planning)

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 02-01-PLAN.md (Sanity CMS foundation)
Resume file: .planning/phases/02-content-architecture/02-02-PLAN.md
