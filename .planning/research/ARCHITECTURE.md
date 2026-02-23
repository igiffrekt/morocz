# Architecture Research

**Domain:** Testing, performance optimization, and accessibility hardening — Next.js 15 App Router + Sanity v4 + Vercel
**Researched:** 2026-02-23
**Confidence:** HIGH for testing patterns / HIGH for performance / MEDIUM for accessibility tooling integration specifics

---

## Standard Architecture

### System Overview — v2.1 Hardening Layer on Existing v2.0 System

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     TEST SUITE (src/__tests__/ + e2e/)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  Unit (Vitest + RTL)         Integration (NTARH + Vitest)   E2E (Playwright) │
│  ├── lib/slots.ts            ├── api/slots/route.ts         ├── booking flow  │
│  ├── lib/booking-email.ts    ├── api/booking/route.ts       ├── admin login   │
│  └── pure utility fns        ├── api/booking-cancel        └── accessibility │
│                              └── api/booking-reschedule                       │
└──────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     EXISTING APP (unchanged structure)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  Server Components        Client Components        API Routes                 │
│  (async, not unit-        (Vitest + RTL unit       (NTARH integration         │
│   testable — use E2E)      testable with mocks)     tests)                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities — v2.1 Additions

| Layer | Tool | Responsibility | What It Tests |
|-------|------|----------------|---------------|
| Unit | Vitest + RTL | Isolated pure functions and Client Components | `generateAvailableSlots`, `getAvailableDatesInRange`, email builders, form validation logic |
| Integration | NTARH + Vitest | API Route Handlers with mocked external deps | `/api/slots`, `/api/booking`, `/api/booking-cancel`, `/api/booking-reschedule` |
| E2E | Playwright | Full user journeys in real browser | Booking flow 4 steps, admin login, accessibility violations via axe |
| Performance | @next/bundle-analyzer | Bundle size visibility | Chunk sizes, large deps, unnecessary client JS |
| Image | next/image | LCP optimization, Sanity CDN | Doctor photo, service icons, lab test images |
| Accessibility | @axe-core/playwright | WCAG 2.2 AA automated scan | Booking form, admin dashboard, homepage |
| Motion a11y | MotionConfig reducedMotion="user" | Already implemented — verify works | System reduced-motion preference respected |

---

## Recommended Project Structure (additions only)

```
morocz/
├── __tests__/                    # NEW — unit and integration tests
│   ├── lib/
│   │   ├── slots.test.ts         # generateAvailableSlots, getAvailableDatesInRange
│   │   └── booking-email.test.ts # buildConfirmationEmail, buildReminderEmail
│   └── api/
│       ├── slots.test.ts         # GET /api/slots via NTARH
│       ├── booking.test.ts       # POST /api/booking via NTARH
│       ├── booking-cancel.test.ts
│       └── booking-reschedule.test.ts
├── e2e/                          # NEW — Playwright E2E tests
│   ├── booking-flow.spec.ts      # Full 4-step booking wizard
│   ├── admin-login.spec.ts       # Admin authentication
│   ├── accessibility.spec.ts     # axe scans on key pages
│   └── auth/
│       └── setup.ts              # Auth state setup (storageState)
├── playwright.config.ts          # NEW — Playwright config
├── vitest.config.mts             # NEW — Vitest config
└── src/
    └── (all existing files, no structure change)
```

### Structure Rationale

- **`__tests__/`:** Mirrors `src/` directory structure. Vitest is configured to look here plus any `*.test.ts` files colocated in `src/`. Co-location is valid but top-level `__tests__/` keeps test files visually separate from production code — preferred for this project size.
- **`e2e/`:** Playwright tests at root level, separate from unit tests. Different runner, different config, different CI step.
- **`e2e/auth/setup.ts`:** Playwright auth state setup runs once before tests that need a logged-in user, saving cookies to a file. Tests that need auth depend on this setup project. Tests that do not need auth run without it.

---

## Architectural Patterns

### Pattern 1: Three-Layer Test Strategy

**What:** Unit tests for pure functions, integration tests for API routes, E2E tests for async Server Components and full user flows. Never try to unit test async Server Components — use E2E.

