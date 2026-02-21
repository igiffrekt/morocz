# Pitfalls Research

**Domain:** Patient booking module added to existing Next.js 15 + Sanity CMS medical practice site (v2.0)
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH (Sanity transaction model verified against official docs; auth pitfalls verified against Auth.js official migration guide and CVE reports; GDPR from Hungarian law + EU guidance; email from Vercel official KB; timezone confirmed via IANA data)

> **Scope note:** This file covers pitfalls specific to *adding* the booking module to the existing Morocz Medical site. Pitfalls from the v1 research (animation, Sanity CDN staleness, schema over-engineering, etc.) are documented in the prior PITFALLS.md run and are not repeated here. This file is entirely about the v2.0 features: patient auth, booking data storage in Sanity, calendar UI, email notifications, admin auth, GDPR compliance, and double-booking prevention.

---

## Critical Pitfalls

### Pitfall 1: Relying on Sanity as a Transactional Database — The Eventual Consistency Trap

**Severity: CRITICAL**

**What goes wrong:**
Developers store booking documents in Sanity and use GROQ queries to check slot availability before creating a new booking. Because Sanity's search store (which powers GROQ queries) is eventually consistent, the availability query may return stale results. Two patients can simultaneously read "slot available," both pass the availability check, and both successfully create a booking document — resulting in a double-booked appointment slot.

**Why it happens:**
Sanity is designed as a content management system, not a transactional database. Its architecture separates the document store (strongly consistent) from the search store (eventually consistent). When a mutation uses the `query` option to find and modify documents, Sanity's official docs explicitly state this reduces isolation to "read committed" level and can cause lost updates, non-repeatable reads, phantom reads, and write skew. Developers assume "it has transactions, so it's safe" without understanding this separation.

**The specific failure mode for booking:**
```
Patient A: GROQ query → "10:00 AM is free" ✓
Patient B: GROQ query → "10:00 AM is free" ✓  (search store hasn't replicated A's check)
Patient A: client.create(booking for 10:00 AM) → success
Patient B: client.create(booking for 10:00 AM) → success ← DOUBLE BOOKED
```

**How to avoid:**
Use Sanity's `ifRevisionID` optimistic locking on slot documents rather than query-based availability checks:

1. Model slots as individual Sanity documents (one document per time slot per day), not as a computed range.
2. When a patient selects a slot, fetch that specific slot document and note its `_rev` field.
3. Submit a patch mutation with `ifRevisionID: _rev` that marks the slot as booked.
4. If another patient already booked the slot, Sanity returns HTTP 409 Conflict — handle gracefully.
5. Wrap slot creation and slot status update in a single Sanity transaction.

```typescript
// Correct: optimistic locking prevents double-booking
await client
  .patch(slotDocumentId)
  .set({ status: 'booked', patientId: userId })
  .ifRevisionID(slotRevision) // Rejects with 409 if slot changed since we fetched it
  .commit()
```

This does NOT prevent double-booking if you use GROQ queries to enumerate available slots at the moment of booking — that path is inherently racy. Reserve GROQ queries for displaying the calendar (reads only); use the `ifRevisionID` mutation pattern for the actual booking transaction.

**Warning signs:**
- Booking creation logic uses `client.fetch()` or GROQ to check availability immediately before `client.create()` for a booking
- Slot availability is computed from a list of bookings (e.g., "find all booked slots, subtract from schedule") rather than a per-slot status document
- No 409 conflict handling in the booking API route
- Load testing with 2 concurrent booking requests for the same slot succeeds for both

**Phase to address:**
Phase 1 (Data Model Design) — this architectural decision must be made before any booking code is written. The slot document model with `ifRevisionID` locking cannot be retrofitted onto a query-based design without a data migration.

---

### Pitfall 2: Storing Patient Booking Data in Sanity Without GDPR Compliance Architecture

**Severity: CRITICAL**

**What goes wrong:**
Patient names, email addresses, and phone numbers are stored as Sanity documents. When a patient exercises their GDPR "right to erasure" (Article 17) or "right of access" (Article 15), there is no mechanism to find and delete all their data, and no data processing agreement in place with Sanity. Additionally, Sanity Studio is publicly visible at `/studio` with no IP restriction — staff and developers can see all patient personal data without audit logging. The Hungarian NAIH data protection authority has active enforcement and focuses specifically on healthcare data handling.

