# Business invoice (céges számla) with tax number — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a patient opt into a business invoice at booking time, supply adószám + company details, and thread them to szamlabridge via `payment_intent_data.metadata` — without changing the working magánszemély path.

**Architecture:** Two pure, unit-tested helpers (`tax-number.ts`, `build-pi-metadata.ts`) encapsulate validation and the EV-vs-company buyer resolution. The checkout route uses them to attach PaymentIntent metadata *only* when a business invoice is requested, and persists the details to the Sanity booking. The booking form gains an opt-in block.

**Tech Stack:** Next.js (App Router) API routes, Zod, Stripe Checkout Sessions, Drizzle (better-auth `user` table), Sanity, React, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-26-business-invoice-tax-number-design.md`

---

## File Structure

- Create `src/lib/szamlazz/tax-number.ts` — Hungarian adószám validation/normalization (pure).
- Create `src/lib/szamlazz/tax-number.test.ts`.
- Create `src/lib/szamlazz/build-pi-metadata.ts` — `BusinessInvoiceSchema` (zod) + `buildBusinessInvoiceMetadata` (EV-vs-company resolution → szamlabridge metadata keys, pure).
- Create `src/lib/szamlazz/build-pi-metadata.test.ts`.
- Modify `src/app/api/checkout/route.ts` — extend `BookingSchema`, resolve business metadata early (400 on error), attach `payment_intent_data.metadata`, persist to booking.
- Modify `src/sanity/schemaTypes/bookingType.ts` — add `businessInvoice` fields.
- Modify `src/components/booking/Step4Confirm.tsx` — opt-in UI + send `businessInvoice` in the checkout request.

---

### Task 1: Hungarian tax-number helper

**Files:**
- Create: `src/lib/szamlazz/tax-number.ts`
- Test: `src/lib/szamlazz/tax-number.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/szamlazz/tax-number.test.ts
import { describe, expect, it } from "vitest";
import { formatTaxNumber, isValidHungarianTaxNumber, normalizeTaxNumber } from "./tax-number";

