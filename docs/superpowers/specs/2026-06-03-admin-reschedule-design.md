# Admin Reschedule — Design

**Date:** 2026-06-03
**Status:** Approved (pending implementation)

## Goal

Let an `/admin` user move a confirmed patient booking to another **free** time
slot. The change covers **date and time only** — service, patient details, and
payment are untouched. The patient is optionally notified by email.

Decisions made during brainstorming:

- **Slot picker:** reuse the public availability picker — admin only sees
  genuinely-free slots (driven by `generateAvailableSlots`).
- **Notify patient:** optional checkbox in the modal, **default on**.
- **Scope:** time only. No service change, no payment change.

## Non-goals

- Changing the service (and therefore the slot duration).
- Any Stripe/payment mutation. The 10,000 Ft deposit stays with the booking.
- A 24-hour cutoff. Admins bypass the patient-side restriction.

## Architecture

The feature reuses three existing patterns:

- **Admin cancel route** (`src/app/api/admin/booking-cancel/route.ts`) — for
  admin auth, booking fetch, slot-lock release, and dashboard refresh wiring.
- **Patient reschedule route** (`src/app/api/booking-reschedule/route.ts`) — for
  the atomic slot-swap with optimistic locking and calendar/email handling.
- **Availability logic** (`src/lib/slots.ts` + `/api/slots/availability`) — as
  the single source of truth for which slots are free.

No new Sanity fields. No DB schema changes.

## Component 1 — API route `POST /api/admin/booking-reschedule`

**Auth:** verify `session.user.role === "admin"` (same as `booking-cancel`).

**Input:** `{ bookingId: string, newDate: string, newTime: string, notifyPatient: boolean }`

**Flow:**

1. Fetch booking by `_id`. Require `status === "confirmed"`; otherwise reject
   with a clear error.
2. Admin bypass: no 24-hour restriction. Still call `assertDayStillOpen(newDate)`
   so a booking can't move into a day-locked day.
3. Reject the no-op case where `newDate`/`newTime` equal the current slot.
4. **Server-side slot re-validation (authority):** recompute
   `generateAvailableSlots()` for `newDate` using the booking's service duration
   and confirm `newTime` is present. The UI list is only a convenience; this
   check is what actually authorizes the move.
5. **Atomic swap** (copy the patient-reschedule pattern):
   - Create/claim the new `slotLock` (`slotLock-${newDate}-${HH-MM}`) with
     `ifRevisionId()` optimistic locking **first**. If already booked/held,
     return **409**.
   - Then release the old `slotLock`: set `status: "available"`, unset
     `bookingRef`. If the old lock is missing, log a warning — non-fatal (same
     as cancel).
6. Patch the booking: `slotDate = newDate`, `slotTime = newTime`,
   `status` stays `"confirmed"`, `reminderSent: false`.
7. **Google Calendar** (fire-and-forget): delete the old event, create a new one.
8. **Email** (fire-and-forget): if `notifyPatient`, send the reschedule email
   reusing the existing reschedule template.
9. Return success.

**Payment:** no Stripe call. `paymentStatus`, `stripePaymentIntentId`, refund
fields all unchanged.

## Component 2 — UI `AdminRescheduleModal.tsx`

- Opened from a new **"Reschedule"** button in `AdminPatientModal.tsx`, beside
  the existing Cancel action.
- Contains:
  - A date picker.
  - A free-slot list for the chosen date, fetched from the existing
    `/api/slots/availability` endpoint using the booking's service (so only real
    free slots appear — decision 1A).
  - A **"Notify patient by email"** checkbox, **default on** (decision 2B).
- On confirm → call `POST /api/admin/booking-reschedule` → on success, close and
  refresh the dashboard via the same refresh path the cancel modal uses.

## Error handling / edge cases

- New slot claimed by someone between list-load and submit → **409**; the modal
  shows "that slot was just taken, pick another."
- Booking not `confirmed` → reject with a friendly message.
- No-op (same slot) → reject.
- Missing old slot lock → log warning, continue (non-fatal).
- Stale UI cannot force an invalid slot because step 4 re-validates server-side.

## Testing

- Unit-test the route's decision branches:
  - happy path (valid free slot → booking patched, locks swapped),
  - slot already taken → 409,
  - non-confirmed booking → reject,
  - no-op same-slot → reject,
  - non-admin session → reject.
- Reuse the existing `slots.ts` test coverage rather than re-deriving
  availability logic.
- Calendar and email are fire-and-forget; assert they're invoked but don't block
  the response.
