# Phase 10: Authentication - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Patients and admin can authenticate through separate, role-appropriate paths. Patients authenticate via Google OAuth or email/password — but only as part of the booking flow, not from a standalone login page. Admin authenticates via email/password on the /admin page. Sessions persist across browser refresh (JWT). No patient profile/dashboard page exists — patients authenticate solely to book appointments.

</domain>

<decisions>
## Implementation Decisions

### Login/Register UI
- Login and registration on the same view with a Belépés / Regisztráció tab toggle
- Google OAuth button positioned on top, then an "vagy" divider, then email/password fields below
- Centered card design on simple background
- Inline validation errors displayed as red text directly below each invalid field
- **Key shift:** Patient auth is NOT a standalone page — it's embedded inline in the booking flow on /idopontfoglalas. The centered card with tabs lives within the booking process, not at /bejelentkezes

### Auth flow behavior
- After patient login during booking: continue the booking flow from where they left off (return to previous step)
- Email verification: account works immediately after registration, but a banner nudges them to verify their email
- Password requirements: simple — minimum 6 characters, no special rules (low friction for a medical appointment site)
- Session duration: 30 days before requiring re-authentication

### Role separation
- No standalone patient login page (/bejelentkezes not needed for patients)
- No /fiokom patient dashboard — patients only authenticate to book appointments
- Admin login is inline on /admin: visiting /admin shows a login form if not authenticated, dashboard if authenticated
- Admin login has a distinct, utilitarian/professional look — clearly a backend login, not patient-facing
- Admin: no Google OAuth — email/password only
- Multiple admin accounts supported (e.g., doctor + receptionist)
- New admin accounts created via invite by existing admin (email invite → private registration link)

### Account recovery
- Patients: forgot password flow with email reset link AND a suggestion to switch to Google login for convenience
- Admin: manual password reset only (through backend/environment) — no self-service reset
- Failed login attempts: progressive rate limiting (slow down responses) but never fully lock out
- Account linking: auto-link when same email used across methods (email registration + Google OAuth = same account)

### Claude's Discretion
- Auth provider/library choice (NextAuth, Auth.js, custom JWT, etc.)
- JWT token structure and refresh strategy
- Database schema for users/sessions
- Admin invite email template design
- Loading states during auth operations
- Exact rate limiting thresholds and delay curve

</decisions>

<specifics>
## Specific Ideas

- Patient auth should feel like a natural step in the booking process, not a gate — "to confirm your appointment, sign in or create an account"
- The admin login at /admin should feel clearly separate from the public site — utilitarian, not branded
- Google OAuth should be the most prominent option for patients (top position, larger button) since it's the fastest path

</specifics>

<deferred>
## Deferred Ideas

- Patient self-service cancellation/rescheduling — will need auth but belongs in booking management phase
- Patient profile page — explicitly not wanted; if needed in the future, it's a new phase

</deferred>

---

*Phase: 10-authentication*
*Context gathered: 2026-02-22*