describe("tax-number", () => {
  it("accepts an 11-digit number with or without separators", () => {
    expect(isValidHungarianTaxNumber("12345678-1-23")).toBe(true);
    expect(isValidHungarianTaxNumber("12345678123")).toBe(true);
    expect(isValidHungarianTaxNumber(" 12345678 1 23 ")).toBe(true);
  });

  it("rejects anything that is not 11 digits", () => {
    expect(isValidHungarianTaxNumber("1234567-1-23")).toBe(false); // 10 digits
    expect(isValidHungarianTaxNumber("123456789012")).toBe(false); // 12 digits
    expect(isValidHungarianTaxNumber("abcdefgh-1-23")).toBe(false);
    expect(isValidHungarianTaxNumber("")).toBe(false);
  });

  it("normalizes to digits only", () => {
    expect(normalizeTaxNumber("12345678-1-23")).toBe("12345678123");
  });

  it("formats a valid number as XXXXXXXX-Y-ZZ", () => {
    expect(formatTaxNumber("12345678123")).toBe("12345678-1-23");
    expect(formatTaxNumber("12345678-1-23")).toBe("12345678-1-23");
  });

  it("throws when formatting an invalid number", () => {
    expect(() => formatTaxNumber("123")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/szamlazz/tax-number.test.ts`
Expected: FAIL — `Failed to resolve import "./tax-number"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/szamlazz/tax-number.ts

/** Strip spaces and dashes, leaving digits only. */
export function normalizeTaxNumber(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/** A Hungarian adószám is 11 digits: 8 (törzsszám) + 1 (ÁFA kód) + 2 (megyekód). */
export function isValidHungarianTaxNumber(input: string): boolean {
  return /^\d{11}$/.test(normalizeTaxNumber(input));
}

/** Format as XXXXXXXX-Y-ZZ. Throws if not a valid 11-digit number. */
export function formatTaxNumber(input: string): string {
  const d = normalizeTaxNumber(input);
  if (!/^\d{11}$/.test(d)) {
    throw new Error(`Invalid Hungarian tax number: ${input}`);
  }
  return `${d.slice(0, 8)}-${d.slice(8, 9)}-${d.slice(9, 11)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/szamlazz/tax-number.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/szamlazz/tax-number.ts src/lib/szamlazz/tax-number.test.ts
git commit -m "feat(szamlazz): add Hungarian tax-number validation helper"
```

---

### Task 2: Business-invoice metadata builder

**Files:**
- Create: `src/lib/szamlazz/build-pi-metadata.ts`
- Test: `src/lib/szamlazz/build-pi-metadata.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/szamlazz/build-pi-metadata.test.ts
import { describe, expect, it } from "vitest";
import { buildBusinessInvoiceMetadata, type PatientContext } from "./build-pi-metadata";

const ctx: PatientContext = {
  patientName: "Kató-Szabó Emese",
  patientEmail: "szab.emese@gmail.com",
  profileAddress: { zip: "2500", city: "Esztergom", address: "Babits Mihály út 9/a" },
};

describe("buildBusinessInvoiceMetadata", () => {
  it("EV/same: keeps patient name + profile address, only adds the tax number", () => {
    const r = buildBusinessInvoiceMetadata({ taxNumber: "12345678-1-23", sameAsPersonal: true }, ctx);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.metadata).toEqual({
      buyer_name: "Kató-Szabó Emese",
      tax_number: "12345678-1-23",
      country: "HU",
      zip: "2500",
      city: "Esztergom",
      address: "Babits Mihály út 9/a",
      email: "szab.emese@gmail.com",
    });
  });

  it("EV/same: errors when the profile address is incomplete", () => {
    const r = buildBusinessInvoiceMetadata(
      { taxNumber: "12345678-1-23", sameAsPersonal: true },
      { ...ctx, profileAddress: { zip: null, city: "Esztergom", address: null } },
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/cím/i);
  });

  it("company: issues to the company name + company address", () => {
    const r = buildBusinessInvoiceMetadata(
      {
        taxNumber: "12345678123",
        sameAsPersonal: false,
        companyName: "Példa Kft",
        companyZip: "1011",
        companyCity: "Budapest",
        companyAddress: "Fő utca 1.",
      },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.metadata.buyer_name).toBe("Példa Kft");
    expect(r.metadata.tax_number).toBe("12345678-1-23");
    expect(r.metadata.zip).toBe("1011");
    expect(r.metadata.city).toBe("Budapest");
    expect(r.metadata.address).toBe("Fő utca 1.");
    expect(r.metadata.email).toBe("szab.emese@gmail.com");
  });

  it("company: errors when company fields are missing", () => {
    const r = buildBusinessInvoiceMetadata(
      { taxNumber: "12345678-1-23", sameAsPersonal: false, companyName: "Példa Kft" },
      ctx,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/céges/i);
  });

  it("errors on an invalid tax number", () => {
    const r = buildBusinessInvoiceMetadata({ taxNumber: "123", sameAsPersonal: true }, ctx);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/adószám/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/szamlazz/build-pi-metadata.test.ts`
Expected: FAIL — `Failed to resolve import "./build-pi-metadata"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/szamlazz/build-pi-metadata.ts
import { z } from "zod";
import { formatTaxNumber, isValidHungarianTaxNumber } from "./tax-number";

/** Shape sent by the booking form when a business invoice is requested. */
export const BusinessInvoiceSchema = z.object({
  taxNumber: z.string().min(1),
  sameAsPersonal: z.boolean(),
  companyName: z.string().optional(),
  companyZip: z.string().optional(),
  companyCity: z.string().optional(),
  companyAddress: z.string().optional(),
});

export type BusinessInvoiceInput = z.infer<typeof BusinessInvoiceSchema>;

export interface PatientContext {
  patientName: string;
  patientEmail: string;
  profileAddress: { zip: string | null; city: string | null; address: string | null };
}

/**
 * szamlabridge reads invoice buyer data from PaymentIntent metadata. These are the
 * documented keys (see spec). Only the buyer block is sent; item fields fall back to
 * szamlabridge's existing mapping. If the pre-go-live test shows item keys are also
 * required, extend the returned object here — the data flow does not change.
 */
export type BusinessInvoiceMetadata = {
  buyer_name: string;
  tax_number: string;
  country: "HU";
  zip: string;
  city: string;
  address: string;
  email: string;
};

export type BuildResult =
  | { ok: true; metadata: BusinessInvoiceMetadata }
  | { ok: false; error: string };

export function buildBusinessInvoiceMetadata(
  input: BusinessInvoiceInput,
  ctx: PatientContext,
): BuildResult {
  if (!isValidHungarianTaxNumber(input.taxNumber)) {
    return { ok: false, error: "Érvénytelen adószám. A helyes formátum: 12345678-1-23." };
  }
  const tax_number = formatTaxNumber(input.taxNumber);

  let buyer_name: string;
  let zip: string;
  let city: string;
  let address: string;

  if (input.sameAsPersonal) {
    const a = ctx.profileAddress;
    if (!a.zip || !a.city || !a.address) {
      return {
        ok: false,
        error: "Hiányzó számlázási cím. Kérjük, töltse ki a címét a fiókja adatainál.",
      };
    }
    buyer_name = ctx.patientName;
    zip = a.zip;
    city = a.city;
    address = a.address;
  } else {
    if (!input.companyName || !input.companyZip || !input.companyCity || !input.companyAddress) {
      return {
        ok: false,
        error: "Hiányzó céges adatok. Kérjük, adja meg a cégnevet és a teljes címet.",
      };
    }
    buyer_name = input.companyName;
    zip = input.companyZip;
    city = input.companyCity;
    address = input.companyAddress;
  }

  return {
    ok: true,
    metadata: { buyer_name, tax_number, country: "HU", zip, city, address, email: ctx.patientEmail },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/szamlazz/build-pi-metadata.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/szamlazz/build-pi-metadata.ts src/lib/szamlazz/build-pi-metadata.test.ts
git commit -m "feat(szamlazz): add business-invoice PaymentIntent metadata builder"
```

---

### Task 3: Wire the checkout route

**Files:**
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Add imports**

At the top of `src/app/api/checkout/route.ts`, add to the existing imports:

```ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import {
  BusinessInvoiceSchema,
  buildBusinessInvoiceMetadata,
  type BusinessInvoiceMetadata,
} from "@/lib/szamlazz/build-pi-metadata";
```

- [ ] **Step 2: Extend the request schema**

In `src/app/api/checkout/route.ts`, change the `BookingSchema` definition (currently ends after `slotLockId: z.string().optional(),`) to add the optional business-invoice block:

```ts
const BookingSchema = z.object({
  serviceId: z.string().min(1, "Kérjük, válasszon szolgáltatást."),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
  patientName: z.string().min(2, "A név megadása kötelező."),
  patientEmail: z.string().email("Érvénytelen e-mail cím."),
  patientPhone: z.string().min(7, "Kérjük, adja meg telefonszámát."),
  slotLockId: z.string().optional(),
  businessInvoice: BusinessInvoiceSchema.optional(),
});
```

- [ ] **Step 3: Resolve business metadata BEFORE locking the slot**

In `src/app/api/checkout/route.ts`, the destructure currently reads:
`const { serviceId, slotDate, slotTime, patientName, patientEmail, patientPhone, slotLockId: providedSlotLockId } = parsed.data;`

Replace it with the version below, then immediately resolve the business invoice (so we reject bad input before creating a booking or locking a slot):

```ts
    const {
      serviceId,
      slotDate,
      slotTime,
      patientName,
      patientEmail,
      patientPhone,
      slotLockId: providedSlotLockId,
      businessInvoice,
    } = parsed.data;

    // Resolve a business invoice up front: a 400 here must not leave an orphan
    // booking/slot lock behind. piMetadata stays null for the ordinary
    // (magánszemély) path, which then sends exactly what it sends today.
    let piMetadata: BusinessInvoiceMetadata | null = null;
    if (businessInvoice) {
      const profile = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
        columns: { postalCode: true, city: true, streetAddress: true },
      });
      const built = buildBusinessInvoiceMetadata(businessInvoice, {
        patientName,
        patientEmail,
        profileAddress: {
          zip: profile?.postalCode ?? null,
          city: profile?.city ?? null,
          address: profile?.streetAddress ?? null,
        },
      });
      if (!built.ok) {
        return Response.json({ error: built.error }, { status: 400 });
      }
      piMetadata = built.metadata;
    }
```

- [ ] **Step 4: Persist business details on the booking**

In `src/app/api/checkout/route.ts`, the booking is created with `getWriteClient().create({ _type: "booking", ... createdAt: new Date().toISOString(), })`. Add the business fields to that object (right before `createdAt`):

```ts
      ...(piMetadata && {
        businessInvoiceRequested: true,
        businessTaxNumber: piMetadata.tax_number,
        businessBuyerName: piMetadata.buyer_name,
        businessBuyerZip: piMetadata.zip,
        businessBuyerCity: piMetadata.city,
        businessBuyerAddress: piMetadata.address,
      }),
```

- [ ] **Step 5: Attach the metadata to the PaymentIntent**

In `src/app/api/checkout/route.ts`, the `stripe.checkout.sessions.create({ ... })` call has `metadata: { ... }` (Session metadata) followed by `success_url`. Add `payment_intent_data` right after the closing `}` of that `metadata` object (only present for business invoices):

```ts
        ...(piMetadata && { payment_intent_data: { metadata: piMetadata } }),
```

- [ ] **Step 6: Verify types and the existing suite still pass**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: PASS — all existing tests plus Tasks 1–2 (33+ tests), none broken.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat(checkout): attach business-invoice metadata to the PaymentIntent"
```

---

### Task 4: Add Sanity booking fields

**Files:**
- Modify: `src/sanity/schemaTypes/bookingType.ts`

- [ ] **Step 1: Add the fields**

In `src/sanity/schemaTypes/bookingType.ts`, insert these `defineField` entries into the `fields` array immediately before the `createdAt` field (the one with `name: "createdAt"`):

```ts
    defineField({
      name: "businessInvoiceRequested",
      title: "Céges számlát kért",
      type: "boolean",
      description: "Igaz, ha a páciens céges számlát kért (adószámmal).",
      readOnly: true,
      initialValue: false,
    }),
    defineField({
      name: "businessTaxNumber",
      title: "Adószám",
      type: "string",
      description: "A céges számlához megadott adószám (12345678-1-23).",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerName",
      title: "Számlázási név (céges)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerZip",
      title: "Számlázási irányítószám (céges)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerCity",
      title: "Számlázási település (céges)",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "businessBuyerAddress",
      title: "Számlázási cím (céges)",
      type: "string",
      readOnly: true,
    }),
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/schemaTypes/bookingType.ts
git commit -m "feat(sanity): record business-invoice details on the booking"
```

---

### Task 5: Booking form opt-in UI

**Files:**
- Modify: `src/components/booking/Step4Confirm.tsx`

- [ ] **Step 1: Add business-invoice state**

In `src/components/booking/Step4Confirm.tsx`, after the existing `const [globalError, setGlobalError] = useState<string | null>(null);` line, add:

```tsx
  const [wantsBusinessInvoice, setWantsBusinessInvoice] = useState(false);
  const [taxNumber, setTaxNumber] = useState("");
  const [companySameAsPersonal, setCompanySameAsPersonal] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [companyZip, setCompanyZip] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
```

- [ ] **Step 2: Send the businessInvoice block in the checkout request**

In `src/components/booking/Step4Confirm.tsx`, the `fetch("/api/checkout", ...)` body currently spreads `...(selections.slotLockId && { slotLockId: selections.slotLockId }),`. Add right after it:

```tsx
          ...(wantsBusinessInvoice && {
            businessInvoice: {
              taxNumber,
              sameAsPersonal: companySameAsPersonal,
              ...(!companySameAsPersonal && {
                companyName,
                companyZip,
                companyCity,
                companyAddress,
              }),
            },
          }),
```

- [ ] **Step 3: Add the opt-in block to the form**

In `src/components/booking/Step4Confirm.tsx`, insert this block inside the `<form>` immediately before the `{/* Consent checkbox */}` comment:

```tsx
        {/* Business invoice opt-in */}
        <div className="rounded-xl border border-gray-200 p-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsBusinessInvoice}
              onChange={(e) => setWantsBusinessInvoice(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
            />
            <span className="text-sm font-medium text-gray-700">Céges számlát kérek</span>
          </label>

          {wantsBusinessInvoice && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="tax-number" className="block text-xs font-medium text-gray-700 mb-1">
                  Adószám
                </label>
                <input
                  id="tax-number"
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="12345678-1-23"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={companySameAsPersonal}
                  onChange={(e) => setCompanySameAsPersonal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/30"
                />
                <span className="text-xs text-gray-600">
                  A céges adatok megegyeznek a személyes adatokkal (pl. EV)
                </span>
              </label>

              {!companySameAsPersonal && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Cégnév"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={companyZip}
                      onChange={(e) => setCompanyZip(e.target.value)}
                      placeholder="Irsz."
                      className="w-28 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
                    />
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="Település"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Cím (utca, házszám)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500">
                A számla hibás adószám esetén nem állítható ki. A részletes ellenőrzést a
                fizetés indításakor végezzük.
              </p>
            </div>
          )}
        </div>
```

- [ ] **Step 4: Verify types and build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 5: Manual check (dev server)**

Run: `npm run dev`, open the booking flow to the confirm step. Verify: the "Céges számlát kérek" checkbox reveals the adószám field; unchecking "megegyeznek a személyes adatokkal" reveals cégnév + irsz/település/cím; a booking *without* the box ticked behaves exactly as before.

- [ ] **Step 6: Commit**

```bash
git add src/components/booking/Step4Confirm.tsx
git commit -m "feat(booking): opt-in business invoice fields on the confirm step"
```

---

### Task 6: Live szamlabridge verification (pre-go-live gate)

**Files:** none (operational verification — resolves the spec's Open question).

- [ ] **Step 1: Make one real test booking with a business invoice**

Using a real (low-value) booking on the deployed build, opt into a business invoice with the
EV/same option and a valid test adószám. Let it pay so a PaymentIntent with the metadata exists.

- [ ] **Step 2: Inspect szamlabridge before it issues**

In szamlabridge (connection `morocz-medical-foglalas`), open the transaction's **Részletek →
Adatellenőrzés**, and confirm the generated XML now contains `<adoszam>` populated with the
tax number and the buyer block as expected.

- [ ] **Step 3: Resolve the partial-vs-full metadata question**

- If the buyer block + tax number is correct and the invoice issues successfully → done; the
  buyer-only metadata set is sufficient.
- If szamlabridge reports missing item data (e.g. requires `vat`, `is_unit_price_gross`,
  `unit_price`, `label`, `unit`, `quantity`) → extend the returned object in
  `src/lib/szamlazz/build-pi-metadata.ts` (`BusinessInvoiceMetadata` + the `metadata` literal)
  to include those item keys (values matching the working magánszemély invoices: item label
  "Foglalási díj", quantity 1, unit "darab", unit_price 10000, the same `vat`/`afakulcs` the
  successful invoices use), update `build-pi-metadata.test.ts` accordingly, and re-run
  `npx vitest run`. No other file changes needed — the data flow is unchanged.

- [ ] **Step 4: Issue the test invoice (or test számla) and confirm the céges számla is correct**

Confirm the issued invoice shows the adószám and the correct buyer (company or patient per the
option chosen).

---

## Notes for the implementer

- **Do not** alter the non-business path: `payment_intent_data` and the booking's `businessInvoice*`
  fields must only ever be set when `businessInvoice` is present in the request.
- The `vat`/VAT treatment for the clinic is whatever the existing successful invoices use
  (szamlabridge currently builds `afakulcs=0`); only revisit it if Task 6 Step 3 forces item
  keys into the metadata.
- The Kató-Szabó Emese Számlázz partner record is a separate, operational cleanup (out of scope here).
