# Stack Research

**Domain:** Testing, performance, accessibility, and code quality hardening for a Next.js 15 + Sanity v4 + Vercel medical practice site
**Researched:** 2026-02-23
**Confidence:** HIGH — all versions verified against npm registries and official docs (Feb 2026)

---

## Context: What Already Exists (Do Not Change)

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | ^15.2.0 | App Router, Turbopack dev |
| React | ^19.0.0 | Bundled with Next.js |
| Tailwind CSS | ^4.0.0 | CSS-first |
| Sanity | ^4.22.0 | CMS + embedded Studio |
| Better Auth | ^1.4.18 | Google OAuth + email/password |
| Drizzle ORM | ^0.45.1 | Auth sessions + cron audit log |
| Motion | ^12.34.2 | Animations |
| Biome | ^2.4.2 | Linting + formatting (CSS linting disabled) |
| Zod | ^3.25.76 | Schema validation (v3 required for Sanity compatibility) |
| Vercel | — | Deployment + Cron |

Biome already handles `noUnusedImports` (warn) and `noUnusedVariables`. This narrows the dead-code tooling gap to file-level and dependency-level detection.

---

## Recommended Stack Additions

### Testing — Unit + Component

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| vitest | ^4.0.18 | Test runner | Officially supported by Next.js 15 (see nextjs.org/docs/app/guides/testing/vitest updated 2026-02-20). Faster than Jest in CI (benchmarks show 3-28x speedup). Uses Vite internally but works alongside Next.js's own Webpack bundler — Vite is installed as a peer dependency of vitest and does not replace Next.js's build. Compatible with React 19. Node >=20 required (already met on Vercel). |
| @vitejs/plugin-react | ^5.1.4 | React transform for Vitest | Required by Vitest to process JSX/TSX in test files. Does not affect Next.js build pipeline. |
| @testing-library/react | ^16.x | Component testing utilities | Standard React testing companion. Vitest-compatible (Jest-compatible API). Tests components via user-visible behavior, not implementation. React 19 compatible. |
| @testing-library/dom | ^10.x | DOM query utilities | Peer dependency of @testing-library/react. Required for `screen`, `getByRole`, etc. |
| @testing-library/jest-dom | ^6.9.1 | Custom DOM matchers | Adds `toBeInTheDocument()`, `toHaveTextContent()`, etc. Works with Vitest despite the "jest" name — Vitest's Jest-compatible API accepts all jest-dom matchers. |
| jsdom | ^25.x | Browser DOM simulation | Vitest test environment for component rendering. Simulates browser APIs without a real browser. Lighter than happy-dom for React component testing. |
| vite-tsconfig-paths | ^5.x | TypeScript path alias resolution | Required so Vitest resolves `@/components/...` aliases from tsconfig.json. Without it, all tests will fail with module-not-found errors on path aliases. |

**Critical limitation:** Vitest cannot test async React Server Components (the `async function Page()` pattern used throughout this codebase). Server Component unit tests require awaiting the component manually or wrapping in a non-async shell. The official Next.js guidance is: use Vitest for synchronous Client Components and pure utility functions; use Playwright E2E for async Server Component behavior.

**What to unit test with Vitest:**
- Slot generation logic (`src/lib/slots.ts` or equivalent) — pure functions, no RSC
- Date/time utilities (DST handling, reminder window calculations)
- Booking validation schemas (Zod schemas)
- Client Components in isolation (BookingWizard steps, StepIndicator, form inputs)
- API route handler logic (by importing and calling the handler function directly with mocked Request objects)

**What to test with Playwright instead:**
- Full booking flow (Step 1 → Step 4 → confirmation)
- Admin login and dashboard interactions
- Cancel/reschedule via token link
- GDPR consent checkbox enforcement

---

### Testing — End-to-End

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @playwright/test | ^1.58.2 | E2E browser testing | Official Next.js E2E testing recommendation (nextjs.org/docs/app/guides/testing/playwright). Tests run against the real running app, so async Server Components, Sanity data fetching, and Better Auth all work correctly. Supports multiple browsers (Chromium, Firefox, WebKit). Page Object Model pattern scales well. Vercel preview URL testing supported via `baseURL` env var. |
| @axe-core/playwright | ^4.11.1 | Accessibility scanning in E2E tests | Deque's official Playwright integration for axe-core. Scans pages for WCAG 2.1 AA violations within existing Playwright tests. `AxeBuilder.analyze()` returns violations with element selectors, severity, and fix guidance. Catches ~57% of WCAG issues automatically. Does not require separate accessibility test files — add `axeBuilder.analyze()` assertions to existing E2E tests. |

**Playwright scope for this project:**
- Happy-path booking flow with real (or seeded) slot data
- Admin calendar view loads and displays bookings
- Cancel flow via `/foglalas/[token]` page
- Accessibility scans on: homepage, booking wizard, foglalas management page, admin dashboard
- Run against `localhost:3000` in CI; optionally against Vercel preview URLs

---

