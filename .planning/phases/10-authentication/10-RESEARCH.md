# Phase 10: Authentication - Research

**Researched:** 2026-02-22
**Domain:** Auth library selection, OAuth, credential auth, session management, role-based route protection
**Confidence:** HIGH (core stack verified against official docs; one critical library switch confirmed)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Login/Register UI:**
- Login and registration on the same view with a Belépés / Regisztráció tab toggle
- Google OAuth button positioned on top, then an "vagy" divider, then email/password fields below
- Centered card design on simple background
- Inline validation errors displayed as red text directly below each invalid field
- **Key shift:** Patient auth is NOT a standalone page — it's embedded inline in the booking flow on /idopontfoglalas. The centered card with tabs lives within the booking process, not at /bejelentkezes

**Auth flow behavior:**
- After patient login during booking: continue the booking flow from where they left off (return to previous step)
- Email verification: account works immediately after registration, but a banner nudges them to verify their email
- Password requirements: simple — minimum 6 characters, no special rules (low friction for a medical appointment site)
- Session duration: 30 days before requiring re-authentication

**Role separation:**
- No standalone patient login page (/bejelentkezes not needed for patients)
- No /fiokom patient dashboard — patients only authenticate to book appointments
- Admin login is inline on /admin: visiting /admin shows a login form if not authenticated, dashboard if authenticated
- Admin login has a distinct, utilitarian/professional look — clearly a backend login, not patient-facing
- Admin: no Google OAuth — email/password only
- Multiple admin accounts supported (e.g., doctor + receptionist)
- New admin accounts created via invite by existing admin (email invite → private registration link)

**Account recovery:**
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

### Deferred Ideas (OUT OF SCOPE)
- Patient self-service cancellation/rescheduling — will need auth but belongs in booking management phase
- Patient profile page — explicitly not wanted; if needed in the future, it's a new phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Patient can register with email and password | Better Auth emailAndPassword plugin with minPasswordLength: 6; bcrypt hashing built-in |
| AUTH-02 | Patient can register/login with Google OAuth | Better Auth socialProviders.google; allowDangerousEmailAccountLinking for same-email auto-link |
| AUTH-03 | Patient session persists across browser refresh (JWT) | Better Auth uses encrypted session cookies + DB sessions by default; session.expiresIn: 30 days |
| AUTH-04 | Admin can log in with email/password to access the dashboard | Better Auth emailAndPassword + admin plugin; role check in middleware for /admin |
| AUTH-05 | Admin and patient auth are separate role paths | Role stored on user.role; middleware checks role before granting /admin access |
</phase_requirements>

---

## Summary

**CRITICAL FINDING: Auth.js v5 is abandoned — switch to Better Auth.**

Auth.js v5 (next-auth@beta) entered public beta in October 2023 but never shipped a stable release. Its original maintainer departed in January 2025. In late 2025, Better Auth acquired the Auth.js project specifically to prevent it from being abandoned. Auth.js v5 remains in unmaintained beta. STATE.md already documents Better Auth as the "confirmed fallback" — research confirms it is now the primary recommendation, not a fallback.

Better Auth is the current ecosystem standard for TypeScript-first Next.js authentication in 2026. It has 26,000+ GitHub stars, active development, built-in rate limiting, a Drizzle adapter, a Google OAuth provider, credentials auth with password hashing, session management, an admin plugin for role management, and account linking. It handles every requirement this phase needs without custom code.

The project has no existing database setup (no Prisma, no Drizzle found). Better Auth requires a relational database. The recommended pairing for Next.js 15 on Vercel is **Neon PostgreSQL** (serverless, free tier, Vercel marketplace integration) with **Drizzle ORM** as the adapter. This is an established stack with official Better Auth documentation.

