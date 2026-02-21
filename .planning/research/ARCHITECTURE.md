# Architecture Research

**Domain:** Booking module integration — Next.js 15 App Router + Sanity v4 + Auth.js v5
**Researched:** 2026-02-21
**Confidence:** HIGH for patterns / MEDIUM for some third-party adapter specifics

---

## Standard Architecture

### System Overview — v2.0 Booking Module Added to Existing Site

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SANITY STUDIO (embedded /studio)                       │
│  Existing schemas: homepage | services | labTests | testimonials | blog |     │
│  NEW schemas:      doctorSchedule | booking | patient (user data)            │
│  Admin views:      Booking calendar view (custom Studio tool or desk)        │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │ Content Lake (Sanity HTTP API — write via SDK)
                                 │ GROQ queries via sanityFetch() — READ
                                 │ Sanity client mutations — WRITE (bookings)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER (src/app/)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│  EXISTING (unchanged)                                                         │
│  ├── layout.tsx                    — siteSettings fetch, Header + Footer     │
│  ├── page.tsx                      — homepage sections                       │
│  ├── blog/[slug]/page.tsx          — blog post detail                        │
│  └── api/revalidate/route.ts       — HMAC webhook revalidation               │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEW: Public booking flow  (route group: (public))                           │
│  ├── idopontfoglalas/page.tsx      — booking calendar page (Server Component)│
│  ├── idopontfoglalas/megerosites/  — booking confirmation page               │
│  └── (auth flow wired into existing layout)                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEW: Patient account  (route group: (patient))                              │
│  ├── fiokom/page.tsx               — patient dashboard: upcoming bookings    │
│  └── fiokom/foglalas/[id]/page.tsx — booking detail / cancel / reschedule   │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEW: Admin dashboard  (route group: (admin), separate layout)               │
│  ├── (admin)/layout.tsx            — admin shell, no Header/Footer, auth guard│
│  ├── admin/page.tsx                — today's appointments + calendar view    │
│  └── admin/foglalas/[id]/page.tsx  — patient detail, status management      │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEW: API routes                                                              │
│  ├── api/auth/[...nextauth]/route.ts — Auth.js v5 handler                   │
│  └── api/booking/availability/route.ts — slot availability (for polling)    │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEW: Server Actions (src/lib/actions/)                                      │
│  ├── booking.actions.ts            — createBooking, cancelBooking, reschedule│
│  └── auth.actions.ts               — signIn, signOut wrappers if needed      │
├──────────────────────────────────────────────────────────────────────────────┤
│  NEW: Auth layer                                                              │
│  ├── auth.config.ts                — providers (Google, Credentials), callbacks│
│  ├── auth.ts                       — full Auth.js instance + Sanity adapter  │
│  └── middleware.ts                 — JWT session check, route protection     │
└──────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                     │
│  Resend (email)          — booking confirmation, reminder emails             │
│  Google OAuth            — patient login via Google account                  │
│  Vercel (deployment)     — no changes needed, same project                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `auth.config.ts` | Auth providers + callbacks (edge-safe) | Google OAuth + Credentials; no adapter import |
| `auth.ts` | Full Auth.js instance with Sanity adapter | Imports auth.config + adds adapter + JWT strategy |
| `middleware.ts` | Route protection | Imports auth.config only (edge-safe); redirects unauthenticated users |
| `(admin)/layout.tsx` | Admin shell + role check | Server Component; calls `auth()`, checks role = 'admin', redirect otherwise |
| `idopontfoglalas/page.tsx` | Booking calendar page | Server Component; fetches schedule + availability from Sanity |
| `fiokom/page.tsx` | Patient account | Server Component; calls `auth()`, fetches patient's bookings from Sanity |
| `lib/actions/booking.actions.ts` | Create/cancel/reschedule bookings | Server Actions; auth check + Sanity mutation + Resend email |
| `api/booking/availability/route.ts` | Live slot availability | Route Handler; called by client for real-time slot checks |
| `sanity/schemaTypes/bookingType.ts` | Booking document | Sanity schema for appointments |
| `sanity/schemaTypes/doctorScheduleType.ts` | Weekly schedule + blocked dates | Sanity schema for availability configuration |

