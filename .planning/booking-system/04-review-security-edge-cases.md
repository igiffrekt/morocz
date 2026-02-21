# Security, Edge Cases & Integration Review

**Reviewer**: security-reviewer
**Status**: Review Complete
**Date**: 2026-02-21
**Scope**: `01-database-schema.md`, `02-backend-api-design.md`, `03-frontend-ui-design.md`
**Context**: Medical appointment booking system handling patient PII for a Hungarian gynecology practice. GDPR applies. ~2,300 existing patients via CSV import.

---

## Review Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 7 |
| HIGH | 14 |
| MEDIUM | 16 |
| LOW | 10 |

---

## 1. Security Vulnerabilities

### SEC-01: Transaction driver does not support SELECT FOR UPDATE [CRITICAL]

**Location**: `02-backend-api-design.md` Section 5 (Database Connection) + Section 4.2 (Booking Flow) + Appendix B Item 1

The database connection in `01-database-schema.md` uses `neon(process.env.DATABASE_URL!)` with `drizzle/neon-http`. This is the HTTP-only driver. The booking flow in `02-backend-api-design.md` calls `db.transaction()` with `SELECT FOR UPDATE` inside it. The Neon HTTP driver does NOT support interactive transactions with row-level locking. `SELECT FOR UPDATE` requires a persistent connection (WebSocket or TCP).

The `01-database-schema.md` even acknowledges this in Section 5: "If explicit multi-statement transactions are needed later (e.g., complex booking flows with the exclusion constraint), switch to the WebSocket driver" -- and provides an optional `dbPool` export. But the booking code in `02-backend-api-design.md` calls `db.transaction()` on the HTTP driver `db` instance, not `dbPool`.

This means the `SELECT FOR UPDATE` in `createBooking()` will either:
- Silently fail to acquire a row lock (each statement runs on a separate HTTP connection)
- Throw a runtime error

The exclusion constraint at the PostgreSQL level remains the last line of defense, but the entire middle layer of double-booking prevention (the "Transaction layer" described in Section 4.3) is broken.

**Severity**: CRITICAL

**Fix**: The booking flow (`createBooking()` and any other transactional code) MUST use the WebSocket-based `dbPool` from `src/db/transactional.ts`, not the HTTP-based `db`. Explicitly import `dbPool` in `create-booking.ts` and `cancel-appointment.ts`. Add a comment in `src/db/index.ts` explaining when to use each driver. The `transactional.ts` file should not be marked "optional" -- it is required for correctness.

---

### SEC-02: No rate limiting on public booking or slots endpoint [CRITICAL]

**Location**: `02-backend-api-design.md` Sections 3.3 and 4.2; Appendix B Item 3

The `GET /api/slots` route handler and the `createBooking()` server action are both publicly accessible with zero rate limiting. This is acknowledged as "Open Question #3" in Appendix B but has no proposed solution in the actual design.

Attack vectors:
1. **Slot enumeration**: An attacker can scrape all available slots across all dates and appointment types by hammering `GET /api/slots` in a loop. Each call triggers 3-5 database queries (appointment type, settings, overrides, schedule, existing appointments). At 100 req/sec this creates significant database load on the Neon free/Pro tier.
2. **Booking spam**: A bot can submit thousands of `createBooking()` calls with garbage data, creating fake patients and fake appointments. Each booking also triggers Google Calendar API calls and Gmail API calls, potentially exhausting those quotas.
3. **Email bombing**: By submitting bookings with a victim's email address, an attacker can use the system as an email relay to flood someone's inbox with appointment confirmation emails.

**Severity**: CRITICAL

**Fix**: Implement rate limiting on three surfaces:
1. `GET /api/slots`: 30 requests per minute per IP (use `@upstash/ratelimit` with Vercel KV, or Vercel WAF rules).
2. `createBooking()`: 5 bookings per hour per IP and 3 bookings per hour per email address. Requires passing the client IP to the server action (available via `headers()` in Next.js).
3. `createWaitlistEntry()`: 5 entries per hour per email address.

Additionally, add a CAPTCHA (hCaptcha or Cloudflare Turnstile) to the booking form submission at Step 5. For a medical practice, bot prevention is essential.

---

### SEC-03: No CSRF protection on server actions [HIGH]

**Location**: `02-backend-api-design.md` Sections 4.2, 5.2, 11.x

Next.js Server Actions in production mode include built-in CSRF protection via `Origin` header checking. However, this relies on proper deployment configuration. If the `NEXTAUTH_URL` or domain configuration is misconfigured, or if the app is proxied without forwarding the `Origin` header, CSRF protection silently fails.

The `createBooking()` and `cancelAppointment()` server actions accept arbitrary data from the client with no additional CSRF token validation. The cancellation action is particularly sensitive because it only requires a token string parameter.

**Severity**: HIGH

**Fix**: For the public-facing actions (`createBooking`, `cancelAppointment`, `createWaitlistEntry`), add an explicit CSRF double-submit cookie check or rely on the built-in Next.js protection but explicitly validate the `Origin` header in a custom middleware layer. Document the requirement that the production deployment must forward `Origin` and `Host` headers correctly. Test CSRF protection as part of deployment verification.

---

### SEC-04: Cancellation token brute-force feasibility [HIGH]

**Location**: `01-database-schema.md` Section 6 (appointments table), `02-backend-api-design.md` Section 4.2

The cancellation token is generated using `randomBytes(32).toString("hex")` which produces 256 bits of entropy. This is cryptographically strong and brute-force resistant. The token is stored in a regular B-tree indexed column.

However, the cancellation lookup in `cancelAppointment()` and the cancel page `CancelPage` both perform a database query with the token immediately. There is no rate limiting on the `GET /cancel/[token]` page or the `cancelAppointment()` action. An attacker who wants to cancel someone's appointment can:
1. Enumerate tokens via the cancel page (each load triggers a DB query)
2. While 256-bit entropy makes brute force infeasible for a random token, the lack of rate limiting means the endpoint is vulnerable to timing-based oracle attacks if the database query timing leaks information

The bigger risk is the token appearing in server logs, referrer headers, or email client preview panes.

**Severity**: HIGH (downgraded from CRITICAL because of the 256-bit entropy, but the lack of rate limiting and potential for token leakage elevates it)

**Fix**:
1. Rate limit the `/cancel/[token]` route to 10 requests per minute per IP.
2. Add `Referrer-Policy: no-referrer` header to the cancel page response to prevent token leakage via referrer.
3. Ensure the cancellation URL uses HTTPS only (the `NEXT_PUBLIC_SITE_URL` should enforce `https://`).
4. After successful cancellation, null out the `cancellationToken` column so the same token cannot be used for information disclosure about the appointment.

---

### SEC-05: XSS via admin-editable email templates [HIGH]

**Location**: `02-backend-api-design.md` Section 6.2 (`wrapInHtmlLayout` and `sendBookingEmail`); `01-database-schema.md` Section 6 (message_templates table)

The message templates table stores `subject` and `body` as raw text. The `sendBookingEmail()` function replaces `$variable` placeholders with values and then injects the body into an HTML email wrapper using template literal interpolation: `${body}`. The body content comes from the database and is admin-editable.

If an admin account is compromised, an attacker could inject arbitrary HTML/JavaScript into the email template body. More critically, the `$variable` values include patient-controlled data such as `$patient_name` (derived from `firstName` + `lastName`). If a patient registers with a name containing HTML like `<script>alert('xss')</script>`, this gets substituted into the email body without HTML encoding.

While email clients generally strip JavaScript, HTML injection can be used for phishing (injecting fake login links, fake cancellation links, or misleading content into the email).

**Severity**: HIGH

