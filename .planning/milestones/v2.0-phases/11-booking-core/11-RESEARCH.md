# Phase 11: Booking Core - Research

**Researched:** 2026-02-22
**Domain:** Multi-step booking wizard, slot generation from Sanity schedule, optimistic locking, confirmation email
**Confidence:** HIGH (verified against project codebase, Sanity docs, Motion docs, and Resend docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wizard Flow & Steps:**
- Linear wizard: Service → Date/Time → Auth → Confirm
- Step indicator at top showing progression
- Auth step auto-advances (skipped) if patient already has a session
- Back button on each step — selections preserved when going back
- First step is service selection (two services available)

**Services:**
- **Nőgyógyászat** — 20 perc
- **Várandósgondozás** — 20 perc
- Services managed in Sanity (admin can add/edit later)
- Each service has a name and duration
- Variable duration per service — longer services block consecutive 20-minute slots automatically

**Slot Display & Selection:**
- Calendar grid (monthly view) for date selection — available days highlighted, unavailable grayed out
- After selecting a date, time slots shown as a button grid (e.g., 9:00, 9:20, 9:40...)
- Base slot granularity: **20 minutes**
- Slots come from a **Sanity-managed schedule** (admin defines weekly availability)
- Booking window: **up to 30 days ahead**

**Confirmation & Feedback:**
- Confirmation step collects: name, email, phone — pre-filled from auth profile if available
- After booking: summary card with service, date, time + next steps (arrive early, bring ID, etc.)
- Confirmation email: **branded and warm** — clinic logo, warm Hungarian greeting, booking details, helpful tips, clinic contact info
- Email includes both **cancel and reschedule links**

**Conflict & Error Handling:**
- **Soft hold with timer**: selected slot reserved for ~5 minutes, countdown shown, expires if not confirmed
- On double-book conflict: show **3-5 nearest available slots** on same/next day — patient can pick alternative without restarting
- General errors (network, server): **inline Hungarian toast/banner** at top of current step with retry option

### Claude's Discretion
- Step indicator visual design (dots, progress bar, numbered steps)
- Exact calendar component implementation
- Loading/skeleton states during slot fetching
- Confirmation page layout and spacing
- Email HTML template structure
- Slot hold mechanism implementation details

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | Patient can select a service from the list on /idopontfoglalas | Existing `serviceType.ts` has `appointmentDuration`; `allServicesQuery` fetches services. Service selector is Step 1 of wizard. |
| BOOK-02 | Patient can browse available dates on a calendar (available days highlighted) | Slot generation algorithm reads `weeklySchedule` + `blockedDate` documents. Calendar built as client component; no external calendar lib needed at current volume. |
| BOOK-03 | Patient can pick a time slot from available slots for the selected date | API route `/api/slots?date=YYYY-MM-DD&serviceId=xxx` returns available slots; slot generation logic uses `getHungarianHolidays` (already exists in codebase). |
| BOOK-04 | Patient provides name, email, phone at booking confirmation | Confirmation form collects three fields; pre-filled from `useSession()`. Zod validates on client + server. |
| BOOK-05 | Booking is created instantly as a Sanity document with per-slot optimistic locking | New `bookingType` Sanity schema + `slotLockType` document. Write API route uses Sanity write client with `ifRevisionID`. |
| BOOK-06 | Double-booking is prevented via ifRevisionID on slot documents | `client.patch(slotId).set({status:'booked'}).commit({ifRevisionID: currentRev})` — 409 on conflict. Alternative slots returned from same API. |
| BOOK-07 | Auth gate appears after slot selection, not before browsing | `AuthStep` component (already built in Phase 10) is Step 3 of wizard; browsing is steps 1 & 2 with no auth. |
| NOTIF-01 | Patient receives confirmation email immediately after booking | Resend `emails.send()` called in `/api/booking` route after successful Sanity write. Plain HTML template (same pattern as existing invite email in `api/admin/invite/route.ts`). |
| UX-01 | Booking flow uses animated step transitions (Motion v12) | `AnimatePresence mode="wait"` with direction-aware `custom` prop — exact pattern already used in `LabTestsSection.tsx`. Import: `from "motion/react"`. |
| UX-02 | All booking UI strings in proper Hungarian with accented characters | Global CLAUDE.md rule enforces this. No library needed; discipline in code review. |
| UX-03 | Booking page matches existing site design system | Tailwind v4 CSS vars: `--color-primary` (#23264F navy), `--color-secondary` (#F4DCD6 pink), `--color-accent` (#99CEB7 green). Same rounding (`rounded-2xl`, `rounded-3xl`), font (`Plus Jakarta Sans`). |
</phase_requirements>

---

## Summary

Phase 11 builds a four-step booking wizard at `/idopontfoglalas`. The heavy lifting falls into three areas: (1) slot generation logic that reads Sanity's `weeklySchedule` and `blockedDate` documents and computes available times, (2) double-booking prevention using Sanity's `ifRevisionID` optimistic locking on per-slot documents, and (3) a confirmation email via Resend.

The project's existing stack covers everything needed without new dependencies. The `AuthStep` component from Phase 10 is drop-in ready for Step 3. Motion v12's `AnimatePresence mode="wait"` with direction-aware `custom` variants is already demonstrated in `LabTestsSection.tsx`. The Resend plain HTML email pattern is already established in the admin invite route. The `getHungarianHolidays` utility is reusable for blocking holidays in slot generation.

The only new plumbing required is: a `bookingType` Sanity schema, a `slotLock` Sanity schema for optimistic lock documents, a server-side Sanity write client (requires `SANITY_WRITE_TOKEN`), two new API routes (`/api/slots` and `/api/booking`), and the booking page with its wizard client component.

**Primary recommendation:** Build the slot generation algorithm first (pure TypeScript, no Sanity write needed) and validate it works correctly before touching the booking creation or email. The hardest bug to catch late is incorrect slot computation.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.34.2 (installed) | Step transition animations | Already in project; `AnimatePresence mode="wait"` for wizard steps |
| zod | ^3.25.76 (installed) | Booking form validation | Already in project; v3 required (v4 breaks Sanity v4 builds) |
| resend | ^6.9.2 (installed) | Confirmation email | Already in project; established pattern in `api/admin/invite` |
| @sanity/client | via `sanity` pkg (installed) | Sanity write mutations | Used via `createClient` with write token in API routes |
| better-auth | ^1.4.18 (installed) | Session access in API routes | `auth.api.getSession()` to get user identity for confirmation pre-fill |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-sanity | ^11.6.12 (installed) | Sanity reads in Server Components | Slot fetching in Server Components; use `client` with read token |
| react-email | NOT installed | React component email templates | Optional upgrade path; current plain HTML approach is sufficient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain HTML email | react-email | react-email gives better maintainability but adds a dependency; for one email template, plain HTML is faster to ship and matches existing project pattern |
| Custom slot generation | External calendar/availability library | External libs (cal.com, Calendly SDK) are overkill for single-doctor, single-timezone use; pure TypeScript implementation is ~60 lines |
| Sanity ifRevisionID locking | Database-level locks in Neon | ifRevisionID is already in the architectural decision (STATE.md); Neon approach would require additional schema work |

**Installation:** No new npm packages required. Everything is already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── idopontfoglalas/
│   │   └── page.tsx              # Server Component — fetches services, passes to wizard
│   └── api/
│       ├── slots/
│       │   └── route.ts          # GET — returns available slots for a date+serviceId
│       └── booking/
│           └── route.ts          # POST — creates booking, sends email
├── components/
│   └── booking/
│       ├── BookingWizard.tsx     # "use client" — wizard state, step routing
│       ├── StepIndicator.tsx     # Visual step progress (Claude's discretion)
│       ├── Step1Service.tsx      # Service card selector
│       ├── Step2DateTime.tsx     # Calendar + time slot picker
│       ├── Step3Auth.tsx         # Wraps existing AuthStep component
│       ├── Step4Confirm.tsx      # Name/email/phone form + submit
│       └── BookingSuccess.tsx    # Post-booking summary card
├── lib/
│   └── slots.ts                  # Pure slot generation algorithm
└── sanity/
    └── schemaTypes/
        ├── bookingType.ts        # New: booking document schema
        └── slotLockType.ts       # New: slot lock document schema
```

### Pattern 1: Slot Generation Algorithm

**What:** Pure TypeScript function that takes `weeklySchedule`, `blockedDates`, `existingBookings`, a target date, and a service duration, and returns an array of available time strings.

**When to use:** Called by `/api/slots` route handler. Keep it a pure function so it can be unit-tested independently.

```typescript
// src/lib/slots.ts

interface SlotGenerationInput {
  schedule: WeeklySchedule;     // from Sanity weeklySchedule document
  blockedDates: string[];       // ISO dates like "2026-03-15"
  bookedSlots: string[];        // ISO times like "2026-03-15T09:00:00"
  date: string;                 // "2026-03-15"
  serviceDurationMinutes: number; // e.g., 20
  bufferMinutes: number;        // from schedule.bufferMinutes
  maxDaysAhead: number;         // 30
}

export function generateAvailableSlots(input: SlotGenerationInput): string[] {
  const { schedule, blockedDates, bookedSlots, date, serviceDurationMinutes, bufferMinutes } = input;

  // 1. Check if date is within booking window
  const today = new Date();
  const targetDate = new Date(date);
  const daysAhead = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAhead < 0 || daysAhead > input.maxDaysAhead) return [];

  // 2. Check if date is blocked
  if (blockedDates.includes(date)) return [];

  // 3. Find day config in schedule (dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat)
  const dayOfWeek = targetDate.getDay();
  const dayConfig = schedule.days.find(d => d.dayOfWeek === dayOfWeek);
  if (!dayConfig || dayConfig.isDayOff || !dayConfig.startTime || !dayConfig.endTime) return [];

  // 4. Generate base 20-min slots between startTime and endTime
  const slots: string[] = [];
  const [startH, startM] = dayConfig.startTime.split(':').map(Number);
  const [endH, endM] = dayConfig.endTime.split(':').map(Number);
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const slotStep = 20; // base granularity

  // 5. For longer services, exclude slots where service wouldn't fit
  while (currentMinutes + serviceDurationMinutes <= endMinutes) {
    const slotTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
    const isoSlot = `${date}T${slotTime}:00`;

    // Check if any booked slot overlaps this service window
    const serviceEndMinutes = currentMinutes + serviceDurationMinutes;
    const isBlocked = bookedSlots.some(booked => {
      const bookedTime = booked.split('T')[1];
      const [bH, bM] = bookedTime.split(':').map(Number);
      const bookedMinutes = bH * 60 + bM;
      // A booked slot at bookedMinutes blocks our slot if it overlaps our [currentMinutes, serviceEndMinutes) window
      return bookedMinutes >= currentMinutes && bookedMinutes < serviceEndMinutes;
    });

    if (!isBlocked) {
      slots.push(isoSlot);
    }

    currentMinutes += slotStep + bufferMinutes;
  }

  return slots;
}
```

**Confidence:** HIGH — logic derived from existing `weeklyScheduleType.ts` field structure (dayOfWeek 0-6, startTime/endTime HH:MM strings, defaultSlotDuration, bufferMinutes).

### Pattern 2: Sanity Write Client (Server-Side Only)

**What:** A separate Sanity client configured with `SANITY_WRITE_TOKEN` for API routes that create booking and slot-lock documents. Never exposed to the browser.

**When to use:** In `/api/booking/route.ts` and `/api/slots/route.ts` (if soft-hold writes are needed).

```typescript
// src/lib/sanity-write-client.ts
import { createClient } from "@sanity/client";

// Lazy initialization — same pattern as db/index.ts and auth.ts in this project
let _writeClient: ReturnType<typeof createClient> | null = null;

export function getWriteClient() {
  if (!_writeClient) {
    _writeClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01",
      token: process.env.SANITY_WRITE_TOKEN, // NOT NEXT_PUBLIC_ — server only
      useCdn: false, // writes must bypass CDN
    });
  }
  return _writeClient;
}
```

**Confidence:** HIGH — verified pattern from Sanity docs and existing project's lazy-init conventions (see `db/index.ts` Proxy pattern, `auth.ts` getResend() pattern).

### Pattern 3: Double-Booking Prevention via ifRevisionID

**What:** Per-slot-lock documents in Sanity. When a patient selects a slot, the booking API reads the slot-lock document's `_rev`, then tries to patch it to `status: "booked"` using `ifRevisionID`. If two requests arrive simultaneously, one wins; the other gets a 409.

**When to use:** In `/api/booking/route.ts` as the critical section before writing the booking document.

```typescript
// Source: Sanity JS client README (github.com/sanity-io/client)
// and project STATE.md: "Per-slot Sanity documents with ifRevisionID locking"

