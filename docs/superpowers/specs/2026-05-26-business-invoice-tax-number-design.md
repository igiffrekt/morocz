# Business invoice (céges számla) with tax number — design

**Date:** 2026-05-26
**Status:** Approved design, pre-implementation

## Problem

Patients are billed a 10.000 Ft booking fee via Stripe Checkout. Invoices are issued
automatically by the third-party **szamlabridge.com** service (Stripe→Számlázz.hu bridge),
NOT by morocz. Today every invoice is a magánszemély (private individual) invoice, and that
flow works correctly for all patients.

Some patients need a **business invoice (céges számla)** with their **adószám** (tax number) —
e.g. an egyéni vállalkozó expensing the visit, or a company. The booking flow currently has
no way to collect a tax number, and szamlabridge therefore never receives one. When a buyer
already exists in Számlázz as an adóalany (from a pre-Stripe manual invoice), szamlabridge's
automated call fails with **code 332** ("vevő adószáma szükséges") because it sends no tax
number. (See the 2026-05-26 Kató-Szabó Emese incident.)

## Goal

Let a patient opt into a business invoice at booking time, supply the required company/tax
details, and have those flow through to szamlabridge so it issues a correct céges számla —
**without changing the working magánszemély path.**

## Key facts grounding this design

- **morocz checkout** (`src/app/api/checkout/route.ts`) creates a Stripe **Checkout Session**
  with `customer_email` + `billing_address_collection: "required"`, and puts its keys on the
  **Session** `metadata`. It does **not** set `payment_intent_data.metadata`, create a
  customer, collect a tax id, or set shipping.
- **szamlabridge** reads invoice/buyer data from **PaymentIntent metadata** (documented keys:
  `buyer_name`, `tax_number`, `identifier`, `country`, `zip`, `city`, `address`, `email`,
  `vat`, `is_unit_price_gross`, `unit_price`, `label`, `unit`, `quantity`, `comment`).
  Because morocz sets none of these on the PaymentIntent, szamlabridge falls back to its
  per-connection field mapping (`tax_number ← shipping`, buyer fields ← checkout billing).
  That fallback is what makes today's magánszemély invoices work.
- The logged-in patient's address is available server-side from the better-auth `user` table
  (`postal_code`, `city`, `street_address`) — the same source the refund flow uses.
- The booking form is `src/components/booking/BookingWizard.tsx` with confirm step
  `src/components/booking/Step4Confirm.tsx`. Checkout requires an authenticated session.

## Approach (chosen)

**Approach A — PaymentIntent metadata (vendor-documented path).** When a patient opts into a
business invoice, morocz writes szamlabridge's documented keys into
`payment_intent_data.metadata` on the Checkout Session. No szamlabridge configuration change.
This also closes the pre-existing Session-vs-PaymentIntent metadata gap.

Rejected alternatives: (B) retune szamlabridge's per-connection mapping + push via Stripe
billing/shipping — global per-connection effect, no native tax field in shipping, fragile;
(C) reception issues business invoices manually — zero build cost but ongoing manual effort
and error-prone.

## Form behavior

In the confirm step, an optional business-invoice block (default off):

- Checkbox **"Céges számlát kérek"**. Off → no change to today's flow.
- When on:
  - **Adószám** — always required. Validate Hungarian format (`8 digits`, optionally
    `12345678-1-23`).
  - Checkbox **"A céges adatok megegyeznek a személyes adatokkal (pl. EV)"**:
    - **Checked** → only adószám is needed. Invoice buyer = patient name + patient's saved
      profile address.
    - **Unchecked** → reveal required **cégnév**, **irányítószám**, **település**, **cím**.
      Invoice buyer = the company.

## Data flow

1. `Step4Confirm` (state held in `BookingWizard`) collects the fields when opted in;
   client-side validation mirrors the server.
2. `POST /api/checkout`: `BookingSchema` gains an optional `businessInvoice` object:
   `{ taxNumber, sameAsPersonal: boolean, companyName?, companyZip?, companyCity?, companyAddress? }`.
3. The checkout route resolves a buyer block:
   - **EV/same** → `buyer_name` = patientName; address from the logged-in user's profile
     (`postal_code/city/street_address`). If the profile address is incomplete → respond
     `400` with a clear "please complete your address" message (Stripe billing is not yet
     available at session-creation time, so the profile is the only source).
   - **Company** → `buyer_name` = companyName; address from the company fields.
   - Sets `payment_intent_data.metadata` with the szamlabridge keys: `tax_number`,
     `buyer_name`, `country: "HU"`, `zip`, `city`, `address`, `email` (+ the item keys
     `vat`, `is_unit_price_gross`, `unit_price`, `label`, `unit`, `quantity`, `comment` **if**
     the verification step shows the full set is required — see Open question).
   - **No `businessInvoice`** → the route sets no `payment_intent_data` → today's behavior,
     unchanged byte-for-byte.
   - Persists the requested business details onto the Sanity booking (audit + manual fallback).
4. Stripe PaymentIntent carries the metadata → szamlabridge issues a business invoice with the
   adószám → Számlázz.

## Components

- `src/components/booking/Step4Confirm.tsx` (+ `BookingWizard` state): opt-in block,
  conditional company fields, validation, sending `businessInvoice` to the checkout call.
- `src/app/api/checkout/route.ts`: extend `BookingSchema`; build `payment_intent_data.metadata`
  only when business invoice is requested; persist business details to the booking.
- `src/sanity/schemaTypes/bookingType.ts`: add `businessInvoice` fields (requested flag,
  taxNumber, sameAsPersonal, companyName, companyZip, companyCity, companyAddress).
- `src/lib/szamlazz/build-pi-metadata.ts` (new, pure/testable): maps resolved buyer inputs →
  szamlabridge metadata keys; encapsulates the EV-vs-company branching.
- `src/lib/szamlazz/tax-number.ts` (new, pure/testable): Hungarian adószám validation/normalization.

## Error handling

- Invalid adószám / incomplete EV-case profile address → `400` with a clear Hungarian message;
  client mirrors the validation so the user is told before submitting.
- Business metadata is attached **only** when the patient opts in, so the magánszemély path
  cannot regress.
- If szamlabridge still errors on a business invoice (e.g. malformed tax number), it surfaces
  as ERROR in szamlabridge as today; the stored business details on the booking let reception
  issue it manually and mark the row "Kézzel/máshol számlázva".

## Testing

- **Unit:** adószám validation (valid/invalid formats); PI-metadata builder (EV branch vs
  company branch, correct key mapping, country defaults).
- **Checkout route:** business request → `payment_intent_data.metadata` present and correct;
  non-business request → no `payment_intent_data`; incomplete EV address → `400`.
- **Live verification (pre-go-live):** issue a test business invoice and use szamlabridge's
  **Adatellenőrzés / Teszt számla kiállítás** to confirm the metadata produces a correct céges
  számla, and to resolve the Open question below.

## Open question (resolved by the verification step)

It is not yet confirmed whether szamlabridge accepts **partial** PaymentIntent metadata (just
`tax_number` + buyer fields, merging item fields from its existing mapping) or requires the
**full** documented key set when any metadata is present. The Adatellenőrzés/Teszt számla check
resolves this. The metadata builder is written so the key set can be expanded to the full set
without changing the data flow.

## Out of scope

- Storing a tax number permanently on the user profile (this design is opt-in per booking).
- Collecting tax numbers from all patients via Stripe `tax_id_collection`.
- Any change to szamlabridge's per-connection mapping.
- Backfilling/repairing the existing Kató-Szabó Emese Számlázz partner record (handled
  operationally, separately).
