# Cancellation refund + offsetting −10.000 Ft invoice

**Date:** 2026-05-22
**Status:** Approved design — ready for implementation plan
**Project:** morocz (drmoroczangela.hu booking site)

## Summary

When a patient cancels a paid booking, refund the 10.000 Ft booking fee and issue a
standalone **−10.000 Ft Számlázz.hu invoice** that nets the original booking-fee invoice to
zero — but only when the cancellation happens **≥ 48 hours** before the appointment. Within
48 hours, the cancellation is allowed but no refund is given.

This replaces the previous hard block on cancellations within the policy window.

## Background / constraints

- szamlabridge auto-issues the original booking-fee invoice on each successful Stripe payment,
  but has **no refund→invoice automation**, so the offsetting invoice needs its own path.
- The accountant confirmed a **standalone −10.000 Ft invoice** (not a Számlázz.hu storno/
  corrective referencing the original) is sufficient. morocz does not have the original
  invoice number, so a standalone invoice is also the only practical option.
- Original booking-fee invoice VAT treatment = **AAM (alanyi adómentes)**. The −invoice must
  match: single line, net = gross = −10.000 Ft, VAT code AAM, qty 1.
- Buyer = the patient who paid. Stripe refunds always return to the original payment method,
  satisfying "same person / same bank account."
- Integration is **self-contained in the morocz repo** (no Mission Control dependency).

## Behaviour

| Actor | Timing | Result |
|-------|--------|--------|
| Patient | ≥ 48h before appt, paid | Cancel proceeds → Stripe refund → −10.000 Ft invoice |
| Patient | < 48h before appt, paid | Cancel proceeds (after explicit warning + confirm), **no refund** |
| Patient | unpaid booking | Cancel proceeds, nothing financial |
| Admin | any time | Cancel proceeds; refund (+ invoice) only if the admin ticks the refund checkbox and the booking is paid |
| Anyone | manual refund in Stripe dashboard | Refund webhook still issues the −10.000 Ft invoice |

All refund sources converge on the **Stripe refund webhook**, so the −invoice is issued exactly
once regardless of how the refund was initiated.

## Architecture

### Data flow

```
cancel route ─► resolveRefund() ─► (eligible) issueRefund()
                                          │
                                          ▼
                              Stripe `charge.refunded`
                                          │
                                          ▼
              webhook ─► find booking by stripePaymentIntentId
                       ─► idempotency guard on stripeRefundId
                       ─► issueCreditInvoice()  ──► store invoice #
                                          │ (on failure)
                                          ▼
                          mark invoice_failed + email reception
```

### Components (isolated, independently testable)

1. **`src/lib/refund/policy.ts`** — pure function
   `resolveRefund({ slotDate, slotTime, paymentStatus, confirmNoRefund, now })`
   → `{ eligible: boolean, requiresConfirmation: boolean, reason: string }`.
   Encodes the 48h rule and the paid/unpaid logic. No I/O. Unit-tested at the boundary.

2. **`src/lib/refund/issue-refund.ts`** —
   `issueRefund({ paymentIntentId, bookingId }): Promise<{ refundId: string }>`.
   Calls Stripe `refunds.create` with `idempotencyKey = bookingId` so retries never
   double-refund. Returns the Stripe refund id.

3. **`src/lib/szamlazz/client.ts`** —
   `issueCreditInvoice({ buyer, amountHuf }): Promise<{ invoiceNumber: string }>`.
   Builds the Számlázz.hu **Agent XML** request (single line item, qty 1, net = gross =
   `-amountHuf`, VAT code `AAM`), multipart-POSTs to `https://www.szamlazz.hu/szamla/` using
   `SZAMLA_AGENT_KEY`, parses the response for the invoice number or an error code. XML
   structure mirrors the existing Mission Control NAV module.
   - **Buyer fields:** name (patientName), zip/city/address from the better-auth `user` table.
   - **Open impl detail:** confirm Számlázz.hu accepts a negative net amount on a normal
     invoice; if not, use negative quantity. Resolve during the first integration test.

4. **Webhook** — extend `src/app/api/webhooks/stripe/route.ts` with a `charge.refunded` case:
   - Read `payment_intent` from the charge; find the booking via `stripePaymentIntentId`.
   - **Idempotency:** if the booking already has this `stripeRefundId` recorded, no-op.
   - Resolve buyer address from the better-auth `user` table by `patientEmail`
     (`postalCode`, `city`, `streetAddress`) — the same lookup the reception cancellation
     email already performs (`src/app/api/booking-cancel/route.ts:226`). Fall back to the
     Stripe charge `billing_details` if the user row has no address.
   - Call `issueCreditInvoice`. On success persist `creditInvoiceNumber`,
     `creditInvoiceIssuedAt`, `stripeRefundId`, `refundStatus = "refunded"`.
   - On failure persist `refundStatus = "invoice_failed"` + `stripeRefundId`, and email
     reception (see Error handling).

