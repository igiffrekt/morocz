---
phase: 06-seo-structured-data
plan: "04"
subsystem: gdpr-compliance
tags: [privacy-policy, cookie-notice, gdpr, hungarian, portable-text, localstorage]
dependency_graph:
  requires: ["06-01"]
  provides: ["privacy-policy-page", "cookie-notice"]
  affects: ["layout.tsx", "adatkezelesi-tajekoztato"]
tech_stack:
  added: []
  patterns: ["next-app-router-page", "client-component-localstorage", "motion-enter-animation"]
key_files:
  created:
    - src/app/adatkezelesi-tajekoztato/page.tsx
    - src/components/ui/CookieNotice.tsx
  modified:
    - src/app/layout.tsx
decisions:
  - "CookieNotice initialized as dismissed=true then useEffect checks localStorage — prevents flash of cookie notice during SSR hydration"
  - "Motion fade-in only (no AnimatePresence exit) — App Router AnimatePresence incompatibility per project decisions"
  - "CookieNotice rendered outside max-width container div but inside MotionProvider — fixed position does not affect layout flow"
metrics:
  duration: "8 min"
  completed: "2026-02-20"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
requirements:
  - SEO-06
  - SEO-07
  - SEO-09
---

# Phase 6 Plan 04: Privacy Policy Page and Cookie Notice Summary

Privacy policy page at /adatkezelesi-tajekoztato with Sanity Portable Text rendering and a dismissible GDPR cookie notice toast in the bottom-right corner — both fully in Hungarian.

## What Was Built

### Task 1: Privacy Policy Page
- `src/app/adatkezelesi-tajekoztato/page.tsx` — async Server Component
- Fetches `privacyPolicyQuery` (privacyPolicy singleton) from Sanity with tag-based revalidation
- Renders Portable Text body via existing `PortableTextRenderer` component
- Shows `lastUpdated` date formatted in Hungarian locale (`hu-HU`)
- Fallback: "Az adatkezelési tájékoztató hamarosan elérhető lesz." when no Sanity content
- `generateMetadata` returns Hungarian title, description, robots index/follow
- Inherits header/footer from root layout automatically (same max-w-3xl pattern as blog detail)

### Task 2: Cookie Notice Component + Layout Wiring
- `src/components/ui/CookieNotice.tsx` — `'use client'` component
- Mounts with `dismissed=true` state to prevent SSR flash, then checks localStorage in `useEffect`
- If not dismissed: renders motion-animated fixed bottom-right corner toast
- Motion fade-in: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- "Rendben" (OK) dismiss button sets `localStorage.setItem("cookie-notice-dismissed", "true")`
- Links to `/adatkezelesi-tajekoztato` with accent underline styling
- `role="dialog"` + `aria-label="Cookie tájékoztatás"` for accessibility
- All text in Hungarian with proper diacriticals
- `src/app/layout.tsx` — `CookieNotice` imported and rendered after the max-width div, inside MotionProvider

## Verification

- `npm run build` passes — 9/9 pages generated, `/adatkezelesi-tajekoztato` appears as static route
- `npx biome check .` — zero errors across 53 files
- Privacy policy page renders with same header/footer as the rest of the site
- Cookie notice appears on first visit, dismisses via localStorage, stays dismissed on refresh
- Cookie notice links to /adatkezelesi-tajekoztato

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Observations

The linter applied uncommitted changes from plans 06-02/06-03 (blog post enhanced metadata + JsonLd) during Task 2 execution. These were committed separately as `feat(06-02): enhance blog post metadata with OG image cascade and JSON-LD`. This restored clean working tree state.

## Self-Check: PASSED

- FOUND: src/app/adatkezelesi-tajekoztato/page.tsx
- FOUND: src/components/ui/CookieNotice.tsx
- FOUND: CookieNotice in layout.tsx
- FOUND: privacyPolicyQuery in page.tsx
- FOUND: localStorage in CookieNotice
- FOUND: link to privacy policy in CookieNotice
- FOUND: commit 90bb21c (privacy policy page)
- FOUND: commit 02a5ea3 (cookie notice + layout)