**When to use:** The only viable strategy for Next.js 15 App Router. Vitest cannot execute async Server Components (they use RSC wire format); Playwright runs a real browser against a real Next.js dev server.

**Trade-offs:** More infrastructure than a single test runner. Worth it because each layer tests what it can test best. Playwright is slower but covers the async server layer that no other tool can reach.

**Mapping to this codebase:**

```
src/lib/slots.ts                 → Vitest unit tests (pure functions, no deps)
src/lib/booking-email.ts         → Vitest unit tests (string-building functions)
src/app/api/slots/route.ts       → NTARH integration tests (mocks sanityFetch)
src/app/api/booking/route.ts     → NTARH integration tests (mocks auth, sanityFetch, Sanity write client)
src/app/idopontfoglalas/page.tsx → Playwright E2E (async Server Component — no unit test possible)
src/components/booking/BookingWizard.tsx → Playwright E2E preferred; RTL unit possible for step logic
```

### Pattern 2: Module Mocking Strategy for API Route Tests

**What:** Use `vi.mock()` to replace external dependencies (sanityFetch, Sanity write client, Better Auth, email) with deterministic stubs. API routes are tested in isolation from Sanity and Gmail.

**When to use:** All integration tests via NTARH. Mocking lets tests run without real Sanity credentials, run fast, and produce consistent results.

**Trade-offs:** Mocks can drift from real behavior. Mitigate by keeping mocks minimal — only stub what the test cannot control (external HTTP calls, auth sessions), not internal logic.

**Pattern:**

```typescript
// __tests__/api/slots.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { testApiHandler } from 'next-test-api-route-handler'

// Hoist mocks before imports (required by Vitest)
const mockSanityFetch = vi.hoisted(() => vi.fn())

vi.mock('@/sanity/lib/fetch', () => ({
  sanityFetch: mockSanityFetch,
}))

// Import handler AFTER vi.mock calls
import * as handler from '@/app/api/slots/route'

describe('GET /api/slots', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 when date param is missing', async () => {
    await testApiHandler({
      appHandler: handler,
      url: '/api/slots?serviceId=abc123',
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(400)
      },
    })
  })

  it('returns available slots for a valid working day', async () => {
    mockSanityFetch
      .mockResolvedValueOnce(mockSchedule)   // weeklyScheduleQuery
      .mockResolvedValueOnce(mockBlocked)    // blockedDatesQuery
      .mockResolvedValueOnce([])             // bookingsForDateQuery
      .mockResolvedValueOnce([])             // slotLocksForDateQuery
      .mockResolvedValueOnce(mockService)    // serviceByIdQuery

    await testApiHandler({
      appHandler: handler,
      url: '/api/slots?date=2026-03-16&serviceId=service-123',
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.slots).toBeInstanceOf(Array)
        expect(body.slots.length).toBeGreaterThan(0)
      },
    })
  })
})
```

### Pattern 3: Playwright Auth State Reuse

**What:** Log in once during a Playwright "setup" project, save the session cookie to a JSON file, and load that file as storageState in tests that require authentication. Tests that test public pages don't load any auth state.

**When to use:** Any E2E test touching `/admin`, `/foglalas/:token`, or the confirmation step of the booking wizard (which requires auth).

**Trade-offs:** Setup adds ~5 seconds once per test run. Dramatically faster than logging in inside every test. Auth state file must be gitignored.

