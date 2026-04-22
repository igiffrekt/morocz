# Ghost-user Claim + Billing Address — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let ~2741 imported ghost users claim their account (via Google or email password-setup link) while collecting a Hungarian billing address from all new and existing users.

**Architecture:** Three surfaces — (1) a preflight `email-status` endpoint that lets the sign-in UI branch between `new | ghost | credential | oauth`; (2) a token-based claim flow (`/api/auth/claim/start` → email with link → `/claim/complete` page → `/api/auth/claim/complete` sets password + address + signs in); (3) a reusable server helper `requireAddress()` that gates the booking page and redirects incomplete users to `/profil/cim`. Better Auth handles OAuth account linking via existing `accountLinking.trustedProviders: ["google"]` — no auth-config change needed for Google claims.

**Tech Stack:** Next.js 15 (App Router), Better Auth 1.4 (Drizzle adapter), Drizzle ORM + `drizzle-kit` migrations against Neon Postgres, Zod, Brevo email API, Tailwind.

**Testing note:** This repo has no test framework (no vitest/jest/playwright). The spec's "unit/integration tests for the four new routes" is translated into **curl-based endpoint verification** + **manual browser walkthrough** per task. Adding a test framework is out of scope and disproportionate for this feature.

**Spec:** `docs/superpowers/specs/2026-04-22-ghost-user-claim-and-address-design.md`

---

## File structure

**Created:**
- `drizzle/0005_<name>.sql` — migration adding `postal_code`, `city`, `street_address` to `user`
- `src/app/api/auth/email-status/route.ts` — GET preflight
- `src/app/api/auth/claim/start/route.ts` — POST, sends claim email
- `src/app/api/auth/claim/verify/route.ts` — GET, non-consuming token check
- `src/app/api/auth/claim/complete/route.ts` — POST, completes claim
- `src/app/api/user/address/route.ts` — POST, updates address
- `src/app/claim/complete/page.tsx` — client page (token form)
- `src/app/profil/cim/page.tsx` — address gate page
- `src/lib/address-gate.ts` — `requireAddress()` server helper + zod schema
- `src/lib/claim-tokens.ts` — generate/hash/verify token helpers

**Modified:**
- `src/lib/db/schema.ts` — add three nullable columns to `user`
- `src/lib/auth.ts` — add `/email-status` and `/claim/start` to `rateLimit.customRules`
- `src/components/auth/AuthStep.tsx` — email-status branching, ghost claim screen, address fields in sign-up
- `src/app/idopontfoglalas/page.tsx` — invoke `requireAddress()` when session exists

---

## Task 1 — Schema migration: add address columns to `user`

**Files:**
- Modify: `src/lib/db/schema.ts:5-23`
- Create: `drizzle/0005_<generated>.sql` (drizzle-kit generates the name)

- [ ] **Step 1.1: Edit the drizzle schema**

In `src/lib/db/schema.ts`, add three nullable text columns to the `user` table. Replace lines 20-23 (the "customer fields" block) with:

```ts
  // customer fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  lastAppointment: timestamp("last_appointment"),
  // billing address (nullable; populated at signup, claim, or via address gate)
  postalCode: text("postal_code"),
  city: text("city"),
  streetAddress: text("street_address"),
```

- [ ] **Step 1.2: Generate the migration**

```bash
cd /Users/igiffrekt-m4/projects/morocz
npx drizzle-kit generate
```

Expected output: a new file under `drizzle/0005_*.sql` containing three `ALTER TABLE "user" ADD COLUMN ...` statements for `postal_code`, `city`, `street_address`, all `text` and nullable. Read the file to confirm it matches. No `NOT NULL` constraint should appear.

- [ ] **Step 1.3: Apply the migration against the dev database**

```bash
cd /Users/igiffrekt-m4/projects/morocz
npx drizzle-kit migrate
```

Expected output: drizzle logs applying `0005_*.sql`. If `DATABASE_URL` is not in the shell environment, export it from `.env.local` first (`set -a && source .env.local && set +a`).

- [ ] **Step 1.4: Verify the columns exist**

```bash
psql "$DATABASE_URL" -c "\d user" | grep -E "postal_code|city|street_address"
```

Expected: three rows, each showing `text` and no `not null`.

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/0005_*.sql drizzle/meta
git commit -m "Add nullable postal_code, city, street_address to user table"
```

---

## Task 2 — `POST /api/user/address` (address-update endpoint)

This comes first because Task 9's address-gate page depends on it.

**Files:**
- Create: `src/lib/address-gate.ts`
- Create: `src/app/api/user/address/route.ts`

- [ ] **Step 2.1: Create the shared zod schema**

Create `src/lib/address-gate.ts` with the validation rules reused by both the address-update endpoint and the claim-complete endpoint. Leave the `requireAddress()` helper as a placeholder — it's implemented fully in Task 9.

```ts
import { z } from "zod";

export const addressSchema = z.object({
  postalCode: z
    .string()
    .regex(/^\d{4}$/, "Az irányítószám 4 számjegyből áll"),
  city: z
    .string()
    .trim()
    .min(1, "A település megadása kötelező")
    .max(100, "A település neve túl hosszú"),
  streetAddress: z
    .string()
    .trim()
    .min(3, "Az utca és házszám megadása kötelező")
    .max(200, "A cím túl hosszú"),
});

