# Project Research Summary

**Project:** Morocz Medical — v2.0 Booking Module
**Domain:** Patient appointment booking module added to an existing Next.js 15 + Sanity v4 medical practice website (Hungarian, single-doctor private practice, Esztergom)
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH

## Executive Summary

The Morocz Medical v2.0 booking module is a well-defined problem: a low-to-medium complexity patient self-service booking system integrated into an existing Next.js 15 App Router + Sanity v4 site. The recommended approach is to build entirely within the existing stack, adding Auth.js v5 (next-auth@beta) with JWT sessions, react-day-picker for the calendar UI, and Resend for transactional email. The module has six distinct components — Sanity data schemas, patient authentication, a booking calendar flow, patient account pages, an admin dashboard, and an email notification system — each with clear build-order dependencies: schemas must exist before auth, auth before any protected page, and the booking document schema before emails or the admin dashboard can be built.

The most significant architectural decision is how to model slot availability in Sanity. Sanity is eventually consistent in its GROQ search store, which means checking availability via a GROQ query immediately before writing a booking document is inherently racy and will produce double bookings under concurrent load. The correct approach is to use Sanity's `ifRevisionID` optimistic locking on per-slot status documents rather than a query-based availability check. This decision must be made in Phase 1 and cannot be retrofitted — it affects the schema design, the booking Server Action pattern, and the conflict error UX. Everything downstream depends on getting the data model right from the start.

The secondary risk cluster is security and GDPR compliance. Because the system processes patient contact data (names, emails, phone numbers), a Data Processing Agreement with Sanity must be signed and a Data Protection Impact Assessment completed before the first patient record is written. Auth.js v5's mandatory split-config pattern (edge-safe `auth.config.ts` for middleware, full `auth.ts` for Node.js contexts) is a known breaking point that must be established in Phase 2 before any route protection is added. The Sanity write token must never appear in a `NEXT_PUBLIC_*` environment variable. All of these are binary failures — one mistake means expensive recovery, not an incremental fix.

## Key Findings

### Recommended Stack

The existing stack (Next.js 15.2, React 19, Tailwind v4, Sanity v4, Motion v12, Vercel) is locked. New additions are minimal and deliberate. Auth.js v5 is the only auth library with first-class Next.js 15 App Router support, handling both Google OAuth and email/password Credentials in one config with JWT sessions (no database adapter required). `bcryptjs` (pure JS) is chosen over native `bcrypt` because it runs in all Vercel runtimes including Edge. `react-day-picker v9` is the correct calendar component — headless, Tailwind-compatible, ships with a Hungarian locale, and is React 19 compatible. Resend handles transactional email via HTTP API (Vercel blocks outbound SMTP). Vercel Cron Jobs handle reminder scheduling for this volume; Inngest is documented as the upgrade path if scheduling complexity grows. Zod 3 (`^3.24`) is used for form validation — Zod 4 is ESM-only and causes interop issues with Sanity v4's CommonJS internals.

**Core technologies:**
- `next-auth@beta` (Auth.js v5): Patient and admin authentication — only auth library with first-class Next.js 15 App Router + Edge middleware support; JWT sessions, no database adapter required
- `bcryptjs ^2.4.3`: Password hashing — pure JS, works in all Vercel runtimes including Edge; native `bcrypt` crashes in middleware
- `react-day-picker ^9.13.2`: Booking calendar UI — headless/unstyled (Tailwind-compatible), built-in Hungarian locale (`hu`), React 19 compatible, date-fns bundled
- `resend ^4.x` + `@react-email/components ^1.0.8`: Email sending — HTTP API (not SMTP), free tier 3,000 emails/month, React email templates; Nodemailer is blocked by Vercel
- `zod ^3.24`: Form and Server Action validation — Zod 3 is CJS+ESM compatible; Zod 4 breaks Sanity v4 builds
- Vercel Cron Jobs: Reminder email scheduling — zero dependency, sufficient for single-practice volume (<50 bookings/day)

**What not to use:** `next-auth-sanity` (archived September 2025, no v5 support), Sanity database session adapter, `NEXT_PUBLIC_SANITY_WRITE_TOKEN`, Nodemailer with SMTP, FullCalendar, Prisma/PostgreSQL, `react-email` in production code (dev-only preview tool).

