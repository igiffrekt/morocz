import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/stripe", () => ({
  stripe: {},
  BOOKING_FEE_HUF: 10_000,
}));

import { type ProcessRefundDeps, processRefund } from "./process-refund";

function makeDeps(overrides: Partial<ProcessRefundDeps> = {}): ProcessRefundDeps {
  return {
    findBooking: vi.fn().mockResolvedValue({
      _id: "booking-1",
      patientName: "Teszt Páciens",
      patientEmail: "t@e.hu",
      reservationNumber: "M-TESZT1",
      refundStatus: null,
      creditInvoiceNumber: null,
    }),
    getBuyerAddress: vi
      .fn()
      .mockResolvedValue({ zip: "2500", city: "Esztergom", address: "Fő u. 1." }),
    issueCreditInvoice: vi.fn().mockResolvedValue({ invoiceNumber: "E-CR-1" }),
    patchBooking: vi.fn().mockResolvedValue(undefined),
    sendInvoiceFailedEmail: vi.fn().mockResolvedValue(undefined),
    sendInvoiceResolvedEmail: vi.fn().mockResolvedValue(undefined),
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
      buyer: {
        name: "Teszt Páciens",
        zip: "2500",
        city: "Esztergom",
        address: "Fő u. 1.",
        email: "t@e.hu",
      },
    });
    expect(deps.patchBooking).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        refundStatus: "refunded",
        stripeRefundId: "re_1",
        creditInvoiceNumber: "E-CR-1",
        creditInvoiceIssuedAt: expect.any(String),
      }),
    );
    expect(deps.sendInvoiceFailedEmail).not.toHaveBeenCalled();
  });

  it("is a no-op when the credit invoice was already issued (idempotent)", async () => {
    const deps = makeDeps({
      findBooking: vi.fn().mockResolvedValue({
        _id: "booking-1",
        patientName: "X",
        patientEmail: "t@e.hu",
        reservationNumber: "M-TESZT1",
        refundStatus: "refunded",
        creditInvoiceNumber: "E-CR-1",
      }),
    });
    await processRefund(charge, deps);
    expect(deps.issueCreditInvoice).not.toHaveBeenCalled();
    expect(deps.patchBooking).not.toHaveBeenCalled();
  });

  it("retries issuing the invoice after a prior failed attempt (no creditInvoiceNumber yet)", async () => {
    // Regression: a failed attempt records stripeRefundId but no invoice; the old refund-id
    // guard then blocked retries forever. The guard must key on creditInvoiceNumber instead.
    const deps = makeDeps({
      findBooking: vi.fn().mockResolvedValue({
        _id: "booking-1",
        patientName: "X",
        patientEmail: "t@e.hu",
        reservationNumber: "M-TESZT1",
        refundStatus: "invoice_failed",
        creditInvoiceNumber: null,
      }),
    });
    await processRefund(charge, deps);
    expect(deps.issueCreditInvoice).toHaveBeenCalledTimes(1);
  });

  it("retracts the manual-invoice request when a retry succeeds after invoice_failed", async () => {
    // Live incident 2026-07-14 (booking rMg6ouqZ…, invoice E-MRCZ-2026-10): attempt 1 failed and
    // emailed reception "issue it by hand"; Stripe's retry then issued the invoice, but nothing
    // withdrew the request — reception was one click away from a second credit invoice.
    const deps = makeDeps({
      findBooking: vi.fn().mockResolvedValue({
        _id: "booking-1",
        patientName: "Teszt Páciens",
        patientEmail: "t@e.hu",
        reservationNumber: "M-TESZT1",
        refundStatus: "invoice_failed",
        creditInvoiceNumber: null,
      }),
    });
    await processRefund(charge, deps);
    expect(deps.sendInvoiceResolvedEmail).toHaveBeenCalledWith({
      patientName: "Teszt Páciens",
      reservationNumber: "M-TESZT1",
      invoiceNumber: "E-CR-1",
    });
  });

  it("does not send a retraction when no prior attempt failed", async () => {
    const deps = makeDeps();
    await processRefund(charge, deps);
    expect(deps.sendInvoiceResolvedEmail).not.toHaveBeenCalled();
  });

  it("keeps the invoice when the retraction email fails (must not trigger a Stripe retry)", async () => {
    const deps = makeDeps({
      findBooking: vi.fn().mockResolvedValue({
        _id: "booking-1",
        patientName: "Teszt Páciens",
        patientEmail: "t@e.hu",
        reservationNumber: "M-TESZT1",
        refundStatus: "invoice_failed",
        creditInvoiceNumber: null,
      }),
      sendInvoiceResolvedEmail: vi.fn().mockRejectedValue(new Error("smtp down")),
    });
    await expect(processRefund(charge, deps)).resolves.toBeUndefined();
    expect(deps.patchBooking).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({ creditInvoiceNumber: "E-CR-1" }),
    );
    expect(deps.sendInvoiceFailedEmail).not.toHaveBeenCalled();
  });

  it("does nothing when no booking matches the payment intent", async () => {
    const deps = makeDeps({ findBooking: vi.fn().mockResolvedValue(null) });
    await processRefund(charge, deps);
    expect(deps.issueCreditInvoice).not.toHaveBeenCalled();
  });

  it("falls back to email + invoice_failed when issuing the invoice throws", async () => {
    const deps = makeDeps({
      issueCreditInvoice: vi.fn().mockImplementation(async () => {
        throw new Error("boom");
      }),
    });
    await processRefund(charge, deps);
    expect(deps.patchBooking).toHaveBeenCalledWith("booking-1", {
      refundStatus: "invoice_failed",
      stripeRefundId: "re_1",
    });
    expect(deps.sendInvoiceFailedEmail).toHaveBeenCalledWith({
      patientName: "Teszt Páciens",
      reservationNumber: "M-TESZT1",
      buyerName: "Teszt Páciens",
      paymentIntentId: "pi_1",
    });
  });

  it("tells reception the cardholder name when the payer is not the patient", async () => {
    // The payer is often a relative; without the cardholder name a Stripe/Számlázz search by
    // patient name finds nothing and the payment looks like it never happened.
    const deps = makeDeps({
      issueCreditInvoice: vi.fn().mockImplementation(async () => {
        throw new Error("boom");
      }),
    });
    await processRefund({ ...charge, billingName: "Fizető Rokon" }, deps);
    expect(deps.sendInvoiceFailedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ patientName: "Teszt Páciens", buyerName: "Fizető Rokon" }),
    );
  });

  it("still emails reception when the invoice_failed patch also fails", async () => {
    const deps = makeDeps({
      issueCreditInvoice: vi.fn().mockImplementation(async () => {
        throw new Error("boom");
      }),
      patchBooking: vi.fn().mockRejectedValue(new Error("sanity down")),
    });
    await processRefund(charge, deps);
    expect(deps.sendInvoiceFailedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ patientName: "Teszt Páciens" }),
    );
  });

  it("prefers Stripe billing address when the user record has none", async () => {
    const deps = makeDeps({ getBuyerAddress: vi.fn().mockResolvedValue(null) });
    const chargeWithAddr = {
      ...charge,
      billingAddress: { zip: "1011", city: "Budapest", address: "Vár u. 2." },
    };
    await processRefund(chargeWithAddr, deps);
    expect(deps.issueCreditInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        buyer: expect.objectContaining({ zip: "1011", city: "Budapest", address: "Vár u. 2." }),
      }),
    );
  });

  it("still issues the invoice (Stripe address fallback) when the address lookup throws", async () => {
    const deps = makeDeps({
      getBuyerAddress: vi.fn().mockRejectedValue(new Error("db down")),
    });
    const chargeWithAddr = {
      ...charge,
      billingAddress: { zip: "1011", city: "Budapest", address: "Vár u. 2." },
    };
    await processRefund(chargeWithAddr, deps);
    expect(deps.issueCreditInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        buyer: expect.objectContaining({ zip: "1011", city: "Budapest", address: "Vár u. 2." }),
      }),
    );
  });
});
