# Requirements: Morocz Medical

**Defined:** 2026-02-18
**Core Value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Next.js 16 App Router project initialized with TypeScript, Tailwind v4, and correct PostCSS config
- [ ] **FOUND-02**: Motion v12 animation architecture established with Server/Client component boundary
- [ ] **FOUND-03**: `MotionConfig reducedMotion="user"` set at root for accessibility
- [ ] **FOUND-04**: Plus Jakarta Sans font loaded via next/font with weights 400-800
- [ ] **FOUND-05**: Design system tokens configured (colors, border-radius, max-width) matching template
- [ ] **FOUND-06**: ESLint/Biome configured for code quality
- [ ] **FOUND-07**: Vercel deployment pipeline working

### Content Architecture (Sanity)

- [x] **CMS-01**: Sanity v5 Studio embedded at `/studio` route within Next.js app
- [x] **CMS-02**: Homepage singleton schema with all section content fields
- [x] **CMS-03**: SiteSettings singleton schema (logo, navigation, contact info, social links, footer)
- [x] **CMS-04**: Service document type with name, description, icon/image, category, order
- [x] **CMS-05**: LabTest document type with name, description, price, original price, discount, illustration
- [x] **CMS-06**: Testimonial document type with name, photo, text, condition/context
- [x] **CMS-07**: BlogPost document type with title, slug, category, body (Portable Text), featured image, meta description, OG image
- [x] **CMS-08**: BlogCategory document type with name, slug, order
- [x] **CMS-09**: ServiceCategory document type with name, emoji/icon, order
- [x] **CMS-10**: TypeGen output committed for compile-time type safety
- [x] **CMS-11**: `sanityFetch()` wrapper with tag-based revalidation
- [x] **CMS-12**: All GROQ queries centralized in queries.ts with `defineQuery()`
- [x] **CMS-13**: Every list item, text, button text, image, and category order independently editable from Sanity

### Header & Navigation

- [x] **NAV-01**: Sticky header with logo, navigation links, and contact actions
- [x] **NAV-02**: Mobile responsive hamburger menu
- [x] **NAV-03**: Navigation items populated from Sanity siteSettings
- [x] **NAV-04**: All header text in Hungarian

### Hero Section

- [x] **HERO-01**: Large animated headline with staggered letter-by-letter animation
- [x] **HERO-02**: Doctor image with fade-in from right
- [x] **HERO-03**: Floating badges animating in with slight bounce
- [x] **HERO-04**: Subtext and descriptive paragraph
- [x] **HERO-05**: "Book Consultation" CTA button with arrow hover animation
- [x] **HERO-06**: 4 colored service cards (yellow, green, pink, blue) with staggered entrance from bottom
- [x] **HERO-07**: All hero content editable from Sanity (headline, subtext, badges, doctor image, card texts)

### Services Section

- [x] **SERV-01**: Category filter tabs (horizontal scrollable pills) populated from Sanity
- [x] **SERV-02**: Animated card shuffle/reorder when switching filter category (layout animation)
- [x] **SERV-03**: Service cards displaying provider/service info from Sanity
- [x] **SERV-04**: Active tab visual state (dark background + emoji icon)
- [x] **SERV-05**: CLS score < 0.1 during filter animations
- [x] **SERV-06**: All service data, categories, and order editable from Sanity

### Lab Tests Section

- [x] **LAB-01**: Dark navy background section
- [x] **LAB-02**: Illustrated test cards with name, description, discount badge, price, and original price
- [x] **LAB-03**: "View All Lab Tests" link
- [x] **LAB-04**: Cards fade/slide in on scroll
- [x] **LAB-05**: All lab test data editable from Sanity (name, description, price, discount, illustration)

### Testimonials Section

- [ ] **TEST-01**: Testimonial carousel with dot navigation
- [ ] **TEST-02**: Smooth horizontal slide between testimonials
- [ ] **TEST-03**: Each testimonial shows name, optional photo, and review text
- [ ] **TEST-04**: Keyboard accessible carousel navigation
- [x] **TEST-05**: All testimonials editable from Sanity

### Blog Section