See `.planning/research/STACK.md` for full version compatibility matrix, installation commands, and alternatives considered.

### Expected Features

The full feature dependency graph is documented in `.planning/research/FEATURES.md`. The dependency chain is critical: Doctor Schedule (Sanity) → Slot Generation → Calendar UI → Booking Creation → Confirmation Email / Account Page / Admin Dashboard. The schedule schema is the foundation of the entire system; nothing else can be built without it.

**Must have (table stakes — required for v2.0 launch):**
- Doctor schedule schema in Sanity (weekday availability, slot duration, buffer time, blocked dates) — foundation dependency
- Slot generation — server-side pure function, schedule rules minus existing bookings
- Date picker + time slot grid — react-day-picker with Hungarian locale
- Service selection linked to slot duration (different services take different amounts of time)
- Patient auth — Google OAuth + email/password registration/login (Auth.js v5)
- Booking creation — Sanity document with patient data, service, datetime, status
- Booking confirmation email — immediate, on booking creation via Resend
- Patient account page (`/fiokom`) — upcoming appointments, cancellation (with 24h window enforcement)
- Pre-appointment reminder email — 24h before, via Vercel Cron with `reminderSent` flag
- Admin dashboard (`/admin`) — today's appointments, week view, patient details, manual cancellation
- Admin auth — separate credentials-only login (role in JWT, set from `ADMIN_EMAIL` env var)
- Double-booking prevention — `ifRevisionID` optimistic locking at booking creation

**Should have (add after v2.0 validation):**
- Reschedule flow — cancel old + create new atomically (Sanity transaction); high complexity, deferred
- Buffer time configuration in Sanity Studio — add if doctor reports running late between appointments
- Animated booking step transitions — Motion v12 already installed; add once core flow is stable

**Defer to v3+:**
- SMS reminders — requires paid gateway, GDPR consent for SMS, carrier complexity
- Waitlist / cancellation notification queue — complex for marginal gain at this volume
- Payment / deposit at booking — Barion or Stripe, Hungarian tax receipts (bizonylat), refund flows
- Google Calendar / iCal sync — explicitly excluded from v2.0

**Anti-features (explicitly excluded):** Real-time WebSocket slot availability, multi-doctor scheduling, patient medical history in booking, EHR/EMR integration, recurring appointments, online prescription requests.

### Architecture Approach

The booking module is entirely additive — nothing in the existing codebase is deleted, and only two files are modified (the Sanity schema index and the revalidation webhook). The architecture is built around four route areas: the existing public routes (unchanged), the new `/idopontfoglalas` booking flow (public, requires auth only at confirmation step), the `/fiokom` patient account area (auth-gated), and the `(admin)` route group with its own layout (role-gated, completely separate shell from the public site). Auth.js v5 uses a mandatory split-config pattern: `auth.config.ts` for the Edge-safe middleware and `auth.ts` for the full Node.js instance. Slot availability is served by a `GET /api/booking/availability` Route Handler (not a Server Action — Server Actions are POST-only and cannot be polled). All mutations go through Server Actions with session verification inside each action, not just in middleware.

**Major components:**
1. **Sanity schemas** (`bookingType`, `doctorScheduleType`) — data contracts for the entire module; one singleton schedule document (template rules) + one booking document per appointment; individual time slots are generated as a pure function, NOT stored as Sanity documents
2. **Auth layer** (`auth.config.ts`, `auth.ts`, `middleware.ts`) — mandatory split-config pattern; JWT sessions (no adapter); patient and admin roles distinguished via `role` field in JWT; admin role assigned only when email matches `ADMIN_EMAIL` env var
3. **Slot generation** (`lib/booking/slots.ts`) — pure TypeScript function; takes schedule rules + existing bookings for a date → returns available time slots; testable in isolation with no Sanity dependency
4. **Booking Server Actions** (`lib/actions/booking.actions.ts`) — `createBooking`, `cancelBooking`; all session-verified; `ifRevisionID` locking on per-slot Sanity document at write time; confirmation email sent synchronously within the action
5. **BookingCalendar client component** — multi-step flow (service → date → time → confirm); polls `GET /api/booking/availability` for live slot state; all availability queries use `{ next: { revalidate: 0 } }` — never cached via ISR
6. **Admin dashboard** (`(admin)/layout.tsx` + `admin/page.tsx`) — separate route group with its own layout shell (no public Header/Footer); role check in layout AND every page Server Component independently
7. **Email system** (`lib/email.ts`) — Resend HTTP API; confirmation sent synchronously in `createBooking` Server Action; reminders via Vercel Cron daily job querying bookings in next 24-25h window, with `reminderSent` flag to prevent duplicates