export type AddressInput = z.infer<typeof addressSchema>;
```

- [ ] **Step 2.2: Create the POST endpoint**

Create `src/app/api/user/address/route.ts`, modeled on `src/app/api/user/phone/route.ts`:

```ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/address-gate";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return Response.json({ error: "Nincs hitelesítve" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" },
        { status: 400 },
      );
    }

    const { postalCode, city, streetAddress } = parsed.data;

    await db
      .update(user)
      .set({ postalCode, city, streetAddress, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[api/user/address] Error:", err);
    return Response.json({ error: "Hiba történt a cím mentésekor" }, { status: 500 });
  }
}
```

- [ ] **Step 2.3: Verify with curl**

Start the dev server (`npm run dev`), sign in as a known test user in a browser to obtain a session cookie, copy the `better-auth.session_token` cookie value, then:

```bash
# Replace <cookie> with the session cookie header
curl -i -X POST http://localhost:3000/api/user/address \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<cookie>" \
  -d '{"postalCode":"1051","city":"Budapest","streetAddress":"Kossuth Lajos tér 1."}'
```

Expected: `HTTP/1.1 200 OK`, body `{"success":true}`. Check the DB: `psql "$DATABASE_URL" -c "select email, postal_code, city, street_address from \"user\" where id = '<your-user-id>';"` shows the values.

Also verify validation:
```bash
curl -i -X POST http://localhost:3000/api/user/address \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=<cookie>" \
  -d '{"postalCode":"abc","city":"","streetAddress":""}'
```
Expected: `HTTP/1.1 400 Bad Request`, Hungarian error message.

Unauthenticated:
```bash
curl -i -X POST http://localhost:3000/api/user/address \
  -H "Content-Type: application/json" \
  -d '{"postalCode":"1051","city":"Budapest","streetAddress":"Fő út 1."}'
```
Expected: `HTTP/1.1 401 Unauthorized`.

- [ ] **Step 2.4: Commit**

```bash
git add src/lib/address-gate.ts src/app/api/user/address/route.ts
git commit -m "Add POST /api/user/address endpoint with zod validation"
```

---

## Task 3 — `GET /api/auth/email-status` (preflight)

**Files:**
- Create: `src/app/api/auth/email-status/route.ts`

- [ ] **Step 3.1: Implement the endpoint**

Create `src/app/api/auth/email-status/route.ts`:

```ts
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  email: z.string().email().max(254),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ email: url.searchParams.get("email") });
  if (!parsed.success) {
    return Response.json({ error: "Érvénytelen e-mail cím" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  try {
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });

    if (!userRow) {
      return Response.json({ status: "new" });
    }

    const accounts = await db
      .select({ providerId: account.providerId })
      .from(account)
      .where(eq(account.userId, userRow.id));

    if (accounts.length === 0) {
      return Response.json({ status: "ghost" });
    }

    const hasCredential = accounts.some((a) => a.providerId === "credential");
    return Response.json({ status: hasCredential ? "credential" : "oauth" });
  } catch (err) {
    console.error("[api/auth/email-status] Error:", err);
    return Response.json({ error: "Hiba történt" }, { status: 500 });
  }
}
```

- [ ] **Step 3.2: Verify with curl**

Pick four emails from the DB — one not present, one ghost (no account row), one credential, one Google-only — and:

```bash
# not present
curl -s "http://localhost:3000/api/auth/email-status?email=nobody@example.com"
# ghost
curl -s "http://localhost:3000/api/auth/email-status?email=<ghost@...>"
# credential
curl -s "http://localhost:3000/api/auth/email-status?email=<credential@...>"
# oauth
curl -s "http://localhost:3000/api/auth/email-status?email=<oauth@...>"
```

Expected JSON bodies: `{"status":"new"}`, `{"status":"ghost"}`, `{"status":"credential"}`, `{"status":"oauth"}` respectively.

Helper to find one ghost user for testing:
```bash
psql "$DATABASE_URL" -c "select email from \"user\" where id not in (select user_id from account) limit 3;"
```

- [ ] **Step 3.3: Commit**

```bash
git add src/app/api/auth/email-status/route.ts
git commit -m "Add GET /api/auth/email-status preflight for sign-in branching"
```

---

## Task 4 — Claim-token helpers (`src/lib/claim-tokens.ts`)

Extracted so claim/start, claim/verify, and claim/complete share the same hashing and lookup logic.

**Files:**
- Create: `src/lib/claim-tokens.ts`

- [ ] **Step 4.1: Implement helpers**

Create `src/lib/claim-tokens.ts`:

```ts
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { verification } from "@/lib/db/schema";

const CLAIM_TTL_MS = 60 * 60 * 1000; // 60 minutes

export function claimIdentifier(userId: string): string {
  return `claim:${userId}`;
}

export function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function insertClaimToken(userId: string, rawToken: string): Promise<void> {
  const now = new Date();
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: claimIdentifier(userId),
    value: hashToken(rawToken),
    expiresAt: new Date(now.getTime() + CLAIM_TTL_MS),
    createdAt: now,
    updatedAt: now,
  });
}

/** Returns the verification row if the (userId, token) pair is valid and unexpired. */
export async function findValidClaimToken(userId: string, rawToken: string) {
  const row = await db.query.verification.findFirst({
    where: and(
      eq(verification.identifier, claimIdentifier(userId)),
      eq(verification.value, hashToken(rawToken)),
      gt(verification.expiresAt, new Date()),
    ),
  });
  return row ?? null;
}