**Primary recommendation:** Use Better Auth + Drizzle + Neon PostgreSQL. Abandon the Auth.js v5 reference in STATE.md and ROADMAP.md — update those at phase start.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | latest stable | Auth framework: sessions, OAuth, credentials, roles, rate limiting | TypeScript-native; active development; acquired Auth.js to prevent abandonment; handles all requirements built-in |
| drizzle-orm | latest | ORM for database access | Type-safe; works at Edge runtime (unlike Prisma); Better Auth has first-class adapter support |
| @neondatabase/serverless | latest | Serverless PostgreSQL driver | Required for Neon database; works on Vercel serverless/edge |
| drizzle-kit | latest (dev) | Migrations and schema generation | Paired with drizzle-orm for schema management |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | ^4.x | Password reset and email verification emails | Already planned for Phase 11; use same instance for auth emails |
| zod | ^3.x | Server action input validation | Project already uses Zod v3 (STATE.md: Zod 4 breaks Sanity builds) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Auth.js v5 | Auth.js v5 is unmaintained beta; never had stable release. Do not use. |
| Better Auth | Clerk | Clerk is SaaS, costs per user, less control; overkill for single-doctor practice |
| Neon PostgreSQL | Supabase | Supabase has generous free tier but heavier; Neon integrates directly into Vercel marketplace |
| Drizzle ORM | Prisma | Prisma has Edge runtime incompatibility issues (documented in GitHub issues); Drizzle works everywhere |

**Installation:**
```bash
npm install better-auth drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── auth.ts              # Better Auth server instance (all config)
│   ├── auth-client.ts       # Better Auth React client (browser)
│   └── db/
│       ├── index.ts         # Drizzle db instance (Neon connection)
│       └── schema.ts        # Drizzle schema (auth tables + custom fields)
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts # Better Auth catch-all route handler
│   ├── admin/
│   │   └── page.tsx         # Inline admin login OR dashboard based on session
│   └── idopontfoglalas/
│       └── page.tsx         # Booking flow with embedded auth card (step 4)
└── middleware.ts             # Cookie-based session check + role protection
```

### Pattern 1: Better Auth Server Config (auth.ts)

**What:** The central server-side auth instance — configure once, import everywhere.
**When to use:** Server Components, Server Actions, API routes, middleware.

```typescript
// Source: https://www.better-auth.com/docs/installation
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,       // User decision: low friction for medical site

    sendResetPassword: async ({ user, url }) => {
      // Use Resend (same instance as Phase 11 booking emails)
      void resend.emails.send({
        from: "noreply@moroczmedical.hu",
        to: user.email,
        subject: "Jelszó visszaállítása",
        html: `<a href="${url}">Jelszó visszaállítása</a>`,
      });
    },

    sendVerificationEmail: async ({ user, url }) => {
      void resend.emails.send({
        from: "noreply@moroczmedical.hu",
        to: user.email,
        subject: "E-mail cím megerősítése",
        html: `<a href="${url}">E-mail megerősítése</a>`,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Same-email account linking: user signs up with email then logs in with Google
  // (or vice versa) → linked automatically
  // Source: https://www.better-auth.com/docs/concepts/users-accounts
  accountLinking: {
    enabled: true,
    trustedProviders: ["google"], // Google verifies email, safe to auto-link
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (user decision)
    updateAge: 60 * 60 * 24,      // refresh daily while active
  },

  plugins: [
    admin(),        // User management: createUser, setRole, ban
    nextCookies(),  // Required for Server Actions to set cookies
  ],
});
```

### Pattern 2: Better Auth React Client (auth-client.ts)

**What:** Browser-side client for React components. Use for signIn, signUp, useSession hook.
**When to use:** Client Components only. Never on server.

```typescript
// Source: https://www.better-auth.com/docs/integrations/next
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [adminClient()],
});

// Destructure commonly used methods
export const { signIn, signUp, signOut, useSession } = authClient;
```

### Pattern 3: API Route Handler