**Fix**:
1. HTML-escape ALL `$variable` values before substitution in `sendBookingEmail()`. Use a function like `escapeHtml()` that encodes `<`, `>`, `&`, `"`, and `'`.
2. For the admin template preview in the frontend, render the body in a sandboxed `<iframe>` with `sandbox=""` attribute, never via `dangerouslySetInnerHTML` on the main page.
3. Validate the `subject` field for email header injection characters (newlines, carriage returns).

---

### SEC-06: Email header injection via template subject [HIGH]

**Location**: `02-backend-api-design.md` Section 6.2

The email subject is constructed by replacing `$variable` placeholders in the template subject. If a patient's name or an appointment type name contains newline characters (`\r\n`), these could be injected into the email subject header, potentially adding additional headers like `BCC:` to the outgoing email.

The `bookingSchema` validates `firstName` and `lastName` with `.min(2).max(100)` and `.trim()` but does NOT reject newline characters. The `appointmentTypeSchema` validates `name` with `.min(1).max(200)` but also does not reject newlines.

The Gmail API and `MailComposer` may provide some protection, but this is a defense-in-depth failure.

**Severity**: HIGH

**Fix**:
1. In `sendBookingEmail()`, strip all `\r` and `\n` characters from the final `subject` string before passing it to `MailComposer`.
2. In the Zod schemas for `firstName`, `lastName`, `bookingSchema`, and `appointmentTypeSchema.name`, add `.regex(/^[^\r\n]*$/)` to reject newline characters at validation time.

---

### SEC-07: IDOR on admin patient and appointment endpoints [MEDIUM]

**Location**: `02-backend-api-design.md` Sections 11.2 and 11.3

The `getPatient(id)`, `updatePatient(id, data)`, `deletePatient(id)`, `getAppointment(id)`, `updateAppointmentStatus(id, data)`, and `addAppointmentNotes(id, data)` server actions accept an `id` parameter directly from the client. They check `requireAuth()` (any authenticated user) but do not check whether the authenticated user has permission to access that specific record.

In the current design, both "admin" and "receptionist" roles have full access to all patients and all appointments. This is intentional per the design but should be explicitly documented. The risk is that a compromised receptionist account can modify or delete (anonymize) any patient record.

**Severity**: MEDIUM (acceptable for the current role model, but risky if roles expand)

**Fix**:
1. Make `deletePatient()` require `requireAdmin()` instead of `requireAuth()`. Patient anonymization (GDPR deletion) is a destructive operation that should be admin-only.
2. Add audit logging: log WHO performed the action, not just what happened. Currently, the `notification_log` only logs emails, not admin mutations. Add an `audit_log` table or at minimum include the admin user ID in `console.error/log` calls.
3. Document the access control model explicitly: receptionist can view/edit all patients and appointments, but only admin can delete/anonymize patients and manage users.

---

### SEC-08: Session does not track deactivation [MEDIUM]

**Location**: `02-backend-api-design.md` Section 2.1 (auth config) and Section 11.9 (deactivateUser)

When an admin deactivates a user via `deactivateUser(id)`, the user's `isActive` flag is set to `false`. However, the user's existing JWT session (valid for up to 8 hours per the `maxAge` configuration) remains valid. The `authorize()` callback checks `isActive` only at login time, not on subsequent requests. The `requireAuth()` and `requireAdmin()` helpers check the JWT token but do not re-validate `isActive` against the database.

This means a deactivated user retains full access for up to 8 hours after deactivation.

**Severity**: MEDIUM

**Fix**: Either:
1. (Recommended) In `requireAuth()`, add a database check: query `adminUsers` by `token.userId` and verify `isActive === true`. This adds one DB query per authenticated request but ensures immediate deactivation.
2. (Alternative) Reduce `maxAge` to 1 hour and implement a token blacklist for immediate revocation. More complex, less recommended.

---

### SEC-09: Google API credentials in environment variables without rotation strategy [MEDIUM]

**Location**: `02-backend-api-design.md` Section 12 (Environment Variables)

The Gmail OAuth2 refresh token (`GMAIL_REFRESH_TOKEN`) and the Google Calendar service account private key (`GOOGLE_PRIVATE_KEY`) are stored as environment variables. There is no mention of:
- How to rotate these credentials
- What happens if the Gmail refresh token is revoked (Google revokes after 6 months of inactivity or if the user changes their password)
- Alerting when the token expires (Appendix B Item 5 mentions monitoring but proposes no implementation)

For a medical practice, email delivery is critical (appointment confirmations, reminders). A silently expired token means patients stop receiving emails with no one noticing.

**Severity**: MEDIUM

**Fix**:
1. The cron job (`send-reminders`) should check the `notification_log` for recent failures. If the last N emails all failed, send an alert through an alternative channel (e.g., a separate SMTP provider or a webhook to Slack/Telegram).
2. Document the token rotation procedure for the clinic admin.
3. Add a health check endpoint that validates the Gmail API credentials are still valid (attempt `gmail.users.getProfile({ userId: "me" })`) and expose this in the admin settings page as a "connection status" indicator.

---

### SEC-10: Password policy is too weak [MEDIUM]

**Location**: `02-backend-api-design.md` Section 2.1 (loginSchema) and Section 11.1 (createAdminUserSchema)

The login schema requires `password: z.string().min(8)` and the create user schema requires `password: z.string().min(8).max(128)`. There are no requirements for complexity (uppercase, lowercase, digit, special character). For an admin panel controlling medical patient data, "12345678" would pass validation.

**Severity**: MEDIUM

**Fix**: Strengthen the password policy:
```ts
password: z.string()
  .min(12, "Minimum 12 karakter")
  .max(128)
  .regex(/[A-Z]/, "Legalabb egy nagybetu szukseges")
  .regex(/[a-z]/, "Legalabb egy kisbetu szukseges")
  .regex(/[0-9]/, "Legalabb egy szam szukseges")
```
Also consider using `argon2` instead of `bcryptjs` as stated in the schema doc comment (the code only uses bcrypt). Argon2 is more resistant to GPU-based attacks.

---

### SEC-11: Login endpoint has no brute-force protection [HIGH]

**Location**: `02-backend-api-design.md` Section 2.1

The `authorize()` callback in the NextAuth credentials provider has no rate limiting, lockout mechanism, or delay on failed attempts. An attacker can attempt unlimited password guesses against the `/api/auth/callback/credentials` endpoint.

With only 2-3 admin accounts and an 8-character minimum password policy, credential stuffing is a real threat.

**Severity**: HIGH

**Fix**:
1. Implement account lockout: after 5 failed attempts, lock the account for 15 minutes. Track failed attempts in the `admin_users` table (add `failedLoginAttempts: integer` and `lockedUntil: timestamp` columns).
2. Alternatively, use `@upstash/ratelimit` to rate-limit the login endpoint to 5 attempts per minute per IP.
3. Add `console.warn` logging on failed login attempts with the email and IP for security monitoring.

---

### SEC-12: Patient phone number in booking form accepts overly broad input [LOW]

**Location**: `02-backend-api-design.md` Section 4.1 (bookingSchema)

The phone validation regex is `^\+?[0-9]{10,15}$` in the backend schema but the frontend schema in `03-frontend-ui-design.md` uses `^\+?[0-9\s-]{7,15}$` which also allows spaces and hyphens, and accepts as few as 7 digits. These two schemas are inconsistent (see Integration Mismatches section).

Additionally, no phone number normalization happens at the server action level for new bookings. The CSV import script has `normalizePhone()` but the booking flow stores whatever the user types.

**Severity**: LOW

**Fix**: Normalize phone numbers to E.164 format in the `createBooking()` server action before storing. Use the same `normalizePhone()` function from the CSV import script. Align the frontend and backend Zod schemas.

---

## 2. Race Conditions

### RACE-01: SELECT FOR UPDATE broken on neon-http driver [CRITICAL]

**Location**: `02-backend-api-design.md` Section 4.2