// Step 1: Read current slot-lock document
const slotLock = await writeClient.fetch(
  `*[_type == "slotLock" && slotId == $slotId][0]{ _id, _rev, status }`,
  { slotId }
);

if (!slotLock || slotLock.status === "booked") {
  return Response.json({ error: "Ez az időpont már foglalt." }, { status: 409 });
}

// Step 2: Attempt optimistic lock — will throw/fail if _rev has changed
try {
  await writeClient
    .patch(slotLock._id)
    .set({ status: "booked", bookingRef: bookingId })
    .commit({ ifRevisionID: slotLock._rev }); // KEY: only succeeds if no other write happened
} catch (err) {
  // 409 Conflict — another request won the race
  return Response.json(
    { error: "Ez az időpont már foglalt. Kérjük, válasszon másik időpontot." },
    { status: 409 }
  );
}
```

**Confidence:** HIGH — `ifRevisionID` is documented in Sanity JS client README and confirmed in project STATE.md as the chosen architectural approach. The `commit({ ifRevisionID })` signature is verified from the client docs.

### Pattern 4: Wizard Step Transitions (Motion v12)

**What:** `AnimatePresence mode="wait"` with direction-aware `custom` prop for slide-left/slide-right between wizard steps. This is IDENTICAL to the existing pattern in `LabTestsSection.tsx`.

**When to use:** In `BookingWizard.tsx` wrapping each step component.

```typescript
// Source: Verified from src/components/sections/LabTestsSection.tsx (lines 60-64, 84-88)
// Direction-aware pattern from: https://sinja.io/blog/direction-aware-animations-in-framer-motion

