# Architecture Research

**Domain:** Single-practice medical website (Next.js App Router + Sanity CMS + Framer Motion)
**Researched:** 2026-02-18
**Confidence:** HIGH (verified against next-sanity official GitHub, Sanity official docs, Next.js official docs)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     SANITY STUDIO (embedded)                      │
│  /studio/[[...index]]/page.tsx  →  Sanity Studio v3              │
│  Schemas: homepage | services | labTests | testimonials | blog |  │
│           siteSettings                                            │
└──────────────────────┬───────────────────────────────────────────┘
                       │ Content Lake (Sanity API / CDN)
                       │ GROQ queries via sanityFetch()
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   NEXT.JS APP ROUTER (src/app/)                   │
├──────────────────────────────────────────────────────────────────┤
│  layout.tsx  [Server Component]                                   │
│    ├── fetches: siteSettings singleton (nav, footer copy)        │
│    ├── renders: <Header> (server, receives settings as props)    │
│    └── renders: <Footer> (server, receives settings as props)    │
│                                                                   │
│  page.tsx    [Server Component — homepage]                        │
│    ├── fetches: homepage singleton (all sections in one query)   │
│    ├── renders: <HeroSection>                                    │
│    ├── renders: <ServicesSection>                                │
│    ├── renders: <LabTestsSection>                                │
│    ├── renders: <TestimonialsSection>                            │
│    └── renders: <BlogSection>                                    │
│                                                                   │
│  blog/[slug]/page.tsx  [Server Component — blog posts]           │
│    └── fetches: individual post by slug                          │
├──────────────────────────────────────────────────────────────────┤
│                   CLIENT COMPONENTS (animations)                  │
│  src/components/ui/                                               │
│    ├── MotionDiv, MotionSection  — thin 'use client' wrappers    │
│    ├── ServiceFilterBar          — filter state + layout shuffle │
│    ├── TestimonialsCarousel      — carousel state                │
│    └── IntroAnimation            — intro sequence, circle wipe  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼ Webhook → revalidateTag('sanity')
┌──────────────────────────────────────────────────────────────────┐
│                   CACHE LAYER (Next.js)                           │
│  Static generation at build time                                  │
│  On-demand revalidation via Sanity GROQ webhook                  │
│  Tag: 'sanity' covers all content, 'homepage' for fine-grained  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/layout.tsx` | Shell HTML, global meta, Header + Footer | Server Component; fetches siteSettings singleton once |
| `app/page.tsx` | Homepage orchestration | Server Component; fetches full homepage document |
| `app/blog/[slug]/page.tsx` | Individual blog post | Server Component; dynamic route |
| `app/studio/[[...index]]/page.tsx` | Embedded Sanity Studio | Sanity's `NextStudio` component |
| `app/api/revalidate/route.ts` | Webhook handler | Validates HMAC, calls `revalidateTag` |
| `src/sanity/lib/client.ts` | Sanity client config | `createClient()` with CDN off (use Next.js cache) |
| `src/sanity/lib/queries.ts` | All GROQ queries | `defineQuery()` wrapped — enables TypeGen inference |
| `src/sanity/lib/fetch.ts` | `sanityFetch` wrapper | Adds default tags, revalidation config |
| `src/sanity/schemas/` | Content models | One file per document/object type |
| `src/components/sections/` | Page section components | Server Components receiving Sanity data as props |
| `src/components/ui/` | Animated, interactive pieces | Client Components with `'use client'` |

---

## Recommended Project Structure

```
morocz/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — Header + Footer, siteSettings fetch
│   │   ├── page.tsx                # Homepage — fetches homepage singleton
│   │   ├── blog/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Blog post detail page
│   │   ├── studio/
│   │   │   └── [[...index]]/
│   │   │       └── page.tsx        # Embedded Sanity Studio
│   │   └── api/
│   │       └── revalidate/
│   │           └── route.ts        # Sanity webhook → revalidateTag
│   │
│   ├── components/
│   │   ├── sections/               # Page-level section components (Server)
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── LabTestsSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   ├── BlogSection.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                     # Reusable UI + animated pieces (mix)
│   │       ├── motion/             # All Framer Motion wrappers (Client)
│   │       │   ├── MotionDiv.tsx
│   │       │   ├── MotionSection.tsx
│   │       │   └── AnimatePresenceWrapper.tsx
│   │       ├── ServiceFilterBar.tsx   # 'use client' — filter state
│   │       ├── ServiceCard.tsx        # Server (static) or Client (animated)
│   │       ├── TestimonialsCarousel.tsx  # 'use client' — carousel state
│   │       ├── IntroAnimation.tsx        # 'use client' — intro sequence
│   │       └── CircleWipeTransition.tsx  # 'use client'
│   │
│   ├── sanity/
│   │   ├── lib/
│   │   │   ├── client.ts           # createClient() — useCdn: false, use Next.js cache
│   │   │   ├── fetch.ts            # sanityFetch() wrapper with default tags
│   │   │   ├── queries.ts          # All GROQ queries (defineQuery wrapped)
│   │   │   └── image.ts            # urlForImage() helper
│   │   ├── schemas/
│   │   │   ├── index.ts            # Schema registry — imports all types
│   │   │   ├── documents/
│   │   │   │   ├── homepage.ts     # Singleton — homepage sections array
│   │   │   │   ├── siteSettings.ts # Singleton — nav, contact, footer copy
│   │   │   │   ├── service.ts      # Service document type
│   │   │   │   ├── labTest.ts      # Lab test document type
│   │   │   │   ├── testimonial.ts  # Testimonial document type
│   │   │   │   └── blogPost.ts     # Blog post document type
│   │   │   └── objects/
│   │   │       ├── seoFields.ts    # Reusable SEO fieldset
│   │   │       ├── ctaButton.ts    # Reusable CTA button object
│   │   │       └── heroFields.ts   # Hero section fields object
│   │   ├── structure.ts            # Studio desk structure (singleton enforcement)
│   │   ├── sanity.config.ts        # Studio config
│   │   └── sanity.types.ts         # GENERATED — do not edit manually
│   │
│   └── lib/
│       ├── metadata.ts             # generateMetadata helpers, JSON-LD builders
│       └── utils.ts                # cn(), formatDate(), etc.
│
├── public/
│   └── fonts/                      # Plus Jakarta Sans (self-hosted)
├── sanity.cli.ts                   # TypeGen config
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Structure Rationale

