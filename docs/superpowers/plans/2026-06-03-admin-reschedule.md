# Admin Reschedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an `/admin` user move a confirmed booking to another free time slot (date + time only); patient optionally emailed; no payment change.

**Architecture:** A new `POST /api/admin/booking-reschedule` route mirrors the admin-cancel route (auth, fetch, slot-lock release) and the patient-reschedule route (atomic slot swap with optimistic locking, calendar + email). A free-slot list is fetched from a shared `getAvailableSlotsForDate` helper extracted from `/api/slots`, which is also the server-side authority that re-validates the chosen slot. A new `AdminRescheduleModal` opened from `AdminPatientModal` drives the UI.

**Tech Stack:** Next.js 15 App Router, TypeScript, Sanity (write client), better-auth (admin role), Zod, Vitest. Slot math lives in `src/lib/slots.ts` (`generateAvailableSlots`, `resolveScheduleForDate`).

---

## File Structure

- **Create** `src/lib/availability.ts` — `getAvailableSlotsForDate(date, serviceId, nowMs?)`: assembles Sanity data and returns the free-slot list for one date+service. Single source of truth for "what's free on this day".
- **Modify** `src/app/api/slots/route.ts` — delegate to the new helper (behaviour-preserving).
- **Create** `src/lib/availability.test.ts` — unit test for the helper's data assembly.
- **Create** `src/app/api/admin/booking-reschedule/route.ts` — the admin reschedule endpoint.
- **Create** `src/app/api/admin/booking-reschedule/route.test.ts` — route decision-branch tests.
- **Create** `src/components/admin/AdminRescheduleModal.tsx` — date picker + free-slot list + notify checkbox.
- **Modify** `src/app/api/admin/bookings/route.ts` — add `serviceId` to both GROQ queries and the row type.
- **Modify** `src/components/admin/AdminDashboard.tsx` — add `serviceId` to the `AdminBooking` type.
- **Modify** `src/components/admin/AdminPatientModal.tsx` — add a "Reschedule" menu item that opens `AdminRescheduleModal`.

**Known limitation (deliberate):** Admin reschedule reuses the public availability window (`bookingWindowDays ?? 30`), so it cannot target dates beyond the patient-facing booking window. This matches decision 1A; widening the window for admins is a possible follow-up.

---

### Task 1: Expose `serviceId` on admin bookings

The reschedule modal needs the booking's service `_id` to ask `/api/slots` for the right durations. The admin bookings API currently returns only `service->{name, appointmentDuration}`.

**Files:**
- Modify: `src/app/api/admin/bookings/route.ts`
- Modify: `src/components/admin/AdminDashboard.tsx:17-29`

- [ ] **Step 1: Add `serviceId` to the row type and both GROQ queries**

In `src/app/api/admin/bookings/route.ts`, add `serviceId: string | null;` to the `AdminBookingRow` type (after the `service` field):

```typescript
      service: { name: string; appointmentDuration: number } | null;
      serviceId: string | null;
```

In BOTH GROQ projections (the email branch and the date-range branch), add the `serviceId` projection right after the `service->{...}` line:

```groq
        service->{name, appointmentDuration},
        "serviceId": service._ref,
```

In BOTH `transformedHistorical` mappers, add `serviceId: null,` next to `service: ...` so the historical rows still satisfy the type:

```typescript
        service: h.serviceName ? { name: h.serviceName, appointmentDuration: 0 } : null,
        serviceId: null,
```

- [ ] **Step 2: Add `serviceId` to the `AdminBooking` type**

In `src/components/admin/AdminDashboard.tsx`, inside `export type AdminBooking = { ... }`, add after the `service` line:

```typescript
  service: { name: string; appointmentDuration: number } | null;
  serviceId: string | null;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/bookings/route.ts src/components/admin/AdminDashboard.tsx
git commit -m "feat(admin): expose serviceId on admin bookings"
```

---

### Task 2: Extract `getAvailableSlotsForDate` helper

Move the single-date slot computation out of `/api/slots/route.ts` into a reusable, testable function so the admin reschedule route can re-validate the chosen slot with identical logic.

