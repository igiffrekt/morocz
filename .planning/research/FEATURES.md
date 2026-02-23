# Feature Research

**Domain:** Medical practice website — v2.1 polish milestone (testing, performance, accessibility, code quality)
**Researched:** 2026-02-23
**Confidence:** HIGH (testing strategy from Next.js official docs and Vitest/Playwright documentation; accessibility from W3C WCAG 2.2 and ARIA Authoring Practices Guide; performance from Next.js 15 official guides; dead code tooling from knip documentation)

---

## Scope Note

This document covers the **v2.1 hardening milestone** for an existing Next.js 15 App Router + Sanity v4 + Tailwind v4 medical practice website. All features from v1.0 (homepage, animations, SEO) and v2.0 (booking wizard, admin dashboard, email notifications, auth) are already shipped. This milestone adds no user-facing features — it hardens what exists.

**Current state of each category:**
- Testing: zero test coverage; no test framework installed
- Performance: next/image used throughout but no `sizes` attributes; no bundle analyzer; no `optimizePackageImports`; next.config.ts has only `remotePatterns`
- Dead code: `/api/slots/availability` is NOT orphaned — Step2DateTime uses it for per-day availability stripes; `"rescheduled"` status exists in Sanity schema (`bookingType.ts`) but is never written by any route handler (reschedule route only updates `slotDate`/`slotTime`, never sets `status: "rescheduled"`)
- Error handling: API routes have basic Zod validation and try/catch; form errors use inline `<p>` tags without `aria-invalid` or `aria-describedby`
- Accessibility: calendar has `aria-label`, `aria-pressed`, `aria-current`; step indicator has `role="progressbar"`; testimonials have `aria-live="polite"`; form inputs have `<label>` associations; missing `aria-invalid`, `aria-describedby` on error states, `aria-live` on global errors, `role="grid"` on calendar, `aria-label` on time slot buttons

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that a production-grade medical site must have. Missing these = site is not production-confident.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Unit tests for slot generation algorithm | `generateAvailableSlots` is pure, side-effect-free, and the most critical business logic in the codebase — the obvious first test target | LOW | Vitest (no React, no mocking needed). Edge cases: past dates, blocked dates, bufferMinutes, serviceDuration, maxDaysAhead, DST-adjacent dates |
| Unit tests for booking API route validation | Zod schemas in `/api/booking` and `/api/booking-reschedule` are pure validation logic — trivially testable | LOW | Vitest; test valid/invalid inputs against the exported Zod schema |
| Unit tests for 24h cancellation window | `isWithin24Hours()` helper in booking-reschedule route is pure logic with a date boundary — high-value, low-effort test | LOW | Vitest; mock `Date.now()` to test boundary conditions |
| E2E smoke test: homepage loads | Catches catastrophic regressions in SSR, Sanity data fetching, and animation rendering | LOW | Playwright; verify `<h1>` exists, no error boundary triggered |
| E2E smoke test: booking wizard completes | The most critical user path; 4 steps must work end-to-end | HIGH | Playwright; requires test auth session and Sanity test data or stubbed API responses |
| E2E smoke test: patient self-service | `/foglalas/:token` cancel and reschedule flows must work after deploy | MEDIUM | Playwright; requires fixture booking document with known token |
| `aria-invalid` and `aria-describedby` on form inputs | WCAG 2.1 Success Criterion 3.3.1 (Error Identification) and 3.3.3 (Error Suggestion) — required for screen reader users to understand form errors | LOW | Step4Confirm form fields, ReschedulePanel form; when `errors.patientName` is set, the input needs `aria-invalid="true"` and `aria-describedby` pointing to the error `<p>` |
| `aria-live` on global error states | Screen readers must announce booking failure, network error, 409 conflict without page reload | LOW | Step4Confirm `globalError` div needs `role="alert"` (implicit `aria-live="assertive"`); same for admin cancellation errors |
| `next/image` `sizes` attribute on all images | Without `sizes`, the browser downloads a full-width image even on mobile; this causes unnecessary network payload and hurts LCP | LOW | Every `<Image>` component in the codebase needs a `sizes` string matching its CSS layout (e.g. `sizes="(max-width: 768px) 100vw, 50vw"`) |
| `priority` prop on LCP image | Hero doctor image is the LCP element; missing `priority` means it's lazy-loaded, hurting Core Web Vitals score | LOW | HeroSection.tsx already has `priority` — verify all above-fold images have it and none below-fold do |
| Error boundary for booking wizard | If a Sanity fetch or API call throws during wizard rendering, the page should show a recovery UI, not a white screen | MEDIUM | Next.js `error.tsx` at the `/idopontfoglalas` segment level; show "Hiba történt. Kérjük, töltse újra az oldalt." with retry button |
| Error boundary for admin dashboard | Admin must never see a white screen — any data fetch failure should show a graceful fallback | MEDIUM | `error.tsx` at the `/admin` route segment level |

