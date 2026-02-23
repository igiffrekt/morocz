# Pitfalls Research

**Domain:** Retrofitting testing, performance optimization, accessibility, and dead code removal into an existing Next.js 15 + Sanity v4 + Motion v12 medical booking site (v2.1 Polish milestone)
**Researched:** 2026-02-23
**Confidence:** HIGH (testing pitfalls verified against Next.js official docs and community reports; motion/a11y pitfalls confirmed via Motion official docs and WCAG 2.2; performance pitfalls confirmed against Vercel/Next.js official guidance; dead code pitfalls from direct codebase inspection)

> **Scope note:** This file supersedes the v2.0 PITFALLS.md for the v2.1 milestone. It covers pitfalls specific to *adding* testing, performance optimization, accessibility improvements, and dead code removal to the existing Morocz Medical codebase. The v2.0 pitfalls (double-booking, GDPR, auth, email) are resolved — this file focuses entirely on the quality hardening work. The codebase has zero existing test files, uses Motion v12 extensively for animated UI, Tailwind CSS v4 with CSS-first config, and Sanity v4 for all CMS content.

---

## Critical Pitfalls

### Pitfall 1: Testing Async Server Components With Vitest — It Doesn't Work

**What goes wrong:**
Developers install Vitest + React Testing Library and attempt to render Next.js async Server Components (like the homepage `page.tsx`, which calls `sanityFetch()` seven times in parallel). Vitest's jsdom environment cannot resolve async component trees — it throws `Error: Objects are not valid as a React child (found: object with keys {then})`. The entire component layer ends up untestable with unit tests, and developers waste days trying workarounds.

**Why it happens:**
React 19 async Server Components are not yet supported in Vitest's rendering pipeline. The Next.js docs (verified February 2026) explicitly state: "Since async Server Components are new to the React ecosystem, Vitest currently does not support them." Developers see Vitest recommended everywhere for Next.js and assume it covers all component types.

**How to avoid:**
Apply the correct tool to the correct component type:
- **Vitest + React Testing Library:** Unit test pure functions (`generateAvailableSlots`, date formatting helpers, Zod validation schemas) and synchronous Client Components (UI rendering, user interactions, state logic).
- **Playwright (E2E):** Test async Server Component behavior — booking flow, slot generation, calendar rendering, auth-gated pages, email trigger paths.
- **Do not attempt** to unit test `page.tsx` files that call `sanityFetch()` — test the data-fetching logic and the rendered output separately.

The split that works for this codebase:
```
Vitest: slots.ts (generateAvailableSlots), booking-email.ts, Zod schemas, Step1-4 rendering
Playwright: full booking wizard flow, /foglalas/:token management, admin dashboard auth
```

**Warning signs:**
- Attempting to `render(<HomePage />)` in a Vitest test
- Test file imports from `@/app/page.tsx` or any file with `export default async function`
- Error message: "async/await is not supported" or "Objects are not valid as a React child"

**Phase to address:** Testing phase, Day 1 — establish the testing boundary before writing any test files.

---

### Pitfall 2: Motion v12 Animations Break in jsdom — matchMedia and Web Animations API Missing

**What goes wrong:**
Any Vitest test that renders a component using `motion.div`, `AnimatePresence`, `useReducedMotion`, or `FadeIn` fails immediately with `TypeError: window.matchMedia is not a function`. This affects `BookingWizard`, `ServicesSection`, `HeroSection`, `IntroOverlay`, `CircleWipeLink`, and all section components. The entire component testing effort stalls because virtually every component in this codebase uses Motion.

**Why it happens:**
jsdom (the browser simulation layer used by Vitest) does not implement `window.matchMedia`. Motion's `useReducedMotion` hook calls `window.matchMedia("(prefers-reduced-motion: reduce)")` on initialization. The Web Animations API, which Motion v12 relies on for some features, is also absent from jsdom. Both are browser APIs with no jsdom equivalent.

**How to avoid:**
Add to the Vitest setup file (`vitest.setup.ts`):

