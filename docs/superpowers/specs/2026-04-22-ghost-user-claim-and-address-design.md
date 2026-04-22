# Ghost-user account claim + billing address collection

**Date:** 2026-04-22
**Status:** Approved design, pending implementation plan

## Problem

The `scripts/import-customers.ts` script populated the `user` table with ~2741 historical customers from a CSV. Each ghost row has `email_verified=false` and no corresponding `account` row (no password, no OAuth link). When a ghost user tries to sign in today, Better Auth finds the user record, prompts for a password, and rejects them; the forgot-password flow also errors because Better Auth's `forgetPassword` requires an existing credential account.

Separately, billing-compliant invoicing requires the user's postal address. The current `user` schema has no address fields, and neither the sign-up form nor any existing flow collects this data.

Total scope at time of writing:
- 2741 ghost users (no account rows, not verified)
- 36 users with credential (password) accounts
- 64 users with Google OAuth only

## Goals

1. Ghost users can activate an account and preserve their historical booking history, via either Google sign-in or a "set password via email" link.
2. All new registrations capture a Hungarian-compliant billing address (irányítószám, település, cím).
3. The 98 existing real users without an address are prompted to fill it on their next sign-in.
4. Ghost users who claim via the password path also supply the address in the same form.
5. Ghost users who claim via Google supply the address via the shared address gate immediately after OAuth.

## Non-goals

- No tax number (adószám) or separate floor/door field in this iteration. These were explicitly deferred.
- No changes to booking flows beyond what the address gate forces by virtue of being auth-layer middleware.
- No bulk outreach email to the 2741 ghosts announcing the claim flow. Claim is discovered when a user attempts sign-in.
- No retroactive `email_verified` flip for ghosts who never claim; they stay `false` until claim completion.

## Data model

Add three nullable `text` columns to the `user` table:

- `postal_code` — 4-digit Hungarian irányítószám
- `city` — település
- `street_address` — utca és házszám

All nullable at the DB level so the migration is non-breaking for the 2741 ghost users that will never backfill. The application enforces "required" at the form validation level and via the address gate.

One drizzle migration generated via `npx drizzle-kit generate`.

## Components

### 1. Email-status preflight endpoint

`GET /api/auth/email-status?email=<email>` → `{ status: "new" | "ghost" | "credential" | "oauth" }`

Lookup logic:
- No `user` row for the email → `new`
- `user` row exists but zero `account` rows → `ghost`
- At least one `account` row with `provider_id = 'credential'` → `credential`
- Only non-credential `account` rows (Google) → `oauth`