**Config:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // Setup: log in once, save session
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Admin tests reuse auth state
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/auth/.admin-auth.json',
      },
      dependencies: ['setup'],
      testMatch: /admin.*.spec.ts/,
    },
    // Public tests run without auth
    {
      name: 'public-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /(?!admin).*.spec.ts/,
    },
  ],
})
```

```typescript
// e2e/auth/setup.ts
import { test as setup } from '@playwright/test'

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/admin')
  await page.getByLabel('E-mail').fill(process.env.ADMIN_EMAIL!)
  await page.getByLabel('Jelszó').fill(process.env.ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Bejelentkezés' }).click()
  await page.waitForURL('/admin')
  await page.context().storageState({ path: 'e2e/auth/.admin-auth.json' })
})
```

### Pattern 4: Accessibility Scanning with axe + Playwright

**What:** Add `@axe-core/playwright` to Playwright E2E tests. Scan critical pages after navigation and assert that violations array is empty. Run alongside functional tests, not as a separate suite.

**When to use:** Every route that has user-facing HTML. Priority: homepage, booking wizard (all 4 steps), admin dashboard, booking management page.

**Trade-offs:** axe catches ~30-40% of WCAG issues automatically. Manual testing is still needed for focus order, screen reader announcements, and color contrast edge cases. axe is a floor, not a ceiling.

**Pattern:**

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility — homepage', () => {
  test('no WCAG 2.2 AA violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('Accessibility — booking wizard step 1', () => {
  test('service selection step is accessible', async ({ page }) => {
    await page.goto('/idopontfoglalas')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})
```

### Pattern 5: Sanity CDN + next/image for LCP

**What:** All Sanity-hosted images go through next/image with explicit `width`, `height`, `sizes`, and `priority` on the LCP image (the doctor photo in the hero). next/image handles AVIF/WebP negotiation and serves from Vercel's image optimization CDN.

**When to use:** Every `<img>` tag sourcing from `cdn.sanity.io`. Currently the project uses `imageUrlBuilder` from `@sanity/image-url` to generate URLs — pass those URLs as `src` to `next/image`.

**Trade-offs:** next/image requires explicit `width` and `height` props to prevent CLS. For Sanity images, get these from `@sanity/asset-utils` `getImageDimensions()`. The LCP image must have `priority` — without it, Next.js lazy-loads it, tanking LCP score.

**Pattern:**

```typescript
// src/components/sections/HeroSection.tsx (modified)
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { getImageDimensions } from '@sanity/asset-utils'
import { client } from '@/sanity/lib/client'

const builder = imageUrlBuilder(client)

export function SanityImage({
  asset,
  alt,
  priority = false,
  sizes = '100vw',
  className,
}: {
  asset: SanityImageAsset
  alt: string
  priority?: boolean
  sizes?: string
  className?: string
}) {
  const { width, height } = getImageDimensions(asset)
  const url = builder.image(asset).auto('format').fit('max').url()

  return (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  )
}
```

### Pattern 6: Bundle Analysis Workflow

**What:** `@next/bundle-analyzer` wraps the Next.js webpack config. Run with `ANALYZE=true npm run build` to generate interactive treemaps of the client, server, and edge bundles. Identify Client Components pulling in large dependencies unnecessarily.

**When to use:** As a diagnostic step at the start of performance work, then again after each optimization to verify improvement.

**Trade-offs:** Adds a dev dependency and a wrapper in `next.config.ts`. Zero runtime overhead — analyzer only runs when `ANALYZE=true`. Output files go to `.next/analyze/` — gitignore these.

**Config:**

```typescript
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
    formats: ['image/avif', 'image/webp'], // add AVIF support
  },
}

export default bundleAnalyzer(nextConfig)
```

---

## Data Flow

### Test Execution Flow

```
npm run test (Vitest)
    ├── __tests__/lib/slots.test.ts
    │       └── imports generateAvailableSlots directly — no mocks needed (pure function)
    │
    └── __tests__/api/booking.test.ts
            ├── vi.mock('@/sanity/lib/fetch') → stub returns deterministic data
            ├── vi.mock('@/lib/auth') → stub returns logged-in session or null
            ├── vi.mock('@/lib/sanity-write-client') → stub .create(), .patch(), .commit()
            ├── vi.mock('@/lib/email') → stub sendEmail (no real Gmail calls)
            └── testApiHandler({ appHandler: handler, ... })
                    → executes the real route handler with real Zod validation
                    → external calls go to stubs
                    → assertions on HTTP status + response body
```

