# Project Research Summary

**Project:** Morocz Medical — Single-Practice Medical Website
**Domain:** Healthcare / Medical Practice Website (Hungarian, Esztergom)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

Morocz Medical is a single-doctor medical practice website targeting patients in Esztergom, Hungary. Research across all four domains confirms this is a well-understood product category with clear, established implementation patterns. The recommended approach is Next.js 16 with App Router (static generation + ISR), Sanity CMS for full editorial independence, and Motion (formerly Framer Motion) for premium scroll-triggered animations. This stack is well-documented, has a clean deployment path on Vercel, and is the current industry standard for content-driven sites that require non-technical editor control.

The key architectural decision is the strict Server/Client component boundary: all data fetching happens in Server Components (page.tsx, layout.tsx), section components are pure presentation, and only interactive or animated pieces cross into client territory via thin wrapper components. This keeps the JS bundle minimal, preserves SEO benefits of server rendering, and makes Core Web Vitals targets achievable. The Sanity CMS is the foundation dependency — every content section depends on it, so schema design must be completed before any front-end work begins.

The primary risk is animation complexity versus page performance. The animated services card-shuffle filter is the signature feature of the site, and it is the most technically demanding interaction. Framer Motion's `AnimatePresence` for inter-page transitions is a documented dead end in the App Router — that approach must be ruled out at project setup. The secondary risk is GDPR compliance: Hungary is an EU jurisdiction with active enforcement, and cookie consent and form data routing must be handled correctly from day one. Both risks have clear, established mitigations documented in research.

---

## Key Findings

### Recommended Stack

The stack is fully decided with high confidence. Next.js 16 with App Router and TypeScript 5.8 is the foundation. Tailwind CSS v4 handles styling via a CSS-first `@theme {}` config (no `tailwind.config.js`). Sanity v5 with `next-sanity` v12 provides the CMS layer, embedded at `/studio` within the same Next.js app. Motion v12 (the `motion` npm package, formerly Framer Motion) handles all animation. Vercel is the hosting target.

**Core technologies:**
- **Next.js 16:** Full-stack React framework with App Router — mandatory for Async Request APIs (params/cookies must be awaited); Turbopack is now the default build system
- **Tailwind CSS v4:** CSS-first utility styling — requires `@tailwindcss/postcss` PostCSS plugin, not the old `tailwindcss` plugin; `@import "tailwindcss"` replaces `@tailwind` directives
- **Sanity v5 + next-sanity v12:** Headless CMS embedded in-app — `sanityFetch()` with `useCdn: false`, tag-based ISR revalidation via webhook, and TypeGen for compile-time type safety
- **Motion v12:** Animation library — import from `motion/react` in client components or `motion/react-client` in server components; `MotionConfig reducedMotion="user"` is mandatory at root
- **schema-dts:** Type-safe JSON-LD structured data — prevents invalid medical schema (MedicalClinic, LocalBusiness, Physician) that silently breaks rich results

**Critical version notes:** Node 20.9+ required (Next.js 16 dropped Node 18). `next lint` is removed — use ESLint CLI directly. `serverRuntimeConfig` and `publicRuntimeConfig` are removed — use `NEXT_PUBLIC_` env vars.

See [STACK.md](.planning/research/STACK.md) for full version compatibility matrix and installation commands.

### Expected Features

The feature landscape is clearly defined. The site must outperform the local Esztergom competition (typically outdated static HTML or WordPress with no CMS control, no schema markup, and no animations) while staying within a focused v1 scope. Online booking is explicitly deferred to v2 as a separate system.

**Must have (table stakes) — launch blockers:**
- Hero section with value proposition, location, specialty, and phone CTA
- About the doctor — photo, credentials, philosophy (trust is the primary conversion factor)
- Services overview (4 summary cards) + detailed section with animated category filter
- Lab tests section — CMS-editable, dedicated (differentiator locally)
- Patient testimonials carousel — minimum 4, with names and context
- Contact section — phone, address, opening hours, Google Maps embed
- Blog with category filter — minimum 3 posts at launch
- Privacy policy page — GDPR mandatory in Hungary/EU
- SEO foundations — meta tags, Open Graph, JSON-LD schema (MedicalClinic, LocalBusiness, Physician)
- Full mobile responsiveness — 60%+ of medical traffic is mobile
- Sanity CMS for every content element

