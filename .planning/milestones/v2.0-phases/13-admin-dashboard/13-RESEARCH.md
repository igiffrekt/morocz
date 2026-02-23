# Phase 13: Admin Dashboard - Research

**Researched:** 2026-02-23
**Domain:** Next.js admin dashboard, custom calendar UI, admin-initiated booking cancellation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard layout**
- Two-panel layout: calendar on the left, selected day's appointments on the right
- No stat cards row at top — clean, direct into calendar + appointments
- Clicking a day in the calendar loads that day's appointments in the right panel
- Default view loads with today selected

**Appointment list (day panel)**
- Each appointment row shows: time, patient name, service name, phone number
- Status badges: Confirmed / Cancelled only — no in-progress/done tracking
- Appointments listed in chronological order
- Rows are clickable — open patient detail modal

**Calendar views**
- Month/Week toggle — user can switch between both views
- **Month view:** Full month grid, colored dots on days that have bookings
- **Week view:** Vertical timeline (Google Calendar style) — hours on the left, appointment blocks showing patient name and time range, color-coded blocks, day tabs at the top (like the reference image)
- In week view, clicking an appointment block also opens the patient detail modal

**Patient detail modal**
- Centered modal/dialog overlay on click (from day list or week view)
- Shows: patient name, email (clickable mailto:), phone (clickable tel:), service, date/time, booking status
- Also shows patient's booking history (past and future appointments at the practice)
- Cancel action hidden in a three-dot (⋮) menu — not a direct button, to prevent accidental clicks

**Admin cancel flow**
- Cancel option in three-dot menu inside the detail modal
- Confirmation dialog required: "Biztosan lemondja ezt az időpontot?" with patient name and date shown
- Optional reason field — if filled, included in the cancellation email
- Same 24-hour cancellation rule as patients — admin cannot cancel within 24h of appointment
- Cancellation email clearly states the clinic cancelled: "A rendelő lemondta az Ön időpontját" + optional reason
- Separate email template from patient self-cancel

### Claude's Discretion
- Exact color scheme for calendar dots and appointment blocks (should match existing site design system)
- Week view time slot granularity and hour range displayed
- Modal animation and transition style
- Empty state for days with no appointments
- Loading states for calendar and appointment data
- How booking history is sorted/displayed in the detail modal
- Responsive behavior (if admin uses mobile)

### Deferred Ideas (OUT OF SCOPE)
- Revenue/weekly overview charts — could be a future analytics phase
- Walk-in appointment tracking — not needed for online booking system
- Invoice management — out of scope entirely
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Admin can view today's appointments in chronological order | GROQ query for bookings by slotDate + slotTime sort; day panel component |
| ADMIN-02 | Admin can view weekly calendar with booked and free slots | Custom month/week calendar component; GROQ query for bookings in date range |
| ADMIN-03 | Admin can see patient details (name, email, phone) per booking | Patient detail modal reading from booking document fields |
| ADMIN-04 | Admin can manually cancel a booking (patient gets cancellation email) | New `/api/admin/booking-cancel` route with session check; new admin-cancel email template |
</phase_requirements>

---

## Summary

Phase 13 builds the functional admin dashboard at `/admin`, replacing the current placeholder. The auth infrastructure is complete from Phase 10: `auth.api.getSession()` verifies the admin role in the Server Component, and `AdminLogin` is already rendered for unauthenticated users. The page needs to become a full two-panel dashboard with a custom calendar and a day appointments panel.

The key architectural decision is that **no external calendar library is needed**. The codebase already contains a complete hand-built month calendar in `Step2DateTime.tsx` (Hungarian weekday headers, Monday-first grid, available-day highlighting). The admin month view is a variation of this same pattern — the difference is it shows booking-count dots instead of availability. The week view is a vertical timeline that can be built as a CSS grid with fixed hour rows and absolutely-positioned appointment blocks. Both views are fully within the project's capability using Tailwind CSS.