See `.planning/research/ARCHITECTURE.md` for full project structure, code examples, and data flow diagrams.

### Critical Pitfalls

Twelve pitfalls are documented in `.planning/research/PITFALLS.md`. The five that are CRITICAL must all be addressed before the first patient interaction:

1. **Sanity eventual consistency — the double-booking trap** — GROQ queries for availability are eventually consistent. Two concurrent requests can both read "slot available" and both create a booking document, resulting in a real double-booked appointment. Prevention: model each time slot as a Sanity document with a `status` field; use `client.patch(slotId).set({ status: 'booked' }).ifRevisionID(slotRev).commit()` at booking creation; return HTTP 409 with Hungarian error message if slot taken. This is a Phase 1 schema decision — it cannot be retrofitted.

2. **GDPR compliance before first patient record** — Sign the Sanity Data Processing Agreement in Sanity account settings and complete a DPIA before any booking document is written. Build a patient erasure API (GROQ + batch delete). Store only name, email, phone — never health information. Set the Sanity dataset to private. Protect `/studio` with admin auth middleware.

3. **Auth.js v5 split-config for Edge middleware** — All auth in a single `auth.ts` crashes middleware on Vercel Edge runtime. `auth.config.ts` must be Edge-safe (no adapter, no database calls, no heavy imports); `middleware.ts` imports only `authConfig`. This error appears on Vercel but not in local development — easy to miss and expensive to debug.

4. **Middleware-only route protection (CVE-2025-29927)** — Middleware is a UX redirect, not a security gate. Every protected Server Component and every Server Action must call `await auth()` and verify session independently. Admin routes must verify `session.user.role === "admin"` in the layout AND each page.

5. **Sanity write token in client bundle** — Any env var with `NEXT_PUBLIC_` prefix is compiled into the browser JavaScript bundle. The Sanity write token must be `SANITY_WRITE_TOKEN` (no `NEXT_PUBLIC_` prefix), imported only in files with `"use server"` directive. One mistake exposes write access to all Sanity content.

Additional HIGH severity pitfalls: ISR cache on booking availability (must use `revalidate: 0`), Nodemailer SMTP blocked by Vercel (use Resend), plaintext password storage (must use bcryptjs with cost factor 12+), no `reminderSent` flag on bookings (causes duplicate reminder emails on every cron run), no rate limiting on booking and auth endpoints.

## Implications for Roadmap

The feature dependency graph and pitfall prevention requirements define a clear 6-phase structure. The ordering is driven by hard dependencies, not preference — phases cannot be reordered without creating blockers.

### Phase 1: Data Foundation and GDPR Architecture

**Rationale:** The Sanity schemas are the data contracts for the entire system. Nothing else can be built until the `doctorSchedule` and `booking` document types exist and TypeScript types are generated from them. More critically, the GDPR obligations (DPA, DPIA) must be satisfied before any patient data can enter the system — this is a legal prerequisite, not a technical nicety. The slot model decision (per-slot documents with `ifRevisionID`) is a Phase 1 architectural commitment that cannot be changed without a full data migration.

**Delivers:** Sanity schemas (`doctorSchedule` singleton, `booking` document); slot status document design; GROQ queries for schedule and bookings; Sanity write client (`writeClient.ts`, server-only with `import 'server-only'`); revalidation webhook updated for new types; GDPR DPA signed in Sanity account; DPIA documented; doctor populates initial schedule in Studio.

**Addresses:** Doctor schedule definition (weekday availability, slot duration, break times, blocked dates), booking document structure, service-linked duration (add `appointmentDurationMinutes` to existing service schema).