---

## Integration: Patient Auth

### Decision: Auth.js v5 (next-auth@5) with JWT strategy

Auth.js v5 is the correct choice for Next.js 15 App Router. Use JWT session strategy — not database sessions — because:

1. The Sanity adapter (`next-auth-sanity`) was archived September 2025 and does not support Auth.js v5.
2. A custom Sanity adapter is the path forward but adds implementation risk.
3. JWT sessions require no adapter, work on Vercel Edge, and are sufficient for a single-practice site with low auth volume.
4. Patient user data (name, email, phone) can be stored as a Sanity `patient` document on first booking — decoupled from Auth.js session management.

**Session location:** JWT in an HTTP-only cookie. Available everywhere via `auth()`.

### Auth Configuration Split (required for middleware edge-compatibility)

```
auth.config.ts        — providers + callbacks; NO adapter import; used in middleware
auth.ts               — imports auth.config; adds session strategy: 'jwt'; exports auth, handlers, signIn, signOut
middleware.ts         — imports from auth.config only; runs on Vercel Edge runtime
app/api/auth/[...nextauth]/route.ts — exports { GET, POST } from auth.ts handlers
```

**Pattern:**
```typescript
// auth.config.ts — edge-safe, no adapter
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const authConfig: NextAuthConfig = {
  providers: [
    Google,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // Verify against Sanity patient document
        // Return user object or null
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnPatientArea = nextUrl.pathname.startsWith('/fiokom')
      const isOnAdminArea = nextUrl.pathname.startsWith('/admin')
      if (isOnPatientArea) return isLoggedIn
      if (isOnAdminArea) return auth?.user?.role === 'admin'
      return true
    },
    jwt({ token, user }) {
      if (user) token.role = user.role // persist role in JWT
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      return session
    },
  },
  pages: {
    signIn: '/bejelentkezes',
  },
}
```

```typescript
// auth.ts — full instance, NOT used in middleware
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
})
```

```typescript
// middleware.ts
import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ['/fiokom/:path*', '/admin/:path*'],
}
```

### Where Sessions Are Read

| Context | How to access session |
|---------|----------------------|
| Server Component | `const session = await auth()` |
| Server Action | `const session = await auth()` |
| Route Handler | `const session = await auth()` |
| Middleware | Via `authorized` callback in auth.config.ts |
| Client Component | `useSession()` from `next-auth/react` (wrap in `<SessionProvider>`) |

### Patient User Data in Sanity

Auth.js JWT stores: `id`, `email`, `name`, `image`, `role`. On first booking, create or upsert a `patient` Sanity document keyed by email. This keeps auth decoupled from CMS — auth handles identity, Sanity handles medical/booking data.

---

## Integration: Booking Calendar

### Route: `/idopontfoglalas`

This is a new standalone page inside the existing public layout (Header + Footer visible). The URL `/idopontfoglalas` (Hungarian for "appointment booking") is entered directly in the App Router without a route group.

**Data flow for the booking page:**

```
Patient visits /idopontfoglalas
    ↓
idopontfoglalas/page.tsx  [Server Component]
    ├── sanityFetch({ query: doctorScheduleQuery })    — weekly hours + blocked dates
    ├── sanityFetch({ query: allServicesQuery })        — services patient can book
    └── renders <BookingCalendar> (Client Component 'use client')
            ↓ receives: schedule, services as props (no Sanity calls from client)
            ├── Step 1: patient picks service
            ├── Step 2: patient picks date (calendar, blocked dates from props)
            ├── Step 3: patient picks time slot
            │         ↓ fetch('/api/booking/availability?date=YYYY-MM-DD')
            │         — real-time check: which slots already booked
            └── Step 4: patient confirms (form submit → Server Action)
```

**Why a Route Handler for availability, not a Server Action:**
Server Actions use POST only. Slot availability is a read (GET), must be pollable without form submission, and needs to refresh periodically while the patient deliberates. Route Handler at `GET /api/booking/availability` is correct here.

---

## Integration: Booking Server Actions

### Decision: Server Actions for all mutations

