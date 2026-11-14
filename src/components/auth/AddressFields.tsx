"use client";

import { TextField } from "@/components/ui/Field";

interface AddressFieldsProps {
  postalCode: string;
  city: string;
  streetAddress: string;
  onPostalCode: (v: string) => void;
  onCity: (v: string) => void;
  onStreet: (v: string) => void;
  idPrefix: string;
}

/** Billing address well (irányítószám / település / utca) used by the account forms. */
export function AddressFields({
  postalCode,
  city,
  streetAddress,
  onPostalCode,
  onCity,
  onStreet,
  idPrefix,
}: AddressFieldsProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 rounded-[28px] border-0 bg-field p-4 sm:p-5">
      <legend className="float-left mb-1 p-0 text-[13px] font-extrabold tracking-[.08em] text-muted uppercase">
        Számlázási cím
      </legend>
      <div className="clear-both grid grid-cols-6 gap-3.5">
        <TextField
          id={`${idPrefix}-postal`}
          label="Irányítószám"
          inputMode="numeric"
          maxLength={4}
          value={postalCode}
          onChange={(e) => onPostalCode(e.target.value.replace(/\D/g, ""))}
          autoComplete="postal-code"
          placeholder="Irsz."
          tone="white"
          className="col-span-6 sm:col-span-2"
        />
        <TextField
          id={`${idPrefix}-city`}
          label="Település"
          value={city}
          onChange={(e) => onCity(e.target.value)}
          autoComplete="address-level2"
          placeholder="Település"
          tone="white"
          className="col-span-6 sm:col-span-4"
        />
        <TextField
          id={`${idPrefix}-street`}
          label="Utca, házszám"
          value={streetAddress}
          onChange={(e) => onStreet(e.target.value)}
          autoComplete="street-address"
          placeholder="Utca, házszám"
          tone="white"
          className="col-span-6"
        />
      </div>
    </fieldset>
  );
}