### Differentiators (Competitive Advantage)

Features that exceed baseline expectations and demonstrate production maturity for a medical practice site.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Calendar ARIA grid pattern | The booking calendar should follow the W3C ARIA grid pattern: `role="grid"` on the calendar container, `role="row"` on rows, `role="gridcell"` on day buttons, arrow-key navigation between days | MEDIUM | W3C ARIA Authoring Practices Guide defines the grid pattern for date pickers; Step2DateTime calendar currently uses `<div class="grid">` without ARIA roles; keyboard-only users cannot navigate between days |
| `aria-live` region for slot loading state | When a patient clicks a calendar day, time slots load asynchronously; screen readers must announce "Időpontok betöltése" and then the count of slots found | LOW | Step2DateTime time slot section needs `aria-live="polite"` with status messages; currently the loading skeleton uses `aria-busy="true"` but no live region announces completion |
| `optimizePackageImports` in next.config.ts | Motion v12, googleapis, and sanity/next-sanity have deep import trees; Next.js 15 `optimizePackageImports` config option reduces bundle overhead without code changes | LOW | Add to `next.config.ts`: `experimental: { optimizePackageImports: ['motion', 'sanity', 'next-sanity'] }` — verify no build breakage |
| Bundle analyzer audit | Identify what is actually in the client bundle; Motion v12 and googleapis are both large dependencies; confirm only needed parts are tree-shaken | LOW | `@next/bundle-analyzer` as a dev dependency; run once, document findings |
| `noUnusedLocals` and `noUnusedParameters` in tsconfig.json | TypeScript can catch dead local variables and unused function parameters at compile time; currently disabled | LOW | Add to `tsconfig.json` compilerOptions; fix any newly flagged issues |
| Knip audit for dead exports and files | Knip statically traces the module graph from entry points and flags unused exports, files, and dependencies; more thorough than TypeScript's own checks for Next.js route files | LOW | `npx knip` one-time audit; document findings and remove confirmed dead code |
| Remove `"rescheduled"` from booking status enum | The Sanity `bookingType.ts` defines `status: "rescheduled"` as a valid value but no route handler ever writes it; confirmed orphan schema value | LOW | Remove from Sanity schema validation options to prevent confusion; the reschedule flow correctly keeps `status: "confirmed"` and updates `slotDate`/`slotTime` |
| Consistent API error response shape | Current route handlers return `{ error: string }` but the shape is undocumented; define a typed `ApiErrorResponse` interface shared across all route handlers | LOW | Create `src/types/api.ts` with `ApiErrorResponse` and `ApiSuccessResponse` types; use in all route files |
| `role="alert"` on 409 conflict state in booking wizard | When a slot conflict is detected (409), the error message appears but screen readers may not announce it without a live region | LOW | BookingWizard conflict state needs `role="alert"` on the error container |
| Focus management on booking step transitions | When the wizard moves from step to step, focus should move to the new step's heading so keyboard/screen-reader users know the step changed | MEDIUM | Step transitions in BookingWizard.tsx need `useEffect` + `ref.current?.focus()` on the step heading after each step change |
| Keyboard navigation for testimonials carousel | TestimonialsSection carousel uses dots for navigation; keyboard users need arrow key support and `aria-label` on each dot | LOW | Add `onKeyDown` handler for left/right arrows on carousel wrapper; dot buttons need `aria-label="X. vélemény"` |
| `lang` attribute verification | `<html lang="hu">` must be set in root layout; missing lang attribute is a WCAG 2.1 Level A failure (SC 3.1.1) | LOW | Verify `layout.tsx` root layout; currently not confirmed present in codebase review |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appropriate for a polish milestone but create disproportionate complexity or maintenance burden.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full component test suite with React Testing Library | "More tests = better" — every component tested | Next.js 15 async Server Components cannot be unit-tested with Vitest/RTL; mocking Sanity, auth, and Motion adds enormous setup cost for low signal; components are visual, not business logic | Test pure utility functions (slots.ts, date helpers, Zod schemas) with Vitest; test user flows with Playwright E2E; skip component unit tests for this codebase |
| 100% code coverage target | Coverage metrics give confidence | 100% coverage incentivises trivial tests on getters/setters while the real logic goes untested; creates maintenance burden when edge cases are refactored | Target the critical paths: slot generation, 24h window, booking creation; coverage is a byproduct, not a goal |
| Lighthouse CI in every PR | Catch performance regressions early | Vercel preview deployments already run Lighthouse; adding a CI step that blocks merges on score regressions creates noise (Sanity CDN latency varies); single-developer project has no PR review bottleneck | Run Lighthouse manually on staging before each milestone; Vercel Analytics monitors real Core Web Vitals from production traffic |
| axe-core automated accessibility testing in CI | Catch accessibility violations automatically | axe-core catches ~30-40% of WCAG violations; the remaining 60% (keyboard navigation, focus management, live regions) require manual testing; CI setup adds complexity | Run axe DevTools browser extension manually during accessibility audit; document findings and fix manually |
| Migrating from Biome to ESLint for accessibility rules (eslint-plugin-jsx-a11y) | jsx-a11y has broader accessibility rule coverage | Biome v2 is already configured and working; Biome covers the most common a11y rules; migrating linters mid-project disrupts the established tooling without sufficient gain | Biome v2 handles aria-* and role= rules; supplement with manual NVDA/VoiceOver testing for live regions and keyboard flow |
| Removing `/api/slots/availability` (misidentified as orphan) | The route was listed as a potential dead route | Step2DateTime.tsx actively fetches this endpoint on every month view change to render availability stripes on calendar days; deleting it would break the calendar | Keep the route; the original dead-code concern was incorrect |
| Server-sent events for real-time slot updates | Prevent stale slot data while patient browses | Vercel serverless functions do not support persistent connections; already documented as out-of-scope in PROJECT.md; adds infrastructure complexity with no gain at single-doctor volume | Keep current approach: optimistic UI, server-side conflict detection at booking creation, 409 response with alternatives |

