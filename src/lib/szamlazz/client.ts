import { buildCreditInvoiceXml, type CreditInvoiceBuyer } from "./build-credit-invoice-xml";

const SZAMLAZZ_ENDPOINT = "https://www.szamlazz.hu/szamla/";
const REQUEST_TIMEOUT_MS = 15_000;

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
}

export async function issueCreditInvoice({
  amountHuf,
  buyer,
}: IssueCreditInvoiceInput): Promise<{ invoiceNumber: string }> {
  const agentKey = process.env.SZAMLA_AGENT_KEY;
  if (!agentKey) {
    throw new SzamlazzError("SZAMLA_AGENT_KEY is not configured", null);
  }

  const xml = buildCreditInvoiceXml({ agentKey, amountHuf, buyer });

  const form = new FormData();
  form.append(
    "action-xmlagentxmlfile",
    new Blob([xml], { type: "application/xml" }),
    "szamla.xml",
  );

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
