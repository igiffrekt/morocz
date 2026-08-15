import { describe, expect, it } from "vitest";
import {
  buildConfirmationEmail,
  buildInvoiceFailedEmail,
  buildInvoiceResolvedEmail,
  buildReceptionCancellationEmail,
} from "./booking-email";

// The patient name comes from the public booking form, the buyer name from the Stripe
// cardholder field — both are attacker-typed free text that ends up rendered as HTML in
// the recipient's mail client.
const PAYLOAD = `<img src=x onerror=alert(1)>"'&`;

function expectEscaped(html: string): void {
  expect(html).not.toContain("<img");
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;&quot;&#39;&amp;");
}

describe("booking email HTML escaping", () => {
  it("escapes the patient name in the confirmation email", () => {
    expectEscaped(
      buildConfirmationEmail({
        patientName: PAYLOAD,
        serviceName: "Konzultáció",
        reservationNumber: "M-TESZT1",
        date: "2026. augusztus 6.",
        time: "09:20",
        manageUrl: "https://drmoroczangela.hu/foglalas/t",
        clinicPhone: "+36 1 234 5678",
        clinicAddress: "Esztergom, Fő u. 1.",
      }),
    );
  });

  it("escapes the buyer (cardholder) name and patient name in the invoice-failed email", () => {
    const html = buildInvoiceFailedEmail({
      patientName: PAYLOAD,
      reservationNumber: "M-TESZT1",
      buyerName: `<script>alert(2)</script>`,
      paymentIntentId: "pi_1",
    });
    expectEscaped(html);
    expect(html).not.toContain("<script");
  });

  it("escapes the patient name in the invoice-resolved email", () => {
    expectEscaped(
      buildInvoiceResolvedEmail({
        patientName: PAYLOAD,
        reservationNumber: "M-TESZT1",
        invoiceNumber: "E-CR-1",
      }),
    );
  });

  it("escapes patient contact fields in the reception cancellation email", () => {
    const html = buildReceptionCancellationEmail({
      patientName: PAYLOAD,
      patientEmail: `"<b>x</b>"@example.com`,
      patientPhone: "<i>+36</i>",
      billingAddress: { postalCode: "2500", city: "<u>Esztergom</u>", streetAddress: "Fő u. 1." },
      serviceName: "Konzultáció",
      reservationNumber: "M-TESZT1",
      date: "2026. augusztus 6.",
      time: "09:20",
    });
    expectEscaped(html);
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<i>");
    expect(html).not.toContain("<u>");
  });
});
