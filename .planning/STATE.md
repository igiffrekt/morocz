# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** v2.0 Booking Module — Phase 14 reminder emails and cron

## Current Position

Phase: 13 of 14 (Admin Dashboard) — complete
Plan: 3 of 3 complete
Status: Phase 13 complete — full admin dashboard with calendar (month/week), day panel, patient modal, cancel flow, brand-themed UI
Last activity: 2026-02-23 — 13-03 complete: AdminPatientModal, light theme, brand design, overlap layout, human verified

Progress: [█████████░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 6 (v2.0)
- Average duration: ~10 min
- Total execution time: ~71 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 09-data-foundation-and-gdpr | 3 | ~11 min | ~4 min |
| 10-authentication | 3 | ~30 min | ~10 min |
| 11-booking-core | 4/4 | ~25 min | ~6 min |
| 13-admin-dashboard | 3/3 | ~55 min | ~18 min |

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
- [Phase 12-patient-account]: Gmail API (googleapis OAuth2) replaced Resend for all transactional emails — src/lib/email.ts with RFC 2047 subject encoding
- [Phase 12-patient-account]: Service name mapping: startsWith("Nőgyógyász") → "Nőgyógyászati vizsgálat" in all email routes
- [Phase 12-patient-account]: Email templates include "Útvonal" button linking to Google Maps clinic location
- [Phase 13-admin-dashboard]: 13-01: Admin bookings API uses getWriteClient() not CDN — admin data must be real-time accurate
- [Phase 13-admin-dashboard]: 13-01: Admin cancel uses _id directly (not managementToken) — admin has direct DB access
- [Phase 13-admin-dashboard]: 13-02: AdminBooking type exported from AdminDashboard.tsx — single source of truth
- [Phase 13-admin-dashboard]: 13-03: Draft filter !(_id in path("drafts.**")) required on all getWriteClient() queries
- [Phase 13-admin-dashboard]: 13-03: Light theme with brand design system (Plus Jakarta Sans, #242a5f, #99CEB7, #F4DCD6, #F2F4F8)
- [Phase 13-admin-dashboard]: 13-03: Week view overlap layout via layoutOverlappingBookings() greedy column algorithm

### Pending Todos

- Confirm Vercel plan tier (free = daily cron, Pro = hourly cron) before Phase 14

### Blockers/Concerns

None currently blocking.

## Session Continuity

Last session: 2026-02-23
Stopped at: Phase 13 complete. Phase 14 (Reminder Emails and Cron) is next — needs planning.
Resume file: none