The admin cancel flow needs a **separate API route** (`/api/admin/booking-cancel`) that authenticates via session (not managementToken) and sends a distinct email template. The existing `/api/booking-cancel` uses the patient's `managementToken` as the auth mechanism — the admin route must instead call `auth.api.getSession()` to verify admin role, then patch by booking `_id` directly. A new `buildAdminCancellationEmail` function goes into `booking-email.ts` with the "rendelő lemondta" messaging and the optional reason field.

**Primary recommendation:** Build all calendar UI as custom Tailwind components without external libraries. Create a new admin API route for cancellation. Reuse the existing GROQ patterns, email infrastructure, and slot utility functions.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.2.0 | Server Components, API routes | Project stack |
| React | ^19.0.0 | Client components, state | Project stack |
| Tailwind CSS | ^4.0.0 | UI styling (mixed with inline styles) | Project stack |
| @sanity/client | (via next-sanity) | GROQ queries for bookings data | Project stack |
| better-auth | ^1.4.18 | Session verification, admin role check | Already used in /admin/page.tsx |
| zod | ^3.25.76 | API route body validation | Already used in all API routes |
| motion | ^12.34.2 | Modal animations (discretion area) | Already installed |

### No New Dependencies Required

The project's existing stack covers everything needed:
- Custom calendar: Pure React + Tailwind (same approach as `Step2DateTime.tsx`)
- Modal/dialog: Native HTML dialog element OR conditional rendering (existing pattern in `CancelDialog.tsx`)
- Three-dot menu: Simple relative-positioned `<button>` with absolute dropdown (no Radix needed)
- Email: `gmail` client already in `email.ts`

**Radix UI is NOT installed and NOT needed.** The existing `CancelDialog` pattern (conditional rendering within parent state machine) is sufficient for all modals in this phase.

---

## Architecture Patterns

### Recommended File Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx          # EXISTING — dark admin layout
│       └── page.tsx            # REPLACE placeholder with AdminDashboard
├── components/
│   └── admin/
│       ├── AdminLogin.tsx          # EXISTING — keep untouched
│       ├── AdminDashboard.tsx      # NEW — top-level client shell (state management)
│       ├── AdminCalendar.tsx       # NEW — month/week calendar with toggle
│       ├── AdminDayPanel.tsx       # NEW — right panel: today's appointment list
│       ├── AdminWeekView.tsx       # NEW — vertical timeline week view
│       ├── AdminPatientModal.tsx   # NEW — patient detail modal with three-dot menu
│       └── CookieNotice.tsx        # EXISTING — keep untouched
└── app/
    └── api/
        └── admin/
            ├── bookings/
            │   └── route.ts        # NEW — GET bookings by date range (admin-authed)
            └── booking-cancel/
                └── route.ts        # NEW — POST cancel by _id (admin-authed, not token)