import { AnimatePresence, motion } from "motion/react"; // project import path

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

// In the wizard render:
const direction = useRef(0); // 1 = forward, -1 = back

function goToStep(nextStep: number) {
  direction.current = nextStep > currentStep ? 1 : -1;
  setCurrentStep(nextStep);
}

<AnimatePresence mode="wait" custom={direction.current}>
  <motion.div
    key={currentStep}
    custom={direction.current}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.25, ease: "easeInOut" }}
  >
    {renderStep(currentStep)}
  </motion.div>
</AnimatePresence>
```

**Confidence:** HIGH — identical pattern is already working in production in `LabTestsSection.tsx`.

### Pattern 5: Confirmation Email (Resend Plain HTML)

**What:** Send booking confirmation email via Resend with inline-styled HTML. Same approach as `api/admin/invite/route.ts`. No react-email package needed.

**When to use:** In `/api/booking/route.ts` after successful Sanity write.

```typescript
// Source: Verified from src/app/api/admin/invite/route.ts (project pattern)
// and https://resend.com/docs/send-with-nextjs

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

void getResend().emails.send({
  from: "noreply@moroczmedical.hu",
  to: patientEmail,
  subject: "Időpontfoglalás visszaigazolása — Mórocz Medical",
  html: buildConfirmationEmail({
    patientName,
    serviceName,
    date: formattedDate,        // "2026. március 15. (vasárnap)"
    time: formattedTime,        // "09:20"
    cancelUrl,
    rescheduleUrl,
    clinicPhone,
    clinicAddress,
  }),
});

