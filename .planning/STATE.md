# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.
**Current focus:** v2.0 Booking Module — Phase 13 admin dashboard

## Current Position

Phase: 13 of 14 (Admin Dashboard) — in progress
Plan: 2 of 3 complete
Status: Phase 13 plan 02 complete — two-panel dashboard UI done (calendar + day panel); plan 03 (patient detail modal + cancel flow) remains
Last activity: 2026-02-23 — 13-02 complete: AdminDashboard, AdminCalendar, AdminWeekView, AdminDayPanel, updated admin page.tsx

Progress: [████████░░] 76%

## Performance Metrics

**Velocity:**
- Total plans completed: 5 (v2.0)
- Average duration: ~5 min
- Total execution time: ~26 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 09-data-foundation-and-gdpr | 3 | ~11 min | ~4 min |
| 10-authentication | 3 | ~30 min | ~10 min |
| 11-booking-core | 4/4 | ~25 min | ~6 min |

*Updated after each plan completion*
| Phase 11-booking-core P02 | 15 | 2 tasks | 3 files |
| Phase 11-booking-core P04 | 5 | 2 tasks | 4 files |
| Phase 12-patient-account P01 | 5 | 2 tasks | 4 files |

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
- 10-02: authClient.requestPasswordReset is the correct method (not forgetPassword — that doesn't exist in Better Auth client API)
- 10-03: Admin page role check uses auth.api.getSession() in Server Component — middleware only checks cookie presence, not role
- 10-03: AdminSignOut extracted as separate client component to allow sign-out button inside Server Component page
- 10-03: Admin invite uses crypto.randomUUID().slice(0, 12) for temporary password — simple and sufficient for 2-admin setup
- 11-01: Slot generation uses 20-min base granularity with sub-slot conflict checking for multi-slot services
- 11-01: HH:MM local time strings (not ISO datetime) used throughout to avoid TZ confusion
- 11-01: Write client lazy null-singleton (same pattern as db/index.ts) prevents build-time crash when SANITY_WRITE_TOKEN not set
- 11-01: patientEmail uses string + regex validation (not Sanity email type) for schema version compatibility
- 11-03: AnimatePresence uses string step keys ("service"/"datetime"/"auth"/"confirm") to avoid key=0 animation bug
- 11-03: Schedule data (weeklySchedule + blockedDates) fetched in Server Component page.tsx and passed as scheduleData prop to BookingWizard — no extra client-side API call for calendar highlighting
- 11-03: Sanity WeeklyScheduleDay startTime/endTime normalized with ?? "" fallback before passing to ScheduleForAvailability
- [Phase 11-02]: ifRevisionId is a Sanity patch chain method (.ifRevisionId(rev).set().commit()), not a commit option
- [Phase 11-02]: Conflict response includes up to 5 nearest alternative slots sorted by absolute time distance from requested slot
- [Phase 11-02]: Email fire-and-forget uses separate async function with try/catch — booking response never blocked by email failure
- [Phase 11-booking-core]: Step4Confirm passes patientName/patientEmail to onSuccess so BookingSuccess avoids a second useSession call
- [Phase 11-booking-core]: SessionStorage key morocz-booking-wizard stores {currentStep, selections, timestamp} with 30-min TTL gate for OAuth redirect recovery
- [Phase 11-booking-core]: Conflict panel is inline above animated step area, not a modal, so alternatives persist during step animation
- [Phase 12-patient-account]: 12-01: Single manageUrl (/foglalas/:token) replaces separate cancel/reschedule URLs in confirmation email
- [Phase 12-patient-account]: 12-01: buildReminderEmail has no action buttons — 24h cutoff aligns with reminder send time
- [Phase 12-patient-account]: 12-01: crypto.randomUUID() used for managementToken (Web Crypto API, globally available in Next.js 15)
- [Phase 12-patient-account]: 12-02: $token is a reserved key in @sanity/client QueryParams (token?: never) — use $manageToken for managementToken GROQ queries
- [Phase 12-patient-account]: 12-02: scheduleData prop pre-fetched in Server Component and threaded to BookingManagementCard — Plan 03 reschedule picker can use it without additional API calls
- [Phase 12-patient-account]: 12-02: slotLock release on cancellation wrapped in try/catch — cancellation succeeds even if slotLock document is missing
- [Phase 12-patient-account]: 12-03: Atomic swap ordering — lock new slot (ifRevisionId) first, release old slot second; partial failure is acceptable degraded state
- [Phase 12-patient-account]: 12-03: Reschedule success state (CardState "rescheduled") prevents 24h restriction flash after rescheduling to near-future dates
- [Phase 12-patient-account]: Gmail API (googleapis OAuth2) replaced Resend for all transactional emails — src/lib/email.ts with RFC 2047 subject encoding
- [Phase 12-patient-account]: Service name mapping: startsWith("Nőgyógyász") → "Nőgyógyászati vizsgálat" in all email routes
- [Phase 12-patient-account]: Email templates include "Útvonal" button linking to Google Maps clinic location
- [Phase 13-admin-dashboard]: 13-01: Admin bookings API uses getWriteClient() not CDN — admin data must be real-time accurate
- [Phase 13-admin-dashboard]: 13-01: Admin cancel uses _id directly (not managementToken) — admin has direct DB access, no token auth needed
- [Phase 13-admin-dashboard]: 13-01: buildAdminCancellationEmail distinct from patient cancel — "A rendelő lemondta" header, optional reason block, softer outlined CTA button
- [Phase 13-admin-dashboard]: 13-02: AdminWeekView imported by AdminCalendar (not AdminDashboard) — AdminCalendar renders it directly in week mode
- [Phase 13-admin-dashboard]: 13-02: handleBookingClick is no-op stub in AdminDashboard — Plan 03 wires patient detail modal into this callback
- [Phase 13-admin-dashboard]: 13-02: AdminBooking type exported from AdminDashboard.tsx — single source of truth imported by all admin child components
- [Phase 13-admin-dashboard]: 13-02: Server Component fetches today + month bookings in parallel via Promise.all for zero-delay initial render

### Pending Todos

- Verify Sanity dataset is set to "private" before any patient schema work begins
- Sign Sanity DPA in account settings (prerequisite for Phase 9)
- Configure Resend domain (SPF, DKIM, DMARC) before Phase 11 email testing
- Confirm Vercel plan tier (free = daily cron, Pro = hourly cron) before Phase 14
- USER ACTION REQUIRED: Create Neon project, set DATABASE_URL, run drizzle-kit migrate
- USER ACTION REQUIRED: Set up Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- USER ACTION REQUIRED: Generate BETTER_AUTH_SECRET and add to .env.local
- USER ACTION REQUIRED: Create Resend API key and add RESEND_API_KEY
- USER ACTION REQUIRED: Create Sanity API token with "Editor" role and set SANITY_WRITE_TOKEN in .env.local

### Blockers/Concerns

- Auth will not function at runtime until user completes Neon + Google OAuth + Resend setup (documented in 10-01-SUMMARY.md)

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 13-02-PLAN.md — admin dashboard UI done (AdminDashboard, AdminCalendar, AdminWeekView, AdminDayPanel). Phase 13 plan 03 remains (patient detail modal + cancel flow).
Resume file: none
