# Phase 12: Patient Account - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

**SCOPE CHANGE from original roadmap:** No dedicated patient account page (/fiokom). Instead, patients manage their bookings via **token-based links in the confirmation email**. This phase delivers:

1. A booking management page at `/foglalas/:token` accessible via unique email links (no login required)
2. Cancel an appointment (24h window enforced) from the management page
3. Reschedule an appointment (24h window enforced) with atomic slot swap
4. Cancellation confirmation email (Hungarian)
5. Reschedule-specific email showing old → new time (Hungarian)
6. Appointment reminder email sent 24h before (Hungarian, no action links)
7. Update Phase 11's confirmation email to include cancel/reschedule links

**Removed from original scope:** ACCT-01 (patient account page at /fiokom) — patients do not get a dedicated account page.

</domain>

<decisions>
## Implementation Decisions

### Booking Management Page (/foglalas/:token)
- URL structure: `/foglalas/:token` where token is a unique, hard-to-guess value
- **No authentication required** — the token in the URL is sufficient for access
- Page shows appointment summary (service, date, time) with Cancel and Reschedule action buttons
- Layout: simple centered card, minimal and focused — no site header/nav
- Invalid or expired token: friendly Hungarian error message + button to book a new appointment at /idopontfoglalas

### Cancellation Flow
- Patient clicks Cancel → **confirmation dialog** appears (modal or inline) asking "Biztosan lemondja?" with appointment details repeated
- Patient must explicitly confirm to proceed
- After successful cancellation: Hungarian success message + prominent "Új időpont foglalása" button linking to /idopontfoglalas
- The cancelled slot becomes immediately available for other patients
- Cancellation confirmation email sent automatically (Hungarian)

### 24-Hour Cutoff
- Both cancel AND reschedule are blocked within 24 hours of the appointment
- When blocked: Hungarian error message explaining the 24h window has passed + clinic phone number for late cancellations
- The Reschedule button should also be disabled/hidden when within 24h

### Reschedule Experience
- **Inline date/time picker** — the management page expands to show available dates and time slots directly (no redirect to /idopontfoglalas)
- Service stays the same — patient only picks a new date and time
- **Atomic swap** — old slot released and new slot booked in one operation; no window where patient has zero bookings
- On slot conflict: Hungarian error that the slot was taken, **old appointment stays unchanged**, patient can try another slot
- After successful reschedule: **reschedule-specific email** saying "Az időpontja áthelyezésre került: [régi dátum] → [új dátum]"

### Email Updates
- **Confirmation email** (Phase 11 existing): Add cancel/reschedule links pointing to `/foglalas/:token`
- **Reminder email** (NEW): Sent exactly 24 hours before the appointment. Just a reminder with appointment details — **no cancel/reschedule links** (since the 24h window has passed by then)
- **Cancellation email** (NEW): Hungarian confirmation that the appointment has been cancelled
- **Reschedule email** (NEW): Hungarian email showing old time → new time with new appointment details

### Claude's Discretion
- Token generation algorithm (UUID, nanoid, etc.)
- Exact card styling and spacing on the management page
- Reminder email scheduling mechanism (cron, scheduled function, etc.)
- Inline date/time picker component choice (reuse from Phase 11 booking wizard or new)
- Exact Hungarian wording for all messages (following existing patterns from Phase 11 emails)
- How to handle edge case: patient opens management link after appointment has already passed

</decisions>

<specifics>
## Specific Ideas

- The management page should feel self-contained — a simple card, not a full site experience
- Reminder email is purely informational (no action buttons) since the 24h cutoff aligns with when it's sent
- The reschedule flow should reuse the date/time slot UI from the booking wizard (Phase 11) but embedded inline
- Atomic swap for rescheduling is critical — never leave the patient in a state where their old appointment is cancelled but no new one exists

</specifics>

<deferred>
## Deferred Ideas

- Patient account page (/fiokom) showing all past and upcoming appointments — deliberately excluded from this phase; may be added later if needed
- Add cancel/reschedule links to the reminder email (currently excluded because 24h cutoff aligns with reminder timing)

</deferred>

---

*Phase: 12-patient-account*
*Context gathered: 2026-02-22*
