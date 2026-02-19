---
phase: 03-shell-static-sections
plan: 02
subsystem: layout
tags: [footer, social-icons, cms-driven, responsive, tailwind]
dependency_graph:
  requires: [SiteSettings type, urlFor helper, sanity.types.ts]
  provides: [Footer component, SocialIcon component]
  affects: [layout.tsx wiring (next step)]
tech_stack:
  added: []
  patterns: [server-component, prop-drilling from layout, type-narrowing filter, inline-SVG icons]
key_files:
  created:
    - src/components/layout/SocialIcon.tsx
    - src/components/layout/Footer.tsx
  modified:
    - src/components/sections/HeroHeadline.tsx
    - src/components/sections/HeroServiceCards.tsx
decisions:
  - "Social icons use type-narrowing predicate filter (not non-null assertions) to satisfy Biome lint"
  - "Privacy policy text uses proper Hungarian diacritics: Adatvédelmi irányelv"
  - "Logo-on-pink block uses min-h-[160px] to maintain visual presence even without logo"
metrics:
  duration: 3 min
  completed: 2026-02-19
  tasks_completed: 2
  files_changed: 4
---

# Phase 3 Plan 2: Footer and SocialIcon Components Summary

**One-liner:** Dark navy footer with CMS-driven 3-column nav, contained logo-on-pink block, type-narrowed social icons, and Hungarian privacy link.

## What Was Built

### Task 1: SocialIcon component (commit: 0895a7b)

`src/components/layout/SocialIcon.tsx` — Pure server component that maps 5 social platform strings to recognizable inline SVG icons:

- **facebook** — filled path (classic F shape)
- **instagram** — stroke-based rounded rect + circle
- **linkedin** — filled path + rect + circle
- **youtube** — filled rounded rect with white play triangle
- **tiktok** — minimal note-shape outline
- **fallback** — generic link icon for unrecognized platforms

Each icon wrapped in `<a href target="_blank" rel="noopener noreferrer" aria-label>`. Uses `currentColor` for theme-aware coloring. No "use client" needed — pure rendering.

### Task 2: Footer component (commit: 30246ef)

`src/components/layout/Footer.tsx` — Server component receiving all data as props from `SiteSettings`.

**Structure:**
```
<footer bg-primary>
  <container max-w-[88rem]>
    <grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1>
      {3x footerColumns from Sanity}
      <logo-on-pink bg-secondary rounded-2xl>
    </grid>
    <hr border-white/20>
    <flex bottom-bar>
      phone | email | address (contact info)
      [SocialIcon x N] (CMS-filtered)
      "Adatvédelmi irányelv" link (conditional)
    </flex>
  </container>
</footer>
```

**Responsive:** 4-col desktop (lg), 2-col tablet (md), 1-col mobile.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Motion `ease` type error in HeroHeadline and HeroServiceCards**
- **Found during:** Task 2 verification (npx tsc --noEmit)
- **Issue:** `ease: "easeOut"` was typed as `string` but Motion's `Variants` type requires `Easing` literal type
- **Fix:** Added `as const` to `ease: "easeOut" as const` in both files
- **Files modified:** `src/components/sections/HeroHeadline.tsx`, `src/components/sections/HeroServiceCards.tsx`
- **Commit:** 30246ef (included in Task 2 commit)

**2. [Rule 1 - Lint] Replaced non-null assertions with type-narrowing predicate filter**
- **Found during:** Task 2 Biome check
- **Issue:** `social.platform!` and `social.url!` triggered `noNonNullAssertion` lint rule
- **Fix:** Used type predicate filter `(s): s is { platform: NonNullable<...>; url: string }` to narrow type, eliminating all `!` operators
- **Files modified:** `src/components/layout/Footer.tsx`
- **Commit:** 30246ef

### Out-of-scope items deferred

Pre-existing Biome formatting errors in `src/app/sanity-test/page.tsx` (import ordering, multi-line JSX) are from Phase 2 and not caused by this plan's changes. Deferred per scope boundary rules.

## Verification Results

- `npx tsc --noEmit` — PASS (no errors)
- `npx biome check src/components/layout/SocialIcon.tsx` — PASS
- `npx biome check src/components/layout/Footer.tsx` — PASS
- Footer is a server component (no "use client")
- SocialIcon renders SVG icons for all 5 platforms + fallback
- Social links are filtered via type-narrowing — only platforms with URLs render
- Footer uses `bg-primary` (dark navy #23264F) and `bg-secondary` (pink #F4DCD6)
- All visible text in Hungarian ("Adatvédelmi irányelv")
- Responsive: lg:grid-cols-4, md:grid-cols-2, grid-cols-1

## Self-Check: PASSED

- FOUND: `src/components/layout/SocialIcon.tsx`
- FOUND: `src/components/layout/Footer.tsx`
- FOUND commit: `0895a7b` (feat(03-02): create SocialIcon component)
- FOUND commit: `30246ef` (feat(03-02): create Footer component)
