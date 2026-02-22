# Data Protection Impact Assessment (DPIA)

**Date:** 2026-02-22
**Assessor:** Claude / Developer
**Status:** Draft — pending doctor review
**Project:** Mórocz Medical — Online Booking Module
**GDPR Reference:** Article 35 (DPIA)

---

## 1. Description of Processing

### What data is collected

| Data field       | Type          | Source                       |
| ---------------- | ------------- | ---------------------------- |
| Full name        | Personal data | Patient-entered at booking   |
| Email address    | Personal data | Patient-entered at booking   |
| Phone number     | Personal data | Patient-entered at booking   |
| Appointment type | Operational   | Patient-selected at booking  |
| Appointment date | Operational   | Patient-selected at booking  |
| Account password | Credential    | Patient-entered (hashed)     |

### Why it is collected

- **Name**: To identify the patient in booking confirmation and appointment records.
- **Email**: To send booking confirmation and appointment reminders. Used as account login identifier.
- **Phone**: For urgent contact if an appointment needs to be rescheduled or cancelled.
- **Appointment type / date**: To manage the doctor's schedule and book the correct time slot.

### How it is processed

1. Patient submits registration/booking form on the Next.js web application.
2. Data is transmitted over HTTPS to a Next.js API route hosted on Vercel (EU West region where available).
3. Personal data is stored as documents in Sanity CMS (cloud, EU data center, with signed Data Processing Agreement).
4. Passwords are hashed using bcrypt before storage — plaintext passwords are never persisted.
5. Booking confirmation email is sent via Resend transactional email service (Phase 11+).
6. Appointment data is accessible to: the patient (own bookings only, via Auth.js session), and the clinic admin (all bookings, via admin-role session).

### What data is NOT collected

- No health history, diagnosis, or clinical notes (GDPR Article 9 special-category health data is not collected)
- No payment information
- No government ID numbers
- No location tracking or behavioral analytics

---

## 2. Necessity and Proportionality

### Minimum necessary data (data minimisation — Article 5(1)(c))

Each field collected is required for the specific purpose stated:
- Name: Cannot identify patient without it; required for appointment records.
- Email: Required for account access and booking confirmation; no alternative contact-less path.
- Phone: Required for urgent rescheduling contact; alternative (email-only) considered but rejected due to time-sensitivity of medical appointments.
- Appointment type: Required to allocate the correct slot duration and service.

### No excessive data

- No date of birth collected (not required for this service type).
- No medical history fields exist on the booking or registration form.
- Appointment type (service selection) is the only health-adjacent field; it indicates which service the patient wants but does not constitute a medical record.

### Proportionality

The processing is proportionate to the purpose: a small private medical practice managing appointment bookings is a standard, low-volume processing activity. The data subjects are adult patients choosing to book medical appointments online.

---

## 3. Risks to Data Subjects

### Risk inventory

| Risk                                      | Likelihood | Severity | Overall |
| ----------------------------------------- | ---------- | -------- | ------- |
| Unauthorised access to booking records    | Low        | Medium   | Medium  |
| Data breach exposing contact details      | Low        | Medium   | Medium  |
| Unintended retention beyond necessary period | Low     | Low      | Low     |
| Patients receiving spam after data breach | Low        | Low      | Low     |
| Account credential theft (phishing)       | Medium     | Medium   | Medium  |
| Exposure of appointment type to unauthorised parties | Low | Low   | Low     |
| Data processor (Sanity/Vercel/Resend) breach | Very Low | Medium   | Low     |

### Notes

- No special-category (Article 9) data is processed, which eliminates the highest-severity breach scenarios.
- Credential theft risk is managed by Auth.js session management and bcrypt password hashing.
- The appointment type field (e.g., "Általános vizsgálat") carries minimal sensitivity compared to clinical records.

---

## 4. Mitigation Measures

### Technical measures

| Measure                                    | Implementation                                                   |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Encrypted data in transit                  | HTTPS enforced on Vercel (automatic TLS, no HTTP fallback)       |
| Encrypted data at rest                     | Sanity CMS encrypts data at rest (AES-256 per Sanity docs)       |
| Password hashing                           | bcrypt with sufficient work factor; plaintext never stored       |
| Role-based access control                  | Auth.js session roles: `patient` (own data), `admin` (all data) |
| Session security                           | JWT sessions with short expiry; Auth.js v5 split-config (Edge-safe) |
| No client-side personal data storage       | No patient data written to localStorage or cookies (server-side only) |
| Input validation                           | Zod v3 schemas validate all patient inputs before persistence    |
| Private Sanity dataset                     | Sanity dataset set to "private" — no unauthenticated API access  |

### Organisational measures