**Files:**
- Create: `src/lib/availability.ts`
- Create: `src/lib/availability.test.ts`
- Modify: `src/app/api/slots/route.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/availability.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the slot math so the test is deterministic (no real-time/day-lock dependency).
const generateAvailableSlots = vi.hoisted(() => vi.fn());
const resolveScheduleForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/slots", () => ({ generateAvailableSlots, resolveScheduleForDate }));

// Mock Sanity fetch — return canned docs keyed by the first tag.
const sanityFetch = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/fetch", () => ({ sanityFetch }));

import { getAvailableSlotsForDate } from "./availability";

function mockSanityByTag(map: Record<string, unknown>) {
  sanityFetch.mockImplementation(({ tags }: { tags: string[] }) =>
    Promise.resolve(map[tags[0]] ?? null),
  );
}

describe("getAvailableSlotsForDate", () => {
  beforeEach(() => {
    generateAvailableSlots.mockReset();
    resolveScheduleForDate.mockReset();
    sanityFetch.mockReset();
    resolveScheduleForDate.mockReturnValue({ defaultSlotDuration: 20, bufferMinutes: 0, days: [] });
    generateAvailableSlots.mockReturnValue(["09:00", "09:20"]);
  });

  it("returns null when the service is not found", async () => {
    mockSanityByTag({
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [] },
      customAvailability: null,
      booking: [],
      slotLock: [],
      service: null, // not found
    });

    const result = await getAvailableSlotsForDate("2026-07-15", "missing");
    expect(result).toBeNull();
  });

  it("returns slots and threads booked/held times into generateAvailableSlots", async () => {
    mockSanityByTag({
      weeklySchedule: { defaultSlotDuration: 20, bufferMinutes: 0, bookingWindowDays: 30, days: [] },
      seasonalSchedule: null,
      blockedDate: { dates: [{ date: "2026-07-20" }] },
      customAvailability: null,
      booking: [{ slotTime: "10:00", service: { _id: "svc" } }],
      slotLock: [{ slotTime: "11:00", status: "booked", heldUntil: null }],
      service: { name: "Vizsgálat", appointmentDuration: 20 },
    });

    const result = await getAvailableSlotsForDate("2026-07-15", "svc");

    expect(result).toEqual({ slots: ["09:00", "09:20"], serviceName: "Vizsgálat", durationMinutes: 20 });
    const arg = generateAvailableSlots.mock.calls[0][0];
    expect(arg.bookedSlots).toContain("10:00");
    expect(arg.heldSlots).toContain("11:00");
    expect(arg.blockedDates).toContain("2026-07-20");
    expect(arg.serviceDurationMinutes).toBe(20);
    expect(arg.date).toBe("2026-07-15");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/availability.test.ts`
