# Project Research Summary

**Project:** Morocz Medical v2.1 — Polish and Hardening Milestone
**Domain:** Next.js 15 App Router medical practice site — testing, performance, accessibility, dead code
**Researched:** 2026-02-23
**Confidence:** HIGH

## Executive Summary

Morocz Medical v2.1 is a quality hardening milestone on top of a fully-shipped v2.0 medical booking platform. The site runs Next.js 15 App Router + Sanity v4 + Tailwind v4 + Better Auth + Motion v12 on Vercel, with zero test coverage and known accessibility gaps. The research consensus is clear: this milestone adds no user-facing features — it makes the existing system production-confident through targeted testing, WCAG 2.1 AA compliance, performance optimization, and dead code removal. The recommended approach follows Next.js 15's own guidance exactly: Vitest for pure functions and synchronous client component logic, Playwright for E2E flows covering async Server Components, and @axe-core/playwright for automated accessibility scanning within existing E2E tests.

The highest-risk area is the testing architecture. Next.js 15 async Server Components cannot be unit-tested with Vitest — attempting to do so wastes significant time on unworkable workarounds. The codebase's critical business logic (slot generation, 24-hour cancellation window, Zod validation schemas) is correctly expressed as pure functions, making them ideal Vitest targets with no mocking overhead. Motion v12's extensive use throughout every component requires a `window.matchMedia` mock in the Vitest setup file, or Motion must be mocked entirely for component tests focused on non-animation concerns. The testing boundary must be established on Day 1 before any test files are written.

Accessibility carries the highest patient impact in this milestone. A booking wizard that screen readers cannot navigate is a healthcare access barrier, not merely a UX inconvenience — and WCAG 2.1 AA is a legal requirement under the EU Web Accessibility Directive (Hungarian WAD). The two most critical fixes — `aria-invalid`/`aria-describedby` on form error states and `role="alert"` on dynamic error containers — are low-complexity but high-value. The ARIA grid pattern for the calendar and focus management on wizard step transitions are more complex and must ship together with their associated keyboard behaviors, coordinating with Motion v12's AnimatePresence exit timing. Performance work centers on adding `sizes` attributes to Sanity images and auditing the client bundle for unexpected large dependencies. Dead code removal requires a grep-first audit of all Sanity field references before any deletion, because TypeScript's static analysis cannot see GROQ query strings.

## Key Findings

### Recommended Stack

The existing stack (Next.js 15, Sanity v4, Tailwind v4, Motion v12, Better Auth, Drizzle, Biome, Zod) requires no changes for v2.1. All stack additions are dev-only quality tooling. Vitest 4.0.18 is the officially supported unit test runner for Next.js 15 (Node >=20 already met on Vercel). Playwright 1.58.2 is the official E2E recommendation. The critical version constraint is `@next/bundle-analyzer` must be pinned to `^15.2.0` — not the latest `^16.x` — to match the installed Next.js version.

**Core technologies added (all dev dependencies):**
- `vitest@^4.0.18` + `@vitejs/plugin-react@^5.1.4` + `jsdom` + `vite-tsconfig-paths`: Unit test runner — officially supported by Next.js 15, 3-28x faster than Jest in CI, ESM-native; `vite-tsconfig-paths` is required to resolve `@/` aliases or all tests fail at import
- `@testing-library/react@^16.x` + `@testing-library/jest-dom@^6.9.1`: Component testing utilities — Jest-compatible API works with Vitest despite the package name; import `@testing-library/jest-dom` in the Vitest setup file once
- `@playwright/test@^1.58.2`: E2E testing — only tool that can test async Server Components; controls a real browser against the live Next.js server
- `@axe-core/playwright@^4.11.1`: Accessibility scanning — Deque's official Playwright integration; catches ~57% of WCAG violations automatically; run inline with functional E2E tests, not as a separate suite
- `knip@^5.85.0`: Dead code detection — finds orphan files, unused exports, and stale `package.json` dependencies; built-in Next.js plugin understands App Router entry conventions and avoids false positives on `page.tsx`, `layout.tsx`, `route.ts`
- `@next/bundle-analyzer@^15.2.0`: Bundle visualization — identifies large dependencies leaking into the client bundle; run once with `ANALYZE=true npm run build`; pin to `^15.x`, not `^16.x`