| Measure                                    | Status                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Sanity Data Processing Agreement (DPA)     | **Required** — must be signed at sanity.io/manage before go-live |
| Vercel DPA                                 | Covered by Vercel's standard Terms of Service and DPA (GDPR-ready) |
| Resend DPA (Phase 11+)                     | Must be reviewed and accepted when email feature is activated    |
| Access limited to practice staff           | Admin role restricted to doctor; no third-party staff accounts   |
| Incident response                          | Doctor to be notified within 24 hours of suspected breach; NAIH notification within 72 hours if confirmed breach affecting patients |

---

## 5. Data Retention

### Retention periods

| Data type           | Retention period                                                                   |
| ------------------- | ---------------------------------------------------------------------------------- |
| Booking records     | 1 year after the appointment date, then soft-deleted (flagged `deleted: true`)     |
| Patient account     | Retained while account is active; deleted on explicit erasure request              |
| Deleted accounts    | Personal fields nulled immediately on deletion; appointment count retained for statistics only |
| Email logs          | Resend logs retained per Resend's default (30 days); not stored in Sanity          |

### Rationale

- 1-year booking history allows the doctor to reference recent visit history during follow-up calls.
- No legal obligation requires longer retention for this type of appointment data in Hungary.
- Account retention while active is standard for service continuity.

---

## 6. Data Subject Rights

### Rights available to patients

| Right                          | Implementation                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| Right of access (Article 15)   | Patient dashboard shows all own bookings and account data                             |
| Right to erasure (Article 17)  | "Delete account" flow nulls personal fields; booking slots freed; account deactivated |
| Right to rectification (Article 16) | Patient can update name, email, phone in account settings                        |
| Right to data portability (Article 20) | Future: export own data as JSON/CSV (Phase 13+ backlog)                      |
| Right to object (Article 21)   | Patient can object to processing by requesting account deletion                       |
| Right to restrict processing (Article 18) | Handled via account deletion (full restriction = deletion for this use case) |

### Exercising rights

Patients exercise access, erasure, and rectification rights directly through the patient dashboard (self-service). Requests that cannot be fulfilled self-service should be sent to the practice email address (displayed on the privacy policy page).

---

## 7. Legal Basis

### Primary legal bases

| Processing activity         | Legal basis                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Registration / account creation | **Article 6(1)(a) — Consent**: Patient explicitly checks consent checkbox reading "Elfogadom az adatkezelési tájékoztatót" before submitting the registration form. |
| Appointment booking         | **Article 6(1)(b) — Contract performance**: Booking is a service contract between patient and clinic; processing is necessary to fulfil the appointment. |
| Appointment reminders (email) | **Article 6(1)(b) — Contract performance**: Reminders are part of delivering the booked service. |
| Admin access to bookings    | **Article 6(1)(b) — Contract performance**: The doctor must access booking data to provide the medical service. |

### No special-category data

No Article 9 (special-category) data is processed. Appointment type describes the service selected, not a diagnosis or health condition. If clinical notes are ever added in the future, a separate DPIA amendment will be required.

---

## 8. Third-Party Processors

### Data processor register

| Processor  | Role                             | Data shared                        | DPA status                          | Region    |
| ---------- | -------------------------------- | ----------------------------------- | ----------------------------------- | --------- |
| Sanity.io  | CMS / primary data store         | All patient personal data (name, email, phone, bookings) | **Required — must be signed at sanity.io/manage** | EU (Frankfurt) |
| Vercel     | Hosting / API runtime            | Data in transit; no persistent storage by Vercel | Covered by Vercel's GDPR DPA (accepted on account creation) | EU West (preferred) |
| Resend     | Transactional email (Phase 11+)  | Email address, name (in email body) | Must be accepted when activating Resend | EU        |

### Sub-processors

Sub-processor chains for each processor above are governed by their published sub-processor lists. The practice is not required to maintain separate agreements with sub-processors of its data processors.

---

## 9. DPA Prerequisite Checklist

Before any patient data is written to Sanity (i.e., before Phase 10 registration goes live):

- [ ] **Sanity DPA signed** — Go to https://www.sanity.io/manage → Project Settings → Legal → sign the Data Processing Agreement
- [ ] **Sanity dataset set to "private"** — verify in Sanity project settings
- [ ] **HTTPS enforced on production Vercel deployment** — automatic but confirm
- [ ] **Doctor has reviewed this DPIA** — sign off in the section below
- [ ] **Privacy policy page updated** in Sanity Studio with booking data section

---

## 10. Assessment Outcome

**Assessment result:** Processing may proceed subject to the prerequisite checklist above being completed before go-live.

**Residual risk level:** Low — no special-category data, proportionate collection, technical measures in place, contractual processor obligations pending.

**Next review date:** 2027-02-22 (annual review) or upon any significant change to data processing activities.

---

## Doctor Sign-off

| Field          | Value                        |
| -------------- | ---------------------------- |
| Reviewed by    | _(doctor name)_              |
| Date reviewed  | _(date)_                     |
| Signature      | _(signature or initials)_    |
| Status         | Pending review               |
