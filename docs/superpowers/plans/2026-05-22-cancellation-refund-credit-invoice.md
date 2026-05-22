# Cancellation Refund + Offsetting −10.000 Ft Invoice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a patient cancels a paid booking ≥48h before the appointment, refund the 10.000 Ft fee and issue a standalone −10.000 Ft AAM Számlázz.hu invoice that nets the original to zero.

**Architecture:** Cancel routes resolve refund eligibility (pure 48h policy fn) and call a Stripe refund helper. The Stripe `charge.refunded` webhook is the single place that issues the −10.000 Ft invoice via a self-contained Számlázz.hu Agent-API client, idempotent on the Stripe refund id, with a reception-email fallback if the invoice call fails.

**Tech Stack:** Next.js (App Router route handlers), TypeScript, Stripe SDK (`stripe@22`, apiVersion `2026-03-25.dahlia`), Sanity (write client), Drizzle (better-auth `user` table), Vitest, Biome.

**Spec:** `docs/superpowers/specs/2026-05-22-cancellation-refund-credit-invoice-design.md`

---

## File Structure

**Create:**
- `src/lib/refund/policy.ts` — pure `resolveRefund()` (48h rule)
- `src/lib/refund/policy.test.ts`
- `src/lib/refund/issue-refund.ts` — Stripe refund helper (idempotent)
- `src/lib/refund/issue-refund.test.ts`
- `src/lib/szamlazz/build-credit-invoice-xml.ts` — pure Agent XML builder
- `src/lib/szamlazz/build-credit-invoice-xml.test.ts`
- `src/lib/szamlazz/client.ts` — `issueCreditInvoice()` HTTP POST
- `src/lib/szamlazz/client.test.ts`
- `src/lib/refund/process-refund.ts` — webhook orchestration (lookup → invoice → persist → fallback email)
- `src/lib/refund/process-refund.test.ts`

**Modify:**
- `src/sanity/schemaTypes/bookingType.ts` — add 4 fields
- `src/lib/booking-email.ts` — add `buildInvoiceFailedEmail()`
- `src/app/api/webhooks/stripe/route.ts` — add `charge.refunded` case
- `src/app/api/booking-cancel/route.ts` — 48h, remove block, `confirmNoRefund`, refund
- `src/app/api/admin/booking-cancel/route.ts` — optional `refund` flag
- `src/components/management/CancelDialog.tsx` — two-step UI
- `src/components/admin/AdminCancelModal.tsx` — refund checkbox
- `.env.local` (+ document `SZAMLA_AGENT_KEY`)

**Cross-repo (separate):**
- `mission` repo (192.168.1.101) → `scripts/seed/modules-catalog.ts` — catalog row only

---

## Task 1: Sanity schema fields

**Files:**
- Modify: `src/sanity/schemaTypes/bookingType.ts`

- [ ] **Step 1: Add the four fields**

Insert after the `paymentAmount` field (currently `bookingType.ts:116-121`), before `createdAt`:

```typescript
    defineField({
      name: "refundStatus",
      title: "Visszatérítés státusza",
      type: "string",
      options: {
        list: [
          { title: "Nincs", value: "none" },
          { title: "Visszatérítve", value: "refunded" },
          { title: "Nincs visszatérítés", value: "no_refund" },
          { title: "Számla hiba", value: "invoice_failed" },
        ],
      },
      initialValue: "none",
      readOnly: true,
    }),
    defineField({
      name: "stripeRefundId",
      title: "Stripe Refund ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "creditInvoiceNumber",
      title: "Helyesbítő számla száma",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "creditInvoiceIssuedAt",
      title: "Helyesbítő számla kiállítva",
      type: "datetime",
      readOnly: true,
    }),
```

- [ ] **Step 2: Regenerate Sanity types**

Run: `npm run typegen`
Expected: completes without error; `sanity.types.ts` updated.

- [ ] **Step 3: Verify build typechecks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/bookingType.ts sanity.types.ts
git commit -m "feat(booking): add refund/credit-invoice schema fields"
```

---

## Task 2: Refund policy (pure function)

**Files:**
- Create: `src/lib/refund/policy.ts`
- Test: `src/lib/refund/policy.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { resolveRefund } from "./policy";

const apptIn = (hoursFromNow: number) => {
  const d = new Date(Date.now() + hoursFromNow * 3600_000);
  const slotDate = d.toISOString().slice(0, 10);
  const slotTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { slotDate, slotTime };
};

