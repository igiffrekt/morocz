---
phase: 08-cms-revalidation-launch
plan: 01
subsystem: api-revalidation-phone-cta
tags: [webhook, hmac, revalidation, phone-cta, dialog, sanity, next-cache]
dependency_graph:
  requires: []
  provides:
    - /api/revalidate endpoint with HMAC validation
    - PhoneCallDialog component with motion animation
    - on-demand ISR via revalidateTag
  affects:
    - src/app/api/revalidate/route.ts
    - src/components/ui/PhoneCallDialog.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/layout/Footer.tsx
tech_stack:
  added:
    - node:crypto (HMAC-SHA256 + timingSafeEqual for webhook validation)
    - next/cache revalidateTag (on-demand ISR)
  patterns:
    - Sanity _type → revalidation tag mapping via lookup object
    - PhoneCallDialog: controlled modal with Escape key handler + motion animation
    - MobileMenu onPhoneClick callback prop for dialog integration
key_files:
  created:
    - src/app/api/revalidate/route.ts
    - src/components/ui/PhoneCallDialog.tsx
  modified:
    - src/components/layout/Header.tsx
    - src/components/layout/MobileMenu.tsx
    - src/components/layout/Footer.tsx
    - .env.example
decisions:
  - SANITY_REVALIDATE_SECRET is server-only (no NEXT_PUBLIC_ prefix) — webhook secret must not be exposed to client
  - timingSafeEqual used for HMAC comparison to prevent timing attacks — both buffers validated to equal length before comparison
  - Unrecognized Sanity _types return 200 (not 4xx) — Sanity sends internal document types; don't fail on unknown types
  - Backdrop implemented as <button> element to satisfy Biome noStaticElementInteractions a11y rule
  - MobileMenu receives onPhoneClick callback from Header — dialog state lives in Header and is shared across both header variants
  - Footer email prop kept in interface for backward compatibility — email was never rendered in Footer JSX anyway
metrics:
  duration: 5 min
  completed_date: 2026-02-21
  tasks_completed: 2
  files_modified: 6
requirements_satisfied:
  - LAUNCH-01
  - LAUNCH-05
---

# Phase 08 Plan 01: Webhook Revalidation + Phone CTA Dialog Summary

**One-liner:** HMAC-validated Sanity webhook route with revalidateTag ISR + Hungarian phone confirmation dialog replacing direct tel: links.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create /api/revalidate webhook route with HMAC validation | 321cb3c | src/app/api/revalidate/route.ts, .env.example |
| 2 | Add phone CTA confirmation dialog and remove email CTA | 7f7b850 | src/components/ui/PhoneCallDialog.tsx, Header.tsx, MobileMenu.tsx, Footer.tsx |

## What Was Built

### Task 1: /api/revalidate Webhook Route

Created `src/app/api/revalidate/route.ts` — a Next.js App Router POST-only handler that:

1. Reads `SANITY_REVALIDATE_SECRET` from `process.env` (server-only, not NEXT_PUBLIC_)
2. Reads raw request body as text (required for HMAC comparison before JSON parsing)
3. Extracts `x-sanity-signature` header and computes HMAC-SHA256
4. Uses `timingSafeEqual` to compare signatures (both must be equal-length hex Buffers)
5. Returns 401 for missing/invalid signatures, 500 if secret unconfigured
6. Parses body JSON, maps `_type` to revalidation tags via lookup object
7. Calls `revalidateTag(tag)` for each matched tag — Sanity _types that are unrecognized log a warning and return 200 with `revalidated: false`

Sanity type → tag mapping covers: homepage, siteSettings, service, serviceCategory, labTest, testimonial, blogPost, blogCategory, privacyPolicy.

### Task 2: PhoneCallDialog + Header/MobileMenu Updates

Created `src/components/ui/PhoneCallDialog.tsx`:
- `'use client'` directive with `phone`, `isOpen`, `onClose` props
- Motion enter animation: `initial={{ opacity: 0, scale: 0.95 }}` → `animate={{ opacity: 1, scale: 1 }}` at 0.15s
- Backdrop implemented as `<button>` (satisfies Biome a11y noStaticElementInteractions)
- Dialog with phone icon, "Hívja Dr. Mórocz Angelát?" heading, phone number display
- Two buttons: "Mégse" (cancel/close) and "Hívás" (call — `<a href="tel:{phone}">`)
- Escape key handler via `useEffect` keydown listener

Updated `src/components/layout/Header.tsx`:
- Both CTA buttons (default + compact header) changed from `<a href="tel:...">` to `<button onClick={() => setPhoneDialogOpen(true)}>`
- Added `phoneDialogOpen` state
- Renders `<PhoneCallDialog>` once at bottom of wrapper div (shared by both header variants)
- MobileMenu in both header variants receives `onPhoneClick={() => setPhoneDialogOpen(true)}`

Updated `src/components/layout/MobileMenu.tsx`:
- Added `onPhoneClick?: () => void` prop
- When `onPhoneClick` is provided, renders a `<button>` that calls `handlePhoneClick()` (closes menu + opens dialog)
- Falls back to direct `tel:` link when `onPhoneClick` is not provided (backward compatible)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome lint: backdrop needs interactive element role**
- **Found during:** Task 2 verification
- **Issue:** Initial implementation used `<div role="presentation" onClick={onClose}>` for backdrop — Biome flags `noStaticElementInteractions`
- **Fix:** Changed backdrop to `<button type="button" aria-label="Bezárás">` with absolute positioning
- **Files modified:** src/components/ui/PhoneCallDialog.tsx
- **Commit:** 7f7b850

**2. [Rule 1 - Bug] Fixed Biome format: long console.log line in route.ts**
- **Found during:** Task 1 verification
- **Issue:** Single-line console.log exceeded Biome's print width
- **Fix:** Wrapped to multi-line format per Biome style
- **Files modified:** src/app/api/revalidate/route.ts
- **Commit:** 321cb3c

## Pre-existing Issues (Out of Scope)

The following pre-existing issues were discovered and logged to `deferred-items.md`:

1. **Build failure:** `npm run build` fails with `draftMode was called outside a request scope` in `/laborvizsgalatok/[slug]/page.tsx` `generateStaticParams`. Root cause: uncommitted changes to `src/sanity/lib/fetch.ts` add `draftMode()` call that cannot run at static generation time. Pre-existing before this plan — confirmed by stash test. TypeScript and Biome pass on my files.

2. **Pre-existing Biome errors in other files:** CRLF format issues and lint errors exist in HeroServiceCards.tsx, LabTestsSection.tsx, ServicesSection.tsx, TestimonialsSection.tsx — all pre-dating this plan, out of scope.

## Verification

- Biome check passes on all modified files: route.ts, PhoneCallDialog.tsx, Header.tsx, MobileMenu.tsx, Footer.tsx
- TypeScript check passes (`npx tsc --noEmit`)
- Build fails due to pre-existing issue (see deferred items)
- /api/revalidate route exists and exports only POST
- PhoneCallDialog component exists with motion animation
- Header CTA buttons trigger dialog, not direct tel: links
- No email CTA rendering in Header, MobileMenu, or Footer

## Self-Check: PASSED

Files created/exist:
- src/app/api/revalidate/route.ts: EXISTS
- src/components/ui/PhoneCallDialog.tsx: EXISTS

Commits verified:
- 321cb3c: feat(08-01): create /api/revalidate webhook route
- 7f7b850: feat(08-01): add phone CTA confirmation dialog