Expected: FAIL — `Failed to resolve import "./availability"` (file doesn't exist yet).

- [ ] **Step 3: Create the helper**

Create `src/lib/availability.ts`. This is the existing `/api/slots` computation lifted verbatim into a function, with an optional `nowMs` passthrough for testability:

```typescript
import { defineQuery } from "next-sanity";
import { generateAvailableSlots, resolveScheduleForDate } from "@/lib/slots";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  bookingsForDateQuery,
  customAvailabilityForDateQuery,
  seasonalScheduleForDateQuery,
  slotLocksForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";

const serviceByIdQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

export interface DayAvailability {
  slots: string[];
  serviceName: string;
  durationMinutes: number;
}

/**
 * Returns the free slot times for a single date + service, applying the weekly
 * schedule, seasonal overrides, custom availability, blocked dates, existing
 * bookings and slot locks. Returns null if the service does not exist.
 *
 * @param nowMs optional clock override forwarded to generateAvailableSlots (tests).
 */
export async function getAvailableSlotsForDate(
  date: string,
  serviceId: string,
  nowMs?: number,
): Promise<DayAvailability | null> {
  const [schedule, seasonal, blockedDatesDoc, customAvail, bookings, slotLocks, service] =
    await Promise.all([
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        bookingWindowDays: number | null;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
      sanityFetch<{
        _id: string;
        startDate: string;
        endDate: string;
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({ query: seasonalScheduleForDateQuery, params: { date }, tags: ["seasonalSchedule"] }),
      sanityFetch<{ dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
      }),
      sanityFetch<{
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        services: Array<{ _id: string }> | null;
      } | null>({ query: customAvailabilityForDateQuery, params: { date }, tags: ["customAvailability"] }),
      sanityFetch<Array<{ _id: string; slotDate: string; slotTime: string; service: { _id: string } | null }>>({
        query: bookingsForDateQuery,
        params: { date },
        tags: ["booking"],
      }),
      sanityFetch<Array<{ _id: string; slotDate: string; slotTime: string; status: string; heldUntil: string | null }>>({
        query: slotLocksForDateQuery,
        params: { date },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceByIdQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

  if (!service) return null;

  const bookedSlots = bookings.map((b) => b.slotTime).filter(Boolean);

  const now = new Date().toISOString();
  const heldSlots = slotLocks
    .filter(
      (lock) =>
        lock.status === "booked" ||
        (lock.status === "held" && lock.heldUntil != null && lock.heldUntil > now),
    )
    .map((lock) => lock.slotTime)
    .filter(Boolean);

  const defaultSchedule = schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] };
  let scheduleForSlots = resolveScheduleForDate(date, defaultSchedule, seasonal ? [seasonal] : []);

  if (customAvail) {
    const appliesToService =
      !customAvail.services ||
      customAvail.services.length === 0 ||
      customAvail.services.some((s) => s._id === serviceId);

    if (appliesToService) {
      const dayOfWeek = new Date(date).getDay();
      scheduleForSlots = {
        ...scheduleForSlots,
        days: scheduleForSlots.days.map((day) =>
          day.dayOfWeek === dayOfWeek
            ? { ...day, isDayOff: false, startTime: customAvail.startTime, endTime: customAvail.endTime }
            : day,
        ),
      };
      if (!scheduleForSlots.days.find((d) => d.dayOfWeek === dayOfWeek)) {
        scheduleForSlots.days.push({
          dayOfWeek,
          isDayOff: false,
          startTime: customAvail.startTime,
          endTime: customAvail.endTime,
        });
      }
    }
  }

  let blockedDates = (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean);
  if (customAvail) {
    const appliesToService =
      !customAvail.services ||
      customAvail.services.length === 0 ||
      customAvail.services.some((s) => s._id === serviceId);
    if (appliesToService) blockedDates = blockedDates.filter((d) => d !== date);
  }

  const serviceDurationMinutes = service.appointmentDuration ?? 20;

  const slots = generateAvailableSlots({
    schedule: scheduleForSlots,
    blockedDates,
    bookedSlots,
    heldSlots,
    date,
    serviceDurationMinutes,
    maxDaysAhead: schedule?.bookingWindowDays ?? 30,
    nowMs,
  });

  return { slots, serviceName: service.name, durationMinutes: serviceDurationMinutes };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/availability.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Refactor `/api/slots` to delegate to the helper**

Replace the body of `src/app/api/slots/route.ts` with the thin version below. This preserves the exact response shape (`{ slots, date, serviceName, durationMinutes }`):

```typescript
import { getAvailableSlotsForDate } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return Response.json(
      { error: "A 'date' és 'serviceId' paraméterek megadása kötelező." },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Érvénytelen dátumformátum. Várható formátum: YYYY-MM-DD." },
      { status: 400 },
    );
  }

  try {
    const result = await getAvailableSlotsForDate(date, serviceId);
    if (!result) {
      return Response.json({ error: "A megadott szolgáltatás nem található." }, { status: 404 });
    }
    return Response.json({
      slots: result.slots,
      date,
      serviceName: result.serviceName,
      durationMinutes: result.durationMinutes,
    });
  } catch (error) {
    console.error("[/api/slots] Error:", error);
    return Response.json({ error: "Hiba történt az időpontok lekérdezésekor." }, { status: 500 });
  }
}
```

- [ ] **Step 6: Typecheck and run full test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests pass (including existing `slots.test.ts`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/availability.ts src/lib/availability.test.ts src/app/api/slots/route.ts
git commit -m "refactor(slots): extract getAvailableSlotsForDate helper"
```

---

### Task 3: Admin reschedule API route