describe("resolveRefund", () => {
  it("refunds when paid and >48h before appointment", () => {
    const r = resolveRefund({ ...apptIn(72), paymentStatus: "paid", confirmNoRefund: false });
    expect(r).toEqual({ eligible: true, requiresConfirmation: false, reason: "ok" });
  });

  it("treats exactly 48h as eligible (>=48h)", () => {
    const r = resolveRefund({ ...apptIn(48), paymentStatus: "paid", confirmNoRefund: false });
    expect(r.eligible).toBe(true);
  });

  it("within 48h requires confirmation and gives no refund", () => {
    const r = resolveRefund({ ...apptIn(10), paymentStatus: "paid", confirmNoRefund: false });
    expect(r).toEqual({ eligible: false, requiresConfirmation: true, reason: "within_window" });
  });

  it("within 48h with confirmNoRefund proceeds without refund, no confirmation needed", () => {
    const r = resolveRefund({ ...apptIn(10), paymentStatus: "paid", confirmNoRefund: true });
    expect(r).toEqual({ eligible: false, requiresConfirmation: false, reason: "within_window" });
  });

  it("unpaid booking never needs refund or confirmation", () => {
    const r = resolveRefund({ ...apptIn(72), paymentStatus: "pending", confirmNoRefund: false });
    expect(r).toEqual({ eligible: false, requiresConfirmation: false, reason: "not_paid" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/refund/policy.test.ts`
Expected: FAIL — "resolveRefund is not a function" / module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
export const REFUND_WINDOW_HOURS = 48;

export interface ResolveRefundInput {
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // HH:MM
  paymentStatus: string; // "paid" | "pending" | "failed"
  confirmNoRefund: boolean;
  now?: Date;
}

export interface RefundDecision {
  eligible: boolean;
  requiresConfirmation: boolean;
  reason: "ok" | "within_window" | "not_paid";
}

function hoursUntilAppointment(slotDate: string, slotTime: string, now: Date): number {
  const [h, m] = slotTime.split(":").map(Number);
  const appt = new Date(
    `${slotDate}T${String(h ?? 0).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}:00`,
  );
  return (appt.getTime() - now.getTime()) / 3600_000;
}

export function resolveRefund(input: ResolveRefundInput): RefundDecision {
  const now = input.now ?? new Date();

  if (input.paymentStatus !== "paid") {
    return { eligible: false, requiresConfirmation: false, reason: "not_paid" };
  }

  const hours = hoursUntilAppointment(input.slotDate, input.slotTime, now);
  if (hours >= REFUND_WINDOW_HOURS) {
    return { eligible: true, requiresConfirmation: false, reason: "ok" };
  }

  return {
    eligible: false,
    requiresConfirmation: !input.confirmNoRefund,
    reason: "within_window",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/refund/policy.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/refund/policy.ts src/lib/refund/policy.test.ts
git commit -m "feat(refund): add resolveRefund 48h policy"
```

---

## Task 3: Stripe refund helper (idempotent)

**Files:**
- Create: `src/lib/refund/issue-refund.ts`
- Test: `src/lib/refund/issue-refund.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

const create = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: { refunds: { create } },
  BOOKING_FEE_HUF: 10_000,
}));

import { issueRefund } from "./issue-refund";

describe("issueRefund", () => {
  beforeEach(() => create.mockReset());

  it("creates a Stripe refund with the booking id as idempotency key", async () => {
    create.mockResolvedValue({ id: "re_123" });
    const result = await issueRefund({ paymentIntentId: "pi_1", bookingId: "booking-9" });
    expect(create).toHaveBeenCalledWith(
      { payment_intent: "pi_1" },
      { idempotencyKey: "refund-booking-9" },
    );
    expect(result).toEqual({ refundId: "re_123" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/refund/issue-refund.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { stripe } from "@/lib/stripe";

export interface IssueRefundInput {
  paymentIntentId: string;
  bookingId: string;
}

export async function issueRefund({
  paymentIntentId,
  bookingId,
}: IssueRefundInput): Promise<{ refundId: string }> {
  const refund = await stripe.refunds.create(
    { payment_intent: paymentIntentId },
    { idempotencyKey: `refund-${bookingId}` },
  );
  return { refundId: refund.id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/refund/issue-refund.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/refund/issue-refund.ts src/lib/refund/issue-refund.test.ts
git commit -m "feat(refund): add idempotent Stripe refund helper"
```

---

## Task 4: Számlázz.hu Agent XML builder (pure)

**Files:**
- Create: `src/lib/szamlazz/build-credit-invoice-xml.ts`
- Test: `src/lib/szamlazz/build-credit-invoice-xml.test.ts`

> Builds the `xmlszamla` Agent request for a standalone negative invoice: one line item,
> qty 1, net = gross = `-amountHuf`, VAT code `AAM`, currency HUF, language hu. The Agent Key
> goes in `<beallitasok><szamlaagentkulcs>`. Seller data is taken from the Számlázz.hu account
> config, so no `<elado>` block is sent.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { buildCreditInvoiceXml } from "./build-credit-invoice-xml";

const buyer = {
  name: "Teszt Páciens",
  zip: "2500",
  city: "Esztergom",
  address: "Fő utca 1.",
  email: "teszt@example.com",
};

describe("buildCreditInvoiceXml", () => {
  it("includes the agent key, AAM vat code and negative amounts", () => {
    const xml = buildCreditInvoiceXml({ agentKey: "AGENT-KEY", amountHuf: 10_000, buyer });
    expect(xml).toContain("<szamlaagentkulcs>AGENT-KEY</szamlaagentkulcs>");
    expect(xml).toContain("<penznem>HUF</penznem>");
    expect(xml).toContain("<afakulcs>AAM</afakulcs>");
    expect(xml).toContain("<nettoEgysegar>-10000</nettoEgysegar>");
    expect(xml).toContain("<nettoErtek>-10000</nettoErtek>");
    expect(xml).toContain("<afaErtek>0</afaErtek>");
    expect(xml).toContain("<bruttoErtek>-10000</bruttoErtek>");
    expect(xml).toContain("<mennyiseg>1</mennyiseg>");
  });

  it("escapes XML special characters in buyer fields", () => {
    const xml = buildCreditInvoiceXml({
      agentKey: "K",
      amountHuf: 10_000,
      buyer: { ...buyer, name: "Tom & <Co>" },
    });
    expect(xml).toContain("<nev>Tom &amp; &lt;Co&gt;</nev>");
    expect(xml).not.toContain("Tom & <Co>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/szamlazz/build-credit-invoice-xml.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
export interface CreditInvoiceBuyer {
  name: string;
  zip: string;
  city: string;
  address: string;
  email: string;
}

export interface BuildCreditInvoiceXmlInput {
  agentKey: string;
  amountHuf: number; // positive magnitude; rendered negative on the invoice
  buyer: CreditInvoiceBuyer;
  now?: Date;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildCreditInvoiceXml({
  agentKey,
  amountHuf,
  buyer,
  now,
}: BuildCreditInvoiceXmlInput): string {
  const today = (now ?? new Date()).toISOString().slice(0, 10);
  const neg = -Math.abs(amountHuf);

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/xmlszamla https://www.szamlazz.hu/szamla/docs/xsds/agent/xmlszamla.xsd">
  <beallitasok>
    <szamlaagentkulcs>${esc(agentKey)}</szamlaagentkulcs>
    <eszamla>true</eszamla>
    <szamlaLetoltes>false</szamlaLetoltes>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${today}</teljesitesDatum>
    <fizetesiHataridoDatum>${today}</fizetesiHataridoDatum>
    <fizmod>bankkártya</fizmod>
    <penznem>HUF</penznem>
    <szamlaNyelve>hu</szamlaNyelve>
    <megjegyzes>Foglalási díj visszatérítése</megjegyzes>
  </fejlec>
  <elado></elado>
  <vevo>
    <nev>${esc(buyer.name)}</nev>
    <irsz>${esc(buyer.zip)}</irsz>
    <telepules>${esc(buyer.city)}</telepules>
    <cim>${esc(buyer.address)}</cim>
    <email>${esc(buyer.email)}</email>
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>Foglalási díj jóváírása</megnevezes>
      <mennyiseg>1</mennyiseg>
      <mennyisegiEgyseg>db</mennyisegiEgyseg>
      <nettoEgysegar>${neg}</nettoEgysegar>
      <afakulcs>AAM</afakulcs>
      <nettoErtek>${neg}</nettoErtek>
      <afaErtek>0</afaErtek>
      <bruttoErtek>${neg}</bruttoErtek>
    </tetel>
  </tetelek>
</xmlszamla>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/szamlazz/build-credit-invoice-xml.test.ts`
Expected: PASS.

> **Implementation note to resolve during Task 5 first live call:** confirm Számlázz.hu accepts
> negative `nettoEgysegar`/`nettoErtek`/`bruttoErtek` on a normal invoice. If it rejects them,
> switch to `<mennyiseg>-1</mennyiseg>` with positive unit price (negative quantity) and keep
> values consistent. Update this builder + its test accordingly.

- [ ] **Step 5: Commit**

```bash
git add src/lib/szamlazz/build-credit-invoice-xml.ts src/lib/szamlazz/build-credit-invoice-xml.test.ts
git commit -m "feat(szamlazz): add credit-invoice Agent XML builder"
```

---

## Task 5: Számlázz.hu client (HTTP POST)

**Files:**
- Create: `src/lib/szamlazz/client.ts`
- Test: `src/lib/szamlazz/client.test.ts`

> Számlázz.hu Agent API expects a `multipart/form-data` POST to `https://www.szamlazz.hu/szamla/`
> with the XML in a file field named `action-xmlagentxmlfile`. On success it returns header
> `szlahu_szamlaszam` (the invoice number) and `szlahu_error_code: 0`. On failure
> `szlahu_error_code` is non-zero and `szlahu_error_message` carries the reason.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { issueCreditInvoice, SzamlazzError } from "./client";

const buyer = { name: "Teszt", zip: "2500", city: "Esztergom", address: "Fő u. 1.", email: "t@e.hu" };

describe("issueCreditInvoice", () => {
  beforeEach(() => { process.env.SZAMLA_AGENT_KEY = "KEY"; });
  afterEach(() => { vi.restoreAllMocks(); delete process.env.SZAMLA_AGENT_KEY; });

  it("returns the invoice number on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<xmlszamlavalasz><sikeres>true</sikeres></xmlszamlavalasz>", {
        status: 200,
        headers: { szlahu_error_code: "0", szlahu_szamlaszam: "E-CR-2026-1" },
      }),
    );
    const result = await issueCreditInvoice({ amountHuf: 10_000, buyer });
    expect(result).toEqual({ invoiceNumber: "E-CR-2026-1" });
  });

  it("throws SzamlazzError on a non-zero error code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<xmlszamlavalasz><hibakod>3</hibakod></xmlszamlavalasz>", {
        status: 200,
        headers: { szlahu_error_code: "3", szlahu_error_message: "Hibás agent kulcs" },
      }),
    );
    await expect(issueCreditInvoice({ amountHuf: 10_000, buyer })).rejects.toBeInstanceOf(SzamlazzError);
  });

  it("throws when SZAMLA_AGENT_KEY is missing", async () => {
    delete process.env.SZAMLA_AGENT_KEY;
    await expect(issueCreditInvoice({ amountHuf: 10_000, buyer })).rejects.toThrow(/SZAMLA_AGENT_KEY/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/szamlazz/client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { buildCreditInvoiceXml, type CreditInvoiceBuyer } from "./build-credit-invoice-xml";

const SZAMLAZZ_ENDPOINT = "https://www.szamlazz.hu/szamla/";

export class SzamlazzError extends Error {
  constructor(
    message: string,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "SzamlazzError";
  }
}

export interface IssueCreditInvoiceInput {
  amountHuf: number;
  buyer: CreditInvoiceBuyer;
}

export async function issueCreditInvoice({
  amountHuf,
  buyer,
}: IssueCreditInvoiceInput): Promise<{ invoiceNumber: string }> {
  const agentKey = process.env.SZAMLA_AGENT_KEY;
  if (!agentKey) {
    throw new SzamlazzError("SZAMLA_AGENT_KEY is not configured", null);
  }

  const xml = buildCreditInvoiceXml({ agentKey, amountHuf, buyer });

  const form = new FormData();
  form.append(
    "action-xmlagentxmlfile",
    new Blob([xml], { type: "application/xml" }),
    "szamla.xml",
  );

  const res = await fetch(SZAMLAZZ_ENDPOINT, { method: "POST", body: form });

  const errorCode = res.headers.get("szlahu_error_code");
  const invoiceNumber = res.headers.get("szlahu_szamlaszam");

  if (!res.ok || (errorCode && errorCode !== "0") || !invoiceNumber) {
    const message =
      res.headers.get("szlahu_error_message") ??
      `Számlázz.hu request failed (HTTP ${res.status})`;
    throw new SzamlazzError(message, errorCode);
  }

  return { invoiceNumber };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/szamlazz/client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/szamlazz/client.ts src/lib/szamlazz/client.test.ts
git commit -m "feat(szamlazz): add Agent-API credit invoice client"
```

---

## Task 6: "Invoice failed" reception email builder

**Files:**
- Modify: `src/lib/booking-email.ts`

- [ ] **Step 1: Add the builder**

Append to `src/lib/booking-email.ts`:

```typescript
export function buildInvoiceFailedEmail({ patientName }: { patientName: string }): string {
  return `<!DOCTYPE html>
<html lang="hu">
  <body style="font-family: Arial, sans-serif; color: #1A1D2D; line-height: 1.6;">
    <p>Tisztelt Recepció,</p>
    <p>
      ${patientName} páciens részére visszatérítettük a 10.000 Ft-os foglalási díjat,
      azonban az erről szóló helyesbítő számla rendszerhiba miatt meghiúsult.
      Kérjük, állítsa ki manuálisan a számlát a Számlázz.hu rendszerében.
    </p>
  </body>
</html>`;
}

export const INVOICE_FAILED_SUBJECT = "A helyesbítő számla kiállítása meghiúsult";
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/booking-email.ts
git commit -m "feat(email): add invoice-failed reception email builder"
```

---

## Task 7: Refund webhook orchestration

**Files:**
- Create: `src/lib/refund/process-refund.ts`
- Test: `src/lib/refund/process-refund.test.ts`

> This holds the logic the webhook runs for a `charge.refunded` event, with its dependencies
> injected so it is unit-testable: find booking by payment intent, idempotency-guard on the
> refund id, resolve buyer address, issue the credit invoice, persist the result, and on
> failure send the reception email. The route (Task 8 wiring) supplies the real dependencies.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { processRefund, type ProcessRefundDeps } from "./process-refund";

function makeDeps(overrides: Partial<ProcessRefundDeps> = {}): ProcessRefundDeps {
  return {
    findBooking: vi.fn().mockResolvedValue({
      _id: "booking-1",
      patientName: "Teszt Páciens",
      patientEmail: "t@e.hu",
      stripeRefundId: null,
    }),
    getBuyerAddress: vi.fn().mockResolvedValue({ zip: "2500", city: "Esztergom", address: "Fő u. 1." }),
    issueCreditInvoice: vi.fn().mockResolvedValue({ invoiceNumber: "E-CR-1" }),
    patchBooking: vi.fn().mockResolvedValue(undefined),
    sendInvoiceFailedEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const charge = {
  paymentIntentId: "pi_1",
  refundId: "re_1",
  billingName: "Teszt Páciens",
  billingAddress: { zip: null, city: null, address: null },
};

describe("processRefund", () => {
  beforeEach(() => vi.clearAllMocks());

  it("issues the credit invoice and records it on the booking", async () => {
    const deps = makeDeps();
    await processRefund(charge, deps);
    expect(deps.issueCreditInvoice).toHaveBeenCalledWith({
      amountHuf: 10_000,
      buyer: { name: "Teszt Páciens", zip: "2500", city: "Esztergom", address: "Fő u. 1.", email: "t@e.hu" },
    });
    expect(deps.patchBooking).toHaveBeenCalledWith("booking-1", expect.objectContaining({
      refundStatus: "refunded",
      stripeRefundId: "re_1",
      creditInvoiceNumber: "E-CR-1",
    }));
    expect(deps.sendInvoiceFailedEmail).not.toHaveBeenCalled();
  });

  it("is a no-op when the refund id is already recorded (idempotent)", async () => {
    const deps = makeDeps({
      findBooking: vi.fn().mockResolvedValue({ _id: "booking-1", patientName: "X", patientEmail: "t@e.hu", stripeRefundId: "re_1" }),
    });
    await processRefund(charge, deps);
    expect(deps.issueCreditInvoice).not.toHaveBeenCalled();
    expect(deps.patchBooking).not.toHaveBeenCalled();
  });

  it("does nothing when no booking matches the payment intent", async () => {
    const deps = makeDeps({ findBooking: vi.fn().mockResolvedValue(null) });
    await processRefund(charge, deps);
    expect(deps.issueCreditInvoice).not.toHaveBeenCalled();
  });

  it("falls back to email + invoice_failed when issuing the invoice throws", async () => {
    const deps = makeDeps({ issueCreditInvoice: vi.fn().mockRejectedValue(new Error("boom")) });
    await processRefund(charge, deps);
    expect(deps.patchBooking).toHaveBeenCalledWith("booking-1", { refundStatus: "invoice_failed", stripeRefundId: "re_1" });
    expect(deps.sendInvoiceFailedEmail).toHaveBeenCalledWith({ patientName: "Teszt Páciens" });
  });

  it("prefers Stripe billing address when the user record has none", async () => {
    const deps = makeDeps({ getBuyerAddress: vi.fn().mockResolvedValue(null) });
    const chargeWithAddr = { ...charge, billingAddress: { zip: "1011", city: "Budapest", address: "Vár u. 2." } };
    await processRefund(chargeWithAddr, deps);
    expect(deps.issueCreditInvoice).toHaveBeenCalledWith(expect.objectContaining({
      buyer: expect.objectContaining({ zip: "1011", city: "Budapest", address: "Vár u. 2." }),
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/refund/process-refund.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { BOOKING_FEE_HUF } from "@/lib/stripe";

export interface RefundCharge {
  paymentIntentId: string;
  refundId: string;
  billingName: string | null;
  billingAddress: { zip: string | null; city: string | null; address: string | null };
}

export interface RefundBooking {
  _id: string;
  patientName: string;
  patientEmail: string;
  stripeRefundId: string | null;
}

export interface ProcessRefundDeps {
  findBooking: (paymentIntentId: string) => Promise<RefundBooking | null>;
  getBuyerAddress: (
    email: string,
  ) => Promise<{ zip: string | null; city: string | null; address: string | null } | null>;
  issueCreditInvoice: (input: {
    amountHuf: number;
    buyer: { name: string; zip: string; city: string; address: string; email: string };
  }) => Promise<{ invoiceNumber: string }>;
  patchBooking: (bookingId: string, fields: Record<string, unknown>) => Promise<void>;
  sendInvoiceFailedEmail: (input: { patientName: string }) => Promise<void>;
}

export async function processRefund(charge: RefundCharge, deps: ProcessRefundDeps): Promise<void> {
  const booking = await deps.findBooking(charge.paymentIntentId);
  if (!booking) {
    console.warn(`[process-refund] No booking for payment intent ${charge.paymentIntentId}`);
    return;
  }
  if (booking.stripeRefundId === charge.refundId) {
    console.log(`[process-refund] Refund ${charge.refundId} already processed for ${booking._id}`);
    return;
  }

  const userAddr = await deps.getBuyerAddress(booking.patientEmail);
  const zip = userAddr?.zip ?? charge.billingAddress.zip ?? "";
  const city = userAddr?.city ?? charge.billingAddress.city ?? "";
  const address = userAddr?.address ?? charge.billingAddress.address ?? "";

  try {
    const { invoiceNumber } = await deps.issueCreditInvoice({
      amountHuf: BOOKING_FEE_HUF,
      buyer: {
        name: charge.billingName ?? booking.patientName,
        zip,
        city,
        address,
        email: booking.patientEmail,
      },
    });

    await deps.patchBooking(booking._id, {
      refundStatus: "refunded",
      stripeRefundId: charge.refundId,
      creditInvoiceNumber: invoiceNumber,
      creditInvoiceIssuedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[process-refund] Credit invoice failed for ${booking._id}:`, err);
    await deps.patchBooking(booking._id, {
      refundStatus: "invoice_failed",
      stripeRefundId: charge.refundId,
    });
    await deps.sendInvoiceFailedEmail({ patientName: booking.patientName });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/refund/process-refund.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/refund/process-refund.ts src/lib/refund/process-refund.test.ts
git commit -m "feat(refund): add testable refund-webhook orchestration"
```

---

## Task 8: Wire `charge.refunded` into the Stripe webhook

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add imports**

At the top of the file, alongside the existing imports, add:

```typescript
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { buildInvoiceFailedEmail, INVOICE_FAILED_SUBJECT } from "@/lib/booking-email";
import { issueCreditInvoice } from "@/lib/szamlazz/client";
import { processRefund } from "@/lib/refund/process-refund";
```

(`sendEmail` / `isEmailConfigured` may already be imported — do not duplicate.)

- [ ] **Step 2: Add the handler block**

Insert after the `checkout.session.expired` block (`route.ts:167`), before the final `return Response.json({ received: true })`:

```typescript
  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : (charge.payment_intent?.id ?? null);
    const latestRefund = charge.refunds?.data?.[0];

    if (paymentIntentId && latestRefund) {
      const RECEPTION_EMAIL = "recepcio@drmoroczangela.hu";
      await processRefund(
        {
          paymentIntentId,
          refundId: latestRefund.id,
          billingName: charge.billing_details?.name ?? null,
          billingAddress: {
            zip: charge.billing_details?.address?.postal_code ?? null,
            city: charge.billing_details?.address?.city ?? null,
            address: charge.billing_details?.address?.line1 ?? null,
          },
        },
        {
          findBooking: (pi) =>
            getWriteClient().fetch(
              `*[_type == "booking" && stripePaymentIntentId == $pi][0]{
                _id, patientName, patientEmail, stripeRefundId
              }`,
              { pi },
            ),
          getBuyerAddress: async (email) => {
            const row = await db.query.user.findFirst({
              where: eq(sql`lower(${user.email})`, email.toLowerCase()),
              columns: { postalCode: true, city: true, streetAddress: true },
            });
            return row
              ? { zip: row.postalCode, city: row.city, address: row.streetAddress }
              : null;
          },
          issueCreditInvoice,
          patchBooking: async (bookingId, fields) => {
            await getWriteClient().patch(bookingId).set(fields).commit();
          },
          sendInvoiceFailedEmail: async ({ patientName }) => {
            if (!isEmailConfigured()) return;
            await sendEmail({
              to: RECEPTION_EMAIL,
              subject: INVOICE_FAILED_SUBJECT,
              html: buildInvoiceFailedEmail({ patientName }),
            });
          },
        },
      );
    }
  }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If Stripe complains `refunds` may be undefined on Charge, the optional chaining above handles it at runtime; ensure the `latestRefund` guard remains.

- [ ] **Step 4: Manual verification with Stripe CLI (test mode)**

Run (in two terminals):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# create a test booking + pay it, then in Stripe dashboard (test) refund the payment,
# OR trigger a synthetic event:
stripe trigger charge.refunded
```
Expected: server logs show `[process-refund]` running; with a real matching booking, the booking gets `refundStatus: "refunded"` and a `creditInvoiceNumber` in Sanity. `stripe trigger` (no matching booking) logs the "No booking for payment intent" warning and does not error.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(webhook): issue credit invoice on charge.refunded"
```

---

## Task 9: Patient cancel route — 48h policy + refund

**Files:**
- Modify: `src/app/api/booking-cancel/route.ts`

- [ ] **Step 1: Replace the schema and the window helper**

Replace `CancelSchema` (`route.ts:15-17`) with:

```typescript
const CancelSchema = z.object({
  token: z.string().min(1, "Token megadása kötelező."),
  confirmNoRefund: z.boolean().optional().default(false),
});
```

Delete the `isWithin24Hours` helper (`route.ts:19-26`) and add this import near the top:

```typescript
import { resolveRefund } from "@/lib/refund/policy";
import { issueRefund } from "@/lib/refund/issue-refund";
```

- [ ] **Step 2: Extend the booking query and destructure**

In the GROQ projection (`route.ts:64-67`) add `paymentStatus, stripePaymentIntentId` to the selected fields, and add them to the `BookingForCancel` type:

```typescript
      slotDate, slotTime, status, managementToken, googleCalendarEventId,
      paymentStatus, stripePaymentIntentId
```

```typescript
    type BookingForCancel = {
      // ...existing fields...
      paymentStatus?: string | null;
      stripePaymentIntentId?: string | null;
    };
```

Also pull `confirmNoRefund` from parsed data: replace `const { token } = parsed.data;` with
`const { token, confirmNoRefund } = parsed.data;`

- [ ] **Step 3: Replace the hard 24h block with the refund decision**

Replace the entire block at `route.ts:75-84` (the `if (isWithin24Hours(...))` 403 response) with:

```typescript
    // ── 3. Resolve refund eligibility (48h policy) ─────────────────────────────
    const decision = resolveRefund({
      slotDate: booking.slotDate,
      slotTime: booking.slotTime,
      paymentStatus: booking.paymentStatus ?? "pending",
      confirmNoRefund,
    });

    if (decision.requiresConfirmation) {
      return Response.json(
        {
          requiresConfirmation: true,
          warning:
            "Kedves Páciensünk! 48 órán belüli lemondás esetén a 10.000 Ft-os foglalási díj NEM kerül visszatérítésre. Amennyiben ennek tudatában is le kívánja mondani az időpontot, kérjük kattintson a gombra.",
        },
        { status: 409 },
      );
    }
```

- [ ] **Step 4: Issue the refund after status is set to cancelled**

Immediately after the existing status patch (`route.ts:87`,
`await getWriteClient().patch(booking._id).set({ status: "cancelled" }).commit();`), add:

```typescript
    // ── 4a. Refund (the credit invoice is issued by the Stripe webhook) ────────
    if (decision.eligible && booking.stripePaymentIntentId) {
      try {
        await issueRefund({
          paymentIntentId: booking.stripePaymentIntentId,
          bookingId: booking._id,
        });
      } catch (refundErr) {
        console.error("[booking-cancel] Refund failed:", refundErr);
      }
    } else if (decision.reason === "within_window") {
      await getWriteClient().patch(booking._id).set({ refundStatus: "no_refund" }).commit();
    }
```

- [ ] **Step 5: Typecheck + run the policy tests still pass**

Run: `npx tsc --noEmit && npx vitest run src/lib/refund`
Expected: no type errors; refund tests PASS.

- [ ] **Step 6: Manual verification**

Start dev server + Stripe CLI listener. Create and pay a booking with an appointment >48h out,
then cancel it from the management page. Expected: booking `status: cancelled`, a Stripe refund
appears in the dashboard, and the webhook issues the credit invoice. Repeat with a booking <48h
out: first cancel attempt returns the warning (409); confirming issues no refund and sets
`refundStatus: no_refund`.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/booking-cancel/route.ts
git commit -m "feat(cancel): 48h refund policy on patient cancellation"
```

---

## Task 10: Admin cancel route — optional refund flag

**Files:**
- Modify: `src/app/api/admin/booking-cancel/route.ts`

- [ ] **Step 1: Extend schema + imports**

Replace `AdminCancelSchema` (`route.ts:11-14`) with:

```typescript
const AdminCancelSchema = z.object({
  bookingId: z.string().min(1, "A foglalás azonosítója megadása kötelező."),
  reason: z.string().optional(),
  refund: z.boolean().optional().default(false),
});
```

Delete the unused `isWithin24Hours` helper (`route.ts:16-23`) and add:

```typescript
import { issueRefund } from "@/lib/refund/issue-refund";
```

- [ ] **Step 2: Select payment fields**

In the GROQ projection (`route.ts:71-74`) add `paymentStatus, stripePaymentIntentId`, and add
them to `BookingForAdminCancel` as optional `string | null`. Destructure `refund`:
replace `const { bookingId, reason } = parsed.data;` with
`const { bookingId, reason, refund } = parsed.data;`

- [ ] **Step 3: Issue refund when requested**

After the status patch (`route.ts:91`), add:

```typescript
    // ── Refund if the admin opted in (credit invoice issued by the webhook) ────
    if (refund && booking.paymentStatus === "paid" && booking.stripePaymentIntentId) {
      try {
        await issueRefund({
          paymentIntentId: booking.stripePaymentIntentId,
          bookingId: booking._id,
        });
      } catch (refundErr) {
        console.error("[admin/booking-cancel] Refund failed:", refundErr);
      }
    }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/booking-cancel/route.ts
git commit -m "feat(admin-cancel): optional refund on admin cancellation"
```

---

## Task 11: CancelDialog two-step UI

**Files:**
- Modify: `src/components/management/CancelDialog.tsx`

- [ ] **Step 1: Extend props with payment info**

Add `paymentStatus` to the `booking` prop type (`CancelDialog.tsx:6-13`):

```typescript
  booking: {
    _id: string;
    patientName: string;
    service: { name: string; appointmentDuration: number } | null;
    slotDate: string;
    slotTime: string;
    managementToken: string;
    paymentStatus?: string | null;
  };
```

> The caller `src/components/management/BookingManagementCard.tsx:212` already spreads the whole
> `booking` object into `<CancelDialog booking={booking} ... />`, so no prop wiring is needed there —
> but ensure the page-level GROQ query that loads the booking for the management page selects
> `paymentStatus` (search the `/foglalas/[token]` page query and add `paymentStatus` if missing),
> and add `paymentStatus?: string | null` to that card's `booking` type.

- [ ] **Step 2: Compute the window + show the right notice**

Add near the top of the component body (after `formattedDate`):

```typescript
  const hoursUntil =
    (new Date(`${booking.slotDate}T${booking.slotTime}:00`).getTime() - Date.now()) / 3600_000;
  const isPaid = booking.paymentStatus === "paid";
  const willRefund = isPaid && hoursUntil >= 48;
  const noRefund = isPaid && hoursUntil < 48;
```

Add this between the appointment summary and the error block (after `CancelDialog.tsx:78`):

```tsx
      {willRefund && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          A 10.000 Ft foglalási díj a lemondás után visszatérítésre kerül.
        </div>
      )}
      {noRefund && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">
          Kedves Páciensünk! 48 órán belüli lemondás esetén a 10.000 Ft-os foglalási díj NEM
          kerül visszatérítésre. Amennyiben ennek tudatában is le kívánja mondani az időpontot,
          kérjük kattintson a gombra.
        </div>
      )}
```

- [ ] **Step 3: Send `confirmNoRefund` when inside the window**

In `handleConfirm`, change the request body (`CancelDialog.tsx:37`) to:

```typescript
        body: JSON.stringify({ token: booking.managementToken, confirmNoRefund: noRefund }),
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx biome check src/components/management/CancelDialog.tsx`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Open a paid booking's management page; with appointment >48h out the green refund notice shows;
with <48h out the red warning shows and confirming cancels without a refund.

- [ ] **Step 6: Commit**

```bash
git add src/components/management/CancelDialog.tsx
git commit -m "feat(ui): two-step refund-aware cancel dialog"
```

---

## Task 12: AdminCancelModal refund checkbox

**Files:**
- Modify: `src/components/admin/AdminCancelModal.tsx`

- [ ] **Step 1: Extend the onConfirm signature**

Change the prop type (`AdminCancelModal.tsx:12`):

```typescript
  onConfirm: (bookingId: string, reason?: string, refund?: boolean) => void;
```

- [ ] **Step 2: Add refund state + checkbox**

Add state next to `reason` (`AdminCancelModal.tsx:24`):

```typescript
  const [refund, setRefund] = useState(false);
```

Update `handleConfirm` (`AdminCancelModal.tsx:38-42`):

```typescript
  async function handleConfirm() {
    setIsSubmitting(true);
    await onConfirm(bookingId, reason.trim() || undefined, refund);
    setIsSubmitting(false);
  }
```

Add the checkbox inside the content `div`, just before the closing `</div>` of the reason block
(after `AdminCancelModal.tsx:190`):

```tsx
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "#242a5f",
            }}
          >
            <input
              type="checkbox"
              checked={refund}
              disabled={isSubmitting}
              onChange={(e) => setRefund(e.target.checked)}
            />
            Foglalási díj visszatérítése (−10.000 Ft jóváírás)
          </label>
```

- [ ] **Step 3: Pass `refund` through the caller to the API**

The caller is `src/components/admin/AdminDashboard.tsx` — `handleConfirmCancel` (lines 148-178)
is wired to the modal via `onConfirm={handleConfirmCancel}` (line 628). Update its signature and
request body:

```typescript
  async function handleConfirmCancel(bookingId: string, reason?: string, refund?: boolean) {
    try {
      const res = await fetch("/api/admin/booking-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason, refund }),
      });
      // ...rest of the existing function body unchanged...
```

(`AdminPatientModal.tsx` also POSTs to this endpoint without a `refund` field — leave it as is;
`refund` defaults to `false` server-side.)

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npx biome check src/components/admin/AdminCancelModal.tsx`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminCancelModal.tsx src/components/admin/AdminDashboard.tsx
git commit -m "feat(admin-ui): refund checkbox in cancel modal"
```

---

## Task 13: Environment variable

**Files:**
- Modify: `.env.local` (local, not committed)

- [ ] **Step 1: Add the key**

Add to `.env.local`:

```
SZAMLA_AGENT_KEY=<your Számlázz.hu Agent kulcs>
```

- [ ] **Step 2: Document it**

If a `.env.example` exists, add `SZAMLA_AGENT_KEY=` to it and commit. Otherwise note in the PR
description that `SZAMLA_AGENT_KEY` must be set on the server.

- [ ] **Step 3: Deploy reminder (no commit)**

⚠️ Per the deploy process: after `rsync --delete`, **re-copy `.env.local`** to the server so the
new key (and all secrets) survive. Confirm `SZAMLA_AGENT_KEY` is present on the server before the
first production refund.

---

## Task 14: Mission Control catalog entry (separate repo)

**Files:**
- Modify: `~/projects/mission/scripts/seed/modules-catalog.ts` (Mission Control, host 192.168.1.101)

- [ ] **Step 1: Add a catalog row**

Open the `mission` repo and add one entry to the modules catalog array, matching the existing
row shape in that file (read a neighbouring entry first), describing this capability, e.g.:

```typescript
  {
    project: "morocz",
    name: "Refund + helyesbítő számla",
    description:
      "≥48h lemondásnál Stripe visszatérítés + standalone −10.000 Ft AAM Számlázz.hu számla (Agent API).",
  },
```

(Use the exact field names the existing entries use — do not invent new ones.)

- [ ] **Step 2: Commit in the mission repo**

```bash
cd ~/projects/mission
git add scripts/seed/modules-catalog.ts
git commit -m "catalog: add morocz refund + credit-invoice module"
```

---

## Final verification

- [ ] Run the full test suite: `npm test` — all green.
- [ ] Typecheck: `npx tsc --noEmit` — clean.
- [ ] Lint: `npm run lint:biome` — clean.
- [ ] End-to-end (test mode, Stripe CLI listening): pay a booking >48h out → cancel → confirm a refund in Stripe and a `creditInvoiceNumber` on the booking in Sanity.
- [ ] Negative-amount confirmation (Task 4 note): verify the issued invoice in Számlázz.hu actually shows −10.000 Ft AAM; if rejected, switch to negative quantity and update Task 4's builder + test.
```