```
npm run test:e2e (Playwright)
    ├── [setup] e2e/auth/setup.ts
    │       └── real browser logs in → saves .admin-auth.json cookie state
    │
    ├── [public-chromium] e2e/booking-flow.spec.ts
    │       └── real browser → real Next.js dev server → real Sanity read API
    │           (booking wizard steps; does NOT create real bookings — uses test service)
    │
    └── [admin-chromium] e2e/accessibility.spec.ts
            └── loads admin auth state → navigates pages → axe scans
```

### Performance Optimization Flow

```
ANALYZE=true npm run build
    ↓
Browser opens .next/analyze/client.html
    ↓
Identify: large Client Component chunks, Sanity Studio leaking into public bundle,
          motion/react unnecessarily bundled in Server Components, googleapis client-side
    ↓
Apply fixes:
    ├── dynamic import heavy Client Components (AdminCalendar, ReschedulePanel)
    ├── mark MotionProvider as 'use client' if not already
    └── verify googleapis only in server-side code
    ↓
Re-run: ANALYZE=true npm run build → confirm chunk sizes reduced
    ↓
Lighthouse / Vercel Speed Insights: verify Core Web Vitals improvement
```

### Key Data Flows

1. **Slot generation test:** Pure function → Vitest → no I/O. Input: schedule object + booked slots + date. Output: string array. 100% deterministic.

2. **API route integration test:** NTARH creates a test server → real Next.js route handler runs → `sanityFetch` calls hit mocks → response asserted. Tests auth checks, Zod validation, business logic — everything except real Sanity/Gmail.

3. **Booking E2E test:** Playwright controls real Chrome → navigates to `/idopontfoglalas` → interacts with real BookingWizard → reads real Sanity slots data. Tests the full Server Component + Client Component + API Route stack together.

4. **Accessibility scan:** Playwright navigates to page → waits for network idle → AxeBuilder injects axe-core → scans DOM → returns violations array → test fails if any violation found.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single practice) | All three test layers as described; Playwright runs against `npm run start` (production build) in CI |
| Growing team | Add test fixtures/factories for Sanity mock data; increase Playwright parallelism |
| Multiple practices | Extract slot generator to a tested npm package; E2E tests per tenant environment |

### Scaling Priorities

1. **First bottleneck — slow E2E suite:** Playwright tests against `npm start` are slow because they need a build. Use `npm run dev` for local runs with `reuseExistingServer: true`. CI always uses production build.
2. **Second bottleneck — flaky auth in E2E:** Auth state cookies expire. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as CI environment variables; the setup project re-authenticates on every CI run.

---

## Anti-Patterns

### Anti-Pattern 1: Unit Testing Async Server Components

**What people do:** Try to import and `render()` an async Server Component with React Testing Library or Vitest.

**Why it's wrong:** Async Server Components return RSC payloads, not standard React trees. Vitest's jsdom environment cannot execute them. Tests will fail with cryptic errors about async generators or missing RSC context.

**Do this instead:** Use Playwright E2E tests for any component that is `async function Page()` or `async function Layout()`. Unit test the underlying data-fetching functions and pure functions they use — not the component itself.

### Anti-Pattern 2: Skipping the NTARH Library for Route Handler Tests

**What people do:** Try to manually construct `Request` objects and call route handler functions directly with `handler.GET(new Request(...))`.

**Why it's wrong:** Next.js Route Handlers use `next/headers` (cookies, headers functions) that require Next.js internal context. Direct calls fail because that context is not set up. Mock setup becomes complex.

**Do this instead:** Use `next-test-api-route-handler`. It wraps Next.js internals to provide the correct context, handles `headers()` / `cookies()` out of the box, and makes mocking auth much simpler.

### Anti-Pattern 3: AVIF-Only in next.config.ts Without WebP Fallback

**What people do:** Set `formats: ['image/avif']` expecting maximum compression without understanding browser support.

**Why it's wrong:** AVIF is not supported in all browsers (notably older Safari). Without the WebP fallback, those users receive the original format from the Sanity CDN (likely JPEG), losing all optimization.

**Do this instead:** `formats: ['image/avif', 'image/webp']` — Next.js serves AVIF to browsers that accept it, WebP to the rest, and the original as a last resort. This is the correct order.

### Anti-Pattern 4: Running axe on Animated Pages Before Animation Settles