// buildConfirmationEmail returns a string of inline-styled HTML
// (warm, branded medical tone — NOT e-commerce style)
```

**Confidence:** HIGH — pattern mirrors existing project email sending code.

### Pattern 6: AuthStep Integration (Already Built)

**What:** `AuthStep` component from Phase 10 is reusable as Step 3 of the wizard. It already calls `onSuccess()` if session exists (auto-advances), and supports both email/password and Google OAuth.

**When to use:** In `Step3Auth.tsx` — just wrap `AuthStep` and pass `onSuccess={() => goToStep(4)}`.

```typescript
// Source: src/components/auth/AuthStep.tsx — already built in Phase 10
import AuthStep from "@/components/auth/AuthStep";

export function Step3Auth({ onSuccess }: { onSuccess: () => void }) {
  return <AuthStep onSuccess={onSuccess} />;
}
```

**Confidence:** HIGH — component exists at `src/components/auth/AuthStep.tsx`, already handles auto-advance for existing sessions.

### Anti-Patterns to Avoid

- **Blocking the booking window while fetching slots:** Keep slot generation server-side in an API route. Return slots as JSON to the client; don't read Sanity in the browser for slot availability (avoids exposing token, avoids CORS issues).
- **Storing slot state in URL params for the wizard:** Use `useState` in `BookingWizard.tsx`. URL state for a wizard adds complexity with no benefit at this scale.
- **Using `client.create()` for booking without the lock check:** Always patch the slotLock document with `ifRevisionID` before creating the booking. If locking is skipped, double-booking is possible.
- **Calling `resend.emails.send()` synchronously (blocking the booking response):** Use `void getResend().emails.send(...)` (fire-and-forget), same as existing admin invite pattern. Email failure should not fail the booking.
- **Importing motion from "framer-motion":** Project uses `"motion/react"` (Motion v12 import path). Wrong import will fail.

---

## Sanity Schema: New Documents Required

### bookingType

A new Sanity document type to store each confirmed booking.

```typescript
// src/sanity/schemaTypes/bookingType.ts
{
  name: "booking",
  type: "document",
  fields: [
    { name: "service", type: "reference", to: [{ type: "service" }], validation: r => r.required() },
    { name: "slotDate", type: "date", validation: r => r.required() }, // "2026-03-15"
    { name: "slotTime", type: "string", validation: r => r.required() }, // "09:20"
    { name: "patientName", type: "string", validation: r => r.required() },
    { name: "patientEmail", type: "email", validation: r => r.required() },
    { name: "patientPhone", type: "string", validation: r => r.required() },
    { name: "userId", type: "string" }, // Better Auth user ID
    { name: "status", type: "string", options: { list: ["confirmed","cancelled","rescheduled"] }, initialValue: "confirmed" },
    { name: "createdAt", type: "datetime" },
  ]
}
```

### slotLockType

A per-slot document used for optimistic locking. One document per slot time.

```typescript
// src/sanity/schemaTypes/slotLockType.ts
{
  name: "slotLock",
  type: "document",
  fields: [
    { name: "slotId", type: "string", validation: r => r.required() }, // "2026-03-15T09:20:00"
    { name: "status", type: "string", options: { list: ["available","held","booked"] }, initialValue: "available" },
    { name: "heldUntil", type: "datetime" }, // for soft-hold expiry
    { name: "bookingRef", type: "reference", to: [{ type: "booking" }] },
  ]
}
```

**Note on soft hold:** The `slotLockType.heldUntil` field enables a soft hold. When a patient selects a slot, set `status: "held"` and `heldUntil: now + 5 minutes`. The slot generation algorithm treats slots with `status: "held" && heldUntil > now` as unavailable. A Vercel cron job (or the next slot fetch) cleans up expired holds. This is simpler than a WebSocket approach and consistent with the serverless architecture.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email delivery | Custom SMTP | Resend (already installed) | Vercel blocks outbound SMTP on port 25/587; Resend is the established project choice |
| Hungarian holiday detection | Custom holiday list | `getHungarianHolidays()` already in `src/sanity/components/hungarianHolidays.ts` | Already exists; covers all 11 Hungarian public holidays with Easter algorithm |
| Auth during booking | Custom auth forms | `AuthStep` component from Phase 10 | Already built; handles Google OAuth + email/password + auto-advance |
| Sanity read queries | Raw fetch() | `sanityFetch()` from `src/sanity/lib/fetch.ts` | Handles draft mode, CDN, tag-based revalidation |
| Hungarian date formatting | Custom formatter | `Date.toLocaleDateString('hu-HU', {...})` (native) | Web standard; no library needed |

**Key insight:** Phase 11 is an integration challenge, not a library selection challenge. All required libraries are installed. The complexity is in the slot generation algorithm and the ifRevisionID locking sequence.

---

## Common Pitfalls

### Pitfall 1: Timezone Confusion in Slot Generation

**What goes wrong:** Slots generated in UTC differ from Hungarian local time (UTC+1 winter, UTC+2 summer). A slot stored as "2026-03-15T08:00:00Z" displays as "09:00" locally but is stored as "08:00".
**Why it happens:** JavaScript `new Date()` and Sanity `datetime` fields default to UTC. Hungary uses CET/CEST.
**How to avoid:** Store all slots as local time strings ("2026-03-15T09:20:00") NOT as UTC ISO strings. Do not store timezone offsets in slot IDs. The `slotDate` (date string) and `slotTime` (HH:MM string) fields in `bookingType` avoid this entirely.
**Warning signs:** Slots showing as off-by-1-hour in summer vs. winter.

### Pitfall 2: Stale Slot Data After Booking

**What goes wrong:** Patient A books a slot; Patient B who already loaded the slot grid still sees it as available. B submits, gets a 409, but the UI doesn't explain what happened clearly.
**Why it happens:** Client-side slot data is fetched once and not re-fetched on every render.
**How to avoid:** After a 409 response, immediately re-fetch available slots for the selected date and show the 3-5 nearest alternatives (as specified in CONTEXT.md). The UI must handle the conflict gracefully — not just show an error.
**Warning signs:** Test by opening two tabs and booking the same slot simultaneously.

### Pitfall 3: Session Not Available at Booking Submission

**What goes wrong:** Patient authenticates in Step 3, then the Step 4 confirmation submit fires, but `auth.api.getSession()` in the API route returns null.
**Why it happens:** Google OAuth redirects back to `/idopontfoglalas` which re-mounts the wizard at step 1 (losing state). The session cookie exists but wizard state is gone.
**How to avoid:** After Google OAuth callback, restore wizard state from `sessionStorage` or URL params. The `callbackURL` in `AuthStep.tsx` is already set to `/idopontfoglalas`, but wizard state (selected service, date, time) must survive the page reload. Use `sessionStorage` to persist wizard selections before redirecting.
**Warning signs:** Google OAuth users always restart the wizard from step 1.

### Pitfall 4: Sanity Write Token in Build Environment

**What goes wrong:** Next.js tries to evaluate API routes at build time; if `SANITY_WRITE_TOKEN` is not set in the build environment, the build fails.
**Why it happens:** Static analysis during build.
**How to avoid:** Use lazy initialization (same as `getResend()` pattern in `auth.ts`). Never call `createClient({ token })` at module level.
**Warning signs:** Build passes locally but fails on Vercel.

### Pitfall 5: ifRevisionID Creates Slot Lock Document Only If It Exists

**What goes wrong:** Using `patch(id).ifRevisionID(rev)` on a document that doesn't exist yet always fails.
**Why it happens:** `patch` requires the document to exist. If no `slotLock` document exists for a time slot, the first booking attempt fails.
**How to avoid:** On slot selection (soft hold), use `createIfNotExists` to initialize the slotLock document to `status: "available"`, THEN use `patch().ifRevisionID()` on subsequent booking. Alternatively, pre-create slotLock documents when the schedule is saved (admin action). The simpler approach: create the slotLock document as part of the booking API if it doesn't exist, using a transaction.
**Warning signs:** First booking for any slot always returns 409.

### Pitfall 6: Motion AnimatePresence with Key=0 and Key=0

**What goes wrong:** When both the initial render and after stepping back reach step index 0, the key doesn't change, so AnimatePresence doesn't animate.
**Why it happens:** React reconciles components with the same key as updates, not remounts.
**How to avoid:** Use step index as key: `key={currentStep}`. Step indices start at 1 or use string keys ("service", "datetime", "auth", "confirm").

---

## Code Examples

### Verified Patterns from Project Codebase

#### Motion v12 Carousel/Step Pattern (already in production)
```typescript
// Source: src/components/sections/LabTestsSection.tsx (lines 60-95)
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