- **`src/sanity/`:** All Sanity concerns in one place — client, queries, schemas, generated types. Nothing Sanity-related leaks into components.
- **`src/components/sections/`:** One file per page section. Server Components by default — they receive typed props from page.tsx and call no Sanity APIs themselves (data flows down, not sideways).
- **`src/components/ui/`:** Reusable primitives. The `motion/` sub-folder isolates all Framer Motion wrappers that require `'use client'`. Keeps the Server/Client boundary explicit.
- **`src/lib/`:** Project-level utilities that are not Sanity-specific (metadata builders, class helpers).
- **Studio embedded at `/studio`:** Single repo, single deploy. No separate Studio project needed for a single-practice site.

---

## Architectural Patterns

### Pattern 1: Singleton Document for Homepage

**What:** The homepage is stored as a single Sanity document with a fixed `_id: 'homepage'`. It contains all section content as nested fields/arrays, not as separate document references.

**When to use:** Any page that exists exactly once and is directly managed by the client. Homepage, About, Contact.

**Trade-offs:** Simple to query (one fetch, all data). Slightly harder to reorder sections dynamically, but for a fixed-structure homepage that is a non-issue.

**Example:**
```typescript
// src/sanity/schemas/documents/homepage.ts
import { defineType, defineField } from 'sanity'

export const homepageSchema = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({ name: 'hero', type: 'heroFields' }),
    defineField({ name: 'servicesHeading', type: 'string' }),
    defineField({ name: 'labTestsHeading', type: 'string' }),
    defineField({ name: 'testimonials', type: 'array', of: [{ type: 'reference', to: [{ type: 'testimonial' }] }] }),
    defineField({ name: 'blogSection', type: 'object', fields: [
      defineField({ name: 'heading', type: 'string' }),
      defineField({ name: 'subheading', type: 'string' }),
    ]}),
    defineField({ name: 'seo', type: 'seoFields' }),
  ],
})
```

