# Morocz Medical

## What This Is

A single-practice medical website and online booking system for Morocz Medical in Esztergom, Hungary. A modern, visually polished, Hungarian-language site with advanced animations, modular Sanity CMS content management, excellent SEO, and a full patient booking flow — including self-service appointment management, admin dashboard, and automated email reminders.

## Core Value

Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.

## Current State

**v2.0 shipped 2026-02-23** — Full booking module on top of the v1.0 website:
- Better Auth with Google OAuth + email/password, role-gated admin (Neon Postgres)
- 4-step booking wizard at /idopontfoglalas with animated transitions, ifRevisionID double-booking prevention
- Patient self-service at /foglalas/:token — cancel (24h window), reschedule (atomic slot swap)
- Admin dashboard at /admin — month/week calendar, patient details modal, manual cancellation
- Gmail API transactional emails (confirmation, cancellation, reschedule, reminder)
- Vercel Cron 24h reminder emails with DST-safe timezone handling and idempotent delivery
- GDPR consent checkbox with privacy policy link in booking form
- 11 Sanity document schemas total, Drizzle ORM for auth/cron tables

**Cumulative:** 220 commits, ~280 files, ~75k lines across v1.0 + v2.0.

See `.planning/MILESTONES.md` for full details and stats.

## Requirements

### Validated (v1.0)

- [x] Hero section with animated headline, doctor image, floating badges, and CTA
- [x] 4 colored service cards (yellow, green, pink, blue) with staggered entrance animations
- [x] Services section with category filter tabs and animated card shuffle/reorder
- [x] Lab tests section on dark background with illustrated cards, discounts, and pricing
- [x] Patient testimonials carousel with dot navigation
- [x] Blog section with categorized article cards
- [x] Footer with navigation links, social icons, and contact info
- [x] Intro animation: logo typewriter effect on dark background, fade-up transition to content
- [x] Circle wipe page transitions on internal navigation
- [x] Scroll-triggered section entrance animations throughout
- [x] Button hover animations (arrow icon slide, background transitions)
- [x] Sanity CMS: every text, image, list item, button text, category order independently editable
- [x] Hungarian language only — all content in Hungarian
- [x] SEO optimization: semantic HTML, meta tags, structured data, performance
- [x] Responsive design across all breakpoints
- [x] Header with logo, navigation, and contact/login actions

### Validated (v2.0)