---

## Feature Dependencies

```
[Vitest setup]
    └──required by──> [Unit tests: slots.ts]
    └──required by──> [Unit tests: Zod schemas]
    └──required by──> [Unit tests: isWithin24Hours]

[Playwright setup]
    └──required by──> [E2E: homepage smoke]
    └──required by──> [E2E: booking wizard]
    └──required by──> [E2E: patient self-service]

[E2E: booking wizard]
    └──requires──> [Test auth session fixture]
    └──requires──> [Sanity test data or API stub]

[aria-invalid + aria-describedby on inputs]
    └──enhances──> [Focus management on step transitions]
        (fixing both together = complete keyboard/screen-reader booking flow)

[role="grid" on calendar]
    └──requires──> [Arrow key navigation implementation]
        (adding role without key handler = incorrect ARIA pattern)

[Bundle analyzer audit]
    └──informs──> [optimizePackageImports config]
        (identify problem before configuring solution)

[Knip audit]
    └──informs──> [Remove rescheduled status enum value]
    └──informs──> [noUnusedLocals tsconfig flag]
        (tooling first, then targeted cleanup)

[Consistent ApiErrorResponse type]
    └──enhances──> [E2E tests: error state assertions]
        (typed error shape makes test assertions simpler)
```

### Dependency Notes

