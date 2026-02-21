# Feature Research

**Domain:** Medical appointment booking module — single-doctor private practice (Hungarian, Esztergom)
**Researched:** 2026-02-21
**Confidence:** HIGH (table stakes verified against multiple authoritative booking platforms and UX studies; edge cases verified against industry documentation and technical sources)

---

## Scope Note

This document covers only the **v2.0 booking module** added to an existing Next.js 15 + Sanity v4 medical practice website. The marketing website features (homepage, services, blog, SEO) are documented in the prior research pass. Features here assume the existing stack is locked: Next.js 15 App Router, Tailwind v4, Sanity v4, Vercel deployment.

---

## User Flows

### Patient Flow (Self-Service Booking)

```
1. Arrive at /idopontfoglalas (booking page)
2. Select service from dropdown or list (e.g. "Általános vizsgálat", "Laborteszt")
3. Calendar view opens — available dates highlighted, unavailable dates greyed
4. Pick a date → time slots for that date appear
5. Select a time slot
6. Auth gate: log in or register (Google OAuth or email/password)
7. Confirm booking: name, phone shown (pre-filled from account), confirm button
8. Booking created → confirmation email sent immediately
9. Patient lands on /fiok (account page) — can see upcoming appointments
10. 24h before appointment: reminder email sent automatically
11. From account page: cancel or reschedule (within cancellation window)
```

### Doctor / Admin Flow (Schedule Management)

```
1. Doctor logs into Sanity Studio (/studio) with admin credentials
2. Navigates to "Rendelési idő" (schedule) document — sets weekly recurring availability
   - Per weekday: start time, end time, slot duration (e.g. 20 min), break times
3. Navigates to "Zárolt napok" (blocked dates) — adds vacation days, holidays
4. Admin dashboard (/admin) shows:
   a. Today's appointments (chronological list with patient name, service, time)
   b. Calendar view (week/month) with booked and free slots
   c. Patient details (name, email, phone) per booking
5. Admin can manually cancel a booking → patient receives cancellation email
```

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features patients and the doctor assume exist. Missing these = the booking system feels broken.