**Files:**
- Create: `src/app/api/admin/booking-reschedule/route.ts`
- Create: `src/app/api/admin/booking-reschedule/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/api/admin/booking-reschedule/route.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));

const getAvailableSlotsForDate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/availability", () => ({ getAvailableSlotsForDate }));

const writeClient = vi.hoisted(() => ({
  fetch: vi.fn(),
  createIfNotExists: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/sanity-write-client", () => ({ getWriteClient: () => writeClient }));

vi.mock("@/lib/google-calendar", () => ({ createCalendarEvent: vi.fn(), deleteCalendarEvent: vi.fn() }));
vi.mock("@/lib/email", () => ({ isEmailConfigured: () => false, sendEmail: vi.fn() }));
vi.mock("@/lib/booking-email", () => ({ buildRescheduleEmail: vi.fn(() => "<html>") }));

import { POST } from "./route";

// Chainable patch builder: .set().unset().ifRevisionId().commit()
function makePatch() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.unset = vi.fn(() => chain);
  chain.ifRevisionId = vi.fn(() => chain);
  chain.commit = vi.fn(() => Promise.resolve({}));
  return chain;
}

function req(body: unknown) {
  return new Request("http://localhost/api/admin/booking-reschedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const confirmedBooking = {
  _id: "booking-1",
  patientName: "Teszt Anna",
  patientEmail: "anna@example.com",
  reservationNumber: "M-ABCD12",
  service: { name: "Vizsgálat", appointmentDuration: 20 },
  serviceId: "svc-1",
  slotDate: "2026-07-15",
  slotTime: "09:00",
  managementToken: "tok-1",
  googleCalendarEventId: null,
};

beforeEach(() => {
  getSession.mockReset();
  getAvailableSlotsForDate.mockReset();
  writeClient.fetch.mockReset();
  writeClient.createIfNotExists.mockReset().mockResolvedValue({});
  writeClient.patch.mockReset().mockImplementation(() => makePatch());
  getSession.mockResolvedValue({ user: { role: "admin" } });
  getAvailableSlotsForDate.mockResolvedValue({ slots: ["10:00", "10:20"], serviceName: "Vizsgálat", durationMinutes: 20 });
});

describe("POST /api/admin/booking-reschedule", () => {
  it("rejects non-admin sessions with 403", async () => {
    getSession.mockResolvedValue({ user: { role: "user" } });
    const res = await POST(req({ bookingId: "booking-1", newDate: "2026-07-15", newTime: "10:00", notifyPatient: false }));
    expect(res.status).toBe(403);
  });

  it("rejects when booking is not confirmed", async () => {
    writeClient.fetch.mockResolvedValueOnce({ ...confirmedBooking, status: "cancelled" });
    const res = await POST(req({ bookingId: "booking-1", newDate: "2026-07-15", newTime: "10:00", notifyPatient: false }));
    expect(res.status).toBe(400);
  });

  it("rejects a no-op (same date and time)", async () => {
    writeClient.fetch.mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" });
    const res = await POST(req({ bookingId: "booking-1", newDate: "2026-07-15", newTime: "09:00", notifyPatient: false }));
    expect(res.status).toBe(400);
  });

  it("rejects when the new slot is not in the available list", async () => {
    writeClient.fetch.mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" });
    getAvailableSlotsForDate.mockResolvedValue({ slots: ["11:00"], serviceName: "Vizsgálat", durationMinutes: 20 });
    const res = await POST(req({ bookingId: "booking-1", newDate: "2026-07-15", newTime: "10:00", notifyPatient: false }));
    expect(res.status).toBe(409);
  });

  it("returns 409 when the slotLock is already booked", async () => {
    writeClient.fetch
      .mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" }) // booking
      .mockResolvedValueOnce({ _id: "slotLock-x", _rev: "r1", status: "booked" }); // new slot lock
    const res = await POST(req({ bookingId: "booking-1", newDate: "2026-07-15", newTime: "10:00", notifyPatient: false }));
    expect(res.status).toBe(409);
  });

  it("patches the booking and swaps slot locks on success", async () => {
    writeClient.fetch
      .mockResolvedValueOnce({ ...confirmedBooking, status: "confirmed" }) // booking
      .mockResolvedValueOnce({ _id: "slotLock-new", _rev: "r1", status: "available" }); // new slot lock
    const res = await POST(req({ bookingId: "booking-1", newDate: "2026-07-15", newTime: "10:00", notifyPatient: false }));
    expect(res.status).toBe(200);
    // booking patched to new date/time
    expect(writeClient.patch).toHaveBeenCalledWith("booking-1");
    // new slot lock id and old slot lock id both patched
    expect(writeClient.patch).toHaveBeenCalledWith("slotLock-new");
    expect(writeClient.patch).toHaveBeenCalledWith("slotLock-2026-07-15-09-00");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/app/api/admin/booking-reschedule/route.test.ts`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Create the route**

Create `src/app/api/admin/booking-reschedule/route.ts`:

```typescript
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAvailableSlotsForDate } from "@/lib/availability";
import { buildRescheduleEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

const AdminRescheduleSchema = z.object({
  bookingId: z.string().min(1, "A foglalás azonosítója megadása kötelező."),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  newTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
  notifyPatient: z.boolean().optional().default(true),
});

type BookingForReschedule = {
  _id: string;
  patientName: string;
  patientEmail: string;
  reservationNumber: string;
  service: { name: string; appointmentDuration: number } | null;
  serviceId: string | null;
  slotDate: string;
  slotTime: string;
  status: string;
  managementToken: string;
  googleCalendarEventId?: string | null;
};

// POST /api/admin/booking-reschedule
// Admin-only. Moves a confirmed booking to another free slot (date + time only).
// No 24h restriction (admin bypass). No payment change. Patient optionally emailed.
export async function POST(request: Request): Promise<Response> {
  try {
    // ── 1. Admin session check ─────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
    }

    // ── 2. Parse and validate body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
    }
    const parsed = AdminRescheduleSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }
    const { bookingId, newDate, newTime, notifyPatient } = parsed.data;

    // ── 3. Fetch booking by _id ────────────────────────────────────────────────
    const booking = await getWriteClient().fetch<BookingForReschedule | null>(
      `*[_type == "booking" && _id == $bookingId][0]{
        _id, patientName, patientEmail, reservationNumber,
        service->{name, appointmentDuration}, "serviceId": service._ref,
        slotDate, slotTime, status, managementToken, googleCalendarEventId
      }`,
      { bookingId },
    );

    if (!booking) {
      return Response.json({ error: "A foglalás nem található." }, { status: 404 });
    }
    if (booking.status !== "confirmed") {
      return Response.json({ error: "Ez az időpont már nem aktív." }, { status: 400 });
    }

    // ── 4. Reject no-op ────────────────────────────────────────────────────────
    if (newDate === booking.slotDate && newTime === booking.slotTime) {
      return Response.json(
        { error: "Ez a jelenlegi időpont. Kérjük, válasszon másik időpontot." },
        { status: 400 },
      );
    }

    // ── 5. Server-side authority: the new slot must be genuinely free ──────────
    if (!booking.serviceId) {
      return Response.json({ error: "A foglaláshoz nincs szolgáltatás rendelve." }, { status: 400 });
    }
    const availability = await getAvailableSlotsForDate(newDate, booking.serviceId);
    if (!availability || !availability.slots.includes(newTime)) {
      return Response.json(
        { error: "Ez az időpont nem foglalható. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    // ── 6. Atomic swap — lock the new slot FIRST (critical section) ────────────
    const newSlotId = `${newDate}T${newTime}:00`;
    const newSlotLockDocId = `slotLock-${newDate}-${newTime.replace(":", "-")}`;

    await getWriteClient().createIfNotExists({
      _id: newSlotLockDocId,
      _type: "slotLock",
      slotId: newSlotId,
      status: "available",
    });

    type SlotLock = { _id: string; _rev: string; status: string };
    const newSlotLock = await getWriteClient().fetch<SlotLock | null>(
      `*[_type == "slotLock" && slotId == $slotId][0]{_id, _rev, status}`,
      { slotId: newSlotId },
    );
    if (!newSlotLock) {
      return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
    }
    if (newSlotLock.status === "booked") {
      return Response.json(
        { error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    try {
      await getWriteClient()
        .patch(newSlotLock._id)
        .ifRevisionId(newSlotLock._rev)
        .set({ status: "booked", bookingRef: { _type: "reference", _ref: booking._id } })
        .commit();
    } catch {
      return Response.json(
        { error: "Ez az időpont már foglalt. Kérjük, válasszon másikat." },
        { status: 409 },
      );
    }

    // ── 7. Release the old slot lock (non-fatal if missing) ────────────────────
    const oldSlotLockDocId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;
    try {
      await getWriteClient()
        .patch(oldSlotLockDocId)
        .set({ status: "available" })
        .unset(["bookingRef"])
        .commit();
    } catch (err) {
      console.error(
        "[api/admin/booking-reschedule] Partial reschedule: new slot locked but old slot not released.",
        err,
      );
    }

    // ── 8. Patch the booking with the new date/time ────────────────────────────
    const oldDate = booking.slotDate;
    const oldTime = booking.slotTime;
    await getWriteClient()
      .patch(booking._id)
      .set({ slotDate: newDate, slotTime: newTime, reminderSent: false })
      .commit();

    // ── 9. Update Google Calendar (fire-and-forget) ────────────────────────────
    void (async () => {
      try {
        if (booking.googleCalendarEventId) {
          await deleteCalendarEvent(booking.googleCalendarEventId);
        }
        const newEventId = await createCalendarEvent({
          summary: `${
            booking.service?.name?.startsWith("Nőgyógyász")
              ? "Nőgyógyászati vizsgálat"
              : (booking.service?.name ?? "Foglalt szolgáltatás")
          } — ${booking.patientName}`,
          description: `Foglalási szám: ${booking.reservationNumber}\nPáciens: ${booking.patientName}\nTelefon: ${booking.patientEmail}`,
          date: newDate,
          startTime: newTime,
          durationMinutes: booking.service?.appointmentDuration ?? 20,
        });
        if (newEventId) {
          await getWriteClient().patch(booking._id).set({ googleCalendarEventId: newEventId }).commit();
        }
      } catch (err) {
        console.error("[api/admin/booking-reschedule] Calendar update failed:", err);
      }
    })();

    // ── 10. Notify the patient (fire-and-forget) ───────────────────────────────
    if (notifyPatient && isEmailConfigured()) {
      void sendRescheduleEmailAsync({
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        reservationNumber: booking.reservationNumber,
        serviceName: booking.service?.name?.startsWith("Nőgyógyász")
          ? "Nőgyógyászati vizsgálat"
          : (booking.service?.name ?? "Szolgáltatás"),
        oldDate,
        oldTime,
        newDate,
        newTime,
        managementToken: booking.managementToken,
      });
    }

    return Response.json(
      { success: true, message: "Az időpont sikeresen áthelyezve." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/admin/booking-reschedule] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}

async function sendRescheduleEmailAsync({
  patientName,
  patientEmail,
  reservationNumber,
  serviceName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  managementToken,
}: {
  patientName: string;
  patientEmail: string;
  reservationNumber: string;
  serviceName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  managementToken: string;
}) {
  try {
    const formatHuDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
    const manageUrl = `${appUrl}/foglalas/${managementToken}`;

    const html = buildRescheduleEmail({
      patientName,
      serviceName,
      reservationNumber,
      oldDate: formatHuDate(oldDate),
      oldTime,
      newDate: formatHuDate(newDate),
      newTime,
      manageUrl,
      clinicPhone: "+36 70 639 5239",
      clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
    });

    await sendEmail({
      to: patientEmail,
      subject: "Időpont áthelyezve a rendelő által — Mórocz Medical",
      html,
    });
  } catch (err) {
    console.error("[api/admin/booking-reschedule] Failed to send reschedule email:", err);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/app/api/admin/booking-reschedule/route.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `createCalendarEvent`/`deleteCalendarEvent` are not both exported from `@/lib/google-calendar`, open that file and confirm the export names, then adjust the import.)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/booking-reschedule/
git commit -m "feat(admin): booking-reschedule API route"
```