Duplicate of SEC-01. The `SELECT FOR UPDATE` lock in the booking transaction runs on the HTTP driver which does not support persistent connections. Each statement in the "transaction" may execute on a different HTTP connection, making the row lock meaningless.

Even with the exclusion constraint as a safety net, the application will see spurious errors instead of graceful conflict handling. The SELECT FOR UPDATE is supposed to provide a clean "slot is taken" check before the INSERT, but it cannot work on this driver.

**Severity**: CRITICAL

**Fix**: See SEC-01.

---

### RACE-02: Waitlist notification race on simultaneous cancellations [HIGH]

**Location**: `02-backend-api-design.md` Section 9 (processWaitlistForSlot)

When a cancellation triggers `processWaitlistForSlot()`, the function:
1. Fetches all `status = 'waiting'` entries (up to 50)
2. Filters in application code
3. Takes the top 3 matches
4. Sends emails
5. Updates each entry to `status = 'notified'`

If two cancellations happen within milliseconds (e.g., the admin bulk-cancels two appointments), both calls to `processWaitlistForSlot()` will read the same set of `waiting` entries before either has updated the status. This results in the same patient receiving duplicate "slot available" notifications.

**Severity**: HIGH

**Fix**: Use `SELECT FOR UPDATE SKIP LOCKED` when fetching waitlist candidates:
```sql
SELECT * FROM waitlist_entries
WHERE status = 'waiting'
ORDER BY created_at ASC
LIMIT 50
FOR UPDATE SKIP LOCKED
```
This ensures the second concurrent call skips entries already locked by the first. This also requires the WebSocket driver (same fix as SEC-01). If using the HTTP driver, an alternative is to use an advisory lock or a simple "claim" pattern: atomically update the status to `'processing'` before sending emails, then to `'notified'` after success.

---

### RACE-03: Patient upsert race on simultaneous bookings with same email [MEDIUM]

**Location**: `02-backend-api-design.md` Section 4.2

The booking flow upserts the patient using `INSERT ... ON CONFLICT (email) DO UPDATE`. If two booking requests with the same email arrive simultaneously:
1. Both reach the `INSERT` statement concurrently
2. One succeeds (INSERT), the other hits the conflict and updates
3. The update SET clause includes `firstName` and `lastName` from the second request, potentially overwriting the values from the first

The data integrity risk is low (the same patient is making both bookings, so the name should be the same), but the race condition could cause the second booking's `firstName`/`lastName` to overwrite the first, even if they differ (e.g., the patient corrected a typo in the second submission).

Additionally, the `phone` update logic differs between the two documents:
- Schema doc: `COALESCE(EXCLUDED.phone, ${patients.phone})`
- Backend doc: `phone ? sql\`COALESCE(${phone}, ${patients.phone})\` : patients.phone`

These have subtly different semantics (see Integration Mismatches).

**Severity**: MEDIUM

**Fix**: The upsert is fine as a pattern. To prevent name overwrites, change the conflict SET to only update `phone` (using `COALESCE`) and leave `firstName`/`lastName` unchanged. If the patient needs to update their name, they should do so through the admin panel (where staff can verify identity). The booking upsert should NOT overwrite existing name data.

---

### RACE-04: Schedule override creation without overlap check [MEDIUM]

**Location**: `02-backend-api-design.md` Section 11.4 (createOverride)

The `createOverride()` action inserts a new schedule override without checking whether the date range overlaps with an existing override. If two admins simultaneously create overrides with overlapping date ranges, both will be saved. The `getAvailableSlots()` function uses `findFirst()` to look up overrides, which means it will arbitrarily pick one of the overlapping overrides for any given date, producing unpredictable behavior.

**Severity**: MEDIUM

**Fix**: Before inserting a new override, check for existing overrides that overlap with the new date range:
```sql
SELECT id FROM schedule_overrides
WHERE start_date <= $newEndDate AND end_date >= $newStartDate
```
If any exist, return a `CONFLICT` error. Alternatively, add a PostgreSQL exclusion constraint on `schedule_overrides` using `daterange(start_date, end_date, '[]')`.

---

### RACE-05: Admin status change without optimistic locking [LOW]

**Location**: `02-backend-api-design.md` Section 11.3 (updateAppointmentStatus)

Two admins viewing the same appointment detail page could both change the status concurrently. The last write wins without warning. For example:
1. Admin A opens appointment (status: confirmed)
2. Admin B opens appointment (status: confirmed)
3. Admin A sets status to "completed"
4. Admin B sets status to "cancelled" (unaware A already completed it)

This is a classic lost-update problem. For a medical practice with 1-2 admins this is low probability, but the consequences (accidentally cancelling a completed appointment) are non-trivial.

**Severity**: LOW

**Fix**: Add an `updatedAt` timestamp to the `appointments` table (it currently only has `createdAt`). When updating the status, include a WHERE clause checking `updatedAt = $previousUpdatedAt`. If the row was modified in between, return a `CONFLICT` error asking the admin to refresh.

---

## 3. Edge Cases

### EDGE-01: DST transition -- nonexistent time 02:30 on last Sunday of March [HIGH]

**Location**: `02-backend-api-design.md` Section 3.2 (timezone.ts)

In the `Europe/Budapest` timezone, on the last Sunday of March, clocks jump from 02:00 to 03:00 (CET to CEST). The time 02:30 does not exist. If the weekly schedule has working hours of 08:00-16:00 for Sunday (not currently seeded, but possible), the slot generation engine would attempt to create a slot at `2026-03-29T02:30:00` Budapest time.

The `toUTCFromTZ()` function uses a fragile method involving `toLocaleString` with timezone differences. When the local time does not exist (DST gap), `toLocaleString` may produce inconsistent results across JavaScript runtimes (V8 vs SpiderMonkey vs JavaScriptCore). On V8 (Node.js/Vercel), non-existent times typically "spring forward" to the post-transition time, but this is not guaranteed by the spec.

Similarly, on the last Sunday of October, the time 02:30 occurs twice (CET and CEST). The function has no way to disambiguate.

**Severity**: HIGH (affects appointment times twice per year if Sunday slots are enabled; the default seed only has Mon-Fri but the system allows Sunday schedules)

**Fix**:
1. Use a proper timezone library (`date-fns-tz` or `@internationalized/date` or `luxon`) instead of the hand-rolled `toUTCFromTZ()` function. These libraries handle DST gaps and ambiguous times correctly.
2. After generating slot times, validate that the local time string round-trips correctly: convert UTC back to local and verify it matches the expected slot time. If not, skip the slot.
3. Add a comment in the slot generation engine noting DST behavior.

---

### EDGE-02: Cancellation window boundary check uses >= instead of > [MEDIUM]

**Location**: `02-backend-api-design.md` Section 5.2 (cancelAppointment)

The cancellation check is:
```ts
if (appointment.cancellationTokenExpiresAt && now >= appointment.cancellationTokenExpiresAt) {
  // expired
}
```

This uses `>=` which means if a patient attempts to cancel at the EXACT millisecond of the expiration time, it is rejected. The corresponding check in the cancel page (Section 5.1) also uses `>=`. This is consistent but may be confusing: if the cancellation window is 24 hours and the appointment is at 14:00, the patient cannot cancel at 14:00 the day before (they must cancel before 14:00:00.000).

For a medical practice, this is a minor UX issue, but it should be documented clearly.

**Severity**: MEDIUM (UX clarity, not a security issue)

**Fix**: Change to `>` (strict greater than) to allow cancellation at the exact boundary. Update the patient-facing text to clearly state "24 oraval az idopont ELOTT" (24 hours BEFORE the appointment). Also, both the cancel page and the cancel action have duplicate logic for this check -- the cancel page checks it for UI rendering, and the action re-checks it for security. Make sure they use the same comparison operator.

---

### EDGE-03: Appointment type deactivation while future appointments exist [HIGH]

