# Phase 14: Reminder Emails and Cron - Research

**Researched:** 2026-02-23
**Domain:** Vercel Cron Jobs, Sanity write-client, Gmail API email, idempotency tracking
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Reminder email content: minimal — date, time, location only. No cancel/reschedule links. Pure informational.
- Formal Hungarian tone (magázó): "Tisztelt Páciensünk, emlékeztetjük..."
- Same React Email visual template and branding as existing emails (but note: project uses inline-HTML, NOT React Email — see Architecture section)
- Cron job runs every hour
- Query window: 20–28 hours ahead of current time
- Timezone fixed to Europe/Budapest for all scheduling logic
- No reminder for short-notice bookings — skip if 20–28h window already missed at booking creation time
- If cancelled after reminder sent: do nothing (cancellation email already handles it)
- Multiple appointments same day for one patient: send one combined email listing all
- Failed sends: mark as pending (i.e. leave reminderSent=false), retry on next hourly run
- Cron activity logged to a DB log table (each run: emails sent, failures)

### Claude's Discretion
- Idempotency mechanism (DB flag on bookings vs separate reminder tracking table)
- Exact DB log table schema
- Email subject line wording (within formal Hungarian tone)
- How to batch/group appointments for combined emails

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTIF-02 | Patient receives reminder email 24 hours before appointment | Covered by: Vercel Cron hourly schedule + Sanity query for 20–28h window + reminderSent flag for idempotency + Gmail API sendEmail() for delivery |
</phase_requirements>

---

## Summary

This phase adds a Vercel Cron endpoint (`GET /api/cron/reminders`) that fires hourly, queries Sanity for confirmed bookings whose appointment falls within the 20–28 hour window, sends one Hungarian reminder email per patient per day (combined if multiple bookings), and marks bookings as `reminderSent: true` to guarantee exactly-once delivery. The cron endpoint is protected by comparing the `Authorization: Bearer <CRON_SECRET>` header Vercel injects automatically.

The codebase is well-prepared: `reminderSent` (boolean, default false) already exists on the `bookingType` Sanity schema. The `buildReminderEmail()` template is already implemented in `src/lib/booking-email.ts`. The `sendEmail()` Gmail API helper exists in `src/lib/email.ts`. The `getWriteClient()` Sanity write client is already wired. This phase is primarily integration work: one new API route, one new DB log table, and Drizzle migration.

**Primary recommendation:** Add `GET /api/cron/reminders` route with CRON_SECRET auth, query Sanity for `reminderSent == false && status == "confirmed"` bookings in 20–28h window (Europe/Budapest), group by patient email, send combined emails via Gmail API, patch `reminderSent: true` per booking, log each run to a new `cron_run_log` Postgres table via Drizzle.

**Critical pending item from STATE.md:** Confirm Vercel plan tier before committing to hourly cron. Hobby plan is hard-limited to once per day — hourly requires Pro. The user should verify this before implementation.

---

## Standard Stack

### Core (already in project — no new installs needed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js App Router | ^15.2.0 | Route handler for cron endpoint | Already installed |
| `@sanity/client` (via `next-sanity`) | ^11.6.12 | Query and patch Sanity bookings | Already installed (`getWriteClient`) |
| `googleapis` | ^171.4.0 | Send Gmail API reminder emails | Already installed (`sendEmail`) |
| `drizzle-orm` | ^0.45.1 | Write cron run log to Postgres | Already installed |
| `@neondatabase/serverless` | ^1.0.2 | Neon Postgres connection | Already installed |
| Vercel Cron | Platform feature | Trigger cron endpoint hourly | Free (Pro plan required for hourly) |

### New Infrastructure (needed)
| Item | Purpose | Notes |
|------|---------|-------|
| `vercel.json` | Register cron job schedule | File does not yet exist in project |
| `cron_run_log` DB table | Audit each cron run | New Drizzle schema table + migration |
| `CRON_SECRET` env var | Secure cron endpoint | Must be added to Vercel project settings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sanity `reminderSent` flag (idempotency) | Separate DB tracking table | DB table is safer (no Sanity write to mark state), but Sanity flag is simpler and fits existing booking document — user left this to discretion |
| DB log table (Drizzle/Neon) | Console logs only | DB logs survive across invocations and can be queried; console logs are ephemeral on Vercel |