export async function consumeClaimToken(rowId: string): Promise<void> {
  await db.delete(verification).where(eq(verification.id, rowId));
}
```

Note: `node:crypto` is fine here because these routes run under the Node.js runtime, not Edge. No `export const runtime = "edge"` is in any other API route in this project.

- [ ] **Step 4.2: Commit**

```bash
git add src/lib/claim-tokens.ts
git commit -m "Add claim-token helpers (generate, hash, insert, lookup, consume)"
```

---

## Task 5 — `POST /api/auth/claim/start`

**Files:**
- Create: `src/app/api/auth/claim/start/route.ts`

- [ ] **Step 5.1: Implement the endpoint**

Create `src/app/api/auth/claim/start/route.ts`:

```ts
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
import { generateRawToken, insertClaimToken } from "@/lib/claim-tokens";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Érvénytelen e-mail cím" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  try {
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });

    // Always return ok to prevent enumeration. Do the real work only if ghost.
    if (userRow) {
      const accounts = await db
        .select({ id: account.id })
        .from(account)
        .where(eq(account.userId, userRow.id));

      if (accounts.length === 0) {
        const rawToken = generateRawToken();
        await insertClaimToken(userRow.id, rawToken);

        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        const link = `${baseUrl}/claim/complete?token=${rawToken}&email=${encodeURIComponent(email)}`;

        if (isEmailConfigured()) {
          try {
            await sendEmail({
              to: email,
              subject: "Fejezze be a fiók aktiválását",
              html: `<p>Kedves Páciensünk!</p>
<p>Az Ön e-mail címével már létezik egy foglalási fiók a Mórocz Medical rendszerében.
A fiók aktiválásához és jelszó beállításához kattintson az alábbi linkre:</p>
<p><a href="${link}">Fiók aktiválása</a></p>
<p>A link 60 percig érvényes.</p>
<p>Ha nem Ön kezdeményezte, hagyja figyelmen kívül ezt az e-mailt.</p>`,
            });
          } catch (err) {
            console.error("[claim/start] Email send failed for", email, err);
          }
        } else {
          console.warn("[claim/start] Email not configured; claim link:", link);
        }
      }
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/auth/claim/start] Error:", err);
    // Still return ok to avoid leaking state through timing/error differences.
    return Response.json({ ok: true });
  }
}
```

- [ ] **Step 5.2: Verify with curl**

```bash
# ghost email — expect email sent (or console log if BREVO not configured), token row inserted
curl -i -X POST http://localhost:3000/api/auth/claim/start \
  -H "Content-Type: application/json" \
  -d '{"email":"<ghost-email-from-db>"}'
```
Expected: `200 OK`, body `{"ok":true}`. In dev logs, look for `[email] Sending via Brevo` OR `[claim/start] Email not configured; claim link: ...`. Copy the link for Task 7 testing.

Verify the token row:
```bash
psql "$DATABASE_URL" -c "select identifier, expires_at from verification where identifier like 'claim:%' order by created_at desc limit 3;"
```
Expected: one row with `claim:<user-id>` and `expires_at` ~60 min in the future.

```bash
# non-ghost email — expect ok, no token inserted
curl -s -X POST http://localhost:3000/api/auth/claim/start \
  -H "Content-Type: application/json" \
  -d '{"email":"<credential-user-email>"}'
```
Expected: `{"ok":true}`, and no new row for that user in `verification` (re-run the psql query and compare).

```bash
# nonexistent email — expect ok
curl -s -X POST http://localhost:3000/api/auth/claim/start \
  -H "Content-Type: application/json" \
  -d '{"email":"does-not-exist@example.com"}'