### Dead Code Detection

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| knip | ^5.85.0 | Unused files, exports, and dependencies | Biome already catches unused imports within a file. Knip adds the missing layer: finds orphan files never imported by any entry point, unused named exports across module boundaries, and `package.json` dependencies that are installed but never imported. Has a built-in Next.js plugin (auto-enabled when `next` is in dependencies) that understands App Router entry conventions (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, etc.) so it does not false-positive on Next.js special files. Run as a one-time audit, not in CI watch mode. |

**What Knip will find that Biome misses:**
- Sanity schema files that are imported in `sanity.config.ts` but have no corresponding page or component using their type
- Orphan route files left over from iteration (e.g., `/api/booking-cancel` vs `/api/admin/booking-cancel` — two cancel endpoints that may overlap)
- `package.json` devDependencies that were added during development but are no longer referenced

**Knip configuration notes:**
- The Next.js plugin auto-detects `src/app` structure — no manual entry point configuration needed
- Sanity schema files will need to be listed in `knip.json` as entry points (Sanity config imports them dynamically) or added to the ignore list to avoid false positives
- Biome config, Drizzle config, and Sanity CLI config are auto-detected as entry points by their respective plugins

---

### Performance Analysis

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @next/bundle-analyzer | ^15.2.0 (match Next.js version) | JavaScript bundle visualization | Official Next.js plugin. Wraps webpack-bundle-analyzer to generate interactive treemaps of client, server, and edge bundles. Run once (`ANALYZE=true npm run build`) to identify bloated imports. Pin to same version as `next` to avoid compatibility issues. Pinned to 15.x not 16.x because the project uses Next.js 15. |

**What to look for in bundle analysis for this project:**
- `googleapis` (Gmail API) — verify it's server-only and not leaking into client bundle (it's large)
- `motion` (Motion v12) — check client bundle size; lazy load animation components if large
- `sanity` — studio code must not appear in public-facing client bundles
- Third-party auth redirect scripts from Better Auth

**No additional performance tooling needed at this scale.** Vercel Analytics (already available on Vercel) provides real-user Core Web Vitals data. Lighthouse can be run manually via Chrome DevTools. Lighthouse CI (a separate npm package) adds complexity without meaningful benefit for a single-doctor site with no regression risk from a team of many contributors.

---

### Accessibility

No new npm packages needed beyond `@axe-core/playwright` (listed above). The accessibility workflow is:

1. `@axe-core/playwright` in E2E tests catches automated WCAG violations
2. Manual keyboard navigation audit (Tab, Enter, Escape, arrow keys on booking wizard)
3. Manual screen reader check with NVDA (free, Windows) or VoiceOver (macOS)
4. Biome's existing rules catch some a11y anti-patterns (e.g., `noBlankTarget` for links)

**Avoid `@axe-core/react`:** The `@axe-core/react` package injects into the React render cycle and logs to the browser console during development. It is noisy (catches same issues as Playwright), does not integrate with CI, and adds a development-only import that must be carefully guarded. The Playwright integration is cleaner and CI-compatible.

---

## Installation

```bash
# Unit testing
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom vite-tsconfig-paths

# E2E testing + accessibility
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps chromium

# Dead code detection
npm install -D knip

# Bundle analysis
npm install -D @next/bundle-analyzer
```

---

## Configuration Snippets

### vitest.config.mts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

### src/test/setup.ts

```typescript
import "@testing-library/jest-dom";
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### knip.json

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "sanity.config.ts",
    "sanity.cli.ts",
    "drizzle.config.ts",
    "middleware.ts",
    "src/sanity/schemas/**/*.ts"
  ],
  "ignore": [
    "animations/**",
    "home_design/**",
    "scripts/**"
  ]
}
```

### next.config.ts with bundle analyzer

```typescript
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
```

