---
phase: 10-authentication
plan: "01"
subsystem: authentication
tags: [better-auth, drizzle-orm, neon, postgresql, session, oauth, middleware]
dependency_graph:
  requires: []
  provides:
    - better-auth server instance (src/lib/auth.ts)
    - better-auth react client (src/lib/auth-client.ts)
    - drizzle db instance (src/lib/db/index.ts)
    - drizzle schema for auth tables (src/lib/db/schema.ts)
    - next.js auth api route (src/app/api/auth/[...all]/route.ts)
    - next.js middleware for /admin cookie check (middleware.ts)
  affects:
    - all future auth flows (patient login, admin login)
    - booking flow auth gate (Phase 11)
    - admin dashboard (Phase 12)
tech_stack:
  added:
    - better-auth@1.4.18
    - drizzle-orm@0.45.1
    - "@neondatabase/serverless@1.0.2"
    - resend@6.9.2
    - drizzle-kit@0.31.9 (dev)
  patterns:
    - Better Auth server with drizzleAdapter(db, { provider: "pg" })
    - Lazy db proxy pattern for Next.js build compatibility
    - Lazy Resend initialization inside email callbacks (fire-and-forget)
    - getSessionCookie for performant middleware cookie check (no DB call)
    - force-dynamic on auth route to prevent static evaluation
key_files:
  created:
    - drizzle.config.ts
    - src/lib/auth.ts
    - src/lib/auth-client.ts
    - src/lib/db/index.ts
    - src/lib/db/schema.ts
    - src/app/api/auth/[...all]/route.ts
    - middleware.ts
  modified:
    - package.json (added 5 dependencies)
    - .env.example (added 8 new env vars)
decisions:
  - "Used lazy Proxy pattern for db instance to avoid neon() throwing during Next.js build without DATABASE_URL"
  - "Used lazy getResend() function inside email callbacks instead of module-level new Resend() to avoid build-time crash"
  - "Added export const dynamic = 'force-dynamic' to auth route handler"
  - "Manually created Drizzle schema from Better Auth CLI table definitions (CLI requires DATABASE_URL which is not available during development setup)"
  - "biome-ignore comments on 3 intentional non-null assertions (required env vars)"
metrics:
  duration: "11 minutes"
  completed: "2026-02-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 2
---

# Phase 10 Plan 01: Authentication Infrastructure Summary

**One-liner:** Better Auth + Drizzle + Neon auth infrastructure with Google OAuth, email/password, 30-day sessions, rate limiting, and admin plugin — build passes without any required env vars set.

## What Was Built

Complete authentication foundation for the Morocz Medical v2.0 booking module:

- **Package installation:** `better-auth`, `drizzle-orm`, `@neondatabase/serverless`, `resend`, `drizzle-kit`
- **Database layer:** Drizzle ORM connected to Neon PostgreSQL via `neon-http` driver with lazy proxy initialization
- **Auth schema:** Drizzle PostgreSQL schema for all 4 Better Auth tables (`user`, `session`, `account`, `verification`) including admin plugin fields (`role`, `banned`, `banReason`, `banExpires`, `impersonatedBy`)
- **Auth server (`src/lib/auth.ts`):** Full Better Auth configuration with email/password (min 6 chars), Google OAuth, account linking, 30-day sessions with daily refresh, rate limiting (5 sign-in attempts/min), admin plugin, and nextCookies plugin
- **Auth client (`src/lib/auth-client.ts`):** React client with adminClient plugin, exports `signIn`, `signUp`, `signOut`, `useSession`
- **API route handler:** `src/app/api/auth/[...all]/route.ts` using `toNextJsHandler(auth)`
- **Middleware:** Root `middleware.ts` using `getSessionCookie` for fast cookie-only check on `/admin` routes
- **Environment template:** `.env.example` updated with all 8 new required variables

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install packages and configure Drizzle + Neon | f899d0c | package.json, drizzle.config.ts, src/lib/db/index.ts, src/lib/db/schema.ts, .env.example |
| 2 | Configure Better Auth server/client, API route, schema, middleware | eadf378 | src/lib/auth.ts, src/lib/auth-client.ts, src/lib/db/schema.ts, src/app/api/auth/[...all]/route.ts, middleware.ts |

## Verification Passed

- `npm ls better-auth drizzle-orm @neondatabase/serverless resend drizzle-kit` — all installed
- `npx tsc --noEmit` — zero TypeScript errors
- `npm run build` — build passes (exit code 0) with no compilation errors
- `npx biome check` — zero errors, zero warnings on all new files
- All required files exist with correct exports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Next.js build-time crash: neon() called without DATABASE_URL**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** `neon(process.env.DATABASE_URL!)` in `src/lib/db/index.ts` was evaluated at module load time. Next.js "Collecting page data" phase imports the module, triggering the error even with `force-dynamic` on the route.
- **Fix:** Replaced direct neon call with a lazy Proxy pattern. `createDb()` is only called when `db` properties are first accessed (at request time, not module load time).
- **Files modified:** `src/lib/db/index.ts`
- **Commit:** eadf378

**2. [Rule 1 - Bug] Next.js build-time crash: new Resend() called without RESEND_API_KEY**
- **Found during:** Task 2 verification (npm run build, after fixing neon bug)
- **Issue:** `new Resend(process.env.RESEND_API_KEY)` at module level threw "Missing API key" during Next.js page data collection phase.
- **Fix:** Moved Resend instantiation inside `getResend()` function, called lazily within `sendResetPassword` and `sendVerificationEmail` callbacks (which only run at request time, never during build).
- **Files modified:** `src/lib/auth.ts`
- **Commit:** eadf378

**3. [Rule 1 - Bug] Better Auth CLI cannot generate schema without DATABASE_URL**
- **Found during:** Task 2, step 3 (npx @better-auth/cli@latest generate)
- **Issue:** The CLI imports `auth.ts` which imports `db/index.ts` which calls `neon()` — same chain as above, and the CLI exits with error.
- **Fix:** Generated the schema manually by introspecting Better Auth's `getAuthTables()` function via a temporary Node.js script. The resulting Drizzle schema matches exactly what the CLI would have generated for a PostgreSQL provider.
- **Files modified:** `src/lib/db/schema.ts`
- **Commit:** eadf378

**Note on Drizzle migrations:** `npx drizzle-kit generate` and `npx drizzle-kit migrate` require `DATABASE_URL` to be set. These cannot be run during development setup without a Neon project. The migration commands are documented in `src/lib/db/schema.ts` and must be run after the user sets up Neon (see user_setup in the plan frontmatter).

## Pending User Actions (before auth will work at runtime)

1. Create Neon project and add `DATABASE_URL` to `.env.local`
2. Run `npx drizzle-kit generate && npx drizzle-kit migrate` to create auth tables
3. Create Google OAuth credentials and add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
4. Generate `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and add to `.env.local`
5. Create Resend API key and add `RESEND_API_KEY`
6. Run admin seeding script (Phase 12) to create first admin user

## Self-Check: PASSED

All 7 created files exist on disk. Both task commits (f899d0c, eadf378) confirmed in git log.