**Deliberately excluded:**
- MSW: Over-engineering for ~10 API routes; pure business logic testable without network mocking; E2E covers the rest
- Storybook: No component design system; ~5 reusable UI patterns does not justify the setup overhead
- Jest: Slower than Vitest, requires babel transform for ESM; no advantage for this setup
- Lighthouse CI: Single-developer project; Vercel Analytics monitors Core Web Vitals; manual Lighthouse sufficient
- `@axe-core/react` dev runtime: Logs to browser console during development, not CI-compatible, noisy — same issues caught by `@axe-core/playwright`

### Expected Features

The feature scope is entirely hardening — no new user-facing functionality. Priorities are derived from user impact (screen reader accessibility = healthcare access barrier) and risk (zero test coverage on core booking logic = no regression safety net).

**Must have (v2.1 P1 — launch blockers):**
- Vitest setup + unit tests for `generateAvailableSlots` (edge cases: blocked dates, bufferMinutes, maxDaysAhead, past dates, no schedule) — core booking logic with zero coverage
- Unit tests for `isWithin24Hours()` with mocked `Date.now()` — boundary bug here causes data integrity issues for patients and admin
- Unit tests for `BookingFormSchema` Zod validation — validates Hungarian error message correctness
- Playwright setup + homepage smoke test — catches catastrophic SSR/Sanity regression on deploy
- `aria-invalid` + `aria-describedby` on all Step4Confirm form inputs — WCAG 3.3.1/3.3.3; screen readers cannot identify errored fields without these
- `role="alert"` on global error states (Step4Confirm, booking wizard 409 conflict, admin cancellation) — screen readers miss dynamically injected errors without a live region
- `sizes` attribute on all `<Image>` components missing it — prevents oversized image downloads on mobile; direct LCP and CLS impact
- Remove `"rescheduled"` from Sanity `bookingType.ts` status enum — orphan schema value that no route handler ever writes; causes developer confusion
- `<html lang="hu">` verification in root layout — WCAG 2.1 Level A failure (SC 3.1.1) if missing; trivial fix

**Should have (v2.1 P2 — meaningful improvement, tractable cost):**
- E2E: booking wizard step-through with `page.route()` API stubs (avoids writing to production Sanity)
- E2E: patient self-service cancel flow via `/foglalas/:token`
- Focus management on wizard step transitions (delayed by animation duration + 50ms buffer to avoid conflict with AnimatePresence)
- `role="grid"` + arrow key day navigation on calendar (must ship together — role without keyboard handler is a WCAG 4.1.2 violation)
- `aria-live="polite"` on time slot loading region in Step2DateTime
- `optimizePackageImports` in `next.config.ts` for `motion`, `sanity`, `next-sanity`
- `noUnusedLocals: true` and `noUnusedParameters: true` in `tsconfig.json`
- Consistent `ApiErrorResponse` shared type in `src/types/api.ts`, applied to all route handlers

**Defer to v3+ (P3 — useful but not time-sensitive):**
- Knip full audit — run as a one-time cleanup pass when codebase drift is more significant
- Bundle analyzer deep-dive with optimization follow-up — schedule before any v3 features add new heavy dependencies
- Playwright test for admin dashboard cancellation flow

**Anti-features (explicitly excluded):**
- Full component test suite with React Testing Library — async Server Components cannot be unit-tested; RTL mocking overhead for Sanity + auth + Motion is enormous with low signal
- 100% code coverage target — incentivises trivial tests while real logic goes untested; target critical paths instead
- Lighthouse CI in every PR — adds noise; Vercel preview deployments already run Lighthouse; single-developer workflow
- Migrating from Biome to ESLint for jsx-a11y — Biome v2 already handles the most common a11y rules; disrupts established tooling

### Architecture Approach

The v2.1 architecture adds a three-layer test suite on top of the existing app without touching the production code structure. Unit tests (`__tests__/` at project root) cover pure functions directly imported from `src/lib/`. API route integration tests use `next-test-api-route-handler` (NTARH) to execute real route handlers with mocked external dependencies (Sanity, Better Auth, Gmail). E2E tests (`e2e/` at project root) run Playwright against a real Next.js server, covering the full async Server Component + Client Component + API Route stack together. Accessibility scans run inline with E2E tests via `@axe-core/playwright` — not as a separate test suite.

