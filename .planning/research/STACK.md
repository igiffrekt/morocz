# Stack Research

**Domain:** Medical practice appointment booking module (auth + calendar UI + email + admin dashboard)
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH — core libraries verified via WebSearch with official npm/docs cross-check; Auth.js v5 still beta so some details flagged as MEDIUM

---

## Existing Stack (Locked — Do Not Change)

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | ^15.2.0 | App Router; actual project version, NOT 16 |
| React | ^19.0.0 | Bundled with Next.js |
| Tailwind CSS | ^4.0.0 | CSS-first via @theme |
| Sanity | ^4.22.0 | CMS + embedded Studio |
| next-sanity | ^11.6.12 | Sanity toolkit |
| Motion | ^12.34.2 | Animations |
| Biome | ^2.4.2 | Linting |
| Vercel | — | Deployment |

**Note on version discrepancy:** The existing project package.json shows Next.js ^15.2.0 and Sanity ^4.22.0, not the v16/v5 versions researched for v1. Research proceeds against the **actual installed versions**. All library compatibility verified for Next.js 15 + React 19 + Sanity v4.

---

## Recommended Stack Additions

### Authentication — Patient Auth

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| next-auth | @beta (~5.0.0-beta.25+) | Auth.js v5 for Next.js | Only auth library with first-class Next.js 15 App Router support. Single `auth()` function works in Server Components, Server Actions, Route Handlers, and middleware. Supports Google OAuth + Credentials in one config. JWT session strategy (no database adapter needed for stateless sessions). |
| bcryptjs | ^2.4.3 | Password hashing | bcryptjs (pure JS) works in all runtimes including Vercel Edge. Standard `bcrypt` (native bindings) crashes in middleware and some edge contexts. Note: bcryptjs maintenance is limited (last update ~2020) but it is the only practical option for edge-compatible bcrypt on Vercel. Use only in server-side code (Server Actions, Route Handlers). |

**Auth strategy decision:**
- **No Sanity adapter for Auth.js v5.** The `next-auth-sanity` package (v1.5.3, last published 2023) is incompatible with Auth.js v5. There is no official `@auth/sanity-adapter`. Strategy: use Auth.js v5 with `strategy: "jwt"` (stateless JWT sessions — no database adapter required). User accounts are stored as Sanity documents directly via write token in Server Actions.
- **Patient session data** lives in signed JWTs (name, email, Sanity patient document `_id`). No separate session table needed.
- **Admin dashboard auth** uses the same Auth.js v5 Credentials provider with a hardcoded single admin email/password (environment variables). Admin role distinguished via a `role: "admin"` field in the JWT.