<AnimatePresence mode="wait" custom={direction.current}>
  <motion.div
    key={page}
    custom={direction.current}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

#### Resend Plain HTML Email (already in production)
```typescript
// Source: src/app/api/admin/invite/route.ts (lines 82-124)
void getResend().emails.send({
  from: "noreply@moroczmedical.hu",
  to: email,
  subject: "Meghívó — Morocz Medical Admin",
  html: `<div style="font-family: ui-sans-serif...">...</div>`,
});
// Fire-and-forget: void prefix prevents blocking
```

#### Session Check in API Route (already in production)
```typescript
// Source: src/app/api/admin/invite/route.ts (lines 17-29)
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return Response.json({ error: "Nem hitelesített kérés." }, { status: 403 });
}
```

#### Sanity Fetch with Tags (already in production)
```typescript
// Source: src/sanity/lib/fetch.ts
import { sanityFetch } from "@/sanity/lib/fetch";
import { weeklyScheduleQuery, blockedDatesQuery, allServicesQuery } from "@/sanity/lib/queries";

// Server Component data loading
const [schedule, blockedDates, services] = await Promise.all([
  sanityFetch({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
  sanityFetch({ query: blockedDatesQuery, tags: ["blockedDate"] }),
  sanityFetch({ query: allServicesQuery, tags: ["service"] }),
]);
```