- [ ] **BLOG-01**: Blog listing with category filter tabs
- [ ] **BLOG-02**: Blog cards with featured image, category tag, title, and excerpt
- [ ] **BLOG-03**: "Read All Blogs" link
- [ ] **BLOG-04**: Blog post detail page with Portable Text rendering
- [ ] **BLOG-05**: Blog post slug-based routing (`/blog/[slug]`)
- [ ] **BLOG-06**: Static generation with `generateStaticParams` for blog posts
- [x] **BLOG-07**: All blog content manageable from Sanity

### Footer

- [x] **FOOT-01**: Dark navy background footer with multi-column navigation links
- [x] **FOOT-02**: Social media icon links (Instagram, Facebook, etc.)
- [x] **FOOT-03**: Large logo on pink background at footer bottom
- [x] **FOOT-04**: Contact info (phone, address) in footer
- [x] **FOOT-05**: Privacy policy link
- [x] **FOOT-06**: Footer content editable from Sanity

### Animations

- [ ] **ANIM-01**: Intro animation: logo typewriter effect on dark navy background
- [ ] **ANIM-02**: Intro transition: logo fades up, page scroll-up revealing content
- [ ] **ANIM-03**: Scroll-triggered section entrance animations (fade-in, slide-up) on all major sections
- [ ] **ANIM-04**: Staggered entrance animations for card groups (max 0.08s per item)
- [ ] **ANIM-05**: Button hover animations: arrow icon slide/expand, background transitions
- [ ] **ANIM-06**: Closing circle wipe animation shrinking to center dot on pink background
- [ ] **ANIM-07**: `useReducedMotion` respected — all animations disabled for users who prefer reduced motion

### SEO & Compliance

- [ ] **SEO-01**: Semantic HTML throughout (proper heading hierarchy, landmarks, ARIA where needed)
- [ ] **SEO-02**: Meta tags and Open Graph tags on all pages, populated from Sanity
- [ ] **SEO-03**: JSON-LD structured data: MedicalClinic, LocalBusiness, Physician on homepage
- [ ] **SEO-04**: JSON-LD structured data: BreadcrumbList on blog posts
- [ ] **SEO-05**: JSON-LD structured data: BlogPosting on each blog post
- [ ] **SEO-06**: GDPR privacy policy page in Hungarian
- [ ] **SEO-07**: Cookie notice (informational, non-blocking — Vercel Analytics is cookie-free)
- [ ] **SEO-08**: Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP passing on mobile
- [ ] **SEO-09**: All content and meta in Hungarian language

### Responsive Design

- [x] **RESP-01**: All sections work from 320px to 1440px+
- [ ] **RESP-02**: Animations degrade gracefully on mobile (simpler or disabled)
- [x] **RESP-03**: Touch-friendly interactive elements (filter tabs, carousel, buttons)

### CMS Revalidation & Launch

- [ ] **LAUNCH-01**: Webhook revalidation route (`/api/revalidate`) with HMAC validation
- [ ] **LAUNCH-02**: Sanity webhook configured pointing to production URL
- [ ] **LAUNCH-03**: Full edit-to-publish cycle tested (< 30 seconds)
- [ ] **LAUNCH-04**: Draft mode security verified
- [ ] **LAUNCH-05**: Contact info routing (phone/email CTA — no form data storage)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Appointment Booking

- **BOOK-01**: Online appointment booking system with calendar
- **BOOK-02**: Appointment confirmation via email
- **BOOK-03**: Integration with practice calendar system

### Expanded Content

- **EXPD-01**: FAQ section with FAQPage schema markup
- **EXPD-02**: About page with detailed practice history
- **EXPD-03**: Contact form with email routing (Resend/SendGrid)

### Future Enhancements

- **FUTR-01**: English language support (i18n)
- **FUTR-02**: Google Business Profile sync
- **FUTR-03**: Analytics dashboard

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Dark mode | Not needed for medical practice, +50% CSS complexity |
| Multi-language | Hungarian only, single market |
| Patient portal / login | Entirely separate product, medical data compliance |
| E-commerce / product shop | Not relevant for medical practice |
| Real-time chat | Medical advice liability, kills Core Web Vitals |
| Video hero / backgrounds | 5-20MB, crushes mobile performance |
| Social media feed embeds | API fragility, +200-500ms load time |
| Podcast/events sections | Removed from design template, not relevant |
| Statistics counters | Removed from design template |
| App download section | Not applicable |

