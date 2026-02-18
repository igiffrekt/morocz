# Stack Research

**Domain:** Single-practice medical website (Hungarian, no auth, no e-commerce)
**Researched:** 2026-02-18
**Confidence:** HIGH — all core decisions verified against official docs and current npm releases

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (latest) | Full-stack React framework | App Router is the current standard; Next.js 16 is stable as of 2026 with Turbopack default, React 19.2, and built-in SEO metadata API. Async Request APIs are now mandatory (params/cookies must be awaited) — greenfield projects should start here |
| React | 19.2 (via Next.js 16) | UI library | Bundled with Next.js 16; React 19.2 adds ViewTransitions and Activity components which complement animation work |
| TypeScript | 5.8.x | Type safety | Next.js 16 requires TypeScript 5.1+; 5.8 is current stable with improved type checking performance |
| Tailwind CSS | 4.1.x | Utility-first CSS | v4 stable since Jan 2025; CSS-first config via `@theme`, 5x faster builds, auto content detection, no `tailwind.config.js` needed. v4 is the standard for new projects |
| Sanity (sanity) | 5.x (latest ~5.9) | Headless CMS — Studio | v5 is current stable; Node 20 required. Studio v4 embedded in Next.js via `next-sanity`. Modular schema with `defineType` and `defineField` for independent content editing |
| next-sanity | 12.x (latest ~12.0.12) | Sanity toolkit for Next.js | Official integration package; handles GROQ client, TypeScript type generation (`sanity typegen`), SanityLive for draft preview, and embedded Studio routing |
| Motion (motion) | 12.34.x | Animation library | Formerly Framer Motion; rebranded and independent. Install as `motion` package, import from `motion/react`. Server Components must use `motion/react-client` import. Latest v12 is production-stable; no breaking changes from Framer Motion |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/image-url | latest | Sanity image URL builder | Building image srcsets from Sanity image references; use with Next.js `<Image>` component |
| next-sanity-image | latest | Responsive Sanity images for Next.js | When you need `next/image` integration with Sanity — auto-generates srcsets, respects crops/hotspots, honours `images.deviceSizes` from next.config |
| sharp | 0.34.x | Node.js image processing | Required for Next.js Image Optimization in production (not on Vercel where it's auto-included); install with `npm install sharp` |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind v4 | Required for Tailwind v4 — replaces the old `tailwindcss` PostCSS plugin. Config: `postcss.config.mjs` with `"@tailwindcss/postcss": {}` |
| @sanity/vision | latest | In-Studio GROQ query tester | Development only — plugin for testing GROQ queries interactively in Studio |
| schema-dts | 1.1.x | TypeScript types for Schema.org JSON-LD | Type-safe JSON-LD for medical structured data (MedicalOrganization, Physician, MedicalSpecialty). Prevents invalid structured data that breaks rich results |
| next/font (built-in) | — | Self-hosted Google Fonts | Import `Plus_Jakarta_Sans` from `next/font/google`; eliminates external font network requests, zero layout shift, optimized delivery |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint (flat config) | Linting | Next.js 16 removed `next lint` — use ESLint directly with `eslint.config.mjs`. `next build` no longer auto-runs lint |
| Biome | Fast linting/formatting alternative | New projects created with `create-next-app` can choose Biome; fewer rules but much faster than ESLint. Recommended if no strict ESLint rules are required |
| Turbopack | Build system | Default in Next.js 16 for both `next dev` and `next build`; no configuration needed. Do NOT add `--turbopack` flag — it is already default |
| sanity typegen | TypeScript type generation from GROQ | Run `npx sanity@latest typegen generate` to generate types for schema and GROQ queries. Use `defineQuery()` wrapper for automatic type inference |
| Vercel | Hosting + deployment | Native Next.js platform; free tier covers a medical practice website comfortably. Zero-config deployment with git push |

---

## Installation

```bash
# Create project with Next.js 16, App Router, TypeScript, Tailwind
npx create-next-app@latest morocz-medical \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir \
  --import-alias "@/*"

# Tailwind v4 PostCSS setup (if not done by create-next-app)
npm install tailwindcss @tailwindcss/postcss postcss

# Sanity CMS — run in project root to init project + link to Next.js
npx sanity@latest init

# Sanity toolkit for Next.js
npm install next-sanity @sanity/image-url next-sanity-image

# Animation
npm install motion

# SEO — structured data type safety
npm install schema-dts

# Image optimization (for non-Vercel deployment)
npm install sharp

# Dev dependencies
npm install -D @sanity/vision
```

**postcss.config.mjs** (Tailwind v4 — replaces old config):
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**app/globals.css** (Tailwind v4 — replaces `@tailwind` directives):
```css
@import "tailwindcss";

@theme {
  --color-primary: #23264F;
  --color-secondary: #F4DCD6;
  /* ... rest of design system tokens */
}
```

**Font setup** (app/layout.tsx):
```tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export default function RootLayout({ children }) {
  return (
    <html lang="hu" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  )
}
```

**Motion in Client Components** (must use 'use client' or motion/react-client):
```tsx
// Option A: In a Client Component
'use client'
import { motion } from 'motion/react'

// Option B: In a Server Component (reduces client JS)
import * as motion from 'motion/react-client'
```

**Sanity Studio route** (app/studio/[[...tool]]/page.tsx):
```tsx
import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Next.js 15.5 | If you need to avoid Next.js 16 async API breaking changes and have existing Pages Router code to migrate — not relevant for greenfield |
| Tailwind CSS v4 | Tailwind CSS v3 | Only if you have a v3 component library dependency that hasn't migrated (e.g. shadcn/ui — check current version compatibility before assuming v4 support) |
| motion (npm) | framer-motion | No reason to use framer-motion for new projects; `motion` is the maintained package. Both work identically — `motion` is lighter |
| Sanity | Contentful, Strapi | Sanity has the best GROQ query flexibility, embedded Studio in Next.js, and free tier. Contentful is better for enterprise teams; Strapi needs self-hosting |
| Vercel | Netlify, Railway | Netlify works but Vercel has first-class Next.js support. Railway is better for containerized apps with databases |
| schema-dts | Manual JSON-LD | schema-dts prevents invalid schema that silently breaks rich results — especially risky for medical (MedicalOrganization, Physician types) |
| @tailwindcss/postcss | Tailwind Vite plugin | Next.js 16 uses PostCSS, not Vite — must use @tailwindcss/postcss |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` package | Legacy package name; `motion` is identical but represents the maintained direction | `motion` npm package with `motion/react` import |
| `tailwindcss` as direct PostCSS plugin | Removed in v4; using it causes build failures with the error "looks like you're trying to use tailwindcss directly as a PostCSS plugin" | `@tailwindcss/postcss` plugin |
| `@tailwind base/components/utilities` directives | Removed in Tailwind v4; replaced by CSS import | `@import "tailwindcss"` in globals.css |
| `tailwind.config.js` design tokens | In v4, design tokens live in CSS `@theme {}` block — JS config file is optional and deprecated for most use cases | `@theme {}` in globals.css |
| `next lint` command | Removed in Next.js 16 | ESLint CLI directly: `eslint` or Biome |
| `serverRuntimeConfig` / `publicRuntimeConfig` | Removed in Next.js 16 | Environment variables with `NEXT_PUBLIC_` prefix for client, plain `process.env` for server |
| `next/legacy/image` | Deprecated in Next.js 16 | `next/image` |
| AMP pages | Removed in Next.js 16 | Not relevant for this project |
| CSS Modules with Tailwind v4 | Performance hit — each module triggers a separate Tailwind compilation pass; slower builds | Plain utility classes in JSX; CSS variables for dynamic styles |
| `@sanity/client` directly | `next-sanity` already wraps `@sanity/client` with Next.js caching integration | `next-sanity` package for all Sanity data fetching |
| `experimental.ppr` flag | Renamed in Next.js 16 to `cacheComponents` | `cacheComponents: true` in next.config (not needed for this project) |
| React Spring | More complex API than Motion, smaller community, less documentation for the specific animations required (typewriter, scroll-triggered, layout shuffle) | `motion` |

---

## Stack Patterns by Variant

**For animation in Server Components (layout.tsx, page.tsx):**
- Import from `motion/react-client` instead of `motion/react`
- This prevents the server bundle from including animation code
- Client-interactive animations still work correctly

**For Sanity content fetching:**
- Fetch in Server Components using `await client.fetch(query)`
- Use `next-sanity` client with Next.js cache tags for ISR: `{ next: { tags: ['post'] } }`
- Use `SanityLive` component for real-time preview in draft mode only

**For structured data on medical pages:**
- Add JSON-LD `<script>` tags in `page.tsx` using `schema-dts` typed objects
- Key schemas: `MedicalOrganization`, `Physician`, `MedicalSpecialty`, `LocalBusiness`
- Escape `<` as `\u003c` in JSON.stringify to prevent XSS (Next.js does NOT do this automatically)

**For the blog:**
- Use Sanity for blog posts with category references (document type with reference field)
- Fetch at build time with `generateStaticParams` for static pages
- Use ISR with `revalidate` tag on category filter changes

**For scroll-triggered animations with Motion:**
- Use `useInView` from `motion/react` or Motion's native `whileInView` prop
- Set `once: true` for performance — animations should not replay on scroll-up for medical credibility
- Use `viewport: { amount: 0.2 }` to trigger at 20% visibility

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.x | react@19.2, react-dom@19.2 | React 19.2 ships with Next.js 16; do not pin to React 18 |
| next@16.x | typescript@5.1+ (use 5.8) | Next.js 16 requires TS 5.1 minimum |
| next@16.x | tailwindcss@4.1 + @tailwindcss/postcss@4.x | Confirmed compatible; use PostCSS plugin not Vite |
| tailwindcss@4.x | CSS Modules | Works but degrades build performance; avoid |
| motion@12.x | react@18.2+ | Motion v12 requires React 18.2 or higher; React 19.2 is supported |
| next-sanity@12.x | sanity@5.x | Versions are kept in sync; always install both at latest |
| next-sanity@12.x | next@16.x | Confirmed compatible (next-sanity actively tracks Next.js releases) |
| @sanity/image-url | sanity@5.x | Use together; pin both to latest |
| node.js | >=20.9 | Next.js 16 dropped Node 18 support; require Node 20.9+ (LTS) |

---

## Critical Configuration Notes

### Next.js 16 Breaking Changes That Affect This Project

1. **Async params**: All page/layout props are now Promises — `const { slug } = await props.params`
2. **No `next lint`**: Remove from package.json scripts; use `eslint` directly
3. **Turbopack is default**: Do NOT add `--turbopack` flag to dev/build scripts
4. **Image quality**: Default qualities restricted to `[75]` — if using quality={100} for Sanity hero images, add `images: { qualities: [75, 100] }` to next.config.ts
5. **`middleware.ts` renamed to `proxy.ts`**: Not relevant if project doesn't use middleware

### Tailwind v4 Breaking Changes That Affect This Project

1. **No `tailwind.config.js` needed**: Design tokens (colors, fonts, spacing) go in `@theme {}` block in globals.css
2. **Import syntax**: `@import "tailwindcss"` not `@tailwind base; @tailwind components; @tailwind utilities`
3. **PostCSS plugin**: `@tailwindcss/postcss` not `tailwindcss`
4. **Arbitrary values**: Most still work but syntax for CSS variables changed to `var(--color-primary)` pattern

### Sanity Schema Pattern for Modular Content

Every content element independently editable means using Sanity's `defineType` for each content block:

```typescript
// sanity/schemaTypes/hero.ts
import { defineType, defineField } from 'sanity'

export const heroType = defineType({
  name: 'hero',
  type: 'document',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'subheading', type: 'text' }),
    defineField({ name: 'backgroundImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'ctaLabel', type: 'string' }),
    defineField({ name: 'ctaUrl', type: 'url' }),
  ],
})
```

---

## Sources

- Next.js 16 official docs: https://nextjs.org/docs/app/guides/upgrading/version-16 (verified 2026-02-16, doc version 16.1.6) — HIGH confidence
- Next.js 15.5 blog post: https://nextjs.org/blog/next-15-5 (published 2025-08-18) — HIGH confidence
- Next.js fonts docs: https://nextjs.org/docs/app/getting-started/fonts (doc version 16.1.6) — HIGH confidence
- Tailwind CSS v4 install guide: https://tailwindcss.com/docs/guides/nextjs (v4.1 current) — HIGH confidence
- Tailwind CSS v4 compatibility: https://tailwindcss.com/docs/compatibility — HIGH confidence
- Motion installation: https://motion.dev/docs/react-installation — MEDIUM confidence (page rendered JS prevented full read; cross-confirmed via WebSearch showing v12.34.x)
- Motion rebranding: https://motion.dev/blog/framer-motion-is-now-independent-introducing-motion — HIGH confidence
- Sanity embedding docs: https://www.sanity.io/docs/studio/embedding-sanity-studio — HIGH confidence
- next-sanity v12.0.12 (npm, published 2026-02-18): https://github.com/sanity-io/next-sanity — HIGH confidence
- sanity v5.9 (npm): https://www.npmjs.com/package/sanity — HIGH confidence
- TypeScript 5.8 release: https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/ — HIGH confidence
- schema-dts: https://github.com/google/schema-dts — MEDIUM confidence (actively maintained, 334K weekly downloads)
- Next.js JSON-LD guide: https://nextjs.org/docs/app/guides/json-ld — MEDIUM confidence (XSS warning confirmed via official Next.js docs link in WebSearch)

---

*Stack research for: Morocz Medical — single-practice medical website*
*Researched: 2026-02-18*
