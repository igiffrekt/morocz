---
phase: 7
title: Animation Polish + Performance
status: ready
created: 2026-02-21
---

# Phase 7 Context: Animation Polish + Performance

## 1. Intro Typewriter Sequence

### What plays
- **Logo icon** (`/public/mm-logo-square.svg`) fades in first (centered on dark navy `#23264F` screen)
- Then **"Dr. Mórocz Angéla"** types out character-by-character to the right of the icon
- Two-stage reveal: icon first (~0.3s), then typewriter (~1.0s)

### Timing
- **Total duration: ~2 seconds** (snappy, not cinematic)
- Breakdown: ~0.3s icon fade + ~1.0s typewriter + ~0.7s transition to content

### Transition to content
- **Slide up** matching the reference: dark navy panel slides upward, revealing page content beneath
- Content is already rendered behind the overlay — the panel lifts to expose it

### Repeat visit behavior
- **First visit**: Full typewriter + slide-up transition (~2s)
- **Repeat visits** (same session): Quick 0.5s fade-in, skip typewriter entirely
- Use `sessionStorage` to track — resets on new browser session

### Logo asset
- Icon: `/public/mm-logo-square.svg` (butterfly/leaf gradient icon, no text)
- Full logo: `/public/mm-logo-web.svg` (icon + "Mórocz Medical" text — NOT used in intro)

## 2. Closing Circle Wipe

### Trigger
- **On page navigation away** — only internal content links (blog posts, lab test detail pages)
- Does NOT trigger on: anchor links (#services), external links, phone/email links, footer utility links
- Homepage → blog post: circle wipe plays, then `/blog/[slug]` loads
- Homepage → lab test: circle wipe plays, then `/laborvizsgalatok/[slug]` loads

### Animation
- Circle mask contracts from full viewport to center point
- Background: pink `#F4DCD6`
- Final state: small white dot centered on pink
- **Duration: ~1s** (medium pace)

### After completion
- Pink screen stays briefly (~0.2s), then the new page loads on top
- No auto-scroll, no CTA overlay — just a clean transition

### Technical approach
- Intercept `<Link>` navigation with a wrapper component
- Play CSS clip-path circle animation
- After animation completes, execute the actual navigation via `router.push()`
- Needs to work with Next.js App Router client-side navigation

## 3. Scroll-Triggered Section Entrances

### Animation pattern
- **Mix approach**: Section headings/text blocks fade-up as a unit; card grids (services, lab tests, blog) have staggered individual card entrances
- This means: heading fades up → then cards stagger in one by one

### Sections and their animations
| Section | Animation |
|---------|-----------|
| Hero (headline, subtitle, badges) | Fade-up as a unit (same as other sections, no special treatment) |
| Hero service cards | Staggered card entrance from bottom |
| Services section heading | Fade-up |
| Services filter tabs | Fade-up with heading |
| Services cards | Staggered card entrance |
| Lab tests heading | Fade-up |
| Lab test cards | Staggered card entrance |
| Testimonials heading | Fade-up |
| Testimonial carousel | Fade-up as unit |
| Blog heading | Fade-up |
| Blog cards | Staggered card entrance |
| Footer | Fade-up as unit |

### Behavior
- **Play once only** — sections animate in the first time, then stay visible permanently
- Use `whileInView` with `once: true`
- **Trigger threshold: 20%** (`amount: 0.2`) — animation starts early while user is scrolling toward section

### Timing defaults
- Fade-up duration: 0.5s
- Stagger delay between cards: 0.1s
- Ease: `easeOut`

## 4. Core Web Vitals (implicit — no discussion needed)

### Targets (from success criteria)
- LCP < 2.5s on mobile
- CLS < 0.1
- INP in passing range

### Key concerns
- Intro overlay must not block LCP measurement — render page content behind it
- Staggered animations must not cause layout shifts (use `opacity` + `transform` only)
- Motion library bundle size — use tree-shaking, avoid importing full library
- Images: ensure proper `sizes`, `priority` on hero image, lazy-load below-fold

## 5. Reduced Motion

### Behavior (from MotionConfig already in place)
- `MotionConfig reducedMotion="user"` is already wrapping the app
- When OS prefers reduced motion: all animations are skipped, content appears immediately
- Intro overlay should still appear but skip the typewriter — show logo + name immediately, then quick fade to content
- Circle wipe should be replaced with a simple fade transition

## Deferred Ideas

(None captured during discussion)
