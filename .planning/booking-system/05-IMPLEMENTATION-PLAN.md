# Booking System -- Implementation Plan

**Author**: Technical Project Manager
**Status**: Final
**Date**: 2026-02-21
**Source Documents**:
- `01-database-schema.md` (Drizzle ORM + Neon PostgreSQL)
- `02-backend-api-design.md` (Server Actions + Route Handlers)
- `03-frontend-ui-design.md` (Admin Panel + Public Booking Pages)

---

## Table of Contents

1. [Roadmap Integration](#1-roadmap-integration)
2. [Phase 9: Database + Auth Foundation](#2-phase-9-database--auth-foundation)
3. [Phase 10: Core Booking Engine](#3-phase-10-core-booking-engine)
4. [Phase 11: Email + Calendar Integration](#4-phase-11-email--calendar-integration)
5. [Phase 12: Admin Panel](#5-phase-12-admin-panel)
6. [Complete Environment Variables](#6-complete-environment-variables)
7. [External Service Setup Checklist](#7-external-service-setup-checklist)
8. [Migration Strategy](#8-migration-strategy)
9. [Deployment Considerations](#9-deployment-considerations)
10. [Risk Register](#10-risk-register)

---

## 1. Roadmap Integration

The booking system is a separate milestone that begins after Phase 8 (CMS Revalidation + Launch). The marketing site must be fully launched and stable before booking system work starts. The booking system adds four new phases to the roadmap:

```
Phase 1-6:  [COMPLETE] Marketing Site Foundation through SEO
Phase 7:    Animation Polish + Performance
Phase 8:    CMS Revalidation + Launch
--- MARKETING SITE LAUNCHED ---
Phase 9:    Database + Auth Foundation (Booking System)
Phase 10:   Core Booking Engine (Booking System)
Phase 11:   Email + Calendar Integration (Booking System)
Phase 12:   Admin Panel (Booking System)
```

Each booking system phase builds on the previous one. No parallelization between phases is possible due to hard data and API dependencies.

---

## 2. Phase 9: Database + Auth Foundation

**Goal**: A Neon PostgreSQL database exists with all 10 tables, custom constraints, and seed data. An admin user can log in to a protected `/admin` route via NextAuth.js credentials. The admin layout shell (sidebar + header) renders correctly.

**Depends on**: Phase 8 (site must be launched; no schema conflicts with existing Sanity setup)

**Estimated Plans**: 5 plans (~30 min each)

---

### Plan 09-01: Neon + Drizzle Setup

**What**: Install database packages, create Drizzle config, set up DB connection module.

**Packages to install**:
```bash
npm install drizzle-orm@^0.38.0 @neondatabase/serverless@^0.10.0
npm install -D drizzle-kit@^0.30.0
```

**Files to create**:
| File | Purpose |
|------|---------|
| `drizzle.config.ts` | Drizzle Kit configuration (schema path, migrations output, PostgreSQL dialect) |
| `src/db/index.ts` | Database connection using `neon-http` driver + schema import |
| `src/db/schema.ts` | Complete Drizzle schema: 6 enums + 10 tables + all relations |

**Files to modify**:
| File | Change |
|------|--------|
| `package.json` | Add `db:push`, `db:generate`, `db:migrate`, `db:studio`, `db:seed` scripts |
| `.env.local` | Add `DATABASE_URL` |

**Environment variables to add**:
```
DATABASE_URL=postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Success criteria**:
1. `npm run db:push` creates all 10 tables in Neon without errors
2. `npm run db:studio` opens Drizzle Studio and shows all tables
3. TypeScript compilation passes with no errors in `src/db/schema.ts`

---

### Plan 09-02: Custom SQL Migrations + Seed Script

**What**: Apply exclusion constraint, CHECK constraints, and run seed data (appointment types, weekly schedule, message templates, doctor settings).

**Files to create**:
| File | Purpose |
|------|---------|
| `drizzle/migrations/custom/0001_appointment_exclusion_constraint.sql` | `btree_gist` extension + `EXCLUDE USING gist` on appointments |
| `drizzle/migrations/custom/0002_check_constraints.sql` | CHECK constraints on `weekly_schedule`, `schedule_overrides`, `doctor_settings`, `waitlist_entries` |
| `src/db/seed.ts` | Seed script: doctor settings (singleton), 2 appointment types, Mon-Fri 08:00-16:00 schedule, 10 Hungarian message templates |

**Files to modify**:
| File | Change |
|------|--------|
| `package.json` | Ensure `db:seed` script is `tsx src/db/seed.ts` |

**Packages to install**:
```bash
npm install -D tsx@^4.19.0
```

**Execution steps** (manual, in order):
1. `npx drizzle-kit push` (creates tables)
2. Apply custom SQL via Neon SQL Editor or `psql`:
   - `0001_appointment_exclusion_constraint.sql`
   - `0002_check_constraints.sql`
3. `npm run db:seed` (populates initial data)

**Success criteria**:
1. Neon console shows `btree_gist` extension enabled
2. Attempting to insert overlapping non-cancelled appointments fails with exclusion constraint violation
3. `doctor_settings` has exactly 1 row (id=1)
4. `appointment_types` has 2 rows (Varandosgondozas 45min, Nogyogyaszat 30min)
5. `weekly_schedule` has 5 rows (Mon-Fri, 08:00-16:00)
6. `message_templates` has 10 rows (all event types, patient + doctor recipients)

---

### Plan 09-03: NextAuth.js Configuration

**What**: Install NextAuth v5, configure credentials provider with bcrypt, set up JWT sessions, create type augmentation, and add middleware to protect `/admin/*` routes.

**Packages to install**:
```bash
npm install next-auth@^5.0.0 bcryptjs@^2.4.3 zod@^3.23.0
npm install -D @types/bcryptjs@^2.4.6
```

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/auth/auth.config.ts` | NextAuth config: credentials provider, JWT strategy (8h maxAge), callbacks for role/userId in token |
| `src/lib/auth/index.ts` | Export `handlers`, `auth`, `signIn`, `signOut` from NextAuth |
| `src/lib/auth/require-auth.ts` | `requireAuth()` and `requireAdmin()` helper functions for server actions |
| `src/lib/auth/types.d.ts` | Type augmentation: `User.role`, `Session.user.role`, `JWT.role`, `JWT.userId` |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth route handlers (`GET`, `POST`) |
| `src/middleware.ts` | Protect `/admin/*` routes (except `/admin/login`), redirect unauthenticated to `/admin/login` |
| `src/lib/booking/types.ts` | Shared types: `ActionResult<T>`, `ErrorCode`, `TimeSlot`, `BookingConfirmation`, `PaginatedResult<T>` |

**Environment variables to add**:
```
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=http://localhost:3000
```

**Success criteria**:
1. Visiting `/admin` redirects to `/admin/login` when not authenticated
2. Visiting `/admin/login` renders without redirect loop
3. The existing public pages (`/`, `/laborvizsgalatok`, `/studio`) are unaffected by middleware
4. TypeScript compilation passes with augmented NextAuth types

---

### Plan 09-04: Admin Login Page + First Admin User

**What**: Create the admin login page (dark navy background, centered white card, email/password form) and a script to create the first admin user.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/login/page.tsx` | Login page: server component wrapper (standalone, no AdminLayout) |
| `src/app/admin/login/LoginForm.tsx` | Client component: email + password form, calls `signIn("credentials")`, error display, loading state |
| `scripts/create-admin.ts` | CLI script: prompts for email, name, password; hashes password with bcrypt; inserts into `admin_users` |

**Execution** (manual):
```bash
npx tsx scripts/create-admin.ts
# Prompts: email, name, password
# Creates admin user in database
```

**Success criteria**:
1. `/admin/login` renders: dark navy background, centered white card, Morocz logo, email + password fields, "Bejelentkezes" button
2. Submitting correct credentials redirects to `/admin`
3. Submitting wrong credentials shows inline error: "Hibas email vagy jelszo"
4. All text is Hungarian
5. Login form works on mobile (320px viewport)

---

### Plan 09-05: Admin Layout Shell

**What**: Create the admin layout with sidebar navigation (10 nav items), top header bar with user menu, and a placeholder dashboard page. This is the chrome that wraps all `/admin/*` pages.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/layout.tsx` | Server component: fetches session via `auth()`, renders `AdminLayout` with user data, or redirects to login |
| `src/components/admin/AdminLayout.tsx` | Client component: sidebar toggle state, renders `AdminSidebar` + `AdminHeader` + `{children}` |
| `src/components/admin/AdminSidebar.tsx` | Client component: 10 nav items (Vezerlopult, Idopontok, Betegek, Idobeosztas, Vizsgalat tipusok, Uzenet sablonok, Varakozok, Beallitasok, Felhasznalok, Vissza a weboldalra), active route highlighting, mobile overlay |
| `src/components/admin/AdminHeader.tsx` | Client component: mobile menu button, page title, user name + logout dropdown |
| `src/app/admin/page.tsx` | Placeholder dashboard: "Vezerlopult" heading + "Coming soon" message |

**Packages to install**:
```bash
npm install lucide-react@^0.460.0
```

**Success criteria**:
1. After login, `/admin` shows the admin layout: sidebar on left, header on top, content area
2. Sidebar has dark navy background (`bg-primary`) with white text
3. Active nav item has `bg-white/10 rounded-xl` highlight
4. Clicking "Kijelentkezes" logs out and redirects to `/admin/login`
5. On mobile: sidebar is hidden; hamburger button reveals full-width overlay with backdrop blur
6. On desktop (>= md): sidebar always visible, content shifts right
7. "Vissza a weboldalra" link navigates to `/`
8. "Felhasznalok" nav item only visible to users with `role = "admin"`

---

### Phase 9 Testing Checklist

- [ ] Database has all 10 tables visible in Neon console
- [ ] `btree_gist` extension is enabled
- [ ] Exclusion constraint rejects overlapping appointments (test with manual INSERT)
- [ ] CHECK constraints enforce day_of_week 1-7, singleton id=1, startTime < endTime
- [ ] Seed data: 1 doctor_settings, 2 appointment_types, 5 weekly_schedule, 10 message_templates
- [ ] Admin login works with correct credentials
- [ ] Admin login rejects wrong credentials with Hungarian error message
- [ ] Unauthenticated `/admin` access redirects to `/admin/login`
- [ ] `/admin/login` does not redirect when already on login page
- [ ] Public pages (`/`, `/laborvizsgalatok`, `/studio`) are unaffected
- [ ] Admin sidebar navigation renders all 10 items
- [ ] Mobile sidebar opens/closes correctly
- [ ] Logout works and redirects to login
- [ ] TypeScript build passes (`npm run build`)
- [ ] Biome lint passes (`npm run lint:biome`)

---

## 3. Phase 10: Core Booking Engine

**Goal**: Patients can browse available time slots, complete a 5-step booking wizard, receive a confirmation page, and cancel their appointment via a tokenized link. The waitlist signup form captures entries when no slots are available.

**Depends on**: Phase 9 (database, auth, admin layout must exist)

**Estimated Plans**: 8 plans (~30 min each)

---

### Plan 10-01: Slot Generation Engine + Timezone Helpers

**What**: Build the core slot generation algorithm that converts weekly schedules and overrides into available time slots for a given date and appointment type. All timezone handling uses `Europe/Budapest`.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/booking/timezone.ts` | `formatDateInTZ()`, `getDayOfWeekISO()`, `toUTCFromTZ()`, `generateTimeSlots()`, `parseTimeToMinutes()`, `minutesToHHMM()` |
| `src/lib/booking/slots.ts` | `getAvailableSlots(date, appointmentTypeId)`: 10-step algorithm (fetch type, check overrides, get schedule, generate candidates, subtract occupied, filter past) |

**Success criteria**:
1. `getAvailableSlots(mondayDate, nogyogyaszatId)` returns 16 slots (08:00-16:00 in 30min increments)
2. `getAvailableSlots(sundayDate, anyId)` returns [] (no Sunday schedule)
3. When a schedule override marks a date as `isClosed`, returns []
4. When an appointment exists at 10:00-10:30, that slot is excluded
5. Slots in the past (if date is today) are excluded
6. All returned times are in ISO 8601 format with correct UTC offset for Budapest

---

### Plan 10-02: Public Slots API + Booking Validation Schema

**What**: Create the public GET endpoint for fetching available slots and the Zod validation schema for booking input.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/api/slots/route.ts` | `GET /api/slots?date=YYYY-MM-DD&appointmentTypeId=N` -- validates with Zod, returns `{ slots: TimeSlot[] }` |
| `src/lib/booking/schemas.ts` | `bookingSchema`: appointmentTypeId, date, time, firstName, lastName, email, phone validation |

**Success criteria**:
1. `GET /api/slots?date=2026-03-02&appointmentTypeId=1` returns JSON with `slots` array
2. Invalid parameters return 400 with error details
3. Missing parameters return 400
4. `bookingSchema` validates and rejects: empty names, invalid emails, malformed dates/times, short phone numbers

---

### Plan 10-03: Booking Server Action (Transactional Create)

**What**: Implement the `createBooking()` server action with double-booking prevention, patient upsert, cancellation token generation. Email and calendar calls are stubbed (Phase 11).

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/booking/actions/create-booking.ts` | `"use server"` action: validate -> fetch type -> compute times -> transaction (SELECT FOR UPDATE + upsert patient + insert appointment) -> generate cancellation token -> return confirmation |
| `src/db/transactional.ts` | WebSocket pool connection for transactions requiring `SELECT FOR UPDATE` |

**Packages to install**:
```bash
# No new packages -- @neondatabase/serverless already includes Pool for WebSocket
```

**Success criteria**:
1. Calling `createBooking()` with valid data creates a patient + appointment in the database
2. The appointment has a 64-character hex cancellation token
3. `cancellation_token_expires_at` is set to `startTime - 24 hours`
4. Duplicate email upserts the patient (updates name/phone, preserves existing data)
5. Two concurrent bookings for the same slot: first succeeds, second returns `SLOT_UNAVAILABLE`
6. PostgreSQL exclusion constraint catches any race condition at DB level (error code 23P01 handled)
7. Return value includes `appointmentId`, `patientName`, `appointmentType`, `date`, `time`, `cancellationUrl`

---

### Plan 10-04: Cancellation System (Token Lookup + Server Action)

**What**: Build the cancellation page that resolves 4 states (valid, expired, invalid, already_cancelled) and the server action that performs the cancellation.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/cancel/[token]/page.tsx` | Server component: fetches appointment by cancellation_token, resolves state, renders appropriate UI |
| `src/app/cancel/[token]/CancelAction.tsx` | Client component: cancel button with loading state, calls `cancelAppointment(token)`, transitions to success state |
| `src/lib/booking/actions/cancel-appointment.ts` | `"use server"` action: validate token -> check window -> update status to cancelled -> set cancelledAt -> return result. Email/calendar/waitlist calls are stubbed (Phase 11). |

**Success criteria**:
1. `/cancel/<valid-token>` shows appointment details + red "Idopont lemondasa" button
2. `/cancel/<invalid-token>` shows "Ervenytelen lemondasi link" error page
3. `/cancel/<expired-token>` shows "A lemondasi hatarido lejart" with phone number
4. `/cancel/<already-cancelled-token>` shows "Ez az idopont mar le lett mondva"
5. Clicking cancel button: loading state -> success state (green checkmark + "Az idopont sikeresen lemondva")
6. After cancellation, appointment status is `cancelled` and `cancelled_at` is set
7. All text is Hungarian, all states render on mobile (320px)

---

### Plan 10-05: Public Booking Page -- Shared Components

**What**: Create the reusable UI components needed by the booking wizard: StepIndicator, DatePicker, TimeslotGrid, FormField.

**Packages to install**:
```bash
npm install date-fns@^4.1.0
```

**Files to create**:
| File | Purpose |
|------|---------|
| `src/components/booking/StepIndicator.tsx` | Client: 5-step horizontal progress (circles + lines + labels), responsive (circles-only on mobile) |
| `src/components/ui/DatePicker.tsx` | Client: Hungarian-locale month calendar (Monday-first, HU month/day names), available dates highlighting, min/max date, animated month transitions |
| `src/components/booking/TimeslotGrid.tsx` | Client: grid of time pill buttons (3-5 columns responsive), selected/available/unavailable states, stagger entrance animation |
| `src/components/ui/FormField.tsx` | Server: label + input wrapper + error message, required asterisk |

**Success criteria**:
1. StepIndicator renders 5 steps with correct visual states (completed=checkmark, current=green ring, future=gray)
2. DatePicker displays Hungarian month names and day abbreviations, starts on Monday
3. DatePicker highlights available dates in green, disables unavailable dates
4. TimeslotGrid renders time pills in responsive grid, selected pill has primary background
5. FormField displays label, required asterisk, red error text when error prop provided
6. All components match the design system tokens (border-radius, colors, typography)

---

### Plan 10-06: Public Booking Wizard (5-Step Flow)

**What**: Implement the multi-step booking wizard with animated step transitions, state management, and all 5 steps.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/idopontfoglalas/page.tsx` | Server component: fetches active appointment types, renders BookingWizard |
| `src/app/idopontfoglalas/BookingWizard.tsx` | Client: state machine managing `BookingState`, `AnimatePresence` step transitions (slide left/right) |
| `src/app/idopontfoglalas/steps/StepSelectType.tsx` | Step 1: two large colored cards (Varandosgondozas, Nogyogyaszat), click to select + advance |
| `src/app/idopontfoglalas/steps/StepSelectDate.tsx` | Step 2: DatePicker with available dates fetched via server action, loading skeleton |
| `src/app/idopontfoglalas/steps/StepSelectTime.tsx` | Step 3: TimeslotGrid with available slots, waitlist signup if no slots |
| `src/app/idopontfoglalas/steps/StepPatientInfo.tsx` | Step 4: name/email/phone form with Zod validation, summary bar |
| `src/app/idopontfoglalas/steps/StepConfirmation.tsx` | Step 5: summary card, "Idopont foglalasa" CTA, calls `createBooking()`, handles loading/error/success |
| `src/components/booking/WaitlistSignup.tsx` | Client: email input + submit button for waitlist signup when no slots available |

**Server actions to create** (in existing files):
| Function | File | Purpose |
|----------|------|---------|
| `getAvailableDates()` | `src/lib/booking/slots.ts` | Returns string[] of ISO dates with >= 1 available slot for next 60 days |
| `createWaitlistEntry()` | `src/lib/booking/actions/create-waitlist-entry.ts` | Insert into `waitlist_entries` table |

**Success criteria**:
1. `/idopontfoglalas` renders the booking wizard with step 1 visible
2. Step 1: clicking a type card advances to step 2 with slide animation
3. Step 2: calendar shows available dates (green) for selected type, clicking a date advances to step 3
4. Step 3: time grid shows available slots, clicking one advances to step 4. If no slots, waitlist signup appears
5. Step 4: form validates on submit (Zod), error messages appear inline in Hungarian
6. Step 5: shows summary, "Idopont foglalasa" button calls `createBooking()`, loading spinner during submission
7. On success: redirects to `/idopontfoglalas/visszaigazolas?id=<uuid>`
8. On `SLOT_UNAVAILABLE`: shows error toast, returns to step 3 with fresh slots
9. "Vissza" links navigate backward with reverse slide animation
10. All text is Hungarian, responsive from 320px to 1440px
11. SEO metadata set: title "Idopontfoglalas", description in Hungarian

---

### Plan 10-07: Confirmation Page

**What**: Build the booking success page shown after completing the wizard.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/idopontfoglalas/visszaigazolas/page.tsx` | Server component: fetches appointment by `searchParams.id`, renders success UI with animated checkmark, appointment details, email notice, cancellation info |

**Success criteria**:
1. `/idopontfoglalas/visszaigazolas?id=<valid-uuid>` shows green animated checkmark, "Sikeres foglalas!" heading
2. Appointment details (type, date, time, duration) are displayed
3. Email notice: "Visszaigazolo emailt kuldtunk a(z) email@example.com cimre"
4. Cancellation notice in yellow box: mentions 24-hour cancellation window
5. "Vissza a fooldallra" button links to `/`
6. Missing or invalid `id` redirects to `/idopontfoglalas`
7. All text Hungarian, centered layout, max-w-2xl

---

### Plan 10-08: Toast System + Confirm Dialog

**What**: Create the shared UI infrastructure needed across admin and public pages.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/components/ui/Toast.tsx` | Client: toast notification component (success/error/info/warning variants), auto-dismiss 5s, slide-in animation |
| `src/components/ui/ToastProvider.tsx` | Client: React context provider with `useToast()` hook, stacked toasts |
| `src/components/ui/ConfirmDialog.tsx` | Client: modal with backdrop blur, title/description/confirm/cancel buttons, danger variant, focus trap, ESC to close |
| `src/components/ui/Skeleton.tsx` | Server: `SkeletonCard`, `SkeletonRow`, `SkeletonText`, `SkeletonCircle` variants |

**Files to modify**:
| File | Change |
|------|--------|
| `src/app/layout.tsx` | Wrap children in `<ToastProvider>` |

**Success criteria**:
1. `useToast()` hook works from any client component
2. Toasts stack vertically in bottom-right corner, auto-dismiss after 5 seconds
3. ConfirmDialog traps focus, closes on ESC, prevents body scroll
4. ConfirmDialog danger variant shows red confirm button
5. Skeleton components render pulsing gray placeholders

---

### Phase 10 Testing Checklist

- [ ] Slot engine returns correct slots for weekday dates
- [ ] Slot engine returns [] for Sundays and closed override dates
- [ ] Slot engine excludes occupied time ranges
- [ ] Slot engine excludes past slots on today's date
- [ ] `/api/slots` returns valid JSON with slots array
- [ ] `/api/slots` rejects invalid parameters with 400
- [ ] `createBooking()` inserts patient + appointment in single transaction
- [ ] `createBooking()` handles concurrent bookings (SLOT_UNAVAILABLE on race)
- [ ] `createBooking()` generates unique cancellation token
- [ ] Cancellation page shows all 4 states correctly
- [ ] Cancel action updates appointment status and cancelledAt
- [ ] Booking wizard completes full 5-step flow on desktop
- [ ] Booking wizard completes full 5-step flow on mobile (320px)
- [ ] Step transitions animate correctly (forward = slide left, backward = slide right)
- [ ] Waitlist signup appears when no slots available on selected date
- [ ] Confirmation page shows appointment details after successful booking
- [ ] Toast notifications appear and auto-dismiss
- [ ] ConfirmDialog opens/closes with proper focus management
- [ ] All user-facing text is Hungarian
- [ ] TypeScript build passes
- [ ] Biome lint passes

---

## 4. Phase 11: Email + Calendar Integration

**Goal**: Booking confirmations, cancellation notices, and 24-hour reminders are sent automatically via Gmail API. Appointments appear as events in Google Calendar. A daily cron job processes reminders and expires stale waitlist entries. Waitlist processing notifies the top 3 matching entries when a slot opens up.

**Depends on**: Phase 10 (booking/cancellation flows must exist to wire email triggers into)

**Estimated Plans**: 6 plans (~30 min each)

---

### Plan 11-01: Gmail API OAuth2 Client

**What**: Set up the Gmail API client using OAuth2 refresh token for sending emails. Create the email template variable replacement system and notification logging.

**Packages to install**:
```bash
npm install googleapis@^144.0.0 nodemailer@^6.9.0
npm install -D @types/nodemailer@^6.4.17
```

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/email/gmail-client.ts` | Factory: `getGmailClient()` using OAuth2 with `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` |
| `src/lib/email/send-email.ts` | `sendBookingEmail()`: look up template by event+recipientType -> replace $variables -> build MIME via MailComposer -> send via Gmail API -> log to `notification_log` |

**Environment variables to add**:
```
GMAIL_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REFRESH_TOKEN=1//0xxxxxxxxxxxxxxxxxxxxxxxxxx
GMAIL_USER_EMAIL=rendelo@morocz.hu
```

**Success criteria**:
1. `sendBookingEmail()` sends an email to a test address via Gmail API
2. Template variables ($patientName, $appointmentDate, etc.) are replaced in subject and body
3. Email is UTF-8 encoded (Hungarian characters render correctly)
4. Successful send is logged in `notification_log` with `status = 'sent'`
5. Failed send is logged with `status = 'failed'` and `error_message`
6. Missing template logs a warning but does not throw

---

### Plan 11-02: Wire Emails into Booking + Cancellation

**What**: Connect the email system to the existing booking and cancellation server actions. After a booking, send confirmation to patient + notification to doctor. After a cancellation, send notices to both.

**Files to modify**:
| File | Change |
|------|--------|
| `src/lib/booking/actions/create-booking.ts` | Uncomment/add `sendBookingEmail()` calls for `appointment_created` (patient) and `appointment_created` (doctor). Non-blocking: wrap in try/catch, log errors, do not fail the booking. |
| `src/lib/booking/actions/cancel-appointment.ts` | Add `sendBookingEmail()` calls for `cancelled_by_patient` (patient) and `cancelled_by_patient` (doctor). Non-blocking. |

**Success criteria**:
1. After booking: patient receives confirmation email; doctor receives notification email
2. After cancellation: patient receives cancellation email; doctor receives notification
3. Email failure does not prevent booking/cancellation from succeeding
4. All emails appear in `notification_log`

---

### Plan 11-03: Google Calendar Integration

**What**: Set up Google Calendar service account client and wire event creation/deletion into booking and cancellation flows.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/calendar/google-calendar.ts` | Factory: `getCalendarClient()` using service account credentials (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`) |
| `src/lib/booking/google-calendar.ts` | `createCalendarEvent()`, `updateCalendarEvent()`, `deleteCalendarEvent()` -- create events with summary format "Vizit: LastName FirstName -- Type", Budapest timezone |

**Environment variables to add**:
```
GOOGLE_CLIENT_EMAIL=booking@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=doctor@morocz.hu
```

**Files to modify**:
| File | Change |
|------|--------|
| `src/lib/booking/actions/create-booking.ts` | Add `createCalendarEvent()` call after successful insert; store `googleEventId` in appointment. Non-blocking. |
| `src/lib/booking/actions/cancel-appointment.ts` | Add `deleteCalendarEvent()` call when `googleEventId` exists. Non-blocking. |

**Success criteria**:
1. After booking: a Google Calendar event appears in the configured calendar
2. Event summary: "Vizit: Kovacs Anna -- Nogyogyaszat"
3. Event description includes patient name, email, phone, appointment ID
4. Event timezone is `Europe/Budapest`
5. After cancellation: the calendar event is deleted
6. Calendar failure does not prevent booking/cancellation from succeeding
7. `googleEventId` is stored in the appointment record

---

### Plan 11-04: Vercel Cron -- Daily Reminders

**What**: Create the cron job route handler that sends 24-hour reminders and expires stale waitlist entries.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/api/cron/send-reminders/route.ts` | `POST` handler: verify `CRON_SECRET` -> find confirmed appointments 24-28h from now with no reminder sent -> send `reminder_24h` email to each -> mark `reminderSentAt` -> expire waitlist entries past `preferredDateTo` |
| `vercel.json` | Cron configuration: `{ "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0 8 * * *" }] }` |

**Environment variables to add**:
```
CRON_SECRET=<openssl rand -hex 32>
```

**Success criteria**:
1. `POST /api/cron/send-reminders` with valid `Authorization: Bearer <CRON_SECRET>` returns 200 with `{ ok: true, reminders: N, errors: N, waitlistExpired: N }`
2. Invalid/missing bearer token returns 401
3. Appointments within 24-28 hour window receive reminder emails
4. `reminderSentAt` is set after successful send (prevents duplicate reminders)
5. Waitlist entries with `preferredDateTo` in the past are set to `status = 'expired'`

---

### Plan 11-05: Waitlist Processing

**What**: When an appointment is cancelled, find matching waitlist entries and notify the top 3 via email.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/booking/waitlist.ts` | `processWaitlistForSlot(startTime, endTime, appointmentTypeId)`: fetch waiting entries (FIFO) -> filter by type/day/time/date preferences -> take top 3 -> send `waitlist_slot_available` email -> update status to `notified` |

**Files to modify**:
| File | Change |
|------|--------|
| `src/lib/booking/actions/cancel-appointment.ts` | Add `processWaitlistForSlot()` call after status update. Non-blocking. |

**Success criteria**:
1. Cancelling an appointment triggers waitlist processing
2. Matching entries (by type, day, time, date range) are found
3. Top 3 entries receive notification emails
4. Notified entries have `status = 'notified'` and `notifiedAt` set
5. Non-matching entries are not notified
6. Waitlist processing failure does not prevent cancellation

---

### Plan 11-06: Notification Logging + Monitoring

**What**: Verify the complete notification pipeline, ensure all sends/failures are logged, and add monitoring notes for production.

**Files to modify**:
| File | Change |
|------|--------|
| `src/lib/email/send-email.ts` | Ensure all code paths (success, failure, missing template) write to `notification_log` |

**Success criteria**:
1. Every email sent appears in `notification_log` with correct `templateEvent`, `recipientEmail`, `subject`, `status`
2. Failed emails have `errorMessage` populated
3. Missing templates log with `[MISSING TEMPLATE]` subject prefix
4. `notification_log` never has orphaned rows (all foreign keys are nullable with SET NULL)

---

### Phase 11 Testing Checklist

- [ ] Gmail API sends email to test address with Hungarian characters
- [ ] Booking confirmation email is received by patient
- [ ] Booking notification email is received by doctor
- [ ] Cancellation emails are received by patient and doctor
- [ ] 24-hour reminder email is sent for tomorrow's appointments
- [ ] Reminder is not re-sent (reminderSentAt prevents duplicates)
- [ ] Google Calendar event is created on booking
- [ ] Google Calendar event is deleted on cancellation
- [ ] Calendar event has correct timezone, summary, description
- [ ] Cron endpoint rejects unauthorized requests with 401
- [ ] Cron endpoint processes reminders and returns count
- [ ] Waitlist: cancellation triggers notification to top 3 matching entries
- [ ] Waitlist: non-matching entries are not notified
- [ ] Waitlist: expired entries are cleaned up by cron
- [ ] All notification_log entries are present for all email operations
- [ ] Email/calendar failures do not break booking/cancellation flows
- [ ] TypeScript build passes
- [ ] Biome lint passes

---

## 5. Phase 12: Admin Panel

**Goal**: The doctor can manage everything from the admin panel: view today's appointments, manage all appointments (calendar + list views), search and edit patients, configure the weekly schedule, manage appointment types, edit email templates, process the waitlist, update clinic settings, and manage admin users. The CSV import of 2,320 existing patients is complete.

**Depends on**: Phase 11 (email system must work for status change notifications and waitlist management)

**Estimated Plans**: 12 plans (~30 min each)

---

### Plan 12-01: Admin Shared Components

**What**: Create the generic DataTable, StatusBadge, EmptyState, and Switch components used across all admin pages.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/components/admin/DataTable.tsx` | Client: generic sortable, paginated table with columns config, loading skeleton, empty state, pagination bar ("Elozo"/"Kovetkezo"), row click handler |
| `src/components/admin/StatusBadge.tsx` | Server: color-coded pill badges for all 8 statuses (4 appointment + 4 waitlist) |
| `src/components/admin/EmptyState.tsx` | Server: centered icon + title + description + optional action button |
| `src/components/ui/Switch.tsx` | Client: toggle switch component (active=green, inactive=gray) |
| `src/components/ui/DateRangePicker.tsx` | Client: extends DatePicker for start+end date selection, range highlighting |

**Success criteria**:
1. DataTable renders with sorting indicators, pagination, loading skeletons
2. StatusBadge shows correct color and Hungarian label for all 8 statuses
3. EmptyState renders centered message with optional action button
4. Switch toggles between active/inactive states with smooth transition
5. DateRangePicker highlights selected range

---

### Plan 12-02: Dashboard Page

**What**: Build the admin dashboard with today's appointment count, waitlist count, weekly completed count, today's timeline, and quick action buttons.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/page.tsx` | Server component: parallel fetch (today's count, waitlist count, weekly completed, today's appointments), render StatsCardRow + TodayTimeline + QuickActions |
| `src/components/admin/TodayTimeline.tsx` | Client: vertical timeline of today's appointments (time, color bar, patient name, type, status badge), click navigates to detail |

**Admin server actions to create**:
| Function | File | Purpose |
|----------|------|---------|
| `getDashboardStats()` | `src/lib/admin/actions/dashboard.ts` | Returns today's count, waitlist count, weekly completed count |
| `getTodayAppointments()` | `src/lib/admin/actions/dashboard.ts` | Returns today's appointments ordered by startTime |

**Success criteria**:
1. Dashboard shows 3 stat cards: "Mai idopontok", "Varakozok", "Heti osszesites"
2. Today's timeline shows appointments in chronological order with color bars
3. Empty timeline shows "Ma nincsenek idopontok"
4. Quick action buttons link to appointments, patients, settings
5. Stat cards are responsive (3-column on desktop, stacked on mobile)

---

### Plan 12-03: Appointments List Page (Calendar + List Views)

**What**: Build the appointments management page with toggle between calendar (week) and list views, status/type/date filters, and server-side pagination.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/appointments/page.tsx` | Server component: read searchParams for filters, fetch appointments, render AppointmentsView |
| `src/components/admin/AppointmentsView.tsx` | Client: view toggle (Naptar/Lista), filter bar (DateRangePicker, status select, type select) |
| `src/components/admin/WeekCalendar.tsx` | Client: 6-column week grid (Mon-Sat), time axis, appointment blocks positioned by time, current time indicator, week navigation |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `listAppointments()` | `src/lib/admin/actions/appointments.ts` (already defined in 02-backend-api-design.md) |

**Success criteria**:
1. List view: DataTable with columns Datum, Ido, Beteg, Tipus, Statusz, Muveletek
2. Calendar view: week grid with colored appointment blocks positioned by time
3. Filters update URL searchParams and trigger server refetch
4. Server-side pagination: 20 per page
5. Calendar view hidden on mobile (< md)
6. Week navigation: "Elozo het" / "Ma" / "Kovetkezo het"
7. Current time indicator (red line) visible in calendar

---

### Plan 12-04: Appointment Detail Page

**What**: Build the appointment detail page with status change dropdown, notes editor, patient info card, and status history timeline.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/appointments/[id]/page.tsx` | Server component: fetch appointment by ID with patient + type + notifications, render detail layout |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `getAppointment()` | `src/lib/admin/actions/appointments.ts` |
| `updateAppointmentStatus()` | `src/lib/admin/actions/appointments.ts` |
| `addAppointmentNotes()` | `src/lib/admin/actions/appointments.ts` |

**Success criteria**:
1. Shows appointment details: type with color dot, date, time, duration, status badge
2. Status change dropdown triggers ConfirmDialog, then updates status via server action
3. Status change sends email notification to patient (if template exists)
4. Notes textarea saves via server action, shows success toast
5. Patient info card links to `/admin/patients/[patientId]`
6. Status history timeline shows notification_log entries
7. Google Calendar link shown when googleEventId exists
8. Two-column layout on desktop, stacked on mobile

---

### Plan 12-05: Patients List + Detail Pages

**What**: Build the patient management pages: searchable list with 2,300+ patients (server-side ILIKE search, pagination) and patient detail with edit form and appointment history.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/patients/page.tsx` | Server component: read searchParams, fetch patients, render search bar + DataTable |
| `src/app/admin/patients/[id]/page.tsx` | Server component: fetch patient with appointments, render header + edit form + appointment history |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `listPatients()` | `src/lib/admin/actions/patients.ts` |
| `getPatient()` | `src/lib/admin/actions/patients.ts` |
| `updatePatient()` | `src/lib/admin/actions/patients.ts` |
| `deletePatient()` | `src/lib/admin/actions/patients.ts` (GDPR anonymization) |

**Success criteria**:
1. Patient list: debounced search (300ms) queries against firstName, lastName, email, phone via ILIKE
2. Server-side pagination: 20 per page, total count displayed
3. Table columns: Nev, Email, Telefon, Utolso idopont, Osszesen (appointment count)
4. Row click navigates to patient detail
5. Patient detail: shows name, email, phone, date of birth, notes
6. Edit mode: inline form replaces display, validates with Zod
7. Appointment history table: Datum, Tipus, Statusz, Megjegyzes
8. GDPR delete: anonymizes PII, does not hard-delete

---

### Plan 12-06: Schedule Editor Page

**What**: Build the weekly schedule editor (Mon-Sat time inputs with active toggles) and schedule overrides management (add/delete date exceptions).

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/schedule/page.tsx` | Server component: fetch weekly schedule + overrides + appointment types, render editors |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `getWeeklySchedule()` | `src/lib/admin/actions/schedule.ts` |
| `createScheduleSlot()` | `src/lib/admin/actions/schedule.ts` |
| `updateScheduleSlot()` | `src/lib/admin/actions/schedule.ts` |
| `deleteScheduleSlot()` | `src/lib/admin/actions/schedule.ts` |
| `listOverrides()` | `src/lib/admin/actions/schedule.ts` |
| `createOverride()` | `src/lib/admin/actions/schedule.ts` |
| `deleteOverride()` | `src/lib/admin/actions/schedule.ts` |

**Success criteria**:
1. Weekly schedule: 6 rows (Mon-Sat) with time inputs and active toggles
2. Save button bulk-updates all schedule rows
3. Overrides table: columns Idoszak, Zarva?, Idopont, Ok, Muveletek
4. Add override form: collapsible, DateRangePicker + closed checkbox + time inputs + reason
5. Delete override triggers ConfirmDialog
6. Upcoming overrides (within 14 days) have visual indicator
7. Appointment type durations displayed read-only with link to `/admin/appointment-types`

---

### Plan 12-07: Appointment Types Management Page

**What**: Build the appointment type CRUD page with colored cards, edit modal, reorder buttons.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/appointment-types/page.tsx` | Server component: fetch types, render card grid + add button + edit modal |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `listTypes()` | `src/lib/admin/actions/appointment-types.ts` |
| `createType()` | `src/lib/admin/actions/appointment-types.ts` |
| `updateType()` | `src/lib/admin/actions/appointment-types.ts` |
| `toggleTypeActive()` | `src/lib/admin/actions/appointment-types.ts` |

**Success criteria**:
1. Card grid: 1/2/3 columns responsive, each card shows color swatch + name + slug + duration + active toggle
2. Add button opens modal with name, slug (auto-generated), duration, color picker (8 presets)
3. Edit button opens same modal pre-filled
4. Reorder buttons update `sortOrder`
5. Active toggle soft-deactivates type (does not delete)
6. Zod validation on name, slug format, duration range, hex color

---

### Plan 12-08: Message Template Editor Page

**What**: Build the email template editor with sidebar list, subject/body editing, variable insertion bar, and live preview.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/messages/page.tsx` | Server component: fetch all templates, render MessageTemplateEditor |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `listTemplates()` | `src/lib/admin/actions/message-templates.ts` |
| `updateTemplate()` | `src/lib/admin/actions/message-templates.ts` |
| `previewTemplate()` | `src/lib/admin/actions/message-templates.ts` |

**Success criteria**:
1. Template sidebar: lists all 10 templates grouped by event, shows recipient badge
2. Clicking a template loads subject + body into edit panel
3. Variable insertion bar: clicking a variable pill inserts it at cursor position in body textarea
4. Live preview panel: replaces $variables with sample Hungarian data
5. Save button updates template, shows success toast
6. Responsive: sidebar becomes horizontal tabs on mobile (< md)

---

### Plan 12-09: Waitlist + Settings + Users Pages

**What**: Build the remaining three admin pages: waitlist management, doctor/clinic settings, and admin user management.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/app/admin/waitlist/page.tsx` | Server component: fetch waitlist entries, render DataTable with status filter + manual notify + bulk delete |
| `src/app/admin/settings/page.tsx` | Server component: fetch doctor_settings, render form with 3 sections (Rendelo adatok, Google Naptar, Idopont beallitasok) |
| `src/app/admin/users/page.tsx` | Server component (admin-only): fetch admin_users, render DataTable + add user modal |

**Admin server actions (extend existing)**:
| Function | File |
|----------|------|
| `listWaitlist()` | `src/lib/admin/actions/waitlist.ts` |
| `deleteWaitlistEntry()` | `src/lib/admin/actions/waitlist.ts` |
| `manualNotifyEntry()` | `src/lib/admin/actions/waitlist.ts` |
| `getSettings()` | `src/lib/admin/actions/settings.ts` |
| `updateSettings()` | `src/lib/admin/actions/settings.ts` |
| `listUsers()` | `src/lib/admin/actions/admin-users.ts` |
| `createUser()` | `src/lib/admin/actions/admin-users.ts` |
| `deactivateUser()` | `src/lib/admin/actions/admin-users.ts` |

**Success criteria**:
1. Waitlist: DataTable with Nev, Email, Telefon, Tipus, Preferencia, Statusz, Datum, Muveletek
2. Waitlist: "Ertesites kuldese" button triggers manual notification email (ConfirmDialog first)
3. Waitlist: "Lejart bejegyzesek torlese" bulk deletes expired entries
4. Settings: form with clinic name, doctor name, email, phone, address, Google Calendar ID, slot duration, cancellation window
5. Settings: save shows success toast
6. Users: DataTable with Nev, Email, Szerepkor badge, Aktiv toggle, Muveletek
7. Users: add user modal with name, email, password, password confirm, role select
8. Users: deactivate user shows ConfirmDialog, cannot deactivate self
9. Users page only accessible to admin role (receptionist redirected)

---

### Plan 12-10: Admin Zod Schemas

**What**: Create all Zod validation schemas used by admin server actions.

**Files to create**:
| File | Purpose |
|------|---------|
| `src/lib/admin/schemas.ts` | All admin Zod schemas: `paginationSchema`, `patientListSchema`, `appointmentListSchema`, `waitlistListSchema`, `updatePatientSchema`, `updateAppointmentStatusSchema`, `addAppointmentNotesSchema`, `scheduleSlotSchema`, `scheduleOverrideSchema`, `appointmentTypeSchema`, `updateTemplateSchema`, `updateSettingsSchema`, `createAdminUserSchema`, `updateAdminUserSchema` |

**Success criteria**:
1. All schemas validate correct input and reject invalid input
2. Error messages are descriptive (for developer debugging, not user-facing)
3. Pagination defaults: page=1, pageSize=20
4. Schedule refinements: startTime < endTime, startDate <= endDate
5. Admin user: password min 8 chars, email unique check

---

### Plan 12-11: All Admin Server Actions

**What**: Create every admin server action file as defined in `02-backend-api-design.md` section 11.

**Files to create**:
| File | Functions |
|------|-----------|
| `src/lib/admin/actions/dashboard.ts` | `getDashboardStats()`, `getTodayAppointments()` |
| `src/lib/admin/actions/patients.ts` | `listPatients()`, `getPatient()`, `updatePatient()`, `deletePatient()` |
| `src/lib/admin/actions/appointments.ts` | `listAppointments()`, `getAppointment()`, `updateAppointmentStatus()`, `addAppointmentNotes()` |
| `src/lib/admin/actions/schedule.ts` | `getWeeklySchedule()`, `createScheduleSlot()`, `updateScheduleSlot()`, `deleteScheduleSlot()`, `listOverrides()`, `createOverride()`, `updateOverride()`, `deleteOverride()` |
| `src/lib/admin/actions/appointment-types.ts` | `listTypes()`, `createType()`, `updateType()`, `toggleTypeActive()` |
| `src/lib/admin/actions/message-templates.ts` | `listTemplates()`, `getTemplate()`, `updateTemplate()`, `previewTemplate()` |
| `src/lib/admin/actions/waitlist.ts` | `listWaitlist()`, `deleteWaitlistEntry()`, `manualNotifyEntry()` |
| `src/lib/admin/actions/settings.ts` | `getSettings()`, `updateSettings()` |
| `src/lib/admin/actions/admin-users.ts` | `listUsers()`, `createUser()`, `updateUser()`, `deactivateUser()` |

**Every action follows this pattern**:
1. Call `requireAuth()` or `requireAdmin()`
2. Validate input with Zod schema
3. Execute database query
4. Return `ActionResult<T>`
5. Catch errors, return typed error codes

**Success criteria**:
1. Every action rejects unauthenticated calls with `UNAUTHORIZED`
2. Every action validates input and returns `VALIDATION_ERROR` on bad input
3. Every action returns proper `NOT_FOUND` for missing entities
4. Admin-only actions reject receptionist role with `FORBIDDEN`
5. Patient delete performs GDPR anonymization
6. Appointment status change triggers email + calendar side effects

---

### Plan 12-12: CSV Patient Import

**What**: Create the CSV import script for the 2,320 existing patients.

**Packages to install**:
```bash
npm install csv-parse@^5.6.0
```

**Files to create**:
| File | Purpose |
|------|---------|
| `scripts/import-patients.ts` | CLI script: reads CSV file -> parses rows -> validates email -> normalizes phone to E.164 -> upserts by email -> reports imported/skipped/errors count |

**Files to modify**:
| File | Change |
|------|--------|
| `package.json` | Add `"db:import": "tsx scripts/import-patients.ts"` script |

**Execution**:
```bash
npm run db:import -- ./patients.csv
```

**Success criteria**:
1. Script reads CSV with columns: firstName, lastName, email, phone, lastAppointment
2. Handles UTF-8 BOM
3. Normalizes phone numbers: "36xxx" -> "+36xxx", "06xxx" -> "+36xxx"
4. Parses M/D/YYYY dates into ISO format, stores in `importedLastAppointment`
5. Skips rows with invalid/missing email
6. Skips rows containing "test" in the name
7. Upserts by email (ON CONFLICT DO UPDATE)
8. Reports: "Imported: 2310, Skipped: 10, Errors: 0" (approximate)
9. Idempotent: running twice does not create duplicates

---

### Phase 12 Testing Checklist

- [ ] Dashboard stat cards show correct counts
- [ ] Dashboard timeline shows today's appointments in order
- [ ] Appointments list view: pagination, sorting, filtering all work
- [ ] Appointments calendar view: blocks positioned correctly, week navigation works
- [ ] Appointment detail: status change updates DB + sends email
- [ ] Appointment detail: notes save correctly
- [ ] Patient search: ILIKE query returns correct results for partial name/email/phone
- [ ] Patient list: pagination shows correct total count (2,300+)
- [ ] Patient detail: edit form saves changes
- [ ] Patient delete: anonymizes PII, does not hard-delete
- [ ] Schedule editor: save updates all 6 day rows
- [ ] Schedule overrides: add/delete works, ConfirmDialog on delete
- [ ] Appointment types: create/edit/toggle active/reorder all work
- [ ] Message templates: select, edit, save, preview with sample data
- [ ] Variable insertion inserts at cursor position
- [ ] Waitlist: manual notify sends email and updates status
- [ ] Waitlist: bulk delete removes expired entries
- [ ] Settings: all fields save correctly
- [ ] Users: create new user with hashed password
- [ ] Users: deactivate user prevents login
- [ ] Users: cannot deactivate self
- [ ] Users page not accessible to receptionist role
- [ ] CSV import: 2,320 patients imported successfully
- [ ] CSV import: phone numbers normalized to E.164
- [ ] CSV import: duplicate emails handled via upsert
- [ ] All admin pages render correctly on desktop and mobile
- [ ] All admin text is Hungarian
- [ ] TypeScript build passes
- [ ] Biome lint passes

---

## 6. Complete Environment Variables

All environment variables across all 4 phases. Add to `.env.local` for development and Vercel Environment Variables for production.

```bash
# ═══════════════════════════════════════════════════
# Phase 9: Database + Auth
# ═══════════════════════════════════════════════════

# Neon PostgreSQL (Frankfurt eu-central-1)
DATABASE_URL=postgresql://user:password@ep-xxx-xxx-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET=<openssl rand -hex 32>
NEXTAUTH_URL=http://localhost:3000                # production: https://morocz.hu

# ═══════════════════════════════════════════════════
# Phase 10: Core Booking Engine
# ═══════════════════════════════════════════════════

# Public site URL (used in cancellation links, confirmation pages)
NEXT_PUBLIC_SITE_URL=https://morocz.hu

# ═══════════════════════════════════════════════════
# Phase 11: Email + Calendar
# ═══════════════════════════════════════════════════

# Gmail API (OAuth2 refresh token for sending emails)
GMAIL_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REFRESH_TOKEN=1//0xxxxxxxxxxxxxxxxxxxxxxxxxx
GMAIL_USER_EMAIL=rendelo@morocz.hu

# Google Calendar API (service account)
GOOGLE_CLIENT_EMAIL=booking@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=doctor@morocz.hu

# Vercel Cron
CRON_SECRET=<openssl rand -hex 32>
```

**Summary table**:

| Variable | Phase | Server/Public | Required |
|----------|-------|---------------|----------|
| `DATABASE_URL` | 9 | Server | Yes |
| `NEXTAUTH_SECRET` | 9 | Server | Yes |
| `NEXTAUTH_URL` | 9 | Server | Yes |
| `NEXT_PUBLIC_SITE_URL` | 10 | Public | Yes |
| `GMAIL_CLIENT_ID` | 11 | Server | Yes |
| `GMAIL_CLIENT_SECRET` | 11 | Server | Yes |
| `GMAIL_REFRESH_TOKEN` | 11 | Server | Yes |
| `GMAIL_USER_EMAIL` | 11 | Server | Yes |
| `GOOGLE_CLIENT_EMAIL` | 11 | Server | Yes |
| `GOOGLE_PRIVATE_KEY` | 11 | Server | Yes |
| `GOOGLE_CALENDAR_ID` | 11 | Server | Yes |
| `CRON_SECRET` | 11 | Server | Yes |

---

## 7. External Service Setup Checklist

Complete these manual setup tasks before starting each phase. Each task has an estimated time.

### Before Phase 9 (Database + Auth)

- [ ] **Create Neon account** (5 min) -- https://neon.tech
- [ ] **Create Neon project** in Frankfurt (`eu-central-1`) region (2 min)
- [ ] **Copy `DATABASE_URL`** from Neon dashboard Connection Details (1 min)
- [ ] **Generate `NEXTAUTH_SECRET`** via `openssl rand -hex 32` (1 min)
- [ ] **Add env vars to `.env.local`**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (2 min)

### Before Phase 11 (Email + Calendar)

- [ ] **Create Google Cloud project** (5 min) -- https://console.cloud.google.com
- [ ] **Enable Gmail API** in Google Cloud Console (2 min)
- [ ] **Enable Google Calendar API** in Google Cloud Console (2 min)
- [ ] **Create OAuth2 credentials** (Web Application type) for Gmail API (5 min)
  - Authorized redirect URI: `https://developers.google.com/oauthplayground`
- [ ] **Obtain Gmail refresh token** via OAuth2 Playground (10 min)
  1. Go to https://developers.google.com/oauthplayground
  2. Settings gear -> Use your own OAuth credentials -> enter Client ID + Secret
  3. Scope: `https://mail.google.com/`
  4. Authorize the Gmail account (`rendelo@morocz.hu`)
  5. Exchange authorization code for tokens
  6. Copy the refresh token
- [ ] **Create Google service account** for Calendar API (5 min)
  - Create service account in Google Cloud Console
  - Download JSON key file
  - Extract `client_email` and `private_key`
- [ ] **Share Google Calendar** with service account email (2 min)
  - Open Google Calendar settings for the doctor's calendar
  - Add the service account email with "Make changes to events" permission
- [ ] **Generate `CRON_SECRET`** via `openssl rand -hex 32` (1 min)
- [ ] **Add all email/calendar env vars** to `.env.local` and Vercel (5 min)

### Before Phase 12 (Admin Panel)

- [ ] **Prepare patient CSV file** -- ensure columns: firstName, lastName, email, phone, lastAppointment (5 min)
- [ ] **Validate CSV** -- spot-check 10 rows for correct format, no test entries (5 min)

---

## 8. Migration Strategy

### Initial Migration (Phase 9)

```bash
# 1. Push Drizzle schema to Neon (creates all tables)
npm run db:push

# 2. Apply custom SQL migrations (exclusion constraint + CHECK constraints)
# Use Neon SQL Editor or psql:
psql $DATABASE_URL -f drizzle/migrations/custom/0001_appointment_exclusion_constraint.sql
psql $DATABASE_URL -f drizzle/migrations/custom/0002_check_constraints.sql

# 3. Seed initial data
npm run db:seed

# 4. Create first admin user
npx tsx scripts/create-admin.ts
```

### Ongoing Migrations (After Phase 9)

For any schema changes after the initial push:

1. Modify `src/db/schema.ts`
2. Run `npm run db:generate` to create a migration file in `drizzle/migrations/`
3. Review the generated SQL
4. Run `npm run db:migrate` to apply
5. Test locally, then deploy to Vercel (migrations run on first request)

**Important**: Never use `db:push` in production after the initial setup. Always use `db:generate` + `db:migrate` for tracked, reviewable migrations.

### Drizzle Kit Studio

```bash
npm run db:studio
```

Opens a web UI to browse and edit data directly. Useful during development for verifying seed data and testing queries. Do not use in production.

---

## 9. Deployment Considerations

### Vercel Environment Variables

All 12 environment variables must be set in the Vercel project settings before deploying booking system code:

1. Go to Vercel Dashboard -> Project -> Settings -> Environment Variables
2. Add each variable for **Production**, **Preview**, and **Development** environments
3. `NEXT_PUBLIC_SITE_URL` should differ per environment:
   - Production: `https://morocz.hu`
   - Preview: `https://morocz-git-<branch>.vercel.app` (or use `VERCEL_URL`)
   - Development: `http://localhost:3000`
4. `NEXTAUTH_URL` should match the deployment URL for each environment
5. `GOOGLE_PRIVATE_KEY` must be entered with literal `\n` characters (Vercel handles the escaping)

### Vercel Cron Setup

The `vercel.json` file configures the daily reminder cron:

```jsonc
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- Runs daily at 08:00 UTC = 09:00 CET / 10:00 CEST (Budapest)
- Vercel automatically adds `Authorization: Bearer <CRON_SECRET>` header
- Cron jobs are only available on Vercel Pro plan or higher
- On Hobby plan: use an external cron service (cron-job.org, Upstash QStash) to hit the endpoint

### Preview vs Production

- **Preview deployments** (PR branches): share the same Neon database unless configured otherwise. Consider using a separate Neon branch for preview deployments to avoid data conflicts.
- **Option A**: Single database for all environments (simpler, risk of test data in production)
- **Option B**: Neon branching -- create a branch per PR (safer, but adds complexity). Neon branching is instant and free on the Pro plan.
- **Recommendation**: Use a single database during development. Create a separate Neon branch for production before the booking system goes live.

### Middleware Considerations

The new `src/middleware.ts` file protects `/admin/*` routes. The existing Sanity Studio at `/studio` is NOT affected because the middleware matcher only targets `/admin/:path*`. However, verify that the middleware does not interfere with:

- `/api/auth/*` (NextAuth routes -- must be accessible)
- `/api/slots` (public slot endpoint)
- `/api/cron/*` (cron endpoints -- authenticated by bearer token, not session)
- `/studio/*` (Sanity Studio -- no auth required, uses Sanity's own auth)

### Build Size

New dependencies add approximately:
- `drizzle-orm` + `@neondatabase/serverless`: ~50KB gzipped
- `next-auth`: ~30KB gzipped
- `googleapis`: ~200KB gzipped (largest addition -- Google API client is heavy)
- `zod`: ~15KB gzipped
- `bcryptjs`: ~10KB gzipped
- `nodemailer`: ~25KB gzipped (MailComposer only)
- `lucide-react`: tree-shakeable, ~2KB per icon

Total estimated addition: ~330KB gzipped. The `googleapis` package is the heaviest; it is only imported in server-side code and does not affect client bundle size.

---

## 10. Risk Register

| # | Risk | Impact | Probability | Mitigation |
|---|------|--------|-------------|------------|
| 1 | **Neon cold start latency** -- Serverless PostgreSQL may have cold start delays on first query after idle period | Medium (slow first booking of the day) | Medium | Neon "Scale to Zero" can be disabled on paid plans. Alternatively, the cron job at 08:00 UTC warms the connection daily. |
| 2 | **Gmail API token revocation** -- OAuth2 refresh token can be revoked if the Google account password changes or consent is revoked | High (all emails stop) | Low | Monitor `notification_log` for `status = 'failed'` with `invalid_grant` errors. Alert admin to re-authorize. Document the re-authorization process. |
| 3 | **Double-booking race condition** -- Two concurrent booking requests for the same slot | High (data integrity) | Low | Three-layer defense: application-level check, `SELECT FOR UPDATE` in transaction, PostgreSQL exclusion constraint. The DB constraint is the last line of defense and is bulletproof. |
| 4 | **WebSocket driver needed for transactions** -- The `neon-http` driver does not support `SELECT FOR UPDATE` which requires a persistent connection | High (booking flow breaks) | High | Use `@neondatabase/serverless` Pool (WebSocket) for the transactional booking flow. Create `src/db/transactional.ts` with a separate pool connection. Test in Phase 10. |
| 5 | **Google Calendar service account not shared** -- If the doctor's calendar is not shared with the service account, all calendar operations fail silently | Medium (no calendar sync) | Medium | Calendar failures are non-blocking (booking succeeds without calendar). Include calendar sharing in the external setup checklist. Test with a manual event creation during Phase 11. |
| 6 | **CSV import data quality** -- Patient CSV may have duplicate emails, malformed phone numbers, or encoding issues | Low (data fixable) | High | Import script handles: UTF-8 BOM, phone normalization, email validation, upsert on conflict. Skip test entries. Report errors with line numbers. Run on a copy first. |
| 7 | **Vercel Cron plan limitation** -- Cron jobs require Vercel Pro plan | Medium (no automatic reminders) | Medium | If on Hobby plan, use an external cron service (cron-job.org, Upstash QStash) to POST to `/api/cron/send-reminders` with the `CRON_SECRET` bearer token. |
| 8 | **Middleware conflict with Sanity Studio** -- New middleware could interfere with `/studio` routes | High (Studio becomes inaccessible) | Low | Middleware matcher is explicitly `["/admin/:path*"]`. Verify during Phase 9 that `/studio` remains accessible. |
| 9 | **Large `googleapis` bundle** -- The Google APIs client is heavy and could slow build times | Low (server-only) | Medium | `googleapis` is only imported in server components and route handlers. It does not enter the client bundle. If build times are a concern, switch to direct Google REST API calls without the SDK. |
| 10 | **Patient data GDPR compliance** -- Hungarian GDPR (NAIH) requires data subject access and deletion rights | High (legal) | Medium | Implement GDPR anonymization (not hard-delete) in `deletePatient()`. Add data export functionality in a future phase if requested. All PII is in PostgreSQL, not Sanity. Cancellation tokens expire after appointment time. |
| 11 | **Concurrent schema changes** -- Drizzle migrations could conflict with manual SQL migrations | Medium (broken schema) | Low | After initial `db:push` + custom SQL, always use `db:generate` + `db:migrate`. Never use `db:push` in production. Keep custom SQL migrations tracked in `drizzle/migrations/custom/`. |
| 12 | **NextAuth.js v5 stability** -- Auth.js v5 is relatively new and may have edge cases | Medium (auth issues) | Low | Pin to a specific minor version. Test login/logout/session expiry/middleware thoroughly in Phase 9. Keep an eye on the Auth.js changelog for breaking changes. |

---

## Appendix A: Complete New File Tree

```
drizzle/
  migrations/
    custom/
      0001_appointment_exclusion_constraint.sql
      0002_check_constraints.sql
scripts/
  create-admin.ts
  import-patients.ts
src/
  app/
    admin/
      layout.tsx
      page.tsx
      login/
        page.tsx
        LoginForm.tsx
      appointments/
        page.tsx
        [id]/
          page.tsx
      patients/
        page.tsx
        [id]/
          page.tsx
      schedule/
        page.tsx
      appointment-types/
        page.tsx
      messages/
        page.tsx
      waitlist/
        page.tsx
      settings/
        page.tsx
      users/
        page.tsx
    api/
      auth/
        [...nextauth]/
          route.ts
      slots/
        route.ts
      cron/
        send-reminders/
          route.ts
    cancel/
      [token]/
        page.tsx
        CancelAction.tsx
    idopontfoglalas/
      page.tsx
      BookingWizard.tsx
      steps/
        StepSelectType.tsx
        StepSelectDate.tsx
        StepSelectTime.tsx
        StepPatientInfo.tsx
        StepConfirmation.tsx
      visszaigazolas/
        page.tsx
  components/
    admin/
      AdminLayout.tsx
      AdminSidebar.tsx
      AdminHeader.tsx
      DataTable.tsx
      StatusBadge.tsx
      EmptyState.tsx
      WeekCalendar.tsx
      TodayTimeline.tsx
      AppointmentsView.tsx
    booking/
      StepIndicator.tsx
      TimeslotGrid.tsx
      WaitlistSignup.tsx
    ui/
      DatePicker.tsx
      DateRangePicker.tsx
      ConfirmDialog.tsx
      Toast.tsx
      ToastProvider.tsx
      FormField.tsx
      Skeleton.tsx
      Switch.tsx
  db/
    index.ts
    schema.ts
    transactional.ts
    seed.ts
  lib/
    auth/
      index.ts
      auth.config.ts
      require-auth.ts
      types.d.ts
    booking/
      types.ts
      schemas.ts
      slots.ts
      timezone.ts
      google-calendar.ts
      waitlist.ts
      actions/
        create-booking.ts
        cancel-appointment.ts
        create-waitlist-entry.ts
    email/
      gmail-client.ts
      send-email.ts
    calendar/
      google-calendar.ts
    admin/
      schemas.ts
      actions/
        dashboard.ts
        patients.ts
        appointments.ts
        schedule.ts
        appointment-types.ts
        message-templates.ts
        waitlist.ts
        settings.ts
        admin-users.ts
  middleware.ts
drizzle.config.ts
vercel.json
```

Total new files: **72**

---

## Appendix B: Package Dependencies Summary

### Runtime Dependencies (to install)

```bash
npm install drizzle-orm@^0.38.0
npm install @neondatabase/serverless@^0.10.0
npm install next-auth@^5.0.0
npm install bcryptjs@^2.4.3
npm install zod@^3.23.0
npm install googleapis@^144.0.0
npm install nodemailer@^6.9.0
npm install csv-parse@^5.6.0
npm install date-fns@^4.1.0
npm install lucide-react@^0.460.0
```

### Dev Dependencies (to install)

```bash
npm install -D drizzle-kit@^0.30.0
npm install -D tsx@^4.19.0
npm install -D @types/bcryptjs@^2.4.6
npm install -D @types/nodemailer@^6.4.17
```

### Existing Dependencies (no change needed)

- `next@^15.2.0` -- App Router, Server Actions, middleware
- `react@^19.0.0` -- React 19
- `motion@^12.34.2` -- Animations (AnimatePresence, motion components)
- `tailwindcss@^4.0.0` -- Styling
- `typescript@^5` -- Type checking

---

## Appendix C: Consolidated Plan Count

| Phase | Plans | Estimated Time |
|-------|-------|----------------|
| Phase 9: Database + Auth Foundation | 5 plans | ~2.5 hours |
| Phase 10: Core Booking Engine | 8 plans | ~4 hours |
| Phase 11: Email + Calendar Integration | 6 plans | ~3 hours |
| Phase 12: Admin Panel | 12 plans | ~6 hours |
| **Total** | **31 plans** | **~15.5 hours** |

---

## Appendix D: Execution Order Summary

```
Phase 9 (5 plans) ─────────────────────────────────────┐
  09-01: Neon + Drizzle setup                           │
  09-02: Custom SQL migrations + seed data              │
  09-03: NextAuth.js configuration                      │ Database + Auth
  09-04: Admin login page + first admin user            │ must exist before
  09-05: Admin layout shell                             │ any booking logic
────────────────────────────────────────────────────────┘
                          │
                          ▼
Phase 10 (8 plans) ────────────────────────────────────┐
  10-01: Slot generation engine + timezone helpers      │
  10-02: Public slots API + validation schema           │
  10-03: Booking server action (transactional)          │ Core booking flow
  10-04: Cancellation system                            │ must exist before
  10-05: Shared booking UI components                   │ emails can be wired
  10-06: Public booking wizard (5-step)                 │
  10-07: Confirmation page                              │
  10-08: Toast system + confirm dialog                  │
───────────────────────────────────────────────────────┘
                          │
                          ▼
Phase 11 (6 plans) ────────────────────────────────────┐
  11-01: Gmail API client + send-email function         │
  11-02: Wire emails into booking + cancellation        │ Email + Calendar
  11-03: Google Calendar integration                    │ must exist before
  11-04: Vercel cron (daily reminders)                  │ admin can trigger
  11-05: Waitlist processing                            │ notifications
  11-06: Notification logging + monitoring              │
───────────────────────────────────────────────────────┘
                          │
                          ▼
Phase 12 (12 plans) ───────────────────────────────────┐
  12-01: Admin shared components                        │
  12-02: Dashboard page                                 │
  12-03: Appointments list (calendar + list views)      │
  12-04: Appointment detail page                        │
  12-05: Patients list + detail pages                   │ Full admin panel
  12-06: Schedule editor page                           │
  12-07: Appointment types management                   │
  12-08: Message template editor                        │
  12-09: Waitlist + settings + users pages              │
  12-10: Admin Zod schemas                              │
  12-11: All admin server actions                       │
  12-12: CSV patient import                             │
───────────────────────────────────────────────────────┘
```

**Note on plan ordering within Phase 12**: Plans 12-10 (Zod schemas) and 12-11 (server actions) are listed at the end but should be implemented early in Phase 12, as the admin pages depend on them. The recommended internal order is: 12-10 -> 12-11 -> 12-01 -> 12-02 through 12-09 -> 12-12.
