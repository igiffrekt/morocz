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
      stripeRefundId: null,
    }),
    getBuyerAddress: vi
      .fn()
      .mockResolvedValue({ zip: "2500", city: "Esztergom", address: "Fő u. 1." }),
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

  it("is a no-op when the refund id is already recorded (idempotent)", async () => {
    const deps = makeDeps({
      findBooking: vi.fn().mockResolvedValue({
        _id: "booking-1",
        patientName: "X",
        patientEmail: "t@e.hu",
        stripeRefundId: "re_1",
      }),
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
    expect(deps.sendInvoiceFailedEmail).toHaveBeenCalledWith({ patientName: "Teszt Páciens" });
  });

  it("still emails reception when the invoice_failed patch also fails", async () => {
    const deps = makeDeps({
      issueCreditInvoice: vi.fn().mockImplementation(async () => {
        throw new Error("boom");
      }),
      patchBooking: vi.fn().mockRejectedValue(new Error("sanity down")),
    });
    await processRefund(charge, deps);
    expect(deps.sendInvoiceFailedEmail).toHaveBeenCalledWith({ patientName: "Teszt Páciens" });
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
});