**What people do:** Navigate to a page with Motion animations and immediately run axe, getting false positives because animated elements are mid-transition (wrong opacity, off-screen transforms).

**Why it's wrong:** Elements being animated may temporarily have accessibility violations that disappear when animation completes (e.g., opacity 0 elements still in DOM). axe may flag them.

**Do this instead:** Wait for network idle and add a short explicit wait after navigation before running axe scan. Use `await page.waitForLoadState('networkidle')` then optionally `await page.waitForTimeout(500)` for animations to settle.

### Anti-Pattern 5: Forgetting `priority` on the LCP Image

**What people do:** Use `next/image` on all images but omit `priority` on the hero doctor photo, not realizing it defaults to lazy loading.

**Why it's wrong:** The hero doctor image is typically the Largest Contentful Paint element. Lazy loading it causes Next.js to defer its fetch until the image enters the viewport — for a hero image this means LCP triggers only after the initial render, dramatically hurting the LCP score.

**Do this instead:** Add `priority` prop to exactly one image per page — the one that is the LCP element. For the homepage, that is the hero doctor photo. For service detail pages, it would be the first image in the hero.

---

## Integration Points

### New vs. Existing — What Changes

| File | Status | Change |
|------|--------|--------|
| `next.config.ts` | Modified | Add `@next/bundle-analyzer` wrapper + `formats: ['image/avif', 'image/webp']` |
| `src/components/sections/HeroSection.tsx` | Modified | Add `priority` to LCP image; use `<Image>` from `next/image` if not already |
| `src/components/motion/MotionProvider.tsx` | Unchanged | Already has `reducedMotion="user"` — correct |
| `package.json` | Modified | Add test scripts: `"test": "vitest"`, `"test:e2e": "playwright test"` |
| `vitest.config.mts` | New | Vitest config with jsdom environment, `vite-tsconfig-paths` for `@/` aliases |
| `playwright.config.ts` | New | Playwright config with webServer, projects (setup + admin + public) |
| `__tests__/lib/slots.test.ts` | New | Unit tests for `generateAvailableSlots` and `getAvailableDatesInRange` |
| `__tests__/api/slots.test.ts` | New | Integration tests for GET /api/slots via NTARH |
| `__tests__/api/booking.test.ts` | New | Integration tests for POST /api/booking via NTARH |
| `e2e/booking-flow.spec.ts` | New | Playwright E2E for booking wizard |
| `e2e/accessibility.spec.ts` | New | Playwright axe scans for all major pages |
| `e2e/auth/setup.ts` | New | Admin auth setup (storageState) |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sanity Content Lake | Mocked in unit/integration tests via `vi.mock('@/sanity/lib/fetch')` | Real Sanity calls only in E2E tests |
| Better Auth | Mocked in API route tests via `vi.mock('@/lib/auth')` returning stub session | E2E tests use real Better Auth with storageState |
| Gmail API | Mocked in API route tests via `vi.mock('@/lib/email')` | Never call real Gmail in tests |
| Vercel Speed Insights | No test changes — passive monitoring in production | Check post-deployment via Vercel dashboard |
| Vercel Image CDN | No mock needed — `next/image` with `cdn.sanity.io` remotePattern already configured | E2E tests load optimized images from Vercel |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `__tests__/` ↔ `src/lib/slots.ts` | Direct TypeScript import | No mocking needed — pure functions |
| `__tests__/api/` ↔ route handlers | Via NTARH `testApiHandler` | NTARH provides Next.js runtime context |
| `e2e/` ↔ Next.js dev server | HTTP via Playwright browser | Playwright config starts the server automatically |
| Vitest config ↔ `tsconfig.json` | `vite-tsconfig-paths` plugin reads existing tsconfig | No duplicate alias config needed |
| Biome v2 ↔ test files | Biome's test domain auto-detects Vitest from `package.json` deps | No extra Biome config needed for test files |

---

## Build Order (considering hard dependencies)

Test infrastructure has clear dependency chains. Build in this order:

**Phase A: Unit test foundation (no server needed)**