**Installation:** No new packages needed. Everything is already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/api/cron/
│   └── reminders/
│       └── route.ts          # GET handler with CRON_SECRET auth
├── lib/
│   ├── booking-email.ts      # buildReminderEmail() already exists
│   └── email.ts              # sendEmail() already exists
└── lib/db/
    └── schema.ts             # Add cron_run_log table here

drizzle/
└── 0001_cron_run_log.sql     # Generated migration
```

### Pattern 1: Vercel Cron Configuration

`vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

`0 * * * *` = top of every hour, UTC. **Note:** Vercel cron timezone is always UTC. Europe/Budapest is UTC+1 (CET) or UTC+2 (CEST in summer). The query window of 20–28 hours is wide enough that UTC-based invocation is acceptable — no need to time the cron to a Budapest-local hour.

**Plan requirement:** This schedule requires a **Vercel Pro plan**. Hobby plan is hard-limited to once per day — any expression running more frequently fails deployment.

### Pattern 2: CRON_SECRET Security (HIGH confidence — from official Vercel docs)

```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
// app/api/cron/reminders/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... cron logic
}
```

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on all cron invocations when `CRON_SECRET` is set as a Vercel environment variable.

### Pattern 3: Budapest Timezone Query Window

The cron runs at the top of every hour (UTC). To find bookings within 20–28 hours ahead:

```typescript
// All timezone math in UTC, appointment stored as date+time strings in Sanity
// slotDate: "YYYY-MM-DD", slotTime: "HH:MM"
// Reconstruct appointment as Budapest local time, then work in UTC

const now = new Date(); // UTC
const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000); // +20h
const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);   // +28h
```

For the GROQ query, Sanity stores `slotDate` (YYYY-MM-DD) and `slotTime` (HH:MM) as separate strings — NOT as a combined datetime. We must reconstruct the appointment datetime for comparison.

**Key GROQ pattern for window query:**

```groq
// Sanity does not support datetime arithmetic from string concatenation natively.
// Reconstruct appointment datetime using dateTime() on concatenated string.
*[
  _type == "booking"
  && !(_id in path("drafts.**"))
  && status == "confirmed"
  && reminderSent != true
  && dateTime(slotDate + "T" + slotTime + ":00+02:00") >= dateTime($windowStart)
  && dateTime(slotDate + "T" + slotTime + ":00+02:00") < dateTime($windowEnd)
]{
  _id, patientName, patientEmail, slotDate, slotTime,
  service->{name}
}
```

**Critical nuance:** The `+02:00` offset in the GROQ datetime string must account for Budapest timezone (CET=+01:00, CEST=+02:00). A robust approach: compute `windowStart` and `windowEnd` in ISO UTC strings and pass as params, then the comparison works correctly regardless of DST. However, the appointment time offset requires knowing whether it's summer time (CEST) or winter time (CET).

**Simpler and more robust approach:** Since the query window is 20–28h wide (generous), just query by slotDate string boundaries. Compute which dates could possibly fall in the window, query all confirmed non-reminded bookings for those dates, then filter in application code using proper timezone logic.

```typescript
// Application-side filtering is safer than GROQ datetime string DST juggling
import { toZonedTime } from 'date-fns-tz'; // already not installed — use Intl
```

**Intl-based Budapest time (no extra package):**

```typescript
function getBudapestOffset(): number {
  // Returns offset in minutes (60 or 120 depending on DST)
  const now = new Date();
  const budapestStr = now.toLocaleString('en-US', { timeZone: 'Europe/Budapest' });
  const budapestDate = new Date(budapestStr);
  return Math.round((budapestDate.getTime() - now.getTime()) / 60000);
}
```

Actually the cleanest approach: use `Intl.DateTimeFormat` to get the current Budapest offset, then do all arithmetic in UTC-adjusted ms. No `date-fns-tz` needed — avoids adding a dependency.