- **Vitest and Playwright are independent setups:** Both can be installed and configured in parallel; Vitest handles pure-function unit tests, Playwright handles full-stack E2E flows.
- **ARIA grid + arrow key navigation must ship together:** Adding `role="grid"` to the calendar without implementing arrow-key focus management is a WCAG 4.1.2 failure — the role implies keyboard behaviour that must be supported.
- **Bundle analyzer audit before config changes:** Run `@next/bundle-analyzer` first to confirm which packages are actually inflating the bundle before adding `optimizePackageImports`. Do not add optimizations blindly.
- **Knip audit is read-only first:** Run knip, review its output carefully — Next.js route files are entry points and must be excluded from unused-file reports; knip has a Next.js plugin that handles this automatically.

---

## v2.1 Work Items

### Must Ship (v2.1 launch blockers)

Minimum hardening for the site to be considered production-confident.

- [ ] Vitest setup + unit tests for `generateAvailableSlots` (edge cases: blocked dates, bufferMinutes, maxDaysAhead, past dates, no schedule) — why essential: core booking logic with no current coverage
- [ ] Unit tests for `isWithin24Hours()` with mocked `Date.now()` — why essential: boundary bug here causes patient or admin data integrity issue
- [ ] Unit tests for `BookingFormSchema` Zod validation — why essential: validates Hungarian error messages are correct
- [ ] Playwright setup + homepage smoke test — why essential: catches catastrophic SSR regression on deploy
- [ ] `aria-invalid` + `aria-describedby` on all Step4Confirm form inputs — why essential: WCAG 3.3.1 / 3.3.3 compliance; screen readers cannot identify errored fields
- [ ] `role="alert"` on global error states (Step4Confirm globalError, booking wizard conflict, admin cancellation) — why essential: screen readers miss dynamic error injection without live region
- [ ] `sizes` attribute on all `<Image>` components without it — why essential: prevents oversized image downloads on mobile; direct LCP and CLS impact
- [ ] Remove `"rescheduled"` from Sanity `bookingType.ts` status enum — why essential: orphan schema value that will never be set; creates confusion for future developers
- [ ] `<html lang="hu">` verification in root layout — why essential: WCAG 2.1 Level A (SC 3.1.1) failure if missing; trivial fix

### Add After Core (v2.1 secondary)

- [ ] E2E: booking wizard step-through with stubbed `/api/slots` and `/api/booking` — trigger after Playwright setup is working
- [ ] E2E: patient self-service cancel flow — trigger after booking wizard E2E is stable
- [ ] Focus management on wizard step transitions — `useEffect` + `headingRef.current?.focus()` after step change
- [ ] `role="grid"` on calendar + arrow key day navigation — implement together (role without key handler is a violation)
- [ ] `aria-live="polite"` on time slot loading region in Step2DateTime
- [ ] `optimizePackageImports` in next.config.ts for motion, sanity, next-sanity
- [ ] `noUnusedLocals: true` and `noUnusedParameters: true` in tsconfig.json
- [ ] Consistent `ApiErrorResponse` type in `src/types/api.ts`, applied to all route handlers

### Future Consideration (v3+)

- [ ] Knip full audit — run as a one-time cleanup pass when codebase is larger and drift is more likely
- [ ] Bundle analyzer deep-dive — schedule before any v3 features add new heavy dependencies
- [ ] Playwright test for admin dashboard cancellation flow — value grows when admin UI changes frequently

---

## Feature Prioritization Matrix