```

### Pattern 1: Server Component Fetches Session, Passes to Client Dashboard

The existing `/admin/page.tsx` pattern is correct: Server Component verifies session with `auth.api.getSession()`, then renders `<AdminDashboard session={session} />`. The dashboard client component manages all interactive state (selected date, selected booking, calendar view mode).

```typescript
// Source: existing /admin/page.tsx pattern (Phase 10)
// page.tsx stays a Server Component
export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <AdminLogin />;
  if (session.user.role !== "admin") return <AccessDenied />;
  // Fetch initial data server-side for today
  const todayBookings = await getWriteClient().fetch(TODAY_BOOKINGS_GROQ, { date: todayStr });
  return <AdminDashboard session={session} initialBookings={todayBookings} />;
}
```

### Pattern 2: Admin API Routes Authenticate via Session (Not managementToken)

The existing patient cancel route uses `managementToken` as auth. Admin routes must use session-based auth:

```typescript
// Source: established project pattern from auth.ts + booking-cancel/route.ts
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  // 1. Verify admin session — no managementToken auth here
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 401 });
  }
  // 2. Parse body with bookingId (not token)
  const parsed = AdminCancelSchema.safeParse(await request.json());
  // 3. Fetch booking by _id directly (admin has write client access)
  // 4. Enforce 24h rule (same logic as booking-cancel/route.ts)
  // 5. Patch booking.status to "cancelled"
  // 6. Release slotLock (same try/catch pattern)
  // 7. Fire-and-forget buildAdminCancellationEmail
}
```

### Pattern 3: GROQ Queries for Admin Data

**Bookings by date (day panel):**
```groq
// Source: existing patterns in booking-cancel/route.ts, booking-reschedule/route.ts
*[_type == "booking" && slotDate == $date && status == "confirmed"] | order(slotTime asc) {
  _id, patientName, patientEmail, patientPhone, reservationNumber,
  service->{name, appointmentDuration}, slotDate, slotTime, status,
  managementToken
}
```

**Bookings in date range (calendar dots / week view):**
```groq
*[_type == "booking" && slotDate >= $startDate && slotDate <= $endDate && status == "confirmed"] {
  _id, patientName, service->{name}, slotDate, slotTime, status
}
```

**Patient booking history (all bookings by patientEmail):**
```groq
*[_type == "booking" && patientEmail == $email] | order(slotDate desc) {
  _id, reservationNumber, service->{name}, slotDate, slotTime, status
}
```

**CRITICAL: Use `$manageToken` not `$token` in GROQ params** — `$token` is reserved in `@sanity/client` QueryParams. This is an established project rule from Phase 12.

### Pattern 4: Custom Month Calendar (Variation of Step2DateTime)

The existing `Step2DateTime.tsx` calendar is the foundation. Admin month calendar differences:
- No slot-availability API calls — uses pre-fetched booking data
- Shows colored dot badges on days with bookings instead of availability count
- Clicking any day (not just available days) loads that day's appointments in the right panel
- No 30-day max limit — admin can browse any date

Key calendar utilities to reuse:
```typescript
// These patterns already exist in Step2DateTime.tsx
function getFirstDayMondayIndex(year, month) // Monday-first grid
function getDaysInMonth(year, month)
function toDateString(year, month, day)
const HU_WEEKDAYS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"] // Hétfő-first
```

### Pattern 5: Week View Vertical Timeline

CSS Grid approach — no library needed:
- Time column: fixed hours (e.g., 07:00–18:00) on the left
- Day columns: 7 columns, one per day
- Appointment blocks: absolutely positioned within their day column, top/height derived from time math
- Color coding: use design system colors (`#99CEB7` accent for confirmed, muted for cancelled)

```typescript
// Time math for positioning appointment blocks
function timeToPercent(time: string, startHour: number, endHour: number): number {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = (h ?? 0) * 60 + (m ?? 0);
  const rangeMinutes = (endHour - startHour) * 60;
  const offsetMinutes = totalMinutes - startHour * 60;
  return (offsetMinutes / rangeMinutes) * 100;
}
```

### Pattern 6: Admin Cancellation Email Template

New function `buildAdminCancellationEmail` in `src/lib/booking-email.ts`:
- Header says: "A rendelő lemondta az Ön időpontját" (not "Időpont lemondva")
- Optional reason block — renders conditionally if `reason` is provided
- No "Új időpont foglalása" CTA button with prominent styling — clinic cancelled, softer messaging
- Reuses same design system variables: `navy`, `pink`, `green`, `lightGrey`, `textDark`, `textMuted`
- Same Gmail API send path via `sendEmail()` in `email.ts`

### Anti-Patterns to Avoid

