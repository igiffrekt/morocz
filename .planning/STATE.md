# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** v2.0 Booking Module — Phase 10 authentication infrastructure complete

## Current Position

Phase: 10 of 14 (Authentication) — in progress
Plan: 1 of ? completed (10-01 auth infrastructure done)
Status: 10-01 complete, ready for next plan
Last activity: 2026-02-22 — 10-01 complete: Better Auth + Drizzle + Neon infrastructure

Progress: [███░░░░░░░] 21%

## Performance Metrics

**Velocity:**
- Total plans completed: 4 (v2.0)
- Average duration: ~5 min
- Total execution time: ~22 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 09-data-foundation-and-gdpr | 3 | ~11 min | ~4 min |
| 10-authentication | 1 (so far) | ~11 min | ~11 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v2.0 arch: Per-slot Sanity documents with ifRevisionID locking for double-booking prevention (not query-based)
- v2.0 arch: Better Auth replaces Auth.js v5 (Auth.js v5 abandoned, Better Auth acquired it in late 2025)
- v2.0 arch: Resend for transactional email (Vercel blocks outbound SMTP)
- v2.0 arch: Admin auth is email/password only, role stored in DB via Better Auth admin plugin
- v2.0 arch: Zod v3 (not v4) — Zod 4 is ESM-only and breaks Sanity v4 builds
- v2.0 arch: Vercel Cron for reminder emails; Inngest documented as upgrade path
- 09-01: weeklySchedule days array pre-populated via initialValue (Mon-Fri working, Sat/Sun off) with empty time strings
- 09-01: startTime/endTime use conditional validation via rule.custom() reading context.parent.isDayOff
- 09-01: blockedDate.isHoliday is readOnly at schema level — populated programmatically via BlockedDatesInput
- 09-01: appointmentDuration defaults to 20 min, matching weeklySchedule defaultSlotDuration default
- 09-03: Custom Sanity input components in src/sanity/components/ with inline styles (not @sanity/ui)
- 09-03: getHungarianHolidays reusable for Phase 11 slot generation
- 10-01: db/index.ts uses lazy Proxy pattern — neon() only called on first property access, not at module load (build compatibility)
- 10-01: Resend initialized lazily inside email callbacks, not at module level (build compatibility)
- 10-01: Auth schema manually generated from Better Auth CLI introspection (CLI requires DATABASE_URL, not available during setup)
- 10-01: auth route has force-dynamic to prevent Next.js static evaluation

### Pending Todos

- Verify Sanity dataset is set to "private" before any patient schema work begins
- Sign Sanity DPA in account settings (prerequisite for Phase 9)
- Configure Resend domain (SPF, DKIM, DMARC) before Phase 11 email testing
- Confirm Vercel plan tier (free = daily cron, Pro = hourly cron) before Phase 14
- USER ACTION REQUIRED: Create Neon project, set DATABASE_URL, run drizzle-kit migrate
- USER ACTION REQUIRED: Set up Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- USER ACTION REQUIRED: Generate BETTER_AUTH_SECRET and add to .env.local
- USER ACTION REQUIRED: Create Resend API key and add RESEND_API_KEY

### Blockers/Concerns

- Auth will not function at runtime until user completes Neon + Google OAuth + Resend setup (documented in 10-01-SUMMARY.md)

## Session Continuity

Last session: 2026-02-22
Stopped at: 10-01 complete. Auth infrastructure in place. Next: remaining Phase 10 plans (patient auth UI, admin auth UI, etc.)
Resume file: none
