# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** v2.0 Booking Module — Phase 9 ready to plan

## Current Position

Phase: 9 of 14 (Data Foundation and GDPR)
Plan: — of — in current phase
Status: Ready to plan
Last activity: 2026-02-22 — v2.0 roadmap created, phases 9-14 defined

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v2.0)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

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
Stopped at: v2.0 roadmap created. 32 requirements mapped across 6 phases (9-14). Ready to plan Phase 9.
Resume file: None
