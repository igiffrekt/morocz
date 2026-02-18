# Pitfalls Research

**Domain:** Next.js + Sanity CMS + Framer Motion — Single-practice medical website (Hungary)
**Researched:** 2026-02-18
**Confidence:** MEDIUM-HIGH (verified across official docs, GitHub issues, and multiple practitioner sources)

---

## Critical Pitfalls

### Pitfall 1: AnimatePresence Page Transitions Silently Break in Next.js App Router

**What goes wrong:**
Developers implement Framer Motion's `AnimatePresence` for page exit animations, it appears to work in development, and then either silently fails or breaks at deploy time. The Next.js App Router updates its context on every navigation, causing components to unmount abruptly before exit animations complete. The most fragile workaround (FrozenRouter) relies on unexposed Next.js internal methods and breaks across minor Next.js version upgrades.

**Why it happens:**
The App Router's architecture does not expose stable routing state to animation libraries. Framer Motion's `AnimatePresence` requires a component to remain mounted during its exit animation, but Next.js unmounts the previous page immediately on navigation. This is a documented, unresolved structural mismatch as of early 2026.

**How to avoid:**
Do not rely on full-page exit animations. Instead:
- Use `template.js` files (Next.js App Router feature) to wrap page content — these re-render on navigation and support enter animations via `motion` components
- Keep exit animations within a single page's component tree (component mount/unmount within a page, not between pages)
- For section transitions (services filter, modal open/close), use `AnimatePresence` locally within a client component — this works correctly
- Accept that inter-page transitions are a known limitation; use subtle enter-only animations as the reliable pattern