```typescript
// Source: https://www.better-auth.com/docs/integrations/next
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Pattern 4: Role-Based Middleware (Next.js 15 — use middleware.ts)

**Critical note:** The project uses Next.js ^15.2.0. In Next.js 15, the file is `middleware.ts` (not `proxy.ts`). The rename to `proxy.ts` only applies in Next.js 16+. Use `getSessionCookie()` for performant cookie-only checks (no database call).

```typescript
// Source: https://www.better-auth.com/docs/integrations/next
// middleware.ts (root of project)
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // /admin protection: cookie existence only — role check happens in page
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      // Redirect to admin login (which is inline on /admin, so just continue)
      return NextResponse.next();
      // NOTE: No cookie → the /admin page renders its own login form
      // The REAL role check is inside the /admin page server component
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|studio).*)",
  ],
};
```

**Important:** Do not trust middleware alone for authorization. Always verify session + role in the page's Server Component via `auth.api.getSession()`.

### Pattern 5: Admin Page (Inline Login + Dashboard)

```typescript
// src/app/admin/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // No session → show inline login form
  if (!session) return <AdminLogin />;

  // Has session but wrong role → deny
  if (session.user.role !== "admin") {
    return <div>Hozzáférés megtagadva</div>;
  }

  // Admin session → show dashboard
  return <AdminDashboard />;
}
```

### Pattern 6: Role Assignment for Admins

Better Auth admin plugin adds `createUser` and `setRole` to the API. The first admin must be created via a seeding script or environment-based check (no built-in ADMIN_EMAIL env var — this is a custom pattern).

```typescript
// Option A: Server Action to create first admin (run once)
// src/app/api/setup-admin/route.ts (protected by SETUP_SECRET env var)
import { auth } from "@/lib/auth";

export async function GET() {
  const setupSecret = request.headers.get("x-setup-secret");
  if (setupSecret !== process.env.SETUP_SECRET) return Response.json({ error: "Forbidden" }, { status: 403 });

  await auth.api.createUser({
    body: {
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
      name: "Admin",
      role: "admin",
    },
  });
  return Response.json({ ok: true });
}

// Option B: Admin invites new admin (after initial admin exists)
// Uses Better Auth admin plugin createUser + send invite email
```

### Pattern 7: Patient Auth Embedded in Booking Flow

The auth card is NOT a page — it's a step in the booking wizard on /idopontfoglalas.

```typescript
// Conceptual: src/app/idopontfoglalas/AuthStep.tsx
"use client";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { useState } from "react";

type Tab = "belepes" | "regisztracio";