```typescript
// Mock window.matchMedia — required for Motion v12's useReducedMotion hook
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, // Default: no reduced motion preference
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

For `AnimatePresence` tests specifically, use the `jsdom-testing-mocks` package which provides a more complete matchMedia mock that works with Motion's transition system. Alternatively, mock Motion entirely for component tests where animation behavior is not what's being tested:

```typescript
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<"div">) =>
      React.createElement("div", props, children),
    span: ({ children, ...props }: React.ComponentProps<"span">) =>
      React.createElement("span", props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => false,
}));
```

Use the full mock when testing non-animation concerns (step rendering, form validation). Use the real Motion with the matchMedia mock only when testing that animations render at all.

**Warning signs:**
- `TypeError: window.matchMedia is not a function` in test output
- Any Vitest test file that imports from `@/components/motion/*` or any section component
- Tests passing locally but failing in CI (where matchMedia may behave differently)

**Phase to address:** Testing phase setup — configure before writing the first component test.

---

### Pitfall 3: Dead Code Removal Accidentally Breaks Sanity Schema or Queries

**What goes wrong:**
Developers scan for unused TypeScript exports and remove what appears to be dead code. A Sanity schema field deleted from `sanity.types.ts` or a GROQ query removed from `queries.ts` turns out to be used by a path the TypeScript compiler cannot see: a Sanity webhook handler, a Studio component, or a GROQ query used in a cron job. The production site silently starts returning `null` for a field, or the cron reminder job stops finding appointments.

**Why it happens:**
TypeScript's static analysis cannot see runtime GROQ query usage. The `sanity.types.ts` file is auto-generated by `sanity typegen generate` — deleting things from it manually without deleting from the schema source causes drift. Fields that look unused in TypeScript may be used in Sanity Studio's visual editor preview. Biome's `noUnusedImports` rule flags imports as unused when they are used via re-exports or barrel files.

**How to avoid:**
Before removing any Sanity-related code, follow this audit sequence:

1. **Schema fields:** Search the entire codebase for the field name string in GROQ query strings (`grep -r "fieldName" --include="*.ts"`) — TypeScript cannot detect GROQ string references.
2. **Query files:** Before removing a query from `queries.ts`, verify no API route, cron handler, or webhook uses it.
3. **Generated types:** Never edit `sanity.types.ts` directly. Run `npm run typegen` after schema changes; let the generator determine what to include.
4. **Exports that look unused:** Check barrel files (`index.ts`) and the Sanity Studio configuration (`sanity.config.ts`) before removing.
5. **Run the build** after every dead code removal batch: `npm run build` catches TypeScript errors that grep misses.

The safe dead code removal checklist for this codebase:
- Unused route files: safe to delete if no `Link` or `router.push` points to them
- Orphan schema types with no documents in the dataset: safe after confirming zero document count in Sanity Studio
- `console.log` debug statements: safe to remove, verify not behind a conditional that masks real errors
- Commented-out code blocks: safe to remove after reading comments for context
- `code.html`, `home.zip`, `screen.png`, `original-efb0bbd3b6d6b5a7f4ac58d13f64c5ce.mp4` in root: safe to remove (design reference artifacts)

**Warning signs:**
- Removing a query from `queries.ts` without checking all API routes and cron handlers
- Editing `sanity.types.ts` manually instead of regenerating
- Dead code scanner reports that a Sanity schema field is unused
- Biome flags a type import as unused when it is imported by re-export

**Phase to address:** Dead code phase — before any removal, perform the grep audit. Remove in small batches with build verification after each batch.

---

### Pitfall 4: Performance Optimization Breaking Motion Animations via CLS

**What goes wrong:**
Developers add `width` and `height` attributes to all images (correct for CLS prevention) but accidentally add incorrect dimensions to images that Motion is animating. A `motion.div` with a fixed pixel size overrides the percentage-based responsive sizing from Tailwind, causing layout breaks on mobile. Alternatively, adding `loading="lazy"` to the hero doctor image (which has `priority` correctly set) removes the preload link and increases LCP — exactly the opposite of the goal.

**Why it happens:**
Performance optimization checklists say "add dimensions to all images" and "lazy load images below the fold." The existing code uses `next/image` with `priority` on the hero image, which is correct. Blind application of rules without understanding the existing setup causes regressions. Motion animations that use `layout` prop are particularly sensitive to parent container dimension changes.

**How to avoid:**
Before changing any image props, check these existing correct configurations:
- `HeroSection`: doctor image has `priority` — do NOT add `loading="lazy"`, do NOT change `width/height` without updating the Sanity urlFor builder dimensions to match
- `IntroOverlay`: SVG logo has `priority` — leave as-is
- `ServicesSection`: service icons use explicit `width={40} height={40}` — correct, no change needed
- `AnimatePresence mode="popLayout"` in `ServicesSection`: the `motion.div` wraps each service card with `layout="position"` — do not add fixed pixel dimensions that override the responsive grid sizing

For CLS prevention, verify these before adding dimensions:
```typescript
// These are already correct — do not touch:
<Image src={...} width={400} height={480} priority /> // Hero doctor image

// These may need size= prop for external Sanity images:
<Image src={sanityUrl} alt={...} width={80} height={80} /> // Already has dimensions
```

The animations that are most sensitive to dimension changes: `IntroOverlay` (slide-up full-screen), `CircleWipeLink` (clip-path circle expansion), `ServicesSection` `AnimatePresence` (layout animations). Treat these as "do not change container dimensions" zones.

**Warning signs:**
- Adding `loading="lazy"` to an image that has `priority={true}`
- Changing `width` or `height` on a `motion.div` that uses `layout` prop
- CLS score worsens after optimization pass (visible in Lighthouse or PageSpeed Insights)
- Animations that previously transitioned smoothly now "jump"

**Phase to address:** Performance optimization phase — audit existing image configuration before applying any blanket rules.

---

### Pitfall 5: Accessibility Changes Breaking Keyboard Navigation in the Booking Wizard

**What goes wrong:**
Developers add `aria-live="polite"` regions or programmatic focus management to improve screen reader support for the 4-step booking wizard. The focus management conflicts with Motion's `AnimatePresence` exit animations — focus is moved to a new element while the old element is still in its exit animation, causing screen readers to announce content from a component that is visually disappearing. Alternatively, adding `role="dialog"` to the wizard steps traps focus in a way that prevents users from reaching the step indicator or navigation buttons.

**Why it happens:**
WCAG 2.2 Focus Appearance (2.4.11) and Focus Visible (2.4.7) requirements lead developers to add aggressive focus management. In a standard form flow, moving focus on step change is correct. But `AnimatePresence mode="wait"` holds the exiting component in the DOM during its exit animation (250ms per the current config) — if focus is moved immediately on step change, the old step is still visible and still receives keyboard events during those 250ms.

**How to avoid:**
Delay focus management until after the Motion exit animation completes:

```typescript
// In BookingWizard — when changing steps:
function goToStep(next: number) {
  direction.current = next > currentStep ? 1 : -1;
  setCurrentStep(next);
  // Delay focus to step header until after exit animation (250ms + buffer)
  setTimeout(() => {
    document.getElementById(`step-${next}-heading`)?.focus({ preventScroll: true });
  }, 300); // 250ms animation + 50ms buffer
}
```

For the `aria-live` announcement region, place it outside the `AnimatePresence` wrapper so it is always in the DOM:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {/* Announce step changes here — updated on step change */}
  {`${currentStep}. lépés: ${STEP_LABELS[currentStep - 1]}`}
