# Roadmap: Morocz Medical

## Overview

This roadmap builds a beautifully animated, SEO-optimized medical practice website for Morocz Medical in 8 sequential phases. The project starts from a blank Next.js project and ends with a fully deployed, Sanity-powered site with scroll-triggered animations, structured data, and a verified CMS revalidation pipeline. The ordering is driven by hard dependencies: foundation and Sanity schemas must be stable before any front-end sections are built, and animation polish comes last when all structural work is settled.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [~] **Phase 1: Foundation** - Next.js 16 + Tailwind v4 + Motion architecture, deployed to Vercel *(in progress — 01-02 checkpoint pending)*
- [x] **Phase 2: Content Architecture** - All Sanity schemas, TypeGen, GROQ queries — data layer complete *(completed 2026-02-19)*
- [ ] **Phase 3: Shell + Static Sections** - Header, Hero, Footer, and responsive baseline
- [ ] **Phase 4: Services + Lab Tests** - Animated category filter, lab tests section, CLS validated
- [ ] **Phase 5: Testimonials + Blog** - Carousel, blog listing, blog post pages with Portable Text
- [ ] **Phase 6: SEO + Structured Data** - JSON-LD schemas, meta tags, GDPR compliance
- [ ] **Phase 7: Animation Polish + Performance** - Intro sequence, scroll triggers, Core Web Vitals
- [ ] **Phase 8: CMS Revalidation + Launch** - Webhook, edit-to-publish cycle, launch readiness

## Phase Details

### Phase 1: Foundation
**Goal**: A working Next.js 16 project with Tailwind v4, Motion animation architecture, and a live Vercel deployment exists — ready for feature development
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07
**Success Criteria** (what must be TRUE):
  1. The project builds without errors and deploys successfully to a live Vercel URL
  2. Tailwind v4 design tokens (colors, border radius, max-width) match the template design system and are visible in a test component
  3. Plus Jakarta Sans loads correctly with all required weights (400–800)
  4. A test animation renders in the browser with `MotionConfig reducedMotion="user"` active at root, and motion is disabled when the OS prefers reduced motion
  5. ESLint/Biome passes with no errors on the initial codebase
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md -- Next.js 15 + Tailwind v4 + Plus Jakarta Sans + design tokens *(completed 2026-02-19)*
- [x] 01-02-PLAN.md -- Motion v12 animation architecture + Biome linting + deployment readiness *(auto tasks complete 2026-02-19; awaiting human-verify checkpoint)*

### Phase 2: Content Architecture
**Goal**: All Sanity document types are defined, Studio is navigable, TypeGen types are committed, and every GROQ query is centralized — the entire data layer is ready to serve front-end components
**Depends on**: Phase 1
**Requirements**: CMS-01, CMS-02, CMS-03, CMS-04, CMS-05, CMS-06, CMS-07, CMS-08, CMS-09, CMS-10, CMS-11, CMS-12, CMS-13
**Success Criteria** (what must be TRUE):
  1. Sanity Studio is accessible at `/studio` and a non-technical editor can navigate all document types without confusion
  2. Every content field required by the design (hero text, service cards, lab test pricing, testimonials, blog posts, navigation links, footer columns) exists in the Studio and can be edited
  3. TypeScript compilation succeeds using the generated `sanity.types.ts` — no `any` casts needed for Sanity data
  4. A test page fetches a Sanity document using `sanityFetch()` and renders correctly, confirming the data client works
**Plans:** 5/5 plans complete

Plans:
- [x] 02-01-PLAN.md -- Install Sanity v5, embed Studio at /studio, create sanityFetch() wrapper *(completed 2026-02-19)*
- [x] 02-02-PLAN.md -- Homepage, SiteSettings, ServiceCategory, Service, LabTest schemas + desk structure *(completed 2026-02-19)*
- [x] 02-03-PLAN.md -- Testimonial, BlogPost, BlogCategory schemas *(completed 2026-02-19)*
- [x] 02-04-PLAN.md -- TypeGen output, centralized GROQ queries, finalize desk structure *(completed 2026-02-19)*
- [x] 02-05-PLAN.md -- Test page + human verification of Studio and data pipeline *(completed 2026-02-19)*

### Phase 3: Shell + Static Sections
**Goal**: A visitor can load the homepage and see a correctly styled header, hero section, and footer — all content driven from Sanity, fully responsive from 320px to 1440px+
**Depends on**: Phase 2
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06, HERO-07, FOOT-01, FOOT-02, FOOT-03, FOOT-04, FOOT-05, FOOT-06, RESP-01, RESP-03
**Success Criteria** (what must be TRUE):
  1. The header sticks to the top on scroll, shows the logo and navigation links from Sanity, and the hamburger menu opens and closes correctly on mobile
  2. The hero section displays the animated headline, doctor image, floating badges, CTA button, and 4 colored service cards — all text and images editable from Sanity
  3. The footer shows the dark navy background, multi-column navigation, social icons, contact info, privacy policy link, and the large logo on pink — all from Sanity
  4. Every section renders correctly at 320px, 768px, and 1440px viewport widths with no layout breakage
  5. All visible text is in Hungarian