**Warning signs:**
- Animations visible in `next dev` but absent or jumpy in `next build && next start`
- GitHub issue [#49279](https://github.com/vercel/next.js/issues/49279) is still open
- Any tutorial using `AnimatePresence` wrapping the entire layout — verify its Next.js version and test it yourself

**Phase to address:**
Foundation phase (before any animation work). Establish the animation architecture decision (enter-only per page, local AnimatePresence for UI components) before individual pages are built.

---

### Pitfall 2: Flooding the Client Bundle by Misplacing "use client"

**What goes wrong:**
Every component that uses Framer Motion requires `"use client"`. Developers often add `"use client"` to layout files or parent wrappers, which makes the entire subtree — including components that could have been server-rendered — part of the client JavaScript bundle. This defeats App Router's primary performance benefit and can balloon the JS payload sent to users.

**Why it happens:**
The boundary rule is invisible: once a file is marked `"use client"`, every import inside it is also treated as client code. Developers used to the Pages Router add the directive wherever an error appears without understanding this cascading effect. On a medical website with Next.js Image-optimized content, server components should be handling most rendering.

**How to avoid:**
- Add `"use client"` only at the leaf level: the specific component that uses `motion.*` or React hooks
- Create thin wrapper components: `AnimatedCard.tsx` (client) wraps a `CardContent.tsx` (server) passed as `children`
- Providers (Framer Motion's `MotionConfig`, theme context) should be isolated Client Components that accept `children` as a prop and render in the root layout
- Example pattern:
  ```tsx
  // providers.tsx — "use client"
  export function Providers({ children }: { children: React.ReactNode }) {
    return (
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    );
  }
  // layout.tsx — Server Component
  import { Providers } from './providers';
  export default function Layout({ children }) {
    return <Providers>{children}</Providers>;
  }
  ```

**Warning signs:**
- `next build` shows unexpectedly large First Load JS for pages that are mostly static
- Lighthouse JS bundle analysis shows animation library imported on pages with no visible animations
- Any `"use client"` directive in `layout.tsx`, `page.tsx`, or other structural files

**Phase to address:**
Foundation phase. Define the client/server component boundary map before building any animated components.

---

### Pitfall 3: Layout Animations (Card Shuffle) Causing Cumulative Layout Shift

**What goes wrong:**
Implementing a services filter with Framer Motion's `layout` prop appears smooth in development but scores poorly on CLS in production. The layout animation reflows the grid as cards enter/exit, and if `layoutScroll` is not set on scrollable ancestors or if non-transform CSS properties are animated, the browser registers real layout shifts that Google measures as CLS.

**Why it happens:**
CLS measures unexpected visual shifts from the browser's perspective. Framer Motion's layout animations use FLIP technique (transform-based), which is GPU-accelerated and should not trigger CLS — but only when implemented correctly. Animating `width`, `height`, `margin`, or `padding` directly (not via transform) will cause real layout shifts. Additionally, Framer Motion does not automatically detect scroll containers, requiring explicit `layoutScroll` annotation.

**How to avoid:**
- Use `layout="position"` instead of `layout={true}` when animating card positions — this limits what gets animated and reduces CLS risk
- Only animate `transform` and `opacity` for card enter/exit; never animate `height`, `width`, or margin values directly
- Add `layoutScroll` prop to any scrollable ancestor of the animated grid
- Test CLS with Chrome DevTools Performance panel and PageSpeed Insights before considering feature complete
- Wrap the card grid in a `LayoutGroup` to coordinate animations:
  ```tsx
  <LayoutGroup>
    {filteredServices.map(s => (
      <motion.div key={s._id} layout="position" exit={{ opacity: 0 }}>
        <ServiceCard service={s} />
      </motion.div>
    ))}
  </LayoutGroup>
  ```

**Warning signs:**
- PageSpeed Insights CLS score above 0.1 after deploying the services section
- Visible "jump" in page content when filter category changes
- Any direct animation of `width`/`height` values in motion component props

**Phase to address:**
Services section phase. Run CLS audit as part of the definition of done for filter/shuffle feature.

---

### Pitfall 4: Sanity Schema Over-Granularity vs. Rigidity — Getting It Wrong in Both Directions

**What goes wrong:**
Two failure modes occur: (1) Over-engineering — building a highly modular "page builder" schema with dozens of block types before understanding the actual content needs, resulting in an editor UI that buries the doctor under configuration options; (2) Under-engineering — building flat, page-specific schemas that hardcode content structure, making it impossible to reuse a "service card" format across the services listing, homepage teaser, and internal links.

**Why it happens:**
Sanity's flexibility makes it tempting to model everything as blocks. Developers lean toward either total flexibility (page builder) or total rigidity (one schema per page type) without a middle ground. For a single-practice medical site, the content types are well-understood and limited — aggressive modularization wastes time and confuses the non-technical editor (the doctor or their staff).

**How to avoid:**
- Define content types from actual content inventory first: services, team members, testimonials, contact info, opening hours — these are the real documents
- Use `object` types for shared field groups (e.g., `seo`, `ctaButton`) without making them standalone documents
- Use Portable Text (`array` of `block`) only for rich-text fields, not for page layout
- Keep the Studio editor UI simple: the doctor should be able to edit a service description without navigating nested block arrays
- Schema for a medical practice should have roughly 5-8 document types maximum; resist adding more until a real need is proven

**Warning signs:**
- Schema file count exceeds 15 before the site has real content
- The Studio preview requires 3+ levels of nesting to reach editable text
- A non-technical editor test session results in confusion about where to edit the homepage headline

**Phase to address:**
Content architecture phase (before any front-end component work). Lock schema structure after a content inventory review.

---

### Pitfall 5: Sanity CDN Serving Stale Content After Edits (ISR Cache Layer Conflict)

**What goes wrong:**
The doctor edits a service page in Sanity Studio and publishes it. The live website still shows the old content for minutes or hours. This happens even with webhook-triggered ISR revalidation in place because the Sanity CDN caches content independently of Next.js, and Next.js may re-fetch data from Sanity's CDN before that cache has cleared.

**Why it happens:**
Two independent caches exist: Sanity's own CDN (which caches API responses) and Next.js's data cache (managed via `revalidate` or `fetch` cache). Sanity's GROQ-powered webhooks fire at mutation time, which may be before Sanity's CDN has propagated the change. When Next.js re-fetches on webhook trigger, it hits Sanity's CDN and gets the old data, populating the Next.js cache with stale content.

**How to avoid:**
- Set `useCdn: false` in the Sanity client used for server-side data fetching in Next.js; reserve CDN-enabled client only for non-critical or highly stable content
- Add a deliberate delay (500ms–2s) in the webhook revalidation handler before calling `revalidatePath()`
- Use Sanity's tag-based revalidation with `next-sanity` toolkit for granular cache invalidation
- For a medical site with a non-technical editor, on-demand ISR (webhook-triggered) is preferable to time-based ISR — stale opening hours or appointment information has real consequences

**Warning signs:**
- Content edits in Sanity Studio take more than 30 seconds to appear on the live site
- Webhook logs show successful delivery but page still shows old content
- `useCdn: true` appears in the server-side Sanity client configuration

**Phase to address:**
CMS integration phase. Test the full edit-to-publish cycle (Sanity Studio → webhook → Next.js cache → live page) before launch.

---

### Pitfall 6: Ignoring prefers-reduced-motion — Accessibility and Medical Context

**What goes wrong:**
A heavily animated medical website causes vestibular disorders for users with motion sensitivity. Patients visiting a doctor's website may include elderly users, people with chronic illness, or users who have enabled reduced motion for medical reasons. Deploying animations without respecting the OS-level reduced motion setting is both an accessibility failure and a poor fit for the audience.

**Why it happens:**
Framer Motion animations look impressive in demos and developers apply them liberally. The `prefers-reduced-motion` media query is easy to forget during implementation. Medical websites serve a population with higher rates of motion sensitivity than general consumer websites.

**How to avoid:**
- Apply `MotionConfig` with `reducedMotion="user"` at the root layout level — this single configuration causes all `motion.*` components to automatically skip transform/layout animations for users who have enabled reduced motion in their OS
  ```tsx
  // providers.tsx
  <MotionConfig reducedMotion="user">
    {children}
  </MotionConfig>
  ```
- Opacity transitions are preserved even in reduced motion mode (they are not spatial/vestibular triggers) — use fade-ins instead of slides as fallbacks
- Test by enabling "Reduce Motion" in macOS/Windows accessibility settings before each animation feature is marked done

**Warning signs:**
- No `MotionConfig reducedMotion` anywhere in the codebase
- Animations use `x`, `y`, `rotate`, `scale` without any reduced-motion consideration
- Any `useReducedMotion()` hook usage without corresponding graceful fallback

**Phase to address:**
Foundation phase, alongside client/server boundary setup. One-time MotionConfig setup prevents all downstream violations.

---

### Pitfall 7: Medical Schema Markup Overreach — Spending Time on Schema Types Google Ignores

**What goes wrong:**
Developers implement elaborate Schema.org markup using medical-specific types (`MedicalCondition`, `MedicalTherapy`, `Symptom`, `Drug`) across every service page, expecting improved rich results. Google does not support these medical schema types for rich results, and the effort produces no measurable SEO benefit.

**Why it happens:**
Schema.org defines many medical types, but Google's supported structured data list is much smaller. Developers conflate "Schema.org supports it" with "Google uses it for rich results," especially when reading SEO advice that overstates the impact of medical schema.

**How to avoid:**
Focus only on schema types that Google actively uses for local medical practices:
- `MedicalClinic` (subtype of `LocalBusiness`) on the homepage — enables local knowledge panel
- `LocalBusiness` with NAP (Name, Address, Phone) — local SEO
- `BreadcrumbList` — sitewide navigation context
- `WebSite` with `SearchAction` — enables sitelinks search box potential
- `Service` on service detail pages — general service markup
- Avoid: `MedicalCondition`, `MedicalTherapy`, per-symptom markup — these produce no rich results

For Hungarian local SEO: ensure `addressLocality`, `addressRegion`, and `areaServed` fields are populated with Hungarian characters correctly encoded in JSON-LD.

**Warning signs:**
- Schema implementation file exceeds 200 lines of medical-specific types
- Google Search Console Rich Results Test shows no eligible rich results despite schema
- Schema markup contains types not listed at [Google's supported structured data](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)

**Phase to address:**
SEO foundation phase. Implement schema during initial page setup, not as a retrofit.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `"use client"` on page-level components | Silences Framer Motion errors immediately | Entire page ships as JS, losing SSR benefits | Never — always push to leaf components |
| Hardcoding service list in JSX instead of Sanity | Faster initial build | Doctor cannot edit services without developer | Never for content that changes |
| `useCdn: true` in server-side Sanity client | Slightly faster build queries | Stale content after edits in production | Never for editorial content |
| Skipping `MotionConfig reducedMotion` | Saves 5 minutes setup | Accessibility violation, potential WCAG failure | Never |
| Time-based ISR only (no webhooks) | No webhook infrastructure needed | Content edits take up to `revalidate` seconds to appear | Acceptable for blog content, never for contact/hours |
| Inline JSON-LD schema in every page | Simple implementation | Duplicate schema, harder to maintain | Only for MVP; extract to shared utility |
| Skipping `sizes` attribute on `next/image` | Simpler image markup | Browser fetches full-resolution image on mobile | Never — causes significant performance regression |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sanity + Next.js Image | Using raw `urlFor(image).url()` without dimensions | Use `urlFor(image).width(800).url()` with proper `sizes` attribute and `fill` or explicit `width`/`height` on `<Image>` |
| Sanity Portable Text | Using `react-portable-text` (outdated) | Use `@portabletext/react` with custom components for images, callouts, and embeds |
| Framer Motion + Next.js | Importing `motion` in Server Components | Create thin `"use client"` wrapper; import motion only in that file |
| Sanity + ISR | `useCdn: true` on server-side fetch client | `useCdn: false` for server-side; CDN client only for client-side fetches |
| GDPR cookie consent + analytics | Embedding Google Analytics script without consent gate | Use consent-aware loading; fire GA only after explicit opt-in (required in Hungary/EU) |
| Sanity Draft Mode | Querying without `perspective: 'previewDrafts'` in draft mode handler | Use `sanity.withConfig({ perspective: 'previewDrafts' })` and validate the preview secret token |
| Sanity + Hungarian content | Assuming ASCII-safe slug generation | Configure Sanity slug field with Hungarian character normalization (`á→a`, `ő→o` etc.) or use `slugify` with `hu` locale |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full document projection from Sanity (no field selection) | Slow GROQ queries; large data payloads | Always project only needed fields: `{ _id, title, slug, excerpt }` not `{ ... }` | Immediately on pages with many references |
| Resolving nested references with `->` without limits | Query timeout for services with multiple nested refs | Limit depth; use `[0...5]` on arrays; avoid triple-nested `->->->` | At 3+ levels of reference nesting |
| Loading all Framer Motion variants on page load | Large initial JS bundle; poor LCP | Code-split animated sections with `dynamic(() => import(...), { ssr: false })` for below-fold animations | Immediately on 3G connections |
| Animating `height: 'auto'` for accordion/expand | Choppy animation, browser layout recalculation on every frame | Use `motion` with explicit pixel values or use CSS `max-height` trick; or use Framer Motion's `layout` prop on the container | Immediately, visible in any profiler |
| Not setting `priority` on LCP hero image | Hero image lazy-loaded, poor LCP score | Set `priority` prop on `<Image>` for the above-fold hero image | Always — LCP directly affects Core Web Vitals |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Embedding patient inquiry form data in Sanity without data classification | Health-adjacent data (symptoms, conditions mentioned in contact) stored without proper data processing agreement | Do not store form submissions in Sanity; route contact form to email only (via server action to SMTP/Resend), never to database |
| Exposing Sanity write token in client-side code | Anyone can write/delete CMS content | Sanity write tokens only in server-side environment variables; never in `NEXT_PUBLIC_*` variables |
| No cookie consent before loading Google Analytics or Facebook Pixel | GDPR violation; Hungarian NAIH (data protection authority) enforcement risk | Implement cookie consent management (e.g., `cookie-consent` library) with explicit opt-in before any tracking scripts load |
| Sanity preview secret token in public environment variable | Anyone can activate draft mode and read unpublished content | Preview secret must be `SANITY_PREVIEW_SECRET` (server-only), never `NEXT_PUBLIC_*` |
| Contact form without CSRF protection or rate limiting | Spam, form abuse, potential data harvesting | Use Next.js server actions (CSRF protected by default) + rate limiting on the route |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Carousel for testimonials with no keyboard navigation | Non-mouse users (keyboard, screen reader) cannot access all testimonials | Use Motion+ Carousel (built-in ARIA + keyboard nav) or implement ARIA `role="region"` with `aria-roledescription="carousel"` and keyboard handlers |
| Scroll-triggered animations firing before content is visible on slow connections | Content flashes in after delay, disorienting users | Use `whileInView` with `once: true`; set `viewport={{ amount: 0.3 }}` to prevent premature trigger |
| Hungarian special characters breaking URL slugs | 404 errors when sharing links with `ő`, `ű`, `á` in URLs | Normalize slugs to ASCII equivalents in Sanity slug generation; `ő→o`, `á→a`, never put raw Hungarian characters in URL paths |
| Doctor photo/team image displayed at wrong aspect ratio | Unprofessional appearance; key trust signal damaged | Always specify explicit `aspect-ratio` in CSS for image containers; use Sanity image hotspot/crop to control focal point |
| Animated section staggering with 8+ items | Excessive wait time before last items appear | Cap stagger delay at 0.05–0.08s per item; total animation sequence should not exceed 0.6s for a full list |

---

## "Looks Done But Isn't" Checklist

- [ ] **Services filter animation:** Verify CLS score in PageSpeed Insights (must be < 0.1) — animation may look smooth but still register layout shifts
- [ ] **Sanity content updates:** Test the full cycle — edit in Studio, publish, verify live page updates within 30 seconds — many developers only test in development
- [ ] **Hungarian characters in slugs:** Verify that a service like "Fül-orr-gégészet" generates a slug like `ful-orr-gegeszet`, not a URL-encoded or broken slug
- [ ] **prefers-reduced-motion:** Enable OS reduced motion setting and verify all animations either stop or fade-only — stagger animations and card shuffles should become instant
- [ ] **Cookie consent before analytics:** Open site in incognito, confirm no network requests to Google Analytics, Facebook, or tracking pixels before consent banner interaction
- [ ] **Mobile hero image LCP:** Run PageSpeed on mobile — confirm hero image loads with `priority` and is not lazy-loaded
- [ ] **Schema markup validation:** Run Google Rich Results Test on homepage — confirm `MedicalClinic` + `LocalBusiness` structured data is valid and error-free
- [ ] **Sanity draft mode security:** Verify `/api/draft` route rejects requests without valid preview secret token
- [ ] **Contact form server-side:** Confirm form submissions route to email only, not stored in Sanity or any client-accessible endpoint
- [ ] **Carousel keyboard navigation:** Tab to testimonial carousel and confirm arrow keys advance slides; screen reader announces slide count

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| AnimatePresence page transitions broken after Next.js upgrade | LOW | Remove inter-page AnimatePresence; replace with enter-only animations per page using `template.js` |
| Entire page tree marked `"use client"` | MEDIUM | Audit component tree with `next build` bundle analysis; extract Server Components; rebuild provider hierarchy |
| Sanity schema needs restructuring after content is live | HIGH | Use Sanity's content migration API (`sanity exec migration.ts`); plan schema changes before publishing live content |
| CLS failure on services filter | LOW | Replace direct CSS property animations with `layout="position"` prop; add `layoutScroll` to scroll containers |
| Stale content after Sanity webhook | LOW | Set `useCdn: false` on server client; add 500ms delay to webhook handler; test full publish cycle |
| GDPR consent missing (analytics loaded without consent) | MEDIUM | Remove analytics script; implement consent manager; re-deploy; inform users via privacy policy update |
| Hungarian slug URLs returning 404 after content migration | MEDIUM | Add slug redirect map in `next.config.js` redirects; regenerate slugs with proper normalization |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| AnimatePresence page transitions break | Foundation / Project Setup | Test page navigation animations in production build before any feature work |
| `"use client"` bundle flooding | Foundation / Project Setup | Run `next build` and check First Load JS per page; gate at < 100kb |
| Layout animation CLS | Services Section / Animated Components | PageSpeed Insights CLS < 0.1 before marking feature done |
| Sanity schema rigidity/over-engineering | Content Architecture (pre-frontend) | Content editor walkthrough with non-technical user before frontend build begins |
| Sanity CDN stale content | CMS Integration | Full edit-to-publish cycle test with timing measurement |
| prefers-reduced-motion ignored | Foundation / Project Setup | OS reduced motion test before any animated component is committed |
| Medical schema overreach | SEO Foundation | Google Rich Results Test validation; no schema types outside Google-supported list |
| GDPR cookie consent | Compliance / Analytics Setup | Network tab inspection in incognito before consent interaction |
| Hungarian slug breakage | Content Architecture | Create service/doctor page with Hungarian name; verify URL and slug |
| Carousel accessibility | Testimonials / Interactive Components | Keyboard-only navigation test; VoiceOver/NVDA screen reader test |

---

## Sources

- [Framer Motion App Router shared layout issue — Next.js GitHub #49279](https://github.com/vercel/next.js/issues/49279)
- [Solving Framer Motion Page Transitions in Next.js App Router — imcorfitz.com](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router)
- [Common mistakes with the Next.js App Router — Vercel official blog](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Motion React Accessibility docs — motion.dev](https://motion.dev/docs/react-accessibility) (HIGH confidence — official docs)
- [Create accessible animations in React — Motion official docs](https://motion.dev/docs/react-accessibility)
- [Framer Motion Layout Animations — framer.com/motion](https://www.framer.com/motion/layout-animations/) (HIGH confidence — official docs)
- [High performance GROQ — Sanity official docs](https://www.sanity.io/docs/developer-guides/high-performance-groq) (HIGH confidence — official docs)
- [Sanity schema design best practices — Halo Lab](https://www.halo-lab.com/blog/creating-schema-in-sanity) (MEDIUM confidence — practitioner)
- [Sanity webhook on-demand ISR — Victor Eke](https://victoreke.com/blog/sanity-webhooks-and-on-demand-revalidation-in-nextjs) (MEDIUM confidence — practitioner, verified against official docs)
- [Image optimization with Next.js and Sanity — Sanity recipes](https://www.sanity.io/recipes/the-best-next-js-and-sanity-less-than-image-greater-than-component-afe973cc) (HIGH confidence — official Sanity)
- [GDPR cookie consent requirements Hungary — Chambers Data Protection Guide 2025](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2025/hungary) (MEDIUM confidence)
- [Healthcare website accessibility deadline May 2026 — Carenetic Digital](https://careneticdigital.com/healthcare-website-accessibility-the-may-2026-deadline/) (MEDIUM confidence)
- [Medical schema markup — Google does not support all types (AmpiRe)](https://ampifire.com/blog/medical-schema-markup-how-seos-are-scamming-healthcare-clinics/) (MEDIUM confidence — verified against Google Search Gallery)
- [Motion+ Carousel with built-in accessibility — motion.dev](https://motion.dev/blog/introducing-the-motion-carousel) (HIGH confidence — official Motion docs)
- [Core Web Vitals optimization Next.js 2025 — Makers Den](https://makersden.io/blog/optimize-web-vitals-in-nextjs-2025) (MEDIUM confidence)

---
*Pitfalls research for: Morocz Medical — Next.js + Sanity CMS + Framer Motion medical practice website*
*Researched: 2026-02-18*