**Should have (competitive differentiators):**
- Animated card-shuffle service filter — signature interaction; distinguishes from every local competitor
- Scroll-triggered entrance animations — premium feel; `useInView` with `once: true`, `whileInView` at 20% viewport
- Full structured data suite — BreadcrumbList, BlogPosting, Service — most local competitors have zero
- `MotionConfig reducedMotion="user"` — accessibility requirement for a medical audience

**Defer (v2+):**
- Online appointment booking — requires backend, calendar sync, GDPR-compliant storage, ÁSZF compliance
- English language support — only if cross-border Slovak patient base materializes (Esztergom is on the border)
- Patient portal / lab results — entirely separate product; medical data compliance scope

**Explicit anti-features (never build):** Dark mode (per spec), video hero backgrounds (performance cost), social media feed embeds (API fragility + load time), real-time chat (medical liability).

See [FEATURES.md](.planning/research/FEATURES.md) for full prioritization matrix and competitor analysis.

### Architecture Approach

The architecture follows a strict three-tier pattern: Sanity Content Lake as the data source, Next.js Server Components for data fetching and presentation, and thin Client Component wrappers for animation and interactivity only. All Sanity queries live in `src/sanity/lib/queries.ts` wrapped with `defineQuery()` for TypeGen inference. Pages fetch data at the top and pass typed props down — section components never call Sanity directly. The services animated filter is the one complex interaction: all service data is fetched server-side and passed to the `ServiceFilterBar` client component; filtering is pure client-side JavaScript with no re-fetching.

**Major components:**
1. **Sanity Studio** (embedded at `/studio`) — editor for all content; singleton schemas for homepage and siteSettings, document types for services, labTests, testimonials, blogPosts
2. **`app/layout.tsx`** — server component; fetches siteSettings once; renders Header and Footer
3. **`app/page.tsx`** — server component; fetches homepage singleton; orchestrates all section components
4. **`src/components/sections/`** — server components receiving typed props; no Sanity API calls
5. **`src/components/ui/motion/`** — thin `'use client'` wrappers (MotionDiv, MotionSection, AnimatePresenceWrapper); only these files import from `motion/react`
6. **`ServiceFilterBar`** — client component; holds filter state; uses AnimatePresence + layout prop for card shuffle
7. **`app/api/revalidate/route.ts`** — webhook handler; validates HMAC; calls `revalidateTag('sanity')`

**Build order:** Sanity schemas → TypeGen → data client/fetch/queries → layout → page.tsx → section components → motion wrappers → interactive client components → intro animation → webhook revalidation.

See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for full project structure, code examples, and data flow diagrams.

### Critical Pitfalls

Research identified 7 pitfalls, of which 5 must be addressed in the foundation phase before any feature work begins. The remaining 2 are phase-specific.

