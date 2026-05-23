import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { issueCreditInvoice, SzamlazzError } from "./client";

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
    await expect(issueCreditInvoice({ amountHuf: 10_000, buyer })).rejects.toBeInstanceOf(
      SzamlazzError,
    );
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
    const err = await issueCreditInvoice({ amountHuf: 10_000, buyer }).catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
    expect(err.message).toBe("Hiányzó adat: elado elem.");
    expect(err.code).toBe("7");
  });

  it("throws when SZAMLA_AGENT_KEY is missing", async () => {
    delete process.env.SZAMLA_AGENT_KEY;
    await expect(issueCreditInvoice({ amountHuf: 10_000, buyer })).rejects.toThrow(
      /SZAMLA_AGENT_KEY/,
    );
  });

  it("throws SzamlazzError on an HTTP 500 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );
    const err = await issueCreditInvoice({ amountHuf: 10_000, buyer }).catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
    expect(err.message).toMatch(/HTTP 500/);
  });

  it("wraps a network failure as SzamlazzError", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const err = await issueCreditInvoice({ amountHuf: 10_000, buyer }).catch((e) => e);
    expect(err).toBeInstanceOf(SzamlazzError);
  });
});