**Plans**: TBD

Plans: None yet

### Phase 4: Services + Lab Tests
**Goal**: A visitor can filter services by category and watch the cards shuffle smoothly into new positions, and can browse lab test cards with pricing — CLS score stays below 0.1 during all filter interactions
**Depends on**: Phase 3
**Requirements**: SERV-01, SERV-02, SERV-03, SERV-04, SERV-05, SERV-06, LAB-01, LAB-02, LAB-03, LAB-04, LAB-05
**Success Criteria** (what must be TRUE):
  1. Clicking a category filter tab updates the displayed service cards with a visible layout shuffle animation — cards slide and reorder smoothly
  2. The active filter tab shows the correct visual state (dark background with emoji icon) matching the design template
  3. Lab test cards show name, description, discount badge, discounted price, and struck-through original price on a dark navy background
  4. A PageSpeed Insights CLS audit on the services section scores below 0.1
  5. All service data, categories, lab tests, and their order are editable from Sanity Studio
**Plans**: TBD

Plans: None yet

### Phase 5: Testimonials + Blog
**Goal**: A visitor can read patient testimonials by sliding through the carousel and can browse blog posts by category — blog post detail pages render with full content and are statically generated
**Depends on**: Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06, BLOG-07
**Success Criteria** (what must be TRUE):
  1. The testimonial carousel slides smoothly between entries and dot navigation updates to show the current position
  2. Keyboard users can navigate the testimonial carousel using arrow keys or equivalent controls
  3. The blog listing shows cards with featured image, category tag, title, and excerpt, and clicking a category tab filters to matching posts
  4. A blog post detail page at `/blog/[slug]` renders full Portable Text content including any rich text formatting
  5. Blog post pages are statically generated at build time — no 404s for posts that exist in Sanity
**Plans**: TBD

Plans: None yet

### Phase 6: SEO + Structured Data
**Goal**: Every page has correct meta tags and Open Graph data from Sanity, the homepage and blog posts have valid JSON-LD structured data passing Google's Rich Results Test, and the site is GDPR-compliant for Hungarian visitors
**Depends on**: Phase 5
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09
**Success Criteria** (what must be TRUE):
  1. The Google Rich Results Test validates MedicalClinic, LocalBusiness, and Physician JSON-LD on the homepage without errors
  2. Each blog post page has BreadcrumbList and BlogPosting JSON-LD that passes validation
  3. All pages have Open Graph `og:title`, `og:description`, and `og:image` tags populated from Sanity — visible when the URL is pasted into a social media preview tool
  4. The Hungarian-language privacy policy page is accessible at a stable URL and linked from the footer
  5. A cookie notice appears for Hungarian visitors and meets GDPR informational requirements without blocking page use
**Plans**: TBD

Plans: None yet

### Phase 7: Animation Polish + Performance
**Goal**: Every section animates in on scroll, the intro logo typewriter plays on first load, the closing circle wipe plays on exit, and all Core Web Vitals targets are met on mobile — while users who prefer reduced motion see no animations
**Depends on**: Phase 6
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07, RESP-02
**Success Criteria** (what must be TRUE):
  1. On page load, the logo typewriter intro plays on a dark navy background before the content fades in
  2. Scrolling down triggers visible entrance animations on every major section (hero, services, lab tests, testimonials, blog, footer)
  3. Button hover states show the arrow icon slide/expand animation matching the design reference
  4. A PageSpeed Insights mobile audit shows LCP < 2.5s, CLS < 0.1, and INP in the passing range
  5. When OS reduced-motion preference is enabled, the page loads with no animations and all content is immediately visible
**Plans**: TBD

Plans: None yet

### Phase 8: CMS Revalidation + Launch
**Goal**: An editor can publish a change in Sanity Studio and see it live on the production site within 30 seconds — the full editorial workflow is verified and the site is launch-ready
**Depends on**: Phase 7
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03, LAUNCH-04, LAUNCH-05
**Success Criteria** (what must be TRUE):
  1. Editing and publishing a content change in Sanity Studio triggers visible revalidation — the production site reflects the change within 30 seconds
  2. Sending an invalid or unauthenticated request to `/api/revalidate` returns a non-200 response (webhook HMAC validation works)
  3. Contact phone/email CTAs route correctly to the user's device dialer or email client — no form data is stored anywhere
  4. Draft mode previews are only accessible with the correct Sanity preview secret
**Plans**: TBD

Plans: None yet

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/2 | In progress | - |
| 2. Content Architecture | 5/5 | Complete   | 2026-02-19 |
| 3. Shell + Static Sections | 0/TBD | Not started | - |
| 4. Services + Lab Tests | 0/TBD | Not started | - |
| 5. Testimonials + Blog | 0/TBD | Not started | - |
| 6. SEO + Structured Data | 0/TBD | Not started | - |
| 7. Animation Polish + Performance | 0/TBD | Not started | - |
| 8. CMS Revalidation + Launch | 0/TBD | Not started | - |