- **Using managementToken to authorize admin cancel:** The admin route must verify session role, not the booking's token. Token-based auth is for patient self-service only.
- **Calling `auth.api.getSession()` from client components:** Always call from Server Components or API routes (server-side only). Use the session prop passed down from the Server Component for client display.
- **Installing an external calendar library (DayPilot, react-big-calendar, etc.):** The project already has the calendar grid logic in `Step2DateTime.tsx`. Adding a library adds bundle weight and introduces opinionated styling that conflicts with the dark admin theme.
- **Using `$token` in GROQ params:** Reserved key — use `$manageToken` or `$bookingId` instead.
- **Blocking the cancel response on email send:** Use the same fire-and-forget pattern as all other email sends (wrap in `void` async function with try/catch).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session verification in API routes | Custom JWT parsing | `auth.api.getSession({ headers: request.headers })` | Already established pattern; handles token refresh, role lookup |
| Email sending | Direct SMTP or fetch to Gmail | `sendEmail()` from `src/lib/email.ts` | Already built, RFC 2047 subject encoding, error handling |
| Sanity mutations | Raw fetch to Sanity REST API | `getWriteClient().patch().set().commit()` | Already established; handles auth, retry |
| Time math for slots | Custom time parser | `timeToMinutes` / `minutesToTime` patterns from `slots.ts` (copy or extract) | Already tested, avoids timezone bugs |
| Hungarian date formatting | Manual string builder | `new Date(slotDate).toLocaleDateString("hu-HU", {...})` | Already used in every route/component |

**Key insight:** This phase is largely assembly work — almost all primitives exist. The risk is building unnecessary abstraction rather than wiring what's already there.

---

## Common Pitfalls

### Pitfall 1: Admin API Route Missing Session Verification
**What goes wrong:** Admin cancel route skips `auth.api.getSession()` check, allowing any authenticated user (including patients) to cancel any booking by _id.
**Why it happens:** Copying from the token-based patient cancel route without changing the auth mechanism.
**How to avoid:** Every admin API route must start with: `const session = await auth.api.getSession({ headers: request.headers }); if (!session || session.user.role !== "admin") return 401`.
**Warning signs:** Route body only validates `bookingId` but not session role.

### Pitfall 2: Fetching Booking History With Wrong GROQ Perspective
**What goes wrong:** Booking history query runs against the CDN (cached) client and misses recent cancellations/bookings.
**Why it happens:** Using the public Sanity client instead of `getWriteClient()` for admin queries.
**How to avoid:** All admin data fetches use `getWriteClient()` (which has `useCdn: false`). Admin data must be real-time accurate.
**Warning signs:** Patient history shows stale data immediately after a cancellation.

### Pitfall 3: 24h Rule Applies to Admin Too (Locked Decision)
**What goes wrong:** Admin cancel route omits the 24h check (thinking admin bypass is allowed).
**Why it happens:** Assumption that admin override makes sense.
**How to avoid:** CONTEXT.md explicitly states: "Same 24-hour cancellation rule as patients — admin cannot cancel within 24h of appointment." The `isWithin24Hours` helper already exists in `booking-cancel/route.ts` — copy it.
**Warning signs:** Admin cancel succeeds for appointments less than 24h away.

### Pitfall 4: Tailwind CSS v4 Class Conflicts in Dark Admin Area
**What goes wrong:** Using Tailwind classes in the admin area that assume the light design system (e.g., `bg-white`, `text-gray-900`) produce jarring visuals in the dark `#0f172a` background.
**Why it happens:** Booking flow components (Tailwind) and admin UI (inline styles) have different base assumptions.
**How to avoid:** Admin dark theme is consistently implemented with inline styles in `AdminLogin.tsx` and `AdminLayout.tsx`. New admin components should continue with inline styles for structural/background colors, or use Tailwind with dark-specific values (`bg-slate-800`, `text-slate-100`) to match the existing dark palette.
**Warning signs:** White backgrounds or light text appearing in admin dashboard sections.

