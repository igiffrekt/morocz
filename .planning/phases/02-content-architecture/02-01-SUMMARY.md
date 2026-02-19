---
phase: 02-content-architecture
plan: "01"
subsystem: cms
tags: [sanity, next-sanity, groq, cms, studio, image-url]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js 15 App Router project with TypeScript, Tailwind v4, Biome linting

provides:
  - Sanity Studio embedded at /studio route via NextStudio (next-sanity v11)
  - sanityFetch<T>() wrapper with tag-based revalidation (on-demand or 60s fallback)
  - urlFor() image URL builder for Sanity image assets
  - Sanity client (createClient) reading from env vars
  - Empty schemaTypes array ready for Plan 02-02 schema definitions
  - src/sanity/lib/live.ts placeholder for Phase 8 real-time preview

affects:
  - 02-content-architecture (all remaining plans use sanityFetch and schemaTypes)
  - 03-homepage-sections (fetches content via sanityFetch)
  - 04-services-filter (fetches services content via sanityFetch)
  - 08-admin-cms (adds real-time preview via Sanity Live)

# Tech tracking
tech-stack:
  added:
    - sanity@4.22.0 (CMS platform — v4 used because next-sanity@11 is the latest Next.js 15 compatible version)
    - next-sanity@11.6.12 (Next.js 15 compatible wrapper — v12 requires Next.js 16)
    - "@sanity/image-url@latest (image URL builder)"
    - "@sanity/vision@4.22.0 (GROQ query explorer — v4 used for React 19.0.x compatibility)"
  patterns:
    - "sanityFetch<T>({ query, params, tags }) — single data-fetching interface for all Server Components"
    - "Tag-based revalidation: tags provided = on-demand only; no tags = 60s ISR fallback"
    - "All Sanity env vars centralized in src/sanity/env.ts via assertValue helper"
    - "Studio at /studio as Client Component catch-all route [[...tool]]"

key-files:
  created:
    - src/sanity/env.ts
    - src/sanity/schemaTypes/index.ts
    - src/sanity/lib/client.ts
    - src/sanity/lib/fetch.ts
    - src/sanity/lib/image.ts
    - src/sanity/lib/live.ts
    - sanity.config.ts
    - sanity.cli.ts
    - src/app/studio/[[...tool]]/page.tsx
  modified:
    - package.json (added sanity, next-sanity, @sanity/image-url, @sanity/vision)
    - .env.example (added Sanity env vars with API version)
    - .vscode/settings.json (fixed deprecated quickfix.biome action)

key-decisions:
  - "Used sanity@4.22.0 + next-sanity@11.6.12 instead of sanity@5 + next-sanity@12 because next-sanity@12 requires Next.js 16 (not yet used in project)"
  - "Used @sanity/vision@4.22.0 instead of @5 because vision@5.x requires react@^19.2.2 (project uses react@19.0.x) — v4 supports react@^18 || ^19.0.0"
  - "SanityImageSource imported from @sanity/image-url directly (not from non-existent /lib/types/types sub-path)"
  - "revalidate: false when tags provided (on-demand only), 60s fallback when no tags — Phase 8 webhook will call revalidateTag()"

patterns-established:
  - "sanityFetch pattern: Server Components call sanityFetch<TypeName>({ query, tags: ['tag-name'] }) — never call client.fetch directly"
  - "env.ts pattern: all env vars centralized with assertValue — throws at startup if missing (fast fail)"
  - "Studio route: catch-all [[...tool]] with 'use client' directive — required for all Studio sub-routes"

requirements-completed: [CMS-01, CMS-11]

# Metrics
duration: 9min
completed: 2026-02-19
---

# Phase 02 Plan 01: Sanity CMS Foundation Summary

