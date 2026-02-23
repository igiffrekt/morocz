# Phase 12: Patient Account - Research

**Researched:** 2026-02-22
**Domain:** Token-based booking management, atomic slot swap, Next.js dynamic routes, Resend email, Vercel Cron
**Confidence:** HIGH — all findings are grounded in the existing Phase 11 codebase and verified project patterns

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope change from original roadmap:** No dedicated patient account page (/fiokom). Instead, patients manage their bookings via token-based links in the confirmation email. This phase delivers:

1. A booking management page at `/foglalas/:token` accessible via unique email links (no login required)
2. Cancel an appointment (24h window enforced) from the management page
3. Reschedule an appointment (24h window enforced) with atomic slot swap
4. Cancellation confirmation email (Hungarian)
5. Reschedule-specific email showing old → new time (Hungarian)
6. Appointment reminder email sent 24h before (Hungarian, no action links)
7. Update Phase 11's confirmation email to include cancel/reschedule links pointing to `/foglalas/:token`

**Removed from original scope:** ACCT-01 (patient account page at /fiokom) — patients do not get a dedicated account page.

**URL structure:** `/foglalas/:token` where token is a unique, hard-to-guess value; no authentication required.

**Cancellation flow:** confirmation dialog → explicit confirm → success message + "Új időpont foglalása" button → slot immediately available → cancellation email.

**24-hour cutoff:** Both cancel AND reschedule are blocked within 24 hours of the appointment. Hungarian error + clinic phone number for late cancellations.

**Reschedule experience:** Inline date/time picker embedded in the management page (no redirect). Service stays same, patient picks new date/time. Atomic swap — old slot released and new slot booked in one operation. On slot conflict, old appointment stays unchanged.

**Email updates:**
- Confirmation email (Phase 11 existing): update cancel/reschedule links to point to `/foglalas/:token`
- Reminder email (NEW): sent exactly 24h before, just appointment details, NO cancel/reschedule links
- Cancellation email (NEW): Hungarian confirmation of cancellation
- Reschedule email (NEW): shows old time → new time

### Claude's Discretion

- Token generation algorithm (UUID, nanoid, etc.)
- Exact card styling and spacing on the management page
- Reminder email scheduling mechanism (cron, scheduled function, etc.)
- Inline date/time picker component choice (reuse from Phase 11 booking wizard or new)
- Exact Hungarian wording for all messages (following existing patterns from Phase 11 emails)
- How to handle edge case: patient opens management link after appointment has already passed

### Deferred Ideas (OUT OF SCOPE)

- Patient account page (/fiokom) showing all past and upcoming appointments — deliberately excluded
- Add cancel/reschedule links to the reminder email (excluded because 24h cutoff aligns with reminder timing)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-01 | Patient can view upcoming appointments on /fiokom | SCOPE CHANGED: replaced by `/foglalas/:token` management page. Token lookup replaces session-based auth. |
| ACCT-02 | Patient can cancel an appointment (24h cancellation window enforced) | Cancel API route patches booking status to "cancelled", patches slotLock to "available", enforces 24h check via datetime comparison. |
| ACCT-03 | Patient can reschedule an appointment (cancel old + book new atomically) | Atomic swap via two-step Sanity write: (1) patch new slotLock to "booked" with ifRevisionId, (2) patch old slotLock to "available" + create new booking document — all in sequence. On new-slot conflict, no changes to old booking. |
| NOTIF-03 | Patient receives cancellation confirmation email | Resend fire-and-forget after successful cancellation. Follows existing buildConfirmationEmail pattern in src/lib/booking-email.ts. |
</phase_requirements>

---

## Summary

Phase 12 replaces the originally planned `/fiokom` patient account page with a simpler, more robust token-based approach: every booking gets a unique management URL that the patient receives in their confirmation email. The page at `/foglalas/:token` is a self-contained card (no site header) that lets the patient cancel or reschedule without logging in — the token is the credential.

The critical complexity in this phase is the atomic reschedule swap. The system must book the new slot (using the same ifRevisionId pattern from Phase 11) before releasing the old slot, so the patient is never left with zero bookings. If the new slot is already taken, the old booking must remain exactly as-is. This requires careful ordering of Sanity write operations.