#### Hungarian Date Formatting (native API)
```typescript
// Source: standard Web API — no library needed
const formattedDate = new Date("2026-03-15").toLocaleDateString("hu-HU", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}); // "2026. március 15., vasárnap"

const formattedTime = "09:20"; // already stored as HH:MM string
```

#### Zod Booking Validation (project pattern)
```typescript
// Pattern: same as api/admin/invite/route.ts Zod usage
import { z } from "zod";

const BookingSchema = z.object({
  serviceId: z.string().min(1, "Kérjük, válasszon szolgáltatást."),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
  patientName: z.string().min(2, "A névm megadása kötelező."),
  patientEmail: z.string().email("Érvénytelen e-mail cím."),
  patientPhone: z.string().min(7, "Kérjük, adja meg telefonszámát."),
});
```

---

## API Design

### GET /api/slots

**Purpose:** Return available time slots for a given date and service.

**Query params:**
- `date=2026-03-15` (required)
- `serviceId=<sanity-id>` (required)

**Response:**
```json
{
  "slots": ["09:00", "09:20", "09:40", "10:00"],
  "date": "2026-03-15",
  "serviceName": "Nőgyógyászat",
  "durationMinutes": 20
}
```

**Server logic:**
1. Fetch `weeklySchedule`, `blockedDate` documents from Sanity (read client, tagged)
2. Fetch existing bookings for that date: `*[_type == "booking" && slotDate == $date && status == "confirmed"]`
3. Fetch active slot holds: `*[_type == "slotLock" && status == "held" && heldUntil > now()]`
4. Call `generateAvailableSlots()` with all data
5. Return available slots array