Creating, canceling, and rescheduling a booking are mutations within the Next.js app, called from Client Components. Server Actions are the right choice:
- No separate API endpoint needed
- Built-in CSRF protection
- Direct access to session via `auth()`
- Automatic cache revalidation with `revalidatePath` / `revalidateTag`

```typescript
// src/lib/actions/booking.actions.ts
'use server'

import { auth } from '@/auth'
import { sanityWriteClient } from '@/sanity/lib/client'
import { sendConfirmationEmail } from '@/lib/email'
import { revalidateTag } from 'next/cache'

export async function createBooking(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Bejelentkezés szükséges')

  const serviceId = formData.get('serviceId') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string

  // 1. Check slot still available (guard against race condition)
  const existingBooking = await checkSlotAvailability(date, time)
  if (!existingBooking.available) {
    return { error: 'Ez az időpont már foglalt. Kérjük, válasszon másikat.' }
  }

  // 2. Create booking document in Sanity
  const booking = await sanityWriteClient.create({
    _type: 'booking',
    patient: { email: session.user.email, name: session.user.name },
    service: { _type: 'reference', _ref: serviceId },
    date,
    time,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  })

  // 3. Send confirmation email
  await sendConfirmationEmail({
    to: session.user.email!,
    patientName: session.user.name!,
    date,
    time,
  })

  revalidateTag('booking')
  return { success: true, bookingId: booking._id }
}
```

**Note on double-booking:** Sanity does not support database-level row locking. The protection strategy is:
1. Check availability in the Server Action before writing (read → validate → write)
2. Store a composite key field (`dateTime: "2026-03-15T10:00"`) on the booking document
3. Use Sanity's `ifRevisionID` optimistic locking on the slot document if using a slot-based model
4. At this scale (single practice, low concurrency), the read-then-write pattern with immediate status check is sufficient

---

## Sanity Schema: Availability Modeling

### Recommended Schema Design

Three new document types cover the booking domain:

**1. `doctorSchedule` (singleton document)**

Defines the weekly repeating schedule and one-off blocked dates. The doctor edits this in Studio.

```typescript
// Conceptual schema — actual file: src/sanity/schemaTypes/doctorScheduleType.ts
{
  name: 'doctorSchedule',
  type: 'document',
  fields: [
    {
      name: 'weeklySlots',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'dayOfWeek', type: 'number' },        // 1=Monday, 7=Sunday
          { name: 'startTime', type: 'string' },        // "09:00"
          { name: 'endTime', type: 'string' },          // "17:00"
          { name: 'slotDurationMinutes', type: 'number' }, // 30
          { name: 'breakStart', type: 'string' },       // "12:00" optional
          { name: 'breakEnd', type: 'string' },         // "13:00" optional
        ]
      }]
    },
    {
      name: 'blockedDates',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'date', type: 'date' },                // "2026-08-20"
          { name: 'reason', type: 'string' },            // "Szabadság"
        ]
      }]
    },
    {
      name: 'bookingWindowDays',
      type: 'number',
      // How far in advance patients can book (e.g., 60 days)
    }
  ]
}
```

**2. `booking` (many documents, one per appointment)**

```typescript
// Conceptual schema — actual file: src/sanity/schemaTypes/bookingType.ts
{
  name: 'booking',
  type: 'document',
  fields: [
    { name: 'patientName', type: 'string' },
    { name: 'patientEmail', type: 'string' },
    { name: 'patientPhone', type: 'string' },
    { name: 'service', type: 'reference', to: [{ type: 'service' }] },
    { name: 'date', type: 'date' },                     // "2026-03-15"
    { name: 'time', type: 'string' },                   // "10:00"
    { name: 'dateTime', type: 'string' },               // "2026-03-15T10:00" — composite key for conflict detection
    { name: 'status', type: 'string' },                 // 'confirmed' | 'cancelled' | 'completed'
    { name: 'notes', type: 'text' },                    // optional patient note
    { name: 'createdAt', type: 'datetime' },
    { name: 'cancelledAt', type: 'datetime' },
    { name: 'authUserId', type: 'string' },             // Auth.js user identifier
  ]
}
```

**3. Slot generation strategy: compute in code, not Sanity**