**Sanity Studio embedded at /studio with sanityFetch<T>() tag-based revalidation wrapper, urlFor() image helper, and configured Sanity client — all using sanity@4.22.0 + next-sanity@11.6.12 compatible with Next.js 15**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-19T12:14:50Z
- **Completed:** 2026-02-19T12:23:44Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Sanity CMS infrastructure fully installed and configured (sanity v4, next-sanity v11, @sanity/image-url, @sanity/vision)
- Sanity Studio embedded at `/studio` as a Next.js catch-all Client Component route
- `sanityFetch<T>()` wrapper established as the single data-fetching interface with tag-based on-demand revalidation
- `urlFor()` image URL builder ready for all Sanity image asset rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Sanity v5 and next-sanity, create project configuration and Studio route** - `e187c62` (feat)
2. **Task 2: Create Sanity client and sanityFetch wrapper with tag-based revalidation** - `bce625b` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/sanity/env.ts` - Centralized env var access with assertValue fast-fail helper
- `src/sanity/schemaTypes/index.ts` - Empty SchemaTypeDefinition[] array, ready for Plan 02-02 schemas
- `src/sanity/lib/client.ts` - Sanity createClient reading projectId/dataset/apiVersion from env
- `src/sanity/lib/fetch.ts` - sanityFetch<T>() with tag-based revalidation strategy
- `src/sanity/lib/image.ts` - urlFor() image URL builder using @sanity/image-url
- `src/sanity/lib/live.ts` - Placeholder re-export for Phase 8 Sanity Live real-time preview
- `sanity.config.ts` - Studio config: Morocz Medical title, structureTool + visionTool plugins
- `sanity.cli.ts` - CLI config reading env vars for project/dataset
- `src/app/studio/[[...tool]]/page.tsx` - NextStudio Client Component catch-all route
- `package.json` - Added sanity, next-sanity, @sanity/image-url, @sanity/vision
- `.env.example` - Added NEXT_PUBLIC_SANITY_PROJECT_ID, DATASET, API_VERSION, SANITY_API_TOKEN
- `.vscode/settings.json` - Fixed deprecated quickfix.biome action to source.fixAll.biome

## Decisions Made

- Used `sanity@4.22.0` + `next-sanity@11.6.12` instead of sanity v5 + next-sanity v12 because next-sanity@12 requires Next.js 16 (project runs Next.js 15.5.12). These are API-compatible for all use cases in this project.
- Used `@sanity/vision@4.22.0` instead of v5.x because vision v5+ requires react@^19.2.2 but the project uses react@19.0.x; v4 supports react@^18 || ^19.0.0.
- `SanityImageSource` imported from `@sanity/image-url` directly (not from an internal `/lib/types/types` sub-path that doesn't exist in this package version).
- Revalidation strategy: tags present = `revalidate: false` (on-demand only via webhooks in Phase 8); no tags = `revalidate: 60` (60-second ISR fallback).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] next-sanity@12 incompatible with Next.js 15**
- **Found during:** Task 1 (package installation)
- **Issue:** `next-sanity@12.1.0` peer requires `next@^16.0.0-0`; project uses `next@15.5.12`
- **Fix:** Installed `next-sanity@11.6.12` (latest Next.js 15 compatible release) with `sanity@4.22.0`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm run build` passes; Studio route compiles
- **Committed in:** e187c62 (Task 1 commit)

**2. [Rule 1 - Bug] @sanity/vision@5 uses React 19.2.2 experimental API**
- **Found during:** Task 1 (build verification)
- **Issue:** `@sanity/vision@5.10.0` imports `useEffectEvent` from React which requires react@^19.2.2; project has react@19.0.x
- **Fix:** Installed `@sanity/vision@4.22.0` which supports react@^18 || ^19.0.0
- **Files modified:** package.json, package-lock.json
- **Verification:** `npm run build` passes cleanly
- **Committed in:** e187c62 (Task 1 commit)

**3. [Rule 1 - Bug] SanityImageSource import path incorrect**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** Plan used `@sanity/image-url/lib/types/types` sub-path import which doesn't exist; type is exported from the main package entry
- **Fix:** Changed import to `from "@sanity/image-url"` directly
- **Files modified:** src/sanity/lib/image.ts
- **Verification:** `npx tsc --noEmit` passes with no errors
- **Committed in:** bce625b (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All fixes were necessary due to version incompatibilities and incorrect import paths in plan template. API surface and architecture are identical to what the plan specified.

## Issues Encountered

- Biome formatting (single quotes vs double quotes, tabs vs spaces) required auto-fix pass after file creation — resolved with `npx biome check --write` on all new files.

## User Setup Required

**External services require manual configuration.**

The user already has Sanity credentials in `.env.local`. To connect to a Sanity project:

1. Go to sanity.io/manage
2. Create or select a project
3. Copy the **Project ID** from the overview page
4. Set `NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>` in `.env.local`
5. Set `NEXT_PUBLIC_SANITY_DATASET=production` (or your dataset name)
6. Get an API token: API tab → Tokens → Add API token (Editor role)
7. Set `SANITY_API_TOKEN=<your-token>` in `.env.local`

Verify: Visit `http://localhost:3000/studio` — Studio should load.

## Next Phase Readiness

- Sanity client and Studio fully configured; ready for Plan 02-02 schema definitions
- `sanityFetch<T>()` wrapper ready for GROQ queries in Plan 02-05
- `schemaTypes` array in `src/sanity/schemaTypes/index.ts` ready to receive schema definitions
- All data-fetching infrastructure in place; no blockers for 02-02

---
*Phase: 02-content-architecture*
*Completed: 2026-02-19*