---

### Task 4: Reschedule modal component

**Files:**
- Create: `src/components/admin/AdminRescheduleModal.tsx`

- [ ] **Step 1: Create the modal**

Create `src/components/admin/AdminRescheduleModal.tsx`. It fetches free slots for the chosen date via `/api/slots`, lets the admin pick one, and submits to the new route. Notify checkbox defaults on.

```tsx
"use client";

import { useEffect, useState } from "react";

interface AdminRescheduleModalProps {
  bookingId: string;
  patientName: string;
  serviceId: string;
  serviceName: string | null;
  currentDate: string;
  currentTime: string;
  onClose: () => void;
  onRescheduled: () => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export default function AdminRescheduleModal({
  bookingId,
  patientName,
  serviceId,
  serviceName,
  currentDate,
  currentTime,
  onClose,
  onRescheduled,
}: AdminRescheduleModalProps) {
  const [date, setDate] = useState(currentDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch free slots whenever the date changes ─────────────────────────────
  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    setError(null);
    void fetch(`/api/slots?date=${date}&serviceId=${encodeURIComponent(serviceId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { slots?: string[] }) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, serviceId]);

  async function handleConfirm() {
    if (!selectedTime) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/booking-reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, newDate: date, newTime: selectedTime, notifyPatient }),
      });
      if (res.ok) {
        onRescheduled();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Ismeretlen hiba történt.");
        // A 409 likely means the slot was just taken — refresh the list.
        if (res.status === 409) {
          setSelectedTime(null);
          void fetch(`/api/slots?date=${date}&serviceId=${encodeURIComponent(serviceId)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((d: { slots?: string[] }) => setSlots(d.slots ?? []))
            .catch(() => {});
        }
      }
    } catch {
      setError("Hálózati hiba. Kérjük, próbálja újra.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isNoOp = date === currentDate && selectedTime === currentTime;

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop close on click */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9998 }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          zIndex: 9999,
          width: "90%",
          maxWidth: "32rem",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid #e8eaf0" }}>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#242a5f" }}>
            Időpont áthelyezése
          </h2>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Current booking */}
          <div
            style={{
              backgroundColor: "#f8f9fb",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginBottom: "1.25rem",
              border: "1px solid #e8eaf0",
            }}
          >
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", fontWeight: 600, color: "#242a5f" }}>
              {patientName}
            </p>
            {serviceName && (
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.8125rem", color: "#64748b" }}>{serviceName}</p>
            )}
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b" }}>
              Jelenleg: {formatDate(currentDate)}, {currentTime}
            </p>
          </div>

          {/* Date picker */}
          <label
            htmlFor="reschedule-date"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#242a5f", marginBottom: "0.5rem" }}
          >
            Új dátum
          </label>
          <input
            id="reschedule-date"
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: "#1A1D2D",
              boxSizing: "border-box",
              marginBottom: "1.25rem",
              fontFamily: "inherit",
            }}
          />

          {/* Slot list */}
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#242a5f", margin: "0 0 0.5rem" }}>
            Szabad időpontok
          </p>
          {slotsLoading && <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>Betöltés...</p>}
          {!slotsLoading && slots.length === 0 && (
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Nincs szabad időpont ezen a napon.
            </p>
          )}
          {!slotsLoading && slots.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {slots.map((t) => {
                const selected = t === selectedTime;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    disabled={isSubmitting}
                    style={{
                      padding: "0.5rem 0.875rem",
                      borderRadius: "0.5rem",
                      border: selected ? "1px solid #099268" : "1px solid #e8eaf0",
                      backgroundColor: selected ? "rgba(153,206,183,0.15)" : "#ffffff",
                      color: selected ? "#099268" : "#1A1D2D",
                      fontSize: "0.875rem",
                      fontWeight: selected ? 700 : 500,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}

          {/* Notify checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1.25rem",
              fontSize: "0.875rem",
              color: "#242a5f",
            }}
          >
            <input
              type="checkbox"
              checked={notifyPatient}
              disabled={isSubmitting}
              onChange={(e) => setNotifyPatient(e.target.checked)}
            />
            Páciens értesítése e-mailben
          </label>

          {error && (
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.875rem",
                color: "#ef4444",
                backgroundColor: "rgba(239,68,68,0.08)",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e8eaf0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: "#ffffff",
              color: "#64748b",
              border: "1px solid #e8eaf0",
              borderRadius: "0.5rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Mégsem
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting || !selectedTime || isNoOp}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: !selectedTime || isNoOp ? "#94a3b8" : "#099268",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: isSubmitting || !selectedTime || isNoOp ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            {isSubmitting ? "Áthelyezés..." : "Időpont áthelyezése"}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminRescheduleModal.tsx
git commit -m "feat(admin): reschedule modal component"
```

---

### Task 5: Wire the reschedule action into `AdminPatientModal`

**Files:**
- Modify: `src/components/admin/AdminPatientModal.tsx`

- [ ] **Step 1: Import the modal and add state**

At the top of `AdminPatientModal.tsx`, add the import next to the existing imports:

```typescript
import AdminRescheduleModal from "@/components/admin/AdminRescheduleModal";
```

Inside the component, next to the other `useState` declarations (e.g. after `const [menuOpen, setMenuOpen] = useState(false);`), add:

```typescript
  const [showReschedule, setShowReschedule] = useState(false);
```

- [ ] **Step 2: Add a `canReschedule` gate**

Next to the existing `canCancel` / `canComplete` derivations, add (note: admin bypasses the 24h window, so no `isWithin24Hours` check):

```typescript
  const canReschedule = !isCancelled && !isCompleted && !isNoShow && booking.serviceId != null;
```

- [ ] **Step 3: Show the menu button when reschedule is available**

Update the two `(canCancel || canComplete || canMarkNoShow || canEditCompleted)` conditions (the menu button at `src/components/admin/AdminPatientModal.tsx:275` and the dropdown at `:288`) to also include `canReschedule`:

```typescript
        {(canCancel || canComplete || canMarkNoShow || canEditCompleted || canReschedule) && (
```

(Apply the same addition to both occurrences.)

- [ ] **Step 4: Add the menu item**

Inside the dropdown menu, immediately before the `{canCancel && (` block (around `src/components/admin/AdminPatientModal.tsx:383`), insert a reschedule item:

```tsx
            {canReschedule && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowReschedule(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  background: "none",
                  border: "none",
                  borderTop: canComplete || canEditCompleted ? "1px solid #e8eaf0" : "none",
                  color: "#2563eb",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  textAlign: "left" as const,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
                Időpont áthelyezése
              </button>
            )}
```

- [ ] **Step 5: Render the modal**

Just before the final closing of the component's outer JSX — immediately after the closing `</div>` of `S.modal` and before the closing `</div>` of `S.backdrop` (around `src/components/admin/AdminPatientModal.tsx:1430`) — render the modal conditionally. Place it INSIDE the backdrop div but it stops propagation via its own fixed overlay:

```tsx
        {showReschedule && booking.serviceId && (
          <AdminRescheduleModal
            bookingId={booking._id}
            patientName={booking.patientName}
            serviceId={booking.serviceId}
            serviceName={booking.service?.name ?? null}
            currentDate={booking.slotDate}
            currentTime={booking.slotTime}
            onClose={() => setShowReschedule(false)}
            onRescheduled={() => {
              setShowReschedule(false);
              onCancelled();
            }}
          />
        )}
```

Note: `onCancelled` is the dashboard's refresh callback (despite its name it just reloads bookings); reuse it so the calendar reflects the moved appointment.

- [ ] **Step 6: Typecheck and run the full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/AdminPatientModal.tsx
git commit -m "feat(admin): open reschedule modal from patient actions menu"
```

---

### Task 6: Lint + manual verification

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npx biome check src/lib/availability.ts src/app/api/admin/booking-reschedule/ src/components/admin/AdminRescheduleModal.tsx src/components/admin/AdminPatientModal.tsx src/app/api/slots/route.ts src/app/api/admin/bookings/route.ts`
Expected: no errors (fix any reported formatting/lint issues, then re-run).

- [ ] **Step 2: Full test + typecheck gate**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all green.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, then in the browser:
1. Log in as an admin, open `/admin`.
2. Open a confirmed booking → ⋮ menu → "Időpont áthelyezése".
3. Pick a date with free slots; confirm the slot list loads and excludes already-booked times.
4. Select a slot, leave "Páciens értesítése" checked, confirm.
5. Verify: the modal closes, the calendar shows the appointment at the new time, the old slot is freed (re-open the old day/time to confirm it's bookable), and a reschedule email arrives (if email is configured locally).
6. Re-open the moved booking → reschedule again to the SAME date+time → confirm it's rejected (no-op).

Expected: all behaviours as described. Note any deviation and stop.

- [ ] **Step 4: No commit needed** (verification only). If lint produced fixes, commit them:

```bash
git add -A
git commit -m "chore(admin): lint fixes for reschedule feature"
```

---

## Self-Review Notes

- **Spec coverage:** API route (Task 3) ✓; reuse public availability picker / 1A (Tasks 2 + 4, `/api/slots`) ✓; notify-patient optional default-on / 2B (Tasks 3 + 4) ✓; time-only scope / 3A (no service/payment mutation in route) ✓; atomic swap + optimistic lock + 409 ✓; admin bypass of 24h ✓; server-side re-validation authority (Task 3 step 5) ✓; old-lock-missing non-fatal ✓; no-op reject ✓; UI from `AdminPatientModal` ✓.
- **Type consistency:** `getAvailableSlotsForDate(date, serviceId, nowMs?)` defined in Task 2, consumed identically in Task 3 and `/api/slots`. `serviceId` added to `AdminBooking` (Task 1) is consumed in Tasks 4–5. `onRescheduled`/`onClose` props match between modal (Task 4) and caller (Task 5).
- **Deliberate limitation logged:** admin reschedule honours the public `bookingWindowDays` window (noted in File Structure).
