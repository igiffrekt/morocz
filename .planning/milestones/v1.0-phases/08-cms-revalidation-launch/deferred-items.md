# Deferred Items — Phase 08

## Pre-existing Build Failure (Out of Scope)

**Found during:** Task 1 verification
**Issue:** `npm run build` fails with `draftMode was called outside a request scope` error in `/laborvizsgalatok/[slug]/page.tsx`'s `generateStaticParams`.

**Root cause:** Pre-existing uncommitted changes to `src/sanity/lib/fetch.ts` added `draftMode()` call which cannot run during static param generation at build time. Also `src/components/ui/DraftModeIndicator.tsx` was added as draft mode infrastructure (likely from Phase 8 context session).

**Impact:** Build fails before my changes were applied — confirmed by stashing and re-running build.

**Proposed fix:** In `generateStaticParams`, use a dedicated `sanityStaticFetch` that bypasses draftMode(), or conditionally skip the draftMode check when `cache: 'no-store'` is not applicable.

**Owner:** Phase 08-02 or 08-03 (draft mode plan) should address this when wiring up the full draft mode infrastructure.