| Feature | User/Patient Value | Developer Confidence | Cost | Priority |
|---------|-------------------|---------------------|------|----------|
| Unit tests: slots.ts | — | HIGH | LOW | P1 |
| Unit tests: isWithin24Hours | — | HIGH | LOW | P1 |
| Unit tests: Zod schemas | — | MEDIUM | LOW | P1 |
| Playwright: homepage smoke | — | HIGH | LOW | P1 |
| aria-invalid + aria-describedby on forms | HIGH (a11y) | — | LOW | P1 |
| role="alert" on global errors | HIGH (a11y) | — | LOW | P1 |
| sizes on all Image components | HIGH (perf) | — | LOW | P1 |
| Remove rescheduled status enum | — | MEDIUM | LOW | P1 |
| html lang="hu" verification | MEDIUM (a11y) | — | LOW | P1 |
| Playwright: booking wizard E2E | — | HIGH | HIGH | P2 |
| Playwright: self-service E2E | — | MEDIUM | MEDIUM | P2 |
| Focus management on step transitions | MEDIUM (a11y) | — | MEDIUM | P2 |
| role="grid" + arrow keys on calendar | MEDIUM (a11y) | — | MEDIUM | P2 |
| aria-live on slot loading region | MEDIUM (a11y) | — | LOW | P2 |
| optimizePackageImports config | MEDIUM (perf) | — | LOW | P2 |
| noUnusedLocals tsconfig flags | — | MEDIUM | LOW | P2 |
| ApiErrorResponse shared type | — | MEDIUM | LOW | P2 |
| Knip audit | — | LOW | LOW | P3 |
| Bundle analyzer audit | — | LOW | LOW | P3 |

**Priority key:**
- P1: Must ship in v2.1 — missing these means the site is not production-hardened
- P2: Should ship in v2.1 — meaningful improvement, tractable cost
- P3: Defer — useful but not time-sensitive; run ad-hoc when context allows

---

## Accessibility Context: Medical Sites

Medical websites carry heightened accessibility obligations compared to typical e-commerce or marketing sites. Specific considerations for this project:

**WCAG 2.1 AA is the legal minimum (globally).** HHS in the US requires WCAG 2.1 AA for healthcare websites with a May 2026 deadline. Hungary falls under EU accessibility directive (WAD), which also targets WCAG 2.1 AA. WCAG 2.2 AA (released October 2023) is an encouraged upgrade — the 9 new success criteria mostly affect mobile touch targets and focus indicators, both relevant to the booking wizard.

**Booking forms are the highest-risk area.** A patient who cannot complete the booking form due to an accessibility barrier is denied healthcare access — a more severe consequence than, say, a broken e-commerce checkout. Priority should be: form error announcement, focus management in multi-step wizard, keyboard-accessible calendar.

**The custom calendar is the most complex ARIA challenge.** A custom-built date picker that does not follow the ARIA grid pattern will fail automated and manual accessibility audits. The W3C ARIA Authoring Practices Guide defines the exact keyboard interaction pattern required: arrow keys navigate cells, Home/End go to first/last cell, PageUp/PageDown navigate months.

**Screen readers tested against:** For Hungarian-language content, screen reader behaviour with Hungarian text should be verified with NVDA + Firefox (most common in Central Europe) and VoiceOver + Safari on macOS/iOS. Particular attention to Hungarian date/time formatting which screen readers may render unexpectedly.

---

## Performance Context: Core Web Vitals for Medical Sites

Patient trust correlates with site speed. A slow medical website signals unprofessionalism. Specific to this stack:

**LCP target: under 2.5s on mobile.** The hero section has a large doctor image. HeroSection.tsx already has `priority` set — good. The risk is images without `sizes` causing the browser to download the full `srcset` variant when a smaller one would suffice.

**CLS target: under 0.1.** Missing `width`/`height` on images or `sizes` attribute mismatches cause layout shifts. Sanity CDN images need proper aspect ratios specified.