**Major components added:**
1. `vitest.config.mts` — Vitest config with jsdom environment, `vite-tsconfig-paths` for `@/` alias resolution, and setup file for the `matchMedia` mock required by Motion v12
2. `playwright.config.ts` — Playwright config with webServer, three projects (setup for admin auth, admin-chromium with storageState, public-chromium without auth), and `reuseExistingServer` for local dev
3. `__tests__/lib/slots.test.ts` + `__tests__/lib/booking-email.test.ts` — pure function unit tests requiring zero mocks; test inputs and outputs only
4. `__tests__/api/*.test.ts` — API route integration tests via NTARH with `vi.hoisted()` + `vi.mock()` for Sanity, Better Auth, and Gmail; test Zod validation, auth checks, business logic, and response shape
5. `e2e/booking-flow.spec.ts` + `e2e/accessibility.spec.ts` — Playwright E2E covering booking wizard and axe WCAG scans on all major pages
6. `e2e/auth/setup.ts` — Admin `storageState` setup; logs in once per CI run, saves cookies to `.admin-auth.json` (gitignored)

**Key patterns from architecture research:**
- `vi.hoisted()` + `vi.mock()` before handler imports — required by Vitest's module hoisting; reverse order breaks mock injection
- NTARH `testApiHandler` for all API route tests — direct `Request` construction fails because Next.js Route Handlers require internal context (`headers()`, `cookies()`) that NTARH provides
- `page.route()` in Playwright for stubbing API responses in booking wizard E2E — avoids writing test booking documents to production Sanity
- `await page.waitForLoadState('networkidle')` + optional `await page.waitForTimeout(500)` before axe scans — Motion animations must settle before axe runs to avoid false positives from mid-animation opacity states
- Playwright `storageState` auth reuse — log in once in the `setup` project, load session file in tests requiring auth; eliminates per-test login overhead

### Critical Pitfalls

1. **Vitest cannot test async Server Components** — `async function Page()` components throw `Error: Objects are not valid as a React child` in jsdom. Establish the testing boundary on Day 1: Vitest for pure functions and synchronous client components; Playwright for everything that calls `sanityFetch()` or is an `async` component. No Vitest test file should ever import from `page.tsx` or `layout.tsx`.

2. **Motion v12 breaks jsdom tests with `window.matchMedia` missing** — Every component using `motion.div`, `AnimatePresence`, or `useReducedMotion` fails with `TypeError: window.matchMedia is not a function`. Add the `matchMedia` mock to `vitest.setup.ts` before writing the first component test. For tests focused on non-animation logic, mock `motion/react` entirely with `vi.mock()`.

3. **Dead code removal can silently break Sanity queries** — TypeScript static analysis cannot see GROQ query strings. Before removing any Sanity field, schema type, or query export, run `grep -r "fieldName" src/` to find string references. Never hand-edit `sanity.types.ts` — run `npm run typegen` after schema changes. Run `npm run build` after every removal batch.

4. **Performance optimization can break Motion animations or worsen LCP** — Adding `loading="lazy"` to the hero doctor image (which already has `priority={true}`) removes the preload link and tanks LCP score. Changing `width`/`height` on `motion.div` elements using the `layout` prop causes animation jumps. Audit existing image configuration before applying any blanket rules; treat `IntroOverlay`, `CircleWipeLink`, and `ServicesSection AnimatePresence` containers as "do not change dimensions" zones.

5. **Accessibility focus management conflicts with `AnimatePresence` exit animations** — Moving focus to a new step element while the old element is still in its 250ms exit animation causes screen readers to announce disappearing content and breaks keyboard Tab order during the transition. Delay `focus()` calls by animation duration + 50ms (300ms total). Place `aria-live` regions outside `AnimatePresence` wrappers so they are always in the DOM regardless of step animation state.

6. **`CRON_SECRET` authorization check must never be removed** — The auth check in `/api/cron/reminders/route.ts` looks like defensive boilerplate that dead code tools might flag as "unreachable" or "unnecessary." Removing it makes the endpoint publicly callable by anyone. Verify this check remains intact after any dead code removal pass on the cron route.

## Implications for Roadmap

Based on combined research, the v2.1 work divides naturally into four phases with clear dependency ordering. Testing infrastructure must come first because it creates the safety net that makes subsequent changes low-risk. Performance and dead code work are largely independent but benefit from the test suite being in place. Complex accessibility improvements depend on both the Playwright infrastructure (for axe verification) and on understanding the animation timing constraints first encountered in simpler fixes.