```typescript
// src/sanity/structure.ts — enforce singleton (only one document)
import { StructureBuilder } from 'sanity/structure'

export const structure = (S: StructureBuilder) =>
  S.list().items([
    S.listItem().title('Homepage').child(
      S.document().schemaType('homepage').documentId('homepage')
    ),
    S.listItem().title('Site Settings').child(
      S.document().schemaType('siteSettings').documentId('siteSettings')
    ),
    S.divider(),
    ...S.documentTypeListItems().filter(
      (item) => !['homepage', 'siteSettings'].includes(item.getId()!)
    ),
  ])
```

### Pattern 2: Fetch at the Top, Pass Down as Props

**What:** Server Components at the page/layout level fetch all required data, then pass typed props down to section components. Section components are pure presentation — no Sanity calls inside them.

**When to use:** Always for this project. Avoids waterfall fetching and keeps sections testable in isolation.

**Trade-offs:** Slightly more prop-passing verbosity. Massive gain in testability and predictability. Next.js deduplicates identical `fetch()` calls automatically so there is no waste when layout and page both need siteSettings.

**Example:**
```typescript
// src/app/page.tsx
import { sanityFetch } from '@/sanity/lib/fetch'
import { HOMEPAGE_QUERY } from '@/sanity/lib/queries'
import { HeroSection } from '@/components/sections/HeroSection'
import { ServicesSection } from '@/components/sections/ServicesSection'

export default async function HomePage() {
  const homepage = await sanityFetch({ query: HOMEPAGE_QUERY })

  return (
    <main>
      <HeroSection data={homepage.hero} />
      <ServicesSection heading={homepage.servicesHeading} />
    </main>
  )
}
```

### Pattern 3: Server/Client Split for Animations

**What:** Data-fetching components stay Server Components. Animation wrappers in `src/components/ui/motion/` are thin `'use client'` wrappers around Framer Motion primitives. Server sections wrap their content in these motion primitives for animation.

**When to use:** Any time you need scroll-triggered animations or interactive state alongside server-rendered content.

**Trade-offs:** Requires a wrapper file per HTML element type (div, section, h1, etc.) but keeps the bundle minimal — only animation code ships to the client, not the data-fetching logic.

**Example:**
```typescript
// src/components/ui/motion/MotionDiv.tsx
'use client'
import { motion, HTMLMotionProps } from 'framer-motion'

export function MotionDiv(props: HTMLMotionProps<'div'>) {
  return <motion.div {...props} />
}

// Usage in a Server Component section:
// import { MotionDiv } from '@/components/ui/motion/MotionDiv'
// <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//   {/* server-rendered children */}
// </MotionDiv>
```

### Pattern 4: Tag-Based Cache Revalidation

**What:** All `sanityFetch()` calls are tagged with `'sanity'` by default. A webhook route at `/api/revalidate` calls `revalidateTag('sanity')` when content changes in Sanity Studio.

**When to use:** Always — this is the standard pattern for Sanity + Next.js static content with near-instant editorial updates.

**Trade-offs:** Requires Sanity webhook configuration in the dashboard. One-time setup. For this single-practice site there is almost no editorial traffic, so simple global tag revalidation is sufficient over fine-grained per-document tags.

**Example:**
```typescript
// src/app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type: string }>(
      req,
      process.env.SANITY_REVALIDATE_SECRET
    )
    if (!isValidSignature) {
      return new NextResponse('Invalid signature', { status: 401 })
    }
    revalidateTag('sanity')
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err) {
    return new NextResponse((err as Error).message, { status: 500 })
  }
}
```

---

## Data Flow

### Request Flow (Page Load)