### package.json scripts to add

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "analyze": "ANALYZE=true next build",
    "knip": "knip"
  }
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vitest ^4.0.18 | Jest | Jest remains the Next.js default if you use `create-next-app` with Jest template. No advantage over Vitest for a new test setup on this project — Vitest is faster, ESM-native, and officially supported. Avoid Jest here. |
| @playwright/test | Cypress | Cypress has excellent DX for interactive debugging but is slower in CI, does not support multi-browser testing on free tier, and has weaker network interception for testing auth flows. Playwright is the Next.js official recommendation. |
| @axe-core/playwright | axe-playwright (third-party) | `axe-playwright` is a community wrapper vs `@axe-core/playwright` which is Deque's official package. Use the official Deque package. |
| knip | depcheck | depcheck only checks package.json dependencies, not unused exports or orphan files. Knip is a strict superset of what depcheck offers. |
| @next/bundle-analyzer | webpack-bundle-analyzer directly | @next/bundle-analyzer wraps webpack-bundle-analyzer with correct Next.js integration. Using webpack-bundle-analyzer directly requires manual configuration that Next.js's plugin handles automatically. |
| Manual Lighthouse | Lighthouse CI (LHCI) | Lighthouse CI adds a server, GitHub Action, and assertion configuration. For a single-developer medical site with no weekly releases from a team, LHCI adds overhead without proportional benefit. Run Lighthouse manually via Chrome DevTools or PageSpeed Insights after each deploy. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Storybook | Heavy setup (webpack config, addon overhead). Unnecessary for a site with ~5 reusable UI patterns. No component design system justified at this scale. | Test components with Vitest + @testing-library/react directly |
| Jest | Slower than Vitest, requires babel transform for ESM (extra config), no advantage for a greenfield test setup. | Vitest |
| @axe-core/react (dev runtime) | Logs to browser console during development, not CI-compatible, noisy. Same issues caught by @axe-core/playwright in E2E tests. | @axe-core/playwright |
| Percy / Chromatic visual regression | No design system, no component library. Visual regression testing is overkill for a medical practice site that rarely changes UI. | Manual visual review |
| Sentry | Free tier limited; adds bundle weight and vendor dependency. Single-developer project does not need error monitoring infrastructure. | Vercel's built-in error logging + Next.js error boundaries |
| react-testing-library/user-event | Adds complexity over @testing-library/react's built-in `fireEvent`. Only needed for complex interaction sequences. Add only if specific tests require it. | @testing-library/react `fireEvent` |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| vitest@^4.0.18 | Node >=20 | Vercel's Node.js runtime is 20+ by default. Confirmed compatible. |
| vitest@^4.0.18 | next@^15.2.0 | Vitest runs independently of Next.js build. Uses its own Vite pipeline for test files only. No conflict. |
| vitest@^4.0.18 | react@^19.0.0 | React 19 compatible. @vitejs/plugin-react@^5.1.4 supports React 19. |
| @playwright/test@^1.58.2 | next@^15.2.0 | Tests the running Next.js server — no version coupling at the package level. |
| @axe-core/playwright@^4.11.1 | @playwright/test@^1.58.2 | Peer dependency on `@playwright/test` — must match the playwright version installed. Both at latest stable as of 2026-02-23. |
| @next/bundle-analyzer | next@^15.2.0 | Pin to same minor as `next`. Use `^15.2.0` not `^16.x`. |
| knip@^5.85.0 | next@^15.2.0 | Next.js plugin built into knip. No version coupling beyond knip detecting `next` in package.json. |
| @testing-library/jest-dom@^6.9.1 | vitest@^4.0.18 | Works via Vitest's Jest-compatible API. Import in vitest setup file, not per-test. |
| zod@^3.25.76 | vitest@^4.0.18 | No interaction. Zod schemas are imported in test files normally. |

---

## Sources

- Next.js Vitest guide (updated 2026-02-20) — https://nextjs.org/docs/app/guides/testing/vitest — HIGH confidence
- Playwright Next.js guide — https://nextjs.org/docs/app/guides/testing/playwright — HIGH confidence
- @axe-core/playwright npm (v4.11.1, published 2026-02-07) — https://www.npmjs.com/package/@axe-core/playwright — HIGH confidence
- Vitest 4.0 release notes — https://vitest.dev/blog/vitest-4 — HIGH confidence
- Vitest requirements (Vite >=6, Node >=20) — https://vitest.dev/guide/ — HIGH confidence
- Vitest 4.0.18 on npm — https://www.npmjs.com/package/vitest — HIGH confidence
- knip 5.85.0 on npm (published 2026-02-22) — https://www.npmjs.com/package/knip — HIGH confidence
- Knip Next.js plugin — https://knip.dev/reference/plugins/next — HIGH confidence
- @playwright/test 1.58.2 on npm — https://www.npmjs.com/package/playwright — HIGH confidence
- @next/bundle-analyzer npm (v16.1.6 latest, use 15.x for this project) — https://www.npmjs.com/package/@next/bundle-analyzer — HIGH confidence
- @vitejs/plugin-react 5.1.4 on npm — https://www.npmjs.com/package/@vitejs/plugin-react — HIGH confidence
- @testing-library/jest-dom 6.9.1 on npm — https://www.npmjs.com/package/@testing-library/jest-dom — HIGH confidence
- msw 2.12.10 on npm — https://www.npmjs.com/package/msw — HIGH confidence (noted but not recommended — see below)
- Vitest vs Jest 2026 — https://www.sitepoint.com/vitest-vs-jest-2026-migration-benchmark/ — MEDIUM confidence

---

## Note on MSW (Mock Service Worker)

MSW v2.12.10 is commonly recommended for mocking API calls in unit tests. It is deliberately excluded from this recommendation because:

1. This project's critical API routes (`/api/booking`, `/api/slots`, `/api/cron/reminders`) are best tested via Playwright E2E against a real or test-seeded environment.
2. The pure business logic in those routes (slot generation, DST handling, reminder window) can be extracted into pure functions and unit-tested without network mocking.
3. Adding MSW for a ~10 API route codebase is over-engineering. The test surface area does not justify the setup overhead.

Add MSW only if complex external API mocking (e.g., Gmail API, Sanity write API) becomes necessary in unit tests.

---

*Stack research for: Morocz Medical v2.1 — testing, performance, accessibility, dead code hardening*
*Researched: 2026-02-23*