### Phase 1: Test Infrastructure Foundation
**Rationale:** Zero test coverage means every change in this milestone carries regression risk. The testing boundary (Vitest vs. Playwright) and setup details (matchMedia mock, tsconfig paths, NTARH, storageState) must be established before any test files are written — retrofitting them after tests exist means breaking and rewriting tests. The architecture research defines a clear four-step build order: Vitest config first, unit tests on pure functions second (no mocks, immediate value), API route integration tests third (NTARH + mocks), Playwright E2E fourth (real server required).
**Delivers:** Vitest running with jsdom environment, matchMedia mock, and `@/` path resolution. Passing unit tests for `generateAvailableSlots`, `isWithin24Hours()`, and `BookingFormSchema`. Playwright configured with webServer, admin storageState setup, and public vs. admin test project split. Homepage smoke test passing.
**Addresses:** All P1 unit test requirements. P1 Playwright setup. P2 booking wizard E2E and self-service E2E (can begin after Playwright is operational).
**Avoids:** Testing async Server Components with Vitest (Pitfall 1). Motion matchMedia crash in jsdom (Pitfall 2). Playwright hitting production Sanity with test bookings (security pitfall from PITFALLS.md).

### Phase 2: Core Accessibility Fixes
**Rationale:** P1 accessibility fixes are low-complexity relative to the ARIA grid work but high-impact for screen reader users. `aria-invalid`/`aria-describedby` and `role="alert"` are mechanical additions that do not interact with animation code. Completing these before the calendar ARIA grid keeps each phase's scope tight and allows axe scans to verify the Phase 2 fixes before Phase 4 introduces more complex ARIA patterns.
**Delivers:** WCAG 3.3.1/3.3.3 compliant booking form error states on all Step4Confirm inputs. `role="alert"` on global error containers in booking wizard and admin cancellation. `<html lang="hu">` confirmed in root layout. axe scans on key pages passing for all P2-addressed violations.
**Addresses:** `aria-invalid` + `aria-describedby` on form inputs (P1). `role="alert"` on global errors (P1). Lang attribute (P1).
**Avoids:** Overly aggressive `aria-live="assertive"` for non-error announcements (use `polite` for step transitions, `assertive` only for booking errors). Redundant announcements from multiple live regions. Adding `tabIndex` to `motion.div` wrappers (makes container focusable, breaks tab order).

### Phase 3: Performance Audit and Image Optimization
**Rationale:** Performance work is independent of testing and accessibility phases. Running `@next/bundle-analyzer` first establishes a baseline and informs which `optimizePackageImports` entries are actually needed — do not add optimizations blindly. Image `sizes` fixes are the highest-value performance change with the lowest risk of regression. The AVIF + WebP format configuration in `next.config.ts` is a one-line addition.
**Delivers:** All `<Image>` components with correct `sizes` attributes matching their CSS breakpoints. `formats: ['image/avif', 'image/webp']` in `next.config.ts`. `@next/bundle-analyzer` integrated and run once. `optimizePackageImports` for `motion`, `sanity`, `next-sanity` added after bundle analysis confirms they inflate the client bundle.
**Addresses:** `sizes` attribute on all images (P1). `optimizePackageImports` config (P2). Bundle analyzer audit (P3 prerequisite for `optimizePackageImports`).
**Avoids:** Adding `loading="lazy"` to images with `priority={true}` (Pitfall 4 — worsens LCP). Changing dimensions on Motion `layout` containers (Pitfall 4 — breaks animation). AVIF-only without WebP fallback (architecture anti-pattern 3 — breaks older Safari).

### Phase 4: Complex Accessibility and Dead Code Cleanup
**Rationale:** Focus management and ARIA grid implementation are the most complex tasks in the milestone — they require careful coordination with Motion v12's AnimatePresence exit timing and must be manually verified with a screen reader. Placing them last means axe infrastructure (Phase 1) and simpler ARIA patterns (Phase 2) are fully operational as a baseline. Dead code removal is placed last because the Knip audit is most valuable when all intentional code additions for the milestone are complete, minimizing the risk of cleaning up code that another phase was about to write.
**Delivers:** Focus management on wizard step transitions (delayed 300ms after AnimatePresence exit via setTimeout; `aria-live` region outside AnimatePresence for step announcements). `role="grid"` + arrow key day navigation on calendar (shipped together as WCAG 4.1.2 requires). `aria-live="polite"` on slot loading region in Step2DateTime. Knip audit completed and confirmed dead code removed. `"rescheduled"` status removed from Sanity `bookingType.ts` schema (with `npm run typegen` regeneration). `noUnusedLocals: true` + `noUnusedParameters: true` in `tsconfig.json`. `ApiErrorResponse` shared type created in `src/types/api.ts`.
**Addresses:** Focus management on step transitions (P2). `role="grid"` + arrow keys (P2). `aria-live` on slot loading (P2). Remove `"rescheduled"` enum (P1 — simple, low-risk, placed here because it requires schema changes and typegen). Knip audit (P3). `noUnusedLocals`/`noUnusedParameters` (P2). `ApiErrorResponse` type (P2).
**Avoids:** Moving focus before AnimatePresence exit completes (Pitfall 5 — causes screen reader double-announcement and broken keyboard flow). `role="grid"` without arrow key handler (WCAG 4.1.2 violation — role implies keyboard behavior that must be supported). Removing Sanity fields without grep audit (Pitfall 3). Removing `CRON_SECRET` check in cron route (Pitfall 6).

