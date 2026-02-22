# Roadmap: Morocz Medical

## Shipped Milestones

### v1.0 Morocz Medical — SHIPPED 2026-02-21

8 phases, 29 plans, 124 commits. Full details: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

## Current Milestone

### v2.0 Booking Module (In Progress)

**Milestone Goal:** Patients can self-book appointments online — pick a service, choose an available slot, get instant confirmation, and manage their bookings through their account.

## Phases

- [x] **Phase 9: Data Foundation and GDPR** - Sanity booking schemas, GDPR compliance, and doctor schedule setup
- [x] **Phase 10: Authentication** - Patient and admin auth with Better Auth, role separation, and route protection (completed 2026-02-22)
- [x] **Phase 11: Booking Core** - Slot generation, calendar UI, booking creation, and confirmation email (completed 2026-02-22)
- [ ] **Phase 12: Patient Account** - /fiokom dashboard, appointment management, and cancellation
- [ ] **Phase 13: Admin Dashboard** - Admin-only calendar view, daily appointments, and manual cancellation
- [ ] **Phase 14: Reminder Emails and Cron** - 24h pre-appointment reminders via Vercel Cron

## Phase Details

### Phase 9: Data Foundation and GDPR
**Goal**: The data contracts and legal prerequisites for patient booking are in place — schemas exist, GDPR obligations are satisfied, and the doctor's schedule is configured before any patient data enters the system.
**Depends on**: Phase 8 (v1.0 codebase)
**Requirements**: SCHED-01, SCHED-02, SCHED-03, SCHED-04, GDPR-01, GDPR-02, GDPR-03
**Success Criteria** (what must be TRUE):
  1. Doctor can define weekly recurring availability (weekday, start/end time, slot duration, buffer) in Sanity Studio and see the configuration saved
  2. Doctor can add specific blocked dates (vacations, holidays) in Sanity Studio
  3. Each service document has an appointment duration field that controls slot length
  4. Sanity DPA is signed in account settings and DPIA document exists before any booking document is written
  5. Privacy policy page reflects booking data collection (name, email, phone)
**Plans**: 3 plans

Plans:
- [x] 09-01-PLAN.md — Schedule schemas, service duration, desk structure, queries, types
- [x] 09-02-PLAN.md — GDPR compliance: DPIA document, consent text, privacy policy update
- [x] 09-03-PLAN.md — Custom Studio blocked dates calendar with range selection and holidays

### Phase 10: Authentication
**Goal**: Patients and the admin can log in through separate, role-appropriate paths — patients via Google OAuth or email/password, admin via email/password only — with sessions that persist across browser refresh and route protection that cannot be bypassed.
**Depends on**: Phase 9
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. Patient can register with email and password and log in on a subsequent visit
  2. Patient can log in with their Google account via OAuth
  3. Patient stays logged in across browser refresh (30-day session)
  4. Admin can log in with email/password and reach the /admin dashboard; a patient session cannot reach /admin
  5. Visiting /admin without a valid session shows an inline login form; a non-admin session shows access denied
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Auth infrastructure: Better Auth + Drizzle + Neon, API route, middleware, session config
- [x] 10-02-PLAN.md — Patient auth components: AuthStep (tabs, Google OAuth, email/password) + ForgotPassword
- [x] 10-03-PLAN.md — Admin auth: inline /admin login, role-gated dashboard, seed script, invite endpoint

### Phase 11: Booking Core
**Goal**: A patient can browse available slots on /idopontfoglalas, pick a service, date, and time, authenticate, confirm their details, and receive an immediate confirmation email — with double-booking prevented at the data layer.
**Depends on**: Phase 10
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, NOTIF-01, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. Patient can browse available dates and time slots on /idopontfoglalas without logging in
  2. After selecting a slot, an auth gate appears; after login, the patient returns to the confirmation step (not the start)
  3. Patient submits name, email, and phone at confirmation; a booking Sanity document is created instantly
  4. Patient receives a Hungarian confirmation email immediately after booking
  5. If two patients attempt the same slot simultaneously, only one succeeds; the other sees a Hungarian error message and is shown alternative slots
**Plans**: 4 plans

Plans:
- [x] 11-01-PLAN.md — Sanity schemas (booking, slotLock), write client, slot generation algorithm, GROQ queries
- [ ] 11-02-PLAN.md — API routes: GET /api/slots + POST /api/booking with ifRevisionID locking + confirmation email
- [ ] 11-03-PLAN.md — Booking page /idopontfoglalas, wizard shell, StepIndicator, Step1Service, Step2DateTime
- [ ] 11-04-PLAN.md — Step3Auth, Step4Confirm, BookingSuccess, sessionStorage persistence, conflict handling

### Phase 12: Patient Account
**Goal**: A patient can manage their booking via a token-based link from the confirmation email — view appointment details, cancel (with 24h window), reschedule (atomic slot swap), and receive Hungarian confirmation emails for each action.
**Depends on**: Phase 11
**Requirements**: ACCT-01, ACCT-02, ACCT-03, NOTIF-03
**Success Criteria** (what must be TRUE):
  1. Patient can visit /foglalas/:token and see their appointment details (service, date, time)
  2. Patient can cancel a booking that is more than 24 hours away; the slot becomes available again
  3. Patient attempting to cancel a booking less than 24 hours away sees a Hungarian error message explaining the window has passed
  4. Patient receives a Hungarian cancellation confirmation email after successfully cancelling
  5. Patient can reschedule an appointment (new date/time) with atomic swap; receives reschedule email
**Plans**: 3 plans

Plans:
- [ ] 12-01-PLAN.md — Schema updates (managementToken, reminderSent), token generation, email builders (cancel, reschedule, reminder)
- [ ] 12-02-PLAN.md — Management page /foglalas/:token, BookingManagementCard, CancelDialog, cancel API with 24h enforcement
- [ ] 12-03-PLAN.md — ReschedulePanel with inline date/time picker, reschedule API with atomic slot swap, human verification

### Phase 13: Admin Dashboard
**Goal**: The admin can log in to a separate, role-gated dashboard and view today's appointments in order, browse the weekly calendar, access patient contact details, and manually cancel a booking with the patient notified.
**Depends on**: Phase 11, Phase 10
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04
**Success Criteria** (what must be TRUE):
  1. Admin can see today's confirmed appointments in chronological order on /admin
  2. Admin can browse a weekly calendar view showing booked and free slots
  3. Admin can click any booking to see the patient's name, email, and phone number
  4. Admin can cancel a booking from the dashboard; patient receives a cancellation email
**Plans**: TBD

Plans:
- [ ] 13-01: TBD

### Phase 14: Reminder Emails and Cron
**Goal**: Patients automatically receive a reminder email approximately 24 hours before their appointment, sent once per booking via a secured Vercel Cron job with no duplicates.
**Depends on**: Phase 11
**Requirements**: NOTIF-02
**Success Criteria** (what must be TRUE):
  1. Patient receives exactly one Hungarian reminder email approximately 24 hours before their appointment
  2. If the cron job runs multiple times, a patient never receives more than one reminder for the same booking
  3. The cron endpoint rejects requests that do not include the correct CRON_SECRET header
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 10 → 11 → 12 → 13 → 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. Data Foundation and GDPR | 3/3 | Complete | 2026-02-22 |
| 10. Authentication | 3/3 | Complete    | 2026-02-22 |
| 11. Booking Core | 4/4 | Complete   | 2026-02-22 |
| 12. Patient Account | 2/3 | In Progress|  |
| 13. Admin Dashboard | 0/? | Not started | - |
| 14. Reminder Emails and Cron | 0/? | Not started | - |
