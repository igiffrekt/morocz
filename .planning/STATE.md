# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** v2.0 Booking Module — Phase 9 in progress (Plan 1 complete)

## Current Position

Phase: 9 of 14 (Data Foundation and GDPR)
Plan: 1 of 3 complete in current phase
Status: In progress
Last activity: 2026-02-22 — 09-01 complete: weeklySchedule and blockedDate schemas, service duration, Studio structure, queries, TS types

Progress: [█░░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1 (v2.0)
- Average duration: 3 min
- Total execution time: 3 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 09-data-foundation-and-gdpr | 1 | 3 min | 3 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.0 arch: Per-slot Sanity documents with ifRevisionID locking for double-booking prevention (not query-based)
- v2.0 arch: Auth.js v5 mandatory split-config (auth.config.ts for Edge middleware, auth.ts for Node.js)
- v2.0 arch: Resend for transactional email (Vercel blocks outbound SMTP)
- v2.0 arch: Admin auth is email/password only, role set from ADMIN_EMAIL env var — no OAuth for admin
- v2.0 arch: Zod v3 (not v4) — Zod 4 is ESM-only and breaks Sanity v4 builds
- v2.0 arch: Vercel Cron for reminder emails; Inngest documented as upgrade path
- 09-01: weeklySchedule days array pre-populated via initialValue (Mon-Fri working, Sat/Sun off) with empty time strings
- 09-01: startTime/endTime use conditional validation via rule.custom() reading context.parent.isDayOff
- 09-01: blockedDate.isHoliday is readOnly at schema level — populated programmatically in Plan 03
- 09-01: appointmentDuration defaults to 20 min, matching weeklySchedule defaultSlotDuration default

### Pending Todos

- Verify Sanity dataset is set to "private" before any patient schema work begins
- Sign Sanity DPA in account settings (prerequisite for Phase 9)
- Configure Resend domain (SPF, DKIM, DMARC) before Phase 11 email testing
- Confirm Vercel plan tier (free = daily cron, Pro = hourly cron) before Phase 14

### Blockers/Concerns

- Phase 9: Hybrid slot model (pure function for generation + on-demand documents for ifRevisionID locking) needs a design spike at plan time before schema is finalized
- Phase 10: Auth.js v5 is beta — spot-check callback signatures and AUTH_* env var naming against live authjs.dev docs at start of Phase 10; Better Auth documented as confirmed fallback

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 09-01-PLAN.md — Sanity scheduling schemas (weeklySchedule, blockedDate, service duration, Studio structure, queries, TS types)
Resume file: None