export function AuthStep({ onSuccess }: { onSuccess: () => void }) {
  const [tab, setTab] = useState<Tab>("belepes");
  const { data: session } = useSession();

  // If already logged in, auto-advance
  if (session) { onSuccess(); return null; }

  return (
    <div className="auth-card">
      {/* Belépés / Regisztráció tabs */}
      {/* Google OAuth button (top, prominent) */}
      {/* "vagy" divider */}
      {/* Email + Password fields */}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Using Auth.js v5 (next-auth@beta):** It is unmaintained. Do not install it.
- **Relying on middleware alone for authorization:** Middleware cookie checks are for performance (fast redirects). Always re-verify session in the server component close to data access.
- **Storing role in JWT only without database:** Better Auth stores role on the user record in the database. This is correct. Don't put it only in JWT.
- **Using proxy.ts instead of middleware.ts:** This project is on Next.js 15. proxy.ts is a Next.js 16 convention. Middleware.ts is correct.
- **Awaiting email sends inside auth callbacks:** Use `void sendEmail(...)` to avoid blocking the auth response and prevent timing attacks.
- **Using Zod v4:** STATE.md documents that Zod v4 is ESM-only and breaks Sanity v4 builds. Stick with Zod v3 for any validation in this phase.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt wrapper | Better Auth built-in | Better Auth handles saltAndHash internally; Credentials authorize function handles it |
| Session cookies | Custom JWT signing | Better Auth session management | Secure httpOnly cookies with encryption; handles rotation |
| OAuth flow | Custom Google OAuth handler | Better Auth socialProviders.google | OAuth CSRF, state validation, token exchange — all handled |
| Rate limiting | In-memory Map with login counter | Better Auth built-in rateLimit | Better Auth limits /sign-in/email to 3 requests per 10s by default; configurable |
| Account linking | Custom email lookup + merge | Better Auth accountLinking + trustedProviders | Built-in; safe for Google (email_verified flag) |
| Role checks | Custom middleware role extraction | Better Auth admin plugin + session.user.role | Role is in database, accessible via auth.api.getSession |
| Password reset tokens | Custom token table + expiry | Better Auth sendResetPassword | Built-in token generation, storage, and expiry (1 hour default) |
| Admin user creation | Manual SQL insert | Better Auth admin plugin createUser | Type-safe, role-aware, session-invalidating if banning |

**Key insight:** Better Auth's value is that password auth, OAuth, rate limiting, account linking, role management, and password reset are all in one library with one database schema. Building any of these by hand means owning edge cases (timing attacks, token collision, race conditions on account linking) that Better Auth already handles.

---

## Common Pitfalls

### Pitfall 1: Auth.js v5 Still Listed in Project Docs

**What goes wrong:** Developer installs next-auth@beta because ROADMAP.md says "Auth.js v5". Gets an unmaintained library with sparse documentation and potential security gaps.
**Why it happens:** ROADMAP.md was written before the abandonment became public. STATE.md documents Better Auth as fallback but not yet as primary.
**How to avoid:** At phase start, update ROADMAP.md Phase 10 description and STATE.md to replace "Auth.js v5" with "Better Auth". Install `better-auth`, not `next-auth@beta`.
**Warning signs:** If you see `npm install next-auth@beta` in a task — stop.

### Pitfall 2: Using proxy.ts on Next.js 15

**What goes wrong:** Developer creates proxy.ts because recent docs mention it. Build fails — Next.js 15 doesn't recognize proxy.ts as the middleware convention.
**Why it happens:** Next.js 16 renamed middleware.ts to proxy.ts. The project is on Next.js ^15.2.0.
**How to avoid:** Use middleware.ts. The proxy.ts rename is a Next.js 16+ change only.
**Warning signs:** Middleware never runs; no redirects happen.

### Pitfall 3: Role Not Persisted to Database

**What goes wrong:** Admin role set on first login disappears after session expiry because it was only in the JWT, not the database record.
**Why it happens:** Developers familiar with Auth.js v4 patterns put role in JWT callbacks and forget the database user record.
**How to avoid:** Better Auth admin plugin writes role to the `user.role` database column. Don't override this with manual JWT callbacks. The role flows: DB user.role → session via Better Auth's built-in session handler.
**Warning signs:** Admin loses access after re-login.

### Pitfall 4: Blocking Email Sends in Auth Callbacks

**What goes wrong:** Auth response is slow or times out on Vercel serverless because `await resend.emails.send()` blocks the response.
**Why it happens:** Intuitive to await async operations; Vercel serverless functions freeze on response.
**How to avoid:** Use `void sendEmail(...)` (fire-and-forget). On Vercel, sendVerificationEmail and sendResetPassword should NOT be awaited.
**Warning signs:** Login/register takes 3-5+ seconds; sporadic Vercel timeouts.

### Pitfall 5: Drizzle Schema Not Generated Before Migrations

**What goes wrong:** Better Auth tables don't exist; session creation throws database errors.
**Why it happens:** Developer writes auth code before running `npx @better-auth/cli generate`.
**How to avoid:** Run CLI generate → inspect schema → run `npx drizzle-kit generate` → run `npx drizzle-kit migrate`. Order matters.
**Warning signs:** "relation does not exist" PostgreSQL errors at runtime.

### Pitfall 6: rememberMe Not Set → Sessions Expire in 1 Day

**What goes wrong:** Despite session.expiresIn: 30 days, sessions expire after ~1 day.
**Why it happens:** Better Auth has a rememberMe flag in signIn. When not explicitly set to true, some versions cap session expiry at 1 day regardless of config.
**How to avoid:** Always pass `rememberMe: true` in the signIn call for patients (30-day persistence is a requirement).
**Warning signs:** Patients frequently asked to re-authenticate.

### Pitfall 7: Admin Invite Flow Complexity

**What goes wrong:** Admin invite (email → private registration link) is under-estimated. It requires: generating a time-limited token, storing it, emailing a link, and creating the user with admin role on link click.
**Why it happens:** Treated as a one-liner when it's actually a mini flow.
**How to avoid:** Use Better Auth admin plugin's `createUser` with a pre-set password, or implement a custom invite token table. Research the Better Auth Organization plugin's invitation system — it may be overkill but contains the pattern.
**Warning signs:** Invite links never expire; no role set on created admin.

---

## Code Examples

Verified patterns from official sources:

### Database Setup (Drizzle + Neon)

```typescript
// Source: https://www.better-auth.com/docs/adapters/drizzle
// src/lib/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Generate Better Auth Schema

```bash
# Source: https://www.better-auth.com/docs/installation
# Run once after configuring auth.ts
npx @better-auth/cli@latest generate
# Outputs schema to src/lib/db/schema.ts (or merges with existing)

# Then create and apply Drizzle migration
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Session Access in Server Component

```typescript
// Source: https://www.better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(),
});
// session?.user.id, session?.user.role, session?.user.email
```

### Google OAuth Sign-In (Client Component)

```typescript
// Source: https://www.better-auth.com/docs/basic-usage
"use client";
import { signIn } from "@/lib/auth-client";

await signIn.social({
  provider: "google",
  callbackURL: "/idopontfoglalas", // Return to booking after Google auth
});
```

### Email/Password Sign-In (Patient)

```typescript
// Source: https://www.better-auth.com/docs/basic-usage
"use client";
import { signIn } from "@/lib/auth-client";

const { error } = await signIn.email({
  email,
  password,
  rememberMe: true, // REQUIRED for 30-day sessions
  callbackURL: "/idopontfoglalas",
});
```

### Email/Password Registration (Patient)

```typescript
// Source: https://www.better-auth.com/docs/authentication/email-password
"use client";
import { signUp } from "@/lib/auth-client";

const { error } = await signUp.email({
  email,
  password,
  name,
  callbackURL: "/idopontfoglalas",
});
// Account works immediately; email verification is nudge-only (non-blocking)
```

### Create First Admin (Seeding Script)

```typescript
// Source: https://www.better-auth.com/docs/plugins/admin
// scripts/create-admin.ts (run once with ts-node or tsx)
import { auth } from "../src/lib/auth";

await auth.api.createUser({
  body: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_INITIAL_PASSWORD!,
    name: "Morocz Medical Admin",
    role: "admin",
  },
});
```

### Rate Limiting Config (Progressive, Never Full Lockout)

```typescript
// Source: https://www.better-auth.com/docs/concepts/rate-limit
// In auth.ts betterAuth config:
rateLimit: {
  window: 60,    // 60 second window
  max: 100,      // global default
  customRules: {
    "/sign-in/email": {
      window: 60,  // 1 minute
      max: 5,      // 5 attempts per minute (progressive slowdown, not lockout)
    },
  },
},
```

Note: Better Auth's rate limiter returns HTTP 429 (Too Many Requests), which the client can handle by showing a "Kérjük, várjon egy percet" message. This satisfies the "slow down, never lock out" requirement.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-auth v4 stable | Better Auth | 2025 | Auth.js v5 never stabilized; Better Auth is the active successor |
| middleware.ts (all Next.js) | proxy.ts (Next.js 16+) | Next.js 16 release | This project is on 15.x, so middleware.ts is still correct |
| Prisma adapter for auth | Drizzle adapter | 2024-2025 | Prisma has Edge runtime compatibility issues; Drizzle is Edge-safe |
| Vercel Postgres | Neon PostgreSQL | Q4 2024 - Q1 2025 | Vercel transitioned all Vercel Postgres stores to Neon natively |
| Auth.js "pages" config | Better Auth providers array | 2025 | Configuration model is completely different — no direct migration |

**Deprecated/outdated:**
- `next-auth@beta` (Auth.js v5): Unmaintained as of January 2025. Acquired by Better Auth in late 2025. Do not install.
- `NEXTAUTH_SECRET` env var: Was replaced by `AUTH_SECRET` in Auth.js v5. Better Auth uses `BETTER_AUTH_SECRET`.
- Auth.js split config pattern (auth.config.ts / auth.ts): This pattern existed to solve Prisma Edge incompatibility. Better Auth + Drizzle doesn't have this problem — single auth.ts file.

---

## Open Questions

1. **Admin invite token storage**
   - What we know: Better Auth admin plugin provides `createUser` with role assignment. Password can be set. Organization plugin has full invite flow.
   - What's unclear: Whether to use a custom invite_token table, the Organization plugin (might be overkill), or a simpler "admin creates user with temp password and emails them directly" approach.
   - Recommendation: Keep it simple — admin creates user via admin plugin's createUser endpoint (sets email + temp password + role: "admin"), sends the temp password via a simple email template. No invite tokens needed for a 2-admin system. Document as explicit decision in PLAN.

2. **Neon free tier limits**
   - What we know: Neon has a free tier; Vercel marketplace integrates it. It's used by many small Next.js apps in production.
   - What's unclear: Whether the free tier compute hours are sufficient for a low-traffic medical booking site (1 doctor, ~20-50 bookings/day).
   - Recommendation: Neon free tier is appropriate for this scale. If limits hit, upgrade is trivial. Note in PLAN that user should create a Neon account and add DATABASE_URL to Vercel env vars before coding begins.

3. **Booking flow auth state: where does auth step live in wizard?**
   - What we know: Auth is embedded in /idopontfoglalas booking flow. After login, user returns to previous step.
   - What's unclear: The exact step position (CONTEXT.md says BOOK-07: "Auth gate appears after slot selection, not before browsing"). This is Phase 11 territory, but the auth component needs to be designed with this in mind.
   - Recommendation: Design the AuthStep component in Phase 10 with an `onSuccess` callback prop. Phase 11 integrates it into the wizard at step 4.

---

## Sources

### Primary (HIGH confidence)
- https://www.better-auth.com/docs/installation — Better Auth installation, env vars, database setup
- https://www.better-auth.com/docs/integrations/next — Next.js integration, API route, proxy/middleware, session access
- https://www.better-auth.com/docs/concepts/rate-limit — Rate limiting defaults and custom rules
- https://www.better-auth.com/docs/plugins/admin — Admin plugin capabilities, createUser, setRole
- https://www.better-auth.com/docs/concepts/users-accounts — Account linking, trustedProviders
- https://www.better-auth.com/docs/adapters/drizzle — Drizzle adapter config and schema generation
- https://www.better-auth.com/docs/basic-usage — signIn, signUp, session management

### Secondary (MEDIUM confidence)
- https://news.ycombinator.com/item?id=45389293 — HN thread confirming Auth.js v5 acquisition by Better Auth (verified by multiple community members and Better Auth founder comment)
- https://authjs.dev/guides/edge-compatibility — Auth.js v5 split config pattern (documented but library is abandoned)
- https://nextjs.org/docs/messages/middleware-to-proxy — Next.js docs confirming proxy.ts is Next.js 16+ only
- https://neon.com/docs/guides/nextjs — Neon connection string format for Next.js

### Tertiary (LOW confidence)
- Multiple Medium/community articles on Better Auth + Drizzle + Neon stack (consistent with official docs but unverified against live APIs)
- GitHub issue about rememberMe behavior affecting session expiry (open issue, not official docs)

---

## Metadata

**Confidence breakdown:**
- Standard stack (Better Auth): HIGH — official docs verified, community adoption confirmed, explicit recommendation from Better Auth team
- Auth.js v5 abandonment: HIGH — confirmed via HN discussion with Better Auth founder + GitHub release history showing no stable release
- Architecture patterns: HIGH — code examples pulled directly from official Better Auth docs
- Drizzle + Neon pairing: HIGH — official Better Auth adapter docs + Vercel/Neon marketplace integration confirmed
- Session duration / rememberMe pitfall: MEDIUM — based on GitHub issues (not official docs); real risk but verify during implementation
- Admin invite flow: MEDIUM — Better Auth admin plugin confirmed; specific invite-with-role flow is low-documented

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (Better Auth is actively developed; re-check release notes before starting if >30 days pass)