Do NOT store individual time slots as Sanity documents. That would create hundreds of documents per week. Instead:
- `doctorSchedule` defines the rules (weekly template + blocked dates)
- The booking calendar page fetches the schedule + existing bookings for a date range
- Slot generation is a pure function that takes schedule rules + booked slots → available slots

```typescript
// src/lib/booking/slots.ts
export function generateAvailableSlots(
  schedule: DoctorSchedule,
  existingBookings: Booking[],
  date: string, // "YYYY-MM-DD"
): TimeSlot[] {
  // 1. Find the weeklySlot for this day of week
  // 2. Generate all slots between startTime and endTime, skipping break
  // 3. Filter out slots that have a matching booking with status !== 'cancelled'
  // 4. Return available slots
}
```

---

## Integration: Email Sending

### Decision: Resend via Server Action (inline, not background job)

For a single-practice site with low booking volume, send email synchronously inside the Server Action after the booking is created. No background job infrastructure (Inngest, QStash) needed at this scale.

```typescript
// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendConfirmationEmail(params: {
  to: string
  patientName: string
  date: string
  time: string
  serviceName: string
}) {
  await resend.emails.send({
    from: 'Mórocz Medical <idopont@drmoroczangela.hu>',
    to: params.to,
    subject: 'Időpont-visszaigazolás — Mórocz Medical',
    // Use React Email component or plain HTML
    html: buildConfirmationEmailHtml(params),
  })
}
```