**Avoids:** Sanity eventual consistency / double-booking (per-slot document model committed before any booking code is written); GDPR violation before first patient record; write token exposure (write client established as server-only from day one).

### Phase 2: Authentication

**Rationale:** Auth gates all patient and admin routes. The split-config pattern must be established correctly here — retrofitting it later means touching every file that imports from auth. Role separation (patient vs. admin) must be codified before any role-gated routes exist. Password hashing pattern must be established before the first patient account can be created.

**Delivers:** `auth.config.ts` (Edge-safe provider config: Google OAuth + Credentials, role callbacks), `auth.ts` (full JWT instance), `middleware.ts` (route protection for `/fiokom` and `/admin`), Auth.js API route handler, login page (`/bejelentkezes`), patient registration with bcryptjs password hashing (cost factor 12), Header updated with "Bejelentkezés" / "Fiókom" links.

**Uses:** `next-auth@beta`, `bcryptjs`, `zod@^3.24` for Credentials form validation.

**Avoids:** Auth.js v5 Edge split-config runtime crash; middleware-only protection (CVE-2025-29927 pattern); admin/patient role mixing (role set in JWT callback from `ADMIN_EMAIL` env var only); plaintext password storage.

### Phase 3: Booking Core — Slot Generation, Calendar UI, Booking Creation

**Rationale:** This is the heart of the module. With schemas (Phase 1) and auth (Phase 2) in place, the full booking flow can be built end-to-end: slot generation logic, the availability Route Handler, the multi-step calendar UI, and the booking Server Action. Confirmation email is included here because it fires synchronously inside the same Server Action that creates the booking — separating them would require a more complex event system and is unnecessary at this volume.

**Delivers:** `lib/booking/slots.ts` (pure slot generation function, unit-tested in isolation), `GET /api/booking/availability` Route Handler (with `revalidate: 0`), `createBooking` Server Action (session verification + `ifRevisionID` locking + confirmation email), `BookingCalendar` multi-step client component (service → date → time → confirm), `/idopontfoglalas` page, `lib/email.ts` (Resend integration), booking confirmation email template in Hungarian.

**Uses:** `react-day-picker` with `hu` locale, `resend`, `@react-email/components`.

**Avoids:** ISR cache on availability data (`revalidate: 0` on all availability queries); Nodemailer SMTP (Resend from the start); double-booking (`ifRevisionID` in Server Action, 409 response with Hungarian error); Server Actions for read operations (Route Handler for GET availability).

### Phase 4: Patient Account

**Rationale:** After booking creation works, the patient needs to manage their appointments. This phase depends on auth (Phase 2) and booking documents (Phase 3). The 24-hour cancellation window must be enforced server-side in the `cancelBooking` action. Cancellation email is included here.

**Delivers:** `/fiokom` patient dashboard (upcoming and past bookings via GROQ filtered by session email), `/fiokom/foglalas/[id]` booking detail with cancel action, `cancelBooking` Server Action (24h window enforcement, Sanity mutation, cancellation email via Resend).