```
User visits morocz.hu
    ↓
Next.js Edge / CDN checks cache
    ↓ (cache miss or first load)
app/layout.tsx  [Server Component]
    ├── sanityFetch({ query: SITE_SETTINGS_QUERY, tags: ['sanity', 'siteSettings'] })
    │       → Sanity Content Lake → siteSettings document
    │       → passes { nav, phone, address, footerCopy } to <Header> and <Footer>
    └── renders children
              ↓
app/page.tsx  [Server Component]
    ├── sanityFetch({ query: HOMEPAGE_QUERY, tags: ['sanity', 'homepage'] })
    │       → Sanity Content Lake → homepage singleton with all section data
    └── renders section components with data as props:
              <HeroSection data={homepage.hero} />
              <ServicesSection heading={...} />   → ServicesSection queries services separately
              <LabTestsSection heading={...} />   → LabTestsSection queries labTests separately
              <TestimonialsSection refs={...} />  → resolved inline via GROQ expand
              <BlogSection heading={...} />       → BlogSection queries recent posts separately
    ↓
HTML returned to browser (fully rendered, no client data fetching)
    ↓
React hydration — Client Components activate:
    IntroAnimation    → plays intro sequence
    MotionDiv wrappers → IntersectionObserver triggers scroll animations
    ServiceFilterBar  → filter state, layout shuffle animation
    TestimonialsCarousel → carousel drag/swipe
```

### Editorial Update Flow

```
Editor updates content in Sanity Studio (/studio)
    ↓
Sanity Content Lake updates
    ↓
Sanity fires GROQ webhook → POST /api/revalidate
    ↓
Route handler validates HMAC signature
    ↓
revalidateTag('sanity') purges all cached pages
    ↓
Next.js regenerates pages on next request
    ↓
Updated content live within seconds
```

### Services Filter Data Flow (Client-Side)