Rate-limited via Better Auth's existing rateLimit configuration (add a custom rule for this path, e.g., 10 requests per minute per IP). This endpoint leaks user-existence information; the site's risk profile (a doctor's booking system) makes that an acceptable tradeoff in exchange for cleaner UX than the "try it and fail" alternative.

### 2. Sign-in UI branching

The existing sign-in page calls `email-status` on email submit and branches:
- `new` → redirect to sign-up with email prefilled
- `ghost` → render the claim screen (see below)
- `credential` → render password field (current behavior)
- `oauth` → render only the "Continue with Google" button

### 3. Claim screen

Shown when `email-status` returns `ghost`. The email is already known from the previous sign-in step and is held in component state; the user is not asked for it again. The screen displays:
- "Continue with Google" button → existing `/api/auth/sign-in/social?provider=google` route. Because `accountLinking.enabled: true` with `trustedProviders: ["google"]` is already set in `src/lib/auth.ts`, the OAuth callback auto-links to the existing `user` row by email. No auth code change needed for the linking.
- "Send password-setup link" button → `POST /api/auth/claim/start` with the known email in the body.

### 4. Claim-start endpoint

`POST /api/auth/claim/start` body `{ email }`:
1. Re-verify the user is a ghost (defensive, since the request can arrive from outside the UI).
2. Generate a 32-byte random token. Hash with SHA-256.
3. Insert into `verification` with `identifier = claim:<userId>`, `value = <hash>`, `expires_at = now + 60 minutes`.
4. Send an email via the existing `sendEmail` helper with a link to `/claim/complete?token=<raw-token>&email=<email>`. Subject: *"Fejezze be a fiók aktiválását"*.
5. Return `{ ok: true }` regardless of whether the email is actually a ghost, to avoid enumeration. (Only log and skip; the client always sees success.)

### 5. Claim-complete page and endpoint

`GET /claim/complete?token=…&email=…` renders a form:
- New password + confirm password
- Irányítószám, település, cím (all required)

On mount, client calls `GET /api/auth/claim/verify?token=…&email=…` to confirm the token is valid (matches a non-expired verification row) before showing the form. On failure, the page shows "Ez a link érvénytelen vagy lejárt" and offers to request a new one. This endpoint does not consume the token — it only reads.

`POST /api/auth/claim/complete` body `{ email, token, password, postalCode, city, streetAddress }`:
1. Look up `verification` by identifier `claim:<userId>`. Compare SHA-256 of the submitted token to the stored `value`. Check `expires_at`.
2. Hash the password via Better Auth's internal hasher (`auth.$context.password.hash`).
3. Insert an `account` row: `provider_id='credential'`, `account_id=<userId>`, `password=<hash>`, `user_id=<userId>`.
4. Update the `user` row: `email_verified=true`, `postal_code`, `city`, `street_address`, `updated_at=now`.
5. Delete the verification row.
6. Create a Better Auth session by calling `auth.api.signInEmail` with the just-set password, re-using the stock sign-in path so cookies are issued the same way as a normal login. Chosen over lower-level session insertion for consistency with existing auth flows.
7. Redirect to `/`.

### 6. Address gate (existing users with no address)

Implemented as a server-side check in the authenticated app layout (`src/app/(auth)/layout.tsx` or the nearest equivalent — to be identified during implementation):

```
if (session && !session.user.postalCode && pathname !== "/profil/cim") {
  redirect("/profil/cim");
}
```

`/profil/cim` is a simple page: 3 fields, submit to `POST /api/user/address`, then redirect back to wherever they were going (via a `?next=` param).

`POST /api/user/address` body `{ postalCode, city, streetAddress }`:
1. Requires a valid session.
2. Validates with zod.
3. Updates the `user` row.
4. Returns `{ ok: true }`.

### 7. Sign-up form changes

Add three required fields to the existing sign-up form: irányítószám (4-digit numeric), település (text), cím (text).

Better Auth integration: register `postalCode`, `city`, `streetAddress` under `user.additionalFields` in `src/lib/auth.ts` so `auth.api.signUpEmail` accepts them and persists them on the initial insert. If additionalFields proves finicky, fall back to a post-signup `UPDATE "user"` — doesn't change the design, only the call shape.

## Copy (Hungarian)

- Claim email subject: *"Fejezze be a fiók aktiválását"*
- Claim email body: short paragraph explaining that a booking account exists under this email and the link sets the password.
- Claim page heading: *"Fiók aktiválása"*
- Address gate heading: *"Számlázási cím"*, subheading explaining why it's needed (invoicing).
- Field labels: *Irányítószám*, *Település*, *Utca, házszám*.

Final copy drafted during implementation, subject to a quick owner review.

## Security and abuse considerations

- **Email enumeration via preflight:** acknowledged tradeoff. Rate-limited (10/min/IP) to bound automated probing.
- **Token security:** 32 bytes of randomness, SHA-256-hashed at rest, 60-minute TTL, single-use (row deleted on success).
- **Replay:** the verification row deletion prevents replay. If the user clicks the link twice in quick succession, the second request fails gracefully ("this link has already been used").
- **Cross-user:** the token is scoped to `claim:<userId>` and the submitted `email` is checked against the `userId` associated with that token. Mismatched email/token combinations are rejected.
- **Rate limit for claim-start:** 3 requests per 10 minutes per IP+email pair to prevent email bombing.

## Testing

- Unit/integration tests for the four new API routes (`email-status`, `claim/start`, `claim/complete`, `user/address`). Cover success, token-mismatch, expired-token, non-ghost-user-attempting-claim, and address-gate bypass attempts.
- Manual verification in dev:
  - Ghost user signs in with Google → gets redirected to address gate → completes → lands on home.
  - Ghost user sets password via email → arrives on claim-complete form → submits with address → is signed in, sees home.
  - New registration → form now requires address → user row has all three columns populated.
  - Existing credential user without address → is forced through the gate on next sign-in.
- No E2E browser tests in this iteration (project doesn't currently have a Playwright setup beyond the skill's infra; adding one is out of scope).

## Rollout

1. Deploy the schema migration (backwards-compatible; nullable columns).
2. Deploy the code. The 98 existing real users are gated on next sign-in. Ghost users silently become claim-eligible at next sign-in attempt.
3. Monitor: (a) number of claims completed per day, (b) number of address-gate completions per day, (c) any 500s from the four new endpoints.

## Open follow-ups (not this spec)

- Add a `source='import'` or equivalent marker column to distinguish ghost users from real ones at the schema level. Currently we infer it by "has no account rows," which is sound but indirect.
- Consider a one-time bulk email to ghost users announcing the claim flow, if the organic discovery rate is too low after 2–4 weeks.