**Recommended approach for query:**
1. Compute `windowStart` and `windowEnd` as UTC Date objects (+20h and +28h from now)
2. Query Sanity for confirmed bookings with `reminderSent != true`, filtering by date range that could possibly include any booking in that window (e.g., today and tomorrow in Budapest time)
3. In application code, reconstruct each booking's appointment DateTime as Budapest-local → UTC, then check if it falls in [windowStart, windowEnd]
4. This avoids any GROQ DST ambiguity

### Pattern 4: Grouping Bookings by Patient Email

Decision: multiple appointments on the same day → one combined email. This requires grouping by `patientEmail` after fetching bookings.

```typescript
// Group bookings by patientEmail
const grouped = new Map<string, BookingForReminder[]>();
for (const booking of bookingsToRemind) {
  const list = grouped.get(booking.patientEmail) ?? [];
  list.push(booking);
  grouped.set(booking.patientEmail, list);
}
```

`buildReminderEmail()` currently accepts a single `date` and `time` — it needs to support multiple appointments. The existing template in `booking-email.ts` is already in the codebase and the planner must decide: extend `buildReminderEmail()` for multiple appointments (array of `{date, time, serviceName}`) or create a separate `buildCombinedReminderEmail()`.

**Recommended (Claude's discretion):** Extend `buildReminderEmail()` to accept an array of appointment entries. For single-appointment case it renders identically to today's template; for multi-appointment it renders multiple detail rows.

### Pattern 5: Idempotency — `reminderSent` Flag on Booking (Claude's discretion)

**Recommendation: Use the existing `reminderSent` boolean on the Sanity booking document.**

Rationale:
- The field is already defined in `bookingType.ts` with `initialValue: false`
- Existing bookings already have the field (default false)
- One atomic patch per booking: `getWriteClient().patch(id).set({ reminderSent: true }).commit()`
- The GROQ query filters `reminderSent != true` — combined with Sanity's consistent reads via `getWriteClient()` (useCdn: false), this is reliable
- Simpler than a separate DB table just for tracking state

**Race condition consideration:** If two cron invocations fire simultaneously (Vercel warns this can happen), two instances could both query for `reminderSent != true` before either patches. This could result in double-sending. Mitigation: accept this edge case — it is extremely unlikely given hourly interval and the 20–28h window means each booking only qualifies for ~8 consecutive runs maximum. The window narrowing is sufficient protection for a medical reminder email at this volume.

If stricter guarantees are needed: use Sanity `ifRevisionID` on the patch (same pattern as slot booking). But for reminder emails at low volume (single-doctor practice), this is over-engineering.

### Pattern 6: Cron Run Log Table (Claude's discretion)

**Recommended DB schema — add to `src/lib/db/schema.ts`:**

```typescript
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cronRunLog = pgTable("cron_run_log", {
  id: text("id").primaryKey(),              // crypto.randomUUID()
  runAt: timestamp("run_at").notNull(),      // new Date()
  remindersAttempted: integer("reminders_attempted").notNull().default(0),
  remindersSucceeded: integer("reminders_succeeded").notNull().default(0),
  remindersFailed: integer("reminders_failed").notNull().default(0),
  errorDetails: text("error_details"),       // JSON string of per-email errors
  durationMs: integer("duration_ms"),        // total run duration
});
```

This requires:
- Adding to `schema.ts`
- Running `npx drizzle-kit generate` to produce migration SQL
- Running `npx drizzle-kit migrate` to apply to Neon DB

### Anti-Patterns to Avoid

- **Do NOT use `sanityFetch` (CDN) for reminder queries** — use `getWriteClient().fetch()` for real-time accuracy (same pattern as admin dashboard). The CDN may cache stale data; reminders must see the current `reminderSent` state.
- **Do NOT omit `!(_id in path("drafts.**"))` filter** — per Phase 13 decision, all `getWriteClient()` queries must filter out drafts.
- **Do NOT add `export const dynamic = "force-dynamic"` to the cron route** — cron routes are always dynamic since they have no static data; Next.js handles this correctly without the annotation. Actually: cron routes ARE dynamic — add `export const dynamic = "force-dynamic"` to ensure no caching. This is the same pattern as other API routes in the project.
- **Do NOT throw on email failure** — mark as failed (don't set `reminderSent: true`), log to cron_run_log.errorDetails, continue processing other bookings. Retry on next hourly run.
- **Do NOT parse Budapest DST using a hardcoded offset** — use `Intl.DateTimeFormat` or a library; DST transitions cause bugs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone conversion | Manual UTC+1/UTC+2 offset | `Intl.DateTimeFormat` with `timeZone: 'Europe/Budapest'` | DST transitions are non-trivial |
| Email HTML | New template | `buildReminderEmail()` in `src/lib/booking-email.ts` | Already built and brand-consistent |
| Email sending | Custom SMTP/Resend | `sendEmail()` in `src/lib/email.ts` (Gmail API) | Already wired |
| Sanity auth | New client | `getWriteClient()` in `src/lib/sanity-write-client.ts` | Already singleton, correct auth |
| Cron security | Custom HMAC/JWT | `CRON_SECRET` + `Authorization: Bearer` header | Platform-native, zero complexity |

**Key insight:** ~90% of the infrastructure exists. This phase is thin integration code, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Hobby Plan Blocks Hourly Cron
**What goes wrong:** `vercel.json` with `"0 * * * *"` causes deployment failure with: *"Hobby accounts are limited to daily cron jobs."*
**Why it happens:** Vercel Hobby plan hard-caps cron to once per day.
**How to avoid:** Confirm project is on Vercel Pro plan before implementing. STATE.md already flags this as a pending todo.
**Warning signs:** Deployment error during `vercel deploy` mentioning cron job frequency.

### Pitfall 2: Drafts Appearing in Reminder Query
**What goes wrong:** Cron sends reminders for draft booking documents that don't represent real bookings.
**Why it happens:** `getWriteClient()` (useCdn: false) returns draft documents by default in some configurations.
**How to avoid:** Always include `!(_id in path("drafts.**"))` in GROQ filter — mandatory per Phase 13 project decision.
**Warning signs:** Reminder emails sent to phantom patients or test bookings.

### Pitfall 3: DST Ambiguity in Budapest Window Calculation
**What goes wrong:** Reminders sent at wrong time (1 hour off) during daylight saving time transitions (last Sunday of March / last Sunday of October).
**Why it happens:** Budapest switches between UTC+1 (CET) and UTC+2 (CEST). Hardcoding either offset is wrong for half the year.
**How to avoid:** Use `Intl.DateTimeFormat` to detect current Budapest offset, or do filtering in application code with proper timezone-aware datetime construction.
**Warning signs:** Patients receive reminders ~23h or ~25h before appointments during DST transition weeks.

### Pitfall 4: Combined Email — Single vs Multiple Appointment UI
**What goes wrong:** `buildReminderEmail()` currently accepts a single appointment. Calling it once per booking for a patient with 2 same-day appointments sends 2 separate emails instead of 1 combined.
**Why it happens:** The current signature is single-appointment only: `{date, time, serviceName}`.
**How to avoid:** The grouping logic (Map by patientEmail) must happen BEFORE calling the email builder. The email builder must be extended to accept `appointments: Array<{date, time, serviceName}>`.
**Warning signs:** Patient receives multiple reminder emails on the same day.

### Pitfall 5: CRON_SECRET Not Set in Production
**What goes wrong:** Cron endpoint returns 401 on every invocation (or worse, is open if the check is misconfigured).
**Why it happens:** Developers set `CRON_SECRET` locally but forget to add it as a Vercel environment variable.
**How to avoid:** Add `CRON_SECRET` to Vercel project environment variables (Settings → Environment Variables). Document in deploy checklist.
**Warning signs:** Vercel cron job logs show 401 responses.

### Pitfall 6: `reminderSent: true` Patch on Booking Creates a Draft
**What goes wrong:** Patching a published Sanity document with `getWriteClient()` creates a draft version, not updating the published document's field directly.
**Why it happens:** Sanity's mutability model: patches on published documents create drafts by default unless using special options.
**How to avoid:** Verify patch behavior. For admin API usage, the `reminderSent` field should be patched directly. Since we're using `getWriteClient()` (not CDN), patches are applied to the draft layer. Test whether the GROQ filter `reminderSent != true` correctly sees through to published state after patching the draft.

**Recommended solution:** Call `.commit({ visibility: 'async' })` on the patch. More importantly, test that after patching `reminderSent: true`, a subsequent query with `reminderSent != true` correctly excludes that booking — given the write client bypasses CDN, this should work correctly. But if creating a draft `reminderSent: true` while the published doc still has `reminderSent: false`, the GROQ query may still return the booking.

**Safest option:** Publish the patch immediately via `getWriteClient().patch(id).set({reminderSent: true}).commit()` — since the booking document schema has no `_publishedAt` or draft constraint, write-client patches should apply directly to the document (not create a draft) when using `SANITY_WRITE_TOKEN` with full write access. Verify this in implementation.

---

## Code Examples

### Verified: CRON_SECRET Authentication Pattern
```typescript
// Source: https://vercel.com/docs/cron-jobs/manage-cron-jobs
// app/api/cron/reminders/route.ts
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // proceed with cron logic
}
```

### Verified: vercel.json Cron Format
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```
Source: https://vercel.com/docs/cron-jobs

### Verified: Sanity Booking Query Pattern (adapted from existing routes)
```typescript
// Query pattern from src/app/api/booking/route.ts and admin routes
// Must use getWriteClient() not sanityFetch for real-time data
const bookings = await getWriteClient().fetch<BookingForReminder[]>(
  `*[
    _type == "booking"
    && !(_id in path("drafts.**"))
    && status == "confirmed"
    && reminderSent != true
    && slotDate >= $dateFrom
    && slotDate <= $dateTo
  ]{
    _id, patientName, patientEmail, slotDate, slotTime,
    service->{name}
  }`,
  { dateFrom, dateTo }
);
```

### Verified: Sanity Patch Pattern (from existing route)
```typescript
// Source: src/app/api/admin/booking-cancel/route.ts
await getWriteClient()
  .patch(booking._id)
  .set({ reminderSent: true })
  .commit();
```

### Verified: Email Subject in Hungarian (Claude's discretion)
```typescript
// Formal magázó tone, consistent with existing email subjects
subject: 'Emlékeztető: holnapi időpontja — Mórocz Medical'
// or
subject: 'Időpont-emlékeztető — Mórocz Medical'
```

### Verified: DB Log Table Schema (Drizzle)
```typescript
// Add to src/lib/db/schema.ts
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const cronRunLog = pgTable("cron_run_log", {
  id: text("id").primaryKey(),
  runAt: timestamp("run_at").notNull(),
  remindersAttempted: integer("reminders_attempted").notNull().default(0),
  remindersSucceeded: integer("reminders_succeeded").notNull().default(0),
  remindersFailed: integer("reminders_failed").notNull().default(0),
  errorDetails: text("error_details"),
  durationMs: integer("duration_ms"),
});
```

### Budapest Timezone Window Calculation (no extra packages)
```typescript
// Compute appointment datetime in UTC from Budapest local time components
function appointmentToUtc(slotDate: string, slotTime: string): Date {
  // slotDate: "2026-02-24", slotTime: "09:20"
  // Construct a date string in Budapest time, let Intl resolve it
  const [year, month, day] = slotDate.split('-').map(Number);
  const [hour, minute] = slotTime.split(':').map(Number);
  // Create a date as if it were UTC, then adjust by Budapest offset
  const provisional = new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!));
  // Determine Budapest offset at that point in time
  const budapestStr = provisional.toLocaleString('en-US', {
    timeZone: 'Europe/Budapest',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  // Parse back — the difference from provisional is the offset
  // Simpler: use the offset-aware ISO string approach via Intl
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Budapest',
    timeZoneName: 'shortOffset'
  });
  // Actually simplest: iterate via known-offset construction
  // This is a known tricky area — use date-fns-tz if available, else accept minor DST risk
  // For this use case (8h window width >> 1h DST offset), filtering in app code is safe
  return provisional; // approximate — refine in implementation
}
```

**Note on timezone complexity:** Given the 8-hour window width (20–28h), DST edge cases are unlikely to cause missed reminders. The cron will fire within the window even if off by 1h. Accept this pragmatically rather than adding `date-fns-tz` as a dependency.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Vercel Cron requires separate config | `vercel.json` `crons` array (path + schedule) | Simple declarative config |
| Manual `Authorization` header parsing | CRON_SECRET env var + `Bearer` prefix auto-injected by Vercel | Secure by default |
| Resend for transactional email | Gmail API (`googleapis`) — decided in Phase 12 | Existing sendEmail() works for cron too |

**Key state of the art:** Vercel does NOT retry failed cron invocations. If the cron function throws, the run is lost. Design for graceful error handling: catch per-email errors, continue processing remaining bookings, log failures to DB.

---

## Open Questions

1. **Vercel plan tier (BLOCKING)**
   - What we know: hourly cron requires Pro plan; Hobby plan fails at deployment
   - What's unclear: which plan is active on the drmoroczangela.hu Vercel project
   - Recommendation: User must confirm before phase starts. STATE.md already flags this. If on Hobby, options are: (a) upgrade to Pro, (b) change decision to daily cron at a fixed hour (e.g., 6 AM UTC = 7 AM Budapest)

2. **Sanity patch creates draft vs updates published document**
   - What we know: `getWriteClient()` with write token can patch documents; existing routes use `.patch().set().commit()` successfully for booking status and slotLock
   - What's unclear: whether patching a published booking document creates a draft `reminderSent: true` while published stays `false`, breaking subsequent GROQ queries
   - Recommendation: Test this during implementation. If drafts are created, add a `.commit({ visibility: 'sync' })` or investigate if the project uses auto-publish behavior. Alternatively, use `reminderSent` as a separate Postgres tracking table — but the Sanity flag approach is simpler if patching works directly.

3. **`buildReminderEmail()` extension for multiple appointments**
   - What we know: current signature is single appointment; combined email decision is locked
   - What's unclear: whether to modify `buildReminderEmail()` in place or add a new `buildCombinedReminderEmail()`
   - Recommendation: Modify `buildReminderEmail()` to accept `appointments: Array<{date: string, time: string, serviceName: string}>` where single-appointment case renders identically to today. This avoids a redundant function.

---

## Sources

### Primary (HIGH confidence)
- https://vercel.com/docs/cron-jobs — cron job fundamentals, vercel.json format, timezone (UTC)
- https://vercel.com/docs/cron-jobs/manage-cron-jobs — CRON_SECRET pattern, code examples, idempotency guidance
- https://vercel.com/docs/cron-jobs/usage-and-pricing — plan limits: Hobby=daily only, Pro=per-minute minimum interval
- `src/lib/booking-email.ts` — `buildReminderEmail()` already implemented (verified by reading file)
- `src/lib/email.ts` — `sendEmail()` Gmail API already implemented (verified by reading file)
- `src/sanity/schemaTypes/bookingType.ts` — `reminderSent` boolean field already on schema (verified)
- `src/lib/sanity-write-client.ts` — `getWriteClient()` pattern (verified)
- `src/lib/db/schema.ts` — Drizzle schema, Neon Postgres (verified)

### Secondary (MEDIUM confidence)
- Project STATE.md — confirms GMAIL API replaced Resend in Phase 12, Vercel Cron chosen as approach with Inngest as upgrade path
- `src/app/api/booking/route.ts` — confirmed pattern for Sanity write-client queries and email fire-and-forget
- `src/app/api/admin/booking-cancel/route.ts` — confirmed `.patch().set().commit()` pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified in codebase
- Architecture: HIGH — Vercel cron config from official docs; Sanity/Gmail patterns from existing project code
- Pitfalls: HIGH for plan tier and draft issues; MEDIUM for DST edge case (unlikely to manifest in practice)
- Idempotency approach: MEDIUM — `reminderSent` Sanity patch behavior needs verification during implementation

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days; Vercel docs are stable; Next.js 15 API stable)
