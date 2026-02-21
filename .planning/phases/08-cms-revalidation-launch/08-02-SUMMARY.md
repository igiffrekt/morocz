---
phase: 08-cms-revalidation-launch
plan: 02
subsystem: ui, api
tags: [next-js, draft-mode, sanity, preview, 404, server-components]

# Dependency graph
requires:
  - phase: 08-cms-revalidation-launch
    provides: SANITY_API_TOKEN and revalidate infrastructure from plan 01
provides:
  - Draft mode enable/disable API routes with secret validation
  - DraftModeIndicator server component for visual feedback
  - sanityFetch CDN bypass with previewDrafts perspective in draft mode
  - Branded 404 page in Hungarian with site layout inheritance
affects: [future-content-editing, editor-preview-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "draftMode() wrapped in try-catch to safely handle build-time calls outside request scope"
    - "Draft client created inline via client.withConfig() — no separate client export needed"
    - "Not-found page exported metadata alongside default component export"

key-files:
  created:
    - src/app/api/draft/route.ts
    - src/app/api/disable-draft/route.ts
    - src/components/ui/DraftModeIndicator.tsx
    - src/app/not-found.tsx
  modified:
    - src/sanity/lib/fetch.ts
    - src/app/layout.tsx
    - .env.example

key-decisions:
  - "draftMode() call in sanityFetch wrapped in try-catch — Next.js throws when called outside request scope (e.g. generateStaticParams at build time); fallback is isDraft=false which is correct behavior"
  - "DraftModeIndicator placed outside MotionProvider in layout — it's a fixed-position element independent of the motion/animation context"
  - "disable-draft route requires no secret — disabling preview is inherently safe, only enabling requires authentication"

patterns-established:
  - "try-catch draftMode pattern: any server function calling draftMode() should handle the build-time throw gracefully"

requirements-completed: [LAUNCH-04]

# Metrics
duration: 9min
completed: 2026-02-21
---

# Phase 8 Plan 02: Draft Mode + 404 Page Summary

**Next.js draftMode preview system with SANITY_PREVIEW_SECRET validation, CDN bypass, Hungarian visual indicator, and branded 404 page**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-21T21:27:53Z
- **Completed:** 2026-02-21T21:36:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Draft mode enable route (`/api/draft`) with `SANITY_PREVIEW_SECRET` validation — returns 401 on mismatch, enables draftMode cookie and redirects on match
- Draft mode disable route (`/api/disable-draft`) — clears draftMode and redirects (no secret needed)
- `DraftModeIndicator` server component — fixed bottom bar showing "Elonezet mod aktiv" with "Kilepas" button when draft mode is active
- `sanityFetch` updated to detect draft mode: uses `perspective: 'previewDrafts'`, `useCdn: false`, `revalidate: 0` when active; normal CDN + tag behavior otherwise
- Branded 404 page with large decorative 404, Hungarian messaging, and CTA back to homepage with arrow icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Draft mode routes, indicator, sanityFetch CDN bypass** - `4bf9e1c` (feat)
2. **Task 2: Branded 404 page in Hungarian** - `4338809` (feat)

## Files Created/Modified

- `src/app/api/draft/route.ts` - Draft mode enable endpoint with SANITY_PREVIEW_SECRET validation
- `src/app/api/disable-draft/route.ts` - Draft mode disable endpoint
- `src/components/ui/DraftModeIndicator.tsx` - Visual indicator server component (fixed bottom bar)
- `src/sanity/lib/fetch.ts` - Updated to detect and handle draft mode with CDN bypass + previewDrafts
- `src/app/layout.tsx` - Added DraftModeIndicator import and render
- `src/app/not-found.tsx` - Branded Hungarian 404 page with decorative number + CTA
- `.env.example` - Added SANITY_REVALIDATE_SECRET and SANITY_PREVIEW_SECRET entries

## Decisions Made

- `draftMode()` call in `sanityFetch` wrapped in try-catch — Next.js 15 throws `draftMode was called outside a request scope` during `generateStaticParams` at build time. The try-catch ensures build-time calls fall back to `isDraft=false`, which is the correct behavior (no draft content during static generation).
- `DraftModeIndicator` placed outside `<MotionProvider>` in layout — it's a fixed-position overlay independent of the motion/animation context tree.
- `disable-draft` route requires no secret validation — disabling preview is inherently safe (any user can exit draft mode).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing build failure caused by draftMode() outside request scope**

- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** The pre-existing `deferred-items.md` noted that the build was already failing with `draftMode was called outside a request scope` when `sanityFetch` was called from `generateStaticParams` at build time. This was documented as a known pre-existing issue from a prior context session.
- **Fix:** Wrapped the `draftMode()` call in a try-catch block in `sanityFetch`. Build-time calls (outside request scope) throw an error — caught and treated as `isDraft=false`.
- **Files modified:** `src/sanity/lib/fetch.ts`
- **Verification:** `npm run build` now succeeds with all routes compiled.
- **Committed in:** `4bf9e1c` (Task 1 commit)

**2. [Rule 1 - Formatting] Fixed biome formatting errors in new files**

- **Found during:** Task 1 biome check
- **Issue:** `NextResponse.json()` call had multi-line args style that biome wanted single-line; import order in fetch.ts needed reordering.
- **Fix:** Applied biome-compliant formatting to all new files.
- **Files modified:** `src/app/api/draft/route.ts`, `src/sanity/lib/fetch.ts`
- **Committed in:** `4bf9e1c` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 formatting)
**Impact on plan:** Bug fix resolved pre-existing build failure. Formatting fixes cosmetic. No scope creep.

## Issues Encountered

- File writes using the Write tool were intermittently reverted by a git CRLF/LF auto-conversion mechanism combined with a failed `git stash pop`. Resolved by using bash `cat > file << 'EOF'` heredoc writes which preserve LF line endings that biome expects.

## User Setup Required

Add the following to your `.env.local`:

```bash
# Required for draft mode preview
SANITY_PREVIEW_SECRET=your-random-secret-here
# Required for reading draft documents (viewer role token)
SANITY_API_TOKEN=your-sanity-api-token
```

Share `SANITY_PREVIEW_SECRET` with editors. Preview URL pattern: `/api/draft?secret=YOUR_SECRET`.

## Next Phase Readiness

- Draft mode fully wired: enable, disable, visual indicator, CDN bypass
- 404 page complete with Hungarian branding
- Build passing — all routes compiling correctly
- Ready for Phase 08-03: CMS revalidation webhook testing or deployment configuration

---
*Phase: 08-cms-revalidation-launch*
*Completed: 2026-02-21*

## Self-Check: PASSED

- FOUND: src/app/api/draft/route.ts
- FOUND: src/app/api/disable-draft/route.ts
- FOUND: src/components/ui/DraftModeIndicator.tsx
- FOUND: src/app/not-found.tsx
- FOUND: commit 4bf9e1c (Task 1)
- FOUND: commit 4338809 (Task 2)