### Pitfall 5: Week View Timezone Mismatch
**What goes wrong:** Appointment blocks render on wrong day/time because of timezone handling in date math.
**Why it happens:** Using `new Date(slotDate)` without UTC-anchoring shifts the date by local timezone offset.
**How to avoid:** Follow the existing pattern in `slots.ts`: use `Date.UTC(year, month-1, day)` for date-only values, and `"HH:MM"` strings for times without Date objects. Never construct `new Date(slotDate + "T" + slotTime)` without explicitly handling timezone.
**Warning signs:** Appointments appear on a different day column than expected, or off by ±1 day.

### Pitfall 6: Three-Dot Menu Focus Trap or Z-Index Issues
**What goes wrong:** The three-dot dropdown inside the modal is clipped by the modal's `overflow: hidden` or sits behind other elements.
**Why it happens:** Absolute-positioned dropdowns require the parent chain to not have `overflow: hidden`.
**How to avoid:** Use `position: fixed` for the dropdown content (not `absolute`), or ensure the modal container uses `overflow: visible`. Keep z-index layering: backdrop (z-40), modal (z-50), dropdown (z-60).
**Warning signs:** Dropdown appears to disappear or is partially clipped.

---

## Code Examples

### Admin API Route Auth Pattern

```typescript
// Source: established pattern from /admin/page.tsx (Phase 10) adapted for API routes
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  // Step 1: Verify admin session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
  }
  // ... rest of handler
}
```

### GROQ: Today's Confirmed Bookings in Order

```typescript
// Source: pattern from booking-cancel/route.ts + booking-reschedule/route.ts
const bookings = await getWriteClient().fetch(
  `*[_type == "booking" && slotDate == $date && status in ["confirmed"]] | order(slotTime asc) {
    _id, patientName, patientEmail, patientPhone, reservationNumber,
    service->{name, appointmentDuration}, slotDate, slotTime, status
  }`,
  { date: todayStr },
);
```

### GROQ: Bookings in Date Range (Month/Week Calendar Dots)

```typescript
// Source: pattern established by booking queries in this project
const bookingsInRange = await getWriteClient().fetch(
  `*[_type == "booking" && slotDate >= $startDate && slotDate <= $endDate && status == "confirmed"] {
    _id, patientName, service->{name}, slotDate, slotTime
  }`,
  { startDate: "2026-02-01", endDate: "2026-02-28" },
);
// Group by slotDate client-side: Map<string, Booking[]>
```

### Admin Cancellation: Fetch Booking by _id (Not Token)

```typescript
// Source: established pattern from booking-cancel/route.ts (modified for admin)
const booking = await getWriteClient().fetch(
  `*[_type == "booking" && _id == $bookingId][0]{
    _id, patientName, patientEmail, patientPhone, reservationNumber,
    service->{name}, slotDate, slotTime, status
  }`,
  { bookingId: parsed.data.bookingId },
);
```

### isWithin24Hours Helper (Copy from booking-cancel/route.ts)

```typescript
// Source: src/app/api/booking-cancel/route.ts
function isWithin24Hours(slotDate: string, slotTime: string): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - Date.now()) / (1000 * 60 * 60) < 24;
}
```

### Admin Cancellation Email: new function signature

```typescript
// To add to: src/lib/booking-email.ts
export function buildAdminCancellationEmail(params: {
  patientName: string;
  serviceName: string;
  reservationNumber: string;
  date: string;    // Pre-formatted Hungarian date string
  time: string;    // "09:20"
  reason?: string; // Optional — included if provided
  clinicPhone: string;
  clinicAddress: string;
  newBookingUrl: string;
}): string { /* ... */ }
// Subject: "Időpont lemondva a rendelő által — Mórocz Medical"
// Header: "A rendelő lemondta az Ön időpontját"
```

### Month Calendar: Group Bookings by Date