**Reminder emails:** At this scale, send reminders as a separate Vercel Cron job (one function, runs daily, queries upcoming bookings from Sanity and sends reminders for tomorrow's appointments). Do not require real-time event triggers.

---

## Integration: Admin Dashboard

### Decision: Route group `(admin)` with its own layout

The admin dashboard needs:
- No public Header/Footer (different shell entirely)
- Separate authentication check (role = 'admin')
- Different visual design (data-dense, not patient-facing)

Route groups make this clean without polluting the URL:

```
src/app/
├── layout.tsx                    — public root layout (Header + Footer)
├── (admin)/
│   ├── layout.tsx                — admin root layout (admin shell, role guard)
│   └── admin/
│       ├── page.tsx              — today's appointments + calendar
│       └── foglalas/[id]/
│           └── page.tsx          — booking detail
```

The URL is `/admin/...` — the route group `(admin)` is invisible in URLs.

**Admin layout pattern:**
```typescript
// src/app/(admin)/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/bejelentkezes?callbackUrl=/admin')
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  )
}
```

**Admin login:** The admin uses the same Auth.js login page (`/bejelentkezes`) but with the `Credentials` provider (email + password). The admin user document in Sanity has `role: 'admin'` — the JWT callback reads this and stores it in the token. Middleware and the admin layout both check this role.

There is no separate admin auth system — one auth stack, role-based access control.

---

## Recommended Project Structure (additions only)

```
src/
├── app/
│   ├── (admin)/                      # NEW — route group, invisible in URL
│   │   ├── layout.tsx                # Admin shell + role guard
│   │   └── admin/
│   │       ├── page.tsx              # Today's appointments
│   │       └── foglalas/[id]/
│   │           └── page.tsx          # Booking detail / manage
│   │
│   ├── idopontfoglalas/              # NEW — public booking page
│   │   └── page.tsx
│   │
│   ├── fiokom/                       # NEW — patient account area
│   │   ├── page.tsx                  # Upcoming / past bookings
│   │   └── foglalas/[id]/
│   │       └── page.tsx              # Cancel / reschedule
│   │
│   ├── bejelentkezes/                # NEW — login page
│   │   └── page.tsx
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts          # Auth.js handler
│       └── booking/
│           └── availability/
│               └── route.ts          # GET — slot availability for date
│
├── auth.config.ts                    # NEW — edge-safe provider config
├── auth.ts                           # NEW — full Auth.js instance
├── middleware.ts                     # NEW — route protection
│
├── components/
│   └── booking/                      # NEW — booking UI components
│       ├── BookingCalendar.tsx        # 'use client' — multi-step booking flow
│       ├── ServicePicker.tsx          # 'use client' — service selection step
│       ├── DatePicker.tsx             # 'use client' — calendar date selection
│       ├── TimePicker.tsx             # 'use client' — time slot grid
│       ├── BookingConfirmDialog.tsx   # 'use client' — confirm modal
│       └── PatientBookingList.tsx     # 'use client' — patient's bookings list
│
├── sanity/
│   └── schemaTypes/
│       ├── bookingType.ts            # NEW — appointment document
│       ├── doctorScheduleType.ts     # NEW — weekly schedule + blocked dates
│       └── patientType.ts            # NEW — patient profile (optional)
│
└── lib/
    ├── actions/
    │   ├── booking.actions.ts        # NEW — Server Actions: create, cancel, reschedule
    │   └── auth.actions.ts           # NEW — signIn/signOut wrappers if needed
    ├── booking/
    │   └── slots.ts                  # NEW — slot generation pure function
    └── email.ts                      # NEW — Resend email helpers
```

---

## Architectural Patterns

### Pattern 1: JWT Auth with Split Config for Edge Middleware

**What:** Auth.js v5 requires splitting configuration into `auth.config.ts` (edge-safe, no adapter, used in middleware) and `auth.ts` (full instance with any heavy dependencies, used everywhere else). The session is a signed JWT stored in an HTTP-only cookie — no database session table needed.

**When to use:** Whenever middleware runs auth checks and the project uses an adapter or ORM that is not edge-compatible. This is the recommended pattern in Auth.js v5 docs for Vercel deployments.

**Trade-offs:** Slightly more files than a single `auth.ts` approach. Worth it to avoid the "adapter not compatible with edge" error that breaks middleware deployment.

**Example:** See "Integration: Patient Auth" section above.

### Pattern 2: Sanity as Source of Truth for Schedule, Not Slots

**What:** Only the schedule rules (weekly template, blocked dates) live in Sanity. Individual time slots are generated on-demand in a pure TypeScript function. Booked slots are Sanity `booking` documents queried by date range.

**When to use:** Any calendar booking system where storing every possible slot would create an unwieldy number of documents.

**Trade-offs:** Slot generation logic must be correct and well-tested. The upside is the admin only manages the schedule template — not individual slots — which is a far better CMS editing experience.

### Pattern 3: Server Action Mutations + Route Handler for Live Reads

**What:** All state-changing operations (create booking, cancel, reschedule) use Server Actions. The single live-read operation (checking which slots are still available while the patient is choosing) uses a Route Handler (`GET /api/booking/availability`) because Server Actions are POST-only and not suitable for polled reads.

**When to use:** This hybrid is the correct default. Server Actions for mutations (form submissions, data writes). Route Handlers for read-only endpoints that need to be called repeatedly, cached, or accessed outside of form context.

### Pattern 4: Route Group for Admin Isolation

**What:** `(admin)` route group with its own `layout.tsx` gives the admin dashboard a completely different shell (no public Header/Footer) without affecting URLs. The role check lives in the layout — a single, authoritative gate for all admin routes.

**When to use:** Any time a portion of the app needs fundamentally different chrome and access rules from the public site. Do not use the public root layout for admin — it fetches site settings, shows the marketing nav, and is wrong for admin UX.

---

## Data Flow

### Booking Creation Flow

```
Patient fills booking form (Client Component)
    ↓ clicks "Foglalás megerősítése"
createBooking(formData) [Server Action]
    ├── await auth()                        → verify patient is logged in
    ├── checkSlotAvailability(date, time)   → GROQ query: existing bookings for this dateTime
    │       ↓ slot already taken?
    │       return { error: '...' }         → show error to patient, no write
    │       ↓ slot available?
    ├── sanityWriteClient.create(booking)   → write booking to Sanity Content Lake
    ├── sendConfirmationEmail(...)          → Resend API call
    ├── revalidateTag('booking')            → invalidate patient dashboard cache
    └── return { success: true, bookingId }
            ↓
Client Component receives result
    → redirect to /fiokom (patient dashboard) or show success message
```

### Slot Availability Flow (live check during booking)

```
Patient selects a date in BookingCalendar (Client Component)
    ↓
fetch('/api/booking/availability?date=2026-03-15')
    ↓
GET /api/booking/availability/route.ts  [Route Handler]
    ├── parse date param
    ├── sanityFetch(doctorScheduleQuery)   — get schedule rules (cached 60s)
    ├── sanityFetch(bookingsForDateQuery)  — get existing bookings for this date (no-cache)
    ├── generateAvailableSlots(schedule, bookings, date)  — pure function
    └── return JSON: [{ time: '09:00', available: true }, ...]
            ↓
Client Component renders available/unavailable time slots
```

### Admin Dashboard Flow

```
Admin visits /admin
    ↓
(admin)/layout.tsx  [Server Component]
    ├── await auth()
    ├── role !== 'admin' → redirect('/bejelentkezes')
    └── render admin shell
            ↓
admin/page.tsx  [Server Component]
    ├── sanityFetch(todaysBookingsQuery, { revalidate: 0 }) — always fresh
    ├── sanityFetch(doctorScheduleQuery, tags: ['doctorSchedule'])
    └── render <AdminCalendarView> + <TodayAppointmentsList>
```

### Patient Account Flow

```
Patient visits /fiokom
    ↓
middleware.ts checks JWT cookie
    ├── no session → redirect('/bejelentkezes?callbackUrl=/fiokom')
    └── session valid → allow
            ↓
fiokom/page.tsx  [Server Component]
    ├── await auth()                        — get session
    ├── sanityFetch(patientBookingsQuery, { params: { email: session.user.email } })
    └── render <PatientBookingList> with upcoming + past bookings
```

---

## Existing Code: What Changes vs What Stays

### Unchanged

| File | Status |
|------|--------|
| `src/app/layout.tsx` | Unchanged — public layout stays as is |
| `src/app/page.tsx` | Unchanged |
| `src/app/blog/[slug]/page.tsx` | Unchanged |
| `src/sanity/lib/fetch.ts` | Unchanged — sanityFetch works for reads |
| `src/sanity/lib/queries.ts` | Append-only — new queries added, none modified |
| `src/sanity/lib/client.ts` | Minor addition: export a write client with API token |
| `src/app/api/revalidate/route.ts` | Add new type mappings: `booking`, `doctorSchedule` |
| `src/sanity/schemaTypes/index.ts` | Add new schema imports |
| `src/components/layout/Header.tsx` | Add "Bejelentkezés" / "Fiókom" nav item (minor) |

### New Files (all additive, nothing deleted)

| File | Purpose |
|------|---------|
| `auth.config.ts` | Edge-safe auth config |
| `auth.ts` | Full Auth.js instance |
| `middleware.ts` | Route protection |
| `src/app/(admin)/layout.tsx` | Admin shell |
| `src/app/(admin)/admin/page.tsx` | Admin dashboard |
| `src/app/idopontfoglalas/page.tsx` | Booking calendar page |
| `src/app/fiokom/page.tsx` | Patient account |
| `src/app/bejelentkezes/page.tsx` | Login page |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js API handler |
| `src/app/api/booking/availability/route.ts` | Slot availability endpoint |
| `src/lib/actions/booking.actions.ts` | Booking Server Actions |
| `src/lib/booking/slots.ts` | Slot generation logic |
| `src/lib/email.ts` | Resend email helpers |
| `src/components/booking/*.tsx` | Booking UI components |
| `src/sanity/schemaTypes/bookingType.ts` | Booking schema |
| `src/sanity/schemaTypes/doctorScheduleType.ts` | Schedule schema |

---

## Build Order (considering hard dependencies)

The booking module has clear dependency chains. Build in this order to avoid blockers:

**Phase 1: Foundation (no user-facing output yet)**
1. New Sanity schemas: `doctorSchedule`, `booking` — establishes data contracts
2. Run `sanity typegen generate` — all subsequent TS work is type-safe
3. Add `GROQ queries` for schedule and bookings to `queries.ts`
4. Export Sanity write client from `client.ts` — needed by Server Actions
5. Update `api/revalidate/route.ts` with new document type mappings

**Phase 2: Auth (blocks all protected pages)**
6. `auth.config.ts` — Google provider + Credentials provider + callbacks
7. `auth.ts` — full Auth.js instance, JWT strategy
8. `middleware.ts` — route protection for `/fiokom` and `/admin`
9. `app/api/auth/[...nextauth]/route.ts` — Auth.js API route
10. `app/bejelentkezes/page.tsx` — login page (sign in form)
11. Header update — "Bejelentkezés" link

**Phase 3: Core booking (depends on auth + schemas)**
12. `lib/booking/slots.ts` — slot generation pure function (testable in isolation)
13. `api/booking/availability/route.ts` — slot availability endpoint
14. `lib/email.ts` — Resend email helpers
15. `lib/actions/booking.actions.ts` — createBooking, cancelBooking Server Actions
16. `components/booking/BookingCalendar.tsx` — multi-step booking UI (Client Component)
17. `app/idopontfoglalas/page.tsx` — booking page (fetches schedule, renders BookingCalendar)

**Phase 4: Patient account (depends on auth + booking)**
18. `app/fiokom/page.tsx` — patient dashboard
19. `app/fiokom/foglalas/[id]/page.tsx` — booking detail + cancel

**Phase 5: Admin dashboard (depends on auth + booking data)**
20. `app/(admin)/layout.tsx` — admin shell + role guard
21. `app/(admin)/admin/page.tsx` — admin calendar/today view
22. Admin booking management UI

**Phase 6: Reminder emails (can be added later, independent)**
23. Vercel Cron function — daily reminder emails

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 bookings/month | Current architecture handles this trivially. Single practice, one doctor. |
| 100-1k bookings/month | Add indexing on `dateTime` composite field. Monitor Sanity API usage (free tier: 500k requests/month). |
| 1k+ bookings/month | This is not realistic for a single-practice clinic. If it were: move to a proper relational DB (Postgres) for booking data; keep Sanity for CMS content only. |

### Scaling Priorities

1. **First concern — double-booking at peak times:** Read-then-write pattern in Server Actions is safe for this practice's volume. Implement `dateTime` composite field uniqueness check. For higher volume, use Sanity's `ifRevisionID` optimistic locking on a slot document.
2. **Second concern — Sanity write API costs:** Bookings use the write API (mutations), which counts against the plan. At a single practice's volume (maybe 20 bookings/day), this is negligible on the free/growth tier.

---

## Anti-Patterns

### Anti-Pattern 1: Storing Every Possible Time Slot as a Sanity Document

**What people do:** Create a `timeSlot` document type with a document per slot (09:00, 09:30, 10:00 ... for each day). Mark as `available: true/false`.

**Why it's wrong:** 30-minute slots, 5 days/week, 8 hours/day = 80 slots/week = 4,160/year. Plus Sanity document limits and query overhead. The editor experience for "blocking Christmas week" becomes painful. Schema changes break all slot documents.

**Do this instead:** Store schedule rules (template) in one `doctorSchedule` document. Generate slots as a pure function at query time. Store only actual bookings as documents.

### Anti-Pattern 2: Using the Database Session Strategy with Sanity

**What people do:** Configure Auth.js with `session: { strategy: 'database' }` and the `next-auth-sanity` adapter, expecting Sanity to store sessions.

**Why it's wrong:** The `next-auth-sanity` package was archived in September 2025 with no v5 support. Database sessions require an adapter that can run outside edge runtime, which means middleware cannot use it without the config split — adding complexity. Sessions stored in Sanity add write API calls on every request.

**Do this instead:** Use JWT sessions (`strategy: 'jwt'`). No adapter needed for auth itself. Patient profile data lives separately in Sanity `patient` or `booking` documents, not in Auth.js session tables.

### Anti-Pattern 3: Admin Dashboard Sharing the Public Root Layout

**What people do:** Put the admin at `/admin` without a route group, inheriting the public root layout with `sanityFetch` for site settings, Header, Footer, CookieNotice, GA4, MotionProvider.

**Why it's wrong:** Admin gets the patient-facing chrome (hero nav, marketing footer), the layout calls `sanityFetch(siteSettingsQuery)` on every admin page load unnecessarily, and animations fire on dashboard pages. Conceptually wrong — admin is an internal tool, not a public page.

**Do this instead:** Route group `(admin)` with its own `layout.tsx`. Admin layout has its own HTML structure: sidebar, data tables, no animations. Public layout unchanged and unaware of admin.

### Anti-Pattern 4: Fetching Slot Availability Inside a Server Action for Display

**What people do:** Create a Server Action to "get available slots" and call it from a Client Component to show the time picker.

**Why it's wrong:** Server Actions use POST requests and are designed for mutations. They cannot be called with GET semantics, cannot be cached by the browser, and are awkward to call reactively as the user browses dates. Using them for reads bypasses Next.js fetch caching.

**Do this instead:** Route Handler (`GET /api/booking/availability?date=...`) for the live availability read. Server Actions exclusively for mutations (create, cancel, reschedule).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Auth.js v5 (next-auth@5) | `auth()` in Server Components + Server Actions; `useSession()` in Client Components | JWT strategy; no adapter needed |
| Google OAuth | Via Auth.js Google provider | Configure in Google Cloud Console; `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` env vars |
| Sanity Content Lake (read) | Existing `sanityFetch()` wrapper — unchanged | Add new queries to `queries.ts` |
| Sanity Content Lake (write) | New write client: `createClient({ token: process.env.SANITY_API_WRITE_TOKEN })` | Write token needs `editor` or `developer` role in Sanity project settings |
| Resend | `resend.emails.send()` inside Server Actions and Cron | Verify sending domain in Resend dashboard; `RESEND_API_KEY` env var |
| Vercel Cron | `vercel.json` cron config + `app/api/cron/reminders/route.ts` | For daily reminder emails; use `CRON_SECRET` env var to secure the endpoint |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Auth layer → booking pages | `auth()` session object | Session carries `email`, `name`, `role` — all that's needed |
| Booking page → slot availability | REST: `GET /api/booking/availability` | Client Component fetches; Route Handler queries Sanity + runs slot generator |
| Booking form → Sanity | Server Action → Sanity write client | Server Action reads session, validates, writes, sends email |
| Admin layout → admin pages | Role check in layout protects subtree | No per-page role check needed if layout gate is correct |
| `doctorSchedule` Sanity doc → slot generator | TypeScript function call | Schedule document queried server-side; slots generated in `lib/booking/slots.ts` |
| Sanity schemas → revalidation | Add `booking` + `doctorSchedule` to `typeToTags` in `/api/revalidate/route.ts` | Ensures admin dashboard refreshes when bookings change in Studio |

---

## Sources

- Auth.js v5 migration guide — edge compatibility, split config, JWT strategy (HIGH confidence): https://authjs.dev/getting-started/migrating-to-v5
- Auth.js edge compatibility documentation (HIGH confidence): https://authjs.dev/guides/edge-compatibility
- next-auth-sanity GitHub archived September 2025, v1.5.3 last update August 2023 (verified): https://github.com/fedeya/next-auth-sanity
- Custom Sanity Auth.js adapter article (MEDIUM confidence): https://medium.com/@stanykhay29/how-to-create-and-integrate-a-custom-auth-js-database-adapter-compatible-with-sanity-cms-a63a7b4ad316
- Next.js Server Actions vs Route Handlers (HIGH confidence — official Next.js docs): https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- makerkit.dev Server Actions vs Route Handlers comparison (MEDIUM confidence): https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers
- Sanity transactions + ifRevisionID optimistic locking (HIGH confidence — official Sanity docs): https://www.sanity.io/docs/transactions
- Double-booking problem, optimistic locking patterns (MEDIUM confidence): https://itnext.io/solving-double-booking-at-scale-system-design-patterns-from-top-tech-companies-4c5a3311d8ea
- Resend Next.js integration (HIGH confidence — official Resend docs): https://resend.com/docs/send-with-nextjs
- Next.js route groups for separate layouts (HIGH confidence — official Next.js docs): https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Role-based access control in Next.js App Router middleware (MEDIUM confidence): https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router
- Medical appointment booking data model (MEDIUM confidence): https://www.red-gate.com/blog/the-doctor-will-see-you-soon-a-data-model-for-a-medical-appointment-booking-app

---

*Architecture research for: Morocz Medical v2.0 — Booking module integration into Next.js 15 App Router + Sanity v4*
*Researched: 2026-02-21*