```
Expected: `{"ok":true}`.

- [ ] **Step 5.3: Commit**

```bash
git add src/app/api/auth/claim/start/route.ts
git commit -m "Add POST /api/auth/claim/start to email ghost users a claim link"
```

---

## Task 6 — `GET /api/auth/claim/verify` (non-consuming token check)

**Files:**
- Create: `src/app/api/auth/claim/verify/route.ts`

- [ ] **Step 6.1: Implement the endpoint**

Create `src/app/api/auth/claim/verify/route.ts`:

```ts
import { eq } from "drizzle-orm";
import { z } from "zod";
import { findValidClaimToken } from "@/lib/claim-tokens";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  token: z.string().min(32).max(128),
  email: z.string().email().max(254),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    token: url.searchParams.get("token"),
    email: url.searchParams.get("email"),
  });
  if (!parsed.success) {
    return Response.json({ valid: false }, { status: 400 });
  }

  try {
    const email = parsed.data.email.toLowerCase();
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });
    if (!userRow) {
      return Response.json({ valid: false });
    }

    const tokenRow = await findValidClaimToken(userRow.id, parsed.data.token);
    return Response.json({ valid: !!tokenRow });
  } catch (err) {
    console.error("[api/auth/claim/verify] Error:", err);
    return Response.json({ valid: false }, { status: 500 });
  }
}
```

- [ ] **Step 6.2: Verify with curl**

Using the token from the Task 5 dev-log link:

```bash
curl -s "http://localhost:3000/api/auth/claim/verify?token=<raw-token>&email=<ghost-email>"
```
Expected: `{"valid":true}`.

Wrong email / wrong token / missing params:
```bash
curl -s "http://localhost:3000/api/auth/claim/verify?token=ffff&email=<ghost-email>"
curl -s "http://localhost:3000/api/auth/claim/verify?token=<raw-token>&email=other@example.com"
```
Expected both: `{"valid":false}`.

Confirm the verification row was NOT deleted:
```bash
psql "$DATABASE_URL" -c "select count(*) from verification where identifier = 'claim:<user-id>';"
```
Expected: `1`.

- [ ] **Step 6.3: Commit**

```bash
git add src/app/api/auth/claim/verify/route.ts
git commit -m "Add GET /api/auth/claim/verify for claim-page preflight"
```

---

## Task 7 — `POST /api/auth/claim/complete`

**Files:**
- Create: `src/app/api/auth/claim/complete/route.ts`

- [ ] **Step 7.1: Implement the endpoint**

Create `src/app/api/auth/claim/complete/route.ts`:

```ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { addressSchema } from "@/lib/address-gate";
import { consumeClaimToken, findValidClaimToken } from "@/lib/claim-tokens";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    email: z.string().email().max(254),
    token: z.string().min(32).max(128),
    password: z.string().min(6, "A jelszónak legalább 6 karakter hosszúnak kell lennie"),
  })
  .and(addressSchema);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" },
      { status: 400 },
    );
  }

  const { email, token, password, postalCode, city, streetAddress } = parsed.data;

  try {
    const userRow = await db.query.user.findFirst({
      where: eq(user.email, email.toLowerCase()),
      columns: { id: true, email: true },
    });
    if (!userRow) {
      return Response.json({ error: "Ez a link érvénytelen vagy lejárt" }, { status: 400 });
    }

    // Defensive re-check: still a ghost (no accounts)?
    const existingAccounts = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, userRow.id));
    if (existingAccounts.length > 0) {
      return Response.json({ error: "Ez a fiók már aktiválva van" }, { status: 400 });
    }

    const tokenRow = await findValidClaimToken(userRow.id, token);
    if (!tokenRow) {
      return Response.json({ error: "Ez a link érvénytelen vagy lejárt" }, { status: 400 });
    }

    // Hash the password via Better Auth's internal hasher (scrypt by default).
    const hash = await auth.$context.then((ctx) => ctx.password.hash(password));

    const now = new Date();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userRow.id,
      providerId: "credential",
      userId: userRow.id,
      password: hash,
      createdAt: now,
      updatedAt: now,
    });

    await db
      .update(user)
      .set({
        emailVerified: true,
        postalCode,
        city,
        streetAddress,
        updatedAt: now,
      })
      .where(eq(user.id, userRow.id));

    await consumeClaimToken(tokenRow.id);

    // Issue a session using the stock sign-in path so cookies match normal logins.
    const signInResult = await auth.api.signInEmail({
      body: { email: userRow.email, password },
      headers: await headers(),
      asResponse: true,
    });

    // Forward the Set-Cookie headers from Better Auth
    const response = Response.json({ ok: true });
    for (const [key, value] of signInResult.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append("set-cookie", value);
      }
    }
    return response;
  } catch (err) {
    console.error("[api/auth/claim/complete] Error:", err);
    return Response.json({ error: "Hiba történt. Próbálja újra." }, { status: 500 });
  }
}
```

**Note on `auth.$context`:** Better Auth exposes its internal password hasher at `auth.$context.password.hash()`. `$context` is a Promise in v1.4. If the `.then()` shape fails at runtime (older versions have it as a plain object), substitute `const ctx = await auth.$context; const hash = await ctx.password.hash(password);`.

- [ ] **Step 7.2: Verify with curl**

Use the same token from Task 5 (if still valid — if not, re-run Task 5 for a fresh one):

```bash
curl -i -X POST http://localhost:3000/api/auth/claim/complete \
  -H "Content-Type: application/json" \
  -d '{
    "email":"<ghost-email>",
    "token":"<raw-token>",
    "password":"test123",
    "postalCode":"1051",
    "city":"Budapest",
    "streetAddress":"Fő utca 1."
  }'
