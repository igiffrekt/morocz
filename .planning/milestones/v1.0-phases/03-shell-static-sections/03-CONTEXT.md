# Phase 3: Shell + Static Sections - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the header, hero section, and footer — the three visible shell sections a visitor sees on homepage load. All content driven from Sanity, fully responsive from 320px to 1440px+. Animations for hero elements are included (letter-by-letter headline). Services section, testimonials, blog, and other homepage sections are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Header & mobile menu
- Mobile hamburger menu: **dropdown from header** — menu expands downward below the header, pushing page content down (not slide panel or overlay)
- Header CTA: **prominent colored button** (e.g. "Foglaljon időpontot") visible on desktop, collapses into the mobile menu on small screens
- Scroll behavior: **shrink + shadow** — header gets slightly shorter with a subtle drop shadow when user scrolls down from top
- Navigation structure: **flat links only** — simple horizontal list (e.g. Szolgáltatások, Laborvizsgálatok, Blog, Kapcsolat), no dropdown menus

### Hero composition
- Doctor image: **must be a real photo** of Dr. Morocz — this is a blocker, photo must be available in Sanity before the hero can be fully built
- 4 service cards (yellow, green, pink, blue): **horizontal row below hero** — all 4 cards in a single row spanning full width below the headline area on desktop
- Floating badges: **2-3 badges, editable from Sanity** — stats/credential badges with text managed in CMS (e.g. "15+ év tapasztalat")
- Headline animation: **full letter-by-letter stagger built in Phase 3** — not deferred to Phase 7, implement the staggered entrance animation now

### Footer layout
- Column structure: **3 columns** on desktop (e.g. Services | Quick Links | Contact Info)
- Large logo on pink: **contained pink card/block inside the footer grid** — not a full-width band, a rectangular block within the layout
- Map: **no map at all** — just the text address in the contact column (avoids GDPR cookie issues)
- Social icons: **CMS-driven only** — render icons only for platforms that have URLs filled in Sanity siteSettings (no hardcoded platform set)
- Privacy policy link: visible in footer (content/page itself is Phase 6)

### Responsive behavior
- Breakpoints: **Tailwind defaults** — sm:640, md:768, lg:1024, xl:1280
- Hero service cards on mobile: **2x2 grid** — all 4 visible without scrolling
- Doctor image on mobile: **hidden** below ~768px to save vertical space
- Floating badges on mobile: **visible but repositioned** — move below headline instead of floating/absolute positioned
- Footer columns: stack to single column on mobile (standard responsive pattern)

### Claude's Discretion
- Exact spacing, padding, and typography sizing
- Header height values (initial and shrunk states)
- Badge positioning and bounce animation parameters
- Footer column content assignment
- Mobile menu close behavior (tap outside, X button, or both)
- Loading states while Sanity data fetches

</decisions>

<specifics>
## Specific Ideas

- Service card colors are hardcoded in code (yellow, green, pink, blue) — locked decision from Phase 2
- All Sanity data fetching stays in Server Components (page.tsx / layout.tsx) — section components receive data as props
- The hero needs to feel complete with real content — placeholder doctor image is not acceptable
- Hungarian language for all visible text

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-shell-static-sections*
*Context gathered: 2026-02-19*