### Booking Calendar UI

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-day-picker | ^9.13.2 | Date picker calendar component | Headless, unstyled by default — renders cleanly with Tailwind v4. Zero opinions on UI. Supports disabling dates (booked slots, doctor's blocked dates). Built-in Hungarian locale via `react-day-picker/locale` (`hu` export). date-fns is bundled as a dependency in v9 (no separate install). Widely used (3,700+ npm dependents), actively maintained, React 19 compatible. |

**Why not alternatives:**
- Mobiscroll: commercial license, not open source
- react-datepicker: older, heavier, styled by default (harder to match Morocz design)
- DayPilot: overkill for slot picker, not well-suited for custom UI
- shadcn/ui Calendar: uses react-day-picker under the hood anyway; adding shadcn just for Calendar adds Radix UI overhead and conflicts with Tailwind v4 CSS-first approach

### Email Sending

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| resend | ^4.x (latest ~4.0+) | Transactional email API | Free tier: 3,000 emails/month — more than sufficient for a single-doctor practice. Official Next.js App Router example + Server Action integration. React Email built by same team, seamless integration. Simple API: `resend.emails.send({...})`. No SMTP config needed. |
| @react-email/components | ^1.0.8 | React component library for emails | Build confirmation and reminder emails as React components with inline styles (email-safe rendering). Works with Resend's `react` field for template rendering. Zero-config: render HTML from JSX components. |

**Note on react-email package:** The `react-email` package (v5.2.8) is for the dev preview server (run `npx react-email dev`). In production code, only `@react-email/components` is imported — `resend` calls its `render()` function server-side. Do not import `react-email` in app code.

### Scheduled Email Reminders

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| inngest | ^3.52.3 | Background job orchestration for scheduled reminders | Vercel cron jobs can trigger reminder emails (e.g., 24h before appointment) but have no retry logic and no state. Inngest provides durable execution, retries, and scheduling with a free tier of 50k executions/month — well within a medical practice's volume. Vercel marketplace integration makes deployment zero-config. Standard Schema support added in Sep 2025 (Zod 4 compatible). |

**Alternative — Vercel Cron Jobs only:**
- Vercel cron can run a function on a schedule (e.g., every hour, check appointments due tomorrow, send emails)
- Simpler to implement than Inngest: just a `vercel.json` cron entry + a Route Handler
- No SDK or extra dependency
- Acceptable for low volume (< 50 appointments/day)
- **Recommended approach for v2.0:** Start with Vercel Cron + Resend (simpler). Add Inngest only if retry logic or complex workflow steps (e.g., send → wait → check if cancelled → send reminder) become needed.

**Decision:** Use **Vercel Cron Jobs** (no extra package) for v2.0. Inngest is noted as the upgrade path if scheduling complexity grows.

### Form Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| zod | ^3.24.x | Schema validation for booking forms and server actions | Zod 4 (latest 4.3.6) is ESM-only and may cause issues with Sanity's CommonJS-compatible ecosystem. Use **Zod 3** (`^3.24`) for compatibility. Shared schema between client-side validation and server-side Server Action validation. Standard pattern in Next.js 15 App Router ecosystem. |

**Note on Zod v4:** Zod 4 was released in 2025 and is ESM-only. Sanity v4 uses CommonJS internally. To avoid module compatibility issues, pin to Zod 3 (`^3.24.x`). Reassess when Sanity v5 is adopted.

### Supporting Utilities

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | bundled with react-day-picker v9 | Date manipulation and formatting | Bundled by react-day-picker v9 — do not install separately unless you need additional functions not exposed by react-day-picker. If needed directly: `npm install date-fns@^4.1.0` but only after verifying ESM compatibility with Sanity v4 build. |

---

## Installation

```bash
# Authentication
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs

# Booking calendar UI
npm install react-day-picker

# Email — production sending
npm install resend @react-email/components

# Form validation
npm install zod@^3.24

# Dev: email template preview (not imported in app code)
npm install -D react-email
```

**No additional install needed:**
- Vercel Cron Jobs: configured via `vercel.json`, no npm package
- date-fns: bundled inside react-day-picker v9

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| next-auth@beta (Auth.js v5) | Clerk | Clerk is faster to integrate (hosted UI) but costs $25+/month for >10k MAU and adds an external vendor dependency. Auth.js v5 is free, self-hosted, and keeps patient data in Sanity. Use Clerk if auth complexity becomes unmanageable or if the practice scales significantly. |
| next-auth@beta (Auth.js v5) | Better Auth | Better Auth is a newer, stable alternative gaining traction in 2025-2026. It has native Sanity adapter support and may be worth evaluating if Auth.js v5 beta instability causes problems during development. MEDIUM confidence. |
| bcryptjs | bcrypt (native) | Use native `bcrypt` only if you switch to Node.js middleware (available experimentally in Next.js 15.2+) and are NOT on Vercel Edge. For Vercel, bcryptjs is the safe choice. |
| react-day-picker | flatpickr / Pikaday | Vanilla JS calendar libraries — harder to integrate with React state and Tailwind. No React 19 support. Avoid. |
| resend | SendGrid | SendGrid works but has a more complex API and the free tier (100/day) is tighter. Resend's free tier (3,000/month) is more generous for a medical practice. |
| resend | Nodemailer + SMTP | Requires managing SMTP credentials and an email provider. More moving parts, harder to debug delivery. Resend abstracts all of this. |
| zod@^3.24 | zod@^4.x | Only upgrade to Zod 4 after Sanity v5 migration (v5 supports ESM natively). |
| Vercel Cron | Inngest | Use Inngest if scheduling logic becomes complex (multi-step workflows, conditional sends, retry on failure). For v2.0 with simple "send reminder 24h before appointment" logic, Vercel Cron is sufficient and adds zero dependencies. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next-auth-sanity` package | Last published 2023, incompatible with Auth.js v5 adapter interface. No Auth.js v5 adapter exists for Sanity. | JWT strategy (stateless sessions) + store user documents directly via Sanity write token in Server Actions |
| Middleware-based auth guards (CVE-2025-29927) | Critical vulnerability patched in Next.js 15.2.3 — middleware auth bypass possible via `x-middleware-subrequest` header. Even patched, middleware should NOT be the primary auth gate. | Data Access Layer (DAL) pattern: validate session inside Server Actions and Route Handlers using `auth()` from Auth.js v5. |
| `react-email` package in production app code | Dev-only preview server tool. Importing it in app code adds unnecessary bundle weight. | `@react-email/components` for email templates; `resend` handles rendering internally |
| bcrypt (native Node bindings) | Crashes in Vercel Edge Runtime; crashes in some Next.js middleware contexts | `bcryptjs` for all password hashing |
| FullCalendar | Heavy library (~200kb), overkill for a slot-picker UI, licence costs for premium features | `react-day-picker` for date selection; custom slot grid for time selection (simple HTML + Tailwind) |
| Prisma / any SQL database | This stack already uses Sanity as the data layer. Adding Prisma + PostgreSQL for auth sessions creates unnecessary infrastructure complexity and cost for a single-doctor practice. | Auth.js v5 JWT sessions (no database needed) + Sanity for user/booking document storage |
| `NEXT_PUBLIC_SANITY_TOKEN` with write access | Any token prefixed `NEXT_PUBLIC_` is embedded in the browser bundle. A write token exposed this way allows anyone to modify or delete Sanity content. | `SANITY_WRITE_TOKEN` (no `NEXT_PUBLIC_` prefix) — server-side only via Server Actions or Route Handlers |

---

## Stack Patterns by Variant

**Patient auth (Google OAuth + email/password):**
- Auth.js v5 with `strategy: "jwt"` — no database adapter
- Google provider for OAuth; Credentials provider for email/password
- On successful Credentials login, look up patient document in Sanity by email; store Sanity `_id` in JWT token
- On Google OAuth first login, create patient document in Sanity via Server Action with write token

**Admin dashboard auth:**
- Same Auth.js v5 config, separate Credentials provider check: `if (email === process.env.ADMIN_EMAIL && bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH))`
- Store `role: "admin"` in JWT so admin pages can check `session.user.role === "admin"` without a database query
- Admin dashboard route group: `app/(admin)/` with a layout that enforces admin role

**Booking data storage in Sanity:**
- Create a `booking` document type in Sanity schema (patientRef, serviceRef, date, timeSlot, status, notes)
- All writes via Server Actions using `serverClient` (write token, never exposed to client)
- Availability check: GROQ query counts bookings for a given date + time slot before confirming
- **Optimistic conflict resolution:** Check availability in Server Action immediately before write; return error if slot taken (no distributed locking needed for single-doctor low-volume practice)

**Email confirmation flow:**
- Server Action creates booking → sends confirmation via Resend in same action
- Reminder: Vercel Cron job runs daily at 08:00 → queries Sanity for bookings the next day → sends reminder emails via Resend

**Hungarian locale in date picker:**
```tsx
'use client'
import { DayPicker } from 'react-day-picker'
import { hu } from 'react-day-picker/locale'

