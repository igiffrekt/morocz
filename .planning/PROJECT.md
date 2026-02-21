# Morocz Medical

## What This Is

A single-practice medical website for Morocz Medical in Esztergom, Hungary. A modern, visually polished, Hungarian-language homepage with advanced animations, modular Sanity CMS content management, and excellent SEO. The site showcases the practice's services, lab tests, patient testimonials, and a blog — with every content element independently editable from Sanity.

## Core Value

Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.

## Current State

**v1.0 shipped 2026-02-21** — Full medical practice website live with:
- Next.js 15 + Tailwind v4 + Sanity v4 CMS + Motion v12 animations
- 8 Sanity document schemas, embedded Studio at /studio, 10+ centralized GROQ queries
- Animated homepage: hero with typewriter headline, services filter, lab tests grid, testimonials carousel, blog section
- Complete SEO: JSON-LD (MedicalClinic, Physician, BlogPosting, BreadcrumbList), Open Graph, GDPR cookie notice, privacy policy
- Launch infrastructure: HMAC webhook revalidation, draft mode preview, GA4 with consent gate, branded 404

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

### Active

(None — next milestone requirements TBD)

### Out of Scope

- Appointment booking system — will be built separately as a standalone feature later
- Dark mode — not needed for this practice
- Multi-language support — Hungarian only
- Mobile app — web only
- Podcast/events section — removed from original design template
- Statistics counters section — removed from design
- App download section — removed from design
- Product deals/shop section — removed from design (medical practice, not e-commerce)
- Real-time chat — not needed for v1
- User authentication/accounts — not needed for public-facing site

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
| Next.js 15 + Tailwind v4 + Sanity v4 | User's explicit choice; modern stack | v1.0 Validated |
| Hungarian only | Single-market practice | v1.0 Validated |
| No dark mode | Practice doesn't need it | v1.0 Validated |
| Appointment booking separate | Complex feature for later | Deferred |
| Remove podcast/events/stats/deals/app sections | Not relevant for medical practice | v1.0 Validated |
| Motion v12 for animations | Complex animation requirements need robust library | v1.0 Validated |
| Sanity modular schema | Every content piece independently editable | v1.0 Validated |
| No separate blog listing page | Homepage shows 2 latest posts; deliberate scope decision | v1.0 Accepted |
| Service card colors hardcoded | Not CMS-editable; locked in Phase 4 | v1.0 Validated |
| Server Component data fetching | All Sanity fetches in page.tsx/layout.tsx, never in section components | v1.0 Validated |

---
*Last updated: 2026-02-21 after v1.0 milestone completion*