**Location**: `01-database-schema.md` Section 6 (appointmentTypes FK), `02-backend-api-design.md` Section 11.5 (toggleTypeActive)

The `appointments` table has `onDelete: "restrict"` on the `appointmentTypeId` FK. The `appointmentTypes` table uses soft-delete via `isActive`. The `toggleTypeActive()` action toggles `isActive` without checking whether future confirmed appointments of that type exist.

Consequences:
1. If the type is deactivated, the slot generation engine (`getAvailableSlots`) filters by `isActive: true`, so no new bookings can be made for that type. This is correct.
2. Existing future appointments of that type are NOT cancelled or flagged. They remain "confirmed" and will show up in the doctor's calendar, but patients cannot cancel them via the normal flow (the cancellation flow does not check the type's active status, so this is actually fine).
3. The admin appointment list will still show these appointments correctly.
4. However, if the admin later reactivates the type, there may be confusion about the gap period.

The bigger issue: The waitlist entries referencing a deactivated type have `onDelete: "set null"` on the FK but the soft-delete via `isActive` does NOT trigger the FK cascade. Waitlist entries for a deactivated type remain in `waiting` status and can still be notified, even though no new slots for that type can be booked.

**Severity**: HIGH

**Fix**:
1. When deactivating an appointment type, warn the admin if there are future confirmed appointments of that type. Show the count and offer to proceed or cancel.
2. When deactivating a type, automatically expire all waitlist entries for that type by updating their status to `'expired'`.
3. Add this logic to `toggleTypeActive()`.

---

### EDGE-04: Patient with cancelled appointment rebooking the same slot [LOW]

**Location**: `01-database-schema.md` Section 7 (exclusion constraint)

The exclusion constraint is:
```sql
EXCLUDE USING gist (tstzrange(start_time, end_time) WITH &&)
WHERE (status != 'cancelled')
```

This correctly allows a cancelled appointment and a new confirmed appointment to coexist at the same time. A patient who cancels and then rebooks the same slot will work correctly: the old cancelled row does not block the new confirmed row.

**Severity**: LOW (working as designed, no fix needed)

**Fix**: None required. Document this behavior for the admin.

---

### EDGE-05: Template with unreplaced $variable placeholders [MEDIUM]

**Location**: `02-backend-api-design.md` Section 6.2

The template variable replacement uses `String.replaceAll(placeholder, value)`. If a template contains a `$variable` that is NOT in the `variables` Record, the raw placeholder (e.g., `$cancellationLink`) will appear in the sent email.

Looking at the template variables: the seed data in `01-database-schema.md` Section 12.1 uses placeholders like `$patientName`, `$appointmentDate`, `$appointmentTime`, `$appointmentType`, `$doctorName`, `$clinicName`, `$clinicPhone`, `$clinicAddress`, `$cancellationLink`. But the backend code in `02-backend-api-design.md` Section 6.2 uses snake_case variables like `$patient_name`, `$appointment_date`, `$appointment_time`, etc.

**These do not match.** The seed templates will NEVER have their variables replaced. Every email sent by the system will contain raw `$patientName` strings instead of actual patient names.

This is a CRITICAL integration mismatch disguised as an edge case. See INTEG-01 for details.

**Severity**: CRITICAL (see INTEG-01)

**Fix**: Align the variable naming convention. Either change the seed templates to use `$patient_name` (snake_case) to match the backend code, or change the backend code to use `$patientName` (camelCase) to match the seed templates. I recommend changing the seed templates since the backend code consistently uses snake_case and it is easier to update seed data.

---

### EDGE-06: Phone number edge cases in CSV import [MEDIUM]

**Location**: `02-backend-api-design.md` Section 10 (importPatientsFromCSV)

The phone normalization in the import script handles:
- `36xxx` -> `+36xxx`
- Leading digits -> `+prefix`

But does NOT handle:
1. Scientific notation: Excel sometimes exports large numbers as `9.9456E+11`. The regex `^\d` test would fail and the number would be stored as-is.
2. Non-Hungarian numbers: International patients with `+44`, `+49` etc. The script blindly prepends `+36` to any number not already starting with `36` or `06`.
3. Phone numbers with parentheses: `(06 20) 123-4567`
4. Empty or whitespace-only phone: The code checks `row.phone?.trim() || null` which correctly handles empty, but the `patients` table requires `phone: text("phone").notNull()`. A null phone from the import would violate the NOT NULL constraint.

Wait -- actually, checking the schema: `phone: text("phone").notNull()`. But the import script sets `phone: phone || null` where `phone` might be `null`. This will throw a database error for any row with an empty phone field.

**Severity**: MEDIUM

**Fix**:
1. Strip non-digit characters before normalization: `phone.replace(/[^\d+]/g, "")`.
2. Handle scientific notation: detect `E+` in the string and convert to integer first.
3. For non-Hungarian numbers (not starting with `36`, `06`, or `0`), store with `+` prefix but do not prepend `36`.
4. For empty phones, either use a placeholder or make the `phone` column nullable in the schema (which is the better approach since phone is already optional in the booking form).

---

### EDGE-07: Schedule override for today does not affect existing appointments [LOW]

**Location**: `02-backend-api-design.md` Section 11.4

When an admin creates a schedule override marking today as "closed", the override only affects future slot generation. It does NOT cancel or flag existing confirmed appointments for today. The doctor might close the clinic for an emergency but patients with existing appointments would still show up.

**Severity**: LOW (operational concern, not a code bug)

**Fix**: When creating an override for dates that include today or past dates, warn the admin about existing confirmed appointments within that date range. Display the count and offer a bulk-cancel option.

---

### EDGE-08: Admin deactivating the last admin account [MEDIUM]

**Location**: `02-backend-api-design.md` Section 11.9 (deactivateUser)

The `deactivateUser()` function prevents self-deactivation (`if (String(id) === authResult.session.user.id)`), but does NOT prevent deactivating the LAST remaining active admin. If there are two admins and one deactivates the other, the system works. But if there is only one admin and they are compromised, the attacker could create a new admin and then deactivate the original -- this is prevented by the self-deactivation check.

However, consider: Admin A deactivates Admin B. Now only Admin A exists. Admin A's session expires. Admin A's password is forgotten. There is no recovery path (no password reset, no email-based recovery) documented anywhere.

**Severity**: MEDIUM

**Fix**:
1. Add a check in `deactivateUser()`: count remaining active admins. If this would leave fewer than 1, reject the operation.
2. Document a password recovery procedure (database-level: manually update the password hash in Neon console).

---

### EDGE-09: Midnight-spanning appointments [LOW]

**Location**: `02-backend-api-design.md` Section 3.1 (getAvailableSlots)

The slot generation engine checks for existing appointments using:
```ts
gte(appointments.startTime, dayStart) // 00:00:00
lte(appointments.startTime, dayEnd)   // 23:59:59
```

A hypothetical appointment from 23:45 to 00:15 (spanning midnight) would have its `startTime` at 23:45 which is within the day range, so it would correctly block the 23:45 slot. However, the 00:00 slot of the next day would NOT show this appointment as a conflict because the query only checks `startTime`, not the full range overlap.

In practice, a gynecology clinic would never have midnight appointments. But the weekly schedule CHECK constraint requires `start_time < end_time`, which prevents midnight-spanning schedule windows. The appointment-level exclusion constraint would still prevent the double-booking even if the slot generation failed.

**Severity**: LOW

**Fix**: Change the slot conflict check to use range overlap instead of just `startTime` containment:
```ts
// Instead of: startTime >= dayStart AND startTime <= dayEnd
// Use: startTime < dayEnd AND endTime > dayStart
```
This correctly handles appointments that span midnight.

---

## 4. GDPR Compliance

### GDPR-01: No explicit data retention policy or automated cleanup [HIGH]

**Location**: `01-database-schema.md` Section 14

