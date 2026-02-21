---
phase: 08-cms-revalidation-launch
plan: 03
subsystem: ui, analytics
tags: [next-js, google-analytics, gdpr, cookie-consent, ga4]

# Dependency graph
requires:
  - phase: 08-cms-revalidation-launch
    provides: CookieNotice component with localStorage consent tracking (plan 01/02)
provides:
  - GoogleAnalytics client component with GDPR-aware consent gate
  - Custom event bridge between CookieNotice and GA initialization
  - NEXT_PUBLIC_GA_ID env var pattern for optional GA4 inclusion
  - Human-verified end-to-end editorial workflow (all 6 test scenarios passed)
affects: [future-analytics, gdpr-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GA4 loaded dynamically via DOM script injection (not next/script) to respect consent timing"
    - "Custom event 'cookie-consent-granted' bridges CookieNotice dismissal to GA initialization"
    - "localStorage 'cookie-notice-dismissed' === 'true' as consent signal for returning visitors"
    - "NEXT_PUBLIC_GA_ID env var guards GA render — missing = no GA component rendered at all"

key-files:
  created:
    - src/components/ui/GoogleAnalytics.tsx
  modified:
    - src/components/ui/CookieNotice.tsx
    - src/components/ui/PhoneCallDialog.tsx
    - src/components/ui/DraftModeIndicator.tsx
    - src/app/layout.tsx
    - .env.example

key-decisions:
  - "GA scripts injected via DOM createElement (not next/script) to allow dynamic load after consent event"
  - "Deduplication guard via document.getElementById('ga-script') prevents double injection on re-renders"
  - "GoogleAnalytics placed outside MotionProvider in body — analytics infrastructure independent of motion context"
  - "PhoneCallDialog text updated to 'Valóban hívni szeretné a Mórocz Medical rendelőt?' — clearer Hungarian phrasing verified by user"
  - "DraftModeIndicator 'Kilépés' uses anchor tag (not next/link) for proper route handler navigation to /api/disable-draft"

patterns-established:
  - "Consent-gated analytics pattern: useEffect reads localStorage on mount, event listener handles same-session grants"

requirements-completed: [LAUNCH-02, LAUNCH-03]

# Metrics
duration: 15min
completed: 2026-02-21
---

# Phase 8 Plan 03: GA4 Analytics + End-to-End Verification Summary

**GDPR-aware GA4 integration via consent-gated script injection with custom event bridge, plus human-verified end-to-end editorial workflow covering all 6 test scenarios**

## Performance

- **Duration:** 15 min (including human-verify checkpoint)
- **Started:** 2026-02-21T21:41:18Z
- **Completed:** 2026-02-21T22:45:00Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 6

## Accomplishments

- `GoogleAnalytics` client component that checks consent before loading gtag.js
- Returning visitors: GA loads immediately from `localStorage.getItem('cookie-notice-dismissed') === 'true'`
- New visitors: GA loads on `'cookie-consent-granted'` custom event fired by CookieNotice.handleDismiss
- Deduplication guard prevents double script injection (`document.getElementById('ga-script')`)
- `NEXT_PUBLIC_GA_ID` env var gates the entire feature — missing or undefined = no GA component rendered
- `.env.example` documents `NEXT_PUBLIC_GA_ID` with `# Google Analytics 4 measurement ID (G-XXXXXXXXXX)` comment
- All 6 human-verify test scenarios passed: webhook security (401 on invalid sig), phone CTA dialog, draft mode enable/disable, branded 404 page, edit-to-publish revalidation, GA4 consent gating

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GA4 script with cookie consent integration** - `30389c2` (feat)
2. **Task 2: Verify end-to-end editorial workflow** - human-verify checkpoint, approved by user

**Plan metadata:** `d08e566` (docs: complete GA4 analytics plan)

## Files Created/Modified

- `src/components/ui/GoogleAnalytics.tsx` - Client component: checks consent, injects gtag.js on consent grant
- `src/components/ui/CookieNotice.tsx` - Added `window.dispatchEvent(new Event('cookie-consent-granted'))` in handleDismiss
- `src/components/ui/PhoneCallDialog.tsx` - Dialog text updated to "Valóban hívni szeretné a Mórocz Medical rendelőt?" (clearer Hungarian)
- `src/components/ui/DraftModeIndicator.tsx` - "Kilépés" changed from Next.js Link to anchor tag for proper route handler navigation
- `src/app/layout.tsx` - Imported GoogleAnalytics, renders conditionally on NEXT_PUBLIC_GA_ID
- `.env.example` - Added `NEXT_PUBLIC_GA_ID=` with comment

## Decisions Made

- GA scripts injected via `document.createElement('script')` rather than `next/script` — allows dynamic injection at arbitrary time post-consent rather than page load
- Deduplication via `document.getElementById('ga-script')` — component may re-render but GA should only load once
- `GoogleAnalytics` rendered outside `MotionProvider` block (after `DraftModeIndicator`) — analytics is infrastructure, independent of animation context
- PhoneCallDialog text updated during testing to be clearer and more natural Hungarian: "Valóban hívni szeretné a Mórocz Medical rendelőt?"
- DraftModeIndicator "Kilépés" uses `<a>` tag (not `next/link`) — Next.js Link intercepts navigation as client-side routing, preventing the route handler from executing; anchor tag forces a full navigation request

## Deviations from Plan

### Fixes Applied During Testing (by orchestrator)

**1. [Rule 1 - Bug] PhoneCallDialog text updated to clearer Hungarian phrasing**
- **Found during:** Task 2 (end-to-end verification)
- **Issue:** Dialog heading "Hívja Dr. Mórocz Angelát?" was deemed less clear than desired during user testing
- **Fix:** Updated to "Valóban hívni szeretné a Mórocz Medical rendelőt?" — more natural confirmation phrasing
- **Files modified:** src/components/ui/PhoneCallDialog.tsx
- **Verification:** User confirmed correct text during Task 2 checkpoint approval

**2. [Rule 1 - Bug] DraftModeIndicator "Kilépés" link changed from Next.js Link to anchor tag**
- **Found during:** Task 2 (draft mode verification)
- **Issue:** Next.js `<Link>` component intercepts `/api/disable-draft` as a client-side route, preventing the disable-draft route handler from executing properly
- **Fix:** Changed to `<a href="/api/disable-draft">` to force a full HTTP request to the route handler
- **Files modified:** src/components/ui/DraftModeIndicator.tsx
- **Verification:** User confirmed draft mode enable/disable works correctly during Task 2 checkpoint approval

---

**Total deviations:** 2 (both bug fixes for correctness, applied by orchestrator during testing)
**Impact on plan:** Both fixes necessary for correct behavior. No scope creep.

## Issues Encountered

None during Task 1 implementation. Two behavioral bugs discovered during Task 2 human verification and fixed before checkpoint approval.

## User Setup Required

**External services require manual configuration:**

### Vercel Environment Variables
Set in Vercel Dashboard -> Project -> Settings -> Environment Variables:
- `SANITY_REVALIDATE_SECRET` — Same value as local .env (random string)
- `SANITY_PREVIEW_SECRET` — Another random string for draft mode
- `SANITY_API_TOKEN` — Sanity Manage -> API -> Tokens -> Add API token (Viewer role)
- `NEXT_PUBLIC_GA_ID` — Google Analytics -> Admin -> Data Streams -> Web -> Measurement ID (G-XXXXXXXXXX)

### Sanity Webhook
Sanity Manage -> Project -> API -> Webhooks -> Create webhook:
- Name: Revalidate Production
- URL: https://drmoroczangela.hu/api/revalidate
- Dataset: production
- Trigger on: Create, Update, Delete
- HTTP method: POST
- Secret: (same SANITY_REVALIDATE_SECRET value)
- Enabled: Yes

## Next Phase Readiness

- Phase 8 is complete — all 3 plans executed and verified
- All 5 LAUNCH requirements met (LAUNCH-01 through LAUNCH-05)
- Site is launch-ready: webhook revalidation, GA4 consent-gated analytics, draft preview mode, branded 404, phone CTA dialog
- No blockers for production deployment

---
*Phase: 08-cms-revalidation-launch*
*Completed: 2026-02-21*