The reminder email is technically straightforward (Resend + Vercel Cron), but scheduling introduces a new infrastructure concern: idempotency. The cron job may run multiple times; the booking document needs a `reminderSent` flag to prevent duplicate sends. The STATE.md already notes this pattern and defers it to Phase 14, but Phase 12 must add the `managementToken` field to the booking schema and update the confirmation email, which sets up Phase 14.

**Primary recommendation:** Build Phase 12 in three sequential plans — (1) schema + token infrastructure, (2) management page UI + cancel API, (3) reschedule flow + all emails.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 15 | ^15.2.0 | App Router dynamic route `/foglalas/[token]/page.tsx` | Already in use; dynamic routes are native |
| Sanity write client | existing | Patch booking/slotLock documents | Already in `src/lib/sanity-write-client.ts`; lazy singleton pattern |
| Resend | ^6.9.2 | Transactional emails (cancel, reschedule, reminder) | Already in use in Phase 11; same fire-and-forget pattern |
| Zod | ^3.25.76 | API request validation | Already in use; same pattern as booking API |
| Motion (motion/react) | ^12.34.2 | AnimatePresence for inline reschedule picker (if reusing booking wizard components) | Already in use; not required for simple page |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto.randomUUID()` | Node built-in | Token generation | Simplest option, no new dependency, 36-char UUID is hard to guess |
| `nanoid` | (not installed) | Token generation | Alternative — shorter tokens, URL-safe alphabet. Skip unless UUID length is a UX concern. |
| Vercel Cron | Platform feature | Reminder email scheduling | Free tier: 1 job/day max. Already planned in STATE.md for Phase 14. Phase 12 only needs the `reminderSent` flag on the booking schema — cron implementation is Phase 14. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.randomUUID()` | `nanoid` | nanoid tokens are shorter (21 chars) and URL-safe by default. Not installed. UUID is sufficient and avoids a new dependency. |
| Token in booking schema | Separate token document | Separate document adds query complexity with no benefit. Token field on booking is simpler. |
| Atomic swap via sequential writes | Sanity transaction API | Sanity does have a transaction API but the project already uses the patch chain pattern. Sequential ifRevisionId on new slot + unconditional patch on old slot achieves atomicity with the same tooling. |

**Installation:** No new packages required. All needed libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── foglalas/
│   │   └── [token]/
│   │       └── page.tsx          # Server Component: token lookup, renders management card
│   └── api/
│       ├── booking/
│       │   └── route.ts          # EXISTING — needs update to generate token + update email URL
│       ├── booking-cancel/
│       │   └── route.ts          # NEW — POST /api/booking-cancel {token}
│       └── booking-reschedule/
│           └── route.ts          # NEW — POST /api/booking-reschedule {token, newDate, newTime}
├── components/
│   └── management/
│       ├── BookingManagementCard.tsx   # "use client" — cancel/reschedule UI
│       ├── CancelDialog.tsx            # Confirmation dialog (inline or modal)
│       └── ReschedulePanel.tsx         # Inline date/time picker (reuses Step2DateTime logic)
└── lib/
    ├── booking-email.ts          # EXISTING — add buildCancellationEmail, buildRescheduleEmail, buildReminderEmail
    └── sanity-write-client.ts    # EXISTING — no changes needed
```

### Pattern 1: Token Lookup Server Component

**What:** `app/foglalas/[token]/page.tsx` is a Server Component that queries Sanity for the booking by `managementToken`. Renders the management card or an error state.
**When to use:** Any data-fetching page that doesn't need client interactivity at the top level.

```typescript
// src/app/foglalas/[token]/page.tsx
import { getWriteClient } from "@/lib/sanity-write-client";
import { BookingManagementCard } from "@/components/management/BookingManagementCard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic"; // token pages must never be cached

interface Props {
  params: Promise<{ token: string }>;
}