1. **AnimatePresence inter-page transitions are broken in App Router** — Next.js unmounts the previous page before exit animations complete; this is an unresolved structural mismatch (GitHub #49279 still open). Prevention: use enter-only animations per page via `template.js`; use `AnimatePresence` only locally within client components (services filter, modal, carousel). Establish this decision in foundation phase.

2. **`"use client"` placed on section or layout components floods the JS bundle** — once a parent is marked client, all its imports become client code, losing SSR benefits entirely. Prevention: `"use client"` only on leaf animation wrappers; all providers accept children and isolate client scope. Measure with `next build` bundle analysis; gate First Load JS at < 100kb per page.

3. **Layout animation (card shuffle) causing CLS failures** — Framer Motion's `layout` prop uses GPU-accelerated FLIP transforms which should not cause CLS, but only when using `layout="position"` (not `layout={true}`), animating only `transform`/`opacity`, and adding `layoutScroll` to scrollable ancestors. Run PageSpeed Insights CLS audit before marking services filter complete.

4. **Sanity CDN serving stale content after edits** — two independent caches (Sanity CDN + Next.js data cache) can get out of sync. Prevention: `useCdn: false` on the server-side Sanity client; add 500ms delay in webhook handler before `revalidateTag()`; test full edit-to-publish cycle before launch.

5. **`prefers-reduced-motion` ignored — accessibility violation in medical context** — medical audiences have higher rates of motion sensitivity. Prevention: add `<MotionConfig reducedMotion="user">` in root providers.tsx at foundation phase; one line prevents all downstream violations.

6. **Sanity schema over-engineering or rigidity** (content architecture phase) — resist building a page-builder schema; aim for 5-8 document types maximum; keep the Studio editor navigable for a non-technical editor.

7. **Medical schema markup overreach** (SEO phase) — Google does not support `MedicalCondition`, `MedicalTherapy`, or `Symptom` types for rich results. Focus only on `MedicalClinic`, `LocalBusiness`, `BreadcrumbList`, and `BlogPosting`.

See [PITFALLS.md](.planning/research/PITFALLS.md) for full pitfall documentation including recovery strategies and the "looks done but isn't" checklist.

---

## Implications for Roadmap

Based on the dependency graph from FEATURES.md, the build order from ARCHITECTURE.md, and the phase-to-pitfall mapping from PITFALLS.md, the following phase structure is recommended. The ordering is driven by hard dependencies (Sanity schema before any front-end, motion architecture before any animation), not arbitrary sequencing.

### Phase 1: Foundation + Project Setup

**Rationale:** Next.js 16 breaking changes (async params, no `next lint`, Turbopack default), Tailwind v4 breaking changes (PostCSS plugin, CSS import syntax), and Motion's client/server boundary architecture must all be established before any feature development begins. Getting these wrong late is expensive. Pitfalls 1, 2, and 5 are all foundation-phase risks.

**Delivers:** Working Next.js 16 + Tailwind v4 project on Vercel with correct configuration; Motion animation architecture established; `MotionConfig reducedMotion="user"` in place; client/server boundary documented; ESLint / Biome configured.

**Addresses:** Mobile responsive baseline, HTTPS (via Vercel), correct PostCSS config, font setup (Plus Jakarta Sans via `next/font`)

**Avoids:**
- AnimatePresence inter-page transition trap (decision made before any animation work)
- `"use client"` bundle flooding (architecture established before any component is built)
- `prefers-reduced-motion` omission (MotionConfig set at root, one time)

### Phase 2: Content Architecture (Sanity)

**Rationale:** Sanity is the foundation dependency — every content-bearing section (hero, services, lab tests, testimonials, blog, contact info) requires Sanity schemas. Building front-end before schemas are locked causes rework. The content architecture must be validated with a non-technical editor walkthrough before front-end build begins. TypeGen must be run once to make all subsequent component work type-safe.

**Delivers:** All Sanity document types defined and registered (homepage singleton, siteSettings singleton, service, labTest, testimonial, blogPost); Studio desk structure with singleton enforcement; TypeGen output committed (`sanity.types.ts`); `sanityFetch()` wrapper and all GROQ queries in `queries.ts`; Hungarian slug normalization configured.

**Addresses:** Every content section (all P1 features depend on this), CMS-editable content requirement

**Avoids:**
- Schema over-engineering / rigidity (5-8 document types max; content inventory reviewed before schema written)
- Hungarian slug URL breakage (slug normalization in Sanity slug field config)

### Phase 3: Shell + Core Static Sections

**Rationale:** With schemas and the data access layer in place, the layout shell and static sections can be built in parallel. These sections have no interactive complexity — they are server components receiving typed Sanity props. Header and footer depend on siteSettings (already defined). Hero and About are the highest-priority trust elements.

**Delivers:** `app/layout.tsx` (Header + Footer with siteSettings data); Homepage hero section; About the doctor section; Contact section with Google Maps embed; Footer with privacy policy link; Privacy policy page.

**Addresses:** Hero + contact info (P1), About the doctor (P1), Contact section (P1), Privacy policy (P1 legal), Footer (table stakes)

**Avoids:**
- Fetching Sanity data inside section components (anti-pattern; all fetching stays in page.tsx / layout.tsx)
- Sanity CDN stale content (useCdn: false confirmed in client config)

### Phase 4: Services + Animated Filter

**Rationale:** The animated service card-shuffle filter is the most technically demanding feature and the site's signature interaction. It must be built after the Sanity services schema is stable (Phase 2) and after the motion architecture is established (Phase 1). CLS audit is mandatory before this phase is marked complete. The 4-card overview and the detailed filterable section are built together since they share the services data model.

**Delivers:** Services overview section (4 summary cards); Services detailed section with AnimatePresence + layout="position" card shuffle; Category filter buttons; CLS audit passing (< 0.1).

**Addresses:** Services section (P1), animated category filter (P1 signature feature), Lab tests section (P1)

**Avoids:**
- Layout animation CLS (use `layout="position"`, animate only transform/opacity, add `layoutScroll`, run PageSpeed audit before marking done)

### Phase 5: Testimonials + Blog

**Rationale:** Testimonials and blog are both Sanity-dependent (schemas defined in Phase 2) and both involve interactive client components (carousel, category filter). They are grouped together as they share implementation patterns. Blog posts require SEO per-post (OG image, meta description) which is built alongside.

**Delivers:** Testimonials carousel with keyboard navigation and ARIA roles; minimum 4 testimonials in Sanity; Blog listing with category filter; Blog post detail page (`blog/[slug]/page.tsx`) with `generateStaticParams`; Open Graph meta per blog post.

**Addresses:** Testimonials (P1), blog with categories (P1), Open Graph per post (P2)

**Avoids:**
- Carousel keyboard navigation omission (ARIA `role="region"`, keyboard handler, or Motion+ Carousel)
- `@portabletext/react` vs outdated `react-portable-text` — use the correct package

### Phase 6: SEO + Structured Data

**Rationale:** Structured data is built after pages are structurally stable to avoid rework. The JSON-LD schema types are well-known (MedicalClinic, LocalBusiness, Physician, BreadcrumbList, BlogPosting) and their implementation is straightforward via `schema-dts` typed objects. This phase also covers cookie consent (GDPR) and Vercel Analytics setup.

**Delivers:** JSON-LD `<script>` tags on homepage (MedicalClinic, LocalBusiness, Physician); BreadcrumbList on blog posts; BlogPosting schema per post; Google Rich Results Test validation passing; GDPR cookie notice (informational, not blocking — Vercel Analytics is cookie-free); sitewide Open Graph meta from Sanity seoFields object.

**Addresses:** SEO foundations (P1), structured data (differentiator), GDPR compliance (P1 legal), Core Web Vitals validation

**Avoids:**
- Medical schema overreach (only Google-supported types: MedicalClinic, LocalBusiness, BreadcrumbList, BlogPosting, Service)
- GDPR consent omission (verified in incognito before launch — no tracking without consent)
- JSON-LD XSS vulnerability (escape `<` as `\u003c` in JSON.stringify — Next.js does not do this automatically)

### Phase 7: Animation Polish + Performance

**Rationale:** Scroll-triggered entrance animations and the intro sequence are pure polish — they add to the premium feel but do not affect content correctness. Building them last means all sections are structurally complete, making it straightforward to add motion wrappers without disrupting layout. Core Web Vitals audit closes out this phase.

**Delivers:** Scroll-triggered entrance animations on all major sections (MotionDiv/MotionSection wrappers with `whileInView`, `once: true`, `viewport: { amount: 0.2 }`); Intro animation / circle wipe transition; Stagger animation sequences (max 0.08s per item, max 0.6s total); LCP < 2.5s, CLS < 0.1, FID/INP passing on mobile; `priority` prop confirmed on hero image.

**Addresses:** Entrance animations (P2), intro animation, Core Web Vitals targets

**Avoids:**
- Animations firing too early on slow connections (`once: true`, viewport threshold)
- Excessive stagger delay (cap at 0.08s/item)
- LCP failure (hero image `priority` prop confirmed)

### Phase 8: CMS Revalidation + Launch Readiness

**Rationale:** The webhook revalidation route can only be fully tested after the deployment target (Vercel) is confirmed and the Sanity webhook is configured in the Sanity dashboard. This is wired up last because it requires live infrastructure, not local development. Full edit-to-publish cycle test is the launch gate.

**Delivers:** `/api/revalidate` webhook route (HMAC validation via `parseBody`, `revalidateTag('sanity')`); Sanity webhook configured in dashboard pointing to production URL; Full edit-to-publish cycle tested (< 30 seconds); `useCdn: false` confirmed in production server client; Contact form routing to email only (not stored in Sanity); Draft mode security verified.

**Addresses:** Content freshness, editorial workflow, security checklist items

**Avoids:**
- Stale content after edits (useCdn: false + 500ms delay in webhook handler)
- Contact form data in Sanity (route to SMTP/Resend only — no health-adjacent data in database)
- Sanity write token in public env vars (server-only, never NEXT_PUBLIC_*)

### Phase Ordering Rationale

- **Phases 1-2 before everything:** Tailwind v4 config errors and Sanity schema rework are both high-cost to fix retroactively. The foundation and content architecture phases eliminate the two most expensive categories of rework.
- **Phase 4 after Phase 1 + 2:** The animated services filter requires both the motion architecture (Phase 1) and the services schema (Phase 2) to be stable. Building it third would require building on unstable foundations.
- **SEO after structure:** JSON-LD schema on a page that changes structure later requires rework. Phase 6 after Phases 3-5 means schema is written once against a stable page.
- **Animation polish last:** Motion wrappers are the easiest layer to add to existing components. Doing them last means no animation rework when section HTML structure changes.
- **Webhook last:** Requires live Vercel infrastructure; cannot be fully tested in local development.

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 4 (Services + Animated Filter):** The card-shuffle animation with CLS compliance is the most technically novel part of the project. Worth a focused research spike on `layout="position"` with `AnimatePresence` in production, CLS measurement methodology, and the `layoutScroll` requirement.
- **Phase 6 (SEO + Structured Data):** Hungarian local SEO signals (Google Business Profile entity matching, `areaServed` for cross-border patients from Slovakia) may warrant a focused spike on local SEO for Hungarian medical practices.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** All Next.js 16 and Tailwind v4 breaking changes are documented in official docs. No surprises expected.
- **Phase 2 (Sanity):** Singleton pattern, TypeGen, and fetch wrapper are official Sanity patterns with code examples in docs.
- **Phase 3 (Static Sections):** Standard Next.js Server Component + Sanity props pattern. No novel decisions.
- **Phase 5 (Testimonials + Blog):** Carousel and blog are well-trodden patterns; `@portabletext/react` is official.
- **Phase 8 (Revalidation + Launch):** Webhook pattern is fully documented in `next-sanity` official GitHub.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies verified against official docs and current npm releases (2026-02-18). Next.js 16, Tailwind v4, Sanity v5, next-sanity v12, Motion v12 all confirmed stable. Version compatibility matrix verified. |
| Features | HIGH | Table stakes confirmed by multiple healthcare web design authority sources. Differentiators validated against competitor analysis of Hungarian local medical sites. Anti-features grounded in documented complexity and scope concerns. |
| Architecture | HIGH | Core patterns (sanityFetch, defineQuery, TypeGen, singleton schema, thin client wrappers) verified against next-sanity official GitHub and Sanity official docs. Data flow and build order are unambiguous. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (AnimatePresence App Router breakage, bundle flooding, CLS) are verified against official docs and confirmed GitHub issues. GDPR specifics for Hungary rely on MEDIUM-confidence sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Contact form implementation:** Research did not specify the email delivery service (Resend, SendGrid, SMTP). The decision is clear (server action → email only, not Sanity), but the specific provider needs selection during Phase 8 planning. Resend is the current Next.js community standard for transactional email.
- **Google Maps embed GDPR status:** Google Maps iframes set cookies. Research flagged this as a concern but did not resolve whether a static map image (no cookies) or a consent-gated embed is required under Hungarian NAIH interpretation. Needs a quick legal check or safe default (static image with link to Google Maps).
- **Motion v12 `motion/react-client` import in production:** Research notes MEDIUM confidence on the `motion/react-client` import for Server Components (page was JS-rendered during research). This import path should be verified against the official Motion docs or npm package exports at implementation time.
- **Tailwind v4 and any component library compatibility:** Research flagged that shadcn/ui may not support Tailwind v4. Since the project likely uses no external component library, this is a non-issue — but confirm before starting Phase 1 if any UI component library is considered.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16 official docs (upgrading guide, fonts, JSON-LD, App Router) — https://nextjs.org/docs
- Tailwind CSS v4 official install guide and compatibility docs — https://tailwindcss.com/docs
- next-sanity v12 official GitHub (sanityFetch, defineQuery, parseBody, webhook pattern) — https://github.com/sanity-io/next-sanity
- Sanity official docs (TypeGen, singleton pattern, schema types, embedding Studio) — https://www.sanity.io/docs
- Motion (Framer Motion) official docs (accessibility, installation, layout animations) — https://motion.dev/docs
- Schema.org Health and Medical Types official specification — https://schema.org/docs/meddocs.html
- Tebra / The Intake medical website must-haves checklist — https://www.tebra.com/theintake

### Secondary (MEDIUM confidence)
- Sanity + Next.js ISR revalidation (buildwithmatija.com) — consistent with official docs
- Framer Motion / Next.js server component split (hemantasundaray.com) — pattern verified against motion docs
- Sanity webhook on-demand ISR (victoreke.com) — verified against official Sanity docs
- Hungarian GDPR enforcement (Chambers Data Protection Guide 2025)
- Medical schema markup Google support limits (AmpiRe) — verified against Google Search Gallery
- Healthcare website accessibility deadline May 2026 (Carenetic Digital) — confirmed by HHS
- Core Web Vitals optimization Next.js 2025 (Makers Den)

### Tertiary (LOW confidence)
- Healthcare web design trends 2025 (Framerbite) — design inspiration only, not used for decisions

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