### Phase Ordering Rationale

- **Testing first:** Test infrastructure is the safety net for every other change. Running without tests means accessibility fixes, image attribute changes, and dead code removal all carry silent regression risk.
- **Simple accessibility before complex accessibility:** `aria-invalid`/`aria-describedby`/`role="alert"` carry zero animation interaction risk and validate immediately with axe. The ARIA grid + focus management work requires understanding animation timing constraints and must be manually verified with a screen reader — placing it last gives Phase 2 findings time to inform Phase 4's approach.
- **Performance before dead code:** Bundle analysis may identify dependencies that the dead code phase should also evaluate. Completing performance work first avoids duplicate decision-making about the same large packages.
- **Dead code last:** Irreversible. All intentional code additions for the milestone should be complete before determining what is genuinely unused — this prevents removing code that a later phase was about to modify.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 — Better Auth mock pattern for NTARH tests:** The general `vi.mock('@/lib/auth')` pattern is documented in ARCHITECTURE.md, but the exact session object shape returned by Better Auth v1.4.18's `auth.api.getSession()` must be confirmed against the actual `src/lib/auth.ts` before writing `booking.test.ts`. The community documentation for mocking Better Auth is sparse (LOW confidence per PITFALLS.md sources).
- **Phase 4 — ARIA grid keyboard interaction:** The W3C APG grid pattern requires arrow key navigation, Home/End for first/last cell, and PageUp/PageDown for previous/next month. The full keyboard contract is well-specified but non-trivial to implement correctly with React state. Allocate time for manual keyboard testing with NVDA + Firefox (most common screen reader in Central Europe) before marking Phase 4 done.

Phases with standard patterns (skip research-phase):
- **Phase 2:** `aria-invalid`, `aria-describedby`, `role="alert"` are fully specified in WCAG 2.1 SC 3.3.1/3.3.3 and have well-documented React implementation patterns. No additional research needed.
- **Phase 3:** `@next/bundle-analyzer` configuration and `next/image` `sizes` patterns are documented in official Next.js docs. Full configuration snippets are provided in both STACK.md and ARCHITECTURE.md. No additional research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registries and official docs as of 2026-02-23. Full version compatibility matrix in STACK.md. `@next/bundle-analyzer` version pin to `^15.x` is a confirmed requirement. |
| Features | HIGH | P1/P2/P3 priorities derived from WCAG 2.1 spec (authoritative W3C), Next.js official testing guide (authoritative), and direct codebase inspection (first-party). Anti-feature rationale strongly supported by architecture constraints. |
| Architecture | HIGH | Three-layer test strategy matches Next.js official guidance exactly. NTARH, storageState, and axe timing patterns backed by official Playwright and Next.js docs. Build order validated against hard dependency chain. |
| Pitfalls | HIGH for most / MEDIUM for Better Auth mocking | Critical pitfalls (async Server Component limitation, matchMedia, CRON_SECRET, AnimatePresence focus timing) verified against official docs and direct codebase inspection. Better Auth mocking pattern has LOW community documentation — needs validation at implementation time. |

**Overall confidence:** HIGH

### Gaps to Address

- **Better Auth mock pattern for API route tests:** Limited community documentation for mocking Better Auth v1.4.18 session in NTARH integration tests. The session object shape (what `auth.api.getSession()` returns) must be confirmed against `src/lib/auth.ts` at the start of Phase 1 before writing integration tests. If the standard `vi.mock('@/lib/auth')` pattern proves insufficient, consider using Playwright for the booking creation flow coverage instead of NTARH.
- **Sanity image double-processing:** PITFALLS.md notes that passing Sanity CDN URLs through `next/image` causes double-processing (Sanity CDN transforms + Next.js Vercel image optimizer). ARCHITECTURE.md provides a `SanityImage` component pattern using `@sanity/asset-utils`. Verify at Phase 3 implementation time whether the current codebase uses this pattern or raw `urlFor()` URLs — the fix differs in each case.
- **Hungarian screen reader behavior:** WCAG compliance with Hungarian date/time formatting must be verified manually with NVDA + Firefox. Time slot labels like "14:30" and date announcements may be rendered unexpectedly in Hungarian by screen readers. This cannot be automated with axe — schedule a manual screen reader session after Phase 4 completes.
- **IntroOverlay and CircleWipeLink test coverage:** These components use `sessionStorage`, `document.createPortal`, `usePathname`, `useRouter`, and `useReducedMotion` simultaneously — they are untestable with Vitest without mocking out all meaning from the tests. The correct approach is Playwright E2E: verify intro overlay appears on first visit (clean sessionStorage), skips on second visit; verify circle wipe plays and navigation occurs. Plan this in Phase 1 alongside the other E2E work.