1. Install Vitest dependencies: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`
2. Create `vitest.config.mts` with jsdom environment and `vite-tsconfig-paths` plugin
3. Add `"test": "vitest"` and `"test:ci": "vitest run"` scripts to `package.json`
4. Write `__tests__/lib/slots.test.ts` — tests for `generateAvailableSlots` and `getAvailableDatesInRange`
5. Write `__tests__/lib/booking-email.test.ts` — tests for email HTML builder functions
6. Run `npm test` — these should pass immediately (pure functions, no mocks)

**Phase B: API route integration tests (depends on Phase A)**

7. Install NTARH: `next-test-api-route-handler`
8. Write `__tests__/api/slots.test.ts` — mock `sanityFetch`, test GET /api/slots validation + response
9. Write `__tests__/api/booking.test.ts` — mock `auth`, `sanityFetch`, write client, `email`; test POST /api/booking
10. Write `__tests__/api/booking-cancel.test.ts` and `booking-reschedule.test.ts`
11. Run `npm test` — all unit + integration pass

**Phase C: Performance audit (independent of testing)**

12. Install `@next/bundle-analyzer`
13. Update `next.config.ts` with analyzer wrapper + AVIF format
14. Run `ANALYZE=true npm run build` — study client bundle, identify issues
15. Apply targeted optimizations (images, dynamic imports if needed)
16. Add `priority` prop to hero doctor image in HeroSection

**Phase D: E2E + accessibility (depends on Phase C — needs a runnable server)**

17. Install Playwright: `npx playwright install --with-deps`
18. Install `@axe-core/playwright`
19. Create `playwright.config.ts` with webServer, setup project, public + admin projects
20. Write `e2e/auth/setup.ts` — admin storageState
21. Write `e2e/booking-flow.spec.ts` — happy path booking wizard (Steps 1-4)
22. Write `e2e/accessibility.spec.ts` — axe scans on homepage, booking page, admin
23. Run `npx playwright test` — fix any axe violations before marking done

**Phase E: Biome config verification (depends on Phase A)**

24. Run `npm run lint:biome` — Biome v2 auto-detects Vitest from `package.json` and enables test domain rules
25. Fix any lint issues in test files (unused `vi` imports, etc.)

---

## Sources

- Next.js 15 official testing guide — Vitest setup, async Server Component limitation (HIGH confidence): https://nextjs.org/docs/app/guides/testing/vitest
- Next.js 15 testing overview — categories and recommended tools per category (HIGH confidence): https://nextjs.org/docs/app/guides/testing
- next-test-api-route-handler — supports App Router since v4.0.0, tested against each Next.js release (HIGH confidence): https://github.com/Xunnamius/next-test-api-route-handler
- Playwright accessibility testing with @axe-core/playwright (HIGH confidence — official Playwright docs): https://playwright.dev/docs/accessibility-testing
- Playwright authentication storageState pattern (HIGH confidence — official Playwright docs): https://playwright.dev/docs/auth
- @next/bundle-analyzer — official Next.js bundle analysis plugin (HIGH confidence): https://nextjs.org/docs/app/guides/package-bundling
- next/image `priority` prop and LCP optimization (HIGH confidence — official Next.js docs): https://nextjs.org/docs/app/api-reference/components/image
- next/image AVIF + WebP format configuration (HIGH confidence — official Next.js docs): https://nextjs.org/docs/app/api-reference/components/image
- Motion v12 `reducedMotion="user"` on MotionConfig — already implemented in `src/components/motion/MotionProvider.tsx` (HIGH confidence — code verified)
- Biome v2 test domain — auto-detects Vitest from package.json (MEDIUM confidence): https://biomejs.dev/linter/domains/
- Sanity image URL builder with next/image pattern (MEDIUM confidence): https://www.sanity.io/recipes/the-best-next-js-and-sanity-less-than-image-greater-than-component-afe973cc
- WCAG 2.2 focus appearance requirements (HIGH confidence — official W3C): https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

---

*Architecture research for: Morocz Medical v2.1 — Testing, performance, and accessibility hardening*
*Researched: 2026-02-23*