The schema doc mentions: "Must support right-to-erasure. Implementation: anonymize rather than hard-delete." And the notification_log is described as "Never deleted (compliance)."

But there is NO defined data retention period:
- How long is patient PII kept after their last appointment? Hungarian healthcare data retention laws require medical records to be kept for 30 years, but contact information (email, phone) may not need to be retained that long.
- The notification_log contains `recipientEmail` (PII) and is explicitly "never deleted." Under GDPR, you cannot keep PII indefinitely without a legal basis.
- Waitlist entries contain `patientEmail`, `patientName`, and `patientPhone`. Expired entries are never cleaned up in the database (the cron marks them as `expired` but does not delete them).

**Severity**: HIGH

**Fix**:
1. Define a retention policy document (required by GDPR Article 5(1)(e)):
   - Active patient records: retained indefinitely while the patient has appointments
   - Patient PII after last appointment: retained for 5 years, then anonymized (discuss with the doctor's legal counsel, as Hungarian healthcare law may require longer for medical records)
   - Notification log: anonymize `recipientEmail` after 2 years. Replace with a hash or `[ANONYMIZED]`.
   - Expired waitlist entries: hard-delete after 90 days.
   - Cancelled appointment tokens: null out immediately after cancellation (already partially addressed in SEC-04).
2. Implement a monthly cron job for data cleanup per the retention policy.

---

### GDPR-02: No consent mechanism for email communications [HIGH]

**Location**: `02-backend-api-design.md` Section 4.2 (createBooking); `03-frontend-ui-design.md` Section 4.1 (StepPatientInfo)

When a patient books an appointment, they provide their email and immediately start receiving emails (confirmation, reminder, cancellation). There is no explicit consent checkbox for email communications. Under GDPR, transactional emails (appointment confirmation) may be sent under "legitimate interest" or "contractual necessity," but marketing-style emails (waitlist notifications) require explicit consent.

The patient info form (Step 4 in the booking wizard) collects name, email, and phone but has NO:
- Privacy policy link or acknowledgment
- Checkbox for "I agree to receive emails about my appointment"
- Information about how their data will be used

For a Hungarian medical practice, there should also be a reference to the practice's privacy policy (adatkezelesi tajekoztato).

**Severity**: HIGH

**Fix**:
1. Add a mandatory checkbox to Step 4: "Elfogadom az adatkezelesi tajekoztatot" (I accept the privacy policy) with a link to the privacy policy page.
2. Add a text note: "Az idopontfoglalassal hozzajarul, hogy visszaigazolo es emlekezteto emaileket kuldjunk az On altal megadott email cimre." (By booking, you consent to receiving confirmation and reminder emails at the provided email address.)
3. For waitlist signup, add a similar consent notice.
4. Store the consent timestamp in the patient record (add a `consentedAt: timestamp` column to the patients table).

---

### GDPR-03: Right to data export not implemented [MEDIUM]

**Location**: `02-backend-api-design.md` (no relevant section exists)

GDPR Article 20 grants the right to data portability. There is no endpoint or server action that exports a patient's complete data in a machine-readable format (JSON, CSV). The admin can view a patient's data in the UI, but there is no "export patient data" function.

**Severity**: MEDIUM

**Fix**: Add a server action `exportPatientData(patientId)` that returns all patient data (patient record, all appointments, all notification log entries) as a JSON object. This can be triggered from the patient detail page in the admin panel. Include a download button.

---

### GDPR-04: Notification log retains PII indefinitely [MEDIUM]

**Location**: `01-database-schema.md` Section 6 (notification_log); `02-backend-api-design.md` Section 6.2

The `notification_log` table stores:
- `recipientEmail` (PII)
- `subject` (may contain patient name via template variables)
- `patientId` (FK, set null on patient delete)

Even when a patient is anonymized via `deletePatient()`, the `patientId` FK is `SET NULL`, but the `recipientEmail` and `subject` fields remain unchanged. After anonymization, the notification log still contains the patient's original email address and potentially their name in the subject line.

**Severity**: MEDIUM

**Fix**: When anonymizing a patient (in `deletePatient()`), also anonymize the notification_log entries:
```ts
await db
  .update(notificationLog)
  .set({
    recipientEmail: `[ANONYMIZED]`,
    subject: `[ANONYMIZED] ${notificationLog.templateEvent}`,
  })
  .where(eq(notificationLog.patientId, id));
```
Note: This must happen BEFORE the patient FK is set to null, otherwise you lose the link between the notification and the patient.

---

### GDPR-05: Cookie consent for admin session [LOW]

**Location**: `02-backend-api-design.md` Section 2 (NextAuth setup)

NextAuth uses a session cookie (`next-auth.session-token`). For the admin panel, this is a strictly necessary cookie for authentication and does NOT require a cookie consent banner under GDPR (the ePrivacy Directive exempts strictly necessary cookies).

However, if any analytics cookies are added to the admin panel in the future, consent would be required.

**Severity**: LOW (no issue currently)

**Fix**: No immediate action needed. Document that the admin panel uses only strictly necessary cookies and no cookie banner is required for the admin section.

---

## 5. Integration Mismatches

### INTEG-01: Template variable naming mismatch between seed data and backend code [CRITICAL]

**Location**: `01-database-schema.md` Section 12.1 (seed templates) vs `02-backend-api-design.md` Section 6.3 (template variables reference)

The seed data uses **camelCase** placeholders:
- `$patientName`, `$appointmentDate`, `$appointmentTime`, `$appointmentType`
- `$doctorName`, `$clinicName`, `$clinicPhone`, `$clinicAddress`
- `$cancellationLink`

The backend code passes **snake_case** keys in the `variables` object:
- `$patient_name`, `$appointment_date`, `$appointment_time`, `$appointment_type`
- `$doctor_name`, `$clinic_name`, `$clinic_phone`, `$clinic_address`
- `$cancel_url`

Not only is the casing different, but the cancellation link variable name is entirely different: `$cancellationLink` (seed) vs `$cancel_url` (backend).

The replacement function in `sendBookingEmail()` iterates over `Object.entries(variables)` and replaces each key. Since the keys are snake_case but the template text has camelCase placeholders, ZERO replacements will occur. Every email sent by the system will contain raw placeholder text.

**Severity**: CRITICAL

**Fix**: Align the seed template placeholders with the backend variable names. Change all seed templates to use snake_case:
- `$patientName` -> `$patient_name`
- `$appointmentDate` -> `$appointment_date`
- `$appointmentTime` -> `$appointment_time`
- `$appointmentType` -> `$appointment_type`
- `$doctorName` -> `$doctor_name`
- `$clinicName` -> `$clinic_name`
- `$clinicPhone` -> `$clinic_phone`
- `$clinicAddress` -> `$clinic_address`
- `$cancellationLink` -> `$cancel_url`

Also: the schema doc Section 12.2 (Available Template Variables table) lists camelCase names. This table must also be updated to match.

---

### INTEG-02: Template event names mismatch between schema enum and backend code [CRITICAL]

**Location**: `01-database-schema.md` Section 6 (templateEventEnum) vs `02-backend-api-design.md` Sections 4.2, 5.2, 6.2, 8.2, 9

The schema defines the `template_event` enum with these values:
```
"appointment_created", "reminder_24h", "cancelled_by_patient",
"cancelled_by_doctor", "status_changed", "waitlist_slot_available"
```

The backend code uses these template event names when calling `sendBookingEmail()`:
- `"booking_confirmed"` (in createBooking, line 707)
- `"reminder_24h"` (in send-reminders cron, line 1462)
- `"booking_cancelled"` (in cancelAppointment, lines 969, 984)
- `"waitlist_slot_available"` (in processWaitlistForSlot, line 1607)

The mismatches:
- `"booking_confirmed"` vs enum value `"appointment_created"` -- NO MATCH
- `"booking_cancelled"` vs enum values `"cancelled_by_patient"` / `"cancelled_by_doctor"` -- NO MATCH

The `sendBookingEmail()` function looks up templates by `event` and `recipientType`. Since `"booking_confirmed"` does not exist in the enum, the query will find no template, and the function will log a `[MISSING TEMPLATE]` warning and silently skip sending the email.

**Result**: Appointment confirmation emails and cancellation emails will NEVER be sent.

Additionally, the frontend template editor (Section 3.9 of frontend doc) lists event display names that match neither the enum nor the backend code:
- `"booking_confirmed"` -> `"Idopont letrehozva"`
- `"booking_cancelled"` -> `"Lemondva (beteg altal)"` / `"Lemondva (orvos altal)"`
- `"appointment_completed"` -> `"Teljesitve"`
- `"no_show"` -> `"Nem jelent meg"`

`"appointment_completed"` and `"no_show"` do not exist in the enum at all (the enum has `"status_changed"` instead).

**Severity**: CRITICAL

**Fix**: Decide on a single set of event names and update all three documents:
1. Update the `templateEventEnum` in the schema to match the backend code, OR
2. Update the backend code to use the existing enum values.

Recommended: Use the schema enum values since they are more descriptive. Change the backend code:
- `"booking_confirmed"` -> `"appointment_created"`
- `"booking_cancelled"` -> `"cancelled_by_patient"` / `"cancelled_by_doctor"` (the backend already distinguishes by `recipientType`, but the cancellation by admin should use `"cancelled_by_doctor"`)
- Add `"no_show"` and `"completed"` events to the enum if the frontend needs them, OR map them to `"status_changed"`.

---

### INTEG-03: CSV import script references non-existent column `importedAt` [MEDIUM]

**Location**: `02-backend-api-design.md` Section 10 (importPatientsFromCSV) vs `01-database-schema.md` Section 6 (patients table)

The import script sets `importedAt: new Date()` (line 1739) and updates `importedAt: new Date()` on conflict (line 1746). But the patients table has no `importedAt` column. The schema has `importedLastAppointment` (a `date` type, not a `timestamp`).

This will cause a runtime error on import.

Additionally, the import script stores a notes string `[Imported] Utolso vizit: ${importedLastAppointment}` but the schema doc's import strategy (Section 13) stores the date in the `importedLastAppointment` column instead. The two import implementations are different and incompatible.

**Severity**: MEDIUM

**Fix**: Align the import script with the schema:
1. Replace `importedAt: new Date()` with `importedLastAppointment: importedLastAppointment` (the parsed date string).
2. Remove the `importedAt` reference from the conflict update.
3. Decide whether to store the import date in `notes` (backend approach) or in `importedLastAppointment` (schema approach). I recommend using `importedLastAppointment` for the date and `notes` for metadata.

---

### INTEG-04: Frontend assumes `getAvailableDates()` action that backend does not define [MEDIUM]

**Location**: `03-frontend-ui-design.md` Section 4.1 (Step 2) vs `02-backend-api-design.md`

The frontend Step 2 (date selection) requires:
> Server Action: `getAvailableDates(appointmentTypeId, fromDate, toDate)` -- returns `string[]` of ISO date strings with at least one available slot

This server action is NOT defined anywhere in `02-backend-api-design.md`. The backend only defines `getAvailableSlots(date, appointmentTypeId)` which returns slots for a SINGLE date.

To populate the date picker with green dots showing which dates have availability, the frontend would need to call `getAvailableSlots()` for each of the 60 dates in the range. This is 60 database round-trips per page load, each involving 3-5 queries.

**Severity**: MEDIUM

**Fix**: Implement `getAvailableDates()` as a server action that:
1. Fetches the weekly schedule and all overrides for the date range
2. For each date, determines if the clinic is open (no closed override, has a schedule entry)
3. For open dates, counts existing non-cancelled appointments and compares to the number of possible slots
4. Returns only dates that have at least one available slot

This should be a single optimized query or a bulk operation, NOT 60 individual `getAvailableSlots()` calls.

---

### INTEG-05: Frontend route structure mismatch with backend file structure [LOW]

**Location**: `02-backend-api-design.md` Section 15 vs `03-frontend-ui-design.md` Section 8

The backend file structure uses a route group `(dashboard)/` under `/admin/`:
```
admin/(dashboard)/page.tsx
admin/(dashboard)/patients/page.tsx
admin/(dashboard)/templates/page.tsx
admin/(dashboard)/templates/[id]/page.tsx
```

The frontend file structure does NOT use a route group:
```
admin/page.tsx
admin/patients/page.tsx
admin/messages/page.tsx  (not "templates")
```

Additionally, the backend uses `templates/` while the frontend uses `messages/` for the email template management page.

**Severity**: LOW (these are design docs, not code, and the route group is just for shared layout)

**Fix**: Decide on one structure. The route group approach in the backend is cleaner (it excludes `/admin/login` from the `AdminLayout`). But the naming must be consistent: use either `messages` or `templates`, not both.

---

### INTEG-06: Booking email uses `templateEvent: "booking_confirmed"` but cancel uses `"booking_cancelled"` [HIGH]

**Location**: `02-backend-api-design.md` Sections 4.2 and 5.2

Duplicate of INTEG-02 but highlighting a specific consequence: the `cancelAppointment()` action sends emails with `templateEvent: "booking_cancelled"`, but the cancellation page uses `"cancelled_by_patient"` in the cancel flow (and the admin status change presumably should use `"cancelled_by_doctor"`). The backend has no logic to distinguish between patient-initiated and admin-initiated cancellations for the email template lookup. The code always uses `"booking_cancelled"` which does not match either enum value.

**Severity**: HIGH (covered under INTEG-02, same fix)

**Fix**: See INTEG-02.

---

### INTEG-07: Frontend waitlist signup sends different data than backend expects [MEDIUM]

**Location**: `03-frontend-ui-design.md` Section 4.1 Step 3 vs `02-backend-api-design.md` Section 9

The frontend waitlist form (shown when no slots are available) calls:
> Server Action: `createWaitlistEntry(email, appointmentTypeId, date)`

But there is NO `createWaitlistEntry()` server action defined in the backend document. The backend only has:
- `listWaitlist()` (admin)
- `deleteWaitlistEntry()` (admin)
- `manualNotifyEntry()` (admin)

The public-facing waitlist signup endpoint is completely missing from the backend API design.

Additionally, the frontend form only collects `email`, but the `waitlist_entries` table requires `patientName` (NOT NULL) and has optional fields for `patientPhone`, `preferredDayOfWeek`, `preferredTimeStart`, `preferredTimeEnd`, `preferredDateFrom`, `preferredDateTo`. The frontend form does not collect any of these.

**Severity**: MEDIUM

**Fix**: Add a `createWaitlistEntry()` server action to the backend:
```ts
export async function createWaitlistEntry(data: {
  email: string;
  name: string;
  phone?: string;
  appointmentTypeId?: number;
  preferredDate?: string;
}): Promise<ActionResult<{ id: string }>>
```
Update the frontend waitlist form to collect at least the patient's name (required by the schema).

---

### INTEG-08: Appointment query for dashboard does not match frontend data requirements [LOW]

**Location**: `03-frontend-ui-design.md` Section 3.2 (Dashboard) vs `02-backend-api-design.md`

The dashboard requires several specific queries:
- `getTodayAppointmentCount()`
- `getWaitlistCount()`
- `getWeeklyCompletedCount()`
- `getTodayAppointments()` (with patient names, type names, colors)

None of these are defined as server actions in the backend. The existing `listAppointments()` action could be used with appropriate filters, but it returns paginated results and may not be optimized for the dashboard's specific needs (counts, today-only queries).

**Severity**: LOW (the backend provides the building blocks, but dedicated dashboard actions would be cleaner)

**Fix**: Add dedicated dashboard server actions:
```ts
export async function getDashboardData(): Promise<ActionResult<{
  todayCount: number;
  waitlistCount: number;
  weeklyCompleted: number;
  todayAppointments: AppointmentWithDetails[];
}>>
```
This consolidates 4 queries into a single server action call.

---

## 6. Performance Concerns

### PERF-01: Patient search uses ILIKE without full-text index [HIGH]

**Location**: `02-backend-api-design.md` Section 11.2 (listPatients)

The patient search uses:
```ts
ilike(patients.firstName, `%${search}%`)
ilike(patients.lastName, `%${search}%`)
ilike(patients.email, `%${search}%`)
ilike(patients.phone, `%${search}%`)
```

With 2,300+ patients and leading wildcards (`%term%`), PostgreSQL cannot use B-tree indexes. The `idx_patients_last_name` and `idx_patients_email` indexes are useless for `ILIKE '%term%'` queries. Each search will perform a sequential scan of the entire patients table.

At 2,300 rows this is survivable (~5-10ms), but it will degrade as the patient base grows. For a practice seeing ~20 patients per day, this could reach 10,000+ in 2 years.

**Severity**: HIGH (for long-term scalability)

**Fix**: Add a `pg_trgm` (trigram) index for efficient `ILIKE` pattern matching:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_patients_name_trgm ON patients USING gin (
  (first_name || ' ' || last_name) gin_trgm_ops
);
CREATE INDEX idx_patients_email_trgm ON patients USING gin (email gin_trgm_ops);
```
Add this to the custom SQL migrations alongside the exclusion constraint.

---

### PERF-02: Slot generation makes 4-5 sequential DB queries per date [MEDIUM]

**Location**: `02-backend-api-design.md` Section 3.1 (getAvailableSlots)

For a single date, `getAvailableSlots()` makes:
1. Fetch appointment type (1 query)
2. Fetch doctor settings (1 query)
3. Check schedule overrides (1 query)
4. Fetch weekly schedule -- type-specific (1 query), then possibly global (1 query)
5. Fetch existing appointments for the date (1 query)

That is 5-6 sequential queries per date. For the month view mentioned in the frontend calendar (Section 3.3), this runs ~26 times (Mon-Sat for 4 weeks). That is 130-156 database round-trips per calendar render.

On Neon's HTTP driver, each query is a separate HTTP request to the database. At ~30-50ms per request (network latency to eu-central-1), a single calendar render takes 4-8 seconds.

**Severity**: MEDIUM

**Fix**:
1. Cache appointment type and doctor settings for the duration of the request (they rarely change). Fetch them once and pass as parameters.
2. Batch the schedule override and weekly schedule queries: fetch ALL overrides and ALL weekly schedule entries once, then filter in application code for each date.
3. Fetch ALL existing appointments for the entire date range in a single query, then partition by date in application code.
4. This reduces the per-calendar query count from 130+ to ~4-5 total queries regardless of date range.

---

### PERF-03: Gmail API rate limits for bulk reminders [MEDIUM]

**Location**: `02-backend-api-design.md` Section 8.2 (send-reminders cron)

The cron job sends reminders sequentially: `for (const appt of upcomingAppointments)`. Each iteration calls `sendBookingEmail()` which makes a Gmail API call. Gmail's daily sending limit is 500 emails for regular Google accounts and 2,000 for Google Workspace.

For a typical gynecology practice with ~20 appointments per day, the reminder batch would be ~20 emails. This is well within limits. However:
- The cron window is 24-28 hours (4-hour window). If the cron fails to run one day and runs the next, it could try to send 40+ reminders.
- Each cancellation also triggers up to 5 emails (patient cancel + doctor cancel + up to 3 waitlist notifications).
- A busy day with 30 appointments and 5 cancellations could trigger 30 + 25 = 55 email API calls.

The Gmail API rate limit is 250 quota units per second (each send = 100 units). So the effective rate is ~2.5 sends per second. Sending 55 emails sequentially at ~500ms each takes ~28 seconds, which is within the Vercel function timeout (default 10s, configurable to 60s on Pro). This is tight.

**Severity**: MEDIUM

**Fix**:
1. Set the Vercel function `maxDuration` to 60 seconds for the cron handler.
2. Add a brief delay between sends (200ms) to stay well within Gmail rate limits.
3. If the number of reminders exceeds 50, batch them into groups of 50 with 1-second delays between batches.
4. Consider using Gmail batch API for sending multiple emails in a single HTTP request.

---

### PERF-04: Notification log growth with no cleanup or archival [MEDIUM]

**Location**: `01-database-schema.md` Section 6 (notification_log)

The notification_log is described as "Never deleted (compliance)." At ~3-5 log entries per appointment (confirmation to patient, confirmation to doctor, reminder, potential cancellation emails), and ~20 appointments per day, the log grows by ~100 rows per day or ~36,000 rows per year. Each row contains text fields (email, subject, error message).

After 5 years, the table would have ~180,000 rows. This is manageable for PostgreSQL but unnecessary. The log has no archival or partitioning strategy.

**Severity**: MEDIUM (low urgency, but should be planned)

**Fix**:
1. Add a `created_at_year` column or use PostgreSQL table partitioning by year.
2. After anonymizing email addresses per GDPR-04, old log entries are less useful. Archive logs older than 2 years to a cold storage backup.
3. Add an index on `sentAt` for time-range queries if the admin UI ever needs to browse logs.

---

## 7. Missing Pieces

### MISS-01: No admin audit log [HIGH]

**Location**: All three documents

There is NO audit trail for admin actions. When an admin:
- Changes a patient's email or phone number
- Cancels an appointment
- Changes an appointment status
- Modifies a message template
- Creates or deactivates another admin user
- Changes clinic settings

...there is no record of WHO did it and WHEN. The `notification_log` only tracks emails sent. For a medical practice, audit logging of data modifications is essential for:
- GDPR compliance (demonstrating data processing activities)
- Investigating errors or disputes ("I didn't cancel that appointment!")
- Security incident response

**Severity**: HIGH

**Fix**: Add an `audit_log` table:
```ts
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(), // "update_patient", "cancel_appointment", etc.
  entityType: text("entity_type").notNull(), // "patient", "appointment", etc.
  entityId: text("entity_id").notNull(), // UUID or serial ID as string
  changes: text("changes"), // JSON diff of old/new values (PII should be masked)
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

---

### MISS-02: No monitoring or alerting for failed emails [HIGH]

**Location**: `02-backend-api-design.md` Section 6.2

When an email fails to send, the error is:
1. Logged to `notification_log` with `status: "failed"` and `errorMessage`
2. Logged to `console.error`
3. The error is caught and the booking proceeds

But nobody is alerted. If the Gmail refresh token expires, ALL emails fail silently. The doctor has no way to know that patients are not receiving confirmations or reminders until a patient calls to complain.

**Severity**: HIGH

**Fix**:
1. In the `send-reminders` cron job, after processing all reminders, check the total `errors` count. If errors > 0, send an alert via an alternative channel (e.g., a dedicated Slack/Telegram webhook, or a fallback SMTP service like Resend/SendGrid for the alert itself).
2. Add a dashboard widget showing "Failed emails in the last 24 hours" with a red badge count.
3. Add a health check in the admin settings page that tests the Gmail API connection.

---

### MISS-03: No backup strategy for patient data [HIGH]

**Location**: None of the three documents

There is no mention of database backups anywhere. Neon provides point-in-time recovery (PITR) on paid plans, but this is not configured or documented.

If the database is corrupted, accidentally wiped (e.g., `drizzle-kit push` with `--force` in production), or the Neon project is deleted, ALL patient data is lost.

**Severity**: HIGH

**Fix**:
1. Enable Neon's built-in PITR (available on Pro plan).
2. Document the backup policy: Neon PITR with 7-day retention.
3. Add a weekly `pg_dump` export stored in a separate cloud storage bucket (e.g., Vercel Blob, AWS S3, or Google Cloud Storage) as a secondary backup.
4. Test the restore procedure at least once before going to production.

---

### MISS-04: No public-facing waitlist signup server action [MEDIUM]

**Location**: `02-backend-api-design.md` (missing) vs `03-frontend-ui-design.md` Section 4.1 Step 3

Covered in INTEG-07. The frontend assumes `createWaitlistEntry()` exists but the backend does not define it.

**Severity**: MEDIUM

**Fix**: See INTEG-07.

---

### MISS-05: No admin-initiated booking creation [MEDIUM]

**Location**: `03-frontend-ui-design.md` Section 3.6 (patient detail page)

The patient detail page has an "Uj idopont letrehozasa" (Create new appointment) button, noted as "future scope." The admin appointment list page mentions a quick action "Uj idopont" linking to `/admin/appointments?new=true`. But there is no admin booking creation form or server action defined in either the backend or frontend document.

The only way to create a booking is through the public-facing 5-step wizard. This means:
1. The admin cannot create a booking on behalf of a patient (e.g., phone booking)
2. The admin cannot create a booking that bypasses the cancellation window or slot availability rules

**Severity**: MEDIUM (common operational need for a medical practice)

**Fix**: Add an `adminCreateBooking()` server action that:
1. Accepts patient ID (existing) or patient details (new)
2. Accepts date, time, appointment type
3. Bypasses slot availability check (admin override)
4. Optionally skips confirmation email
5. Creates the appointment with all the same side effects (calendar event, token)

---

### MISS-06: No appointment rescheduling [MEDIUM]

**Location**: All three documents

There is no way to reschedule an appointment. To change the time of an existing appointment, the admin must cancel it and create a new one. This:
1. Sends a cancellation email to the patient (confusing)
2. Loses the original booking context
3. Requires the patient to rebook through the public wizard

**Severity**: MEDIUM (UX and operational gap)

**Fix**: Add a `rescheduleAppointment(id, newDate, newTime)` server action that:
1. Updates the `startTime` and `endTime` of the existing appointment
2. Updates the Google Calendar event
3. Sends a "rescheduled" email (add a `"rescheduled"` template event)
4. Does NOT change the cancellation token or create a new appointment

---

### MISS-07: No `phone` column nullable fix in schema [LOW]

**Location**: `01-database-schema.md` Section 6 (patients table)

The `phone` column is `text("phone").notNull()`. But:
1. The booking form (Step 4) has phone as optional (`.optional().or(z.literal(""))` in the backend schema)
2. The CSV import may have empty phone fields
3. The patient upsert in `createBooking()` sets `phone: phone || null`

If the booking form submits without a phone number, the upsert will attempt `phone: null` which violates the NOT NULL constraint.

**Severity**: LOW (but will cause a runtime crash)

**Fix**: Make the `phone` column nullable: `phone: text("phone")` (remove `.notNull()`). This aligns with the booking form where phone is optional.

---

### MISS-08: No `updatedAt` column on patients table [LOW]

**Location**: `01-database-schema.md` Section 6 (patients table)

The patients table has `createdAt` but no `updatedAt`. When a patient's record is updated (via admin edit or booking upsert), there is no way to track when the last modification occurred. This is useful for:
1. Audit trail
2. Cache invalidation
3. GDPR data subject access requests ("when was my data last modified?")

**Severity**: LOW

**Fix**: Add `updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()` to the patients table. Update it in `updatePatient()` and the booking upsert.

---

### MISS-09: No `status_changed` email sent when admin changes appointment status [LOW]

**Location**: `02-backend-api-design.md` Section 11.3 (updateAppointmentStatus)

When the admin changes an appointment status (e.g., from "confirmed" to "completed" or "no_show"), the code updates the status in the database and handles cancellation side effects, but does NOT send a `status_changed` email to the patient. The `status_changed` template exists in the seed data but is never used by any backend code.

The admin appointment detail page (Section 3.4 of frontend doc) says: "Ez ertesitest kuldhet a betegnek" (This may send a notification to the patient) in the confirmation dialog, but the backend does not implement this.

**Severity**: LOW

**Fix**: In `updateAppointmentStatus()`, after updating the status, send a `status_changed` email to the patient if the template is active. Except for transitions to "cancelled" which already have dedicated handling.

---

### MISS-10: No input sanitization for `notes` fields [LOW]

**Location**: `02-backend-api-design.md` Sections 11.2 and 11.3

The `notes` fields on patients and appointments accept up to 5,000 characters of free text. This text is stored in the database and displayed in the admin panel. If the admin panel renders notes using `dangerouslySetInnerHTML` or similar, stored XSS is possible.

The frontend doc does not specify how notes are rendered, but the general pattern in React/Next.js is to use text content which auto-escapes. The risk is low but should be explicitly addressed.

**Severity**: LOW

**Fix**: Ensure all user-controlled text (notes, patient names, template content) is rendered using React's default JSX escaping (never `dangerouslySetInnerHTML`). Add a comment in the DataTable and detail page components noting this requirement.

---

## 8. Summary of Required Actions

### Before Implementation (Blockers)

| ID | Action | Severity |
|----|--------|----------|
| SEC-01 / RACE-01 | Switch booking transaction to WebSocket driver | CRITICAL |
| INTEG-01 | Fix template variable naming (camelCase vs snake_case) | CRITICAL |
| INTEG-02 | Fix template event name enum mismatch | CRITICAL |
| SEC-02 | Implement rate limiting on public endpoints | CRITICAL |
| MISS-07 | Make phone column nullable | LOW (but will crash) |

### Before Production Launch

| ID | Action | Severity |
|----|--------|----------|
| SEC-03 | Verify CSRF protection on server actions | HIGH |
| SEC-04 | Rate limit cancel page + referrer policy | HIGH |
| SEC-05 | HTML-escape template variable values | HIGH |
| SEC-06 | Sanitize email subject for header injection | HIGH |
| SEC-11 | Add login brute-force protection | HIGH |
| EDGE-01 | Use proper timezone library for DST handling | HIGH |
| EDGE-03 | Handle appointment type deactivation with existing bookings | HIGH |
| GDPR-01 | Define and implement data retention policy | HIGH |
| GDPR-02 | Add consent mechanism to booking form | HIGH |
| MISS-01 | Add admin audit logging | HIGH |
| MISS-02 | Add email failure alerting | HIGH |
| MISS-03 | Configure database backups | HIGH |
| PERF-01 | Add trigram index for patient search | HIGH |
| INTEG-04 | Implement getAvailableDates() server action | MEDIUM |
| INTEG-07 | Implement createWaitlistEntry() server action | MEDIUM |

### Post-Launch Improvements

| ID | Action | Severity |
|----|--------|----------|
| SEC-08 | Re-validate isActive on every authenticated request | MEDIUM |
| SEC-10 | Strengthen password policy | MEDIUM |
| EDGE-08 | Prevent deactivating last admin | MEDIUM |
| GDPR-03 | Implement patient data export | MEDIUM |
| GDPR-04 | Anonymize notification_log on patient deletion | MEDIUM |
| PERF-02 | Optimize slot generation with batch queries | MEDIUM |
| PERF-03 | Handle Gmail rate limits for bulk sends | MEDIUM |
| MISS-05 | Admin-initiated booking creation | MEDIUM |
| MISS-06 | Appointment rescheduling | MEDIUM |

---

*End of review. Every finding rated CRITICAL must be resolved before any code is written. Every HIGH finding must be resolved before production deployment. The template variable naming mismatch (INTEG-01) and template event enum mismatch (INTEG-02) are the most immediately impactful -- without fixing these, the system will send emails with raw placeholder text and fail to find templates entirely.*