</div>
<AnimatePresence mode="wait">
  {/* step content */}
</AnimatePresence>
```

Do NOT add `role="dialog"` to individual wizard steps — the wizard is a multi-step form, not a dialog. Use `role="region"` with `aria-labelledby` pointing to the step heading.

**Warning signs:**
- Focus moves to a new element while the old `motion.div` is still in exit animation
- Screen reader announces step content twice (once from live region, once from focus move)
- Tab key stops working during an animation because focus was trapped in an exiting element
- `role="dialog"` added to BookingWizard or individual step components

**Phase to address:** Accessibility phase — test with NVDA/VoiceOver on the actual booking wizard before and after any focus management changes.

---

### Pitfall 6: IntroOverlay and CircleWipeLink Cannot Be Unit Tested — They Require Browser Context

**What goes wrong:**
Developers write unit tests for `IntroOverlay` and `CircleWipeLink`. Both components use `sessionStorage`, `document.body` (via `createPortal`), `usePathname`/`useRouter` (Next.js navigation hooks), and `useReducedMotion` (which requires `window.matchMedia`). Every test attempt fails with a different error depending on which browser API is called first. Time is wasted making them unit-testable via extensive mocking — and the mocks are so heavy they test nothing real.

**Why it happens:**
These are highly browser-coupled components. `IntroOverlay` reads from `sessionStorage` on mount to skip the animation on repeat visits. `CircleWipeLink` creates a portal on `document.body` and then calls `router.push()` on animation complete. Their core behavior — showing/hiding correctly, navigating after animation — is fundamentally integration-level behavior that requires real browser navigation.

**How to avoid:**
Do not write unit tests for `IntroOverlay` or `CircleWipeLink`. Instead:
- **IntroOverlay:** Test with Playwright — verify that on first visit, the overlay appears; on second visit (with sessionStorage populated), the overlay is skipped. This is the actual user-facing behavior.
- **CircleWipeLink:** Test with Playwright — click a link on the homepage and verify the circle wipe animation plays and navigation occurs. Test that `prefersReducedMotion` users navigate immediately without animation.
- Write a smoke test in Playwright that visits the homepage and confirms the overlay exits within 3 seconds.

If unit coverage is required for these components, test only the helper functions (`shouldWipe()` in CircleWipeLink) in isolation, not the full component.

**Warning signs:**
- Unit test for `IntroOverlay` with more than 5 `vi.mock()` calls
- `vi.mock("next/navigation", ...)` in a test file for `CircleWipeLink`
- Test passing because everything is mocked, testing nothing real about the component behavior

**Phase to address:** Testing phase — document which components are E2E-only tests before beginning.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Mocking Motion entirely in all unit tests | Tests run fast, no matchMedia issues | Never tests that animated components render anything real | Acceptable for tests focused on data/logic, not UI state |
| Using Playwright for all component tests | Everything works in real browser | Slow test suite; overkill for pure functions | Never — use Vitest for functions and logic |
| Skipping server component tests entirely | Avoids the async component problem | No automated confidence in Sanity data rendering | Acceptable — use Playwright E2E for these |
| Adding `aria-label` to everything | Quick WCAG audit pass | Verbose, redundant markup; screen readers read labels twice | Never — use only when the visible label is insufficient |
| Removing all `console.log`/`console.error` | Clean code appearance | Removes intentional error logging in fire-and-forget email paths | Never — preserve `console.error` in catch blocks |
| Setting `revalidate: 0` on all Sanity fetches | Simple, always-fresh data | Increases Sanity API usage; removes performance benefits of ISR for static content | Never for blog posts, services, testimonials — only for booking availability |
| Adding `loading="lazy"` to all images | Reduces initial JS | Breaks `priority` images; worsens LCP for above-the-fold content | Never override existing `priority={true}` images |
| Bundle analyzer as a one-time check | Quick win identification | Bundle grows back with each new dependency | Acceptable for v2.1; set up ongoing monitoring for v3+ |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Motion v12 + Vitest | Rendering any `motion.*` component causes `matchMedia` crash | Add `matchMedia` mock to `vitest.setup.ts`; or mock `motion/react` entirely |
| Motion v12 + accessibility | Moving focus immediately on `AnimatePresence` step change | Delay focus by `animationDuration + 50ms`; use `onAnimationComplete` callback |
| Next.js Image + Sanity CDN | Re-optimizing Sanity CDN images through Next.js image optimizer | Sanity CDN transforms images natively via `@sanity/image-url`; using `next/image` with Sanity URLs causes double-processing; configure a Sanity custom loader or accept the double-optimization |
| Next.js Image + priority | Adding `loading="lazy"` to image with `priority={true}` | They are mutually exclusive — `priority` implies eager + preload; `lazy` removes the preload link; the existing `priority` on the hero image is correct |
| Biome + dead code | `noUnusedImports` flagging Sanity type imports | Type-only imports used in GROQ queries may not be directly imported — verify with `grep` before removing |
| Playwright + Better Auth | E2E test can't authenticate because session cookies are HTTP-only | Use Playwright's `page.context().addCookies()` with a pre-seeded test session, or bypass auth in test environment with a dedicated test route |
| Playwright + Motion animations | Playwright clicks fail because element is in Motion exit animation | Use `page.waitForSelector()` or add `data-testid` attributes after animation completes; set `animationDuration = 0` in Playwright test config via `prefers-reduced-motion` media feature |
| Sanity v4 + bundle analyzer | `@sanity/client` and related packages show as large in bundle | Sanity client should be server-only — verify it does not appear in the client bundle; `sanity` package is correctly server-side in this codebase |
| Tailwind v4 + PurgeCSS | Tailwind v4 uses CSS-first config — external PurgeCSS tools may strip `@theme` tokens | Do not run PurgeCSS on the Tailwind output; Tailwind v4's JIT handles purging natively |
| `@sanity/image-url` + `next/image` | `sizes` prop missing on Sanity images causes browser to download full-resolution image | Add `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` to all Sanity images that are not full-width |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Motion animations causing layout shift | CLS score high; content jumps during animation | Use `transform` and `opacity` only (already correct in codebase); avoid animating `width`, `height`, `padding`, `margin` | Immediately when dimension-based animation is added |
| Sanity image URL built without explicit dimensions | LCP image is full-resolution (10MB+); slow load | Always call `.width(N).height(M)` on `urlFor()` builder before `.url()` | Immediately on mobile; masked on fast connections |
| `googleapis` package in client bundle | Client JS bundle grows by ~800KB | Verify `googleapis` is only imported in API routes and lib files, never in `"use client"` components | Immediately if imported in client component |
| `force-dynamic` on every API route | Every API route opt-out of static optimization | Already correct for booking/cron routes; do not add to static data routes | At scale — increases Vercel function invocations |
| Sanity `sanityFetch` with default `revalidate` on booking data | Stale slot availability; patients see already-booked slots | Booking/slot queries must use `{ next: { revalidate: 0 } }` | From the moment two concurrent users interact |
| Missing `sizes` prop on responsive `next/image` | Browser downloads 3x larger image than needed | Add `sizes` prop matching the CSS max-width breakpoints | On mobile devices with slow connections |
| Testimonials carousel without virtualization | All testimonial DOM nodes in memory | For a small practice (<20 testimonials), this is acceptable | At >50 testimonials |
| Homepage fetching 7 Sanity queries sequentially | Page TTFB increases by sum of all query latencies | Already parallelized with `Promise.all` — do not refactor to sequential | N/A — already handled correctly |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Adding test environment variables to `.env` that include real Sanity write token | Test suite uses production Sanity dataset; test data written to real database | Use a separate Sanity test dataset with its own token; or mock the Sanity client entirely in tests |
| Playwright tests that run against production URL | Real bookings created; real emails sent during CI | Configure Playwright with a local dev server (`webServer: { command: "npm run dev" }`); never point E2E tests at production |
| Dead code removal deleting error handling code that "looks unused" | Silent failures in previously-covered paths | The `catch` blocks in fire-and-forget email sends are intentionally minimal — do not remove |
| Removing the `CRON_SECRET` auth check while "simplifying" cron route | Cron endpoint becomes publicly callable; anyone can trigger reminder emails | The `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` check in `/api/cron/reminders/route.ts` must never be removed |
| Accessibility audit tools revealing patient data in aria labels | Screen readers verbalize patient names in shared spaces | Do not add aria labels that include patient PII; use generic labels like "Időpont részletei" not "Kovács Mária foglalása" |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Adding visible focus rings that conflict with Motion hover animations | Focus ring and hover animation fight each other visually | Use `:focus-visible` (not `:focus`) so rings only appear on keyboard navigation, not mouse click |
| Over-zealous `aria-live="assertive"` on step changes | Screen reader interrupts user's current reading to announce every step | Use `aria-live="polite"` for step announcements; only use "assertive" for errors |
| Performance optimizations that delay step transition animations | Booking wizard feels sluggish after optimization | The 250ms step transition in BookingWizard is already fast — do not reduce further; this is intentional UX |
| Adding `tabIndex` to `motion.div` wrappers that contain interactive children | Tab order becomes unpredictable; users navigate to container before its children | Only add `tabIndex` to actually interactive elements; `motion.div` wrappers should not be focusable |
| Screen reader announcing animation status | NVDA/JAWS reads "Animating... Animated..." for every motion element | Add `aria-hidden="true"` to purely decorative animated elements (badges, background animations) |
| Removing the intro overlay's reduced-motion path as "dead code" | Users with vestibular disorders get the full animation even with OS reduced motion preference set | The `prefersReducedMotion` check in `IntroOverlay` is a required accessibility feature, not dead code |

---

## "Looks Done But Isn't" Checklist

- [ ] **Motion mock complete:** Run the full Vitest suite — zero `matchMedia` errors in output even for component tests that don't use Motion.
- [ ] **Async server component boundary respected:** No Vitest test file imports from any `page.tsx` or `layout.tsx` file.
- [ ] **Dead code grep audit done:** For every removed Sanity field/query, confirm with `grep -r "fieldName" src/` that no GROQ string reference exists.
- [ ] **Build passes after each removal batch:** `npm run build` succeeds after every dead code removal session (not just at the end).
- [ ] **Hero image LCP not worsened:** After optimization, run Lighthouse on production — LCP must not be worse than pre-optimization baseline.
- [ ] **Intro animation still plays after performance pass:** Visit the site in incognito (clears sessionStorage) and verify the intro overlay plays correctly.
- [ ] **Circle wipe still fires on homepage navigation:** Click a `CircleWipeLink` — pink circle wipe animation must cover the screen before navigation.
- [ ] **ServicesSection AnimatePresence still works:** Click category tabs — service cards must animate in/out with `AnimatePresence mode="popLayout"`.
- [ ] **Booking wizard keyboard accessible:** Complete the entire 4-step booking flow using only keyboard — Tab, Enter, Space, arrow keys.
- [ ] **Reduced motion respected:** Set OS to "reduce motion" — verify `IntroOverlay` shows brief fade instead of full sequence; `CircleWipeLink` navigates immediately.
- [ ] **No `console.error` removed from catch blocks:** The fire-and-forget email sends in booking/reschedule routes must retain their `console.error` logging.
- [ ] **`CRON_SECRET` check intact:** Verify `src/app/api/cron/reminders/route.ts` still has the `authHeader` check on line ~74.
- [ ] **Playwright E2E covers booking flow:** At minimum one E2E test completes a booking from step 1 to success, and one verifies the `/foglalas/:token` cancel flow.
- [ ] **No Sanity types manually edited:** `sanity.types.ts` was regenerated with `npm run typegen`, not hand-edited.
- [ ] **Priority images untouched:** `HeroSection` doctor image and `IntroOverlay` logo still have `priority` prop; no `loading="lazy"` added to them.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Vitest tests written for async server components that don't work | LOW | Delete those test files; write Playwright E2E equivalents; takes 1-2 hours to rewrite |
| Dead code removal broke Sanity queries | MEDIUM | Run `git diff` to find removed queries; restore from git; re-run the grep audit; takes 30-60 min |
| Performance optimization broke animations | LOW-MEDIUM | `git diff` identifies the breaking change; revert image dimension changes; re-run Lighthouse; 1-2 hours |
| Accessibility changes broke booking wizard keyboard flow | MEDIUM | Revert focus management changes; implement delayed focus pattern; retest with screen reader; 2-4 hours |
| matchMedia mock not added — entire test suite fails | LOW | Add mock to `vitest.setup.ts`; all tests should pass immediately after |
| Playwright tests trigger real Sanity writes in production | HIGH | Immediately purge test bookings from Sanity Studio; set `webServer` config in Playwright to use local dev; rotate any exposed tokens |
| `CRON_SECRET` check accidentally removed | HIGH | Restore from git immediately; redeploy; check Vercel logs for unauthorized cron invocations |

---

## Pitfall-to-Phase Mapping

| Pitfall | Severity | Prevention Phase | Verification |
|---------|----------|------------------|--------------|
| Vitest cannot test async Server Components | CRITICAL | Testing setup — Day 1 | No test file imports `page.tsx`; Playwright covers async components |
| Motion v12 breaks jsdom tests | CRITICAL | Testing setup — before first component test | Full Vitest suite runs with zero matchMedia errors |
| Dead code removal breaks Sanity queries | HIGH | Dead code phase — before each removal batch | Grep audit complete; `npm run build` passes after removal |
| Performance optimization breaks Motion animations | HIGH | Performance phase — before image changes | Lighthouse CLS score not worsened; animations manual-verified |
| Accessibility focus management conflicts with AnimatePresence | HIGH | Accessibility phase — before focus management changes | Keyboard navigation through booking wizard works end-to-end |
| IntroOverlay/CircleWipeLink unit-tested with heavy mocks | MEDIUM | Testing setup | No test for these components in Vitest; Playwright E2E covers them |
| `loading="lazy"` added to priority hero image | HIGH | Performance phase — during image audit | Lighthouse LCP not worsened; hero image has `priority` prop |
| CRON_SECRET check removed as "dead code" | CRITICAL | Dead code phase — before cron route changes | Auth check present in route; unauthorized POST returns 401 |
| Playwright tests hitting production URL | CRITICAL | Testing setup — CI configuration | `webServer` config in `playwright.config.ts`; no real bookings created in CI |
| Reduced-motion path in IntroOverlay deleted | HIGH | Dead code phase — before animation code review | Overlay shows brief fade when OS "reduce motion" is enabled |
| Tailwind v4 custom tokens broken by dead CSS removal | MEDIUM | Performance/dead code phase | `npm run build` passes; site renders with correct brand colors |

---

## Sources

- [Next.js Testing Guide — Vitest (official)](https://nextjs.org/docs/app/guides/testing/vitest) — HIGH confidence — explicitly states async Server Components not supported in Vitest; recommends Playwright for these
- [Running Tests with RTL and Vitest on Async Server Components — Aurora Scharff](https://aurorascharff.no/posts/running-tests-with-rtl-and-vitest-on-internationalized-react-server-components-in-nextjs-app-router/) — MEDIUM confidence — practitioner guide confirming the async server component limitation and workaround patterns
- [Motion Accessibility Guide — motion.dev/docs/react-accessibility](https://motion.dev/docs/react-accessibility) — MEDIUM confidence (page content was CSS-heavy; confirmed via `useReducedMotion` hook usage in codebase)
- [Mock window.matchMedia in Vitest — rebeccamdeprey.com](https://rebeccamdeprey.com/blog/mock-windowmatchmedia-in-vitest) — MEDIUM confidence — confirmed pattern; widely referenced in community
- [jsdom-testing-mocks — npm](https://www.npmjs.com/package/jsdom-testing-mocks) — MEDIUM confidence — package for AnimatePresence testing in jsdom; includes matchMedia mock
- [Mocking Framer Motion with Jest — hectane.com](https://www.hectane.com/blog/mock-framer-motion-with-jest) — MEDIUM confidence — pattern applies to Motion v12 / Vitest with `vi.mock` instead of `jest.mock`
- [10 Common Next.js Mistakes That Hurt Core Web Vitals — pagepro.co](https://pagepro.co/blog/common-nextjs-mistakes-core-web-vitals/) — MEDIUM confidence — verified against Next.js image docs
- [Optimizing Core Web Vitals 2024 — Vercel KB](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024) — HIGH confidence — official Vercel guidance on LCP, CLS, INP
- [Image Optimization with Next.js and Sanity.io — Medium, January 2026](https://medium.com/@drazen.bebic/image-optimization-with-next-js-and-sanity-io-6956b9ceae4f) — MEDIUM confidence — practical guide on Sanity CDN + next/image integration pitfalls
- [WCAG 2.2 Keyboard Navigation — accesify.io](https://www.accesify.io/blog/keyboard-navigation-focus-wcag/) — MEDIUM confidence — focus management requirements that inform the AnimatePresence conflict pitfall
- [Accessible Modals and Dialogs — thewcag.com](https://www.thewcag.com/examples/modals-dialogs) — MEDIUM confidence — focus management on dynamic content opening/closing
- [React Accessibility Best Practices — allaccessible.org](https://www.allaccessible.org/blog/react-accessibility-best-practices-guide) — MEDIUM confidence — `:focus-visible` vs `:focus` guidance
- [Tailwind CSS v4 Unused Styles Issue — GitHub Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/16634) — MEDIUM confidence — confirms Tailwind v4 CSS-first approach; JIT handles purging; external PurgeCSS unsafe
- [Better Auth Next.js Integration — better-auth.com](https://www.better-auth.com/docs/integrations/next) — HIGH confidence — confirms `getSessionCookie()` for middleware; `auth.api.getSession()` for full validation
- [How to mock better-auth with MSW — GitHub Discussion](https://github.com/better-auth/better-auth/discussions/4230) — LOW confidence (limited community discussion) — confirms Better Auth mocking is non-trivial; Playwright with real auth flow recommended
- Direct codebase inspection: `src/lib/slots.ts`, `src/components/motion/IntroOverlay.tsx`, `src/components/motion/CircleWipeLink.tsx`, `src/components/booking/BookingWizard.tsx`, `src/app/api/cron/reminders/route.ts` — HIGH confidence (first-party)

---
*Pitfalls research for: Morocz Medical v2.1 — Testing, Performance, Accessibility, Dead Code Removal*
*Researched: 2026-02-23*
