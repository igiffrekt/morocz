import { buildCreditInvoiceXml, type CreditInvoiceBuyer } from "./build-credit-invoice-xml";

const SZAMLAZZ_ENDPOINT = "https://www.szamlazz.hu/szamla/";
const REQUEST_TIMEOUT_MS = 15_000;

/** Számlázz query error code for "no invoice with that number / order no. / external id". */
const NOT_FOUND_CODE = "7";

export class SzamlazzError extends Error {
  constructor(
    message: string,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "SzamlazzError";
  }
}

export interface IssueCreditInvoiceInput {
  amountHuf: number;
  buyer: CreditInvoiceBuyer;
  bookingId: string;
  reservationNumber?: string | null;
}

/**
 * Looks up an already-issued credit invoice by its szamlaKulsoAzon.
 *
 * This is what makes a retry safe. Számlázz can create the invoice and still leave us with
 * no answer — a slow response trips our 15s timeout — so "the call threw" does NOT mean
 * "no invoice exists". Asking first is the only way to tell the two apart.
 *
 * Returns null ONLY on Számlázz's explicit not-found (code 7). Every other failure throws:
 * the caller must not issue an invoice it cannot prove is absent.
 */
export async function findCreditInvoiceByExternalId(
  externalId: string,
): Promise<{ invoiceNumber: string } | null> {
  const agentKey = process.env.SZAMLA_AGENT_KEY;
  if (!agentKey) {
    throw new SzamlazzError("SZAMLA_AGENT_KEY is not configured", null);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamlaxml xmlns="http://www.szamlazz.hu/xmlszamlaxml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/xmlszamlaxml https://www.szamlazz.hu/szamla/docs/xsds/agentxml/xmlszamlaxml.xsd">
  <szamlaagentkulcs>${agentKey}</szamlaagentkulcs>
  <szamlaKulsoAzon>${externalId}</szamlaKulsoAzon>
  <pdf>false</pdf>
</xmlszamlaxml>`;

  const form = new FormData();
  form.append("action-szamla_agent_xml", new Blob([xml], { type: "application/xml" }), "q.xml");

  let res: Response;
  try {
    res = await fetch(SZAMLAZZ_ENDPOINT, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new SzamlazzError(
      err instanceof Error ? err.message : "Network error contacting Számlázz.hu",
      null,
    );
  }

  const body = await res.text();
  const code = body.match(/<hibakod><!\[CDATA\[(.*?)\]\]><\/hibakod>/)?.[1] ?? null;

  if (code === NOT_FOUND_CODE) return null;

  if (!res.ok || code) {
    const message =
      body.match(/<hibauzenet><!\[CDATA\[(.*?)\]\]><\/hibauzenet>/)?.[1] ??
      `Számlázz.hu query failed (HTTP ${res.status})`;
    throw new SzamlazzError(message, code);
  }

  const invoiceNumber = body.match(/<szamlaszam>(.*?)<\/szamlaszam>/)?.[1];
  if (!invoiceNumber) {
    throw new SzamlazzError("Számlázz.hu query returned no invoice number", null);
  }
  return { invoiceNumber };
}

export async function issueCreditInvoice({
  amountHuf,
  buyer,
  bookingId,
  reservationNumber,
}: IssueCreditInvoiceInput): Promise<{ invoiceNumber: string }> {
  const agentKey = process.env.SZAMLA_AGENT_KEY;
  if (!agentKey) {
    throw new SzamlazzError("SZAMLA_AGENT_KEY is not configured", null);
  }

  const xml = buildCreditInvoiceXml({ agentKey, amountHuf, buyer, bookingId, reservationNumber });

  const form = new FormData();
  form.append("action-xmlagentxmlfile", new Blob([xml], { type: "application/xml" }), "szamla.xml");

  // Wrap fetch so network failures and timeouts surface as SzamlazzError, and bound the
  // call so a hung response can't exhaust the serverless webhook's execution window.
  let res: Response;
  try {
    res = await fetch(SZAMLAZZ_ENDPOINT, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new SzamlazzError(
      err instanceof Error ? err.message : "Network error contacting Számlázz.hu",
      null,
    );
  }

  const errorCode = res.headers.get("szlahu_error_code");
  const invoiceNumber = res.headers.get("szlahu_szamlaszam");

  if (!res.ok || (errorCode && errorCode !== "0") || !invoiceNumber) {
    // Számlázz returns the real message in the `szlahu_error` header, form-urlencoded
    // (so `+` means space). `szlahu_error_message` does not exist — reading it left us with
    // a useless "(HTTP 200)" that hid e.g. "Hiányzó adat: elado elem".
    const rawError = res.headers.get("szlahu_error");
    const message = rawError
      ? decodeURIComponent(rawError.replace(/\+/g, " "))
      : `Számlázz.hu request failed (HTTP ${res.status})`;
    throw new SzamlazzError(message, errorCode);
  }

  return { invoiceNumber };
}