export default async function BookingManagementPage({ params }: Props) {
  const { token } = await params;

  const booking = await getWriteClient().fetch(
    `*[_type == "booking" && managementToken == $token && status != "cancelled"][0]{
      _id, patientName, service->{name}, slotDate, slotTime, status
    }`,
    { token },
  );

  if (!booking) {
    // Show friendly error — do not use Next.js notFound() (returns 404 page, not Hungarian message)
    return <TokenErrorCard />;
  }

  return <BookingManagementCard booking={booking} />;
}
```

**Key decisions:**
- `force-dynamic` is mandatory — token lookup must always be fresh (same pattern as `/api/booking/route.ts`)
- Query by `managementToken` field, not by `_id` — the token IS the access credential
- Filter out cancelled bookings at query level (already cancelled = token is "expired")
- Do NOT use `notFound()` — that returns a generic 404. Show a Hungarian "Érvénytelen vagy lejárt hivatkozás" card with a link to `/idopontfoglalas`

### Pattern 2: Atomic Reschedule Swap

**What:** Two-step Sanity write sequence that ensures the patient never loses their booking during a reschedule.
**When to use:** Whenever a reschedule atomicity guarantee is required.

```typescript
// POST /api/booking-reschedule
// Step 1: Lock the new slot (same ifRevisionId pattern as booking creation)
try {
  await getWriteClient()
    .patch(newSlotLockId)
    .ifRevisionId(newSlotLock._rev)
    .set({ status: "booked", bookingRef: { _type: "reference", _ref: booking._id } })
    .commit();
} catch {
  // New slot taken — old booking untouched, return 409
  return Response.json({ error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." }, { status: 409 });
}

// Step 2: Only if step 1 succeeded — release the old slot and update booking
await getWriteClient()
  .patch(oldSlotLockId)
  .set({ status: "available" })
  .unset(["bookingRef"])
  .commit();

await getWriteClient()
  .patch(booking._id)
  .set({ slotDate: newDate, slotTime: newTime, status: "confirmed" })
  .commit();
```

**Key insight:** If Step 1 fails (race condition on new slot), return error immediately — the old slot remains booked, old booking unchanged. If Step 1 succeeds but Step 2 fails (very rare), the new slotLock points to the booking but the booking still has the old date — this is acceptable as a degraded state; admin can resolve manually.

### Pattern 3: 24-Hour Window Enforcement (Server-Side)

**What:** Compare appointment datetime to `Date.now()` server-side in every cancel/reschedule API route.
**When to use:** Must be server-side — client-side check is trivially bypassable.

```typescript
function isWithin24Hours(slotDate: string, slotTime: string): boolean {
  const [h, m] = slotTime.split(":").map(Number);
  const apptDateTime = new Date(`${slotDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const now = new Date();
  const hoursUntil = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntil < 24;
}
```

**Important:** The project uses HH:MM local time strings (not ISO datetimes). This is a known decision from STATE.md. The comparison above must construct the full datetime for comparison. Use the server's local time (Vercel's UTC) — this means the 24h boundary is always computed against UTC midnight, which is acceptable for a Hungarian clinic.

### Pattern 4: Token Generation

**What:** Add `managementToken` field to the booking Sanity schema. Generate on booking creation. Use `crypto.randomUUID()`.
**When to use:** Every new booking document.

```typescript
// In POST /api/booking/route.ts — on booking creation
const managementToken = crypto.randomUUID(); // 36 chars, UUID v4, URL-safe

const booking = await getWriteClient().create({
  _type: "booking",
  // ... existing fields ...
  managementToken,
  createdAt: new Date().toISOString(),
});

// URL sent in email
const manageUrl = `${appUrl}/foglalas/${managementToken}`;
```

### Pattern 5: Email Pattern (Fire-and-Forget)

**What:** Same pattern as Phase 11 confirmation email — async function with try/catch, called with `void`, never blocks the API response.

```typescript
// In /api/booking-cancel/route.ts — after successful cancellation
if (process.env.RESEND_API_KEY) {
  void sendCancellationEmail({ patientEmail, patientName, serviceName, date, time });
}
return Response.json({ success: true }, { status: 200 });
```

### Anti-Patterns to Avoid

- **Using `notFound()` on invalid token:** Returns a generic English 404. Show a custom Hungarian error card instead.
- **Client-side 24h check only:** Trivially bypassable. Always enforce server-side in the API route.
- **Blocking API response on email send:** Phase 11 pattern is fire-and-forget. Never `await` the email send before responding.
- **Releasing old slot before locking new slot:** This creates a window where patient has zero bookings. Always lock new first, release old second.
- **Caching the management page:** `force-dynamic` is mandatory. A cached page could show stale status.
- **Using `/fiokom` routes:** This path was removed from scope. Any code referencing `/fiokom` in the existing confirmation email must be updated to use `/foglalas/:token`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token uniqueness | Custom base-62 encoder | `crypto.randomUUID()` | UUID v4 has 2^122 bits of randomness — effectively unguessable; built-in to Node.js |
| Slot conflict race condition | Query-then-write | `ifRevisionId` patch chain (existing pattern) | Same as Phase 11 booking creation — already proven to work |
| Email HTML | Inline string concatenation in route | `buildXxxEmail()` helpers in `src/lib/booking-email.ts` | Phase 11 already established this pattern; keep all email HTML in one file |
| Date formatting | Manual string construction | `toLocaleDateString("hu-HU", {...})` | Already used in `BookingWizard.tsx` and `booking/route.ts` — consistent Hungarian format |
| Reminder scheduling | Manual timer or polling | Vercel Cron (Phase 14) | STATE.md already identifies this as the mechanism; Phase 12 only needs `reminderSent` flag on schema |

**Key insight:** Every mechanism needed for Phase 12 already exists in the codebase. The work is assembling patterns, not inventing them.

---

## Common Pitfalls

### Pitfall 1: Existing Confirmation Email Has Wrong Cancel/Reschedule URLs

**What goes wrong:** `src/lib/booking-email.ts` currently builds cancel/reschedule URLs pointing to `/fiokom?cancel=` and `/fiokom?reschedule=`. These are not functional (there is no `/fiokom` page) and must be updated to `/foglalas/:token`.
**Why it happens:** The confirmation email was built in Phase 11 before the scope change documented in CONTEXT.md.
**How to avoid:** Phase 12 Plan 1 must: (1) add `managementToken` field to booking schema, (2) update `POST /api/booking/route.ts` to generate the token and pass `manageUrl` to `buildConfirmationEmail`, (3) update `buildConfirmationEmail` to accept a single `manageUrl` instead of separate `cancelUrl`/`rescheduleUrl`.
**Warning signs:** Building the management page first without fixing the email means existing bookings will have broken links.

### Pitfall 2: Past Appointments on Management Page

**What goes wrong:** Patient bookmarks their management link and opens it weeks after the appointment. The page should not show cancel/reschedule buttons for past appointments.
**Why it happens:** The token never expires — it's a permanent identifier.
**How to avoid:** In the management page Server Component, check if `slotDate < today` and show a "Ez az időpont már lezajlott" message. Also show this for status="cancelled" bookings. This is listed as Claude's Discretion in CONTEXT.md.
**Recommendation:** Show a card with appointment summary and a "Új időpont foglalása" link, but no action buttons.

### Pitfall 3: Reschedule Date/Time Picker Needs Schedule Data

**What goes wrong:** The inline reschedule picker needs `weeklySchedule` and `blockedDates` from Sanity to know which days/slots are available. If this is fetched client-side on demand, there's a loading delay and potential failure.
**Why it happens:** The `Step2DateTime` component in Phase 11 receives `scheduleData` as a prop from the Server Component page. The management page must do the same.
**How to avoid:** Fetch `weeklySchedule` and `blockedDates` in the management page Server Component alongside the booking lookup. Pass as props to `BookingManagementCard`. The reschedule panel (which reuses Step2DateTime logic) receives it as a prop.

### Pitfall 4: Slot Conflict on Reschedule Leaves State Ambiguous

**What goes wrong:** The atomic swap succeeds in locking the new slot (Step 1) but fails to update the booking document or release the old slot (Step 2). Now the new `slotLock` has `bookingRef` pointing to the booking, but the booking still has the old date/time.
**Why it happens:** Network failure or Sanity timeout between Step 1 and Step 2.
**How to avoid:** This is an accepted degraded state. The old slotLock still has status "booked" (pointing to the booking), so the old slot is not double-booked. The admin can resolve manually. Log the error clearly: `[api/booking-reschedule] Partial reschedule: new slot locked but booking not updated. BookingId: X`.

### Pitfall 5: `force-dynamic` Required on Management Page

**What goes wrong:** Without `export const dynamic = "force-dynamic"`, Next.js may cache the management page. A patient who cancelled and then visits their link could see a cached version showing the booking as still active.
**Why it happens:** Next.js App Router aggressively caches Server Component pages.
**How to avoid:** Add `export const dynamic = "force-dynamic"` to `app/foglalas/[token]/page.tsx`. Same pattern as all API routes in this project.

### Pitfall 6: Token Field Not in GROQ Projection

**What goes wrong:** The `managementToken` field is added to the Sanity schema but queries that project booking data don't include it — so the email-building code can't access it.
**Why it happens:** Forgetting to add `managementToken` to the GROQ projection in `POST /api/booking/route.ts` after the `create()` call.
**How to avoid:** The `getWriteClient().create()` call returns the full created document including all fields. Access `booking.managementToken` directly from the return value — no re-fetch needed.

### Pitfall 7: 24h Check Must Use Full Datetime, Not Just Date

**What goes wrong:** Comparing only the date (`slotDate`) to today ignores the time component. A patient could cancel a 9:00 AM appointment at 9:30 AM the previous day (which is within 24h) if only the date is checked.
**Why it happens:** HH:MM time strings (project convention) require explicit datetime construction.
**How to avoid:** Always construct a full `Date` object: `new Date(`${slotDate}T${slotTime}:00`)` before comparing to `Date.now()`. See the helper function in Architecture Patterns above.

---

## Code Examples

Verified patterns from the existing codebase:

### Existing Booking Creation (reference for token addition)
```typescript
// src/app/api/booking/route.ts — Step 7 (existing)
const reservationNumber = generateReservationNumber();
const booking = await getWriteClient().create({
  _type: "booking",
  reservationNumber,
  service: { _type: "reference", _ref: serviceId },
  slotDate,
  slotTime,
  patientName,
  patientEmail,
  patientPhone,
  userId: session.user.id,
  status: "confirmed",
  createdAt: new Date().toISOString(),
  // ADD: managementToken: crypto.randomUUID()
});
```

### Existing SlotLock ifRevisionId Pattern (reference for reschedule)
```typescript
// src/app/api/booking/route.ts — Step 5 (existing)
await getWriteClient()
  .patch(slotLock._id)
  .ifRevisionId(slotLock._rev)
  .set({ status: "booked" })
  .commit();
```

### Existing Email Builder Structure (reference for new email builders)
```typescript
// src/lib/booking-email.ts — existing signature
export function buildConfirmationEmail(params: {
  patientName: string;
  serviceName: string;
  date: string;       // Pre-formatted Hungarian date string
  time: string;       // "09:20"
  cancelUrl: string;  // → change to manageUrl: string
  rescheduleUrl: string; // → remove, manageUrl covers both
  clinicPhone: string;
  clinicAddress: string;
}): string { ... }

// NEW builders to add in same file:
export function buildCancellationEmail(params: {
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
  clinicPhone: string;
  newBookingUrl: string; // /idopontfoglalas
}): string { ... }

export function buildRescheduleEmail(params: {
  patientName: string;
  serviceName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  manageUrl: string;    // /foglalas/:token
  clinicPhone: string;
}): string { ... }

export function buildReminderEmail(params: {
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
  clinicPhone: string;
  clinicAddress: string;
  // NOTE: No manageUrl — 24h window has passed by reminder time
}): string { ... }
```

### Hungarian Date Formatting (existing pattern in project)
```typescript
// Used in BookingWizard.tsx and api/booking/route.ts
const formattedDate = new Date(slotDate).toLocaleDateString("hu-HU", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});
```

### Existing GROQ Pattern for Write Client Fetch
```typescript
// src/app/api/booking/route.ts — existing pattern
const currentBookings = await getWriteClient().fetch<Array<{ _id: string; slotTime: string }>>(
  `*[_type == "booking" && slotDate == $date && status == "confirmed"]{_id, slotTime}`,
  { date: slotDate },
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `/fiokom?cancel=bookingId` URLs in email | `/foglalas/:token` token URLs | Phase 12 scope change (CONTEXT.md 2026-02-22) | Management page is now public (no auth); token is the credential |
| ACCT-01 logged-in patient account | Token-based stateless management | Phase 12 scope change | Simpler for patients, no login friction |
| Phase 14 owns reminder email | Phase 14 owns cron; Phase 12 adds `reminderSent` flag + email builder | Coordinated split | Phase 12 prepares infrastructure; Phase 14 wires the cron job |

**Deprecated/outdated:**
- `/fiokom` route: Never built, now officially out of scope. The ROADMAP.md still refers to it in Phase 12's description — the planner should note this is superseded by CONTEXT.md.
- `cancelUrl`/`rescheduleUrl` separate parameters in `buildConfirmationEmail`: Being replaced by single `manageUrl` pointing to `/foglalas/:token`.

---

## Schema Changes Required

### Booking Schema Addition

Add to `src/sanity/schemaTypes/bookingType.ts`:

```typescript
defineField({
  name: "managementToken",
  title: "Kezelési token",
  type: "string",
  description: "Egyedi, nehezen kitalálható azonosító az időpont kezelési linkjéhez (/foglalas/:token)",
  readOnly: true,
}),
defineField({
  name: "reminderSent",
  title: "Emlékeztető elküldve",
  type: "boolean",
  description: "Igaz, ha a 24 órás emlékeztető e-mail már ki lett küldve (Phase 14 használja)",
  initialValue: false,
}),
```

**Why `reminderSent` in Phase 12:** Phase 14 (cron job) needs this flag to prevent duplicate reminder emails. The flag must be on the schema before Phase 14, and it costs nothing to add it now.

---

## Open Questions

1. **Should cancelled bookings keep their `managementToken` accessible?**
   - What we know: The management page query filters out `status != "cancelled"` bookings.
   - What's unclear: If a patient follows a cancelled booking link, should they see "this was cancelled" or "invalid link"?
   - Recommendation: Show a specific "Ez az időpont már le lett mondva" state (not a generic invalid-token error). Query without the status filter, then branch on status. This is friendlier UX.

2. **Reminder email scheduling: Phase 12 or Phase 14?**
   - What we know: CONTEXT.md lists "reminder email scheduling mechanism" as Claude's Discretion. STATE.md says "Vercel Cron for reminder emails; Inngest documented as upgrade path." ROADMAP.md gives NOTIF-02 to Phase 14.
   - What's unclear: Should Phase 12 implement just the email builder and schema flag, leaving the cron wiring to Phase 14? Or should Phase 12 complete the full reminder pipeline?
   - Recommendation: Phase 12 adds `reminderSent` schema field and `buildReminderEmail()` builder. Phase 14 implements the cron endpoint and wires the actual sending. This matches the ROADMAP.md requirement assignment and keeps Phase 12 focused.

3. **Token for previously-created bookings (Phase 11 bookings with no token)?**
   - What we know: Phase 11 bookings were created without a `managementToken` field. They already have confirmation emails sent (if any were created in testing/UAT) with the old `/fiokom?cancel=` URLs.
   - What's unclear: How to handle these orphaned bookings.
   - Recommendation: Phase 12 is a fresh forward-only implementation. Old test bookings can be manually deleted or ignored. No migration script needed — this is not a production system yet.

---

## Sources

### Primary (HIGH confidence)

- Existing codebase: `src/app/api/booking/route.ts` — booking creation pattern, ifRevisionId, email fire-and-forget
- Existing codebase: `src/lib/booking-email.ts` — email builder pattern, design system colors
- Existing codebase: `src/sanity/schemaTypes/bookingType.ts` — current booking schema fields
- Existing codebase: `src/sanity/schemaTypes/slotLockType.ts` — slotLock schema and status values
- Existing codebase: `src/lib/sanity-write-client.ts` — write client lazy singleton pattern
- Existing codebase: `src/components/booking/Step2DateTime.tsx` — date/time picker (reuse candidate)
- Existing codebase: `middleware.ts` — `/foglalas` needs no middleware protection (token-based, public)
- `.planning/STATE.md` — `managementToken` decision, Vercel Cron, lazy singleton pattern
- `.planning/phases/12-patient-account/12-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Next.js App Router docs: `params` in async Server Components requires `await params` (Next.js 15 change)
- Node.js `crypto.randomUUID()`: available in Node.js 14.17+; no import needed in Next.js 15 environment

### Tertiary (LOW confidence)

- Sanity write transaction API: Not verified for this project. The existing `ifRevisionId` patch chain is sufficient for atomic reschedule — no need to investigate Sanity transactions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, patterns already in use
- Architecture: HIGH — directly modeled on Phase 11 patterns in the codebase
- Pitfalls: HIGH — Pitfall 1 (wrong email URLs) is confirmed by reading `booking-email.ts`; others are derived from code analysis
- Schema changes: HIGH — confirmed by reading `bookingType.ts`

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable stack; 30-day validity)