```
ServicesSection (Server Component)
    ↓ fetches all services with categories from Sanity
    ↓ passes { services, categories } to:
ServiceFilterBar (Client Component — 'use client')
    ├── holds: selectedCategory state (useState)
    ├── renders: category filter buttons
    ├── renders: filtered ServiceCard grid
    └── on filter change:
            → Framer Motion AnimatePresence handles layout shuffle
            → No Sanity re-fetch — all data already in props
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is optimal. Static generation + CDN edge caching handles this trivially. |
| 1k-100k users | Add Sanity CDN for image delivery. Consider `next/image` with remote patterns pointing to `cdn.sanity.io`. Already supported. |
| 100k+ users | This is a single-practice site; this scale is not a realistic concern. If it were: consider ISR per-route instead of global tag revalidation. |

### Scaling Priorities

1. **First bottleneck — images:** Sanity's image CDN with `@sanity/image-url` and `next/image` handles this. Set `quality: 85`, `format: 'webp'`. Implement early.
2. **Second bottleneck — Sanity API rate limits:** Not a concern for editorial traffic (one practice, one editor). Free tier handles it. If blog gets public search: cache aggressively.

---

## Anti-Patterns

### Anti-Pattern 1: Fetching Sanity Data Inside Section Components

**What people do:** Put `await sanityFetch()` calls inside `<ServicesSection>` or `<HeroSection>` directly.

**Why it's wrong:** Creates multiple parallel Sanity fetches per page, makes query locations unpredictable, and breaks the ability to reason about what data a page needs at a glance. Also makes testing sections harder since they need a Sanity client mock.

**Do this instead:** Fetch everything in `page.tsx` (or `layout.tsx` for global data), pass typed props to sections. Next.js deduplicates identical fetch calls automatically, so there is no performance penalty for fetching siteSettings in both layout and page.

### Anti-Pattern 2: Using `'use client'` on Section Components

**What people do:** Add `'use client'` to section components just to use Framer Motion, which turns the entire section subtree into a client bundle.

**Why it's wrong:** Loses server-side rendering for the section — all markup must be generated client-side, hurting SEO and Time to First Paint. Increases bundle size unnecessarily.

**Do this instead:** Keep sections as Server Components. Use thin motion wrapper components from `src/components/ui/motion/` that are individually marked `'use client'`. Server-rendered HTML is preserved; only the animation JS is client-side.

### Anti-Pattern 3: Storing All Data in a Single Flat Homepage Schema

**What people do:** Put every piece of content as top-level fields on the homepage document (e.g., `service1Title`, `service1Description`, `service2Title`, ...).

**Why it's wrong:** Forces schema changes to add services. Cannot reorder without code changes. CMS editor experience is terrible — a flat wall of fields.

**Do this instead:** Use separate `service` document type. Homepage references services via `array of references`. Services section fetches `*[_type == "service"] | order(order asc)`. Adding a new service requires only CMS, no code.

### Anti-Pattern 4: Skipping TypeGen

**What people do:** Write GROQ queries and cast results with `as SomeType` or use `any`.

**Why it's wrong:** Schema changes in Sanity break TypeScript silently. Component props become incorrect without compile-time errors.

**Do this instead:** Use `defineQuery()` from `next-sanity`, run `sanity typegen generate` in the dev workflow (or as a pre-build step). Commit `sanity.types.ts`. TypeScript catches schema/component mismatches at compile time.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Sanity Content Lake | `sanityFetch()` in Server Components | `useCdn: false` — rely on Next.js cache, not Sanity CDN |
| Sanity CDN (images) | `@sanity/image-url` + `next/image` | Configure remote patterns in `next.config.ts` |
| Sanity Studio | Embedded at `/studio` via `NextStudio` | Same repo, same deploy — no separate Studio URL needed |
| Sanity Webhooks | POST `/api/revalidate` | HMAC validation via `parseBody` from `next-sanity/webhook` |
| Google Fonts | Self-host via `next/font/google` | Avoids external request — GDPR-friendly, performance-neutral |
| Vercel (deployment) | Zero-config | Next.js static export or server deploy; ISR supported natively |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Sanity schemas → GROQ queries | Schema field names referenced in queries | TypeGen generates types from this relationship — keep in sync |
| page.tsx → section components | Typed props (generated Sanity types) | No Sanity API calls cross this boundary downward |
| sections → motion wrappers | Children + motion props | Motion wrappers are generic; sections provide content as children |
| ServiceFilterBar → ServiceCard | Array prop of filtered services | All filtering is client-side JS on pre-fetched data array |
| layout.tsx → Header/Footer | siteSettings props | Fetched once in layout, never re-fetched in children |

---

## Build Order Implications

Build in this dependency order to avoid blockers:

1. **Sanity schema + Studio** — establishes the data contract everything else depends on
2. **TypeGen setup** — run once after schemas are defined; all subsequent component work is type-safe
3. **Client + fetch wrapper + queries** — data access layer; needed before any page can render real content
4. **Layout (Header + Footer)** — needed before any page component is built
5. **Homepage page.tsx** — orchestrates sections; build after sections are known
6. **Section components (server)** — `HeroSection`, `ServicesSection`, etc.; pure display, easily parallelized
7. **Motion wrappers** — wrap sections after sections work in static state
8. **Interactive client components** — `ServiceFilterBar`, `TestimonialsCarousel` — build last since they depend on section structure
9. **Intro animation + circle wipe** — final polish; entirely independent of data layer
10. **Webhook revalidation route** — wire up after deployment target is confirmed

---

## Sources

- next-sanity official GitHub (verified architecture patterns, sanityFetch, defineQuery, parseBody): https://github.com/sanity-io/next-sanity — HIGH confidence
- Sanity official docs, singleton document pattern: https://www.sanity.io/answers/using-singletons-for-the-homepage-in-next-js-with-sanity — HIGH confidence
- Sanity official docs, schema design: https://www.halo-lab.com/blog/creating-schema-in-sanity (verified against https://www.sanity.io/docs/studio/schema-types) — MEDIUM confidence
- Next.js official docs, JSON-LD structured data: https://nextjs.org/docs/app/guides/json-ld — HIGH confidence
- Sanity + Next.js ISR revalidation: https://www.buildwithmatija.com/blog/how-to-keep-sanity-powered-blog-static-nextjs-15 — MEDIUM confidence (consistent with official Sanity docs)
- Framer Motion / Next.js server component split: https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components — MEDIUM confidence (pattern consistent with motion package docs)
- Singleton data in layout.tsx: https://www.sanity.io/answers/best-way-to-access-sanity-cms-data-in-a-next-js-app-using-react-context-or-fetch-query-in-route-layout-file- — HIGH confidence
- Sanity TypeGen: https://www.sanity.io/docs/apis-and-sdks/sanity-typegen — HIGH confidence

---

*Architecture research for: Morocz Medical — Next.js App Router + Sanity CMS medical practice website*
*Researched: 2026-02-18*