<DayPicker
  locale={hu}
  disabled={disabledDates}
  onSelect={handleDateSelect}
  mode="single"
/>
```

**Sanity write client (Server Action pattern):**
```typescript
// lib/sanity/writeClient.ts — server only, never import in client components
import { createClient } from 'next-sanity'

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // NOT NEXT_PUBLIC_
})
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next-auth@beta | next@^15.2.0 | Auth.js v5 explicitly supports Next.js 14+; 15 is fully supported |
| next-auth@beta | react@^19.0.0 | React 19 compatible — confirmed by multiple 2025/2026 tutorials |
| bcryptjs@^2.4.3 | next@^15.2.0 (Vercel) | Pure JS — no native bindings; works in all runtimes including Edge |
| react-day-picker@^9.13.2 | react@^19.0.0 | React 19 compatible since v9.4.3 (confirmed via GitHub issue #2665) |
| react-day-picker@^9.13.2 | next@^15.2.0 | Client component only (`'use client'`); no SSR dependency |
| resend@^4.x | next@^15.2.0 | Server-only (Server Actions / Route Handlers); no client import |
| @react-email/components@^1.0.8 | react@^19.0.0 | Confirmed React 19.2 support per Resend blog (react-email 5.0) |
| zod@^3.24 | sanity@^4.22.0 | Zod 3 is CommonJS + ESM compatible; safe with Sanity v4 |
| zod@^4.x | sanity@^4.22.0 | ESM-only; may cause CJS/ESM interop issues with Sanity v4 — AVOID |

---

## Security Notes

### Auth.js v5 + CVE-2025-29927
The CVE-2025-29927 middleware bypass (March 2025, CVSS 9.1) demonstrated that middleware-based auth is not a sufficient security gate. **Do not use middleware as the primary auth check for booking or admin routes.** Always validate the session inside the Server Action or Route Handler using Auth.js v5's `auth()` function. Middleware can redirect unauthenticated users for UX (avoiding a full page load), but the server-side check is the authoritative gate.

### Sanity Write Token
- Store as `SANITY_WRITE_TOKEN` (no `NEXT_PUBLIC_` prefix)
- Only import `writeClient` in files that have `'use server'` or are server-only Route Handlers
- Add `import 'server-only'` at the top of `lib/sanity/writeClient.ts` to get a build-time error if accidentally imported in a client bundle

### Patient Data (GDPR / Hungary)
- Collect minimum: name, email, phone, selected service, date, time
- Store in Sanity (same data store as all CMS content — auditable)
- Do not store session tokens or OAuth tokens in Sanity
- Auth.js v5 JWT sessions are signed (not encrypted by default) — set `AUTH_SECRET` to a strong random value in Vercel environment variables

---

## Sources

- Auth.js v5 installation docs — https://authjs.dev/getting-started/installation — MEDIUM (beta, docs in flux)
- CVE-2025-29927 middleware bypass — https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/ — HIGH
- next-auth-sanity v1.5.3 incompatibility — https://www.npmjs.com/package/next-auth-sanity — HIGH (last published 2023, pre-v5)
- react-day-picker v9.13.2 React 19 compatibility — https://github.com/gpbl/react-day-picker/issues/2665 — HIGH
- react-day-picker Hungarian locale — https://daypicker.dev/localization/changing-locale — HIGH
- Resend npm v4.x — https://www.npmjs.com/package/resend — HIGH (latest confirmed Feb 2026)
- Resend free tier 3,000/month — https://resend.com/pricing — HIGH
- @react-email/components v1.0.8 — https://www.npmjs.com/package/@react-email/components — HIGH
- React Email 5.0 React 19 support — https://resend.com/blog/react-email-5 — HIGH
- Inngest v3.52.3 + free tier — https://www.npmjs.com/package/inngest — MEDIUM
- Vercel Cron Jobs all plans — https://vercel.com/docs/cron-jobs — HIGH
- Zod 3 vs 4 ESM compatibility — https://zod.dev/v4 + https://www.npmjs.com/package/zod — MEDIUM
- bcryptjs edge runtime — https://github.com/vercel/next.js/issues/69002 — HIGH
- Sanity write token security — https://nextjs.org/docs/app/guides/data-security — HIGH
- Auth.js v5 JWT stateless sessions — https://authjs.dev/getting-started/migrating-to-v5 — MEDIUM

---

*Stack research for: Morocz Medical — v2.0 booking module (patient auth + calendar + email + admin)*
*Researched: 2026-02-22*