- ✓ Patient authentication: Google OAuth + email/password registration and login — v2.0
- ✓ Online booking calendar at dedicated /idopontfoglalas page — v2.0
- ✓ Doctor defines weekly schedule + blocked dates in Sanity Studio; slots auto-generated — v2.0
- ✓ Patient picks service → date → time from available slots — v2.0
- ✓ Instant booking with email confirmation and pre-appointment reminder — v2.0
- ✓ Patient self-service: cancel or reschedule via token-based management link — v2.0
- ✓ Bookings stored as Sanity documents with ifRevisionID locking — v2.0
- ✓ Admin dashboard with email/password login (calendar view, today's appointments, patient details) — v2.0
- ✓ Minimal patient data collection: name, email, phone — v2.0

### Active (v2.1)

- [ ] Automated test coverage for critical paths (booking flow, API routes, slot generation)
- [ ] Dead code removal (orphan routes, unused schema values, leftover artifacts)
- [ ] Performance optimization (images, bundle size, Core Web Vitals)
- [ ] Error handling hardening (API edge cases, user-facing error messages)
- [ ] Accessibility improvements (ARIA, keyboard navigation, screen reader support)

### Out of Scope

- Dark mode — not needed for this practice
- Multi-language support — Hungarian only
- Mobile app — web only
- Podcast/events section — removed from original design template
- Statistics counters section — removed from design
- App download section — removed from design
- Product deals/shop section — removed from design (medical practice, not e-commerce)
- Real-time chat — not needed
- SMS reminders — requires paid SMS gateway; email sufficient for now
- Payment/deposit at booking — PCI-DSS complexity; defer until no-show data justifies it
- Real-time WebSocket slot updates — Vercel serverless doesn't support persistent connections; overkill for single-doctor volume
- Multi-doctor scheduling — single-doctor practice; schedule is global
- Patient medical history — GDPR Article 9 special category data; store only name/email/phone
- EHR/EMR integration — Hungarian GP systems require certified integrations
- Waitlist queue — heavy complexity for marginal gain at low volume

## Context

### Design Reference

A complete HTML/CSS design template exists at `home_design/code.html` with a full-page screenshot at `home_design/screen.png`. This is a MediCare template adapted for Morocz Medical.

**Design system (implemented):**
- Colors: primary `#23264F` (dark navy), secondary `#F4DCD6` (light pink), accent `#99CEB7` (green)
- Card colors: yellow `#FAE988`, green `#A8DABC`, purple `#EABDE6`, blue `#8FB8FF`
- Background: white (changed from template `#F2F4F8`)
- Font: Plus Jakarta Sans (weights 400-800)
- Border radius: 1rem default, up to 2.5rem for large cards
- Max content width: 88rem

### Tech Stack (locked)

- **Framework:** Next.js 15.5.12 (App Router)
- **Styling:** Tailwind CSS v4 (CSS-first, @theme tokens in globals.css)
- **CMS:** Sanity v4.22.0 + next-sanity v11.6.12
- **Auth:** Better Auth v1 (Google OAuth + email/password, admin plugin)
- **Database:** Neon Postgres + Drizzle ORM (auth sessions, cron audit log)
- **Email:** Gmail API via googleapis (OAuth2, RFC 2047 encoding)
- **Cron:** Vercel Cron (hourly reminder job)
- **Animations:** Motion v12 (import from 'motion/react')
- **Linting:** Biome v2.4.2 (CSS linting disabled for Tailwind compatibility)
- **Deployment:** Vercel

### Team Approach

The user wants a collaborative development team mindset:
- Frontend developer, backend/CMS developer, UI/UX expert, code quality reviewer, SEO specialist, tester, and optimizer
- Team members should challenge each other, debate approaches, and strive for the best possible product

## Constraints

- **Tech Stack**: Next.js (App Router) + Tailwind CSS + Sanity CMS — decided, non-negotiable
- **Language**: Hungarian only — all UI text, content, and meta tags in Hungarian
- **Animation Library**: Motion v12 (import from 'motion/react')
- **CMS Granularity**: Fixed page layout, but every list item, text, button text, image, and category order must be independently editable in Sanity
- **Design Fidelity**: Must closely match the provided HTML template design system
- **SEO**: Must achieve excellent SEO scores — semantic HTML, meta tags, structured data, Core Web Vitals optimization
- **Code Quality**: Production-grade code with proper typing and optimization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 15 + Tailwind v4 + Sanity v4 | User's explicit choice; modern stack | ✓ Good |
| Hungarian only | Single-market practice | ✓ Good |
| No dark mode | Practice doesn't need it | ✓ Good |
| Remove podcast/events/stats/deals/app sections | Not relevant for medical practice | ✓ Good |
| Motion v12 for animations | Complex animation requirements need robust library | ✓ Good |
| Sanity modular schema | Every content piece independently editable | ✓ Good |
| No separate blog listing page | Homepage shows 2 latest posts; deliberate scope decision | ✓ Good |
| Service card colors hardcoded | Not CMS-editable; locked in Phase 4 | ✓ Good |
| Server Component data fetching | All Sanity fetches in page.tsx/layout.tsx, never in section components | ✓ Good |
| Better Auth replaces Auth.js v5 | Auth.js v5 abandoned; Better Auth acquired it in late 2025 | ✓ Good |
| Per-slot Sanity documents with ifRevisionID | Double-booking prevention at data layer, not query-based | ✓ Good |
| Gmail API for transactional email | Vercel blocks outbound SMTP; Resend had issues | ✓ Good |
| Token-based booking management | /foglalas/:token — no session required for cancel/reschedule | ✓ Good |
| Zod v3 (not v4) | Zod 4 is ESM-only and breaks Sanity v4 builds | ✓ Good |
| Vercel Cron for reminders | Simple hourly trigger; Inngest documented as upgrade path | ✓ Good |
| Neon Postgres + Drizzle | Auth sessions + cron audit log need relational DB | ✓ Good |

## Current Milestone: v2.1 Polish

**Goal:** Harden the codebase with automated tests, remove dead code, optimize performance, improve error handling, and ensure accessibility — making the site production-confident and maintainable.

**Target areas:**
- Automated test coverage for critical booking and API paths
- Dead code cleanup (orphan routes, unused schema values)
- Performance optimization (images, lazy loading, bundle size, Core Web Vitals)
- API error handling and edge case coverage
- Accessibility audit and ARIA improvements

---
*Last updated: 2026-02-23 after v2.1 milestone start*