## Traceability

Which phases cover which requirements. Verified during roadmap creation (2026-02-18).

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| FOUND-07 | Phase 1 | Pending |
| CMS-01 | Phase 2 | Complete |
| CMS-02 | Phase 2 | Complete |
| CMS-03 | Phase 2 | Complete |
| CMS-04 | Phase 2 | Complete |
| CMS-05 | Phase 2 | Complete |
| CMS-06 | Phase 2 | Complete |
| CMS-07 | Phase 2 | Complete |
| CMS-08 | Phase 2 | Complete |
| CMS-09 | Phase 2 | Complete |
| CMS-10 | Phase 2 | Complete |
| CMS-11 | Phase 2 | Complete |
| CMS-12 | Phase 2 | Complete |
| CMS-13 | Phase 2 | Complete |
| NAV-01 | Phase 3 | Complete |
| NAV-02 | Phase 3 | Complete |
| NAV-03 | Phase 3 | Complete |
| NAV-04 | Phase 3 | Complete |
| HERO-01 | Phase 3 | Complete |
| HERO-02 | Phase 3 | Complete |
| HERO-03 | Phase 3 | Complete |
| HERO-04 | Phase 3 | Complete |
| HERO-05 | Phase 3 | Complete |
| HERO-06 | Phase 3 | Complete |
| HERO-07 | Phase 3 | Complete |
| SERV-01 | Phase 4 | Complete |
| SERV-02 | Phase 4 | Complete |
| SERV-03 | Phase 4 | Complete |
| SERV-04 | Phase 4 | Complete |
| SERV-05 | Phase 4 | Complete |
| SERV-06 | Phase 4 | Complete |
| LAB-01 | Phase 4 | Complete |
| LAB-02 | Phase 4 | Complete |
| LAB-03 | Phase 4 | Complete |
| LAB-04 | Phase 4 | Complete |
| LAB-05 | Phase 4 | Complete |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 5 | Pending |
| TEST-03 | Phase 5 | Pending |
| TEST-04 | Phase 5 | Pending |
| TEST-05 | Phase 5 | Complete |
| BLOG-01 | Phase 5 | Pending |
| BLOG-02 | Phase 5 | Pending |
| BLOG-03 | Phase 5 | Pending |
| BLOG-04 | Phase 5 | Pending |
| BLOG-05 | Phase 5 | Pending |
| BLOG-06 | Phase 5 | Pending |
| BLOG-07 | Phase 5 | Complete |
| FOOT-01 | Phase 3 | Complete |
| FOOT-02 | Phase 3 | Complete |
| FOOT-03 | Phase 3 | Complete |
| FOOT-04 | Phase 3 | Complete |
| FOOT-05 | Phase 3 | Complete |
| FOOT-06 | Phase 3 | Complete |
| ANIM-01 | Phase 7 | Pending |
| ANIM-02 | Phase 7 | Pending |
| ANIM-03 | Phase 7 | Pending |
| ANIM-04 | Phase 7 | Pending |
| ANIM-05 | Phase 7 | Pending |
| ANIM-06 | Phase 7 | Pending |
| ANIM-07 | Phase 7 | Pending |
| SEO-01 | Phase 6 | Pending |
| SEO-02 | Phase 6 | Pending |
| SEO-03 | Phase 6 | Pending |
| SEO-04 | Phase 6 | Pending |
| SEO-05 | Phase 6 | Pending |
| SEO-06 | Phase 6 | Pending |
| SEO-07 | Phase 6 | Pending |
| SEO-08 | Phase 6 | Pending |
| SEO-09 | Phase 6 | Pending |
| RESP-01 | Phase 3 | Complete |
| RESP-02 | Phase 7 | Pending |
| RESP-03 | Phase 3 | Complete |
| LAUNCH-01 | Phase 8 | Pending |
| LAUNCH-02 | Phase 8 | Pending |
| LAUNCH-03 | Phase 8 | Pending |
| LAUNCH-04 | Phase 8 | Pending |
| LAUNCH-05 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 76 total
- Mapped to phases: 76
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-20 — TEST-05 and BLOG-07 marked complete after Phase 5 Plan 01*
