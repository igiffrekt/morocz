export interface CreditInvoiceBuyer {
  name: string;
  zip: string;
  city: string;
  address: string;
  email: string;
}

export interface BuildCreditInvoiceXmlInput {
  agentKey: string;
  amountHuf: number; // positive magnitude; rendered negative on the invoice
  buyer: CreditInvoiceBuyer;
  now?: Date;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildCreditInvoiceXml({
  agentKey,
  amountHuf,
  buyer,
  now,
}: BuildCreditInvoiceXmlInput): string {
  // Invoice date must be the Hungarian local date — toISOString() is UTC and would
  // be off by a day near midnight (Europe/Budapest is UTC+1/+2). sv-SE → YYYY-MM-DD.
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(
    now ?? new Date(),
  );
  const neg = -Math.abs(amountHuf);

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.szamlazz.hu/xmlszamla https://www.szamlazz.hu/szamla/docs/xsds/agent/xmlszamla.xsd">
  <beallitasok>
    <szamlaagentkulcs>${esc(agentKey)}</szamlaagentkulcs>
    <eszamla>true</eszamla>
    <szamlaLetoltes>false</szamlaLetoltes>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${today}</teljesitesDatum>
    <fizetesiHataridoDatum>${today}</fizetesiHataridoDatum>
    <fizmod>bankkártya</fizmod>
    <penznem>HUF</penznem>
    <szamlaNyelve>hu</szamlaNyelve>
    <megjegyzes>Foglalási díj visszatérítése</megjegyzes>
  </fejlec>
  <vevo>
    <nev>${esc(buyer.name)}</nev>
    <irsz>${esc(buyer.zip)}</irsz>
    <telepules>${esc(buyer.city)}</telepules>
    <cim>${esc(buyer.address)}</cim>
    <email>${esc(buyer.email)}</email>
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>Foglalási díj jóváírása</megnevezes>
      <mennyiseg>1</mennyiseg>
      <mennyisegiEgyseg>db</mennyisegiEgyseg>
      <nettoEgysegar>${neg}</nettoEgysegar>
      <afakulcs>AAM</afakulcs>
      <nettoErtek>${neg}</nettoErtek>
      <afaErtek>0</afaErtek>
      <bruttoErtek>${neg}</bruttoErtek>
    </tetel>
  </tetelek>
</xmlszamla>`;
}