| Feature | Why Expected | Complexity | Stack Notes |
|---------|--------------|------------|-------------|
| Service selection before slot picking | Patients need to pick what they're booking; slot duration may vary per service | LOW | Service data already exists in Sanity (v1 schemas); link service to duration |
| Date picker with visual availability | Calendar showing green/grey dates is the universal booking UI pattern; 43% of patients say online booking is their favourite digital tool | MEDIUM | Use a headless calendar component (react-day-picker); fetch slot availability from API |
| Time slot grid for selected date | Patients expect to see 09:00, 09:20, 09:40... and click one; no guessing | LOW | Slots generated server-side from doctor's schedule minus existing bookings |
| Auth gate before confirming booking | Booking must be tied to an identity for patient self-service; gate after slot selection (not before — don't block browsing) | HIGH | NextAuth v5 (Auth.js) with Google provider + Credentials provider; sessions in JWT or DB |
| Instant booking confirmation email | 100% expectation; absence creates anxiety and duplicate bookings | MEDIUM | Resend or Nodemailer + SMTP; sent from Next.js route handler on booking creation |
| Account page showing upcoming appointments | Patients expect to see what they booked; also required for cancel/reschedule | MEDIUM | /fiok route, server component, GROQ query filtering bookings by patient email |
| Cancel appointment from account | Standard self-service; patients expect this; reduces phone calls to clinic | MEDIUM | Booking document in Sanity updated to status: "lemondva"; trigger notification email |
| Admin: today's appointments list | Doctor must see who's coming today without opening Sanity Studio; operational necessity | MEDIUM | /admin route (separate login), server component, GROQ query for today's date |
| Admin: calendar / week view | Doctor needs to see the full schedule, not just today | MEDIUM | Calendar component in admin; same slot data, different view |
| Doctor schedule definition in Sanity Studio | Doctor defines when they work; this is the source of truth for all slots | MEDIUM | Sanity schema: weekday availability + slot duration per service; GROQ generates slots |
| Blocked dates in Sanity Studio | Vacation, public holidays, training days — doctor must be able to block any day | LOW | Array of date ranges in Sanity; slot generation excludes these |
| Bookings stored as Sanity documents | Required per project spec; also gives admin visibility in Studio itself | MEDIUM | Sanity "booking" document: patient ref (or inline data), service ref, datetime, status |
| Minimal patient data only | GDPR principle of data minimisation; only collect what's needed | LOW | Name + email + phone; no medical history, no insurance data, no address |
| Pre-appointment reminder email (24h before) | Reduces no-shows by up to 30% (verified by multiple studies); patients expect it | MEDIUM | Cron job or Vercel cron + Resend; query bookings with datetime = tomorrow |

### Differentiators (Competitive Advantage)

Features that make this booking module stand out versus the typical Hungarian GP practice that uses phone-only booking or a generic third-party booking widget.

| Feature | Value Proposition | Complexity | Stack Notes |
|---------|-------------------|------------|-------------|
| Service-linked slot duration | Different services take different amounts of time (GP visit = 20 min, lab consult = 10 min); most basic systems use one fixed slot length | MEDIUM | Sanity service document gets "appointmentDurationMinutes" field; slot generation uses this |
| Reschedule (not just cancel) | Patients who can't make it should be able to pick a new slot without cancelling and re-booking from scratch; reduces friction and no-shows | HIGH | New slot selection flow triggered from account page; old slot freed, new slot reserved atomically |
| Buffer time between appointments | Prevents the doctor from running perpetually late; 10-15 min buffer every N slots or configurable per service | MEDIUM | Sanity schedule schema includes buffer duration; slot generator skips buffer windows |
| Animated booking flow (Motion v12) | Consistent with the premium feel of the v1 site; step transitions, calendar animations; most booking widgets look clinical and generic | MEDIUM | Use Motion v12 (already installed); animate step transitions, slot appearance, confirmation |
| Hungarian language throughout | All booking UI in proper Hungarian with accented characters; third-party widgets typically offer imperfect Hungarian or require paid localisation | LOW | Built custom; all strings in Hungarian (e.g. "Válasszon időpontot", "Foglalás megerősítése") |
| Admin dashboard built into site (not Studio) | Sanity Studio is a developer/editor tool; a clean /admin page with Today's appointments is far more usable for the doctor and receptionist | MEDIUM | Separate Next.js route with its own credentials-only auth; read-only queries to Sanity |
| Email reminder content in Hungarian | Transactional emails matching the brand (dark navy, name, service, time, address) in proper Hungarian; generic platforms send poor Hungarian or English | LOW | Custom HTML email templates; Resend supports custom HTML |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable for a medical booking system but create disproportionate complexity, GDPR risk, or scope creep for a single-doctor practice.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| SMS reminders | Patients open SMS more reliably than email | Requires a paid SMS gateway (Twilio, MessageBird), Hungarian phone number verification, carrier delivery complexity, extra GDPR consent for SMS marketing; email achieves the same outcome at zero marginal cost | Email reminder at 24h before appointment; clearly labelled as the confirmation method at booking time |
| Payment / deposit collection at booking | Reduces no-shows; collects fee upfront | Requires Stripe or Barion integration, PCI-DSS compliance surface, Hungarian tax receipt (bizonylat) complexity, refund flow for cancellations; massive scope increase for an unproven feature | Implement cancellation window policy (24h notice); consider fee policy in v3 if no-show rate is high |
| Real-time slot availability (WebSocket/SSE) | Two patients could be on the same slot simultaneously | Vercel serverless functions don't support persistent connections; Sanity is not a real-time booking engine; overkill for a single-doctor practice with low concurrent traffic | Optimistic booking with server-side validation at confirm step; if slot taken, show error and redirect to date picker — sufficient for this scale |
| Waitlist / cancellation notifications to waiting patients | Fills cancelled slots automatically | Requires a queue, notification system, race condition handling for multiple waitlisted patients; heavy complexity for marginal gain at low volume | Show "Nincs szabad időpont ezen a napon" (No available slots on this day) and allow patient to check other days; if demand grows, add waitlist in v3 |
| Multi-doctor / multi-room scheduling | Handles growth | Not applicable — single-doctor practice per project spec; adds location and resource dimensions to every query and UI | Single doctor, single room; schedule is global not per-doctor |
| Patient medical history in booking | Collect intake form before appointment | Medical history is sensitive health data (GDPR Article 9 special category); storing it in Sanity CMS creates significant compliance liability; requires encryption, access control, retention policy | Collect only name, email, phone; doctor handles medical history via their existing practice management system |
| EHR/EMR integration | Connect with the doctor's existing patient records system | Hungarian GP practices typically use Praxis (state system) or MedWorkS; API access is restricted or requires certified integrations; out of scope entirely | Standalone booking only; doctor maps booking to patient record manually |
| Google Calendar / iCal sync | Doctor sees bookings in their personal calendar | Requires OAuth scope for calendar write access; adds auth complexity; Sanity + admin dashboard is the single source of truth | Admin dashboard at /admin shows today's appointments and week view; exportable if needed in v3 |
| Recurring / repeat appointments | Patients with regular check-ups can set a standing slot | Complex to implement correctly (what if a slot in the series is taken? what if schedule changes?); rare need for private GP practice | Patient re-books manually each time; friction is acceptable at this scale |
| Online prescription requests | Patients request repeat prescriptions through the portal | Medical regulatory compliance (e-Egészségügy system in Hungary), liability, scope explosion | Out of scope permanently; doctor handles via phone or in-person |

---

## Feature Dependencies

```
[Doctor Schedule (Sanity)]
    └──required by──> [Slot Generation] (no schedule = no slots to show)
    └──required by──> [Blocked Dates] (blocked dates narrow the schedule)

[Blocked Dates (Sanity)]
    └──required by──> [Slot Generation] (excluded from available dates)

[Slot Generation (server-side)]
    └──required by──> [Date Picker] (calendar knows which dates have slots)
    └──required by──> [Time Slot Grid] (shows available times for a date)

[Time Slot Grid]
    └──required by──> [Booking Creation] (a slot must be selected to book)

[Patient Auth (NextAuth)]
    └──required by──> [Booking Creation] (must be logged in to book)
    └──required by──> [Account Page] (shows patient's own bookings)
    └──required by──> [Cancel / Reschedule] (must own the booking)

[Booking Creation (Sanity document)]
    └──required by──> [Confirmation Email] (sent on document creation)
    └──required by──> [Account Page] (queries patient's bookings)
    └──required by──> [Admin Dashboard] (queries all bookings)
    └──required by──> [Reminder Email] (cron queries upcoming bookings)

[Confirmation Email]
    └──enhances──> [Reminder Email] (same email template system, different trigger)

[Admin Dashboard]
    └──requires──> [Admin Auth] (separate credentials, not patient NextAuth)

[Reschedule]
    └──requires──> [Cancel] (reschedule = cancel old + create new atomically)
    └──requires──> [Slot Generation] (must show available slots for new date)
    └──requires──> [Booking Creation] (creates a new booking document)

[Service Selection]
    └──enhances──> [Slot Generation] (slot duration derived from selected service)
    └──enhances──> [Booking Creation] (service stored on booking document)

[Pre-appointment Reminder]
    └──requires──> [Booking Creation] (needs confirmed bookings to query)
    └──requires──> [Cron trigger] (Vercel Cron or similar; runs daily)
```

### Dependency Notes

- **Doctor schedule is the foundation:** Everything downstream — slot display, booking creation, admin view — depends on the schedule being defined in Sanity first. Phase 1 of the booking module must implement the schedule schema.
- **Auth gates booking creation, not browsing:** Patients can browse available dates and slots without logging in. Auth is required only at the confirmation step. This reduces friction and improves conversion.
- **Booking document is the hub:** Confirmation emails, reminder emails, account page, admin dashboard, and cancel/reschedule all read or write this document. The schema design is critical; get it right before building any consumer of it.
- **Reschedule is a compose of cancel + re-book:** It must be atomic — if the new slot is unavailable, the original booking must be preserved. Implement with a Sanity transaction.
- **Admin auth is separate from patient auth:** The admin dashboard (/admin) uses simple email/password (hardcoded credentials or Sanity-stored), not the same NextAuth flow as patients. This avoids giving doctor access to patient-facing OAuth flows.

---

## Edge Cases

### Double Booking (Race Condition)

**Scenario:** Two patients view the same slot simultaneously and both click "Foglalás" (Book) at the same moment.

**Risk level:** LOW for a single-doctor practice (low concurrent traffic), but MUST be handled or a real double-booking occurs.

**Prevention:**
- At booking creation (API route), check slot availability atomically before writing the Sanity document.
- Use Sanity's transaction API (`client.transaction()`) to check + create in one operation where possible.
- If slot is already taken when the second request arrives, return a 409 conflict and redirect patient to date picker with a message: "Ez az időpont már foglalt. Kérjük, válasszon másikat."
- For very high concurrency (unlikely here), a Redis distributed lock would be the industry solution — but overkill for a single-doctor practice.

**Confidence:** HIGH (verified against Acuity Scheduling documentation and booking system design literature)

### Timezone / Daylight Saving Time

**Scenario:** Hungary uses CET (UTC+1) in winter and CEST (UTC+2) in summer. Clocks spring forward on the last Sunday of March and fall back on the last Sunday of October.

**Risk level:** VERY LOW — clinic operates standard business hours (8:00–18:00); DST transitions happen at 2:00–3:00 AM which is outside all possible appointment slots.

**Prevention:**
- Store all booking datetimes in UTC in Sanity documents.
- Display times in Hungarian local time (using `Europe/Budapest` timezone) throughout the UI and emails.
- Use `date-fns-tz` or `Intl.DateTimeFormat` with `Europe/Budapest` for formatting.
- No cross-timezone bookings expected — all patients and the clinic are in Hungary.

**Confidence:** HIGH (Hungary timezone behavior confirmed by worlddata.info; medical practice hours make DST edge cases irrelevant)

### Cancellation Window

**Scenario:** Patient tries to cancel 30 minutes before their appointment.

**Industry standard:** 24-hour cancellation window is the norm for medical practices; some use 48 hours.

**Recommendation:** Block online self-service cancellation within 24 hours of appointment time. Display message: "Az időpontot már nem tudja online lemondani. Kérjük, hívja a rendelőt: [phone number]." The doctor can still cancel from the admin dashboard at any time.

**Reasoning:** Prevents last-minute slot waste while giving a recoverable path (phone call). No-show fee infrastructure is explicitly excluded as an anti-feature.

**Confidence:** MEDIUM (24-hour window is industry norm per multiple scheduling platform docs; specific threshold is a business decision)

### Slot Duration Per Service

**Scenario:** General consultation = 20 min; lab test consult = 10 min; specialist referral = 30 min.

**Risk:** If all slots are the same duration, short services waste time and long services cause booking conflicts.

**Prevention:**
- Sanity service document gets an `appointmentDurationMinutes` field (integer, required).
- Slot generation API reads the selected service's duration to compute slots for the day.
- UI shows service duration next to service name: "Általános vizsgálat (20 perc)".

**Confidence:** HIGH (standard feature of all major medical scheduling platforms including Jane App, Cliniko, Acuity)

### Buffer Time Between Appointments

**Scenario:** Back-to-back 20-minute slots with no breathing room causes the doctor to run perpetually late.

**Prevention:**
- Sanity schedule schema includes `bufferMinutes` field (e.g. 5 or 10).
- Slot generator inserts non-bookable buffer windows between slots.
- Buffer is not shown to patients — the next available slot simply starts later.

**Confidence:** HIGH (buffer time is a standard scheduling feature; documented by Acuity, Jane App, Cliniko)

### Slot Availability When Patient is Mid-Booking

**Scenario:** Patient selects a slot at 10:00, spends 5 minutes on the auth/registration flow, then the slot gets taken by someone else.

**Risk level:** LOW (single doctor, low traffic) but possible.

**Prevention:**
- Do NOT implement a hold/reservation timer (adds complexity for minimal gain at this scale).
- At confirmation step, re-validate slot availability server-side before writing the Sanity document.
- If taken: show error, redirect to date picker.
- Slot selection is optimistic; booking creation is authoritative.

**Confidence:** MEDIUM (standard approach for low-traffic booking systems; high-traffic systems use hold timers)

### Patient Data GDPR Compliance

**Scenario:** Booking system collects patient name, email, phone, appointment history.

**GDPR obligations:**
- Explicit consent required at registration for data processing.
- Data minimisation: only name, email, phone (no medical history, no address).
- Right to deletion: patient must be able to request account deletion.
- Data retention policy: how long are past bookings stored? Recommend: 2 years (standard for administrative records; confirm with practice's data protection officer).
- Privacy policy must be updated to cover booking data processing.

**Confidence:** HIGH (GDPR Article 9 verified; healthcare data minimisation principle confirmed by GDPR Local and heydata.eu sources)

### Admin Authentication

**Scenario:** The admin dashboard at /admin must be accessible only to the doctor/receptionist.

**Approach:** Separate credentials-based auth (not patient NextAuth). Options:
- Simple: hardcoded hashed password in environment variables, checked via API route.
- Better: Sanity user with admin role; check against Sanity token on login.

**Recommendation:** Simple Next.js middleware protecting /admin routes + iron-session or JWT cookie with hardcoded credentials. Admin is one person; complexity of user management is not warranted.

---

## MVP Definition

### Launch With (v2.0 — Booking Module MVP)

Minimum viable booking system. Every item is required for the system to function end-to-end.

- [ ] Doctor schedule schema in Sanity (weekday availability, slot duration, buffer time)
- [ ] Blocked dates schema in Sanity
- [ ] Slot generation API (server-side, reads schedule + blocked dates + existing bookings)
- [ ] Date picker UI showing available dates
- [ ] Time slot grid for selected date
- [ ] Service selection linked to slot duration
- [ ] Patient auth: Google OAuth + email/password registration/login (NextAuth v5)
- [ ] Booking creation: Sanity document with patient data, service, datetime, status
- [ ] Confirmation email (immediate, on booking creation)
- [ ] Account page (/fiok): upcoming appointments list
- [ ] Cancel appointment from account page (with 24h window enforcement)
- [ ] Pre-appointment reminder email (24h before, via Vercel Cron)
- [ ] Admin dashboard (/admin): today's appointments, week calendar, patient details
- [ ] Admin auth: separate credentials-only login
- [ ] Double booking prevention: server-side slot validation at confirm step
- [ ] All UI strings in proper Hungarian (accented characters throughout)

### Add After Validation (v2.x)

- [ ] Reschedule flow — add when cancel + re-book friction proves problematic; requires atomic transaction in Sanity
- [ ] Buffer time configuration in Sanity Studio — add if doctor reports running late between appointments
- [ ] Animated booking step transitions — add once core flow is stable; Motion v12 already installed

### Future Consideration (v3+)

- [ ] SMS reminders — only if no-show rate remains high after email reminders; requires SMS gateway
- [ ] Waitlist / cancellation notification queue — only if slots frequently fill within hours of opening
- [ ] Payment / deposit at booking — only if no-show rate is commercially significant; requires Barion or Stripe
- [ ] Google Calendar sync — only if doctor requests it explicitly

---

## Feature Prioritization Matrix

| Feature | Patient Value | Admin Value | Implementation Cost | Priority |
|---------|--------------|-------------|---------------------|----------|
| Doctor schedule in Sanity | — | HIGH | MEDIUM | P1 (foundation) |
| Slot generation API | HIGH | HIGH | MEDIUM | P1 (foundation) |
| Date picker + time slot grid | HIGH | — | MEDIUM | P1 |
| Service selection | HIGH | MEDIUM | LOW | P1 |
| Patient auth (NextAuth) | HIGH | — | HIGH | P1 |
| Booking creation (Sanity doc) | HIGH | HIGH | MEDIUM | P1 |
| Confirmation email | HIGH | — | MEDIUM | P1 |
| Account page + cancel | HIGH | — | MEDIUM | P1 |
| Reminder email (cron) | HIGH | — | MEDIUM | P1 |
| Admin dashboard | — | HIGH | MEDIUM | P1 |
| Admin auth | — | HIGH | LOW | P1 |
| Double booking prevention | HIGH | HIGH | LOW | P1 |
| Reschedule flow | MEDIUM | MEDIUM | HIGH | P2 |
| Buffer time config | LOW | HIGH | LOW | P2 |
| Animated step transitions | MEDIUM | — | MEDIUM | P2 |
| SMS reminders | MEDIUM | LOW | HIGH | P3 |
| Waitlist | LOW | MEDIUM | HIGH | P3 |
| Payment / deposit | LOW | MEDIUM | VERY HIGH | P3 |

**Priority key:**
- P1: Required for v2.0 launch — booking module is non-functional without it
- P2: Should add once P1 is working; improves experience
- P3: Future consideration only if validated need

---

## Existing Stack Dependencies

Dependencies on the already-built v1 infrastructure that the booking module can leverage or must integrate with.

| Existing Asset | How Booking Module Uses It | Integration Notes |
|---------------|---------------------------|-------------------|
| Sanity v4 client (already configured) | Booking documents, schedule schema, blocked dates schema | Add new document types; reuse existing `client.ts` and GROQ query patterns |
| Sanity service documents (v1 schema) | Link service to appointment duration; service selection in booking flow | Add `appointmentDurationMinutes` field to existing service schema |
| Next.js 15 App Router | All booking routes (/idopontfoglalas, /fiok, /admin) use same routing; API routes for booking creation | New route groups; existing layout/header reused |
| Tailwind v4 + design system | Booking UI uses same color palette, border radius, typography | No design system changes needed; booking page is consistent with homepage |
| Motion v12 (already installed) | Animate booking step transitions, calendar, confirmation | Use existing motion/react import; no additional dependency |
| GDPR cookie consent + privacy policy (v1) | Privacy policy must be updated to cover booking data; cookie consent already in place | Update privacy policy text; booking data processing requires explicit consent checkbox at registration |
| GA4 + cookie consent gate (v1) | Booking funnel events (service selected, date selected, booking confirmed) can be tracked | Add GA4 events at each booking step if consent given; no new infrastructure |
| Vercel deployment | Vercel Cron Jobs for reminder emails (available on Hobby plan) | Add vercel.json cron configuration; no additional hosting cost |
| HMAC webhook revalidation (v1) | Booking documents in Sanity trigger revalidation of admin dashboard and account page on change | Reuse existing webhook handler; add booking document type to revalidation targets |

---

## Competitor Feature Analysis

| Feature | Phone-Only (most HU practices) | Docplanner / Doktor24 (aggregator) | This Module |
|---------|-------------------------------|-----------------------------------|-------------|
| Self-service booking | No | Yes (aggregator flow) | Yes (native, on-site) |
| Service-linked duration | N/A | Limited | Yes |
| Auth / account | No | Yes (aggregator account) | Yes (own accounts) |
| Cancellation online | No | Yes | Yes (with 24h window) |
| Email confirmation | No | Yes | Yes |
| Reminder emails | No | Yes | Yes (24h before) |
| Admin dashboard | Paper/phone | Via aggregator portal | Yes (/admin page) |
| Hungarian language | Yes | Yes | Yes (proper accented) |
| Brand consistency | N/A | No (aggregator brand) | Yes (matches site design) |
| GDPR data control | Full (no system) | Shared with aggregator | Full (own Sanity) |
| No monthly platform fee | N/A | €30-150/month | None (Vercel + Resend free tier) |

**Conclusion:** The primary competitive advantage over phone-only booking is obvious: 24/7 availability, no hold music, instant confirmation. The advantage over aggregators (Docplanner) is brand consistency, zero platform dependency, lower data-sharing risk, and no monthly fee. The risk is that aggregators bring patient discovery traffic — this module serves existing/returning patients, not acquisition.

---

## Sources

- [Best Medical Appointment Scheduling Software 2025 — Noterro](https://www.noterro.com/blog/best-medical-appointment-scheduling-software) — MEDIUM confidence (industry roundup with feature analysis)
- [Effective Patient Scheduling Systems — Tebra / The Intake](https://www.tebra.com/theintake/patient-experience/effective-patient-scheduling-systems-benefits-and-best-practices) — HIGH confidence (medical practice specialist, data-backed)
- [How to Avoid Double Booking — Acuity Scheduling](https://acuityscheduling.com/learn/avoid-double-booking-appointments) — HIGH confidence (authoritative scheduling platform)
- [Concurrency in Booking Systems — Medium / Abhishek Ranjan](https://medium.com/@abhishekranjandev/concurrency-conundrum-in-booking-systems-2e53dc717e8c) — MEDIUM confidence (technical deep-dive, consistent with industry sources)
- [Double Booking Problem — Adam Djellouli](https://adamdjellouli.com/articles/databases_notes/07_concurrency_control/04_double_booking_problem) — MEDIUM confidence (database theory, matches PostgreSQL/MySQL documentation)
- [Cancellation Policy Best Practices — Acuity Scheduling](https://acuityscheduling.com/learn/how-to-create-a-cancellation-policy) — HIGH confidence (authoritative scheduling platform)
- [No-Show Policy for Medical Practices — Tebra](https://www.tebra.com/theintake/checklists-and-guides/patient-scheduling/no-show-policy-for-your-practice) — HIGH confidence (medical practice specialist)
- [GDPR for Medical Practice — heydata.eu](https://heydata.eu/en/magazine/gdpr-for-medical-practice-9-steps-to-compliance) — HIGH confidence (GDPR compliance specialist, EU-specific)
- [GDPR Healthcare Data Compliance — GDPR Local](https://gdprlocal.com/gdpr-health-data-compliance-key-considerations-for-healthcare-providers/) — HIGH confidence (GDPR specialist, healthcare focus)
- [NextAuth.js 2025 — Strapi Blog](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide) — MEDIUM confidence (current 2025 guide, verified against official NextAuth docs)
- [Online Booking What Is Offered — Jane App](https://jane.app/guide/online-booking-choosing-what-is-offered-online-locations-staff-shifts-treatments-etc-and-individual-staff-preferences) — HIGH confidence (major medical scheduling platform, authoritative)
- [Appointment Confirmation Emails — Twilio/SendGrid](https://sendgrid.com/en-us/blog/appointment-confirmation-email-examples) — MEDIUM confidence (email platform, best practice guidance)
- [Hungary Timezone — World Data Info](https://www.worlddata.info/europe/hungary/timezones.php) — HIGH confidence (factual timezone data)
- [Online Medical Booking System for Clinics — Booknetic](https://www.booknetic.com/blog/online-medical-appointment-booking-system) — MEDIUM confidence (booking plugin vendor, practical feature analysis)

---

*Feature research for: Morocz Medical — v2.0 appointment booking module*
*Researched: 2026-02-21*
