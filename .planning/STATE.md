# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** v2.0 Booking Module — Phase 9 complete, Phase 10 next

## Current Position

Phase: 10 of 14 (Authentication) — not started
Plan: 0 of ? (Phase 10 not yet planned)
Status: Phase 9 complete, ready to plan Phase 10
Last activity: 2026-02-22 — Phase 9 complete: all 3 plans done (schemas, GDPR, calendar)

Progress: [██░░░░░░░░] 17%

## Performance Metrics

**Velocity:**
- Total plans completed: 3 (v2.0)
- Average duration: ~4 min
- Total execution time: ~11 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 09-data-foundation-and-gdpr | 3 | ~11 min | ~4 min |

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
- 09-01: blockedDate.isHoliday is readOnly at schema level — populated programmatically via BlockedDatesInput
- 09-01: appointmentDuration defaults to 20 min, matching weeklySchedule defaultSlotDuration default
- 09-03: Custom Sanity input components in src/sanity/components/ with inline styles (not @sanity/ui)
- 09-03: getHungarianHolidays reusable for Phase 11 slot generation

### Pending Todos

- Verify Sanity dataset is set to "private" before any patient schema work begins
- Sign Sanity DPA in account settings (prerequisite for Phase 9)
- Configure Resend domain (SPF, DKIM, DMARC) before Phase 11 email testing
- Confirm Vercel plan tier (free = daily cron, Pro = hourly cron) before Phase 14

### Blockers/Concerns

- Phase 10: Auth.js v5 is beta — spot-check callback signatures and AUTH_* env var naming against live authjs.dev docs at start of Phase 10; Better Auth documented as confirmed fallback

## Session Continuity

Last session: 2026-02-22
Stopped at: Phase 9 complete. Phase 10 (Authentication) ready to discuss/plan.
Resume file: none
