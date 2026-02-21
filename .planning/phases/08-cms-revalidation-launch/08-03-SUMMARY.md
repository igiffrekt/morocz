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
    - src/app/layout.tsx
    - .env.example

key-decisions:
  - "GA scripts injected via DOM createElement (not next/script) to allow dynamic load after consent event"
  - "Deduplication guard via document.getElementById('ga-script') prevents double injection on re-renders"
  - "GoogleAnalytics placed outside MotionProvider in body — analytics independent of motion context"

patterns-established:
  - "Consent-gated analytics pattern: useEffect reads localStorage on mount, event listener handles same-session grants"

requirements-completed: [LAUNCH-02, LAUNCH-03]

# Metrics
duration: 8min
completed: 2026-02-21
---

# Phase 8 Plan 03: GA4 Analytics + End-to-End Verification Summary

**GDPR-aware GA4 integration via consent-gated script injection with custom event bridge from CookieNotice dismissal**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-21T21:41:18Z
- **Completed:** 2026-02-21T21:49:00Z
- **Tasks:** 1 of 2 complete (Task 2 is a human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- `GoogleAnalytics` client component that checks consent before loading gtag.js
- Returns visitors: GA loads immediately from `localStorage.getItem('cookie-notice-dismissed') === 'true'`
- New visitors: GA loads on `'cookie-consent-granted'` custom event fired by CookieNotice.handleDismiss
- Deduplication guard prevents double script injection (`document.getElementById('ga-script')`)
- `NEXT_PUBLIC_GA_ID` env var gates the entire feature — missing or undefined = no GA component rendered
- `.env.example` documents `NEXT_PUBLIC_GA_ID` with `# Google Analytics 4 measurement ID (G-XXXXXXXXXX)` comment

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GA4 script with cookie consent integration** - `30389c2` (feat)
2. **Task 2: Verify end-to-end editorial workflow** - awaiting human verification (checkpoint)

## Files Created/Modified

- `src/components/ui/GoogleAnalytics.tsx` - Client component: checks consent, injects gtag.js on consent grant
- `src/components/ui/CookieNotice.tsx` - Added `window.dispatchEvent(new Event('cookie-consent-granted'))` in handleDismiss
- `src/app/layout.tsx` - Imported GoogleAnalytics, renders conditionally on NEXT_PUBLIC_GA_ID
- `.env.example` - Added `NEXT_PUBLIC_GA_ID=` with comment

## Decisions Made

- GA scripts injected via `document.createElement('script')` rather than `next/script` — allows dynamic injection at arbitrary time post-consent rather than page load
- Deduplication via `document.getElementById('ga-script')` — component may re-render but GA should only load once
- `GoogleAnalytics` rendered outside `MotionProvider` block (after `DraftModeIndicator`) — analytics is infrastructure, independent of animation context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before Task 2 (human-verify checkpoint):**

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

- GA4 integration complete — waiting on human verification of full editorial workflow
- Task 2 requires: Sanity webhook configured, Vercel env vars set, manual test of 6 verification scenarios
- After Task 2 approval: Phase 8 is complete

---
*Phase: 08-cms-revalidation-launch*
*Completed: 2026-02-21*