**No auth required** — browsing is public (BOOK-07 says auth gate appears AFTER slot selection).

### POST /api/booking

**Purpose:** Create a confirmed booking, lock the slot, send confirmation email.

**Auth required:** Yes — patient must be authenticated.

**Request body:** `{ serviceId, slotDate, slotTime, patientName, patientEmail, patientPhone }`

**Server logic (critical sequence):**
1. Validate session: `auth.api.getSession()` — 401 if not authenticated
2. Validate body with Zod `BookingSchema`
3. Verify slot is still available (re-check against current bookings)
4. Get or create `slotLock` document for this slot
5. Attempt `patch(slotLockId).set({status:"booked"}).commit({ifRevisionID: currentRev})`
   - On failure (409): fetch 3-5 nearest available slots, return as alternatives
6. Create `booking` Sanity document via `writeClient.create({_type:"booking", ...})`
7. Fire-and-forget: `void getResend().emails.send(confirmationEmail)`
8. Return `{ bookingId, message: "Időpont sikeresen lefoglalva." }`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auth.js v5 | Better Auth 1.4 | Late 2025 | Already implemented in Phase 10; no change for Phase 11 |
| react-email for all emails | Plain HTML inline styles | Project convention | Admin invite email established plain HTML pattern; follow it |
| GROQ date comparisons using $lt/$gt | `now()` function | Sanity docs | Use `heldUntil > now()` in GROQ to filter expired holds |