```
Expected: `HTTP/1.1 200 OK`, body `{"ok":true}`, and a `Set-Cookie: better-auth.session_token=...` header in the response.

Verify DB state:
```bash
psql "$DATABASE_URL" -c "select email, email_verified, postal_code, city, street_address from \"user\" where email = '<ghost-email>';"
psql "$DATABASE_URL" -c "select provider_id from account where user_id = (select id from \"user\" where email = '<ghost-email>');"
psql "$DATABASE_URL" -c "select count(*) from verification where identifier = 'claim:<user-id>';"
```
Expected:
- user row: `email_verified=t`, address populated
- account row: one row with `provider_id=credential`
- verification count: `0` (token consumed)

Replay the same request (token already consumed):
```bash
curl -i -X POST http://localhost:3000/api/auth/claim/complete -H "Content-Type: application/json" -d '<same body>'
```
Expected: `400`, body `{"error":"Ez a fiók már aktiválva van"}` (because account now exists) — or `{"error":"Ez a link érvénytelen vagy lejárt"}` if the defensive check ordering lets token-miss win.

- [ ] **Step 7.3: Commit**

```bash
git add src/app/api/auth/claim/complete/route.ts
git commit -m "Add POST /api/auth/claim/complete to activate ghost users"
```

---

## Task 8 — `/claim/complete` page

**Files:**
- Create: `src/app/claim/complete/page.tsx`

- [ ] **Step 8.1: Implement the page**

Create `src/app/claim/complete/page.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClaimCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }
    const q = new URLSearchParams({ token, email }).toString();
    fetch(`/api/auth/claim/verify?${q}`)
      .then((r) => r.json())
      .then((d) => setTokenValid(!!d.valid))
      .catch(() => setTokenValid(false))
      .finally(() => setVerifying(false));
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie");
      return;
    }
    if (password !== passwordConfirm) {
      setError("A két jelszó nem egyezik");
      return;
    }
    if (!/^\d{4}$/.test(postalCode)) {
      setError("Az irányítószám 4 számjegyből áll");
      return;
    }
    if (!city.trim() || !streetAddress.trim()) {
      setError("A település és cím megadása kötelező");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/claim/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          postalCode,
          city: city.trim(),
          streetAddress: streetAddress.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Hiba történt");
        return;
      }
      router.push("/");
    } catch {
      setError("Hiba történt. Próbálja újra.");
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center">Ellenőrzés…</div>;
  }

  if (!tokenValid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Érvénytelen link</h1>
        <p className="text-gray-600">
          Ez a link érvénytelen vagy lejárt. Kérjük, kérjen új aktiváló e-mailt a bejelentkezési oldalon.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Fiók aktiválása</h1>
      <p className="text-sm text-gray-600 mb-6">
        Állítson be jelszót és adja meg számlázási címét a fiók aktiválásához.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="claim-password" className="block text-sm font-medium text-gray-700 mb-1">
            Új jelszó
          </label>
          <input
            id="claim-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-password-confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Jelszó megerősítése
          </label>
          <input
            id="claim-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-postal" className="block text-sm font-medium text-gray-700 mb-1">
            Irányítószám
          </label>
          <input
            id="claim-postal"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
            autoComplete="postal-code"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-city" className="block text-sm font-medium text-gray-700 mb-1">
            Település
          </label>
          <input
            id="claim-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="claim-street" className="block text-sm font-medium text-gray-700 mb-1">
            Utca, házszám
          </label>
          <input
            id="claim-street"
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            autoComplete="street-address"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Folyamatban…" : "Fiók aktiválása"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 8.2: Manual browser test**

1. Generate a fresh claim link via Task 5's curl (for a ghost user).
2. Paste the link into a logged-out browser.
3. Expected: loading → form renders (no "invalid link" view).
4. Try submitting with an empty form → inline error.
5. Submit with valid values → redirected to `/`, you're logged in (check header avatar / session cookie).
6. Verify DB: user now has `email_verified=t`, address fields populated, and one `account` row with `provider_id=credential`.
7. Visit the same link again → "Érvénytelen link" page.

- [ ] **Step 8.3: Commit**

```bash
git add src/app/claim/complete/page.tsx
git commit -m "Add /claim/complete page for ghost-user account activation"
```

---

## Task 9 — Address-gate page + server helper

**Files:**
- Modify: `src/lib/address-gate.ts` (add `requireAddress()`)
- Create: `src/app/profil/cim/page.tsx`

- [ ] **Step 9.1: Add `requireAddress()` helper**

Append to `src/lib/address-gate.ts`:

```ts
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * For use in server components on authenticated pages.
 * If the session user has no postal_code, redirects to /profil/cim?next=<currentPath>.
 * If no session, returns null (caller decides whether to require login).
 */
export async function requireAddress(currentPath: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  const row = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { postalCode: true },
  });

  if (!row?.postalCode) {
    redirect(`/profil/cim?next=${encodeURIComponent(currentPath)}`);
  }
}
```

The existing zod-schema import at the top of the file stays; add the new imports at the top and the function at the bottom.

- [ ] **Step 9.2: Create the address-gate page**

Create `src/app/profil/cim/page.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AddressGatePage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{4}$/.test(postalCode)) {
      setError("Az irányítószám 4 számjegyből áll");
      return;
    }
    if (!city.trim() || !streetAddress.trim()) {
      setError("A település és cím megadása kötelező");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode,
          city: city.trim(),
          streetAddress: streetAddress.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Hiba történt");
        return;
      }
      router.push(next);
    } catch {
      setError("Hiba történt. Próbálja újra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Számlázási cím</h1>
      <p className="text-sm text-gray-600 mb-6">
        Az időpontfoglalás véglegesítéséhez kérjük, adja meg számlázási címét. Erre számlakiállítás miatt van szükség.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="addr-postal" className="block text-sm font-medium text-gray-700 mb-1">
            Irányítószám
          </label>
          <input
            id="addr-postal"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
            autoComplete="postal-code"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="addr-city" className="block text-sm font-medium text-gray-700 mb-1">
            Település
          </label>
          <input
            id="addr-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div>
          <label htmlFor="addr-street" className="block text-sm font-medium text-gray-700 mb-1">
            Utca, házszám
          </label>
          <input
            id="addr-street"
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            autoComplete="street-address"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Folyamatban…" : "Mentés"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 9.3: Gate the booking page**

Edit `src/app/idopontfoglalas/page.tsx`. After the existing imports, add:

```ts
import { requireAddress } from "@/lib/address-gate";
```

Inside `export default async function IdopontfoglalasPage()`, as the very first line of the function body (before the `Promise.all`), add:

```ts
  await requireAddress("/idopontfoglalas");
```

Rationale: the booking page is the only authenticated flow on this site. A user without a session is unaffected (the helper returns early). A user with a session but no address gets redirected to `/profil/cim?next=/idopontfoglalas`.

- [ ] **Step 9.4: Manual browser test**

1. Pick an existing credential user and clear their address:
   ```bash
   psql "$DATABASE_URL" -c "update \"user\" set postal_code=null, city=null, street_address=null where email='<test-email>';"
   ```
2. Sign in as that user, navigate to `/idopontfoglalas`.
3. Expected: redirected to `/profil/cim?next=%2Fidopontfoglalas`.
4. Submit bad input (e.g., postal code `abc`) → inline error.
5. Submit valid input → redirected to `/idopontfoglalas`, booking wizard renders.
6. Visit `/idopontfoglalas` again → no redirect.

- [ ] **Step 9.5: Commit**

```bash
git add src/lib/address-gate.ts src/app/profil/cim/page.tsx src/app/idopontfoglalas/page.tsx
git commit -m "Add address gate: /profil/cim page + requireAddress() guard on booking"
```

---

## Task 10 — `AuthStep.tsx` email-status branching + ghost claim screen

This is the UI heart of the feature. The existing component is ~407 lines and does tab-based belepes/regisztracio. We introduce a preflight step: on "submit" in the Belépés tab, we call `email-status` and render one of four states instead of blindly calling `signIn.email`.

**Files:**
- Modify: `src/components/auth/AuthStep.tsx` (significant rewrite of the belepes flow)

- [ ] **Step 10.1: Add preflight state and ghost-claim screen**

Below is the new structure. Keep all existing imports, the `GoogleIcon` component, the `AuthStepProps` interface, and the `ForgotPassword` + session-gated rendering. Rewrite the component body to introduce a sub-state `belepesStep: "email" | "password" | "ghost"`, where:

- `email` — show only the email input + Google button
- `password` — (status=credential) show the password field for the entered email
- `ghost` — show the claim screen (Google + "Send password-setup link")

Replace the entire component body (everything from `export default function AuthStep(...)` through the end of the file) with this. The `GoogleIcon` function and the `"use client"`/imports stay as they are at the top of the file:

```tsx
export default function AuthStep({ onSuccess, defaultTab = "belepes" }: AuthStepProps) {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [belepesStep, setBelepesStep] = useState<"email" | "password" | "ghost">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [claimEmailSent, setClaimEmailSent] = useState(false);

  useEffect(() => {
    if (!isPending && session) onSuccess();
  }, [session, isPending, onSuccess]);

  if (isPending) return null;
  if (session) return null;
  if (showForgotPassword) return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;

  function resetBelepes() {
    setBelepesStep("email");
    setPassword("");
    setClaimEmailSent(false);
    setErrors({});
    setGlobalError("");
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {};
    if (tab === "regisztracio") {
      if (!name.trim()) newErrors.name = "A név megadása kötelező";
      if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
        newErrors.phoneNumber = "A telefonszámnak legalább 10 számjegyből kell állnia";
      }
      if (!/^\d{4}$/.test(postalCode)) {
        newErrors.postalCode = "Az irányítószám 4 számjegyből áll";
      }
      if (!city.trim()) newErrors.city = "A település megadása kötelező";
      if (!streetAddress.trim()) newErrors.streetAddress = "A cím megadása kötelező";
    }
    if (!email.includes("@")) newErrors.email = "Érvénytelen e-mail cím";
    if (tab === "regisztracio" || belepesStep === "password") {
      if (password.length < 6) {
        newErrors.password = "A jelszónak legalább 6 karakter hosszúnak kell lennie";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function mapErrorMessage(error: unknown): string {
    let msg = "";
    if (error instanceof Error) msg = error.message;
    else if (typeof error === "string") msg = error;
    else if (error && typeof error === "object") {
      const obj = error as Record<string, unknown>;
      msg = String(obj.message ?? obj.code ?? obj.statusText ?? JSON.stringify(error));
    } else msg = String(error);
    msg = msg.toLowerCase();
    if (msg.includes("credential_account_not_found") || msg.includes("credential account not found")) {
      return 'Ehhez az e-mail címhez Google-fiókkal regisztrált. Kérjük, használja a „Folytatás Google-fiókkal” gombot.';
    }
    if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password") || msg.includes("incorrect")) {
      return "Hibás e-mail cím vagy jelszó";
    }
    if (msg.includes("already") || msg.includes("exists") || msg.includes("registered")) {
      return "Ez az e-mail cím már regisztrálva van";
    }
    if (msg.includes("rate") || msg.includes("429") || msg.includes("too many")) {
      return "Kérjük, várjon egy percet, majd próbálja újra";
    }
    if (msg.includes("weak") || msg.includes("short")) return "A jelszó túl gyenge";
    console.error("[AuthStep] Unhandled auth error:", error);
    return "Hiba történt, kérjük próbálja újra";
  }

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    const emailErr: FieldErrors = {};
    if (!email.includes("@")) {
      emailErr.email = "Érvénytelen e-mail cím";
      setErrors(emailErr);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(
        `/api/auth/email-status?email=${encodeURIComponent(email.toLowerCase())}`,
      );
      const data = await res.json();
      if (data.status === "new") {
        setTab("regisztracio");
        setLoading(false);
        return;
      }
      if (data.status === "oauth") {
        // Only Google is an option — kick off OAuth directly.
        await signIn.social({ provider: "google", callbackURL: "/idopontfoglalas" });
        return;
      }
      if (data.status === "ghost") {
        setBelepesStep("ghost");
        setLoading(false);
        return;
      }
      // credential
      setBelepesStep("password");
      setLoading(false);
    } catch {
      setGlobalError("Hiba történt, kérjük próbálja újra");
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signIn.email({
        email,
        password,
        rememberMe: true,
        callbackURL: "/idopontfoglalas",
      });
      if (result.error) {
        setGlobalError(mapErrorMessage(result.error));
        return;
      }
      onSuccess();
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisztracioSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/idopontfoglalas",
      });
      if (result?.data?.user?.id) {
        try {
          if (phoneNumber.trim()) {
            await fetch("/api/user/phone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
            });
          }
          await fetch("/api/user/address", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postalCode,
              city: city.trim(),
              streetAddress: streetAddress.trim(),
            }),
          });
        } catch (err) {
          console.error("[AuthStep] Post-signup profile save failed:", err);
        }
      }
      if (result.error) {
        setGlobalError(mapErrorMessage(result.error));
        return;
      }
      onSuccess();
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGlobalError("");
    setLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/idopontfoglalas" });
    } catch (err) {
      setGlobalError(mapErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleClaimStart() {
    setGlobalError("");
    setLoading(true);
    try {
      await fetch("/api/auth/claim/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      setClaimEmailSent(true);
    } catch {
      setGlobalError("Hiba történt, kérjük próbálja újra");
    } finally {
      setLoading(false);
    }
  }

  const inputCx = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
      hasError ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 px-4">
      <p className="text-center text-sm text-gray-600 mb-6 max-w-md">
        Az időpontfoglalás véglegesítéséhez kérjük, jelentkezzen be vagy hozzon létre egy fiókot.
      </p>

      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
        {/* Tab toggle */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => { setTab("belepes"); resetBelepes(); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "belepes" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Belépés
          </button>
          <button
            type="button"
            onClick={() => { setTab("regisztracio"); setErrors({}); setGlobalError(""); }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              tab === "regisztracio" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Regisztráció
          </button>
        </div>

        {/* Google OAuth button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <GoogleIcon />
          Folytatás Google-fiókkal
        </button>

        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">vagy</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {globalError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{globalError}</p>
          </div>
        )}

        {tab === "belepes" && belepesStep === "email" && (
          <form onSubmit={handleEmailContinue} noValidate className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail cím
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                autoComplete="email"
                className={inputCx(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Folyamatban..." : "Tovább"}
            </button>
          </form>
        )}

        {tab === "belepes" && belepesStep === "password" && (
          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
            <div className="text-sm text-gray-600">
              <span>{email}</span>{" "}
              <button type="button" onClick={resetBelepes} className="text-primary hover:underline">
                (változtatás)
              </button>
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">
                Jelszó
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={inputCx(!!errors.password)}
                autoFocus
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-primary hover:underline"
              >
                Elfelejtett jelszó?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Folyamatban..." : "Belépés"}
            </button>
          </form>
        )}

        {tab === "belepes" && belepesStep === "ghost" && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <span>{email}</span>{" "}
              <button type="button" onClick={resetBelepes} className="text-primary hover:underline">
                (változtatás)
              </button>
            </div>
            <p className="text-sm text-gray-700">
              Rendszerünkben szerepel egy foglalási fiók ezzel az e-mail címmel, de még nincs aktiválva.
              Válasszon az alábbi lehetőségek közül:
            </p>
            {claimEmailSent ? (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Elküldtük az aktiváló linket. Kérjük, ellenőrizze a postafiókját.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimStart}
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Folyamatban..." : "Aktiváló link kérése e-mailben"}
              </button>
            )}
          </div>
        )}

        {tab === "regisztracio" && (
          <form onSubmit={handleRegisztracioSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-gray-700 mb-1">Teljes név</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kovács János"
                autoComplete="name"
                className={inputCx(!!errors.name)}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="auth-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefonszám</label>
              <input
                id="auth-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+36 70 000 0000"
                autoComplete="tel"
                className={inputCx(!!errors.phoneNumber)}
              />
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
            </div>
            <div>
              <label htmlFor="auth-email-reg" className="block text-sm font-medium text-gray-700 mb-1">E-mail cím</label>
              <input
                id="auth-email-reg"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                autoComplete="email"
                className={inputCx(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="auth-password-reg" className="block text-sm font-medium text-gray-700 mb-1">Jelszó</label>
              <input
                id="auth-password-reg"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Legalább 6 karakter"
                autoComplete="new-password"
                className={inputCx(!!errors.password)}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="auth-postal" className="block text-sm font-medium text-gray-700 mb-1">Irányítószám</label>
              <input
                id="auth-postal"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                autoComplete="postal-code"
                className={inputCx(!!errors.postalCode)}
              />
              {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>}
            </div>
            <div>
              <label htmlFor="auth-city" className="block text-sm font-medium text-gray-700 mb-1">Település</label>
              <input
                id="auth-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                className={inputCx(!!errors.city)}
              />
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="auth-street" className="block text-sm font-medium text-gray-700 mb-1">Utca, házszám</label>
              <input
                id="auth-street"
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                autoComplete="street-address"
                className={inputCx(!!errors.streetAddress)}
              />
              {errors.streetAddress && <p className="mt-1 text-xs text-red-600">{errors.streetAddress}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Folyamatban..." : "Regisztráció"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

Also update the `FieldErrors` interface at the top of the file (line 14-19) to include the new fields:

```ts
interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  postalCode?: string;
  city?: string;
  streetAddress?: string;
}
```

- [ ] **Step 10.2: Manual browser test — all four branches**

Preconditions: `npm run dev` running. Have four test emails: one new, one ghost, one credential-only, one Google-only.

Flow A — **new**:
1. Go to `/idopontfoglalas`, start booking → reach AuthStep.
2. Enter the brand-new email → click Tovább.
3. Expected: tab switches to Regisztráció with email prefilled.

Flow B — **credential**:
1. Reset, click Belépés.
2. Enter the credential user's email → Tovább.
3. Expected: password field appears.
4. Enter the password → log in.

Flow C — **ghost**:
1. Reset, enter a ghost email → Tovább.
2. Expected: "Aktiváló link kérése" button.
3. Click it → green "Elküldtük az aktiváló linket" banner.
4. Check dev logs for the link → open it in another tab (Task 8 flow).

Flow D — **oauth** (Google-only user):
1. Reset, enter the Google-only user's email → Tovább.
2. Expected: Google OAuth popup/redirect fires immediately.

Flow E — **regisztracio with address**:
1. Click Regisztráció tab.
2. Fill all fields including address → submit.
3. Expected: account created, redirected to `/idopontfoglalas`, and DB has phone + address populated.

- [ ] **Step 10.3: Commit**

```bash
git add src/components/auth/AuthStep.tsx
git commit -m "Add email-status preflight + ghost claim + address fields to AuthStep"
```

---

## Task 11 — Rate limits for new auth endpoints

**Files:**
- Modify: `src/lib/auth.ts:69-78`

- [ ] **Step 11.1: Add custom rules**

In `src/lib/auth.ts`, replace the existing `rateLimit` block with:

```ts
  rateLimit: {
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/email-status": { window: 60, max: 10 },
      "/claim/start": { window: 600, max: 3 },
    },
  },
```

Note: Better Auth's custom-rules keys match the route path *under* its mount point. Our routes live under `/api/auth/email-status` and `/api/auth/claim/start` — they map to keys `/email-status` and `/claim/start` in customRules (same convention used by the existing `/sign-in/email` entry). If these paths aren't rate-limited at runtime (test by hammering the endpoint), fall back to an app-level rate limit wrapper: a simple in-memory Map keyed by `IP` with expiry, applied at the top of each route. Do not ship without at least one of the two layers active.

- [ ] **Step 11.2: Verify rate limiting (email-status)**

```bash
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "http://localhost:3000/api/auth/email-status?email=probe${i}@example.com"
done
```
Expected: first ~10 return `200`, subsequent requests return `429`.

If all 15 return `200`, the Better Auth rule key is wrong. Implement a fallback as described above. A minimal fallback:

```ts
// At top of src/app/api/auth/email-status/route.ts
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX = 10;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX) return false;
  entry.count++;
  return true;
}

// Inside GET, before the query parse:
const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
if (!rateLimit(ip)) return Response.json({ error: "Túl sok kérés" }, { status: 429 });
```

Apply the same pattern to `claim/start` with `WINDOW_MS = 600_000` and `MAX = 3` if needed.

- [ ] **Step 11.3: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/email-status/route.ts src/app/api/auth/claim/start/route.ts
git commit -m "Rate-limit email-status (10/min) and claim/start (3/10min)"
```

---

## Task 12 — Full end-to-end smoke test

Before deploying, walk through every scenario in one sitting with a clean browser session.

- [ ] **Step 12.1: Prepare test data**

```bash
psql "$DATABASE_URL" -c "
  select
    'ghost: ' || email from \"user\" where id not in (select user_id from account) limit 1
  union all select 'credential: ' || u.email from \"user\" u join account a on a.user_id = u.id where a.provider_id = 'credential' limit 1
  union all select 'oauth: ' || u.email from \"user\" u join account a on a.user_id = u.id where a.provider_id = 'google' and u.id not in (select user_id from account where provider_id = 'credential') limit 1;
"
```

Clear the address on one credential user to test the gate:
```bash
psql "$DATABASE_URL" -c "update \"user\" set postal_code=null, city=null, street_address=null where email='<credential-test-email>';"
```

- [ ] **Step 12.2: Walk each scenario in the browser**

In a fresh incognito window each time:

1. **Ghost → Google claim:** Enter ghost email → click Tovább → click "Folytatás Google-fiókkal" earlier on the page → Google OAuth → should land logged-in. Then `/idopontfoglalas` redirects to `/profil/cim` (no address yet). Fill address → back to booking. Verify: user has `account` row with `provider_id=google`, address filled.
2. **Ghost → password link:** Enter ghost email → Tovább → "Aktiváló link kérése" → open link → set password + address → land logged-in on `/`. Verify: `account` row with `provider_id=credential`, `email_verified=true`, address filled.
3. **Credential, address missing:** Sign in normally → booking page redirects to `/profil/cim` → fill → returns to booking. Verify address saved.
4. **New signup:** Go to booking → enter brand-new email → tab flips to Regisztráció → fill everything including address → account created, lands on booking. Verify user row has address + phone.
5. **OAuth-only existing user:** Enter that email → Tovább → immediately redirects to Google consent → logs in.
6. **Edge cases:**
   - Expired claim token: wait 61 minutes (or `update verification set expires_at=now() - interval '1 minute' where identifier like 'claim:%'`) → visit link → "Érvénytelen link" page.
   - Replay claim: use token twice → second attempt fails.
   - Email-status rate limit: 15 rapid curls → 429 after 10.

- [ ] **Step 12.3: Lint and typecheck**

```bash
cd /Users/igiffrekt-m4/projects/morocz
npx tsc --noEmit
npm run lint:biome
```
Expected: no errors. Fix anything that comes up before committing.

- [ ] **Step 12.4: Commit any cleanup**

If typecheck or lint required fixes:
```bash
git add -A
git commit -m "Fix lint/type issues in ghost-claim flow"
```

---

## Task 13 — Deploy

This project's deployment is "build locally, rsync to server" per memory. Confirm with the user before running — deployment is a shared-state action.

- [ ] **Step 13.1: Apply the migration against production DB**

**Check with the user before running.** Then:
```bash
# Using the production DATABASE_URL
set -a && source .env.production && set +a
npx drizzle-kit migrate
```
Expected: `0005_*.sql` applied against prod.

- [ ] **Step 13.2: Build and ship**

Follow the project's standard deployment procedure (see `memory/deployment_morocz.md`). After rsync, re-copy `.env.local` as per the memory.

- [ ] **Step 13.3: Production smoke test**

Hit prod `/idopontfoglalas` signed out → confirm AuthStep still renders. Hit `/api/auth/email-status?email=...` with a known prod ghost email → `{"status":"ghost"}`. Monitor server logs for 500s from the four new endpoints for ~24h.

---

## Open follow-ups (NOT in this plan)

- Source marker column (`source='import'`) on the user table to distinguish ghosts without relying on "no account row."
- One-time bulk outreach email to the 2741 ghosts announcing the claim flow if organic discovery is too low.
- Playwright-based E2E coverage of the four flows (A–D above).