**Why it happens:**
Developers think "Sanity is GDPR compliant" (which is true for Sanity's infrastructure) and treat that as sufficient. The compliance responsibility for *what you store* is the data controller's (the practice's) responsibility, not Sanity's. Three separate failures compound: (1) no DPA signed with Sanity, (2) no deletion API built for data subject erasure requests, (3) no access controls on patient data in Studio.

**How to avoid:**

**Legal obligations (non-negotiable):**
- Sign Sanity's Data Processing Agreement (DPA) before storing any patient data — available in Sanity account settings
- Create a Data Protection Impact Assessment (DPIA) for the booking system — required by GDPR Article 35 for healthcare data processing
- Document the legal basis for processing: Article 6(1)(b) "performance of a contract" for appointment bookings
- Set a data retention policy (e.g., booking records deleted after 3 years) and implement it

**Technical implementation:**
- Build a GROQ query + deletion API that can find all documents referencing a patient's userId and delete them on erasure request:
  ```typescript
  // Find all booking documents for a patient
  const bookings = await client.fetch(
    `*[_type == "booking" && patientId == $userId]{ _id }`,
    { userId }
  )
  // Delete each + anonymize the patient account document
  const transaction = client.transaction()
  bookings.forEach(b => transaction.delete(b._id))
  await transaction.commit()
  ```
- Patient account data in Sanity should store only what is strictly necessary: `userId` (from Auth.js), name, email, phone — nothing that constitutes health data
- Do NOT store any appointment notes, diagnoses, symptoms, or health information in Sanity — this would constitute "health data" under GDPR Article 9, triggering special category requirements
- Restrict Sanity Studio at `/studio` to admin users only — implement middleware auth check before the Studio route is accessible

**Warning signs:**
- No DPA with Sanity in place before first patient record is stored
- Studio accessible at `/studio` without authentication in production
- No erasure endpoint or process documented
- Booking records contain anything beyond: appointment time, service type, and patient contact info
- No data retention schedule defined

**Phase to address:**
Phase 1 (Legal & Data Architecture). The DPA must be signed and DPIA completed before the first booking document schema is written. This is not a "add compliance later" concern — it affects the schema design.

---

### Pitfall 3: Auth.js v5 Edge Runtime / Database Adapter Incompatibility

**Severity: CRITICAL**

**What goes wrong:**
Developers install an Auth.js v5 database adapter (to persist sessions and link Google OAuth accounts with email/password accounts in Sanity or any database) and configure it in a single `auth.ts` file. This causes runtime errors when the middleware runs on the Edge runtime, because database adapters use Node.js APIs that are not available in the Edge runtime. The error is typically opaque at runtime and not caught during local development.

**Why it happens:**
Auth.js v5 introduced edge compatibility as a feature, but it requires splitting configuration into two files. The official migration guide documents this, but developers following blog tutorials written for NextAuth v4 or early v5 combine everything in one file. The middleware runs on the Edge; the adapter runs on Node.js — they cannot be in the same file.

**How to avoid:**
Follow the Auth.js v5 split-config pattern exactly:

```typescript
// auth.config.ts — Edge-compatible config (no adapter, no database calls)
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
  providers: [
    Google,
    Credentials({
      async authorize(credentials) {
        // Validate email/password — use only edge-safe operations here
        // Do NOT import database clients here
      }
    })
  ],
  pages: { signIn: "/bejelentkezes" },
}

// auth.ts — Node.js-only, used in Server Components and API routes
import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
// Import adapter here (not in auth.config.ts)
export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" }, // REQUIRED when using edge middleware with adapter
})

// middleware.ts — Imports only authConfig, not auth.ts
import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
export const { auth: middleware } = NextAuth(authConfig)
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] }
```

**Warning signs:**
- `auth.ts` imports a database adapter AND is imported in `middleware.ts`
- Error message about "crypto" or Node.js built-ins in Edge runtime
- Middleware works in `next dev` but throws on Vercel deployment
- Single `auth.ts` file that handles both Edge and Node.js contexts

**Phase to address:**
Phase 2 (Authentication Setup) — the split-config architecture must be established before any route protection is added.

---

### Pitfall 4: Middleware-Only Route Protection (CVE-2025-29927 Pattern)

**Severity: CRITICAL**

**What goes wrong:**
Patient booking routes (`/profil`, `/foglalas/*`) and the admin dashboard are protected exclusively by Next.js middleware that checks the session. An attacker sends any request with the `x-middleware-subrequest` header, which causes Next.js to skip middleware execution, granting unauthenticated access to all protected routes. This CVE was publicly disclosed in March 2025 and affects all Next.js versions prior to 15.2.3.

**Why it happens:**
Middleware-only protection is a common pattern in tutorials and the Next.js documentation's own examples. The CVE exploits a header that was originally used by Next.js internally to prevent infinite middleware loops. Because middleware is the most visible and obvious place to add auth checks, most developers add it there and consider the job done.

**How to avoid:**
Apply a defense-in-depth approach — middleware is the first line of defense, not the only one:

1. **Upgrade to Next.js 15.2.3+** (already fixed in the current stack)
2. **Verify session in Server Components** that fetch patient-specific data, not just at the route level:
   ```typescript
   // In every protected Server Component
   import { auth } from "@/auth"
   import { redirect } from "next/navigation"

   export default async function PatientDashboard() {
     const session = await auth()
     if (!session?.user) redirect("/bejelentkezes")
     // Only now fetch patient-specific data
   }
   ```
3. **Verify session in API routes** before performing any mutations — middleware cannot protect API routes from server-side calls
4. **Separate admin auth** — admin routes (`/admin/*`) must verify not just authentication but the specific admin role flag, done in the Server Component, not just middleware

**Warning signs:**
- Auth check only in `middleware.ts`, not in page.tsx or Server Components
- API routes that mutate booking data without session verification
- Admin dashboard accessible to any authenticated user without role check
- Layout.tsx used for auth redirect (layouts don't re-render on navigation — the session check may not fire)

**Phase to address:**
Phase 2 (Authentication Setup) and enforced in every subsequent phase that adds protected routes. The pattern must be established in Phase 2 and reviewed in each phase's definition of done.

---

### Pitfall 5: Mixing Patient Auth and Admin Auth in the Same Auth.js Configuration

**Severity: HIGH**

**What goes wrong:**
The admin dashboard uses the same Google OAuth + credentials provider as patient login. A patient creates an account with their Google email, and if that email happens to match a staff email, they gain admin access. Alternatively, the admin "role" is stored as a boolean on the User session, and a patient who modifies their session token (JWT tampering) can escalate privileges. Most commonly: no clear separation exists between the two user types in the code, making it easy to introduce privilege escalation bugs.

**Why it happens:**
It seems simpler to have one auth system. Developers add a `role: "admin" | "patient"` field to the JWT and use middleware to check it. But the JWT is signed, not encrypted — its payload is readable without the secret. More critically, session role escalation bugs in callback logic are common when providers are mixed.

**How to avoid:**
Use separate authentication surfaces, not separate libraries. The simplest approach for a single-doctor practice:

- **Admin login:** Use Auth.js Credentials provider with a hardcoded or environment-variable email/password for the doctor's admin account only. No Google OAuth for admin. Admin routes check `session.user.role === "admin"` where role is set in the `jwt` callback only when the email matches the `ADMIN_EMAIL` environment variable.
- **Patient login:** Google OAuth + email/password Credentials provider. Patients never receive a role that grants admin access.
- **Role assignment logic:**
  ```typescript
  // In Auth.js callbacks
  async jwt({ token, user }) {
    if (user?.email === process.env.ADMIN_EMAIL) {
      token.role = "admin"
    } else {
      token.role = "patient"
    }
    return token
  }
  ```
- Admin routes (`/admin/*`) verify `session.user.role === "admin"` in every Server Component, not just middleware.

**Warning signs:**
- Admin and patient accounts created through the same registration flow
- `role` field in JWT is based on a database column that any user can potentially influence
- Google OAuth configured as a valid admin login path
- Admin dashboard accessible to patients who know the URL

**Phase to address:**
Phase 2 (Authentication Setup) — define role separation before any routes are built.

---

## Moderate Pitfalls

### Pitfall 6: Storing Booking Datetimes in Local Hungarian Time Instead of UTC

**Severity: HIGH**

**What goes wrong:**
Booking datetime is stored as a Hungarian local time string like "2026-03-29T10:00:00" without a timezone identifier. Hungary observes DST (Europe/Budapest: UTC+1 in winter, UTC+2 in summer). When the DST transition occurs on the last Sunday of March, the slot "10:00 AM" on the day of the transition means different UTC times before and after the clocks change — and JavaScript's `new Date()` uses the *server's* timezone, which on Vercel is UTC. Email confirmations show the wrong time. The calendar UI shows appointments shifted by an hour.

**Why it happens:**
Local Hungarian practice: everything is in "Budapest time" — the doctor doesn't think in UTC. Developers match this mental model and store local times. The bug only surfaces near DST transitions (last Sunday in March, last Sunday in October) and is rarely caught in testing.

**How to avoid:**
- Always store datetimes in Sanity as UTC ISO 8601 strings with the `Z` suffix: `"2026-03-29T08:00:00.000Z"`
- Convert to Europe/Budapest display time in the UI using `Intl.DateTimeFormat` with `timeZone: "Europe/Budapest"`:
  ```typescript
  const display = new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(bookingUtcString))
  ```
- When the doctor defines schedule in Sanity Studio (e.g., "Monday 09:00–17:00"), interpret and store these as UTC for each specific date using a server-side conversion function that accounts for DST
- Use `date-fns-tz` or `luxon` for server-side UTC ↔ Europe/Budapest conversion — never assume a fixed +1 or +2 offset
- Include timezone-aware appointment reminders: "Időpontja: 2026-03-30, hétfő, 10:00 (Budapest idő szerint)"

**Warning signs:**
- Datetime strings stored in Sanity without a `Z` or timezone offset (e.g., `"2026-04-01T10:00:00"` — ambiguous)
- Slot display logic using `new Date(dateString).toLocaleTimeString()` without `timeZone` option
- No test case for an appointment on the last Sunday of March or October

**Phase to address:**
Phase 1 (Data Model Design) — choose the UTC storage convention before any datetime is persisted.

---

### Pitfall 7: Email Notifications Failing Silently on Vercel Serverless

**Severity: HIGH**

**What goes wrong:**
Developers configure Nodemailer with a Gmail SMTP or a self-managed SMTP server. On Vercel, outbound SMTP connections are blocked. The email "sends" in local development, the patient receives no confirmation email in production, and the booking is created without any notification. The failure is silent — no error is thrown to the patient, no alert reaches the developer.

**Why it happens:**
Vercel explicitly restricts outbound SMTP connections from serverless functions. Nodemailer works perfectly locally because local development has no such restriction. The failure mode only occurs on Vercel deployment and is easy to miss if email testing is skipped during deployment.

**How to avoid:**
- Use Resend (https://resend.com) as the email provider — it uses an HTTP API (not SMTP), is the current Next.js community standard for transactional email, has a generous free tier (100 emails/day), and has an official React Email integration for building Hungarian-language email templates
- Never use Nodemailer with SMTP on Vercel; if Nodemailer is used, it must be configured with an HTTP-based provider (e.g., SendGrid HTTP API via Nodemailer transport — still suboptimal; use Resend directly instead)
- Email sending must be `await`ed in the serverless function — fire-and-forget email in serverless is swallowed when the function completes:
  ```typescript
  // In the booking creation API route
  const { data, error } = await resend.emails.send({
    from: "Morocz Medical <foglalas@moroczmedical.hu>",
    to: patientEmail,
    subject: "Időpont-visszaigazolás",
    react: BookingConfirmationEmail({ booking }),
  })
  if (error) {
    // Log error; still return success to patient — don't fail the booking for email failure
    console.error("Email send failed:", error)
  }
  ```
- Treat email send failure as non-fatal for the booking — log it, alert the admin, but do not fail the booking creation

**Warning signs:**
- Email works in `npm run dev` but not on Vercel production URL
- `SMTP_HOST`, `SMTP_PORT`, or `MAIL_HOST` environment variables configured on Vercel
- Nodemailer installed with no explicit HTTP-based transport configuration
- Email sending is not `await`ed (fire-and-forget in serverless)

**Phase to address:**
Phase 3 (Email Notifications) — establish the Resend integration before the first confirmation email is needed. Test with Resend's test mode API key before switching to production.

---

### Pitfall 8: Appointment Reminder Emails Require Persistent Scheduling — Vercel Cron Has Limits

**Severity: MEDIUM**

**What goes wrong:**
Pre-appointment reminder emails (e.g., "reminder sent 24 hours before appointment") require scheduled execution at a specific future time. Developers use Vercel Cron Jobs to run a job every 15 minutes that queries upcoming appointments — this works, but the Vercel free plan limits cron jobs to daily frequency, and paid plan cron jobs run at most once per minute (not per-appointment scheduling). For a low-volume practice, cron polling is acceptable; for anything requiring per-appointment precision, it breaks.

**Why it happens:**
The simplest solution to "send email at a future time" is "check every N minutes," but serverless functions have no persistent state between invocations. Developers underestimate the cron granularity limitations on Vercel's free tier.

**How to avoid:**
- For a single-practice medical site (low volume: <50 bookings/day), Vercel Cron polling every hour is acceptable — the reminder accuracy is ±1 hour, which is fine for a "24 hours before" reminder
- The cron job should query Sanity for appointments in the next 24h-25h window and send reminders to those not yet reminded (use a `reminderSent: boolean` flag on the booking document):
  ```typescript
  // Vercel cron job: runs hourly
  const upcoming = await client.fetch(
    `*[_type == "booking" && status == "confirmed" && !reminderSent &&
       scheduledAt > $now && scheduledAt < $twentyFiveHoursFromNow]`,
    { now: new Date().toISOString(), twentyFiveHoursFromNow: addHours(new Date(), 25).toISOString() }
  )
  ```
- Alternative for precise scheduling: use Upstash QStash (integrates with Vercel, supports delayed HTTP calls) to schedule a reminder email delivery at a specific UTC time when the booking is created — this avoids polling entirely
- Document cron job granularity limits in the project: daily on free Vercel plan, hourly on Pro

**Warning signs:**
- Attempting to schedule per-appointment emails without a queuing service (QStash, Inngest, etc.)
- Cron job on Vercel free tier trying to run every 5 minutes (not supported on free tier)
- `reminderSent` flag missing on booking documents — enables duplicate reminders on each cron run

**Phase to address:**
Phase 3 (Email Notifications) — choose the reminder strategy (cron polling vs QStash) before implementing.

---

### Pitfall 9: Sanity Write Token Exposed via Client-Side Booking Mutations

**Severity: CRITICAL (security)**

**What goes wrong:**
The booking creation form calls `client.create()` from the browser using a Sanity write token stored in a `NEXT_PUBLIC_SANITY_TOKEN` environment variable. This exposes the write token in every browser's DevTools network tab and in the compiled client-side JavaScript bundle. Anyone with the token can create, modify, or delete any Sanity document — including deleting all blog posts, patient records, or the doctor's schedule.

**Why it happens:**
Developers working quickly copy the read client setup and add a write token without realizing that `NEXT_PUBLIC_*` variables are bundled into the client JavaScript. The booking form "works" and they ship it.

**How to avoid:**
- All Sanity mutations (booking creation, booking cancellation, patient profile update) must go through Next.js Server Actions or API routes — never called directly from the browser
- The Sanity write token lives in `SANITY_API_WRITE_TOKEN` (not `NEXT_PUBLIC_*`) — it is never accessible to the browser
- Pattern for booking creation:
  ```typescript
  // src/app/actions/createBooking.ts — Server Action
  "use server"
  import { auth } from "@/auth"
  import { writeClient } from "@/sanity/lib/writeClient" // Uses SANITY_API_WRITE_TOKEN

  export async function createBooking(formData: FormData) {
    const session = await auth()
    if (!session?.user) throw new Error("Nem bejelentkezett felhasználó")
    // ... validate, then mutate
    await writeClient.create({ _type: "booking", patientId: session.user.id, ... })
  }
  ```
- Verify in production: open DevTools → Network tab → check no request to Sanity API includes a write token in headers

**Warning signs:**
- `NEXT_PUBLIC_SANITY_WRITE_TOKEN` or similar in environment variables
- `client.create()` or `client.patch()` called in a component file without a `"use server"` directive
- Sanity write client imported in any file without `"use server"` at the top

**Phase to address:**
Phase 2 (Authentication Setup) and Phase 1 (Data Model Design). Establish the server-action-only mutation pattern before any mutation code is written.

---

### Pitfall 10: Calendar UI Showing Slots That Are Already Booked Due to ISR Cache

**Severity: HIGH**

**What goes wrong:**
The booking calendar displays available time slots fetched from Sanity. These slots are cached by Next.js ISR (or fetched at build time). Patient A books the 10:00 AM slot — but Patient B's calendar still shows it as available because the ISR cache hasn't revalidated. Patient B selects the slot and proceeds to payment/confirmation only to receive a 409 error at the final step, creating a frustrating user experience.

**Why it happens:**
The existing v1 site uses ISR for all Sanity content. Developers carry this pattern into the booking system without realizing that booking availability is time-sensitive data that must not be cached the same way as blog posts.

**How to avoid:**
- Calendar availability data must be fetched with `cache: 'no-store'` (or `revalidate: 0`) — do not use ISR for availability:
  ```typescript
  const slots = await client.fetch(availabilityQuery, params, {
    next: { revalidate: 0 } // Always fresh
  })
  ```
- Alternatively, implement Sanity's live preview / real-time listener for the availability view to refresh automatically when slots change
- When a patient submits a booking, the client should optimistically mark the slot as pending in local state and refresh the calendar after the server action completes
- The server action should return the 409 conflict to the client gracefully with a Hungarian-language error: "Ez az időpont közben foglalt lett. Kérjük, válasszon másik időpontot."
- Trigger `revalidatePath('/idopontfoglalas')` after each successful booking mutation so other users' views are refreshed

**Warning signs:**
- `sanityFetch()` (which uses ISR) used for booking availability without overriding cache settings
- No `revalidatePath` call after booking mutations
- Calendar data has a `revalidate` value greater than 0
- No graceful handling of 409 conflict responses in the booking form

**Phase to address:**
Phase 4 (Calendar UI) — establish no-cache fetching for availability data as a non-negotiable requirement.

---

### Pitfall 11: Auth.js Credentials Provider Storing Passwords Without Proper Hashing

**Severity: CRITICAL (security)**

**What goes wrong:**
The email/password registration for patients stores passwords in plain text or with weak MD5/SHA1 hashing in Sanity. If the Sanity dataset is ever exposed (e.g., via a misconfigured dataset access level), patient passwords are immediately compromised. Patients reuse passwords — a leaked medical booking site password leads to wider account takeover.

**Why it happens:**
Credentials provider examples in tutorials often use simplified auth logic for demonstration. Developers copy the pattern without adding bcrypt. Additionally, Sanity doesn't have a "users" database table in the traditional sense — storing credentials in Sanity documents feels natural but lacks the automatic protections that dedicated auth databases have.

**How to avoid:**
- Use `bcryptjs` (pure JS, works in any environment) or `argon2` for password hashing — never store plaintext or weakly hashed passwords:
  ```typescript
  // Registration Server Action
  import bcrypt from "bcryptjs"
  const hashedPassword = await bcrypt.hash(password, 12) // Cost factor 12
  await writeClient.create({ _type: "patient", email, hashedPassword })

  // Auth.js Credentials authorize function
  const patient = await client.fetch(`*[_type == "patient" && email == $email][0]`, { email })
  if (!patient) return null
  const valid = await bcrypt.compare(password, patient.hashedPassword)
  return valid ? { id: patient._id, email: patient.email } : null
  ```
- Consider using a dedicated auth service (Auth.js with a proper adapter + a real database like Neon/PlanetScale) instead of storing credentials in Sanity — Sanity is not designed to store secrets
- If credentials must be in Sanity, mark the `hashedPassword` field in the schema with `hidden: true` in Studio so it never appears in the editor UI
- Set Sanity dataset to "private" (not "public") — do not use a public dataset for any dataset that contains patient records

**Warning signs:**
- `password` field stored on patient documents without the word "hashed" in the field name
- No `bcrypt` or `argon2` in `package.json`
- Sanity dataset set to "public" with patient documents
- Password validation in `authorize()` using `===` string comparison instead of `bcrypt.compare()`

**Phase to address:**
Phase 2 (Authentication Setup) — before the first patient account can be created.

---

### Pitfall 12: No Rate Limiting on Booking and Auth Endpoints

**Severity: HIGH**

**What goes wrong:**
The booking creation endpoint and the login endpoint have no rate limiting. A bot can submit thousands of fake bookings, filling the doctor's schedule with phantom appointments. The login endpoint can be brute-forced. On Vercel, each request is a serverless function invocation — a flood of requests also generates Vercel usage costs.

**Why it happens:**
Rate limiting is infrastructure-level and easy to defer. Server Actions don't have built-in rate limiting. Developers ship the feature without it and add rate limiting only after an incident.

**How to avoid:**
- Use Vercel's built-in DDoS protection (automatic on all Vercel deployments) as a baseline
- Add application-level rate limiting using `@upstash/ratelimit` with Upstash Redis — this is the standard Next.js App Router approach and works with serverless:
  ```typescript
  import { Ratelimit } from "@upstash/ratelimit"
  import { Redis } from "@upstash/redis"

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 booking attempts per minute per IP
  })
  ```
- Rate limit booking creation by IP (5 per minute) and by authenticated user (3 per hour — a patient should not need to create more than 3 bookings per hour)
- Rate limit login attempts by email (10 per hour) to prevent credential stuffing
- The admin dashboard has no public exposure, but protect it with rate limiting on the login endpoint anyway

**Warning signs:**
- No rate limiting middleware or helper imported in any Server Action
- Login endpoint responds identically to 1 attempt and 1000 attempts per second
- No Redis or in-memory store configured for rate limiting state

**Phase to address:**
Phase 2 (Authentication Setup) for auth endpoints; Phase 3 (Booking API) for booking endpoints.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing availability as computed list (all bookings minus schedule) | No extra documents needed | Inherently racy, impossible to use optimistic locking | Never — use per-slot status documents |
| Checking availability with GROQ immediately before booking mutation | Simple code path | Double-booking under concurrent load due to eventual consistency | Never for booking confirmation |
| Skipping DPA with Sanity before storing patient data | Start building faster | GDPR violation, potential NAIH fine of up to €20M or 4% turnover | Never |
| `NEXT_PUBLIC_SANITY_WRITE_TOKEN` for client-side mutations | Simpler mutation code | Write token exposed to all users; catastrophic data breach risk | Never |
| Storing datetimes in local Hungarian time without timezone | Matches doctor's mental model | Appointments off by 1 hour near DST transitions (twice a year) | Never — always store UTC |
| Middleware-only route protection | Simple to implement | CVE-2025-29927 bypass; any authenticated check is bypassable | Never — always verify in Server Components too |
| Nodemailer + Gmail SMTP on Vercel | No new service needed | Emails silently fail in production; SMTP blocked by Vercel | Never on Vercel |
| Password stored without bcrypt | Faster to implement | Plaintext passwords in CMS; catastrophic on any data exposure | Never |
| Single auth config file for middleware and adapter | Simpler file structure | Runtime crash in Edge runtime; breaks middleware on Vercel | Never with Auth.js v5 + adapter |
| No reminderSent flag on bookings | Simpler schema | Duplicate reminder emails on every cron run | Never |
| Admin and patient in same auth provider flow | One login flow to build | Privilege escalation risk; admin access via patient account path | Never |
| Cache availability with ISR | Consistent with rest of site | Stale availability data; patients try to book already-booked slots | Never for availability — always revalidate: 0 |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Auth.js v5 + Edge middleware | Single `auth.ts` file used in middleware | Split into `auth.config.ts` (edge-safe) and `auth.ts` (Node.js only); import `authConfig` in middleware |
| Auth.js v5 + Google OAuth | Missing `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET` naming | Auth.js v5 auto-detects `AUTH_*` prefixed variables; `NEXTAUTH_*` no longer works |
| Auth.js v5 + database sessions on Edge | Default `database` session strategy with adapter on Edge | Force `session: { strategy: "jwt" }` when adapter is used with Edge middleware |
| Sanity write client | Importing Sanity write client in a component file | All mutations via Server Actions only; write client never imported in non-`"use server"` files |
| Resend + Vercel | Using Nodemailer SMTP | Use Resend HTTP API directly (`resend.emails.send()`); install `resend` package |
| Resend + react-email | Including Tailwind CSS in email templates | react-email's Tailwind component causes Vercel function timeouts; use react-email's inline style utilities instead |
| Sanity + booking availability | Using `sanityFetch()` (ISR-enabled) for slot data | Override with `{ next: { revalidate: 0 } }` for all availability queries |
| Sanity + patient data erasure | Manual GROQ deletion per field | Build a dedicated erasure API that finds all patient-linked documents and deletes in a single transaction |
| Next.js + admin route protection | Auth check in `layout.tsx` | Layouts don't re-render on navigation — always check auth in page.tsx or Server Components, not layout |
| Vercel Cron + reminder emails | Daily cron on free plan, hourly on Pro | Set `reminderSent: true` on documents after sending; query only documents where `!reminderSent` |
| Sanity Studio + patient data | Studio accessible at `/studio` without auth | Add middleware check that validates admin session before allowing access to `/studio` route |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full month of slots as individual documents | Slow calendar loading; many API calls | Batch fetch the month's slot documents in a single GROQ query with date range filter | Immediately at >20 slots per view |
| Real-time calendar with Sanity Live (WebSocket) on free plan | Unexpected API cost; connection limits | Sanity Live is not needed for booking — use polling with revalidate:0 for availability | At >2 concurrent users on free Sanity plan |
| Sending emails synchronously in the same request that creates the booking | Slow booking confirmation (>3 seconds) | Fire email in a Server Action but don't await it if latency matters; log failures separately | Immediately on slow mail servers |
| Loading Auth.js `SessionProvider` globally | Large client bundle; crypto polyfills | Use `auth()` server-side; only use SessionProvider in components that genuinely need client-side session access | Immediately; adds ~40KB to client bundle |
| GROQ availability query scanning all booking documents | Slow queries as booking history grows | Index by date; query only documents within a ±2 week window; include `scheduledAt` in GROQ filter | At >500 historical booking documents |
| Calendar component loaded eagerly on booking page | Delays time-to-interactive for page | Dynamic import the calendar component: `dynamic(() => import('./BookingCalendar'), { ssr: false })` | Immediately on slow connections |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Patient data (name, email, phone) in a public Sanity dataset | Any user can GROQ query all patient records directly from the API | Set dataset to "private" in Sanity project settings; patient data documents must be in a private dataset |
| No CORS restriction on Sanity write API calls | Write token captured and used from any origin | Never expose write token client-side; server actions provide natural CORS protection |
| Admin dashboard accessible without role verification in Server Component | Authenticated patients can access admin data by navigating to `/admin` | Check `session.user.role === "admin"` in every `/admin/*` page Server Component |
| Booking confirmation emails that include personal health information | Phishing attack surface; GDPR violation if email account compromised | Email confirmations include only: date, time, service name, and cancellation link — no health notes |
| Sanity Studio accessible in production without auth | Any visitor can access `/studio` and view patient bookings | Middleware must block `/studio` unless session.user.role === "admin" |
| No CSRF protection on booking mutations | Cross-site booking manipulation | Use Next.js Server Actions (CSRF-protected by default); never use GET requests for mutations |
| Session cookie without `Secure` and `HttpOnly` flags | Session hijacking | Auth.js v5 sets these by default; verify in production via DevTools → Application → Cookies |
| Password reset flow sending token via email without expiry | Infinite-validity reset links | Auth.js handles reset token expiry when using magic link / email provider — but custom implementations must set short expiry (15 min) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Booking flow requires registration before showing available slots | Patients abandon before seeing any value | Show the calendar and available slots without auth; require login only at final confirmation step |
| No immediate feedback after booking submission | Patient double-clicks submit, creates duplicate booking attempts | Disable submit button immediately on first click; show spinner; server action handles idempotency |
| Date picker using US locale (Sunday-first weeks) | Hungarian users confused — Hungary uses Monday-first ISO weeks | Configure date picker with `locale="hu"` and `weekStartsOn: 1`; use `hu-HU` for all `Intl` calls |
| Confirmation email arrives in spam folder | Patients miss appointment or think booking failed | Set up SPF, DKIM, DMARC records for the sending domain; use a verified Resend sender domain |
| Booking cancellation requires login to a separate page | Patients don't cancel; doctor has no-shows | Include a one-click cancellation link in the confirmation email (signed token, no login required for cancellation) |
| Admin calendar shows appointments in UTC | Doctor reads wrong times for the day | Admin dashboard always displays Europe/Budapest time; all server-side UTC datetimes converted before display |
| No buffer between consecutive appointments | Doctor has no break; patients running late cause cascade delays | Schedule management must allow configuring a "buffer time" between slots (e.g., 10 min gap between 30-min appointments) |
| Long registration form before booking | 60%+ of medical web traffic is mobile; forms kill conversion | Minimal registration: name, email, phone only; Google OAuth as the zero-friction alternative |

---

## "Looks Done But Isn't" Checklist

- [ ] **Double-booking prevention:** Test by submitting two simultaneous booking requests for the same slot. Only one should succeed. Verify 409 conflict handling returns a user-friendly Hungarian error message.
- [ ] **GDPR erasure:** Manually trigger a patient deletion and verify all booking documents, the patient account document, and any references are removed from Sanity.
- [ ] **Sanity DPA:** Confirm the Data Processing Agreement has been accepted in the Sanity account settings before any patient data enters the system.
- [ ] **Auth Edge split:** Verify middleware runs correctly on Vercel by checking the Edge function logs — no "Node.js module not supported" errors.
- [ ] **Admin role isolation:** Log in as a patient and manually navigate to `/admin` — you should receive a redirect to the login page or a 403, not the dashboard.
- [ ] **Write token server-only:** Open browser DevTools → Sources → search for `SANITY` — the write token must not appear anywhere in client-side JavaScript.
- [ ] **Email in production:** Test the full booking flow on the Vercel production URL (not localhost) and confirm the confirmation email is received in under 30 seconds.
- [ ] **Timezone on DST boundary:** Create a test booking for the last Sunday in March at 09:00 AM Budapest time — confirm the stored UTC datetime and displayed time are both correct.
- [ ] **Slot availability no-cache:** Open the calendar on two browser tabs simultaneously. Book a slot in Tab A. Refresh Tab B — the slot must show as booked.
- [ ] **Password hashing:** Query the Sanity dataset directly (via Vision plugin) and confirm the password field contains a bcrypt hash (starts with `$2b$`), not a plaintext password.
- [ ] **SPF/DKIM/DMARC:** Send a test email to a Gmail address and check "Show original" — SPF and DKIM must both pass.
- [ ] **Studio auth:** Visit `/studio` in an incognito browser window — must redirect to login, not show the Studio interface.
- [ ] **Rate limiting:** Send 10 consecutive booking requests in 1 minute from the same IP — requests 6-10 must receive 429 Too Many Requests.
- [ ] **Reminder sent flag:** Run the cron reminder job twice for the same upcoming appointment — patient receives only one reminder email, not two.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double bookings discovered after launch | HIGH | Audit all booking documents; contact affected patients to reschedule; implement per-slot status documents + ifRevisionID locking; run data migration |
| GDPR violation — patient data stored without DPA | HIGH | Sign DPA retroactively (Sanity allows this); file a voluntary disclosure with NAIH if required; implement erasure API immediately; document corrective actions |
| Write token exposed in client bundle | CRITICAL | Rotate the Sanity write token immediately (Sanity dashboard → API → Tokens); audit Sanity mutation logs for unauthorized writes; move all mutations to Server Actions |
| Auth Edge split missing — middleware crashes on Vercel | MEDIUM | Add `auth.config.ts` split; move adapter import out of middleware-referenced files; redeploy |
| Plaintext passwords discovered in Sanity | CRITICAL | Force password reset for all affected accounts; hash all passwords with bcrypt; rotate any other credentials that may have been reused |
| Email delivery failing in production | LOW | Switch from Nodemailer SMTP to Resend HTTP API; test with Resend test mode key; redeploy; notify patients who booked during the outage to check their booking status |
| Admin accessible to patients | MEDIUM | Add role check to every `/admin/*` Server Component; force logout all active sessions; audit access logs for unauthorized access |
| Datetimes stored in local time (not UTC) | HIGH | Data migration to add UTC equivalents for all stored datetimes; update all display logic to use Europe/Budapest conversion; test all edge cases around DST |
| Duplicate reminder emails sent | LOW | Add `reminderSent: true` flag; mark all already-reminded bookings; redeploy; send apology email to affected patients |

---

## Pitfall-to-Phase Mapping

| Pitfall | Severity | Prevention Phase | Verification |
|---------|----------|------------------|--------------|
| Sanity eventual consistency / double-booking | CRITICAL | Phase 1 — Data Model Design | Concurrent booking test (2 requests, 1 slot, only 1 succeeds) |
| Patient data GDPR compliance architecture | CRITICAL | Phase 1 — Legal & Data Architecture | DPA signed; DPIA documented; erasure API works end-to-end |
| Auth.js v5 Edge / adapter split | CRITICAL | Phase 2 — Authentication Setup | Middleware runs without errors on Vercel Edge function logs |
| Middleware-only auth (CVE-2025-29927) | CRITICAL | Phase 2 — Authentication Setup | Direct `/admin` navigation as patient returns 403/redirect |
| Admin/patient auth mixing | HIGH | Phase 2 — Authentication Setup | Patient account cannot access any `/admin` route |
| UTC datetime storage | HIGH | Phase 1 — Data Model Design | DST boundary test booking stores and displays correct time |
| Email via SMTP on Vercel | HIGH | Phase 3 — Email Notifications | Confirmation email received in production within 30 seconds |
| Reminder email scheduling | MEDIUM | Phase 3 — Email Notifications | Double-run of cron job sends only one reminder per appointment |
| Sanity write token in client bundle | CRITICAL | Phase 2 — Authentication Setup | `SANITY` search in compiled JS bundle returns no write token |
| Calendar availability with ISR cache | HIGH | Phase 4 — Calendar UI | Two-tab simultaneous booking test shows correct state |
| Plaintext password storage | CRITICAL | Phase 2 — Authentication Setup | Vision plugin query shows bcrypt-hashed value for password field |
| No rate limiting | HIGH | Phase 2 & 3 | 429 response after 5 rapid booking attempts from same IP |

---

## Sources

- [Sanity Transactions — official docs](https://www.sanity.io/docs/content-lake/transactions) — HIGH confidence — confirms repeatable read isolation with lock acquisition caveat, eventual consistency in GROQ-based mutations, ifRevisionID optimistic locking pattern
- [Sanity Technical Limits — official docs](https://www.sanity.io/docs/content-lake/technical-limits) — HIGH confidence — 25 req/s mutation rate, 100 concurrent mutations, 4MB mutation body
- [Auth.js v5 Migration Guide — authjs.dev](https://authjs.dev/getting-started/migrating-to-v5) — HIGH confidence — confirms AUTH_ prefix requirement, edge/adapter split necessity, JWT strategy requirement with Edge middleware
- [CVE-2025-29927 — Next.js Middleware Authorization Bypass](https://www.offsec.com/blog/cve-2025-29927/) — HIGH confidence — multiple corroborating sources (Datadog, JFrog, Snyk); Vercel-hosted deployments protected, self-hosted must patch; defense-in-depth is the mitigation
- [Vercel SMTP restrictions — official Vercel KB](https://vercel.com/kb/guide/sending-emails-from-an-application-on-vercel) — HIGH confidence — confirms SMTP blocked; recommends Resend, Postmark, SendGrid; HTTP API required
- [Vercel Cron Jobs — official docs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — HIGH confidence — confirms daily limit on free tier, production-only invocation
- [GDPR in Healthcare — sprinto.com + gdprlocal.com](https://sprinto.com/blog/gdpr-for-healthcare/) — MEDIUM confidence — confirmed by EU DPC guidance and EDPS; DPIA required for health data processing
- [Hungary GDPR enforcement — NAIH / CMS Law](https://cms.law/en/gbr/publication/gdpr-enforcement-tracker-report/hungary) — MEDIUM confidence — confirms NAIH enforcement, healthcare sector focus, right to erasure focus in 2025
- [Act XLVII of 1997 on Health Data Processing (Hungary)](https://cms.law/en/int/expert-guides/cms-expert-guide-to-data-protection-and-cyber-security-laws/hungary) — MEDIUM confidence — Hungarian law layered on top of GDPR for health data
- [Sanity Security & GDPR compliance](https://www.sanity.io/security) — HIGH confidence — confirms Sanity's own GDPR compliance; customer is data controller; DPA available; private dataset option
- [Nodemailer on Vercel failing — community discussion](https://github.com/vercel/vercel/discussions/4387) — MEDIUM confidence — multiple developers confirming SMTP failure on Vercel; consistent with official KB
- [Europe/Budapest DST schedule — timeanddate.com](https://www.timeanddate.com/time/change/hungary/budapest) — HIGH confidence — UTC+1 (CET) winter, UTC+2 (CEST) summer; DST: last Sunday March / last Sunday October
- [Auth.js credentials provider with Next.js 15 — codevoweb.com](https://codevoweb.com/how-to-set-up-next-js-15-with-nextauth-v5/) — MEDIUM confidence — practitioner guide, consistent with official docs
- [Upstash Ratelimit — upstash.com](https://upstash.com/blog/email-scheduler-qstash) — MEDIUM confidence — standard pattern for Next.js App Router rate limiting; widely used in community

---
*Pitfalls research for: Morocz Medical v2.0 — Patient Booking Module (Next.js 15 + Sanity CMS)*
*Researched: 2026-02-22*
