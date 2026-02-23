---
phase: 14-reminder-emails-and-cron
plan: "01"
subsystem: cron-email
tags: [cron, email, reminders, vercel, drizzle, sanity, gmail-api, idempotency]
dependency_graph:
  requires: [13-admin-dashboard]
  provides: [reminder-email-cron, cron-audit-log, combined-reminder-email]
  affects: [src/lib/booking-email.ts, src/lib/db/schema.ts]
tech_stack:
  added: [vercel-cron, drizzle-integer, intl-timezone-api]
  patterns: [idempotent-email-delivery, grouped-email-per-patient, dst-safe-timezone, combined-appointment-email]
key_files:
  created:
    - vercel.json
    - src/app/api/cron/reminders/route.ts
    - drizzle/0001_wooden_outlaw_kid.sql
  modified:
    - src/lib/db/schema.ts
    - src/lib/booking-email.ts
decisions:
  - "Intl.DateTimeFormat longOffset used to resolve Budapest CET/CEST dynamically — no hardcoded UTC offsets"
  - "Hybrid query strategy: broad GROQ date filter + precise app-side UTC window filtering"
  - "Group by patientEmail: one combined email for all same-day appointments"
  - "reminderSent=true only set after confirmed sendEmail() success — failed sends stay retryable"
  - "isEmailConfigured() guard: logs run with 0 attempts when Gmail not configured, returns 200"
metrics:
  duration: "~5 min"
  completed: "2026-02-23"
  tasks_completed: 2
  files_changed: 5
---

# Phase 14 Plan 01: Reminder Email Cron System Summary

**One-liner:** Hourly Vercel Cron endpoint with CRON_SECRET auth, DST-safe Budapest timezone window (20-28h), grouped patient emails via Gmail API, idempotent reminderSent patching, Postgres audit logging, and combined multi-appointment email support.

## What Was Built

### Task 1: cronRunLog DB table + extended buildReminderEmail

**`src/lib/db/schema.ts`** — Added `cronRunLog` pgTable with 7 columns:
- `id` (text, PK via `crypto.randomUUID()`)
- `runAt` (timestamp)
- `remindersAttempted`, `remindersSucceeded`, `remindersFailed` (integer)
- `errorDetails` (text, JSON string of per-email errors)
- `durationMs` (integer)
- Also added `integer` import from `drizzle-orm/pg-core`

**`drizzle/0001_wooden_outlaw_kid.sql`** — Migration SQL generated via `npx drizzle-kit generate`.

**`src/lib/booking-email.ts`** — Refactored `buildReminderEmail()` signature from single `serviceName/date/time` to `appointments: Array<{serviceName, date, time}>`:
- Singular: "Emlékeztető: holnapi időpontja" / "Tisztelt Páciensünk, emlékeztetjük, hogy holnap időpontja van nálunk."
- Plural: "Emlékeztető: holnapi időpontjai" / "...hogy holnap időpontjai vannak nálunk."
- N appointment detail cards rendered with 12px spacing between them
- Formal Hungarian magázó tone throughout

### Task 2: vercel.json + GET /api/cron/reminders route

**`vercel.json`** — Registers hourly cron: `{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }`. Requires Vercel Pro plan.

**`src/app/api/cron/reminders/route.ts`** — Complete cron handler:

1. **Auth guard:** `Authorization: Bearer ${CRON_SECRET}` — returns 401 if missing/wrong
2. **isEmailConfigured() guard:** Logs run, returns 200 with note if Gmail not set up
3. **Timezone window:** `appointmentToUtcMs()` uses `Intl.DateTimeFormat('en-GB', { timeZoneName: 'longOffset' })` to parse Budapest offset string (e.g. "GMT+02:00") — DST-safe, no hardcoded values
4. **GROQ query:** `getWriteClient().fetch()` (not CDN) for real-time data. Filters: `_type == "booking" && !(_id in path("drafts.**")) && status == "confirmed" && reminderSent != true && slotDate >= $dateFrom && slotDate <= $dateTo`
5. **App-side filtering:** Each booking's `appointmentToUtcMs()` result checked against `[windowStart, windowEnd)` UTC range
6. **Grouping:** `Map<patientEmail, BookingForReminder[]>` — one combined email per patient
7. **Email dispatch:** `buildReminderEmail({ appointments, ... })` + `sendEmail()` per group. Subject: singular/plural Hungarian with Mórocz Medical suffix
8. **Idempotency:** `.patch(_id).set({ reminderSent: true }).commit()` called only after successful `sendEmail()`
9. **Failure handling:** Per-email try/catch — failed groups increment `failed`, add to `errors[]`, `reminderSent` stays false for retry
10. **Service name mapping:** `startsWith("Nőgyógyász")` → "Nőgyógyászati vizsgálat" (Phase 12 decision)
11. **Audit logging:** `db.insert(cronRunLog)` with attempted/succeeded/failed/errorDetails/durationMs after every run
12. **Top-level error handling:** Unexpected errors logged to DB then return 500

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Intl longOffset for Budapest timezone | No hardcoded +01:00/+02:00 — automatic DST handling |
| Hybrid GROQ + app-side filtering | GROQ can't do precise UTC time math; app code handles exact 20-28h window |
| Group by patientEmail for combined emails | Patients with multiple same-day appointments get one email, not N emails |
| reminderSent=true only on success | Failed sends are automatically retried on next hourly run |
| isEmailConfigured() guard returns 200 | Cron still logs cleanly in staging/dev where Gmail isn't configured |

## Deviations from Plan

None — plan executed exactly as written.

## User Setup Required

The following steps require manual action before this feature works in production:

1. **CRON_SECRET env var:** Generate via `openssl rand -hex 32`, add to Vercel Dashboard > Project Settings > Environment Variables as `CRON_SECRET`
2. **Vercel Pro plan:** Hourly cron frequency (`0 * * * *`) requires Pro plan. Hobby plan is limited to daily frequency. Verify at Vercel Dashboard > Project > Settings > General > Plan.
3. **Drizzle migration:** Run `npx drizzle-kit migrate` in production (or it will apply on first deploy if DATABASE_URL is set)

## Self-Check

Files created/modified:
- vercel.json: EXISTS
- src/app/api/cron/reminders/route.ts: EXISTS
- src/lib/db/schema.ts: cronRunLog table EXISTS
- src/lib/booking-email.ts: appointments array signature EXISTS
- drizzle/0001_wooden_outlaw_kid.sql: EXISTS

Commits:
- ef901b7: feat(14-01): add cronRunLog DB table and extend buildReminderEmail for combined appointments
- 734d6f3: feat(14-01): create cron endpoint with CRON_SECRET auth, Sanity query, email dispatch, and audit logging

## Self-Check: PASSED
