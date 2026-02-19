# Phase 4: Services + Lab Tests - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Filterable service cards with animated layout shuffle and lab test pricing cards on dark background. Both sections are fully CMS-driven from Sanity. Category filter tabs switch displayed services with smooth animation. Lab tests show fixed pricing on pastel cards over dark navy.

</domain>

<decisions>
## Implementation Decisions

### Service filter tabs
- Rounded pill-shaped buttons in a horizontal row, scrollable on mobile
- Active tab: dark navy (#242a5f) background with white text
- Inactive tabs: light/outlined style on the white container background
- No "All" tab — first category selected by default
- Categories populated from Sanity ServiceCategory documents, ordered by `order` field

### Service cards
- Each card shows: icon/image + service name + short description
- Light gray cards with no shadow (flat, soft blend)
- 4-column grid on desktop, 2 columns on mobile
- Cards sit inside a white rounded-corner container section

### Filter animation
- Smooth layout shuffle animation (Motion layout animation) when switching categories
- Cards slide and reorder into new positions (~500ms, smooth and calm)
- Matches the relaxed animation pace of the rest of the site

### Lab test section
- Full dark navy (#242a5f) background with rounded corners (matching site's rounded container style)
- Separate section from services, with standard page gap between them
- "További vizsgálatok" link/button at the bottom

### Lab test cards
- Each card shows: test name + short description + fixed price
- No discount pricing, no "from" prefix — just the fixed price in Ft
- Pastel background colors cycling through: #ffebe4 (peach), #edf8f3 (mint), #fdf8eb (cream)
- Cards on the dark navy background create colorful contrast

### Section headings
- Each section has a single heading, no subtitle
- Services: e.g. "Szolgáltatásaink"
- Lab tests: e.g. "Laborvizsgálatok"

### Claude's Discretion
- Exact card border radius and padding
- Card icon/image sizing
- Filter tab spacing and padding
- Lab test card grid columns
- Section heading typography and alignment
- "További vizsgálatok" button/link styling
- Mobile tab scroll behavior details

</decisions>

<specifics>
## Specific Ideas

- Service cards should feel flat and minimal — no shadows, light gray background blending softly
- Lab test pastel cards on dark navy should feel colorful and warm, not clinical
- Animation speed ~500ms matching the calm, smooth pace already established in hero card animations (duration-700 ease-out)
- Price display format: just the number + "Ft" (e.g. "8 000 Ft")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-services-lab-tests*
*Context gathered: 2026-02-19*
