import { describe, expect, it } from "vitest";
import { buildCreditInvoiceXml } from "./build-credit-invoice-xml";

const buyer = {
  name: "Teszt Páciens",
  zip: "2500",
  city: "Esztergom",
  address: "Fő utca 1.",
  email: "teszt@example.com",
};

describe("buildCreditInvoiceXml", () => {
  it("includes the agent key, AAM vat code and negative amounts", () => {
    const xml = buildCreditInvoiceXml({ agentKey: "AGENT-KEY", amountHuf: 10_000, buyer });
    expect(xml).toContain("<szamlaagentkulcs>AGENT-KEY</szamlaagentkulcs>");
    expect(xml).toContain("<penznem>HUF</penznem>");
    expect(xml).toContain("<afakulcs>AAM</afakulcs>");
    expect(xml).toContain("<nettoEgysegar>-10000</nettoEgysegar>");
    expect(xml).toContain("<nettoErtek>-10000</nettoErtek>");
    expect(xml).toContain("<afaErtek>0</afaErtek>");
    expect(xml).toContain("<bruttoErtek>-10000</bruttoErtek>");
    expect(xml).toContain("<mennyiseg>1</mennyiseg>");
  });

  it("escapes XML special characters in buyer fields and the agent key", () => {
    const xml = buildCreditInvoiceXml({
      agentKey: 'K&<"key',
      amountHuf: 10_000,
      buyer: { ...buyer, name: "Tom & <Co>", address: 'Fő "u" <1>' },
    });
    expect(xml).toContain("<nev>Tom &amp; &lt;Co&gt;</nev>");
    expect(xml).toContain("<cim>Fő &quot;u&quot; &lt;1&gt;</cim>");
    expect(xml).toContain("<szamlaagentkulcs>K&amp;&lt;&quot;key</szamlaagentkulcs>");
    expect(xml).not.toContain("Tom & <Co>");
    expect(xml).not.toContain('<1>');
  });

  it("omits the <elado> seller block (seller comes from account config)", () => {
    const xml = buildCreditInvoiceXml({ agentKey: "K", amountHuf: 10_000, buyer });
    expect(xml).not.toContain("<elado>");
  });
});