**INP (Interaction to Next Paint) target: under 200ms.** Motion v12 animations during step transitions can spike INP if not optimized. Use `will-change: transform` sparingly and prefer GPU-composited properties (transform, opacity) over layout-triggering ones (width, height, top, left).

**Bundle size target:** The current stack (Motion v12, googleapis, Sanity client, next-sanity) can add significant client-side JavaScript. `optimizePackageImports` for Motion and Sanity ensures only used exports are bundled. The admin dashboard imports googleapis server-side only — verify it never leaks to client bundles.

---

## Testing Architecture Decision

**Vitest for unit tests; Playwright for E2E. No React Testing Library.**

Rationale:
- Next.js 15 async Server Components cannot be rendered in JSDOM (Vitest limitation documented in official Next.js testing guide)
- The codebase's critical business logic lives in pure TypeScript functions (`slots.ts`, Zod schemas, `isWithin24Hours`) — these are ideal Vitest targets
- User flows that matter for confidence (booking, cancellation) require a real browser and real HTTP stack — Playwright is the right tool
- RTL adds significant mocking overhead for Sanity, auth, and Motion with minimal signal gain; the time investment is better spent on E2E coverage
- This matches the Next.js official testing guide recommendation: "we recommend using E2E tests for async components"

**Test data strategy for E2E:**
- Mock API responses at the network level with Playwright's `page.route()` for booking creation tests (avoids writing to production Sanity)
- Use Playwright's `storageState` fixture to pre-authenticate test sessions
- Smoke tests against staging deployment (Vercel preview URL) for homepage and public pages

---

## Sources

- [Next.js Testing Guide (official)](https://nextjs.org/docs/app/guides/testing) — HIGH confidence; official documentation
- [Next.js Vitest Setup (official)](https://nextjs.org/docs/app/guides/testing/vitest) — HIGH confidence; official documentation
- [Next.js Playwright Setup (official)](https://nextjs.org/docs/app/guides/testing/playwright) — HIGH confidence; official documentation
- [ARIA Grid Pattern — W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — HIGH confidence; W3C authoritative specification
- [ARIA Date Picker Dialog Pattern — W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) — HIGH confidence; W3C authoritative specification
- [WCAG 2.2 Complete Guide — AllAccessible](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025) — MEDIUM confidence; verified against W3C WCAG 2.2 spec
- [Healthcare Website Accessibility — AllAccessible](https://www.allaccessible.org/blog/healthcare-website-accessibility-hipaa-ada-compliance) — MEDIUM confidence; industry analysis with regulatory citations
- [HHS Accessibility Rule May 2026 — mwe.com](https://www.mwe.com/insights/may-2026-deadline-hhs-imposes-accessibility-standards-for-healthcare-company-websites-mobile-apps-kiosks/) — HIGH confidence; law firm analysis of HHS final rule
- [Next.js Image Optimization — official](https://nextjs.org/docs/app/api-reference/components/image) — HIGH confidence; official documentation
- [Sanity + Next.js Image Optimization — Medium Jan 2026](https://medium.com/@drazen.bebic/image-optimization-with-next-js-and-sanity-io-6956b9ceae4f) — MEDIUM confidence; current, practical, verified against official docs
- [Knip — official site](https://knip.dev/) — HIGH confidence; tool documentation
- [Knip: Dead Code Detection — Level Up Coding](https://levelup.gitconnected.com/dead-code-detection-in-typescript-projects-why-we-chose-knip-over-ts-prune-8feea827da35) — MEDIUM confidence; practical comparison
- [Next.js Package Bundling Guide — official](https://nextjs.org/docs/app/guides/package-bundling) — HIGH confidence; official documentation
- [Core Web Vitals Optimization Next.js 15 — makersden.io](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025) — MEDIUM confidence; 2025 article verified against Vercel KB

---

*Feature research for: Morocz Medical — v2.1 polish milestone (testing, performance, accessibility, code quality)*
*Researched: 2026-02-23*