```typescript
// Derived from Step2DateTime.tsx patterns
function groupBookingsByDate(bookings: { slotDate: string }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const b of bookings) {
    map.set(b.slotDate, (map.get(b.slotDate) ?? 0) + 1);
  }
  return map;
}
// Render dot in calendar cell if map.has(dateStr) && map.get(dateStr)! > 0
```

### Week View: Time-to-Position Math

```typescript
// Derive pixel/percent position for appointment blocks
const ADMIN_DAY_START_HOUR = 7;   // 07:00
const ADMIN_DAY_END_HOUR = 18;    // 18:00
const TOTAL_MINUTES = (ADMIN_DAY_END_HOUR - ADMIN_DAY_START_HOUR) * 60;

function timeToTopPercent(time: string): number {
  const [h, m] = time.split(":").map(Number);
  const minutesFromStart = (h ?? 0) * 60 + (m ?? 0) - ADMIN_DAY_START_HOUR * 60;
  return (minutesFromStart / TOTAL_MINUTES) * 100;
}

function durationToHeightPercent(durationMinutes: number): number {
  return (durationMinutes / TOTAL_MINUTES) * 100;
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| External calendar library (react-big-calendar) | Custom Tailwind grid | Project already built calendar in Step2DateTime.tsx |
| Separate cancel/reschedule management URLs | Single `/foglalas/:token` (Phase 12) | Admin uses _id-based cancel, not token |
| Resend for email | Gmail API (googleapis) | Migrated in Phase 12; `email.ts` is the source of truth |
| Auth.js v5 | Better Auth 1.x | Auth.js v5 abandoned (per STATE.md) |

---

## Open Questions

1. **Week view: should cancelled bookings appear as greyed-out blocks?**
   - What we know: CONTEXT.md says "Status badges: Confirmed / Cancelled only" for the day list
   - What's unclear: Whether week view should show cancelled appointments visually
   - Recommendation: Show only confirmed bookings in week view (less clutter). Day panel already handles the status badge display.

2. **Booking history in patient modal: what's the query scope?**
   - What we know: "patient's booking history (past and future appointments at the practice)"
   - What's unclear: Query by `patientEmail` (most reliable) vs. `userId` (may be null for some bookings)
   - Recommendation: Query by `patientEmail` — it is always populated (required field in bookingType.ts). Include all statuses, sort by `slotDate desc`.

3. **Admin dashboard data refresh strategy?**
   - What we know: Vercel serverless; no WebSockets
   - What's unclear: How stale can the appointment data be?
   - Recommendation: Fetch on mount + refetch on each day selection click. No polling needed for single-doctor low-volume practice. After admin cancel, trigger a local state update (optimistic) + background refetch.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `src/app/api/booking-cancel/route.ts` — admin cancel API pattern
- Existing codebase — `src/components/booking/Step2DateTime.tsx` — calendar grid implementation
- Existing codebase — `src/lib/booking-email.ts` — email template patterns
- Existing codebase — `src/app/admin/page.tsx` — session verification pattern
- Existing codebase — `src/sanity/schemaTypes/bookingType.ts` — booking document structure

### Secondary (MEDIUM confidence)
- Radix UI docs (https://www.radix-ui.com/primitives/docs/components/dialog) — DropdownMenu + Dialog interaction patterns (not needed; existing pattern is sufficient)
- builder.io "React calendar components 2025" — confirmed react-big-calendar exists but is unnecessary given existing custom implementation

### Tertiary (LOW confidence)
- WebSearch results for "admin cancel booking email pattern" — general patterns confirmed, nothing project-specific

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all existing project packages
- Architecture: HIGH — direct extension of established patterns from Phases 10–12
- GROQ queries: HIGH — follows exact patterns from existing API routes
- Week view time math: MEDIUM — custom CSS grid layout is straightforward but untested in this project; positioning logic needs careful implementation
- Email template: HIGH — direct extension of `buildCancellationEmail` with new copy

**Research date:** 2026-02-23
**Valid until:** Stable — no fast-moving dependencies; valid until project architecture changes
