import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findCreditInvoiceByExternalId, issueCreditInvoice, SzamlazzError } from "./client";

const buyer = {
  name: "Teszt",
  zip: "2500",
  city: "Esztergom",
  address: "Fő u. 1.",
  email: "t@e.hu",
};

describe("issueCreditInvoice", () => {
  beforeEach(() => {
    process.env.SZAMLA_AGENT_KEY = "KEY";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SZAMLA_AGENT_KEY;
  });

  it("returns the invoice number on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<xmlszamlavalasz><sikeres>true</sikeres></xmlszamlavalasz>", {
        status: 200,
        headers: { szlahu_error_code: "0", szlahu_szamlaszam: "E-CR-2026-1" },
      }),
    );
    const result = await issueCreditInvoice({ amountHuf: 10_000, buyer, bookingId: "booking-1" });
    expect(result).toEqual({ invoiceNumber: "E-CR-2026-1" });
  });

  it("throws SzamlazzError on a non-zero error code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<xmlszamlavalasz><hibakod>3</hibakod></xmlszamlavalasz>", {
        status: 200,
        headers: { szlahu_error_code: "3", szlahu_error_message: "Hibás agent kulcs" },
      }),
    );
    await expect(
      issueCreditInvoice({ amountHuf: 10_000, buyer, bookingId: "booking-1" }),
    ).rejects.toBeInstanceOf(SzamlazzError);
  });

  it("surfaces the Számlázz message from the URL-encoded szlahu_error header", async () => {
    // Real Számlázz failures put the message in `szlahu_error` (form-urlencoded: + = space),
    // NOT `szlahu_error_message`. Without decoding it we logged a useless generic message.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("[ERR] ...", {
        status: 200,
        headers: { szlahu_error_code: "7", szlahu_error: "Hi%C3%A1nyz%C3%B3+adat%3A+elado+elem." },
      }),
    );
    const err = await issueCreditInvoice({
      amountHuf: 10_000,
      buyer,
      bookingId: "booking-1",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
    expect(err.message).toBe("Hiányzó adat: elado elem.");
    expect(err.code).toBe("7");
  });

  it("throws when SZAMLA_AGENT_KEY is missing", async () => {
    delete process.env.SZAMLA_AGENT_KEY;
    await expect(
      issueCreditInvoice({ amountHuf: 10_000, buyer, bookingId: "booking-1" }),
    ).rejects.toThrow(/SZAMLA_AGENT_KEY/);
  });

  it("throws SzamlazzError on an HTTP 500 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );
    const err = await issueCreditInvoice({
      amountHuf: 10_000,
      buyer,
      bookingId: "booking-1",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
    expect(err.message).toMatch(/HTTP 500/);
  });

  it("wraps a network failure as SzamlazzError", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const err = await issueCreditInvoice({
      amountHuf: 10_000,
      buyer,
      bookingId: "booking-1",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
  });
});

describe("findCreditInvoiceByExternalId", () => {
  beforeEach(() => {
    process.env.SZAMLA_AGENT_KEY = "KEY";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SZAMLA_AGENT_KEY;
  });

  // Response shapes below are copied from real Számlázz replies observed on 2026-07-14.
  const notFound = `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamlavalasz><sikeres>false</sikeres><hibakod><![CDATA[7]]></hibakod><hibauzenet><![CDATA[Hiányzó adat: számla xml (ismeretlen számlaszám, rendelésszám vagy külső azonosító).]]></hibauzenet></xmlszamlavalasz>`;

  it("returns the invoice number when one already exists for the external id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        `<xmlszamlavalasz><sikeres>true</sikeres><szamla><alap><szamlaszam>E-MRCZ-2026-9</szamlaszam></alap></szamla></xmlszamlavalasz>`,
        { status: 200 },
      ),
    );
    await expect(findCreditInvoiceByExternalId("refund-booking-1")).resolves.toEqual({
      invoiceNumber: "E-MRCZ-2026-9",
    });
  });

  it("returns null on Számlázz's explicit not-found (code 7)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(notFound, { status: 200 }));
    await expect(findCreditInvoiceByExternalId("refund-nope")).resolves.toBeNull();
  });

  it("THROWS (never returns null) on any other error — the caller must not read a failed lookup as 'no invoice exists'", async () => {
    // Returning null here would let the caller issue a duplicate credit invoice, which is
    // exactly the failure this lookup exists to prevent.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        `<xmlszamlavalasz><sikeres>false</sikeres><hibakod><![CDATA[3]]></hibakod><hibauzenet><![CDATA[Hibás agent kulcs]]></hibauzenet></xmlszamlavalasz>`,
        { status: 200 },
      ),
    );
    const err = await findCreditInvoiceByExternalId("refund-booking-1").catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
    expect(err.message).toBe("Hibás agent kulcs");
    expect(err.code).toBe("3");
  });

  it("throws on a network failure or timeout rather than reporting 'not found'", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    await expect(findCreditInvoiceByExternalId("refund-booking-1")).rejects.toBeInstanceOf(
      SzamlazzError,
    );
  });

  it("queries by szamlaKulsoAzon via the agent-xml action", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(notFound, { status: 200 }));
    await findCreditInvoiceByExternalId("refund-booking-1");
    const form = fetchSpy.mock.calls[0][1]?.body as FormData;
    const xml = await (form.get("action-szamla_agent_xml") as Blob).text();
    expect(xml).toContain("<szamlaKulsoAzon>refund-booking-1</szamlaKulsoAzon>");
    expect(xml).toContain("<szamlaagentkulcs>KEY</szamlaagentkulcs>");
  });
});
