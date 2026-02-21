# Requirements: Morocz Medical v2.0

**Defined:** 2026-02-21
**Core Value:** Patients can discover Morocz Medical's services and book an appointment through a beautifully animated, fast, SEO-optimized website where every piece of content is manageable from Sanity CMS.

## v2.0 Requirements

Requirements for the booking module. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Patient can register with email and password
- [ ] **AUTH-02**: Patient can register/login with Google OAuth
- [ ] **AUTH-03**: Patient session persists across browser refresh (JWT)
- [ ] **AUTH-04**: Admin can log in with email/password to access the dashboard
- [ ] **AUTH-05**: Admin and patient auth are separate role paths

### Schedule

- [ ] **SCHED-01**: Doctor can define weekly recurring availability in Sanity Studio (per-weekday start/end time, slot duration)
- [ ] **SCHED-02**: Doctor can block specific dates in Sanity Studio (vacations, holidays)
- [ ] **SCHED-03**: Service-linked slot duration: each service defines its own appointment length
- [ ] **SCHED-04**: Buffer time between appointments is configurable in Sanity Studio

### Booking

- [ ] **BOOK-01**: Patient can select a service from the list on /idopontfoglalas
- [ ] **BOOK-02**: Patient can browse available dates on a calendar (available days highlighted)
- [ ] **BOOK-03**: Patient can pick a time slot from available slots for the selected date
- [ ] **BOOK-04**: Patient provides name, email, phone at booking confirmation
- [ ] **BOOK-05**: Booking is created instantly as a Sanity document with per-slot optimistic locking
- [ ] **BOOK-06**: Double-booking is prevented via ifRevisionID on slot documents
- [ ] **BOOK-07**: Auth gate appears after slot selection, not before browsing

### Notifications

- [ ] **NOTIF-01**: Patient receives confirmation email immediately after booking
- [ ] **NOTIF-02**: Patient receives reminder email 24 hours before appointment
- [ ] **NOTIF-03**: Patient receives cancellation confirmation email

### Patient Account

- [ ] **ACCT-01**: Patient can view upcoming appointments on /fiokom
- [ ] **ACCT-02**: Patient can cancel an appointment (24h cancellation window enforced)
- [ ] **ACCT-03**: Patient can reschedule an appointment (cancel old + book new atomically)

### Admin Dashboard

- [ ] **ADMIN-01**: Admin can view today's appointments in chronological order
- [ ] **ADMIN-02**: Admin can view weekly calendar with booked and free slots
- [ ] **ADMIN-03**: Admin can see patient details (name, email, phone) per booking
- [ ] **ADMIN-04**: Admin can manually cancel a booking (patient gets cancellation email)

### GDPR & Legal

- [ ] **GDPR-01**: Patient gives explicit consent for data processing at registration
- [ ] **GDPR-02**: Privacy policy updated to cover booking data
- [ ] **GDPR-03**: Sanity DPA signed before first patient data write

### UX Polish

- [ ] **UX-01**: Booking flow uses animated step transitions (Motion v12)
- [ ] **UX-02**: All booking UI strings in proper Hungarian with accented characters
- [ ] **UX-03**: Booking page matches existing site design system

## Future Requirements

Deferred to v2.x or v3+. Tracked but not in current roadmap.

### v2.x (Add after validation)

- **SMS-01**: Patient receives SMS reminder before appointment (requires SMS gateway)
- **WAIT-01**: Waitlist queue for cancelled slots (notification to waiting patients)

### v3+ (Future consideration)

- **PAY-01**: Payment/deposit collection at booking time (requires Stripe/Barion)
- **CAL-01**: Google Calendar sync for doctor's personal calendar
- **RECUR-01**: Recurring/repeat appointment scheduling

## Out of Scope

| Feature | Reason |
|---------|--------|
| SMS reminders | Requires paid SMS gateway; email sufficient for v2.0 |
| Payment/deposit at booking | PCI-DSS compliance, tax receipt complexity; defer until no-show data justifies it |
| Real-time WebSocket slot updates | Vercel serverless doesn't support persistent connections; overkill for single-doctor volume |
| Multi-doctor scheduling | Single-doctor practice; schedule is global |
| Patient medical history | GDPR Article 9 special category data; store only name/email/phone |
| EHR/EMR integration | Hungarian GP systems (Praxis, MedWorkS) require certified integrations |
| Waitlist queue | Heavy complexity for marginal gain at low volume |
| Online prescription requests | Medical regulatory compliance out of scope |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| SCHED-01 | — | Pending |
| SCHED-02 | — | Pending |
| SCHED-03 | — | Pending |
| SCHED-04 | — | Pending |
| BOOK-01 | — | Pending |
| BOOK-02 | — | Pending |
| BOOK-03 | — | Pending |
| BOOK-04 | — | Pending |
| BOOK-05 | — | Pending |
| BOOK-06 | — | Pending |
| BOOK-07 | — | Pending |
| NOTIF-01 | — | Pending |
| NOTIF-02 | — | Pending |
| NOTIF-03 | — | Pending |
| ACCT-01 | — | Pending |
| ACCT-02 | — | Pending |
| ACCT-03 | — | Pending |
| ADMIN-01 | — | Pending |
| ADMIN-02 | — | Pending |
| ADMIN-03 | — | Pending |
| ADMIN-04 | — | Pending |
| GDPR-01 | — | Pending |
| GDPR-02 | — | Pending |
| GDPR-03 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |

**Coverage:**
- v2.0 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-21 after initial definition*