## Sources

### Primary (HIGH confidence)
- Next.js Testing Guide — Vitest (official, updated 2026-02-20): https://nextjs.org/docs/app/guides/testing/vitest
- Next.js Testing Guide — Playwright (official): https://nextjs.org/docs/app/guides/testing/playwright
- Next.js Image Optimization — `sizes`, `priority`, `formats` (official): https://nextjs.org/docs/app/api-reference/components/image
- Next.js Package Bundling Guide — `optimizePackageImports` (official): https://nextjs.org/docs/app/guides/package-bundling
- ARIA Grid Pattern — W3C APG: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- ARIA Date Picker Dialog Pattern — W3C APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
- Playwright accessibility testing with @axe-core/playwright (official): https://playwright.dev/docs/accessibility-testing
- Playwright authentication storageState (official): https://playwright.dev/docs/auth
- next-test-api-route-handler — App Router support since v4.0.0: https://github.com/Xunnamius/next-test-api-route-handler
- Vitest 4.0 release notes: https://vitest.dev/blog/vitest-4
- Knip 5.85.0 + Next.js plugin: https://knip.dev/reference/plugins/next
- @axe-core/playwright v4.11.1 on npm (published 2026-02-07): https://www.npmjs.com/package/@axe-core/playwright
- HHS Accessibility Rule May 2026 — healthcare site WCAG 2.1 AA legal requirement: https://www.mwe.com/insights/may-2026-deadline-hhs-imposes-accessibility-standards-for-healthcare-company-websites-mobile-apps-kiosks/
- Optimizing Core Web Vitals — Vercel KB: https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024
- Direct codebase inspection (first-party): `src/lib/slots.ts`, `src/components/motion/IntroOverlay.tsx`, `src/components/motion/CircleWipeLink.tsx`, `src/components/booking/BookingWizard.tsx`, `src/app/api/cron/reminders/route.ts`, `src/sanity/schemas/bookingType.ts`

### Secondary (MEDIUM confidence)
- Mock `window.matchMedia` in Vitest: https://rebeccamdeprey.com/blog/mock-windowmatchmedia-in-vitest
- jsdom-testing-mocks (matchMedia mock for AnimatePresence): https://www.npmjs.com/package/jsdom-testing-mocks
- Mocking Framer Motion / Motion v12 with vi.mock: https://www.hectane.com/blog/mock-framer-motion-with-jest
- Sanity + next/image integration pitfalls (January 2026): https://medium.com/@drazen.bebic/image-optimization-with-next-js-and-sanity-io-6956b9ceae4f
- WCAG 2.2 Complete Guide — AllAccessible: https://www.allaccessible.org/blog/wcag-22-complete-guide-2025
- Healthcare Website Accessibility obligations — AllAccessible: https://www.allaccessible.org/blog/healthcare-website-accessibility-hipaa-ada-compliance
- Core Web Vitals Optimization Next.js 15 — makersden.io: https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025
- Knip dead code detection comparison — Level Up Coding: https://levelup.gitconnected.com/dead-code-detection-in-typescript-projects-why-we-chose-knip-over-ts-prune-8feea827da35
- Biome v2 test domain — Vitest auto-detection: https://biomejs.dev/linter/domains/
- Tailwind v4 CSS-first approach and PurgeCSS incompatibility: https://github.com/tailwindlabs/tailwindcss/discussions/16634
- Vitest vs Jest 2026 benchmark: https://www.sitepoint.com/vitest-vs-jest-2026-migration-benchmark/

### Tertiary (LOW confidence)
- How to mock Better Auth with MSW — GitHub Discussion (sparse community documentation; Better Auth mocking for NTARH needs validation at implementation time): https://github.com/better-auth/better-auth/discussions/4230

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
