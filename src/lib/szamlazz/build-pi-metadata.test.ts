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