**Avoids:** Auth check only in middleware (each page Server Component verifies session independently); ISR on patient booking list (`revalidate: 0` for patient's bookings).

### Phase 5: Admin Dashboard

**Rationale:** The admin dashboard depends on booking documents (Phase 3) and role-based auth (Phase 2). It must be isolated in its own `(admin)` route group with a separate layout shell — this prevents the public site's layout (siteSettings fetch, Header, Footer, Motion animations, GA4) from loading unnecessarily on admin pages.

**Delivers:** `(admin)/layout.tsx` (admin shell, role guard — redirects non-admin to `/bejelentkezes`), `/admin` page (today's appointments chronological list + week calendar view, always fresh data with `revalidate: 0`), `/admin/foglalas/[id]` booking detail with manual cancellation capability and admin-triggered cancellation email.

**Avoids:** Admin dashboard sharing the public root layout (anti-pattern); role check only in layout (each page Server Component also checks `session.user.role === "admin"`); admin accessible to patients by URL navigation.

### Phase 6: Reminder Emails and Cron

**Rationale:** Reminder emails are functionally independent of all patient-facing features — they only require confirmed booking documents. They are placed last because Vercel Cron jobs can only be tested in production (they do not run in `next dev`). The `reminderSent` field added to the booking schema is a non-breaking addition.

**Delivers:** `reminderSent: boolean` field added to `booking` Sanity schema, Vercel Cron job (`GET /api/cron/reminders` Route Handler secured with `CRON_SECRET`), `vercel.json` cron entry (daily at 08:00 Europe/Budapest), reminder email template in Hungarian, GROQ query for bookings in next 24-25h window where `!reminderSent`, `reminderSent: true` patch after sending.

**Avoids:** Duplicate reminders on each cron run (`reminderSent` flag prevents re-sending); unauthenticated cron endpoint (`CRON_SECRET` header verification); incorrect cron granularity assumptions (daily on Vercel free tier, hourly on Pro — document which plan is in use).

### Phase Ordering Rationale

- Phase 1 before everything: Sanity schema TypeGen output is the type foundation all subsequent TypeScript code depends on. GDPR DPA must precede any patient data write — no exceptions.
- Phase 2 before Phases 3-5: Auth is the security foundation. All protected routes require `await auth()` inside them — you cannot build the routes before auth exists.
- Phase 3 before Phases 4-5: The booking document must exist before the patient account or admin dashboard can display anything meaningful.
- Phases 4 and 5 are independent after Phase 3: Patient account and admin dashboard share no dependencies on each other; they can be built in either order or simultaneously.
- Phase 6 last: Cron jobs require production deployment to test. All other features should be verified locally before addressing the one component that requires Vercel infrastructure.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** The tension between the ARCHITECTURE.md recommendation (slots as a pure function, no slot documents) and the PITFALLS.md recommendation (per-slot status documents for `ifRevisionID` locking) needs to be resolved with a concrete implementation design before the schema is finalized. The recommended resolution: per-slot documents exist for the locking transaction, but the list of possible slots for a given day is computed as a pure function — slot documents are created on-demand when a slot is selected, not pre-generated for all future dates. This hybrid needs a design spike.
- **Phase 2:** Auth.js v5 is still in beta (`5.0.0-beta.25+`). The exact Google OAuth callback URL configuration, session type augmentation TypeScript pattern, and `AUTH_*` env var naming (replaces `NEXTAUTH_*`) should be verified against the live `authjs.dev` docs at implementation time. Better Auth (`better-auth` package, which has native Sanity adapter support) should be noted as a documented fallback if Auth.js v5 beta stability causes problems.
- **Phase 6:** Vercel Cron free-tier (daily) vs. Pro (hourly) limits should be confirmed at implementation time. If the practice is on Vercel Pro, hourly crons give ±1h reminder accuracy. If free tier, accuracy is ±24h — which may be acceptable for a "24 hours before" reminder but is a business decision that should be explicit.

Phases with standard, well-documented patterns (can skip research-phase):

- **Phase 3 (slot generation):** A pure function computing available slots from schedule rules is a well-understood algorithm. Iterate over the day's hours, subtract break windows, subtract existing bookings. No novel integration.
- **Phase 4 (patient account):** Standard protected Server Component with GROQ filtered by session email. Documented cancellation patterns.
- **Phase 5 (admin dashboard):** Standard route group pattern with role-based layout guard. Fully documented in Next.js official docs and ARCHITECTURE.md.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core libraries verified via npm and official docs. Auth.js v5 is beta — callback signatures and env var naming may shift before stable release. Zod v3 vs v4 compatibility confirmed against Sanity v4 build system. |
| Features | HIGH | Table stakes verified against multiple scheduling platforms (Jane App, Acuity, Cliniko) and medical practice UX studies. GDPR requirements verified against EU guidance and Hungarian law (Act XLVII of 1997 on health data processing). |
| Architecture | HIGH for patterns / MEDIUM for Auth.js specifics | Split-config pattern confirmed in Auth.js v5 official migration guide. Slot-generation-as-pure-function is a widely-used pattern. Some Auth.js v5 beta callback type signatures may shift before stable release. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified against official sources: Sanity transaction docs (ifRevisionID), CVE-2025-29927 disclosure (multiple corroborating sources), Vercel SMTP KB. GDPR pitfalls confirmed via NAIH enforcement data and EU healthcare GDPR guidance. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Slot document model vs. computed availability:** ARCHITECTURE.md recommends computing slots as a pure function (no slot documents stored in Sanity). PITFALLS.md requires per-slot documents for `ifRevisionID` optimistic locking. These are in tension. The recommended resolution — per-slot documents created on-demand at booking confirmation time, not pre-generated — needs to be explicitly designed in Phase 1 before any booking code is written.
- **Auth.js v5 beta stability:** The exact API surface (callback signatures, session type augmentation, AUTH_ env var names) should be spot-checked against the live authjs.dev docs at the start of Phase 2. Better Auth should be evaluated and documented as the confirmed fallback before Phase 2 begins.
- **Sanity dataset privacy:** Confirm the Morocz Sanity dataset is set to "private" (not "public") before Phase 1 schema work begins. If currently public, any GROQ query from the browser can enumerate all documents — this must be verified before any patient document type is added.
- **Resend domain verification:** SPF, DKIM, and DMARC DNS records must be configured for the sending domain before Phase 3 email testing. This is a DNS infrastructure task that should be scheduled during Phase 3, not discovered at email go-live.
- **Sanity Studio auth protection:** The Studio at `/studio` must be protected by admin auth middleware before any patient booking documents exist in the system. This is a Phase 1/Phase 2 boundary task that must not be deferred.

## Sources

### Primary (HIGH confidence)
- Auth.js v5 official migration guide — https://authjs.dev/getting-started/migrating-to-v5 — edge split-config, JWT strategy, AUTH_ env vars
- Auth.js v5 edge compatibility guide — https://authjs.dev/guides/edge-compatibility
- CVE-2025-29927 — https://www.offsec.com/blog/cve-2025-29927/ — middleware-only auth bypass, defense-in-depth requirement
- Sanity Transactions official docs — https://www.sanity.io/docs/content-lake/transactions — ifRevisionID optimistic locking, eventual consistency in GROQ-based mutations
- Sanity Security and GDPR — https://www.sanity.io/security — DPA available, customer is data controller
- Vercel SMTP restrictions KB — https://vercel.com/kb/guide/sending-emails-from-an-application-on-vercel — SMTP blocked, Resend recommended
- Vercel Cron Jobs — https://vercel.com/docs/cron-jobs — daily limit (free tier), hourly (Pro)
- react-day-picker v9 React 19 compatibility — https://github.com/gpbl/react-day-picker/issues/2665
- react-day-picker Hungarian locale — https://daypicker.dev/localization/changing-locale
- Resend pricing / free tier — https://resend.com/pricing (3,000 emails/month)
- React Email 5.0 React 19 support — https://resend.com/blog/react-email-5
- Next.js route groups — https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Next.js Server Actions vs Route Handlers — https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

### Secondary (MEDIUM confidence)
- GDPR for healthcare — sprinto.com, gdprlocal.com — DPIA requirement, Article 6(1)(b) legal basis for appointment bookings
- Hungary GDPR enforcement (NAIH) — cms.law — healthcare sector focus, right-to-erasure enforcement in 2025
- Act XLVII of 1997 on Hungarian health data processing — cms.law expert guide
- Acuity Scheduling — double-booking prevention, cancellation policy best practices, buffer time standard
- Jane App — service-linked slot duration, buffer time between appointments (standard medical scheduling features)
- Zod 3 vs 4 ESM compatibility — zod.dev/v4, npm package registry
- bcryptjs edge runtime safety — github.com/vercel/next.js/issues/69002
- Auth.js v5 Credentials + Next.js 15 practitioner guide — codevoweb.com
- Europe/Budapest DST schedule — timeanddate.com (UTC+1 CET winter, UTC+2 CEST summer; transitions last Sunday March/October)

### Tertiary (LOW confidence — validate at implementation)
- Better Auth as fallback to Auth.js v5 — community reports of native Sanity adapter support; verify directly at implementation time if Auth.js v5 beta causes problems
- Inngest as Vercel Cron upgrade path — npm package page, free tier 50k executions/month; not needed for v2.0 but documented as upgrade path

---
*Research completed: 2026-02-22*
*Ready for roadmap: yes*
