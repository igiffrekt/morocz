# Morocz Medical

## What This Is

A single-practice medical website for Morocz Medical in Esztergom, Hungary. A modern, visually polished, Hungarian-language homepage with advanced animations, modular Sanity CMS content management, and excellent SEO. The site showcases the practice's services, lab tests, patient testimonials, and a blog — with every content element independently editable from Sanity.

## Core Value

Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero section with animated headline, doctor image, floating badges, and CTA
- [ ] 4 colored service cards (yellow, green, pink, blue) with staggered entrance animations
- [ ] Services section with category filter tabs and animated card shuffle/reorder
- [ ] Lab tests section on dark background with illustrated cards, discounts, and pricing
- [ ] Patient testimonials carousel with dot navigation
- [ ] Blog section with categorized article cards
- [ ] Footer with navigation links, social icons, and large logo on pink background
- [ ] Intro animation: logo typewriter effect on dark background, fade-up transition to content
- [ ] Closing animation: circle wipe shrinking to center dot on pink background
- [ ] Scroll-triggered section entrance animations throughout
- [ ] Button hover animations (arrow icon slide, background transitions)
- [ ] Sanity CMS: every text, image, list item, button text, category order independently editable
- [ ] Hungarian language only — all content in Hungarian
- [ ] SEO optimization: semantic HTML, meta tags, structured data, performance
- [ ] Responsive design across all breakpoints
- [ ] Header with logo, navigation, and contact/login actions

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

A complete HTML/CSS design template exists at `home_design/code.html` with a full-page screenshot at `home_design/screen.png`. This is a MediCare template that will be adapted for Morocz Medical.

**Design system from template:**
- Colors: primary `#23264F` (dark navy), secondary `#F4DCD6` (light pink), accent `#99CEB7` (green)
- Card colors: yellow `#FAE988`, green `#A8DABC`, purple `#EABDE6`, blue `#8FB8FF`
- Background: `#F2F4F8` (light gray)
- Font: Plus Jakarta Sans (weights 400-800)
- Border radius: 1rem default, up to 2.5rem for large cards
- Max content width: 88rem

### Animation Reference

A detailed frame-by-frame animation reference exists in `animations/` (~260 PNG frames from frame00081 to frame01411). These frames document every animation pattern to implement:

**Intro sequence:**
- Logo typewriter: Letters appear one by one on dark navy `#23264F` background
- Logo fades up and scales out
- Page scroll-up transition: content rises from below, pink background revealed first, then hero content

**Hero section animations:**
- "Healthcare" headline: staggered letter-by-letter animation (large serif-style text)
- Doctor image: fade in from right
- Floating badges ("Reduce HbA1c", "No more medications"): float in with slight bounce
- 4 service cards: staggered entrance from bottom — yellow first, then green, pink, blue
- "Book Consultation" button hover: arrow icon circle slides/expands right on hover

**Services filter section:**
- Category filter tabs: horizontal scrollable pills with active state (dark bg + emoji icon)
- Tab switching: cards perform layout shuffle animation — cards slide horizontally and reorder positions with smooth transitions
- Continuous horizontal carousel behavior within the filtered results

**Lab tests section:**
- Dark navy background section transition
- Illustrated cards with discount badges (80%) and pricing with strikethrough original
- Cards fade/slide in on scroll

**Testimonials section:**
- Carousel with dot navigation
- Smooth horizontal slide between testimonials

**Blog section:**
- Cards with category tags appear on scroll
- "READ ALL BLOGS" link

**Footer:**
- Dark navy background, 4-column navigation layout
- Large logo on pink `#F4DCD6` background at bottom

**Closing animation:**
- Circle wipe/mask: page shrinks into a circle in center
- Circle contracts to small white dot
- Pink background remains as final state

**Global interaction patterns:**
- All sections have scroll-triggered entrance animations
- Button hover: arrow icons animate, background color transitions
- "Add to" / CTA buttons: highlight state on hover
- Smooth, refined timing — nothing jarring

### Sections to Build (in page order)

1. **Header** — Logo, navigation links, search, location selector
2. **Hero** — Large headline, subtext, doctor image, floating badges, CTA button, 4 service cards
3. **Services (filter section)** — Category filter tabs, service/provider cards with shuffle animation
4. **Lab Tests** — Dark background, illustrated test cards with pricing
5. **Testimonials** — Patient review carousel
6. **Blog** — Article cards with categories
7. **Footer** — Navigation columns, social links, large logo

### Sections Removed from Template

- Podcast card (yellow feature grid)
- Live Event card (green feature grid)
- Statistics counters (Years Experience, Happy Customers)
- Google rating banner
- "Today's best deals" product section
- App download section
- "Your health is our Top priority" banner

### Team Approach

The user wants a collaborative development team mindset:
- Frontend developer, backend/CMS developer, UI/UX expert, code quality reviewer, SEO specialist, tester, and optimizer
- Team members should challenge each other, debate approaches, and strive for the best possible product
- This translates to rigorous code review, SEO audits, performance optimization, and accessibility checks throughout development

## Constraints

- **Tech Stack**: Next.js (App Router) + Tailwind CSS + Sanity CMS — decided, non-negotiable
- **Language**: Hungarian only — all UI text, content, and meta tags in Hungarian
- **Animation Library**: Framer Motion (inferred from animation complexity requirements)
- **CMS Granularity**: Fixed page layout, but every list item, text, button text, image, and category order must be independently editable in Sanity
- **Design Fidelity**: Must closely match the provided HTML template design system (colors, fonts, spacing, border radius)
- **SEO**: Must achieve excellent SEO scores — semantic HTML, meta tags, structured data, Core Web Vitals optimization
- **Code Quality**: Production-grade code with proper typing, testing, and optimization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Tailwind + Sanity | User's explicit choice; modern, well-supported stack | -- Pending |
| Hungarian only | Single-market practice, no internationalization needed | -- Pending |
| No dark mode | Practice doesn't need it, reduces scope | -- Pending |
| Appointment booking separate | Complex feature, will be integrated later | -- Pending |
| Remove podcast/events/stats/deals/app sections | Not relevant for a medical practice site | -- Pending |
| Framer Motion for animations | Complex animation requirements (typewriter, staggered, layout shuffle, circle wipe) need a robust animation library | -- Pending |
| Sanity modular schema | Every content piece independently editable — maximum CMS flexibility | -- Pending |

---
*Last updated: 2026-02-18 after initialization*
