# Phase 14: Reminder Emails and Cron - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Patients automatically receive a reminder email approximately 24 hours before their appointment. Sent once per booking via a secured Vercel Cron job with idempotent delivery (no duplicates). The cron endpoint is protected by CRON_SECRET.

</domain>

<decisions>
## Implementation Decisions

### Reminder email content
- Minimal information only: date, time, location
- No action links (no cancel/reschedule buttons) — pure informational reminder
- Formal Hungarian tone (magázó): "Tisztelt Páciensünk, emlékeztetjük..."
- Same React Email visual template and branding as existing booking confirmation/cancellation emails

### Timing behavior
- Cron job runs every hour
- Query window: 20–28 hours ahead of current time (wider window to be forgiving if a cron cycle is missed)
- Timezone fixed to Europe/Budapest for all scheduling logic
- No reminder for short-notice bookings — if the 20–28h window was already missed when the booking was created, skip the reminder entirely

### Edge case handling
- If a booking is cancelled after the reminder was sent: do nothing — the cancellation email already notifies the patient
- Multiple appointments on the same day for one patient: send one combined email listing all appointments
- Failed email sends (Resend provider failure): mark as pending, retry on the next hourly cron run
- Cron activity logged to a DB log table for auditability (each run, emails sent, failures)

### Claude's Discretion
- Idempotency mechanism (DB flag on bookings vs separate reminder tracking table)
- Exact DB log table schema
- Email subject line wording (within formal Hungarian tone)
- How to batch/group appointments for combined emails

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow existing email template patterns already established in the codebase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-reminder-emails-and-cron*
*Context gathered: 2026-02-23*
