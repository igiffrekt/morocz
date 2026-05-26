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