### Sanity schema — new fields on `bookingType.ts`

- `refundStatus`: `"none" | "refunded" | "no_refund" | "invoice_failed"` (default `"none"`)
- `stripeRefundId`: string (readonly)
- `creditInvoiceNumber`: string (readonly)
- `creditInvoiceIssuedAt`: datetime (readonly)

Regenerate Sanity TypeScript types after the schema change.

### Route changes

- **`src/app/api/booking-cancel/route.ts`** (patient self-service):
  - Replace the 24h check with **48h**; the helper becomes `isWithinPolicyWindow` (48h).
  - **Remove the hard block** (current lines 76-84). Cancellation always proceeds.
  - Add `confirmNoRefund: boolean` to the request schema.
  - Fetch `paymentStatus` + `stripePaymentIntentId` on the booking.
  - If paid and `resolveRefund` is `eligible` → `issueRefund()` and set `refundStatus`.
  - If paid and `requiresConfirmation` and `confirmNoRefund !== true` → return 409 prompting
    the UI to show the warning + confirm.
  - If paid, `requiresConfirmation`, and `confirmNoRefund === true` → cancel proceeds with no
    refund; set `refundStatus = "no_refund"`.
  - The −invoice is NOT issued here; it is issued by the webhook.

- **`src/app/api/admin/booking-cancel/route.ts`** (admin):
  - Add optional `refund: boolean` to the schema.
  - If `refund === true` and the booking is paid → `issueRefund()`. No 48h restriction.

### UI changes

- **`src/components/management/CancelDialog.tsx`** — two-step:
  - Needs `paymentStatus` (and the fee) in props.
  - ≥ 48h + paid: show a refund notice ("A 10.000 Ft foglalási díj visszatérítésre kerül").
  - < 48h + paid: show the red warning and, on confirm, send `confirmNoRefund: true`:
    > "Kedves Páciensünk! 48 órán belüli lemondás esetén a 10.000 Ft-os foglalási díj NEM
    > kerül visszatérítésre. Amennyiben ennek tudatában is le kívánja mondani az időpontot,
    > kérjük kattintson a gombra."

- **`src/components/admin/AdminCancelModal.tsx`** — add a
  "Foglalási díj visszatérítése (−10.000 Ft jóváírás)" checkbox; pass its value through
  `onConfirm` to the admin route.

## Error handling

Refund and invoice are decoupled. If `issueCreditInvoice` fails after a successful refund:

- The refund stands (money already returned to the patient).
- Persist `refundStatus = "invoice_failed"`.
- Email `recepcio@drmoroczangela.hu`:
  - **Subject:** `A helyesbítő számla kiállítása meghiúsult`
  - **Body:** `Tisztelt Recepció, X páciens részére visszatérítettük a 10.000 Ft-os foglalási
    díjat, azonban az erről szóló helyesbítő számla rendszerhiba miatt meghiúsult. Kérjük,
    állítsa ki manuálisan a számlát a Számlázz.hu rendszerében.` (X = patient name)

The webhook handler is idempotent and safe to retry.

## Environment / deployment

- Add `SZAMLA_AGENT_KEY` to `.env.local`.
- ⚠️ Deploy process: after `rsync --delete`, **re-copy `.env.local`** to the server (it is
  excluded by the delete and must be restored).

## Testing

- **Unit:** `resolveRefund` — 48h boundary (just over / just under), paid vs unpaid,
  `confirmNoRefund` handling.
- **Unit:** Számlázz.hu Agent XML builder — correct AAM code, −10.000 amount, buyer fields,
  qty 1.
- **Unit:** `issueRefund` idempotency key = booking id (mocked Stripe).
- **Integration:** refund webhook handler with mocked szamlazz client + Sanity write client —
  success path stores invoice number; failure path sets `invoice_failed` and triggers the
  reception email; duplicate refund event is a no-op.

## Cross-repo deliverable

Add a **catalog-entry-only** row for this capability in the Mission Control repo
(`mission` → `scripts/seed/modules-catalog.ts`). Mission Control now runs on
**192.168.1.101** (the old 192.168.1.29 host was decommissioned). No functional code in
that repo — registry entry only.

## Out of scope

- A true Számlázz.hu storno/corrective invoice referencing the original invoice number.
- Obtaining the original invoice number from szamlabridge.
- Partial refunds (always full 10.000 Ft).