**Deprecated/outdated:**
- `import { motion } from "framer-motion"`: Project uses `import { motion } from "motion/react"` (Motion v12 package rename)

---

## Open Questions

1. **Soft hold cleanup — who expires holds?**
   - What we know: Holds expire after 5 minutes; Vercel serverless has no persistent workers
   - What's unclear: Does the slot generation query filter expired holds at query time (simplest), or does a cron job clean them up?
   - Recommendation: Filter expired holds at query time using `heldUntil > now()` in the GROQ query for `/api/slots`. No cron needed. Expired hold documents stay in Sanity but are invisible to the slot generator. Periodic cleanup can be a future admin action.

2. **Cancel/reschedule links in confirmation email — URL structure?**
   - What we know: Email includes both cancel and reschedule links (CONTEXT.md decision)
   - What's unclear: Phase 12 owns cancel/reschedule (ACCT-02, ACCT-03). Phase 11 email needs the URLs but the routes don't exist yet.
   - Recommendation: In Phase 11, generate placeholder URLs like `/fiokom?cancel=<bookingId>` and `/fiokom?reschedule=<bookingId>`. Phase 12 will implement these routes. The booking document `_id` is known at email send time.

3. **Wizard state persistence across Google OAuth redirect?**
   - What we know: Google OAuth redirects back to `/idopontfoglalas` which remounts the page
   - What's unclear: How to restore `selectedService`, `selectedDate`, `selectedTime` after the OAuth redirect
   - Recommendation: Before calling `signIn.social({ provider: "google", callbackURL: "/idopontfoglalas" })`, save wizard state to `sessionStorage`. On mount of `BookingWizard`, check `sessionStorage` for saved state and restore it. This is the simplest approach that works without URL params.

4. **`SANITY_WRITE_TOKEN` — does it exist in the project environment yet?**
   - What we know: Only `SANITY_API_TOKEN` (for preview/draft mode) exists in the project so far
   - What's unclear: Whether a separate write token needs to be created or `SANITY_API_TOKEN` has write permissions
   - Recommendation: Create a dedicated `SANITY_WRITE_TOKEN` with "Editor" role in Sanity API settings. Do not reuse the preview token. Add to `.env.local` and Vercel environment variables.

---

## Sources

### Primary (HIGH confidence)
- Project codebase `src/components/sections/LabTestsSection.tsx` — AnimatePresence motion pattern verified
- Project codebase `src/app/api/admin/invite/route.ts` — Resend email + session check patterns verified
- Project codebase `src/sanity/schemaTypes/weeklyScheduleType.ts` — slot generation input structure verified
- Project codebase `src/sanity/components/hungarianHolidays.ts` — reusable holiday utility verified
- Project codebase `src/components/auth/AuthStep.tsx` — drop-in auth step verified
- Project `STATE.md` — architectural decision: ifRevisionID locking confirmed

### Secondary (MEDIUM confidence)
- https://github.com/sanity-io/client (README) — `patch().commit({ ifRevisionID })` API verified
- https://www.sanity.io/answers/how-to-securely-send-requests-to-sanity-in-a-next-js-app-using-api-routes- — write client setup verified
- https://resend.com/docs/send-with-nextjs — Resend API route pattern verified
- https://sinja.io/blog/direction-aware-animations-in-framer-motion — direction-aware AnimatePresence `custom` prop pattern verified

### Tertiary (LOW confidence)
- WebSearch results on slot hold timer patterns — no authoritative source found; recommendation (filter at query time) is logic-based, not from a source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; versions confirmed in package.json
- Architecture: HIGH — wizard pattern and API design follow established project conventions
- Slot generation algorithm: HIGH — input structure verified from existing Sanity schema fields
- ifRevisionID locking: HIGH — confirmed in STATE.md decision + Sanity client docs
- Soft hold design: MEDIUM — query-time expiry approach is logical but not from an authoritative source
- Email template: HIGH — exact pattern used in production admin invite email

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable stack, 30-day validity)
